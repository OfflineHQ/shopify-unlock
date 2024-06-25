import { json } from "@remix-run/node";
import type { EvaluateGateArgsSchema } from "./schema";
import {
  getVaultsPayload,
  verifySignatureAndCustomerId,
} from "./shared-functions.server";

export default async function evaluateGate(args: EvaluateGateArgsSchema) {
  const verificationResult = await verifySignatureAndCustomerId(args);
  if (verificationResult) {
    return verificationResult;
  }

  const payload = await getVaultsPayload(args);
  return json(payload, { status: 200 });
}
