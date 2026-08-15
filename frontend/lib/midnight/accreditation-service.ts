"use client";

import { Contract } from "contracts/accreditation";
import { deployContract, findDeployedContract } from "./browser-contracts";
import { buildContractProviders, connect1AMWallet } from "./providers";

// Witness functions return [updatedPrivateState, value] per compact-runtime protocol.
function makeWitnesses(partial: Partial<{
  annualIncomeCents: bigint;
  netWorthCents: bigint;
}>) {
  return {
    annual_income_cents: (ctx: { privateState: unknown }) =>
      [ctx.privateState, partial.annualIncomeCents ?? 0n] as [unknown, bigint],
    net_worth_cents: (ctx: { privateState: unknown }) =>
      [ctx.privateState, partial.netWorthCents ?? 0n] as [unknown, bigint],
    current_timestamp: (ctx: { privateState: unknown }) =>
      [ctx.privateState, BigInt(Math.floor(Date.now() / 1000))] as [unknown, bigint],
  };
}

function hexToBytes(value: string): Uint8Array {
  const normalized = value.replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/i.test(normalized)) {
    throw new Error("Investor identifier must be a 32-byte hex value.");
  }

  return Uint8Array.from(
    normalized.match(/.{2}/g)!.map((pair) => Number.parseInt(pair, 16)),
  );
}

export async function deployAccreditationContract(investorIdHex: string): Promise<{
  contractAddress: string;
}> {
  const api = await connect1AMWallet();
  const providers = await buildContractProviders(api, "accreditation");

  const investorId = hexToBytes(investorIdHex);

  const contract = new Contract(makeWitnesses({}));

  const deployed = await deployContract(providers as any, {
    compiledContract: contract as any,
    contractName: "accreditation",
    privateStateId: `accreditation:${investorIdHex}`,
    initialPrivateState: {},
    args: [investorId],
  });

  return { contractAddress: deployed.deployTxData.public.contractAddress as string };
}

export async function proveByIncomeOnChain(
  contractAddress: string,
  annualIncomeCents: bigint,
  investorIdHex: string,
): Promise<void> {
  const api = await connect1AMWallet();
  const providers = await buildContractProviders(api, "accreditation");

  const contract = new Contract(makeWitnesses({ annualIncomeCents }));

  const found = await findDeployedContract(providers as any, {
    compiledContract: contract as any,
    contractName: "accreditation",
    contractAddress: contractAddress as any,
    privateStateId: `accreditation:${investorIdHex}`,
  });

  await found.callTx.prove_by_income();
}

export async function proveByNetWorthOnChain(
  contractAddress: string,
  netWorthCents: bigint,
  investorIdHex: string,
): Promise<void> {
  const api = await connect1AMWallet();
  const providers = await buildContractProviders(api, "accreditation");

  const contract = new Contract(makeWitnesses({ netWorthCents }));

  const found = await findDeployedContract(providers as any, {
    compiledContract: contract as any,
    contractName: "accreditation",
    contractAddress: contractAddress as any,
    privateStateId: `accreditation:${investorIdHex}`,
  });

  await found.callTx.prove_by_net_worth();
}
