const dashboardClient = window.supabase.createClient(
  FIXSEND_SUPABASE_URL,
  FIXSEND_SUPABASE_ANON_KEY
);

const params = new URLSearchParams(window.location.search);
const reportId = params.get("id");
const page = document.querySelector(".dashboard-page");

function safeArray(items, fallback = []) {
  return Array.isArray(items) && items.length ? items : fallback;
}

function listItems(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function checkboxItems(items) {
  return items
    .map(
      (item, index) => `
        <label class="check-item">
          <input type="checkbox" id="task-${index}" />
          <span>${escapeHtml(item)}</span>
        </label>
      `
    )
    .join("");
}

function scoreBars(items) {
  return (items || [])
    .map(
      (item) => `
        <article class="score-card">
          <div class="score-card-top">
            <div>
              <h3>${escapeHtml(item.label)}</h3>
              <p>${escapeHtml(item.note)}</p>
            </div>
            <strong>${escapeHtml(item.score)}%</strong>
          </div>
          <div class="score-track" aria-hidden="true">
            <span style="width: ${Number(item.score) || 0}%"></span>
          </div>
          <small>${escapeHtml(item.status)}</small>
        </article>
      `
    )
    .join("");
}

function scoreRings(items) {
  return (items || [])
    .slice(0, 5)
    .map((item) => {
      const score = Math.max(0, Math.min(100, Number(item.score) || 0));
      return `
        <article class="signal-ring" style="--score: ${score}">
          <div class="ring-chart">
            <span>${score}%</span>
          </div>
          <div>
            <h3>${escapeHtml(item.label)}</h3>
            <p>${escapeHtml(item.status)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function roadmapItems(data) {
  const fixes = safeArray(data.priorityFixes, ["Tighten the role positioning in the top third of the CV."]);
  return [
    {
      label: "First 10 minutes",
      title: "Make the CV obvious",
      text: fixes[0] || "Put the strongest role signal near the top.",
    },
    {
      label: "Next 30 minutes",
      title: "Add proof",
      text: fixes[1] || "Add measurable outcomes, tools, scope, or project context.",
    },
    {
      label: "Before applying",
      title: "Final scan",
      text: data.nextStep || "Run through the checklist and make sure links work.",
    },
  ];
}

function roadmap(data) {
  return roadmapItems(data)
    .map(
      (item, index) => `
        <article class="roadmap-step">
          <span>${index + 1}</span>
          <div>
            <small>${escapeHtml(item.label)}</small>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function copyText(text, button) {
  const copyWithFallback = () => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied ? Promise.resolve() : Promise.reject(new Error("Copy failed"));
  };

  const copyPromise = copyWithFallback().catch(() =>
    navigator.clipboard?.writeText
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error("Copy failed"))
  );

  copyPromise
    .then(() => {
      const original = button.querySelector("span")?.textContent || button.textContent;
      button.classList.add("copied");
      button.querySelector("span").textContent = "Copied";
      window.setTimeout(() => {
        button.classList.remove("copied");
        button.querySelector("span").textContent = original;
      }, 1400);
    })
    .catch(() => {
      button.querySelector("span").textContent = "Manual copy";
      showCopyFallback(text);
    });
}

function showCopyFallback(text) {
  let panel = document.querySelector(".copy-fallback");
  if (!panel) {
    panel = document.createElement("div");
    panel.className = "copy-fallback";
    panel.innerHTML = `
      <div>
        <strong>Copy manually</strong>
        <button type="button" aria-label="Close copy box">Close</button>
      </div>
      <textarea readonly></textarea>
    `;
    document.body.appendChild(panel);
    panel.querySelector("button").addEventListener("click", () => panel.remove());
  }
  const textarea = panel.querySelector("textarea");
  textarea.value = text;
  textarea.focus();
  textarea.select();
}

function bindDashboardActions(data) {
  const shareButton = document.querySelector("[data-action='copy-link']");
  const fixesButton = document.querySelector("[data-action='copy-fixes']");
  const printButton = document.querySelector("[data-action='print']");
  const templateButtons = document.querySelectorAll("[data-copy-template]");

  shareButton?.addEventListener("click", () => copyText(window.location.href, shareButton));
  fixesButton?.addEventListener("click", () => {
    const fixes = safeArray(data.priorityFixes).map((item, index) => `${index + 1}. ${item}`).join("\n");
    copyText(fixes, fixesButton);
  });
  printButton?.addEventListener("click", () => window.print());
  templateButtons.forEach((button) => {
    button.addEventListener("click", () => copyText(button.dataset.copyTemplate || "", button));
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderDashboard(data) {
  const decisionClass = data.decision.toLowerCase();
  const categoryScores = safeArray(data.categoryScores);
  const riskFlags = safeArray(data.riskFlags);
  const recruiterReadout = safeArray(data.recruiterReadout);
  const strengths = safeArray(data.strengths, ["You have usable CV material that can be sharpened."]);
  const missingKeywords = safeArray(data.missingKeywords, ["No major missing keywords detected."]);
  const bulletTemplates = safeArray(data.bulletTemplates, ["Designed [project/interface] for [audience], improving [result]."]);
  const beforeApplying = safeArray(data.beforeApplying, ["Check the PDF, links, spelling, and top-third role positioning."]);

  page.innerHTML = `
    <header class="dashboard-topbar">
      <a class="dashboard-brand" href="index.html">
        <span><img src="fixsend-logo.svg" alt="" /></span>
        <strong>FixSend Fix Pack</strong>
      </a>
      <div class="topbar-actions">
        <button class="icon-button" type="button" data-action="copy-link">
          <i data-lucide="link"></i>
          <span>Copy link</span>
        </button>
        <button class="icon-button" type="button" data-action="print">
          <i data-lucide="printer"></i>
          <span>Save PDF</span>
        </button>
      </div>
    </header>

    <section class="dashboard-hero">
      <div>
        <p class="eyebrow">Prepared for ${escapeHtml(data.fullName)}</p>
        <h1>Your CV improvement plan is ready.</h1>
        <p>${escapeHtml(data.diagnosis)}</p>
        <div class="hero-actions">
          <a class="dashboard-button" href="#priority-fixes">
            <i data-lucide="list-checks"></i>
            <span>Start fixes</span>
          </a>
          <button class="dashboard-button secondary" type="button" data-action="copy-fixes">
            <i data-lucide="clipboard-copy"></i>
            <span>Copy fixes</span>
          </button>
        </div>
        <div class="metric-row">
          <div class="metric">
            <span>FixSend score</span>
            <strong>${escapeHtml(data.overallScore)} / 10</strong>
          </div>
          <div class="metric">
            <span>CV readiness</span>
            <strong>${escapeHtml(data.readinessScore)}%</strong>
          </div>
          <div class="metric">
            <span>Role fit</span>
            <strong>${escapeHtml(data.roleFit)}</strong>
          </div>
        </div>
      </div>
      <aside class="decision-box ${decisionClass}">
        <strong>${escapeHtml(data.decision)}</strong>
        <p>${escapeHtml(data.nextStep)}</p>
      </aside>
    </section>

    <section class="dashboard-panel signal-panel">
      <div>
        <p class="eyebrow">Signal map</p>
        <h2>Your CV at a glance</h2>
        <p>These are the five signals this Fix Pack uses to judge whether your CV feels ready, risky, or fixable.</p>
      </div>
      <div class="signal-grid">
        ${scoreRings(categoryScores)}
      </div>
    </section>

    <section class="dashboard-panel overview-panel">
      <div>
        <p class="eyebrow">Dashboard includes</p>
        <h2>What your Fix Pack covers</h2>
        <p>
          This report scores the signals recruiters look for in your selected role:
          portfolio or project proof, process clarity, measurable impact, role language, and scan clarity.
        </p>
      </div>
      <ul class="pill-list">
        ${listItems(data.dashboardSections || ["CV diagnosis", "Priority fixes", "Rewrite guidance", "Missing keywords"])}
      </ul>
    </section>

    <section class="score-section">
      ${scoreBars(categoryScores)}
    </section>

    <section class="dashboard-panel roadmap-panel">
      <div>
        <p class="eyebrow">Action plan</p>
        <h2>What to do next</h2>
      </div>
      <div class="roadmap-grid">
        ${roadmap(data)}
      </div>
    </section>

    <section class="dashboard-grid">
      <article class="dashboard-card" id="priority-fixes">
        <h2>Priority Fixes</h2>
        <ul>${listItems(safeArray(data.priorityFixes))}</ul>
      </article>

      <article class="dashboard-card">
        <h2>Recruiter Scan</h2>
        <ul>${listItems(recruiterReadout)}</ul>
      </article>

      <article class="dashboard-card warning-card">
        <h2>Risk Flags</h2>
        <ul>${listItems(riskFlags.length ? riskFlags : ["No critical risk flags found. Keep polishing the strongest evidence."])}</ul>
      </article>

      <article class="dashboard-card">
        <h2>Profile Summary Direction</h2>
        <p>${escapeHtml(data.profileSummary)}</p>
      </article>

      <article class="dashboard-card">
        <h2>Bullet Rewrite Guidance</h2>
        <div class="rewrite-list">
          ${bulletTemplates
            .map(
              (item, index) => `
                <div class="rewrite-block">
                  <div class="rewrite-head">
                    <span>Template ${index + 1}</span>
                    <button class="mini-button" type="button" data-copy-template="${escapeHtml(item)}">
                      <i data-lucide="copy"></i>
                      <span>Copy</span>
                    </button>
                  </div>
                  <p>${escapeHtml(item)}</p>
                </div>
              `
            )
            .join("")}
        </div>
      </article>

      <article class="dashboard-card">
        <h2>Missing Keywords</h2>
        <ul>${listItems(missingKeywords)}</ul>
      </article>

      <article class="dashboard-card">
        <h2>Strengths</h2>
        <ul>${listItems(strengths)}</ul>
      </article>

      <article class="dashboard-card checklist-card">
        <h2>Before Applying</h2>
        <div class="checklist">${checkboxItems(beforeApplying)}</div>
      </article>
    </section>

    <section class="dashboard-panel">
      <h2>Next Step Recommendation</h2>
      <p>${escapeHtml(data.nextStep)}</p>
    </section>
  `;

  bindDashboardActions(data);
  if (window.lucide) window.lucide.createIcons();
}

async function loadDashboard() {
  if (!reportId) {
    page.innerHTML = `
      <header class="dashboard-topbar">
        <a class="dashboard-brand" href="index.html">
          <span><img src="fixsend-logo.svg" alt="" /></span>
          <strong>FixSend Fix Pack</strong>
        </a>
        <p>Private dashboard</p>
      </header>
      <section class="dashboard-hero">
        <div>
          <p class="eyebrow">Locked dashboard</p>
          <h1>This dashboard needs a valid private link.</h1>
          <p>
            Fix Pack dashboards are created after purchase. Use the private dashboard
            link generated after checkout.
          </p>
          <a class="dashboard-button" href="index.html#try-it">Back to FixSend</a>
        </div>
      </section>
    `;
    return;
  }

  const { data, error } = await dashboardClient
    .from("fixpack_reports")
    .select("dashboard_data")
    .eq("id", reportId)
    .single();

  if (error || !data) {
    page.innerHTML = "<p>This dashboard could not be found.</p>";
    return;
  }

  renderDashboard(data.dashboard_data);
}

loadDashboard();
