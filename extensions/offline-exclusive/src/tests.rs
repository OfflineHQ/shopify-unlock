use super::*;
use shopify_function::{run_function_with_input, Result};
use std::env;


// Setup function to set the environment variable before running tests
fn setup() {
    env::set_var("OFFLINE_GATES_SHOPIFY_SECRET", "secret-key");
}


#[test]
fn test_errors_without_valid_gate_context() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "[{\"id\": \"gid://shopify/GateConfiguration/1\", \"hmac\": \"123\"}]"
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Christmas exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "2"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    let mut errors = Vec::new();
    errors.push(FunctionError {
        localized_message: "You don't have access to this product. It is gated!".to_owned(),
        target: "cart".to_owned(),
    });
    let expected = crate::output::FunctionResult { errors: errors };

    assert_eq!(result, expected);
    Ok(())
}


#[test]
fn test_no_errors_valid_gate_context() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "{\"vaults\":[{\"id\":\"gid://shopify/GateConfiguration/1\",\"hmac\":\"bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37\"}]}"                    },
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Christmas exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "2"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    let errors = Vec::new();
    let expected = crate::output::FunctionResult { errors: errors };

    assert_eq!(result, expected);
    Ok(())
}

#[test]
fn test_valid_gate_context_quantity_at_limit() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "{\"vaults\":[{\"id\":\"gid://shopify/GateConfiguration/1\",\"hmac\":\"bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37\"}]}"                    },
                    "lines": [
                        {
                            "quantity": 2,
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Christmas exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "2"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    assert!(result.errors.is_empty());
    Ok(())
}

#[test]
fn test_valid_hmac_with_single_product_variant_under_order_limit() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "{\"walletAddress\":\"0x728dC59cc9881FCfc0B974bcB0eA46b0a9f6EEeC\",\"walletVerificationMessage\":\"Offline\",\"walletVerificationSignature\":\"0x000000000000000000000000977eca871a778585e8c6fad58002098fdd739fea00000000000000000000000000000000000000000000000000000000000000410000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000244dba2175ab9674ebbdb2af95a950ce70b0148b3ad22628ab4ea1f81f5eb535f1a89010295f046974f1745b2685dc4d76e501a788258f759e9513880740da752e0000000000000000000000000000000000000000000000000000000000000025287435e323707439f77c549b59a9433190518d9988574d9de99ef1c2d2c1649a1d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000987b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a22426c4354334b63756e56347856716c516e356b7351372d656f5245524a786c4b5a46417046713757465763222c226f726967696e223a2268747470733a2f2f7777772e73746167696e672e756e6c6f636b2e6f66666c696e652e6c697665222c2263726f73734f726967696e223a66616c7365\",\"vaults\":[{\"id\":\"gid://shopify/GateConfiguration/1\",\"hmac\":\"bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37\"}]}"
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Christmas exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "2"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    assert!(result.errors.is_empty(), "Expected no errors, but found some: {:?}", result.errors);
    Ok(())
}


#[test]
fn test_valid_hmac_with_multiple_product_variants_under_order_limit() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "{\"vaults\":[{\"id\":\"gid://shopify/GateConfiguration/1\",\"hmac\":\"bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37\"}, {\"id\":\"gid://shopify/GateConfiguration/2\",\"hmac\":\"f095024f57f4642cad6c442b954dd3bd24e4cdc2c180209cda3f5cf2a0c28703\"}]}"                    },
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Christmas exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "2"
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Mountain exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "3"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    assert!(result.errors.is_empty(), "Expected no errors, but found some: {:?}", result.errors);
    Ok(())
}

#[test]
fn test_mixed_hmac_validity_with_multiple_product_variants() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "[{\"id\": \"gid://shopify/GateConfiguration/1\", \"hmac\": \"invalid_hmac\"}, {\"id\": \"gid://shopify/GateConfiguration/2\", \"hmac\": \"f095024f57f4642cad6c442b954dd3bd24e4cdc2c180209cda3f5cf2a0c28703\"}]"
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Christmas exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "2"
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Mountain exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "3"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    assert!(!result.errors.is_empty(), "Expected errors for products with invalid HMACs, but none were found.");
    Ok(())
}

