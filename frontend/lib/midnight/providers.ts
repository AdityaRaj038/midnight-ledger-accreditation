"use client";

import type { ConnectedAPI, KeyMaterialProvider } from "@midnight-ntwrk/dapp-connector-api";
import type {
  MidnightProviders,
  PublicDataProvider,
  ZKConfigProvider,
} from "@midnight-ntwrk/midnight-js-types";
import { MidnightBech32m, ShieldedCoinPublicKey } from "@midnight-ntwrk/wallet-sdk-address-format";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

// ─── Private State Provider (localStorage) ───────────────────────────────────

class LocalPrivateStateProvider {
  private prefix = "midnight:ps:";
  private signingPrefix = "midnight:signing:";
  private scope = "";

  setContractAddress(address: string) {
    this.scope = address;
  }

  async set(id: string, state: unknown): Promise<void> {
    localStorage.setItem(
      `${this.prefix}${this.scope}:${id}`,
      JSON.stringify(state, (_, v) =>
        typeof v === "bigint" ? { __bigint: v.toString() } : v,
      ),
    );
  }

  async get(id: string): Promise<unknown> {
    const raw = localStorage.getItem(`${this.prefix}${this.scope}:${id}`);
    if (!raw) return undefined;
    return JSON.parse(raw, (_, v) =>
      v && typeof v === "object" && "__bigint" in v ? BigInt(v.__bigint) : v,
    );
  }

  async remove(id: string): Promise<void> {
    localStorage.removeItem(`${this.prefix}${this.scope}:${id}`);
  }

  async setSigningKey(contractAddress: string, signingKey: string): Promise<void> {
    localStorage.setItem(`${this.signingPrefix}${contractAddress}`, signingKey);
  }

  async getSigningKey(contractAddress: string): Promise<string | undefined> {
    return localStorage.getItem(`${this.signingPrefix}${contractAddress}`) ?? undefined;
  }

  async removeSigningKey(contractAddress: string): Promise<void> {
    localStorage.removeItem(`${this.signingPrefix}${contractAddress}`);
  }
}

// ─── ZK Config Provider (fetches binary keys from /public/contracts/) ─────────

export function makeZKConfigProvider(contractName: "accreditation" | "founder_majority"): KeyMaterialProvider {
  async function fetchBytes(url: string): Promise<Uint8Array> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ZK artifact: ${url} (${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
  }

  const base = `/contracts/${contractName}`;
  return {
    getZKIR: (circuitId: string) => fetchBytes(`${base}/zkir/${circuitId}.zkir`),
    getProverKey: (circuitId: string) => fetchBytes(`${base}/keys/${circuitId}.prover`),
    getVerifierKey: (circuitId: string) => fetchBytes(`${base}/keys/${circuitId}.verifier`),
  };
}

// ─── Public Data Provider (Midnight indexer GraphQL) ─────────────────────────
// Queries the indexer for on-chain contract state.

function makePublicDataProvider(indexerUri: string): PublicDataProvider {
  async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const res = await fetch(indexerUri, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json() as { data?: T; errors?: unknown[] };
    if (json.errors?.length) throw new Error(`Indexer GQL error: ${JSON.stringify(json.errors)}`);
    return json.data as T;
  }

  const CONTRACT_ACTION_QUERY = `
    query ContractAction($address: HexEncoded!, $offset: ContractActionOffset) {
      contractAction(address: $address, offset: $offset) {
        state
        zswapState
        unshieldedBalances { tokenType amount }
      }
    }
  `;

  const DEPLOY_STATE_QUERY = `
    query ContractDeploy($address: HexEncoded!) {
      contractAction(address: $address, offset: { blockOffset: { blockHeight: 0 } }) {
        ... on ContractDeploy { state }
      }
    }
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return {
    queryContractState: async (contractAddress: string) => {
      const data = await gql<{ contractAction: { state: string } | null }>(
        CONTRACT_ACTION_QUERY, { address: contractAddress },
      );
      return data.contractAction ?? null;
    },
    queryZSwapAndContractState: async (contractAddress: string) => {
      const data = await gql<{ contractAction: { state: string; zswapState: string } | null }>(
        CONTRACT_ACTION_QUERY, { address: contractAddress },
      );
      if (!data.contractAction) return null;
      return [data.contractAction.zswapState, data.contractAction.state, null] as any;
    },
    queryDeployContractState: async (contractAddress: string) => {
      const data = await gql<{ contractAction: { state: string } | null }>(
        DEPLOY_STATE_QUERY, { address: contractAddress },
      );
      return data.contractAction ?? null;
    },
    queryUnshieldedBalances: async (contractAddress: string) => {
      const data = await gql<{ contractAction: { unshieldedBalances: unknown[] } | null }>(
        CONTRACT_ACTION_QUERY, { address: contractAddress },
      );
      return data.contractAction?.unshieldedBalances ?? null;
    },
    watchForContractState: async (contractAddress: string) => {
      // Poll until state appears (deploy tx confirmation)
      for (let i = 0; i < 60; i++) {
        const data = await gql<{ contractAction: { state: string } | null }>(
          CONTRACT_ACTION_QUERY, { address: contractAddress },
        );
        if (data.contractAction) return data.contractAction;
        await new Promise((r) => setTimeout(r, 2000));
      }
      throw new Error(`Timed out waiting for contract state: ${contractAddress}`);
    },
    watchForUnshieldedBalances: async (contractAddress: string) => {
      const data = await gql<{ contractAction: { unshieldedBalances: unknown[] } | null }>(
        CONTRACT_ACTION_QUERY, { address: contractAddress },
      );
      return data.contractAction?.unshieldedBalances ?? {};
    },
  } as unknown as PublicDataProvider;
}

function normalizeShieldedCoinPublicKey(value: string, networkId: string): string {
  const raw: any = value as any;

  if (raw && typeof raw.toHexString === "function") {
    console.info("[zeed] shielded coin key: object.toHexString()");
    return raw.toHexString();
  }

  const trimmed = String(value).trim();
  const hex = trimmed.startsWith("0x") ? trimmed.slice(2) : trimmed;

  if (/^[0-9a-fA-F]{64,}$/.test(hex)) {
    console.info("[zeed] shielded coin key: raw hex");
    return ShieldedCoinPublicKey.fromHexString(hex).toHexString();
  }

  try {
    console.info("[zeed] shielded coin key: bech32m decode", { networkId, trimmed });
    const parsed = MidnightBech32m.parse(trimmed);
    const decoded: any = ShieldedCoinPublicKey.codec.decode(networkId, parsed as any);
    if (decoded && typeof decoded.toHexString === "function") {
      return decoded.toHexString();
    }
  } catch {
    console.warn("[zeed] shielded coin key decode failed", { networkId, trimmed });
    // Fall through to the wallet-provided string.
  }

  console.warn("[zeed] shielded coin key fallback", { networkId, trimmed });
  return trimmed;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCooldownError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /temporarily banned|already pending|wait for it to expire|request timed out|balance transaction is already pending/i.test(message);
}

async function retryWithCooldown<T>(label: string, action: () => Promise<T>) {
  const delays = [0, 4000, 8000, 16000];
  let lastError: unknown;

  for (const delay of delays) {
    if (delay > 0) {
      console.info(`[zeed] ${label}:cooldown`, { delay });
      await sleep(delay);
    }
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (!isCooldownError(error)) {
        throw error;
      }
      console.warn(`[zeed] ${label}:retry`, {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${label} failed after cooldown retries`);
}

