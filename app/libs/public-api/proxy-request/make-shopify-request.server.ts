import { createHmac } from "crypto";

interface ShopifyProxyParams {
  [key: string]: string | string[];
}

function createShopifyProxySignature(
  params: ShopifyProxyParams,
  secret: string,
): string {
  const keysParams: Record<string, string> = Object.keys(params).reduce(
    (acc, key) => {
      acc[key] = Array.isArray(params[key])
        ? (params[key] as string[]).join(",")
        : (params[key] as string);
      return acc;
    },
    {} as Record<string, string>,
  );

  const encodedParams = new URLSearchParams(keysParams).toString();
  const hmac = createHmac("sha256", secret);
  console.log("encodedParams", encodedParams);
  hmac.update(encodedParams);
  return hmac.digest("base64");
}

function populateQueryParams(params: ShopifyProxyParams): URLSearchParams {
  const queryParams = new URLSearchParams();
  for (const key in params) {
    if (Array.isArray(params[key])) {
      (params[key] as string[]).forEach((value) => {
        queryParams.append(key, value);
      });
    } else {
      queryParams.append(key, params[key] as string);
    }
  }
  return queryParams;
}

export async function makeShopifyProxyRequest<T>(
  path: string,
  params: ShopifyProxyParams,
  method: string = "GET",
): Promise<T> {
  const timestamp = Date.now().toString();
  const requestParams: ShopifyProxyParams = {
    ...params,
    timestamp,
  };

  const signature = createShopifyProxySignature(
    requestParams,
    process.env.SHOPIFY_API_SECRET as string,
  );

  const queryParams = populateQueryParams({
    ...requestParams,
    signature,
  });

  const url = `${process.env.OFFLINE_WEB_API_URL}${path}?${queryParams.toString()}`;

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
