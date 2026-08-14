"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, ShieldCheck, DollarSign, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";
import { useWallet } from "@/lib/wallet-context";
import { proveByIncomeOnChain, proveByNetWorthOnChain } from "@/lib/midnight/accreditation-service";

async function identityFromUserId(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function AccreditationPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const { status: walletStatus } = useWallet();
  const [method, setMethod] = useState<"income" | "netWorth" | null>(null);
  const [amount, setAmount] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [error, setError] = useState("");
  const [chainStatus, setChainStatus] = useState("");
  const utils = trpc.useUtils();

  const { data: proof, isLoading: proofLoading } = trpc.accreditation.getMyProof.useQuery(undefined, { enabled: !!session });
  const { data: validity } = trpc.accreditation.checkValidity.useQuery(undefined, { enabled: !!session && !!proof });

  const proveByIncome = trpc.accreditation.proveByIncome.useMutation({ onSuccess: () => { utils.accreditation.getMyProof.invalidate(); utils.accreditation.checkValidity.invalidate(); } });
  const proveByNetWorth = trpc.accreditation.proveByNetWorth.useMutation({ onSuccess: () => { utils.accreditation.getMyProof.invalidate(); utils.accreditation.checkValidity.invalidate(); } });
  const revoke = trpc.accreditation.revoke.useMutation({ onSuccess: () => { utils.accreditation.getMyProof.invalidate(); utils.accreditation.checkValidity.invalidate(); } });

  useEffect(() => {
    if (!loading && !session) router.push("/sign-in");
  }, [loading, session, router]);

  if (loading || !session) {
    return <div className="min-h-screen px-6 py-10">Loading...</div>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!session) return;
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    const cents = Math.round(amountNum * 100).toString();
    const address = contractAddress.trim();
    if (walletStatus !== "connected") {
      setError("Connect a 1AM wallet before generating a proof.");
      return;
    }
    if (!/^(0x)?[0-9a-f]{64}$/i.test(address)) {
      setError("Enter deployed 32-byte Midnight contract address.");
      return;
    }

    try {
      setChainStatus("Generating zero-knowledge proof and submitting transaction…");
      const investorId = await identityFromUserId(session.user.id);
      if (method === "income") {
        await proveByIncomeOnChain(address, BigInt(cents), investorId);
        await proveByIncome.mutateAsync({ annualIncomeCents: cents, contractAddress: address });
      } else {
        await proveByNetWorthOnChain(address, BigInt(cents), investorId);
        await proveByNetWorth.mutateAsync({ netWorthCents: cents, contractAddress: address });
      }
      setChainStatus("Proof transaction submitted. Local record updated after wallet call completed.");
    } catch (cause) {
      setChainStatus("");
      setError(cause instanceof Error ? cause.message : "Proof transaction failed.");
    }
  }

  const isValid = validity?.valid;
  const busy = proveByIncome.isPending || proveByNetWorth.isPending || Boolean(chainStatus && !chainStatus.startsWith("Proof transaction submitted"));

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <nav className="soft-card flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-xl border border-stone-300 bg-white/70 p-2">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Proof room</p>
              <h1 className="text-lg font-semibold">Accreditation</h1>
            </div>
          </div>
          <ShieldCheck className="h-5 w-5 text-teal-950" />
        </nav>

        <section className="soft-card p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Current state</p>
          <h2 className="mt-3 text-2xl font-semibold">
            {proof ? (isValid ? "Proof active" : "Proof expired") : "No proof on file"}
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Keep accreditation status available without turning the page into a security dashboard from 2019.
          </p>
          {proof && (
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-stone-600">
              <span className="rounded-full bg-stone-100 px-3 py-1">{proof.proofType}</span>
              {proof.contractAddress && <span className="rounded-full bg-stone-100 px-3 py-1 font-mono">{proof.contractAddress}</span>}
              <span className="rounded-full bg-stone-100 px-3 py-1">{new Date(proof.expiresAt).toLocaleDateString()}</span>
            </div>
          )}
          {proof && (
            <button onClick={() => revoke.mutate()} className="mt-5 text-sm font-semibold text-teal-950">
              Revoke proof
            </button>
          )}
        </section>

        {(!proof || !isValid) && (
          <section className="soft-card p-8">
            <h2 className="text-2xl font-semibold">Submit accreditation proof</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Your amount stays in your wallet witness. Midnight records only a successful accreditation claim and its public timing.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button onClick={() => setMethod("income")} className={`rounded-2xl border p-5 text-left ${method === "income" ? "border-teal-950 bg-teal-950/5" : "border-stone-300 bg-white/70"}`}>
                <DollarSign className="h-5 w-5 text-teal-950" />
                <p className="mt-3 font-semibold">By income</p>
                <p className="mt-1 text-sm text-stone-600">Annual income at or above $200,000.</p>
              </button>
              <button onClick={() => setMethod("netWorth")} className={`rounded-2xl border p-5 text-left ${method === "netWorth" ? "border-teal-950 bg-teal-950/5" : "border-stone-300 bg-white/70"}`}>
                <TrendingUp className="h-5 w-5 text-teal-950" />
                <p className="mt-3 font-semibold">By net worth</p>
                <p className="mt-1 text-sm text-stone-600">Net worth at or above $1,000,000.</p>
              </button>
            </div>

            {method && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <input className="input-shell" type="number" min="0" step="1" placeholder={method === "income" ? "200000" : "1000000"} value={amount} onChange={(e) => setAmount(e.target.value)} />
                <input className="input-shell font-mono" type="text" placeholder="Deployed accreditation contract address (required)" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
                {error && <p className="text-sm text-red-700">{error}</p>}
                {chainStatus && <p className="text-sm text-stone-600" role="status">{chainStatus}</p>}
                <button className="accent-button w-full" disabled={busy}>{busy ? "Submitting..." : "Submit proof"}</button>
              </form>
            )}
          </section>
        )}

        {proof && isValid && (
          <section className="soft-card flex items-center gap-4 p-8">
            <CheckCircle className="h-10 w-10 text-teal-950" />
            <div>
              <h2 className="text-2xl font-semibold">Proof submitted</h2>
              <p className="mt-1 text-sm text-stone-600">Your accreditation proof is valid and ready for investor flows.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