// ─── Assemble ContractProviders from Lace ConnectedAPI ───────────────────────

export async function buildContractProviders(
  api: ConnectedAPI,
  contractName: "accreditation" | "founder_majority",
): Promise<MidnightProviders> {
  const config = await api.getConfiguration();
  const shieldedAddresses: any = await api.getShieldedAddresses();
  const networkId = config.networkId ?? "preprod";
  const shieldedCoinPublicKey = String((shieldedAddresses as { shieldedCoinPublicKey: string }).shieldedCoinPublicKey);
  const coinPublicKeyHex = normalizeShieldedCoinPublicKey(shieldedCoinPublicKey, networkId);

  const keyMaterialProvider = makeZKConfigProvider(contractName);
  const provingProvider = await api.getProvingProvider(keyMaterialProvider);

  return {
    privateStateProvider: new LocalPrivateStateProvider() as any,
    publicDataProvider: makePublicDataProvider(config.indexerUri),
    zkConfigProvider: keyMaterialProvider as unknown as ZKConfigProvider<string>,
    proofProvider: {
      // The wallet's ProvingProvider.prove() handles serialization internally.
      // midnight-js-contracts passes unproven transactions through this provider.
      proveTx: async (_unprovenTx: unknown) => provingProvider as any,
    } as any,
    walletProvider: {
      balanceTx: async (tx: unknown) => {
        // Serialize the unbound transaction to hex, balance via wallet, deserialize.
        // The exact serialization depends on @midnight-ntwrk/ledger-v8 which is
        // bundled inside midnight-js-contracts — it handles this internally.
        const { CostModel } = await import("@midnight-ntwrk/ledger-v8");
        return retryWithCooldown("balanceTx", async () => {
          console.info("[zeed] balanceTx:start");
          const provenTx = await (tx as any).prove(provingProvider, CostModel.initialCostModel());
          console.info("[zeed] balanceTx:proven");
          const serialized = (provenTx as any).serialize?.() ?? provenTx;
          console.info("[zeed] balanceTx:serialized", typeof serialized);
          const { tx: balanced } = await api.balanceUnsealedTransaction(
            typeof serialized === "string" ? serialized : Buffer.from(serialized).toString("hex"),
          );
          return balanced as any;
        });
      },
      getCoinPublicKey: () => coinPublicKeyHex as any,
      getEncryptionPublicKey: () => (shieldedAddresses as { shieldedEncryptionPublicKey: string }).shieldedEncryptionPublicKey as any,
    } as any,
    midnightProvider: {
      submitTx: async (tx: unknown) => {
        await retryWithCooldown("submitTx", async () => {
          console.info("[zeed] submitTx:start");
          const serialized = (tx as any).serialize?.() ?? tx;
          await api.submitTransaction(
            typeof serialized === "string" ? serialized : Buffer.from(serialized).toString("hex"),
          );
          console.info("[zeed] submitTx:done");
        });
      },
    } as any,
  };
}

// ─── Lace wallet discovery ────────────────────────────────────────────────────

export function discoverLaceWallet() {
  if (typeof window === "undefined") return null;
  const wallets = window.midnight ?? {};
  // Lace wallet injects under key "mnLace"
  return wallets["mnLace"] ?? Object.values(wallets)[0] ?? null;
}

export async function connectLaceWallet(networkId = "preprod"): Promise<ConnectedAPI> {
  const wallet = discoverLaceWallet();
  if (!wallet) throw new Error("Lace wallet not found. Install the Lace browser extension.");
  const api = await (wallet as any).connect(networkId) as ConnectedAPI;
  setNetworkId(networkId);
  // hintUsage is on ConnectedAPI (after connect), not on InitialAPI
  await (api as any).hintUsage?.([
    "getShieldedAddresses",
    "getProvingProvider",
    "balanceUnsealedTransaction",
    "submitTransaction",
    "getConfiguration",
  ]);
  return api;
}
