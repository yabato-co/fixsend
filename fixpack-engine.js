const FIXSEND_SUPABASE_URL = "https://rcfedevdtbziqlxtqggd.supabase.co";
const FIXSEND_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZmVkZXZkdGJ6aXFseHRxZ2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjMyMTYsImV4cCI6MjA5NTM5OTIxNn0.G712CoTnxJXfmnQoWh2Vto7vriMJr3VhMnRKyaOWKGo";

const fixPackStopWords = new Set([
  "and",
  "the",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "you",
  "are",
  "have",
  "will",
  "role",
  "work",
  "team",
  "experience",
]);

const fixPackRoleKeywords = {
  "ux-designer": ["ux", "research", "persona", "journey", "usability", "prototype", "wireframe", "user flow"],
  "ui-designer": ["ui", "visual", "typography", "layout", "component", "design system", "figma"],
  "product-designer": ["product", "metrics", "stakeholder", "prototype", "research", "design system", "handoff"],
  "web-designer": ["web", "responsive", "layout", "landing", "typography", "figma", "html", "css"],
  "graphic-designer": ["brand", "visual", "typography", "layout", "illustration", "adobe", "campaign"],
  "frontend-developer": ["frontend", "javascript", "html", "css", "react", "responsive", "accessibility"],
  "junior-designer": ["junior", "figma", "portfolio", "project", "wireframe", "prototype", "research"],
  "career-switcher": ["transferable", "project", "portfolio", "learning", "collaborated", "research"],
};

