"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

export default function SignUpPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const signUp = trpc.auth.signUp.useMutation();
  const signIn = trpc.auth.signIn.useMutation();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await signUp.mutateAsync({ email, password, name });
      const result = await signIn.mutateAsync({ email, password });
      setSession({ user: { id: result.user.id, email: result.user.email, name: result.user.name } }, result.sessionToken);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="soft-card p-8 sm:p-10 lg:p-12">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Create your workspace.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
            Set up a clean, consistent home for your company, investor, and
            proof flows.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["Fast setup", "Name, email, password, and you’re in."],
              ["Better structure", "A calmer start than a crowded dashboard."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl bg-stone-50/90 p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-stone-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="soft-card p-8 sm:p-10 lg:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold">Create account</h2>
            <p className="mt-2 text-sm text-stone-600">One clean form. No clutter.</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Name</label>
              <input className="input-shell" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input className="input-shell" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <input className="input-shell" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
              <p className="mt-2 text-xs text-stone-500">Minimum 8 characters.</p>
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button type="submit" className="accent-button w-full" disabled={signUp.isPending}>
              {signUp.isPending ? "Creating..." : "Create account"}
            </button>
            <p className="text-center text-sm text-stone-600">
              Already have one? <Link href="/sign-in" className="font-semibold text-teal-950">Sign in</Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
