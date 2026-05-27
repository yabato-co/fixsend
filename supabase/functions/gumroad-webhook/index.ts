import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type FixPackInput = {
  cvText: string;
  targetRole: string;
  targetRoleLabel: string;
  email: string;
};

const roleKeywords: Record<string, string[]> = {
  "UX Designer": ["ux", "research", "persona", "journey", "usability", "prototype", "wireframe", "user flow"],
  "UI Designer": ["ui", "visual", "typography", "layout", "component", "design system", "figma"],
  "Product Designer": ["product", "metrics", "stakeholder", "prototype", "research", "design system", "handoff"],
  "Web Designer": ["web", "responsive", "layout", "landing", "typography", "figma", "html", "css"],
  "Graphic Designer": ["brand", "visual", "typography", "layout", "illustration", "adobe", "campaign"],
  "Frontend Developer": ["frontend", "javascript", "html", "css", "react", "responsive", "accessibility"],
  "Junior Designer": ["junior", "figma", "portfolio", "project", "wireframe", "prototype", "research"],
  "Career Switcher": ["transferable", "project", "portfolio", "learning", "collaborated", "research"],
};

const designKeywords = [
  "figma",
  "prototype",
  "wireframe",
  "usability",
  "research",
  "user flow",
  "design system",
  "interaction",
  "accessibility",
  "responsive",
  "mobile",
  "dashboard",
  "component",
  "user testing",
  "typography",
  "layout",
  "metrics",
  "stakeholder",
  "handoff",
];

const impactWords = [
  "improved",
  "increased",
  "reduced",
  "launched",
  "designed",
  "led",
  "collaborated",
  "measured",
  "tested",
  "optimized",
  "created",
  "delivered",
  "built",
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " link ")
    .replace(/[^a-z0-9@\s.+-]/g, " ");
}

function includes(text: string, keyword: string) {
  return text.includes(keyword.toLowerCase());
}

function count(text: string, keywords: string[]) {
  return keywords.filter((keyword) => includes(text, keyword)).length;
}

function clamp(value: number) {
  return Math.max(0, Math.min(10, value));
}

function percent(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}

function scoreLabel(score: number) {
  if (score >= 8) return "Strong";
  if (score >= 6) return "Workable";
  if (score >= 4) return "Needs work";
  return "Weak";
}

