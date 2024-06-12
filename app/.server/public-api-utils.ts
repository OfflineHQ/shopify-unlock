import { createHmac } from "crypto";

function createShopifyProxySignature(params, secret) {
  const keysParams = Object.keys(params).reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {});

  const encodedParams = new URLSearchParams(keysParams).toString();
  const hmac = createHmac("sha256", secret);
  console.log("encodedParams", encodedParams);
  hmac.update(encodedParams);
  return hmac.digest("base64");
}

function populateQueryParams(params) {
  const queryParams = new URLSearchParams();
  for (const key in params) {
    if (Array.isArray(params[key])) {
      params[key].forEach((value) => {
        queryParams.append(key, value);
      });
    } else {
      queryParams.append(key, params[key]);
    }
  }
  return queryParams;
}

async function makeShopifyProxyRequest(path, params, method = "GET") {
  const timestamp = Date.now();
  const requestParams = {
    ...params,
    timestamp,
  };

  const signature = createShopifyProxySignature(
    requestParams,
    process.env.SHOPIFY_API_SECRET,
  );

  const queryParams = populateQueryParams({
    ...requestParams,
    signature,
  });

  const url = `${
    process.env.OFFLINE_WEB_API_URL
  }${path}?${queryParams.toString()}`;

  console.log(`Making Shopify proxy request: ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw {
      statusCode: response.status,
      status: response.statusText,
      message: errorData.error,
    };
  }

  const data = await response.json();
  console.log("Shopify proxy data:", data);
  return data;
}
