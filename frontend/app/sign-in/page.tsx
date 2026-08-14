"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

export default function SignInPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const signIn = trpc.auth.signIn.useMutation();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await signIn.mutateAsync({ email, password });
      setSession({ user: { id: result.user.id, email: result.user.email, name: result.user.name } }, result.sessionToken);
      router.push("/dashboard");
    } catch {
      setError("Bad email or password.");
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="soft-card relative overflow-hidden p-8 sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(19,78,74,0.14),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(176,117,62,0.15),_transparent_26%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex rounded-full border border-stone-300 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Secure access
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Welcome back to Midnight Ledger.
            </h1>
            <p className="max-w-xl text-base leading-7 text-stone-600">
              Return to your company rooms, deal flows, and proof records with a
              calmer workspace and fewer distractions.
            </p>
            <div className="rounded-[1.5rem] bg-teal-950 p-6 text-stone-50">
              <p className="text-sm uppercase tracking-[0.24em] text-stone-200/80">Focus</p>
              <p className="mt-3 text-lg leading-7">
                No purple neon. No busy chrome. Just structured controls and
                clear action states.
              </p>
            </div>
          </div>
        </section>

        <section className="soft-card p-8 sm:p-10 lg:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="mt-2 text-sm text-stone-600">
              Enter your account details to continue.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input className="input-shell" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <input className="input-shell" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button type="submit" className="accent-button w-full" disabled={signIn.isPending}>
              {signIn.isPending ? "Signing in..." : "Sign in"}
            </button>
            <p className="text-center text-sm text-stone-600">
              New here? <Link href="/sign-up" className="font-semibold text-teal-950">Create an account</Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
