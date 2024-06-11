use std::str::FromStr;

use shopify_function::prelude::*;
use shopify_function::Result;

use hex;
use hmac::NewMac;
use hmac::{Hmac, Mac};
use serde::{Deserialize};
use sha2::Sha256;

use output::FunctionError;

// #[cfg(feature = "dev")]
const SECRET_KEY: &str = "gqIjvMryDG8pGDeSUb0dIhoBde6BkOaM0Qxbuhze3jk=";
#[cfg(feature = "dev")]
generate_types!(
    query_path = "src/run.development.graphql",
    schema_path = "./schema.graphql"
);

#[cfg(feature = "staging")]
generate_types!(
    query_path = "src/run.staging.graphql",
    schema_path = "./schema.graphql"
);

#[cfg(feature = "prod")]
generate_types!(
    query_path = "src/run.graphql",
    schema_path = "./schema.graphql"
);

const CART_TARGET: &str = "cart";

#[derive(Clone, Debug, Deserialize)]
pub struct GateContextItem {
    pub id: Option<ID>,
    pub hmac: Option<String>,
}

#[derive(Deserialize)]
struct ShopifyGateContext {
    vaults: Vec<GateContextItem>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct GateReaction {
    pub reaction: String,
    pub order_limit: StringNumberOrNumber,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(untagged)]
pub enum StringNumberOrNumber {
    StringNumber(String),
    Number(i64),
}

impl TryInto<i64> for StringNumberOrNumber {
    type Error = <i64 as FromStr>::Err;

    fn try_into(self) -> std::result::Result<i64, Self::Error> {
        match self {
            Self::Number(v) => Ok(v),
            Self::StringNumber(str) => str.parse(),
        }
    }
}

impl ToString for StringNumberOrNumber {
    fn to_string(&self) -> String {
        match self {
            Self::Number(v) => v.to_string(),
            Self::StringNumber(str) => str.clone(),
        }
    }
}

#[shopify_function]
fn run(input: input::ResponseData) -> Result<output::FunctionResult> {
    let locale = input.localization.language.iso_code.as_str();
    let cart_lines = &input.cart.lines;
    let gate_context = parse_gate_context_from_cart_attribute(&input.cart.attribute);
    let mut errors = Vec::new();

    for product_variant in cart_lines.iter().filter_map(|line| match &line.merchandise {
        input::InputCartLinesMerchandise::ProductVariant(variant) => Some(variant),
        _ => None,
    }) {
        if product_variant.product.gates.is_empty() {
            continue;
        }

        for gate_subject in &product_variant.product.gates {
            let gate_configuration = &gate_subject.configuration;
            let gate_context_item = gate_context.iter().find(|ctx_item| ctx_item.id.as_ref() == Some(&gate_configuration.id.to_string()));

            let gate_unlocked = gate_context_item.map_or(false, |ctx| is_signature_valid(ctx, gate_configuration));

            let gate_reaction = GateReaction {
                reaction: parse_reaction(&gate_configuration.reaction),
                order_limit: parse_order_limit(&gate_configuration.order_limit),
            };

            if !gate_unlocked {
                errors.push(FunctionError {
                    localized_message: "You don't have access to this product.".to_owned(),
                    target: CART_TARGET.to_owned(),
                });
                continue;
            }

            if let Some(line) = cart_lines.iter().find(|line| matches!(&line.merchandise, input::InputCartLinesMerchandise::ProductVariant(variant) if variant.id == product_variant.id)) {
                let purchase_limit: i64 = gate_reaction.order_limit.try_into().expect("Failed to convert purchase limit to i64");
                if line.quantity > purchase_limit {
                    errors.push(FunctionError {
                        localized_message: format!("You can only order up to {} with your account!", purchase_limit),
                        target: CART_TARGET.to_owned(),
                    });
                }
            }
        }
    }

    Ok(output::FunctionResult { errors })
}

fn parse_gate_context_from_cart_attribute(attribute: &Option<input::InputCartAttribute>) -> Vec<GateContextItem> {
    attribute.as_ref().and_then(|a| a.value.as_ref()).map_or_else(Vec::new, |value| {
        serde_json::from_str::<ShopifyGateContext>(value)
            .map(|context| context.vaults)
            .unwrap_or_default()
    })
}

fn parse_reaction(reaction: &Option<input::InputCartLinesMerchandiseOnProductVariantProductGatesConfigurationReaction>) -> String {
    reaction.as_ref().map_or_else(String::new, |r| r.value.clone())
}

fn parse_order_limit(order_limit: &Option<input::InputCartLinesMerchandiseOnProductVariantProductGatesConfigurationOrderLimit>) -> StringNumberOrNumber {
    order_limit.as_ref().map_or_else(|| StringNumberOrNumber::Number(0), |m| {
        m.value.parse::<i64>()
            .map(StringNumberOrNumber::Number)
            .unwrap_or_else(|_| StringNumberOrNumber::StringNumber(m.value.clone()))
    })
}

fn is_signature_valid(gate_context_item: &GateContextItem, gate_configuration: &input::InputCartLinesMerchandiseOnProductVariantProductGatesConfiguration) -> bool {
    if let Some(hmac) = &gate_context_item.hmac {
        let message = &gate_configuration.id;
        let signature = hmac_signature(&SECRET_KEY, message);
        signature == *hmac
    } else {
        false
    }
}

fn hmac_signature(key: &str, msg: &str) -> String {
    let mut mac = Hmac::<Sha256>::new_from_slice(key.as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(msg.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

#[cfg(test)]
mod tests;