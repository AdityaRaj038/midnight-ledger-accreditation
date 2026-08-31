"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, CircleOff, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { connectLaceWallet } from "@/lib/midnight/providers";
import { deployAccreditationContract } from "@/lib/midnight/accreditation-service";
import { deployFounderMajorityContract } from "@/lib/midnight/founder-majority-service";

type DeployResult = {
  accreditation?: string;
  founderMajority?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function DeployPage() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<string>("preprod");
  const [walletInfo, setWalletInfo] = useState<{
    rpc?: string;
    indexer?: string;
    proofServer?: string;
  } | null>(null);
  const [results, setResults] = useState<DeployResult>({});
  const [deployIdentity, setDeployIdentity] = useState<string | null>(null);

  const canDeploy = connected && !deploying;

  const completed = useMemo(() => {
    return Boolean(results.accreditation && results.founderMajority);
  }, [results]);

  async function handleConnect() {
    setError(null);
    setConnecting(true);
    try {
      const api = await connectLaceWallet("preprod");
      const config = await api.getConfiguration() as any;
      const addresses = await api.getShieldedAddresses() as any;
      console.info("[zeed] getShieldedAddresses()", addresses);
      setNetworkId((api as any).networkId ?? "preprod");
      setWalletInfo({
        rpc: config.rpc ?? config.nodeUrl ?? config.endpoint,
        indexer: config.indexer ?? config.indexerUri,
        proofServer: config.proofServer ?? config.proofServerUri,
      });
      const seedMaterial = [
        addresses?.shieldedAddress ?? "",
        addresses?.shieldedCoinPublicKey ?? "",
        addresses?.shieldedEncryptionPublicKey ?? "",
        (api as any).networkId ?? "preprod",
      ].join(":");
      const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seedMaterial)));
      setDeployIdentity(Array.from(hash, (byte) => byte.toString(16).padStart(2, "0")).join(""));
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect Lace wallet");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDeploy() {
    setError(null);
    setDeploying(true);
    setResults({});

    try {
      const freshSeed = new Uint8Array(32);
      crypto.getRandomValues(freshSeed);
      const hex = Array.from(freshSeed, (byte) => byte.toString(16).padStart(2, "0")).join("");
      setDeployIdentity(hex);
      console.info("[zeed] deploy:start accreditation");
      const accreditation = await deployAccreditationContract(`0x${hex}`);
      console.info("[zeed] deploy:accreditation done");
      await sleep(5000);
      console.info("[zeed] deploy:start founder_majority");
      const founderMajority = await deployFounderMajorityContract(`0x${hex}`, 5001);
      console.info("[zeed] deploy:founder_majority done");

      setResults({
        accreditation: accreditation.contractAddress,
        founderMajority: founderMajority.contractAddress,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deployment failed");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="soft-card p-8 sm:p-10 lg:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
            <ShieldCheck className="h-4 w-4 text-teal-950" />
            Midnight preprod deploy
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Connect Lace. Then deploy.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
            This page uses the browser extension only. No local wallet, no seed, no server-side deployer. It talks to the preprod wallet, proof server, and indexer provided by the extension.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-stone-200 bg-stone-50/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Step 1</p>
              <p className="mt-2 text-lg font-semibold">Connect Lace</p>
              <p className="mt-1 text-sm leading-6 text-stone-600">Unlock the wallet extension on preprod.</p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-stone-50/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Step 2</p>
              <p className="mt-2 text-lg font-semibold">Deploy contracts</p>
              <p className="mt-1 text-sm leading-6 text-stone-600">Deploy accreditation and founder control contracts.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleConnect}
              disabled={connecting || deploying}
              className="accent-button"
            >
              {connecting ? "Connecting..." : "Connect Lace"}
            </button>
            <button
              onClick={handleDeploy}
              disabled={!canDeploy}
              className="ghost-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deploying ? "Deploying..." : "Deploy"}
            </button>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {completed && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Both contracts deployed to Midnight preprod.</p>
            </div>
          )}
        </section>

        <section className="soft-card p-8 sm:p-10 lg:p-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Status</p>
              <h2 className="mt-2 text-2xl font-semibold">Preprod wiring</h2>
            </div>
            {deploying ? <Loader2 className="h-5 w-5 animate-spin text-teal-950" /> : connected ? <Wallet className="h-5 w-5 text-teal-950" /> : <CircleOff className="h-5 w-5 text-stone-400" />}
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-stone-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Wallet</p>
              <p className="mt-1 text-sm font-medium">{connected ? "Lace connected" : "Waiting for Lace"}</p>
              <p className="mt-1 text-sm text-stone-600">Network: {networkId}</p>
            </div>
            <div className="rounded-2xl bg-stone-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Proof server</p>
              <p className="mt-1 text-sm font-medium">{walletInfo?.proofServer ?? "Unavailable until wallet connect"}</p>
            </div>
            <div className="rounded-2xl bg-stone-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Indexer</p>
              <p className="mt-1 break-all text-sm font-medium">{walletInfo?.indexer ?? "Unavailable until wallet connect"}</p>
            </div>
            <div className="rounded-2xl bg-stone-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">RPC</p>
              <p className="mt-1 break-all text-sm font-medium">{walletInfo?.rpc ?? "Unavailable until wallet connect"}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-3xl border border-stone-200 bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Accreditation contract</p>
              <p className="mt-2 font-mono text-xs text-stone-700 break-all">
                {results.accreditation ?? "Not deployed yet"}
              </p>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Founder majority contract</p>
              <p className="mt-2 font-mono text-xs text-stone-700 break-all">
                {results.founderMajority ?? "Not deployed yet"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