function createDashboard(input: FixPackInput) {
  const cleaned = normalize(input.cvText);
  const roleSet = roleKeywords[input.targetRoleLabel] || roleKeywords["Product Designer"];
  const readinessKeywords = [...new Set([...roleSet, ...designKeywords])].slice(0, 22);
  const matched = readinessKeywords.filter((keyword) => includes(cleaned, keyword));
  const missing = readinessKeywords.filter((keyword) => !includes(cleaned, keyword));
  const structure = {
    contact: /[\w.+-]+@[\w-]+\.[\w.-]+/.test(input.cvText) || /\b(contact|phone|email)\b/.test(cleaned),
    portfolio: /https?:\/\/\S+/.test(input.cvText) || /\b(portfolio|behance|dribbble|github|personal site)\b/.test(cleaned),
    experience: /\b(experience|employment|worked|internship|freelance)\b/.test(cleaned),
    education: /\b(education|university|college|degree|bootcamp|course)\b/.test(cleaned),
    skills: /\b(skills|tools|technologies)\b/.test(cleaned),
    projects: /\b(project|case study|case studies|launched|built)\b/.test(cleaned),
    tools: /\b(figma|sketch|adobe|photoshop|illustrator|html|css|javascript|react)\b/.test(cleaned),
    metrics: /\b\d+%|\b\d+x|\b\d+\+|\bmetrics|conversion|retention|reduced|increased\b/.test(cleaned),
  };
  const structureScore = clamp((Object.values(structure).filter(Boolean).length / 8) * 10);
  const roleFitScore = clamp((count(cleaned, roleSet) / roleSet.length) * 10);
  const designScore = clamp((count(cleaned, designKeywords) / 9) * 10);
  const impactScore = clamp((count(cleaned, impactWords) / 6) * 10);
  const readiness = percent(matched.length, readinessKeywords.length);
  const overall = clamp(roleFitScore * 0.34 + structureScore * 0.26 + designScore * 0.22 + impactScore * 0.18);
  const decision = overall >= 8 && structure.portfolio ? "Send" : overall < 5.5 ? "Skip" : "Fix";
  const roleFit = roleFitScore >= 7 ? "Strong" : roleFitScore >= 4.5 ? "Medium" : "Low";
  const portfolioScore = clamp((structure.portfolio ? 5 : 0) + (structure.projects ? 2 : 0) + (structure.tools ? 2 : 0) + (structure.metrics ? 1 : 0));
  const processScore = clamp(count(cleaned, ["research", "wireframe", "prototype", "testing", "handoff", "documentation", "user flow"]) * 1.4);
  const evidenceScore = clamp((structure.metrics ? 4 : 0) + impactScore * 0.6);
  const scanScore = clamp((structure.contact ? 2 : 0) + (structure.skills ? 2 : 0) + (structure.experience ? 2 : 0) + (structure.education ? 1 : 0) + (structure.projects ? 2 : 0) + (structure.portfolio ? 1 : 0));

  const priorityFixes = [
    !structure.portfolio ? "Add a portfolio link near your contact details." : "",
    !structure.metrics ? "Rewrite at least two bullets with numbers, scope, or outcome." : "",
    !structure.skills ? "Add a clear skills/tools section for fast scanning." : "",
    missing.length ? `Add truthful proof for role keywords like ${missing.slice(0, 3).join(", ")}.` : "",
    impactScore < 5 ? "Start bullets with stronger action verbs such as designed, tested, built, improved, or launched." : "",
    "Move the most relevant project or experience closer to the top of the CV.",
  ].filter(Boolean);

  return {
    fullName: "FixSend customer",
    email: input.email,
    targetRole: input.targetRoleLabel,
    decision,
    overallScore: Number(overall.toFixed(1)),
    readinessScore: readiness,
    roleFit,
    diagnosis:
      decision === "Send"
        ? "Your CV has a solid foundation. The main opportunity is tightening the strongest proof before applying."
        : decision === "Skip"
          ? "Your CV is missing too many core signals for this role. Build stronger proof before applying to similar positions."
          : "Your CV has potential, but it needs targeted fixes before applying. Focus on role keywords, measurable proof, and clearer positioning.",
    categoryScores: [
      { label: "Portfolio Signal", score: Math.round(portfolioScore * 10), status: scoreLabel(portfolioScore), note: structure.portfolio ? "Portfolio signal is visible." : "Portfolio signal is missing or too hard to find." },
      { label: "UX Process", score: Math.round(processScore * 10), status: scoreLabel(processScore), note: "Looks for research, flows, wireframes, prototypes, testing, handoff, and documentation." },
      { label: "Impact Evidence", score: Math.round(evidenceScore * 10), status: scoreLabel(evidenceScore), note: structure.metrics ? "Some measurable proof is present." : "Add metrics, scope, or concrete project outcomes." },
      { label: "Role Keywords", score: readiness, status: scoreLabel(readiness / 10), note: missing.length ? `Missing high-signal terms include ${missing.slice(0, 3).join(", ")}.` : "Role keyword coverage looks strong." },
      { label: "Recruiter Scan", score: Math.round(scanScore * 10), status: scoreLabel(scanScore), note: "Checks whether the CV is easy to scan quickly." },
    ],
    riskFlags: [
      !structure.portfolio ? "Portfolio link is not clearly visible." : "",
      !structure.metrics ? "Impact is hard to prove because numbers or outcomes are missing." : "",
      processScore < 5 ? "UX process is not explicit enough." : "",
      roleFitScore < 5 ? "Target role language is weak." : "",
      !structure.skills ? "Skills/tools section is not clearly signposted." : "",
    ].filter(Boolean),
    priorityFixes: priorityFixes.slice(0, 6),
    profileSummary: `${input.targetRoleLabel} with hands-on experience across portfolio projects, interface decisions, and user-centered problem solving. Strong at translating research, visual systems, and product goals into clear CV-ready outcomes.`,
    bulletTemplates: [
      "Designed [project/interface] for [audience] using [tool/process], improving [metric or user outcome].",
      "Collaborated with [team/stakeholders] to deliver [feature/project], reducing [problem] and improving [result].",
      "Built or refined [system/component/workflow] to make [process/product] clearer, faster, or easier to use.",
    ],
    missingKeywords: missing.slice(0, 10),
    strengths: [
      structure.contact ? "Contact details are visible." : "There is enough content to create a clearer contact section.",
      structure.projects ? "Projects are present and can be sharpened." : "Project proof can be added to make the CV more credible.",
      matched.length ? `You already mention ${matched.slice(0, 3).join(", ")}.` : "The CV has raw material that can be repositioned.",
    ],
    recruiterReadout: [
      `First impression: ${decision === "Send" ? "credible and close to application-ready" : decision === "Fix" ? "promising but not yet sharp enough" : "not aligned enough for this role"}.`,
      `Portfolio signal: ${structure.portfolio ? "visible" : "missing or unclear"}.`,
      `Evidence quality: ${structure.metrics ? "some outcomes are present" : "needs measurable outcomes"}.`,
      `Role language: ${roleFit}.`,
    ],
    beforeApplying: [
      "Check that the CV opens cleanly as a PDF.",
      "Make the target role obvious in the top third.",
      "Add measurable outcomes where possible.",
      "Use truthful role-specific keywords naturally.",
      "Confirm links, portfolio, and contact details work.",
    ],
    dashboardSections: [
      "CV diagnosis",
      "Priority fixes",
      "Category scorecards",
      "Recruiter scan",
      "Profile summary direction",
      "Bullet rewrite templates",
      "Missing keywords",
      "Before-applying checklist",
    ],
    nextStep:
      decision === "Send"
        ? "Make the final polish edits, then apply."
        : decision === "Skip"
          ? "Do not apply yet. Build the missing role proof first."
          : "Make the priority fixes, then run FixSend again before applying.",
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendDashboardEmail(input: {
  to: string;
  dashboardUrl: string;
  decision: string;
  score: number;
  targetRole: string;
}) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("FIXSEND_FROM_EMAIL") || "FixSend <onboarding@resend.dev>";

  if (!resendApiKey || !input.to) {
    return {
      sent: false,
      error: !resendApiKey ? "Missing RESEND_API_KEY" : "Missing customer email",
    };
  }

  const safeDashboardUrl = escapeHtml(input.dashboardUrl);
  const safeTargetRole = escapeHtml(input.targetRole);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: input.to,
      subject: "Your FixSend Fix Pack dashboard is ready",
      html: `
        <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.55; max-width: 620px; margin: 0 auto; padding: 28px;">
          <p style="font-size: 14px; color: #2444E5; font-weight: 700; margin: 0 0 12px;">FixSend by Yabato Co.</p>
          <h1 style="font-size: 26px; line-height: 1.2; margin: 0 0 14px;">Your Fix Pack dashboard is ready.</h1>
          <p style="font-size: 16px; margin: 0 0 18px;">We analyzed your CV for <strong>${safeTargetRole}</strong> and prepared your detailed dashboard.</p>
          <div style="background: #F6F8FF; border: 1px solid #DDE5FF; border-radius: 14px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 6px;"><strong>Decision:</strong> ${escapeHtml(input.decision)}</p>
            <p style="margin: 0;"><strong>Score:</strong> ${input.score}/10</p>
          </div>
          <a href="${safeDashboardUrl}" style="display: inline-block; background: #2444E5; color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 10px; padding: 13px 18px;">Open my dashboard</a>
          <p style="font-size: 14px; color: #4B5563; margin: 22px 0 0;">If the button does not work, copy this link into your browser:</p>
          <p style="font-size: 14px; word-break: break-all; margin: 6px 0 0;"><a href="${safeDashboardUrl}" style="color: #2444E5;">${safeDashboardUrl}</a></p>
        </div>
      `,
      text: `Your FixSend Fix Pack dashboard is ready.\n\nDecision: ${input.decision}\nScore: ${input.score}/10\nTarget role: ${input.targetRole}\n\nOpen your dashboard:\n${input.dashboardUrl}`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { sent: false, error: errorText };
  }

  const result = await response.json();
  return { sent: true, id: result.id || null };
}

