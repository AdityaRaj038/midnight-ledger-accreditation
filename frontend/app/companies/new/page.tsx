"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

export default function NewCompanyPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const createCompany = trpc.company.create.useMutation();
  const [formData, setFormData] = useState({
    legalName: "",
    dba: "",
    stateOfIncorp: "DE",
    entityType: "C-Corp",
    ein: "",
    formationDate: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
    authorizedShares: "",
  });

  useEffect(() => {
    if (!loading && !session) router.push("/sign-in");
  }, [loading, session, router]);

  if (loading || !session) return <div className="min-h-screen px-6 py-10">Loading...</div>;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const company = await createCompany.mutateAsync({
        legalName: formData.legalName,
        dba: formData.dba || undefined,
        stateOfIncorp: formData.stateOfIncorp,
        entityType: formData.entityType,
        ein: formData.ein || undefined,
        formationDate: formData.formationDate ? new Date(formData.formationDate) : undefined,
        primaryAddress: { street: formData.street, city: formData.city, state: formData.state, zip: formData.zip, country: formData.country },
        authorizedShares: formData.authorizedShares ? BigInt(formData.authorizedShares) : undefined,
      });
      router.push(`/companies/${company.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create company");
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <section className="soft-card p-8 sm:p-10 lg:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Company setup</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Create a new company.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">A calmer entry form for issuer records, addresses, and share setup.</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-8">
            <section className="grid gap-4">
              <h2 className="text-lg font-semibold">Legal information</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="input-shell" placeholder="Legal name *" value={formData.legalName} onChange={(e) => setFormData({ ...formData, legalName: e.target.value })} required />
                <input className="input-shell" placeholder="DBA" value={formData.dba} onChange={(e) => setFormData({ ...formData, dba: e.target.value })} />
                <input className="input-shell" placeholder="State of incorporation *" value={formData.stateOfIncorp} onChange={(e) => setFormData({ ...formData, stateOfIncorp: e.target.value })} required />
                <select className="input-shell" value={formData.entityType} onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}>
                  <option>C-Corp</option><option>S-Corp</option><option>LLC</option><option>Partnership</option>
                </select>
                <input className="input-shell" placeholder="EIN" value={formData.ein} onChange={(e) => setFormData({ ...formData, ein: e.target.value })} />
                <input className="input-shell" type="date" value={formData.formationDate} onChange={(e) => setFormData({ ...formData, formationDate: e.target.value })} />
                <input className="input-shell" type="number" placeholder="Authorized shares" value={formData.authorizedShares} onChange={(e) => setFormData({ ...formData, authorizedShares: e.target.value })} />
              </div>
            </section>

            <section className="grid gap-4">
              <h2 className="text-lg font-semibold">Primary address</h2>
              <input className="input-shell" placeholder="Street *" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} required />
              <div className="grid gap-4 md:grid-cols-2">
                <input className="input-shell" placeholder="City *" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
                <input className="input-shell" placeholder="State *" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
                <input className="input-shell" placeholder="ZIP *" value={formData.zip} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} required />
                <input className="input-shell" placeholder="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
              </div>
            </section>

            {error && <p className="text-sm text-red-700">{error}</p>}
            <button className="accent-button w-full" disabled={createCompany.isPending}>
              {createCompany.isPending ? "Creating..." : "Create company"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
