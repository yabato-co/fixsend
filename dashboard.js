const dashboardClient = window.supabase.createClient(
  FIXSEND_SUPABASE_URL,
  FIXSEND_SUPABASE_ANON_KEY
);

const params = new URLSearchParams(window.location.search);
const reportId = params.get("id");
const page = document.querySelector(".dashboard-page");

function listItems(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
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
  page.innerHTML = `
    <header class="dashboard-topbar">
      <a class="dashboard-brand" href="index.html">
        <span>FS</span>
        <strong>FixSend Fix Pack</strong>
      </a>
      <p>Private dashboard</p>
    </header>

    <section class="dashboard-hero">
      <div>
        <p class="eyebrow">Prepared for ${escapeHtml(data.fullName)}</p>
        <h1>Your CV improvement plan is ready.</h1>
        <p>${escapeHtml(data.diagnosis)}</p>
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

    <section class="dashboard-grid">
      <article class="dashboard-card">
        <h2>Priority Fixes</h2>
        <ul>${listItems(data.priorityFixes)}</ul>
      </article>

      <article class="dashboard-card">
        <h2>Profile Summary</h2>
        <p>${escapeHtml(data.profileSummary)}</p>
      </article>

      <article class="dashboard-card">
        <h2>Bullet Rewrite Guidance</h2>
        <div class="rewrite-list">
          ${data.bulletTemplates
            .map(
              (item, index) => `
                <div class="rewrite-block">
                  <span>Template ${index + 1}</span>
                  <p>${escapeHtml(item)}</p>
                </div>
              `
            )
            .join("")}
        </div>
      </article>

      <article class="dashboard-card">
        <h2>Missing Keywords</h2>
        <ul>${listItems(data.missingKeywords)}</ul>
      </article>

      <article class="dashboard-card">
        <h2>Strengths</h2>
        <ul>${listItems(data.strengths)}</ul>
      </article>

      <article class="dashboard-card">
        <h2>Before Applying</h2>
        <ul>${listItems(data.beforeApplying)}</ul>
      </article>
    </section>

    <section class="dashboard-panel">
      <h2>Next Step Recommendation</h2>
      <p>${escapeHtml(data.nextStep)}</p>
    </section>
  `;
}

async function loadDashboard() {
  if (!reportId) {
    page.innerHTML = `
      <header class="dashboard-topbar">
        <a class="dashboard-brand" href="index.html">
          <span>FS</span>
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