const fixPackDesignKeywords = [
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

const fixPackImpactWords = [
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

function fixPackNormalize(text) {
  const cleaned = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " link ")
    .replace(/[^a-z0-9@\s.+-]/g, " ");
  const words = cleaned
    .split(/\s+/)
    .filter((word) => word.length > 2 && !fixPackStopWords.has(word));
  return { cleaned, words };
}

function fixPackIncludes(text, keyword) {
  return text.includes(keyword.toLowerCase());
}

function fixPackCount(text, keywords) {
  return keywords.filter((keyword) => fixPackIncludes(text, keyword)).length;
}

function fixPackPercent(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

function fixPackClamp(value) {
  return Math.max(0, Math.min(10, value));
}

function fixPackStructure(cleanedCv, rawCv) {
  return {
    contact: /[\w.+-]+@[\w-]+\.[\w.-]+/.test(rawCv) || /\b(contact|phone|email)\b/.test(cleanedCv),
    portfolio: /https?:\/\/\S+/.test(rawCv) || /\b(portfolio|behance|dribbble|github|personal site)\b/.test(cleanedCv),
    experience: /\b(experience|employment|worked|internship|freelance)\b/.test(cleanedCv),
    education: /\b(education|university|college|degree|bootcamp|course)\b/.test(cleanedCv),
    skills: /\b(skills|tools|technologies)\b/.test(cleanedCv),
    projects: /\b(project|case study|case studies|launched|built)\b/.test(cleanedCv),
    tools: /\b(figma|sketch|adobe|photoshop|illustrator|html|css|javascript|react)\b/.test(cleanedCv),
    metrics: /\b\d+%|\b\d+x|\b\d+\+|\bmetrics|conversion|retention|reduced|increased\b/.test(cleanedCv),
  };
}

function scoreLabel(score) {
  if (score >= 8) return "Strong";
  if (score >= 6) return "Workable";
  if (score >= 4) return "Needs work";
  return "Weak";
}

function percentScore(score) {
  return Math.round(fixPackClamp(score) * 10);
}

function createFixPack(input) {
  const cvText = input.cvText || "";
  const role = input.targetRole || "product-designer";
  const roleLabel = input.targetRoleLabel || "Product Designer";
  const data = fixPackNormalize(cvText);
  const roleKeywords = fixPackRoleKeywords[role] || fixPackRoleKeywords["product-designer"];
  const readinessKeywords = [...new Set([...roleKeywords, ...fixPackDesignKeywords])].slice(0, 22);
  const matched = readinessKeywords.filter((keyword) => fixPackIncludes(data.cleaned, keyword));
  const missing = readinessKeywords.filter((keyword) => !fixPackIncludes(data.cleaned, keyword));
  const structure = fixPackStructure(data.cleaned, cvText);
  const structureScore = fixPackClamp((Object.values(structure).filter(Boolean).length / 8) * 10);
  const roleFitScore = fixPackClamp((fixPackCount(data.cleaned, roleKeywords) / roleKeywords.length) * 10);
  const designScore = fixPackClamp((fixPackCount(data.cleaned, fixPackDesignKeywords) / 9) * 10);
  const impactScore = fixPackClamp((fixPackCount(data.cleaned, fixPackImpactWords) / 6) * 10);
  const readiness = fixPackPercent(matched.length, readinessKeywords.length);
  const overall = fixPackClamp(roleFitScore * 0.34 + structureScore * 0.26 + designScore * 0.22 + impactScore * 0.18);
  const decision = overall >= 8 && structure.portfolio ? "Send" : overall < 5.5 ? "Skip" : "Fix";
  const roleFit = roleFitScore >= 7 ? "Strong" : roleFitScore >= 4.5 ? "Medium" : "Low";
  const portfolioScore = role === "frontend-developer"
    ? fixPackClamp((structure.projects ? 5 : 1) + (structure.metrics ? 3 : 0) + (structure.tools ? 2 : 0))
    : fixPackClamp((structure.portfolio ? 5 : 0) + (structure.projects ? 2 : 0) + (structure.tools ? 2 : 0) + (structure.metrics ? 1 : 0));
  const processScore = fixPackClamp(
    fixPackCount(data.cleaned, ["research", "wireframe", "prototype", "testing", "handoff", "documentation", "user flow"]) * 1.4
  );
  const atsScore = fixPackClamp(readiness / 10);
  const scanScore = fixPackClamp((structure.contact ? 2 : 0) + (structure.skills ? 2 : 0) + (structure.experience ? 2 : 0) + (structure.education ? 1 : 0) + (structure.projects ? 2 : 0) + (structure.portfolio ? 1 : 0));
  const evidenceScore = fixPackClamp((structure.metrics ? 4 : 0) + impactScore * 0.6);
  const categoryScores = [
    {
      label: "Portfolio Signal",
      score: percentScore(portfolioScore),
      status: scoreLabel(portfolioScore),
      note: structure.portfolio
        ? "Portfolio signal is visible. Make sure it opens and supports the target role."
        : "Portfolio signal is missing or too hard to find.",
    },
    {
      label: "UX Process",
      score: percentScore(processScore),
      status: scoreLabel(processScore),
      note: "Looks for research, flows, wireframes, prototypes, testing, handoff, and documentation.",
    },
    {
      label: "Impact Evidence",
      score: percentScore(evidenceScore),
      status: scoreLabel(evidenceScore),
      note: structure.metrics
        ? "Some measurable proof is present."
        : "Add metrics, scope, before/after outcomes, or concrete project results.",
    },
    {
      label: "Role Keywords",
      score: readiness,
      status: scoreLabel(atsScore),
      note: missing.length
        ? `Missing high-signal terms include ${missing.slice(0, 3).join(", ")}.`
        : "Role keyword coverage looks strong.",
    },
    {
      label: "Recruiter Scan",
      score: percentScore(scanScore),
      status: scoreLabel(scanScore),
      note: "Checks whether the CV is easy to scan through contact, skills, experience, projects, and education.",
    },
  ];
  const riskFlags = [
    !structure.portfolio && role !== "frontend-developer" ? "Portfolio link is not clearly visible." : "",
    !structure.metrics ? "Impact is hard to prove because numbers or outcomes are missing." : "",
    processScore < 5 ? "UX process is not explicit enough." : "",
    roleFitScore < 5 ? "Target role language is weak." : "",
    !structure.skills ? "Skills/tools section is not clearly signposted." : "",
  ].filter(Boolean);

  const priorityFixes = [];
  if (!structure.portfolio && role !== "frontend-developer") priorityFixes.push("Add a portfolio link near your contact details.");
  if (!structure.metrics) priorityFixes.push("Rewrite at least two bullets with numbers, scope, or outcome.");
  if (!structure.skills) priorityFixes.push("Add a clear skills/tools section for fast scanning.");
  if (missing.length) priorityFixes.push(`Add truthful proof for role keywords like ${missing.slice(0, 3).join(", ")}.`);
  if (impactScore < 5) priorityFixes.push("Start bullets with stronger action verbs such as designed, tested, built, improved, or launched.");
  priorityFixes.push("Move the most relevant project or experience closer to the top of the CV.");

  const profileSummary =
    role === "frontend-developer"
      ? `Frontend developer focused on responsive interfaces, accessible components, and practical product delivery. Strong at turning requirements into clean, usable web experiences with clear implementation details.`
      : `${roleLabel} with hands-on experience across portfolio projects, interface decisions, and user-centered problem solving. Strong at translating research, visual systems, and product goals into clear CV-ready outcomes.`;

  const bulletTemplates = [
    "Designed [project/interface] for [audience] using [tool/process], improving [metric or user outcome].",
    "Collaborated with [team/stakeholders] to deliver [feature/project], reducing [problem] and improving [result].",
    "Built or refined [system/component/workflow] to make [process/product] clearer, faster, or easier to use.",
  ];

  return {
    fullName: input.fullName || "FixSend customer",
    email: input.email || "",
    targetRole: roleLabel,
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
    categoryScores,
    riskFlags,
    priorityFixes: priorityFixes.slice(0, 6),
    profileSummary,
    bulletTemplates,
    missingKeywords: missing.slice(0, 10),
    strengths: [
      structure.contact ? "Contact details are visible." : "There is enough content to create a clearer contact section.",
      structure.projects ? "Projects are present and can be sharpened." : "Project proof can be added to make the CV more credible.",
      matched.length ? `You already mention ${matched.slice(0, 3).join(", ")}.` : "The CV has raw material that can be repositioned.",
    ],
    beforeApplying: [
      "Check that the CV opens cleanly as a PDF.",
      "Make the target role obvious in the top third.",
      "Add measurable outcomes where possible.",
      "Use truthful role-specific keywords naturally.",
      "Confirm links, portfolio, and contact details work.",
    ],
    recruiterReadout: [
      `First impression: ${decision === "Send" ? "credible and close to application-ready" : decision === "Fix" ? "promising but not yet sharp enough" : "not aligned enough for this role"}.`,
      `Portfolio signal: ${structure.portfolio ? "visible" : "missing or unclear"}.`,
      `Evidence quality: ${structure.metrics ? "some outcomes are present" : "needs measurable outcomes"}.`,
      `Role language: ${roleFit}.`,
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
