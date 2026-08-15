"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

export default function NewInvestorPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const createInvestor = trpc.investor.create.useMutation();
  const [formData, setFormData] = useState({
    entityName: "",
    entityType: "INDIVIDUAL",
    jurisdiction: "DE",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
  });

  useEffect(() => {
    if (!loading && !session) router.push("/sign-in");
  }, [loading, session, router]);

  if (loading || !session) return <div className="min-h-screen px-6 py-10">Loading...</div>;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const investor = await createInvestor.mutateAsync({
        entityName: formData.entityName,
        entityType: formData.entityType as "INDIVIDUAL" | "FUND" | "SPV" | "ANGEL_GROUP",
        jurisdiction: formData.jurisdiction,
        address: { street: formData.street, city: formData.city, state: formData.state, zip: formData.zip, country: formData.country },
      });
      router.push(`/investors/${investor.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create investor");
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <section className="soft-card p-8 sm:p-10 lg:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Investor setup</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Create an investor entity.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">A cleaner intake path for funds, SPVs, and individuals.</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-8">
            <section className="grid gap-4">
              <h2 className="text-lg font-semibold">Investor information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="input-shell" placeholder="Entity name *" value={formData.entityName} onChange={(e) => setFormData({ ...formData, entityName: e.target.value })} required />
                <select className="input-shell" value={formData.entityType} onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="FUND">Fund</option>
                  <option value="SPV">SPV</option>
                  <option value="ANGEL_GROUP">Angel Group</option>
                </select>
                <input className="input-shell" placeholder="Jurisdiction *" value={formData.jurisdiction} onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })} />
              </div>
            </section>

            <section className="grid gap-4">
              <h2 className="text-lg font-semibold">Address</h2>
              <input className="input-shell" placeholder="Street *" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} required />
              <div className="grid gap-4 md:grid-cols-2">
                <input className="input-shell" placeholder="City *" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
                <input className="input-shell" placeholder="State *" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
                <input className="input-shell" placeholder="ZIP *" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} required />
                <input className="input-shell" placeholder="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
              </div>
            </section>

            {error && <p className="text-sm text-red-700">{error}</p>}
            <button className="accent-button w-full" disabled={createInvestor.isPending}>
              {createInvestor.isPending ? "Creating..." : "Create investor"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
