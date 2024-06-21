export interface VerifySignatureWithCometh {
  address: string;
  message: string;
  signature: string;
}

interface VerifySignatureWithComethResponse {
  result: boolean;
  success: boolean;
}

export default async function verifySignatureWithCometh({
  address,
  message,
  signature,
}: VerifySignatureWithCometh) {
  const comethApiUrl = `https://api.connect.cometh.io/wallets/${address}/is-valid-signature`;
  console.log("Verifying signature with Cometh:", {
    address,
    message,
    signature,
  });
  const apiKey = process.env.COMETH_API_KEY;
  if (!apiKey) {
    throw new Error("COMETH_API_KEY environment variable is not set");
  }
  try {
    const response = await fetch(comethApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        signature,
        message,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error verifying signature with Cometh:", errorData.error);
      throw new Error(`Cometh API error: ${errorData.error}`);
    }
    const data = (await response.json()) as VerifySignatureWithComethResponse;
    if (!data.success) {
      throw new Error("Failed to verify signature with Cometh");
    }
    return data.result;
  } catch (error) {
    console.error("Error verifying signature with Cometh:", error);
    throw error;
  }
}
