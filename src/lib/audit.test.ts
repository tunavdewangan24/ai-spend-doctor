import { describe, expect, it } from "vitest";
import { auditStack, auditTool, getPlanPrice } from "./audit";

describe("AI spend audit engine", () => {
  it("returns correct public plan price", () => {
    expect(getPlanPrice("Cursor", "Business")).toBe(40);
    expect(getPlanPrice("GitHub Copilot", "Individual")).toBe(10);
  });

  it("detects extra paid seats above team size", () => {
    const result = auditTool(
      {
        id: "1",
        tool: "Cursor",
        plan: "Business",
        monthlySpend: 240,
        seats: 6,
      },
      4,
      "coding"
    );

    expect(result.savings).toBe(80);
    expect(result.action).toBe("Remove extra paid seats");
  });

  it("recommends cheaper individual plan for tiny teams", () => {
    const result = auditTool(
      {
        id: "2",
        tool: "GitHub Copilot",
        plan: "Business",
        monthlySpend: 38,
        seats: 2,
      },
      2,
      "coding"
    );

    expect(result.recommendedSpend).toBe(20);
    expect(result.savings).toBe(18);
  });

  it("detects high API spend as credit opportunity", () => {
    const result = auditTool(
      {
        id: "3",
        tool: "OpenAI API direct",
        plan: "API direct",
        monthlySpend: 1000,
        seats: 1,
      },
      5,
      "mixed"
    );

    expect(result.recommendedSpend).toBe(800);
    expect(result.savings).toBe(200);
    expect(result.action).toBe("Explore discounted AI credits");
  });

  it("does not manufacture savings for optimized spend", () => {
    const result = auditTool(
      {
        id: "4",
        tool: "Cursor",
        plan: "Pro",
        monthlySpend: 40,
        seats: 2,
      },
      2,
      "coding"
    );

    expect(result.savings).toBe(0);
    expect(result.action).toBe("Looks optimized");
  });

  it("calculates monthly and annual stack savings", () => {
    const result = auditStack(
      [
        {
          id: "1",
          tool: "Cursor",
          plan: "Business",
          monthlySpend: 240,
          seats: 6,
        },
        {
          id: "2",
          tool: "OpenAI API direct",
          plan: "API direct",
          monthlySpend: 1000,
          seats: 1,
        },
      ],
      4,
      "coding"
    );

    expect(result.monthlySavings).toBe(280);
    expect(result.annualSavings).toBe(3360);
  });
});