function parseNestedField(rawValue: unknown) {
  if (!rawValue) return {};
  if (typeof rawValue === "object") return rawValue as Record<string, unknown>;

  const raw = String(rawValue).trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Gumroad Ping documents url_params as a dictionary-like string, not always strict JSON.
  }

  try {
    const decoded = decodeURIComponent(raw);
    const params = new URLSearchParams(decoded);
    const entries = Object.fromEntries(params.entries());
    if (Object.keys(entries).length) return entries;
  } catch {
    // Keep going and use the regex fallback below.
  }

  const result: Record<string, string> = {};
  const pairs = [...raw.matchAll(/['"]?([A-Za-z0-9_-]+)['"]?\s*(?::|=>|=)\s*['"]?([^,'"}&\s]+)['"]?/g)];
  pairs.forEach((match) => {
    result[match[1]] = match[2];
  });

  return result;
}

function getField(fields: Record<string, FormDataEntryValue | string>, key: string) {
  const value = fields[key];
  return value ? String(value).trim() : "";
}

function extractSessionId(fields: Record<string, FormDataEntryValue | string>) {
  const direct = getField(fields, "session_id") || getField(fields, "sessionId");
  if (direct) return direct;

  const nestedSources = [
    parseNestedField(fields.url_params),
    parseNestedField(fields.custom_fields),
  ];

  for (const source of nestedSources) {
    const value =
      source.session_id ||
      source.sessionId ||
      source.SessionId ||
      source["Session ID"] ||
      source["session id"];

    if (value) return String(value).trim();
  }

  const rawSearchArea = `${fields.url_params || ""} ${fields.custom_fields || ""}`;
  const regexMatch = rawSearchArea.match(/session[_\s-]?id['"]?\s*(?::|=>|=)\s*['"]?([A-Za-z0-9-]+)/i);
  return regexMatch?.[1] || "";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const supabaseUrl = Deno.env.get("FIXSEND_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
  const serviceRoleKey =
    Deno.env.get("FIXSEND_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      {
        ok: false,
        error: "Missing Supabase environment variables",
        has_supabase_url: Boolean(supabaseUrl),
        has_service_role_key: Boolean(serviceRoleKey),
      },
      { status: 500 },
    );
  }
  const dashboardBaseUrl = Deno.env.get("FIXSEND_DASHBOARD_BASE_URL") || "https://yabato-co.github.io/fixsend/dashboard.html";
  const expectedProductPermalink = Deno.env.get("GUMROAD_PRODUCT_PERMALINK") || "fixsend-fix-pack";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const contentType = req.headers.get("content-type") || "";
  const allFields: Record<string, FormDataEntryValue | string> = {};

  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    Object.assign(allFields, Object.fromEntries(form.entries()));
  } else {
    const rawBody = await req.text();
    try {
      Object.assign(allFields, JSON.parse(rawBody));
    } catch {
      const normalizedBody = rawBody
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join("&");
      const params = new URLSearchParams(normalizedBody);
      Object.assign(allFields, Object.fromEntries(params.entries()));
    }
  }

  const saleId = getField(allFields, "sale_id") || getField(allFields, "id");
  const email = getField(allFields, "email");
  const permalink = getField(allFields, "permalink") || getField(allFields, "product_permalink");
  let sessionId = extractSessionId(allFields);

  if (permalink && permalink !== expectedProductPermalink) {
    return Response.json({ ok: false, error: "Wrong product" }, { status: 400 });
  }

  if (!sessionId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: fallbackSession, error: fallbackError } = await supabase
      .from("fixpack_sessions")
      .select("id,status,target_role,created_at")
      .eq("status", "pending")
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallbackSession?.id) {
      sessionId = fallbackSession.id;
      console.info("FixSend fallback matched Gumroad sale to recent pending session", {
        sale_id: saleId,
        email,
        session_id: sessionId,
        session_created_at: fallbackSession.created_at,
      });
    } else {
      console.warn("FixSend Gumroad webhook missing session_id", {
        sale_id: saleId,
        email,
        product_permalink: permalink,
        url_params: allFields.url_params || null,
        custom_fields: allFields.custom_fields || null,
        fallback_error: fallbackError?.message || null,
      });

      return Response.json(
        {
          ok: false,
          error: "Missing session_id",
          received_keys: Object.keys(allFields),
          url_params: allFields.url_params || null,
          custom_fields: allFields.custom_fields || null,
          fallback_error: fallbackError?.message || null,
        },
        { status: 400 },
      );
    }
  }

  const { data: session, error: sessionError } = await supabase
    .from("fixpack_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    const { data: recentSessions, error: recentError } = await supabase
      .from("fixpack_sessions")
      .select("id,status,target_role,created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    return Response.json(
      {
        ok: false,
        error: "Session not found",
        looked_for_session_id: sessionId,
        session_id_length: sessionId.length,
        session_error: sessionError?.message || null,
        recent_sessions: recentSessions || [],
        recent_error: recentError?.message || null,
      },
      { status: 404 },
    );
  }

  if (session.report_id) {
    return Response.json({
      ok: true,
      report_id: session.report_id,
      dashboard_url: `${dashboardBaseUrl}?id=${session.report_id}`,
      email_sent: false,
      email_note: "Report already existed, email not resent.",
    });
  }

  const dashboard = createDashboard({
    cvText: session.cv_text,
    targetRole: session.target_role,
    targetRoleLabel: session.target_role,
    email,
  });

  const { data: report, error: reportError } = await supabase
    .from("fixpack_reports")
    .insert({
      email: email || "unknown@gumroad.customer",
      full_name: "FixSend customer",
      target_role: session.target_role,
      fixsend_score: `${dashboard.overallScore} / 10`,
      cv_text: session.cv_text,
      decision: dashboard.decision,
      overall_score: dashboard.overallScore,
      readiness_score: dashboard.readinessScore,
      role_fit: dashboard.roleFit,
      dashboard_data: dashboard,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    return Response.json({ ok: false, error: reportError?.message || "Report create failed" }, { status: 500 });
  }

  const dashboardUrl = `${dashboardBaseUrl}?id=${report.id}`;
  const emailResult = await sendDashboardEmail({
    to: email,
    dashboardUrl,
    decision: dashboard.decision,
    score: dashboard.overallScore,
    targetRole: session.target_role,
  });

  await supabase
    .from("fixpack_sessions")
    .update({
      status: "paid",
      email,
      gumroad_sale_id: saleId,
      report_id: report.id,
    })
    .eq("id", sessionId);

  return Response.json({
    ok: true,
    report_id: report.id,
    dashboard_url: dashboardUrl,
    email_sent: emailResult.sent,
    email_result: emailResult,
  });
});
