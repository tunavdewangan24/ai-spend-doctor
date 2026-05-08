import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 5;

  const current = rateLimitMap.get(ip);

  if (!current || current.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

    if (!rateLimit(ip)) {
      return Response.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    if (body.website) {
      return Response.json({ error: "Spam detected." }, { status: 400 });
    }

    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return Response.json(
        { error: "A valid email is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return Response.json(
        { error: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("audit_leads")
      .insert({
        email,
        company: body.company || null,
        role: body.role || null,
        team_size: Number(body.teamSize || 0),
        use_case: body.useCase || null,
        total_monthly_spend: Number(body.totalMonthlySpend || 0),
        monthly_savings: Number(body.monthlySavings || 0),
        annual_savings: Number(body.annualSavings || 0),
        audit_payload: body.auditPayload || {},
        source: "ai-spend-doctor",
      })
      .select("id")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      ok: true,
      leadId: data.id,
      message: "Audit lead saved successfully.",
    });
  } catch {
    return Response.json(
      { error: "Something went wrong while saving the lead." },
      { status: 500 }
    );
  }
}