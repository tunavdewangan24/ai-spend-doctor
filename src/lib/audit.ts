export const PLAN_PRICES = {
  Cursor: [
    { name: "Hobby", price: 0 },
    { name: "Pro", price: 20 },
    { name: "Business", price: 40 },
    { name: "Enterprise", price: 80 },
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
    { name: "Enterprise", price: 60 },
    { name: "API direct", price: 0 },
  ],
  ChatGPT: [
    { name: "Plus", price: 20 },
    { name: "Team", price: 25 },
    { name: "Enterprise", price: 60 },
    { name: "API direct", price: 0 },
  ],
  "Anthropic API direct": [{ name: "API direct", price: 0 }],
  "OpenAI API direct": [{ name: "API direct", price: 0 }],
  Gemini: [
    { name: "Pro", price: 20 },
    { name: "Ultra", price: 250 },
    { name: "API direct", price: 0 },
  ],
  Windsurf: [
    { name: "Free", price: 0 },
    { name: "Pro", price: 15 },
    { name: "Teams", price: 30 },
    { name: "Enterprise", price: 60 },
  ],
} as const;

export type ToolName = keyof typeof PLAN_PRICES;
export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

export type ToolEntry = {
  id: string;
  tool: ToolName;
  plan: string;
  monthlySpend: number;
  seats: number;
};

export type AuditItem = {
  toolLabel: string;
  currentSpend: number;
  recommendedSpend: number;
  savings: number;
  action: string;
  reason: string;
};

export function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

export function getPlanPrice(tool: ToolName, plan: string) {
  return PLAN_PRICES[tool].find((item) => item.name === plan)?.price ?? 0;
}

export function auditTool(
  entry: ToolEntry,
  teamSize: number,
  useCase: UseCase
): AuditItem {
  const currentSpend = Math.max(0, Number(entry.monthlySpend) || 0);
  const seats = Math.max(1, Number(entry.seats) || 1);
  const planPrice = getPlanPrice(entry.tool, entry.plan);
  const estimatedRetail = planPrice > 0 ? planPrice * seats : currentSpend;

  let recommendedSpend = currentSpend;
  let action = "Keep current setup";
  let reason = "No major overspend was found from the current inputs.";

  const isTeamPlan =
    entry.plan.toLowerCase().includes("team") ||
    entry.plan.toLowerCase().includes("business") ||
    entry.plan.toLowerCase().includes("enterprise");

  const isApiSpend =
    entry.tool.toLowerCase().includes("api") ||
    entry.plan.toLowerCase().includes("api");

  if (planPrice > 0 && currentSpend > estimatedRetail * 1.25) {
    recommendedSpend = estimatedRetail;
    action = "Check billing against public pricing";
    reason =
      "Your entered spend is higher than the expected public price for this plan and seat count.";
  }

  if (seats > teamSize) {
    const activeSeatSpend =
      planPrice > 0 ? planPrice * teamSize : currentSpend * 0.75;

    recommendedSpend = Math.min(recommendedSpend, activeSeatSpend);
    action = "Remove extra paid seats";
    reason =
      "Paid seats are higher than team size, so some licenses may be unused.";
  }

  if (teamSize <= 2 && isTeamPlan) {
    const cheaperPlanPrice =
      entry.tool === "GitHub Copilot"
        ? 10
        : entry.tool === "Cursor"
        ? 20
        : entry.tool === "ChatGPT"
        ? 20
        : entry.tool === "Claude"
        ? 20
        : entry.tool === "Windsurf"
        ? 15
        : planPrice;

    recommendedSpend = Math.min(recommendedSpend, cheaperPlanPrice * seats);
    action = "Downgrade to individual/pro plan";
    reason =
      "Team or enterprise plans are often unnecessary for very small teams unless admin controls are required.";
  }

  if (isApiSpend && currentSpend >= 300) {
    recommendedSpend = Math.min(recommendedSpend, currentSpend * 0.8);
    action = "Explore discounted AI credits";
    reason =
      "High API spend is a good fit for discounted credits instead of paying full retail.";
  }

  if (useCase === "coding" && entry.tool === "ChatGPT" && currentSpend >= 200) {
    recommendedSpend = Math.min(recommendedSpend, 40 * seats);
    action = "Use coding-focused tools for developers";
    reason =
      "For coding-heavy teams, a dedicated coding assistant can be cheaper than expensive general AI access for every developer.";
  }

  const savings = Math.max(0, currentSpend - recommendedSpend);

  if (savings < 10) {
    return {
      toolLabel: `${entry.tool} ${entry.plan}`,
      currentSpend,
      recommendedSpend: currentSpend,
      savings: 0,
      action: "Looks optimized",
      reason: "This tool looks reasonably optimized based on the entered data.",
    };
  }

  return {
    toolLabel: `${entry.tool} ${entry.plan}`,
    currentSpend,
    recommendedSpend,
    savings,
    action,
    reason,
  };
}

export function auditStack(
  tools: ToolEntry[],
  teamSize: number,
  useCase: UseCase
) {
  const items = tools.map((tool) => auditTool(tool, teamSize, useCase));
  const monthlySavings = items.reduce((sum, item) => sum + item.savings, 0);
  const annualSavings = monthlySavings * 12;
  const currentMonthlySpend = tools.reduce(
    (sum, item) => sum + Number(item.monthlySpend || 0),
    0
  );

  return {
    items,
    currentMonthlySpend,
    monthlySavings,
    annualSavings,
  };
}