"use client";

import { Contract } from "contracts/founder_majority";
import { deployContract, findDeployedContract } from "./browser-contracts";
import { buildContractProviders, connect1AMWallet } from "./providers";

// Witness functions return [updatedPrivateState, value] per compact-runtime protocol.
function makeWitnesses(founderShares: bigint, totalDilutedShares: bigint) {
  return {
    founder_shares: (ctx: { privateState: unknown }) =>
      [ctx.privateState, founderShares] as [unknown, bigint],
    total_diluted_shares: (ctx: { privateState: unknown }) =>
      [ctx.privateState, totalDilutedShares] as [unknown, bigint],
  };
}

function hexToBytes(value: string): Uint8Array {
  const normalized = value.replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/i.test(normalized)) {
    throw new Error("Company identifier must be a 32-byte hex value.");
  }

  return Uint8Array.from(
    normalized.match(/.{2}/g)!.map((pair) => Number.parseInt(pair, 16)),
  );
}

export async function deployFounderMajorityContract(
  companyIdHex: string,
  thresholdBps: number,
): Promise<{ contractAddress: string }> {
  const api = await connect1AMWallet();
  const providers = await buildContractProviders(api, "founder_majority");

  const companyId = hexToBytes(companyIdHex);

  const contract = new Contract(makeWitnesses(0n, 1n));

  const deployed = await deployContract(providers as any, {
    compiledContract: contract as any,
    contractName: "founder_majority",
    privateStateId: `founder_majority:${companyIdHex}`,
    initialPrivateState: {},
    args: [companyId, BigInt(thresholdBps)],
  });

  return { contractAddress: deployed.deployTxData.public.contractAddress as string };
}

export async function publishFounderMajorityProofOnChain(
  contractAddress: string,
  companyIdHex: string,
  founderShares: bigint,
  totalDilutedShares: bigint,
): Promise<void> {
  const api = await connect1AMWallet();
  const providers = await buildContractProviders(api, "founder_majority");

  const contract = new Contract(makeWitnesses(founderShares, totalDilutedShares));

  const found = await findDeployedContract(providers as any, {
    compiledContract: contract as any,
    contractName: "founder_majority",
    contractAddress: contractAddress as any,
    privateStateId: `founder_majority:${companyIdHex}`,
  });

  await found.callTx.publish_proof();
}
