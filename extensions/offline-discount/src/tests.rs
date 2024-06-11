use super::*;
use shopify_function::Result;
use std::env;

// Setup function to set the environment variable before running tests
fn setup() {
    env::set_var("OFFLINE_GATES_SHOPIFY_SECRET", "secret-key");
}

fn input(
    gate_context_input: Option<input::InputCartAttribute>,
    gate_configuration_id: Option<input::InputDiscountNodeMetafield>,
) -> input::ResponseData {
    let default_input = r#"
    {
        "cart": {
            "attribute": {
                "value": ""
            },
            "lines": [
                {
                    "quantity": 1,
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/1",
                        "product": {
                            "id": "gid://shopify/Product/1",
                            "gates": [
                                {
                                    "id": "gid://shopify/GateSubject/1",
                                    "configuration": {
                                        "id": "gid://shopify/GateConfiguration/1",
                                        "handle": "tokengating-example-app",
                                        "metafield": {
                                            "value": "{\"name\":\"Christmas discount\",\"type\":\"discount\",\"discount\":{\"type\":\"percentage\",\"value\": 25}}"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "quantity": 1,
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/2",
                        "product": {
                            "id": "gid://shopify/Product/2",
                            "gates": [
                                {
                                    "id": "gid://shopify/GateSubject/2",
                                    "configuration": {
                                        "id": "gid://shopify/GateConfiguration/2",
                                        "handle": "tokengating-example-app",
                                        "metafield": {
                                            "value": "{\"name\":\"New Year discount\",\"type\":\"discount\",\"discount\":{\"type\":\"amount\",\"value\": \"10\"}}"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "quantity": 1,
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/3",
                        "product": {
                            "id": "gid://shopify/Product/3",
                            "gates": [
                                {
                                    "id": "gid://shopify/GateSubject/3",
                                    "configuration": {
                                        "id": "gid://shopify/GateConfiguration/2",
                                        "handle": "tokengating-example-app",
                                        "metafield": {
                                            "value": "{\"name\":\"New Year discount\",\"type\":\"discount\",\"discount\":{\"type\":\"amount\",\"value\": \"10\"}}"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "quantity": 1,
                    "merchandise": {
                        "__typename": "ProductVariant",
                        "id": "gid://shopify/ProductVariant/4",
                        "product": {
                            "id": "gid://shopify/Product/4",
                            "gates": [
                                {
                                    "id": "gid://shopify/GateSubject/4",
                                    "configuration": {
                                        "id": "gid://shopify/GateConfiguration/3",
                                        "handle": "tokengating-example-app",
                                        "metafield": {
                                            "value": "{\"name\":\"Another discount\",\"type\":\"discount\",\"discount\":{\"type\":\"amount\",\"value\": 15}}"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            ]
        },
        "discountNode": {
            "metafield": {
                "value": ""
            }
        }
    }
    "#;
    let mut input: input::ResponseData = serde_json::from_str(default_input).unwrap();
    input.cart.attribute = gate_context_input;
    if gate_configuration_id.is_some() {
        input.discount_node.metafield = gate_configuration_id;
    }

    input
}

#[test]
fn test_discount_as_percentage_with_valid_gate_context() -> Result<()> {
    setup();
    let attribute = Some(input::InputCartAttribute {
        value: Some(
            r#"{
                "vaults": [
                    {
                        "id": "gid://shopify/GateConfiguration/1",
                        "hmac": "bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37"
                    },
                    {
                        "id": "gid://shopify/GateConfiguration/2",
                        "hmac": "f095024f57f4642cad6c442b954dd3bd24e4cdc2c180209cda3f5cf2a0c28703"
                    }
                ]
            }"#
            .to_string(),
        ),
    });

    let gate_configuration_id = Some(input::InputDiscountNodeMetafield {
        value: "gid://shopify/GateConfiguration/1".to_string(),
    });

    let result = run(input(attribute, gate_configuration_id))?;
    let expected = crate::output::FunctionResult {
        discounts: vec![crate::output::Discount {
            message: Some("Christmas discount".to_string()),
            targets: vec![crate::output::Target::ProductVariant(crate::output::ProductVariantTarget {
                id: "gid://shopify/ProductVariant/1".to_string(),
                quantity: None,
            })],
            value: crate::output::Value::Percentage(crate::output::Percentage {
                value: "25".to_string(),
            }),
        }],
        discount_application_strategy: crate::output::DiscountApplicationStrategy::MAXIMUM,
    };

    assert_eq!(result, expected);
    Ok(())
}

#[test]
fn test_discount_on_two_products_with_valid_gate_context() -> Result<()> {
    setup();
    let attribute = Some(input::InputCartAttribute {
        value: Some(
            r#"{
                "vaults": [
                    {
                        "id": "gid://shopify/GateConfiguration/1",
                        "hmac": "bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37"
                    },
                    {
                        "id": "gid://shopify/GateConfiguration/2",
                        "hmac": "f095024f57f4642cad6c442b954dd3bd24e4cdc2c180209cda3f5cf2a0c28703"
                    }
                ]
            }"#
            .to_string(),
        ),
    });

    let gate_configuration_id = Some(input::InputDiscountNodeMetafield {
        value: "gid://shopify/GateConfiguration/2".to_string(),
    });

    let result = run(input(attribute, gate_configuration_id))?;
    let expected = crate::output::FunctionResult {
        discounts: vec![crate::output::Discount {
            message: Some("New Year discount".to_string()),
            targets: vec![
                crate::output::Target::ProductVariant(crate::output::ProductVariantTarget {
                    id: "gid://shopify/ProductVariant/2".to_string(),
                    quantity: None,
                }),
                crate::output::Target::ProductVariant(crate::output::ProductVariantTarget {
                    id: "gid://shopify/ProductVariant/3".to_string(),
                    quantity: None,
                }),
            ],
            value: crate::output::Value::FixedAmount(crate::output::FixedAmount {
                amount: "10".to_string(),
                applies_to_each_item: None,
            }),
        }],
        discount_application_strategy: crate::output::DiscountApplicationStrategy::MAXIMUM,
    };

    assert_eq!(result, expected);
    Ok(())
}

#[test]
fn test_discount_with_no_gate_context() -> Result<()> {
    setup();
    let attribute = Some(input::InputCartAttribute {
        value: Some("".to_string()),
    });

    let gate_configuration_id = Some(input::InputDiscountNodeMetafield {
        value: "gid://shopify/GateConfiguration/2".to_string(),
    });

    let result = run(input(attribute, gate_configuration_id))?;
    let expected = crate::output::FunctionResult {
        discounts: vec![],
        discount_application_strategy: crate::output::DiscountApplicationStrategy::MAXIMUM,
    };
    assert_eq!(result, expected);
    Ok(())
}

#[test]
fn test_discount_applies_correctly_to_multiple_variants() -> Result<()> {
    setup();
    let attribute = Some(input::InputCartAttribute {
        value: Some(
            r#"{
                "vaults": [
                    {
                        "id": "gid://shopify/GateConfiguration/2",
                        "hmac": "f095024f57f4642cad6c442b954dd3bd24e4cdc2c180209cda3f5cf2a0c28703"
                    }
                ]
            }"#
            .to_string(),
        ),
    });
    let gate_configuration_id = Some(input::InputDiscountNodeMetafield {
        value: "gid://shopify/GateConfiguration/2".to_string(),
    });

    let result = run(input(attribute, gate_configuration_id))?;
    let expected = crate::output::FunctionResult {
        discounts: vec![crate::output::Discount {
            message: Some("New Year discount".to_string()),
            targets: vec![
                crate::output::Target::ProductVariant(crate::output::ProductVariantTarget {
                    id: "gid://shopify/ProductVariant/2".to_string(),
                    quantity: None,
                }),
                crate::output::Target::ProductVariant(crate::output::ProductVariantTarget {
                    id: "gid://shopify/ProductVariant/3".to_string(),
                    quantity: None,
                }),
            ],
            value: crate::output::Value::FixedAmount(crate::output::FixedAmount {
                amount: "10".to_string(),
                applies_to_each_item: None,
            }),
        }],
        discount_application_strategy: crate::output::DiscountApplicationStrategy::MAXIMUM,
    };

    assert_eq!(result, expected);
    Ok(())
}

#[test]
fn test_invalid_gate_configuration_id_results_in_no_discount() -> Result<()> {
    setup();
    let attribute = Some(input::InputCartAttribute {
        value: Some(
            r#"
                [
                  {
                    "id": "gid://shopify/GateConfiguration/1",
                    "hmac": "bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37"
                  }
                ]
            "#
            .to_string(),
        ),
    });
    let gate_configuration_id = Some(input::InputDiscountNodeMetafield {
        value: "gid://shopify/GateConfiguration/invalid".to_string(),
    });

    let result = run(input(attribute, gate_configuration_id))?;
    assert_eq!(result, NO_DISCOUNT);
    Ok(())
}

#[test]
fn test_empty_cart_results_in_no_discount() -> Result<()> {
    setup();
    let attribute = Some(input::InputCartAttribute {
        value: Some(
            r#"
                [
                  {
                    "id": "gid://shopify/GateConfiguration/1",
                    "hmac": "valid-hmac-for-config-1"
                  }
                ]
            "#
            .to_string(),
        ),
    });
    let gate_configuration_id = Some(input::InputDiscountNodeMetafield {
        value: "gid://shopify/GateConfiguration/1".to_string(),
    });

    // Modify the input function to simulate an empty cart
    let mut input_data = input(attribute, gate_configuration_id);
    input_data.cart.lines.clear(); // Simulate an empty cart

    let result = run(input_data)?;
    assert_eq!(result, NO_DISCOUNT);
    Ok(())
}

#[test]
fn test_malformed_hmac_results_in_no_discount() -> Result<()> {
    setup();
    let attribute = Some(input::InputCartAttribute {
        value: Some(
            r#"
                [
                  {
                    "id": "gid://shopify/GateConfiguration/1",
                    "hmac": "malformed-hmac"
                  }
                ]
            "#
            .to_string(),
        ),
    });
    let gate_configuration_id = Some(input::InputDiscountNodeMetafield {
        value: "gid://shopify/GateConfiguration/1".to_string(),
    });

    let result = run(input(attribute, gate_configuration_id))?;
    assert_eq!(result, NO_DISCOUNT);
    Ok(())
}

#[test]
fn test_discount_with_no_hmac_in_gate_context() -> Result<()> {
    setup();
    let attribute = Some(input::InputCartAttribute {
        value: Some(
            r#"
                [
                  {
                    "id": "gid://shopify/GateConfiguration/1"
                  },
                  {
                    "id": "gid://shopify/GateConfiguration/2"
                  }
                ]
            "#
            .to_string(),
        ),
    });
    let gate_configuration_id = Some(input::InputDiscountNodeMetafield {
        value: "gid://shopify/GateConfiguration/2".to_string(),
    });

    let result = run(input(attribute, gate_configuration_id))?;
    let expected = crate::output::FunctionResult {
        discounts: vec![],
        discount_application_strategy: crate::output::DiscountApplicationStrategy::MAXIMUM,
    };
    assert_eq!(result, expected);
    Ok(())
}

#[test]
fn test_discount_with_wrong_hmac_in_gate_context() -> Result<()> {
    setup();
    let attribute = Some(input::InputCartAttribute {
        value: Some(
            r#"
                [
                  {
                    "id": "gid://shopify/GateConfiguration/1",
                    "hmac": "fake-hmac"
                  },
                  {
                    "id": "gid://shopify/GateConfiguration/2",
                    "hmac": "fake-hmac"
                  }
                ]
            "#
            .to_string(),
        ),
    });
    let gate_configuration_id = Some(input::InputDiscountNodeMetafield {
        value: "gid://shopify/GateConfiguration/2".to_string(),
    });

    let result = run(input(attribute, gate_configuration_id))?;
    let expected = crate::output::FunctionResult {
        discounts: vec![],
        discount_application_strategy: crate::output::DiscountApplicationStrategy::MAXIMUM,
    };
    assert_eq!(result, expected);
    Ok(())
}