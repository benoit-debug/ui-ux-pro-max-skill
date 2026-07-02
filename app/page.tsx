import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LinkButton } from "@/components/ui/link-button";
import { ScoreRing } from "@/components/dashboard/score-ring";
import {
  BoltIcon,
  GaugeIcon,
  TrendIcon,
  UsersIcon,
} from "@/components/landing/icons";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    icon: BoltIcon,
    title: "Automatic capture",
    body: "Two 15-second check-ins and a read-only Google Calendar sync. No timers, no manual logging.",
  },
  {
    icon: GaugeIcon,
    title: "Explainable scores",
    body: "Every score comes with the why — “3h of free focus time, one meeting.” Never a black box.",
  },
  {
    icon: TrendIcon,
    title: "Trends & patterns",
    body: "7- and 30-day trends, plus insights like “your best output days have fewer meetings.”",
  },
  {
    icon: UsersIcon,
    title: "Group leaderboards",
    body: "Weekly leaderboards that reset every Monday. Compete on progress, opt out anytime, keep goals private.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Check in",
    body: "Set 1–3 priorities each morning, mark what you finished each evening. Fifteen seconds.",
  },
  {
    step: "02",
    title: "We measure",
    body: "Focus, Output, and Consistency — weighted into one composite score, computed from your real activity.",
  },
  {
    step: "03",
    title: "Improve",
    body: "See what drives your best days and build a sustainable rhythm, not a burnout streak.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard" : "/signup";
  const primaryLabel = user ? "Open dashboard" : "Get started";

  return (
    <div className="flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hidden hover:text-foreground sm:inline">
              Features
            </a>
            <a href="#how" className="hidden hover:text-foreground sm:inline">
              How it works
            </a>
            {!user && (
              <Link href="/login" className="hover:text-foreground">
                Log in
              </Link>
            )}
            <LinkButton href={primaryHref}>{primaryLabel}</LinkButton>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-10rem] h-[28rem] w-[42rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--accent), transparent)" }}
        />
        <div className="mx-auto max-w-3xl px-6 pb-4 pt-20 text-center sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Whoop, but for your work
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
            Measure the vitals of your workday.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Vitals turns your real work activity into Focus, Output, and
            Consistency scores — so you optimize for impact and rhythm, not
            busywork.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <LinkButton href={primaryHref}>{primaryLabel}</LinkButton>
            <LinkButton href="#how" variant="secondary">
              See how it works
            </LinkButton>
          </div>
        </div>

        {/* Product preview */}
        <div className="mx-auto max-w-3xl px-6 pb-20 pt-10">
          <div className="rounded-xl border border-border bg-card p-6 shadow-2xl sm:p-8">
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              Today&apos;s score
            </p>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
              <ScoreRing score={78} />
              <dl className="flex-1 space-y-3 text-sm">
                <div>
                  <dt className="font-medium">Focus 82/100</dt>
                  <dd className="text-muted-foreground">
                    2.5h in meetings today, with one 90+ minute deep-work block.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Output 67/100</dt>
                  <dd className="text-muted-foreground">
                    Finished a high-difficulty goal — weighted above easy wins.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Consistency 86/100</dt>
                  <dd className="text-muted-foreground">
                    Hit your goals on 6 of the last 7 days.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Built to reward impact, not activity.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Volume of tasks is a vanity metric. Vitals measures the quality of
              your focus, the weight of what you ship, and how steadily you show
              up.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-accent">
                  <f.icon />
                </span>
                <h3 className="mt-4 font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step}>
                <span className="font-mono text-sm text-accent">{s.step}</span>
                <h3 className="mt-2 font-medium">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Start measuring what matters.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Free while in beta. English-only for now. Your goals stay private —
            groups only ever see composite scores.
          </p>
          <div className="mt-8">
            <LinkButton href={primaryHref}>{primaryLabel}</LinkButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <div className="space-y-1 text-center sm:text-left">
            <Logo />
            <p className="text-xs text-muted-foreground">
              The vitals of your workday.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
