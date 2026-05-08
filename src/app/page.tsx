"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PLAN_PRICES,
  ToolEntry,
  ToolName,
  UseCase,
  auditStack,
  money,
} from "@/lib/audit";

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
    plan: "Team",
    monthlySpend: 180,
    seats: 6,
  },
];

export default function Home() {
  const [teamSize, setTeamSize] = useState(6);
  const [useCase, setUseCase] = useState<UseCase>("coding");
  const [tools, setTools] = useState<ToolEntry[]>(DEFAULT_TOOLS);

  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [website, setWebsite] = useState("");

  const [leadSaved, setLeadSaved] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

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

  const auditResult = useMemo(
    () => auditStack(tools, teamSize, useCase),
    [tools, teamSize, useCase]
  );

  const { items: audit, currentMonthlySpend, monthlySavings, annualSavings } =
    auditResult;

  const summary =
    monthlySavings > 500
      ? "Your AI stack shows a strong savings opportunity. Most waste appears to come from over-provisioned seats, expensive team plans, and high retail API usage. This is a strong fit for discounted AI infrastructure credits."
      : monthlySavings > 100
      ? "Your AI spend is mostly reasonable, but there are clear optimization opportunities. Reducing unused seats and choosing better-fit plans could lower your monthly bill without reducing productivity."
      : "Your AI spend looks disciplined. There is no major waste visible from the current inputs, but you can still monitor future plan changes and credit opportunities.";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLeadSaved(false);
    setLeadError("");
    setIsSubmittingLead(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          company,
          role,
          website,
          teamSize,
          useCase,
          totalMonthlySpend: currentMonthlySpend,
          monthlySavings,
          annualSavings,
          auditPayload: {
            tools,
            audit,
            summary,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save lead.");
      }

      setLeadSaved(true);
      setLeadError("");
    } catch (error) {
      setLeadError(
        error instanceof Error ? error.message : "Failed to save lead."
      );
    } finally {
      setIsSubmittingLead(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-5 py-8 md:px-10">
        <nav className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-cyan-300">AI Spend Doctor</p>
            <p className="text-xs text-slate-400">Free AI Tool Spend Audit</p>
          </div>

          <a
            href="#audit"
            className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
          >
            Start Audit
          </a>
        </nav>

        <section className="grid items-center gap-10 py-14 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              For startup founders and engineering managers
            </div>

            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Find hidden waste in your AI tool spend.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Enter your AI tools, plans, seats, and monthly spend. Get an instant
              audit showing where to downgrade, switch, or use discounted credits.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-3xl font-black">
                  {money(currentMonthlySpend)}
                </p>
                <p className="mt-1 text-sm text-slate-400">Current spend/mo</p>
              </div>

              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5">
                <p className="text-3xl font-black text-cyan-300">
                  {money(monthlySavings)}
                </p>
                <p className="mt-1 text-sm text-slate-400">Savings/mo</p>
              </div>

              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                <p className="text-3xl font-black text-emerald-300">
                  {money(annualSavings)}
                </p>
                <p className="mt-1 text-sm text-slate-400">Savings/year</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
            <p className="text-sm font-bold text-cyan-300">
              Personalized audit summary
            </p>
            <h2 className="mt-2 text-2xl font-black">Your AI spend diagnosis</h2>
            <p className="mt-4 rounded-2xl bg-slate-900 p-5 leading-7 text-slate-300">
              {summary}
            </p>

            {monthlySavings > 500 && (
              <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
                <p className="font-bold text-amber-200">
                  High-savings case detected
                </p>
                <p className="mt-2 text-sm text-amber-100/80">
                  This account should be routed to Credex consultation because the
                  savings opportunity is above $500/month.
                </p>
              </div>
            )}
          </div>
        </section>

        <section id="audit" className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm font-bold text-cyan-300">Step 1</p>
            <h2 className="mt-1 text-3xl font-black">Enter your AI stack</h2>
            <p className="mt-2 text-slate-400">
              Your form data is saved automatically after reload.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-sm text-slate-300">Team size</span>
                <input
                  type="number"
                  min={1}
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:ring-4 focus:ring-cyan-400/30"
                />
              </label>

              <label>
                <span className="text-sm text-slate-300">Primary use case</span>
                <select
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value as UseCase)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:ring-4 focus:ring-cyan-400/30"
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
                        type="button"
                        onClick={() => removeTool(entry.id)}
                        className="text-sm font-bold text-red-300 hover:text-red-200"
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
                        {(Object.keys(PLAN_PRICES) as ToolName[]).map((tool) => (
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
                        onChange={(e) =>
                          updateTool(entry.id, { plan: e.target.value })
                        }
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
                      <span className="text-sm text-slate-300">
                        Monthly spend ($)
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={entry.monthlySpend}
                        onChange={(e) =>
                          updateTool(entry.id, {
                            monthlySpend: Number(e.target.value),
                          })
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                      />
                    </label>

                    <label>
                      <span className="text-sm text-slate-300">Paid seats</span>
                      <input
                        type="number"
                        min={1}
                        value={entry.seats}
                        onChange={(e) =>
                          updateTool(entry.id, { seats: Number(e.target.value) })
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addTool}
              className="mt-5 w-full rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 font-black text-cyan-200 hover:bg-cyan-400/20"
            >
              + Add another AI tool
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm font-bold text-cyan-300">Step 2</p>
            <h2 className="mt-1 text-3xl font-black">Audit results</h2>
            <p className="mt-2 text-slate-400">
              Current spend → recommended action → savings.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-cyan-400 p-5 text-slate-950">
                <p className="text-sm font-black uppercase">Monthly savings</p>
                <p className="mt-2 text-4xl font-black">
                  {money(monthlySavings)}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-400 p-5 text-slate-950">
                <p className="text-sm font-black uppercase">Annual savings</p>
                <p className="mt-2 text-4xl font-black">
                  {money(annualSavings)}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {audit.map((item) => (
                <div
                  key={item.toolLabel}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <h3 className="text-lg font-black">{item.toolLabel}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {item.reason}
                      </p>
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
                      <p className="font-bold">
                        {money(item.recommendedSpend)}/mo
                      </p>
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
              onSubmit={handleSubmit}
              className="mt-6 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5"
            >
              <h3 className="text-xl font-black">Send my full audit report</h3>
              <p className="mt-1 text-sm text-slate-300">
                Lead capture appears after showing value.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  required
                  type="email"
                  placeholder="Work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
                />

                <input
                  type="text"
                  placeholder="Company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
                />

                <input
                  type="text"
                  placeholder="Role, e.g. Founder or Engineering Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none sm:col-span-2"
                />

                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
              </div>

              <button
                disabled={isSubmittingLead}
                className="mt-4 w-full rounded-xl bg-white px-4 py-3 font-black text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingLead ? "Saving report..." : "Capture report"}
              </button>

              {leadSaved && (
                <p className="mt-3 rounded-xl bg-emerald-400/20 p-3 text-sm text-emerald-200">
                  Audit lead saved successfully in Supabase.
                </p>
              )}

              {leadError && (
                <p className="mt-3 rounded-xl bg-red-400/20 p-3 text-sm text-red-200">
                  {leadError}
                </p>
              )}
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}