import Link from "next/link";

const pillars = [
  "Clear issuance flow for SAFEs and notes",
  "Cap table and deal rooms in one place",
  "Midnight-backed proof surfaces with restraint",
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-8 text-foreground">
      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="soft-card relative overflow-hidden p-8 sm:p-10 lg:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(19,78,74,0.12),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(176,117,62,0.16),_transparent_30%)]" />
          <div className="relative space-y-8">
            <div className="inline-flex rounded-full border border-teal-900/15 bg-teal-950/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-teal-950">
              Midnight Ledger
            </div>
            <div className="max-w-2xl space-y-6">
              <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Fundraising tools with a calmer, sharper face.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-stone-700">
                Run company setup, investor onboarding, deal rooms, and proof
                workflows in one place. Built for founders who want clarity,
                not spectacle.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className="accent-button">
                Start building
              </Link>
              <Link href="/sign-in" className="ghost-button">
                Sign in
              </Link>
            </div>
            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              {pillars.map((item) => (
                <div key={item} className="rounded-2xl border border-stone-300/70 bg-white/70 p-4 text-sm text-stone-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="soft-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              What it does
            </p>
            <div className="mt-4 space-y-4">
              {[
                ["Company rooms", "Create entities, cap tables, and deal stacks without maze-like screens."],
                ["Investor rooms", "Onboard funds and people with a cleaner, more focused flow."],
                ["Proof layer", "Keep selective disclosure and accreditation in a calm, trustworthy shell."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl bg-stone-50/80 p-4">
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="soft-card overflow-hidden p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Tone
            </p>
            <div className="mt-4 rounded-[1.5rem] bg-gradient-to-br from-teal-950 via-teal-900 to-stone-900 p-6 text-stone-50 shadow-inner">
              <p className="text-sm uppercase tracking-[0.24em] text-stone-200/80">
                Design direction
              </p>
              <p className="mt-3 text-2xl font-semibold leading-tight">
                Quiet luxury. Paper texture. Structured spacing. No neon fog.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
