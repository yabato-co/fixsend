const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "this",
  "to",
  "with",
  "you",
  "your",
  "we",
  "will",
  "work",
  "team",
  "role",
  "job",
  "candidate",
  "experience",
]);

const generalDesignKeywords = [
  "figma",
  "prototype",
  "wireframe",
  "usability",
  "research",
  "user flow",
  "journey map",
  "design system",
  "interaction",
  "accessibility",
  "responsive",
  "mobile",
  "dashboard",
  "component",
  "user testing",
  "persona",
  "information architecture",
  "visual design",
  "typography",
  "layout",
  "product",
  "metrics",
  "stakeholder",
  "handoff",
  "documentation",
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
  "analyzed",
  "tested",
  "optimized",
  "created",
  "delivered",
  "managed",
  "documented",
  "validated",
  "researched",
  "built",
];

const roleKeywords = {
  "ux-designer": [
    "ux",
    "research",
    "persona",
    "journey",
    "usability",
    "prototype",
    "wireframe",
    "user flow",
    "information architecture",
    "testing",
  ],
  "ui-designer": [
    "ui",
    "visual",
    "typography",
    "layout",
    "component",
    "design system",
    "figma",
    "responsive",
    "interface",
  ],
  "product-designer": [
    "product",
    "metrics",
    "stakeholder",
    "prototype",
    "research",
    "design system",
    "handoff",
    "roadmap",
    "experiment",
  ],
  "web-designer": [
    "web",
    "responsive",
    "layout",
    "landing",
    "typography",
    "figma",
    "html",
    "css",
    "accessibility",
  ],
  "graphic-designer": [
    "brand",
    "visual",
    "typography",
    "layout",
    "illustration",
    "adobe",
    "campaign",
    "print",
    "identity",
  ],
  "frontend-developer": [
    "frontend",
    "javascript",
    "html",
    "css",
    "react",
    "responsive",
    "accessibility",
    "component",
    "api",
  ],
  "junior-designer": [
    "junior",
    "figma",
    "portfolio",
    "project",
    "wireframe",
    "prototype",
    "visual",
    "research",
    "learning",
  ],
  "career-switcher": [
    "transferable",
    "project",
    "portfolio",
    "learning",
    "collaborated",
    "research",
    "communication",
    "problem",
    "design",
  ],
};

const form = document.querySelector("#analysisForm");
const cvFile = document.querySelector("#cvFile");
const cvFileHelp = document.querySelector("#cvFileHelp");
const cvText = document.querySelector("#cvText");
const jobText = document.querySelector("#jobText");
const targetRole = document.querySelector("#targetRole");
const formMessage = document.querySelector("#formMessage");
const loadingState = document.querySelector("#loadingState");
const results = document.querySelector("#results");

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

function normalize(text) {
  const cleaned = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " link ")
    .replace(/[^a-z0-9@\s.+-]/g, " ");

  const words = cleaned
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const frequency = words.reduce((map, word) => {
    map[word] = (map[word] || 0) + 1;
    return map;
  }, {});

  return { cleaned, words, frequency };
}

function includesPhrase(text, keyword) {
  return text.includes(keyword.toLowerCase());
}

function countMatches(text, keywords) {
  return keywords.filter((keyword) => includesPhrase(text, keyword)).length;
}

function extractImportantKeywords(jobData, role) {
  const hasJobDescription = jobData.words.length > 0;
  if (!hasJobDescription) {
    return [...new Set([...(roleKeywords[role] || []), ...generalDesignKeywords])].slice(0, 24);
  }

  const frequentWords = Object.entries(jobData.frequency)
    .filter(([, count]) => count > 1)
    .map(([word]) => word);

  const roleSet = roleKeywords[role] || [];
  const designFromJob = generalDesignKeywords.filter((keyword) =>
    includesPhrase(jobData.cleaned, keyword)
  );
  const roleFromJob = roleSet.filter((keyword) => includesPhrase(jobData.cleaned, keyword));

  return [...new Set([...roleFromJob, ...designFromJob, ...frequentWords])].slice(0, 24);
}

