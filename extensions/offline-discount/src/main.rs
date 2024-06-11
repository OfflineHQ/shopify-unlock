// use lazy_static::lazy_static;
// use std::env::var;
use std::str::FromStr;
use rust_decimal::Decimal;

use shopify_function::prelude::*;
use shopify_function::Result;

use hex;
use hmac::{Hmac, Mac, NewMac};
use serde::{Deserialize};
use sha2::Sha256;

const SECRET_KEY: &str = "gqIjvMryDG8pGDeSUb0dIhoBde6BkOaM0Qxbuhze3jk=";

// lazy_static! {
//     static ref SECRET_KEY: String = {
//         let key = var("OFFLINE_GATES_SHOPIFY_SECRET").expect("OFFLINE_GATES_SHOPIFY_SECRET must be set");
//         key
//     };
// }
generate_types!(
    query_path = "src/run.graphql",
    schema_path = "./schema.graphql"
);

#[derive(Clone, Debug, Deserialize)]
pub struct GateContextItem {
    pub id: Option<ID>,
    pub hmac: Option<String>,
}

#[derive(Deserialize)]
struct ShopifyGateContext {
    vaults: Vec<GateContextItem>,
}

#[derive(Clone, Debug, Deserialize, Default)]
pub struct GateReaction {
    pub name: String,
    pub discount: Discount,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum Discount {
    Percentage { value: StringNumberOrNumber },
    Amount { value: StringNumberOrNumber },
}

impl Default for Discount {
    fn default() -> Self {
        Discount::Percentage {
            value: StringNumberOrNumber::Number(0.0),
        }
    }
}

#[derive(Clone, Debug, Deserialize)]
#[serde(untagged)]
pub enum StringNumberOrNumber {
    StringNumber(String),
    Number(f64),
}

impl TryInto<f64> for StringNumberOrNumber {
    type Error = <f64 as FromStr>::Err;

    fn try_into(self) -> std::result::Result<f64, Self::Error> {
        match self {
            StringNumberOrNumber::Number(v) => Ok(v),
            StringNumberOrNumber::StringNumber(str) => str.parse(),
        }
    }
}

impl ToString for StringNumberOrNumber {
    fn to_string(&self) -> String {
        match self {
            StringNumberOrNumber::Number(v) => v.to_string(),
            StringNumberOrNumber::StringNumber(str) => str.clone(),
        }
    }
}

const NO_DISCOUNT: output::FunctionResult = output::FunctionResult {
    discounts: vec![],
    discount_application_strategy: output::DiscountApplicationStrategy::MAXIMUM,
};

#[shopify_function]
fn run(input: input::ResponseData) -> Result<output::FunctionResult> {
    let locale = input.localization.language.iso_code.as_str();
    let cart_lines = input.cart.lines;
    let gate_context = parse_gate_context_from_cart_attribute(&input.cart.attribute);
    let discount_gate_configuration_id = input
        .discount_node
        .metafield
        .map_or_else(|| "".to_string(), |m| m.value);

    if cart_lines.is_empty() || gate_context.is_empty() {
        return Ok(NO_DISCOUNT);
    }

    let mut targets = Vec::new();
    let mut gate_reaction = GateReaction::default();

    cart_lines
        .iter()
        .filter_map(|line| match &line.merchandise {
            input::InputCartLinesMerchandise::ProductVariant(variant) => Some(variant),
            _ => None,
        })
        .for_each(|product_variant| {
            product_variant
                .product
                .gates
                .iter()
                .for_each(|gate_subject| {
                    if let Some(gate_context_item) = gate_context
                        .iter()
                        .find(|ctx| ctx.id == Some(gate_subject.configuration.id.to_string()))
                    {
                        if is_signature_valid(gate_context_item, &gate_subject.configuration)
                            && gate_subject.configuration.id == discount_gate_configuration_id
                        {
                            gate_reaction = parse_gate_reaction_from_metafield(
                                gate_subject.configuration.metafield.as_ref(),
                            );
                            targets.push(output::Target::ProductVariant(
                                output::ProductVariantTarget {
                                    id: product_variant.id.to_string(),
                                    quantity: None,
                                },
                            ));
                        }
                    }
                });
        });

    if targets.is_empty() {
        return Ok(NO_DISCOUNT);
    }

    let value = reaction_value(&gate_reaction);
    let message = Some(gate_reaction.name);

    Ok(output::FunctionResult {
        discounts: vec![output::Discount {
            message,
            targets,
            value,
        }],
        discount_application_strategy: output::DiscountApplicationStrategy::MAXIMUM,
    })
}

fn parse_gate_context_from_cart_attribute(
    attribute: &Option<input::InputCartAttribute>,
) -> Vec<GateContextItem> {
    attribute
        .as_ref()
        .and_then(|a| a.value.as_ref())
        .map_or_else(Vec::new, |value| {
            serde_json::from_str::<ShopifyGateContext>(value)
                .map(|context| context.vaults)
                .unwrap_or_default()
        })
}

fn parse_gate_reaction_from_metafield(
    metafield: Option<
        &input::InputCartLinesMerchandiseOnProductVariantProductGatesConfigurationMetafield,
    >,
) -> GateReaction {
    metafield.map_or_else(GateReaction::default, |metafield| {
        serde_json::from_str(&metafield.value).unwrap_or_default()
    })
}

fn is_signature_valid(
    gate_context_item: &GateContextItem,
    gate_configuration: &input::InputCartLinesMerchandiseOnProductVariantProductGatesConfiguration,
) -> bool {

    let hmac = match &gate_context_item.hmac {
        Some(hmac) => hmac,
        None => return false,
    };

    let message = &gate_configuration.id;
    let signature = hmac_signature(&SECRET_KEY, message);

    signature == *hmac
}

fn hmac_signature(key: &str, msg: &str) -> String {
    type HmacSha256 = Hmac<Sha256>;

    let mut mac =
        HmacSha256::new_from_slice(key.as_bytes()).expect("HMAC can take key of any size");
    mac.update(msg.as_bytes());
    let code_bytes = mac.finalize().into_bytes();

    hex::encode(&code_bytes)
}

fn reaction_value(reaction: &GateReaction) -> output::Value {
    match &reaction.discount {
        Discount::Percentage { value } => {
            let decimal_value = Decimal::from_str(&value.to_string()).expect("Invalid decimal string");
            output::Value::Percentage(output::Percentage {
                value: decimal_value,
            })
        },
        Discount::Amount { value } => {
            let decimal_value = Decimal::from_str(&value.to_string()).expect("Invalid decimal string");
            output::Value::FixedAmount(output::FixedAmount {
                applies_to_each_item: None,
                amount: decimal_value,
            })
        },
    }
}

#[cfg(test)]
mod tests;
