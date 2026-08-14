"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function OnboardingPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) router.push("/sign-in");
  }, [loading, session, router]);

  if (loading || !session) {
    return <div className="min-h-screen px-6 py-10">Loading...</div>;
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="soft-card p-8 sm:p-10 lg:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Onboarding</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Welcome, {session.user.name}.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
            Set up the first rooms in your workspace and move straight into
            clean deal operations.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            ["/companies/new", "Create a company", "Set up the issuer side of your workspace."],
            ["/investors/new", "Create an investor entity", "Add funds, SPVs, or individual investors."],
          ].map(([href, title, body]) => (
            <Link key={href} href={href} className="soft-card p-8 transition hover:-translate-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-950/70">Next step</p>
              <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={() => router.push("/dashboard")} className="accent-button">
            Go to dashboard
          </button>
          <button onClick={() => router.push("/dashboard")} className="ghost-button">
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}