function percent(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function clampScore(value) {
  return Math.max(0, Math.min(10, value));
}

function getStructureChecks(cleanedCv, rawCv) {
  return {
    contact: /[\w.+-]+@[\w-]+\.[\w.-]+/.test(rawCv) || /\b(contact|phone|email)\b/.test(cleanedCv),
    portfolio: /https?:\/\/\S+/.test(rawCv) || /\b(portfolio|behance|dribbble|github|personal site)\b/.test(cleanedCv),
    experience: /\b(experience|employment|worked|internship|freelance)\b/.test(cleanedCv),
    education: /\b(education|university|college|degree|bootcamp|course)\b/.test(cleanedCv),
    skills: /\b(skills|tools|competencies|technologies)\b/.test(cleanedCv),
    projects: /\b(project|case study|case studies|launched|built)\b/.test(cleanedCv),
    tools: /\b(figma|sketch|adobe|photoshop|illustrator|html|css|javascript|react)\b/.test(cleanedCv),
    metrics: /\b\d+%|\b\d+x|\b\d+\+|\bmetrics|conversion|revenue|retention|reduced|increased\b/.test(cleanedCv),
  };
}

function analyze(cv, job, role) {
  const cvData = normalize(cv);
  const jobData = normalize(job);
  const hasJobDescription = jobData.words.length > 0;
  const importantKeywords = extractImportantKeywords(jobData, role);
  const matchedKeywords = importantKeywords.filter((keyword) => includesPhrase(cvData.cleaned, keyword));
  const missingKeywords = importantKeywords.filter((keyword) => !includesPhrase(cvData.cleaned, keyword));
  const roleSet = roleKeywords[role] || [];
  const designMatches = countMatches(cvData.cleaned, generalDesignKeywords);
  const roleMatches = countMatches(cvData.cleaned, roleSet);
  const impactMatches = countMatches(cvData.cleaned, impactWords);
  const structure = getStructureChecks(cvData.cleaned, cv);
  const structureCount = Object.values(structure).filter(Boolean).length;

  const keywordMatchPercentage = percent(matchedKeywords.length, importantKeywords.length);
  const designKeywordScore = clampScore((designMatches / 9) * 10);
  const impactScore = clampScore((impactMatches / 7) * 10);
  const structureScore = clampScore((structureCount / Object.keys(structure).length) * 10);
  const roleFitScore = clampScore((roleMatches / Math.max(roleSet.length, 1)) * 10);
  const keywordScore = keywordMatchPercentage / 10;
  const overallScore = hasJobDescription
    ? clampScore(
        keywordScore * 0.35 +
          designKeywordScore * 0.18 +
          impactScore * 0.16 +
          structureScore * 0.16 +
          roleFitScore * 0.15
      )
    : clampScore(
        roleFitScore * 0.34 +
          structureScore * 0.26 +
          designKeywordScore * 0.22 +
          impactScore * 0.18
      );

  const criticalGaps = [];
  const isDesignRole = role !== "frontend-developer";

  if (isDesignRole && !structure.portfolio) criticalGaps.push("No portfolio link for this design role.");
  if (isDesignRole && !structure.tools) criticalGaps.push("No design tools are mentioned.");
  if (roleMatches === 0) criticalGaps.push("No relevant role keywords found.");
  if (!structure.experience && !structure.projects) criticalGaps.push("No clear experience or projects section.");
  if (impactMatches < 2) criticalGaps.push("Few impact or action words.");
  if (hasJobDescription && keywordMatchPercentage < 35) {
    criticalGaps.push("Very low keyword match with the job description.");
  }

  let decision = "Fix";
  if (overallScore >= 8 && criticalGaps.length === 0) decision = "Send";
  if (overallScore < 5.5 || criticalGaps.length >= 3 || roleMatches === 0) decision = "Skip";

  const strengths = [];
  if (hasJobDescription && keywordMatchPercentage >= 65) {
    strengths.push("Your CV mirrors several important job description keywords.");
  }
  if (structure.portfolio) strengths.push("Portfolio or project link is visible.");
  if (structure.metrics) strengths.push("You include numbers, metrics, or measurable outcomes.");
  if (impactMatches >= 4) strengths.push("Your CV uses action language that makes achievements easier to scan.");
  if (roleMatches >= 3) strengths.push("Your role-specific language is aligned with the selected target role.");
  if (!strengths.length) strengths.push("You have enough material to improve the application before sending.");

  const weaknesses = [...criticalGaps];
  if (!structure.education) weaknesses.push("Education, training, or learning background is not easy to find.");
  if (!structure.skills) weaknesses.push("Skills section is not clearly signposted.");
  if (!weaknesses.length) weaknesses.push("No major weakness detected by the rule-based MVP.");

  const quickFixes = [
    ...missingKeywords
      .slice(0, 5)
      .map((keyword) => `Add relevant proof for "${keyword}" if it is truthful.`),
  ];
  if (!structure.portfolio && isDesignRole) quickFixes.push("Add a portfolio link near your contact details.");
  if (!structure.metrics) quickFixes.push("Rewrite one or two bullets with numbers, outcomes, or scope.");
  if (impactMatches < 3) quickFixes.push("Start more bullets with clear action words like designed, tested, launched, or improved.");
  if (!quickFixes.length) quickFixes.push("Tighten your strongest bullets and apply with confidence.");

  return {
    decision,
    overallScore: overallScore.toFixed(1),
    keywordMatchPercentage,
    matchLabel: hasJobDescription ? "Keyword match" : "CV readiness",
    roleFitLevel: roleFitScore >= 7 ? "Strong" : roleFitScore >= 4.5 ? "Medium" : "Low",
    missingKeywords: missingKeywords.slice(0, 10),
    strengths,
    weaknesses: weaknesses.slice(0, 6),
    quickFixes: quickFixes.slice(0, 7),
    checklist: [
      structure.contact ? "Contact details are visible." : "Add email or contact details.",
      structure.portfolio || !isDesignRole ? "Portfolio requirement looks covered." : "Add a portfolio link.",
      hasJobDescription
        ? keywordMatchPercentage >= 55
          ? "Keyword match is workable."
          : "Add more truthful job-specific keywords."
        : "Add a job description later if you want application-specific keyword matching.",
      impactMatches >= 3 ? "Action language is present." : "Use stronger action verbs in your bullets.",
      structure.metrics ? "Measurable outcomes are included." : "Add metrics or concrete project scope where possible.",
    ],
  };
}

function renderList(selector, items, emptyText) {
  const element = document.querySelector(selector);
  element.innerHTML = "";
  const safeItems = items.length ? items : [emptyText];

  safeItems.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
}

function renderResults(data) {
  const decisionTitle = document.querySelector("#decisionTitle");
  const decisionBadge = document.querySelector("#decisionBadge");
  const decisionSummary = document.querySelector("#decisionSummary");
  const decisionClass = data.decision.toLowerCase();

  decisionTitle.textContent = data.decision;
  decisionBadge.textContent = data.decision;
  decisionBadge.className = `decision-badge ${decisionClass}`;

  const summaries = {
    Send: "This application looks ready enough to send. Do a final proofread, then apply.",
    Fix: "This application has potential, but a few targeted fixes can improve your odds.",
    Skip: "This role may be too far from your current CV. Apply only if you can close the core gaps honestly.",
  };

  decisionSummary.textContent = summaries[data.decision];
  document.querySelector("#overallScore").textContent = `${data.overallScore} / 10`;
  document.querySelector(".metric-card:nth-child(2) span").textContent = data.matchLabel;
  document.querySelector("#keywordMatch").textContent = `${data.keywordMatchPercentage}%`;
  document.querySelector("#roleFit").textContent = data.roleFitLevel;

  renderList("#missingKeywords", data.missingKeywords, "No major missing keywords found.");
  renderList("#strengths", data.strengths, "No strengths detected yet.");
  renderList("#weaknesses", data.weaknesses, "No major weaknesses detected.");
  renderList("#quickFixes", data.quickFixes, "No quick fixes needed.");
  renderList("#beforeChecklist", data.checklist, "Review your CV once more before applying.");
}

function setFileHelp(message, isError = false) {
  cvFileHelp.textContent = message;
  cvFileHelp.classList.toggle("error-text", isError);
}

async function readPdfFile(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF reader is still loading. Please try again in a few seconds.");
  }

  const buffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }

  return pages.join("\n\n");
}