#[test]
fn test_valid_hmac_with_single_product_variant_at_order_limit() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "{\"vaults\":[{\"id\":\"gid://shopify/GateConfiguration/1\",\"hmac\":\"bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37\"}]}"                    },
                    "lines": [
                        {
                            "quantity": 2,
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Christmas exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "2"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    assert!(result.errors.is_empty(), "Expected no errors, but found some: {:?}", result.errors);
    Ok(())
}

#[test]
fn test_valid_hmac_with_single_product_variant_over_order_limit() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "[{\"id\": \"gid://shopify/GateConfiguration/1\", \"hmac\": \"bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37\"}]"
                    },
                    "lines": [
                        {
                            "quantity": 3,
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Snowdevil exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "2"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    assert!(!result.errors.is_empty(), "Expected an error indicating the maximum order limit has been exceeded, but none were found.");
    Ok(())
}

#[test]
fn test_valid_hmac_with_multiple_product_variants_over_order_limits() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "[{\"id\": \"gid://shopify/GateConfiguration/1\", \"hmac\": \"bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37\"}, {\"id\": \"gid://shopify/GateConfiguration/2\", \"hmac\": \"f095024f57f4642cad6c442b954dd3bd24e4cdc2c180209cda3f5cf2a0c28703\"}]"
                    },
                    "lines": [
                        {
                            "quantity": 3,
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Snowdevil exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "2"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            "quantity": 4,
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Mountain exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "3"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    assert!(!result.errors.is_empty(), "Expected errors for each product variant indicating the maximum order limit has been exceeded, but none were found.");
    Ok(())
}

#[test]
fn test_empty_cart() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "[]"
                    },
                    "lines": []
                }
            }
        "#,
    )?;
    assert!(result.errors.is_empty(), "Expected no errors for an empty cart, but found some: {:?}", result.errors);
    Ok(())
}

#[test]
fn test_valid_hmac_with_multiple_product_variants_some_over_order_limit() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "[{\"id\": \"gid://shopify/GateConfiguration/1\", \"hmac\": \"bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37\"}, {\"id\": \"gid://shopify/GateConfiguration/2\", \"hmac\": \"f095024f57f4642cad6c442b954dd3bd24e4cdc2c180209cda3f5cf2a0c28703\"}]"
                    },
                    "lines": [
                        {
                            "quantity": 3,
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Snowdevil exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "2"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            "quantity": 2,
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Mountain exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "3"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    assert!(!result.errors.is_empty(), "Expected errors for product variants exceeding the order limit, but none were found.");
    Ok(())
}

#[test]
fn test_cart_with_ungated_product_variant() -> Result<()> {
    setup();
    let result = run_function_with_input(
        run,
        r#"
            {
                "cart": {
                    "attribute": {
                        "value": "{\"vaults\":[{\"id\":\"gid://shopify/GateConfiguration/1\",\"hmac\":\"bd3862797c3e532f9f07e6672192d46792ee3591a0c7fe279e14d971eb541b37\"},{\"id\":\"gid://shopify/GateConfiguration/2\",\"hmac\":\"f095024f57f4642cad6c442b954dd3bd24e4cdc2c180209cda3f5cf2a0c28703\"}]}"                    },
                    "lines": [
                        {
                            "quantity": 1,
                            "merchandise": {
                                "__typename": "ProductVariant",
                                "id": "gid://shopify/ProductVariant/1",
                                "product": {
                                    "id": "gid://shopify/Product/1",
                                    "gates": []
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
                                                "reaction": {
                                                    "value": "{\"name\":\"Mountain exclusive\",\"type\":\"exclusive_access\"}"
                                                },
                                                "orderLimit": {
                                                    "value": "3"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        "#,
    )?;
    assert!(result.errors.is_empty(), "Expected no errors, even with an ungated product in the cart, but found some: {:?}", result.errors);
    Ok(())
}