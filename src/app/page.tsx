"use client";

import { useEffect, useMemo, useState } from "react";

type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

type ToolName =
  | "Cursor"
  | "GitHub Copilot"
  | "Claude"
  | "ChatGPT"
  | "Anthropic API direct"
  | "OpenAI API direct"
  | "Gemini"
  | "Windsurf";

type ToolEntry = {
  id: string;
  tool: ToolName;
  plan: string;
  monthlySpend: number;
  seats: number;
};

type AuditItem = {
  tool: string;
  currentSpend: number;
  recommendedSpend: number;
  savings: number;
  action: string;
  reason: string;
};

const PLAN_PRICES: Record<ToolName, { name: string; price: number }[]> = {
  Cursor: [
    { name: "Hobby", price: 0 },
    { name: "Pro", price: 20 },
    { name: "Business", price: 40 },
    { name: "Enterprise", price: 0 },
  ],
  "GitHub Copilot": [
    { name: "Individual", price: 10 },
    { name: "Business", price: 19 },
    { name: "Enterprise", price: 39 },
  ],
  Claude: [
    { name: "Free", price: 0 },
    { name: "Pro", price: 20 },
    { name: "Max", price: 100 },
    { name: "Team", price: 25 },
    { name: "Enterprise", price: 20 },
    { name: "API direct", price: 0 },
  ],
  ChatGPT: [
    { name: "Plus", price: 20 },
    { name: "Pro", price: 200 },
    { name: "Business", price: 25 },
    { name: "Enterprise", price: 0 },
    { name: "API direct", price: 0 },
  ],
  "Anthropic API direct": [
    { name: "API direct", price: 0 },
    { name: "Sonnet usage", price: 0 },
    { name: "Haiku usage", price: 0 },
  ],
  "OpenAI API direct": [
    { name: "API direct", price: 0 },
    { name: "High-volume API", price: 0 },
  ],
  Gemini: [
    { name: "Pro", price: 20 },
    { name: "Ultra", price: 250 },
    { name: "API direct", price: 0 },
  ],
  Windsurf: [
    { name: "Free", price: 0 },
    { name: "Pro", price: 20 },
    { name: "Max", price: 200 },
    { name: "Teams", price: 40 },
    { name: "Enterprise", price: 0 },
  ],
};

const DEFAULT_TOOLS: ToolEntry[] = [
  {
    id: "1",
    tool: "Cursor",
    plan: "Business",
    monthlySpend: 240,
    seats: 6,
  },
  {
    id: "2",
    tool: "ChatGPT",
    plan: "Business",
    monthlySpend: 150,
    seats: 6,
  },
];

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function getPlanPrice(tool: ToolName, plan: string) {
  return PLAN_PRICES[tool].find((p) => p.name === plan)?.price ?? 0;
}

function auditTool(entry: ToolEntry, teamSize: number, useCase: UseCase): AuditItem {
  const currentSpend = Math.max(0, Number(entry.monthlySpend) || 0);
  const seats = Math.max(1, Number(entry.seats) || 1);
  const price = getPlanPrice(entry.tool, entry.plan);
  const expectedRetail = price > 0 ? price * seats : currentSpend;

  let recommendedSpend = expectedRetail;
  let action = "Keep current plan";
  let reason = "This plan looks reasonable for the selected team size and use case.";

  const teamOrEnterprisePlan =
    entry.plan.toLowerCase().includes("team") ||
    entry.plan.toLowerCase().includes("business") ||
    entry.plan.toLowerCase().includes("enterprise");

  const apiPlan =
    entry.tool.includes("API") || entry.plan.toLowerCase().includes("api");

  if (teamSize <= 2 && teamOrEnterprisePlan) {
    const individualPlan =
      entry.tool === "GitHub Copilot"
        ? 10
        : entry.tool === "ChatGPT"
        ? 20
        : entry.tool === "Claude"
        ? 20
        : entry.tool === "Cursor"
        ? 20
        : entry.tool === "Windsurf"
        ? 20
        : price;

    recommendedSpend = individualPlan * seats;
    action = "Downgrade to individual/pro plan";
    reason =
      "Team or enterprise billing is usually overkill for very small teams unless admin/security controls are required.";
  }

  if (seats > teamSize) {
    const activeSeatSpend = price > 0 ? price * teamSize : currentSpend * 0.75;
    recommendedSpend = Math.min(recommendedSpend, activeSeatSpend);
    action = "Remove inactive or extra seats";
    reason =
      "The number of paid seats is higher than the team size, so some seats may be unused.";
  }

  if (apiPlan && currentSpend >= 300) {
    recommendedSpend = Math.min(recommendedSpend, currentSpend * 0.8);
    action = "Explore discounted credits";
    reason =
      "High API spend is a strong fit for negotiated or discounted infrastructure credits instead of paying pure retail.";
  }

  if (useCase === "coding" && entry.tool === "ChatGPT" && entry.plan === "Pro") {
    recommendedSpend = Math.min(recommendedSpend, 40 * seats);
    action = "Use a coding-focused plan for most developers";
    reason =
      "For coding-heavy teams, a dedicated coding assistant plan can be cheaper than giving every developer an expensive general-purpose plan.";
  }

  if (currentSpend > expectedRetail * 1.25 && price > 0) {
    recommendedSpend = Math.min(recommendedSpend, expectedRetail);
    action = "Check billing against public retail price";
    reason =
      "Your entered spend is noticeably higher than the estimated public plan price for the same number of seats.";
  }

  const savings = Math.max(0, currentSpend - recommendedSpend);

  if (savings < 10) {
    return {
      tool: `${entry.tool} ${entry.plan}`,
      currentSpend,
      recommendedSpend: currentSpend,
      savings: 0,
      action: "Looks optimized",
      reason: "No obvious overspend was found from the current inputs.",
    };
  }

  return {
    tool: `${entry.tool} ${entry.plan}`,
    currentSpend,
    recommendedSpend,
    savings,
    action,
    reason,
  };
}