async function readDocxFile(file) {
  if (!window.mammoth) {
    throw new Error("DOCX reader is still loading. Please try again in a few seconds.");
  }

  const buffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

async function readCvFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || file.type === "text/plain") {
    return file.text();
  }

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return readPdfFile(file);
  }

  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return readDocxFile(file);
  }

  throw new Error("Please upload a PDF, DOCX, or TXT file.");
}

cvFile.addEventListener("change", async () => {
  const file = cvFile.files[0];
  if (!file) return;

  setFileHelp("Reading your CV locally in this browser...");
  formMessage.textContent = "";

  try {
    const text = await readCvFile(file);
    if (!text.trim()) {
      throw new Error("I could not find readable text in this file. Try copying and pasting the CV text instead.");
    }

    cvText.value = text.trim();
    setFileHelp(`Loaded "${file.name}". Your CV is not uploaded or stored.`);
  } catch (error) {
    cvText.value = "";
    setFileHelp(`${error.message} You can still paste your CV text into the box below.`, true);
  }
});

function validateInputs(cv, job) {
  if (!cv.trim()) return "Please upload your CV or paste your CV text first.";
  if (cv.trim().split(/\s+/).length < 35) {
    return "This CV looks very short. Upload the full CV or paste more detail so FixSend can score it properly.";
  }
  if (job.trim() && job.trim().split(/\s+/).length < 20) {
    return "The job description is optional, but if you use it, paste a little more detail or leave it empty.";
  }
  return "";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.textContent = "";
  results.hidden = true;

  const error = validateInputs(cvText.value, jobText.value);
  if (error) {
    formMessage.textContent = error;
    return;
  }

  loadingState.hidden = false;

  window.setTimeout(() => {
    const data = analyze(cvText.value, jobText.value, targetRole.value);
    renderResults(data);
    loadingState.hidden = true;
    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 1500);
});
