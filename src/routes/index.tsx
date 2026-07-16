import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";

const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "";
  } catch {
    return "";
  }
});

export const Route = createFileRoute("/")({
  loader: () => getBusinessName(),
  component: Home,
});

// ─── SVG Icon Components ───

function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="60" y1="20" x2="60" y2="100">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
      </defs>
      <polygon points="60,20 20,80 100,80" fill="url(#logo-grad)" opacity="0.9" />
      <line x1="60" y1="8" x2="60" y2="24" stroke="#e0e7ff" strokeWidth="2.5" opacity="0.8" />
      <circle cx="60" cy="6" r="2" fill="#e0e7ff" opacity="0.6" />
    </svg>
  );
}

function IconIngest({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.5V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6" />
      <path d="M8 10h8" opacity="0.6" />
      <path d="M8 14h6" opacity="0.6" />
      <path d="M4 18a2 2 0 1 0 0 4h14" />
      <circle cx="4" cy="20" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function IconAnalyze({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 4 4-6" strokeWidth="1.5" />
      <circle cx="19" cy="7" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

function IconApprove({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l2 2" opacity="0.5" />
    </svg>
  );
}

function IconClock({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function IconShield({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" opacity="0.7" />
    </svg>
  );
}

function IconTrending({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 7l-7 7-4-4-6 6" />
      <path d="M16 7h6v6" />
    </svg>
  );
}

function IconEye({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconCheckCircle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconArrowRight({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── Home Page Component ───

function Home() {
  const businessName = Route.useLoaderData();

  return (
    <div className="flex min-h-dvh flex-col bg-white dark:bg-navy-900">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 border-b border-navy-100 bg-white/80 backdrop-blur-lg dark:border-navy-800 dark:bg-navy-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-bold tracking-tight text-navy-900 dark:text-white">
              {businessName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-navy-600 transition-colors hover:text-navy-900 dark:text-navy-400 dark:hover:text-white"
            >
              Sign in
            </a>
            <a
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-indigo-700"
            >
              Get started
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 bg-gradient-radial from-indigo-50/60 to-transparent dark:from-indigo-950/20" />

        <div className="mx-auto max-w-7xl px-6 pb-20 pt-16 sm:px-10 sm:pt-24 lg:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              AI Project Co-Pilot
            </div>

            {/* Headline */}
            <h1 className="animate-slide-up text-balance text-4xl font-extrabold tracking-tight text-navy-900 dark:text-white sm:text-5xl lg:text-6xl">
              Your AI co-pilot runs the project{" "}
              <span className="text-indigo-600 dark:text-indigo-400">alongside you</span>.
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl animate-slide-up text-balance text-lg leading-relaxed text-navy-500 dark:text-navy-400 sm:text-xl" style={{ animationDelay: "0.1s" }}>
              Not another tracker. Prism PM reads daily reports, updates schedules and budgets,
              analyzes risk in real time, and communicates with suppliers — all while{" "}
              <span className="font-medium text-navy-700 dark:text-navy-300">keeping you in control</span>.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex animate-slide-up flex-col items-center justify-center gap-4 sm:flex-row" style={{ animationDelay: "0.2s" }}>
              <a
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl dark:shadow-indigo-950"
              >
                Start your free trial
                <IconArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-7 py-3.5 text-base font-semibold text-navy-700 transition-all hover:border-navy-300 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-300 dark:hover:border-navy-600 dark:hover:bg-navy-750"
              >
                View dashboard
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="border-t border-navy-100 bg-navy-50/50 py-20 dark:border-navy-800 dark:bg-navy-900/50">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white sm:text-4xl">
              How the AI Co-Pilot works
            </h2>
            <p className="mt-4 text-lg text-navy-500 dark:text-navy-400">
              Three steps to a calmer, more productive day. The AI does the work. You make the decisions.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Connect your projects",
                desc: "Link your existing schedules, budgets, and reports. Prism ingests everything — no manual data entry required.",
                icon: <IconIngest className="h-8 w-8" />,
                step: "01",
              },
              {
                title: "AI works overnight",
                desc: "Daily reports are parsed, schedules are updated, budgets are tracked, risks are flagged, and supplier communications are drafted.",
                icon: <IconAnalyze className="h-8 w-8" />,
                step: "02",
              },
              {
                title: "You review and verify",
                desc: "Every morning, review what the AI recommends. Approve with one click. The AI executes. You stay in control, never surprised.",
                icon: <IconApprove className="h-8 w-8" />,
                step: "03",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="group rounded-2xl border border-navy-200 bg-white p-8 transition-all hover:border-indigo-200 hover:shadow-lg dark:border-navy-700 dark:bg-navy-800 dark:hover:border-indigo-800"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                    {step.icon}
                  </div>
                  <span className="text-sm font-mono font-medium text-navy-300 dark:text-navy-600">
                    {step.step}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-navy-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-navy-500 dark:text-navy-400">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Differentiation ─── */}
      <section className="py-20 dark:bg-navy-900">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white sm:text-4xl">
              A system of execution, not a system of record
            </h2>
            <p className="mt-4 text-lg text-navy-500 dark:text-navy-400">
              Traditional tools mirror spreadsheets. Prism PM understands your project and helps move it forward.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-px overflow-hidden rounded-2xl border border-navy-200 dark:border-navy-700 sm:grid-cols-2">
            {/* Traditional column */}
            <div className="bg-navy-50 p-8 dark:bg-navy-800/50">
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-navy-400 dark:text-navy-500">
                Traditional software
              </h3>
              <ul className="space-y-4">
                {[
                  "Stores information",
                  "Reports problems",
                  "Waits for users to act",
                  "Mirrors spreadsheets",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-navy-500 dark:text-navy-400">
                    <svg className="h-4 w-4 shrink-0 text-navy-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Prism column */}
            <div className="bg-indigo-50 p-8 dark:bg-indigo-950/30">
              <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Prism PM
              </h3>
              <ul className="space-y-4">
                {[
                  "Understands information",
                  "Helps solve problems",
                  "Works proactively",
                  "Replaces spreadsheets",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    <svg className="h-4 w-4 shrink-0 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Trust Section ─── */}
      <section className="border-t border-navy-100 bg-white py-20 dark:border-navy-800 dark:bg-navy-900">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white sm:text-4xl">
              Trust, not black boxes
            </h2>
            <p className="mt-4 text-lg text-navy-500 dark:text-navy-400">
              AI never replaces accountability. Every recommendation is explainable. Every action is traceable.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
            {[
              {
                icon: <IconShield className="h-6 w-6" />,
                title: "PM Verification",
                desc: "Every significant action surfaces options. The PM reviews and approves before anything executes. No surprises.",
              },
              {
                icon: <IconEye className="h-6 w-6" />,
                title: "Explainable AI",
                desc: "Every recommendation explains what it is, why it's being made, how confident the AI is, and what alternatives exist.",
              },
              {
                icon: <IconTrending className="h-6 w-6" />,
                title: "Full traceability",
                desc: "Every automated action is logged. Every prediction is documented. You can always see how a decision was reached.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-navy-200 bg-navy-50/50 p-6 dark:border-navy-700 dark:bg-navy-800/50">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {item.icon}
                </div>
                <h3 className="mb-2 font-semibold text-navy-900 dark:text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-navy-500 dark:text-navy-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Outcomes ─── */}
      <section className="border-t border-navy-100 bg-navy-50/50 py-20 dark:border-navy-800 dark:bg-navy-900/50">
        <div className="mx-auto max-w-7xl px-6 sm:px-10">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white sm:text-4xl">
              What changes for project managers
            </h2>
            <p className="mt-4 text-lg text-navy-500 dark:text-navy-400">
              Prism PM transforms how you spend your day — less time on busywork, more time leading.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                stat: "3+ hours",
                label: "saved per day on status updates",
                icon: <IconClock className="h-5 w-5" />,
              },
              {
                stat: "80%",
                label: "of risks flagged before they impact the project",
                icon: <IconCheckCircle className="h-5 w-5" />,
              },
              {
                stat: "10x",
                label: "faster supplier communication cycles",
                icon: <IconTrending className="h-5 w-5" />,
              },
              {
                stat: "100%",
                label: "PM control over all significant decisions",
                icon: <IconShield className="h-5 w-5" />,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-navy-200 bg-white p-6 text-center dark:border-navy-700 dark:bg-navy-800"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                  {item.icon}
                </div>
                <div className="text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
                  {item.stat}
                </div>
                <div className="mt-1 text-sm text-navy-500 dark:text-navy-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="border-t border-navy-100 bg-white py-20 dark:border-navy-800 dark:bg-navy-900">
        <div className="mx-auto max-w-2xl px-6 text-center sm:px-10">
          <h2 className="text-3xl font-bold tracking-tight text-navy-900 dark:text-white sm:text-4xl">
            Ready to start your day informed?
          </h2>
          <p className="mt-4 text-lg text-navy-500 dark:text-navy-400">
            Join the project managers who start every morning knowing exactly what changed, what needs attention, and what's at risk.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl dark:shadow-indigo-950"
            >
              Start your free trial
              <IconArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/dashboard"
              className="rounded-xl border border-navy-200 bg-white px-7 py-3.5 text-base font-semibold text-navy-700 transition-all hover:border-navy-300 hover:bg-navy-50 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-300 dark:hover:border-navy-600"
            >
              View dashboard
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-navy-100 bg-white px-6 py-10 dark:border-navy-800 dark:bg-navy-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-6 w-6" />
            <span className="text-sm font-semibold text-navy-900 dark:text-white">{businessName}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-navy-400 dark:text-navy-500">
            <a href="/dashboard" className="transition-colors hover:text-navy-600 dark:hover:text-navy-300">
              Dashboard
            </a>
            <a href="/login" className="transition-colors hover:text-navy-600 dark:hover:text-navy-300">
              Sign in
            </a>
            <span>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}