export default function Home() {
  const [teamSize, setTeamSize] = useState(6);
  const [useCase, setUseCase] = useState<UseCase>("coding");
  const [tools, setTools] = useState<ToolEntry[]>(DEFAULT_TOOLS);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [savedLead, setSavedLead] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ai-spend-doctor-state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTeamSize(parsed.teamSize ?? 6);
        setUseCase(parsed.useCase ?? "coding");
        setTools(parsed.tools ?? DEFAULT_TOOLS);
      } catch {
        setTools(DEFAULT_TOOLS);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "ai-spend-doctor-state",
      JSON.stringify({ teamSize, useCase, tools })
    );
  }, [teamSize, useCase, tools]);

  const audit = useMemo(
    () => tools.map((tool) => auditTool(tool, teamSize, useCase)),
    [tools, teamSize, useCase]
  );

  const totalMonthlySavings = audit.reduce((sum, item) => sum + item.savings, 0);
  const totalAnnualSavings = totalMonthlySavings * 12;
  const totalSpend = tools.reduce((sum, item) => sum + Number(item.monthlySpend || 0), 0);

  const summary =
    totalMonthlySavings > 500
      ? `Your AI stack shows a strong savings opportunity. Most of the waste appears to come from over-provisioned seats, team plans used by small groups, and high retail API spend. Credex could help convert these findings into real savings through discounted AI infrastructure credits.`
      : totalMonthlySavings > 100
      ? `Your AI spend is mostly reasonable, but there are a few clear optimization opportunities. The fastest wins are reducing unused seats, checking plan fit, and moving heavy retail usage toward a more efficient credit strategy.`
      : `Your AI spend looks disciplined based on the information provided. There may still be future savings as new plans, discounts, or credits become available, but there is no major waste visible right now.`;

  function updateTool(id: string, patch: Partial<ToolEntry>) {
    setTools((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function addTool() {
    setTools((current) => [
      ...current,
      {
        id: String(Date.now()),
        tool: "Claude",
        plan: "Pro",
        monthlySpend: 20,
        seats: 1,
      },
    ]);
  }

  function removeTool(id: string) {
    setTools((current) => current.filter((item) => item.id !== id));
  }

  function handleLeadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavedLead(true);
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-12 px-5 py-10 md:px-8 lg:px-12">
        <nav className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-300">AI Spend Doctor</p>
            <h1 className="text-xl font-bold">Free AI Tool Spend Audit</h1>
          </div>
          <a
            href="#audit"
            className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Start audit
          </a>
        </nav>

        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              Built for startup founders and engineering managers
            </div>

            <h2 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              Find hidden waste in your AI tool spend.
            </h2>

            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              Enter your AI tools, plans, seats, and monthly spend. Get an instant
              audit showing where to downgrade, switch, or use discounted credits.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-3xl font-black">{money(totalSpend)}</p>
                <p className="mt-1 text-sm text-slate-400">Current monthly spend</p>
              </div>
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5">
                <p className="text-3xl font-black text-cyan-300">
                  {money(totalMonthlySavings)}
                </p>
                <p className="mt-1 text-sm text-slate-300">Monthly savings found</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                <p className="text-3xl font-black text-emerald-300">
                  {money(totalAnnualSavings)}
                </p>
                <p className="mt-1 text-sm text-slate-300">Annual savings found</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
            <p className="text-sm font-semibold text-cyan-300">Instant audit preview</p>
            <h3 className="mt-2 text-2xl font-bold">Your personalized summary</h3>
            <p className="mt-4 rounded-2xl bg-slate-950/60 p-5 leading-7 text-slate-300">
              {summary}
            </p>

            {totalMonthlySavings > 500 && (
              <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
                <p className="font-bold text-amber-200">High-savings case detected</p>
                <p className="mt-2 text-sm text-amber-100/80">
                  This audit is a strong fit for a Credex consultation because the
                  savings opportunity is above $500/month.
                </p>
              </div>
            )}
          </div>
        </section>

        <section id="audit" className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="mb-6">
              <p className="text-sm font-semibold text-cyan-300">Step 1</p>
              <h3 className="text-3xl font-black">Enter your AI stack</h3>
              <p className="mt-2 text-slate-400">
                This form saves automatically, even after page reload.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-slate-300">Team size</span>
                <input
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  type="number"
                  min={1}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-cyan-400/40 focus:ring-4"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Primary use case</span>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value as UseCase)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-cyan-400/40 focus:ring-4"
                >
                  <option value="coding">Coding</option>
                  <option value="writing">Writing</option>
                  <option value="data">Data</option>
                  <option value="research">Research</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
            </div>

            <div className="mt-6 space-y-4">
              {tools.map((entry, index) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-bold">Tool #{index + 1}</p>
                    {tools.length > 1 && (
                      <button
                        onClick={() => removeTool(entry.id)}
                        className="text-sm font-semibold text-red-300 hover:text-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="text-sm text-slate-300">AI tool</span>
                      <select
                        value={entry.tool}
                        onChange={(e) => {
                          const newTool = e.target.value as ToolName;
                          updateTool(entry.id, {
                            tool: newTool,
                            plan: PLAN_PRICES[newTool][0].name,
                          });
                        }}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                      >
                        {Object.keys(PLAN_PRICES).map((tool) => (
                          <option key={tool} value={tool}>
                            {tool}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="text-sm text-slate-300">Plan</span>
                      <select
                        value={entry.plan}
                        onChange={(e) => updateTool(entry.id, { plan: e.target.value })}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                      >
                        {PLAN_PRICES[entry.tool].map((plan) => (
                          <option key={plan.name} value={plan.name}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="text-sm text-slate-300">Monthly spend ($)</span>
                      <input
                        value={entry.monthlySpend}
                        onChange={(e) =>
                          updateTool(entry.id, {
                            monthlySpend: Number(e.target.value),
                          })
                        }
                        type="number"
                        min={0}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                      />
                    </label>

                    <label>
                      <span className="text-sm text-slate-300">Paid seats</span>
                      <input
                        value={entry.seats}
                        onChange={(e) =>
                          updateTool(entry.id, { seats: Number(e.target.value) })
                        }
                        type="number"
                        min={1}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addTool}
              className="mt-5 w-full rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 font-bold text-cyan-200 hover:bg-cyan-400/20"
            >
              + Add another AI tool
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="mb-6">
              <p className="text-sm font-semibold text-cyan-300">Step 2</p>
              <h3 className="text-3xl font-black">Audit results</h3>
              <p className="mt-2 text-slate-400">
                Current spend → recommendation → savings.
              </p>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-cyan-400 p-5 text-slate-950">
                <p className="text-sm font-bold uppercase">Monthly savings</p>
                <p className="mt-2 text-4xl font-black">
                  {money(totalMonthlySavings)}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-400 p-5 text-slate-950">
                <p className="text-sm font-bold uppercase">Annual savings</p>
                <p className="mt-2 text-4xl font-black">
                  {money(totalAnnualSavings)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {audit.map((item) => (
                <div
                  key={item.tool}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <h4 className="text-lg font-bold">{item.tool}</h4>
                      <p className="mt-1 text-sm text-slate-400">{item.reason}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-slate-400">Savings</p>
                      <p className="text-2xl font-black text-emerald-300">
                        {money(item.savings)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-slate-400">Current</p>
                      <p className="font-bold">{money(item.currentSpend)}/mo</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-slate-400">Recommended</p>
                      <p className="font-bold">{money(item.recommendedSpend)}/mo</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-slate-400">Action</p>
                      <p className="font-bold">{item.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleLeadSubmit}
              className="mt-6 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5"
            >
              <h4 className="text-xl font-black">Send my full audit report</h4>
              <p className="mt-1 text-sm text-slate-300">
                Email is asked after showing value, not before.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Work email"
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
                />
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name"
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
                />
              </div>

              <button className="mt-4 w-full rounded-xl bg-white px-4 py-3 font-black text-slate-950 hover:bg-slate-200">
                Capture report
              </button>

              {savedLead && (
                <p className="mt-3 rounded-xl bg-emerald-400/20 p-3 text-sm text-emerald-200">
                  Demo lead saved locally. Tomorrow we will connect Supabase + Resend.
                </p>
              )}
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}