const supabaseClient = window.supabase.createClient(
  FIXSEND_SUPABASE_URL,
  FIXSEND_SUPABASE_ANON_KEY
);

const roleLabels = {
  "ux-designer": "UX Designer",
  "ui-designer": "UI Designer",
  "product-designer": "Product Designer",
  "web-designer": "Web Designer",
  "graphic-designer": "Graphic Designer",
  "frontend-developer": "Frontend Developer",
  "junior-designer": "Junior Designer",
  "career-switcher": "Career Switcher",
};

const fixPackForm = document.querySelector("#fixPackForm");
const submitButton = document.querySelector("#submitButton");
const submitMessage = document.querySelector("#submitMessage");

function getSubmitValue(selector) {
  return document.querySelector(selector).value.trim();
}

fixPackForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitMessage.textContent = "";

  const email = getSubmitValue("#email");
  const cvText = getSubmitValue("#cvText");
  const targetRole = getSubmitValue("#targetRole");
  const targetRoleLabel = roleLabels[targetRole] || "Product Designer";

  if (!email || !cvText) {
    submitMessage.textContent = "Please add your purchase email and CV text.";
    return;
  }

  if (cvText.split(/\s+/).length < 35) {
    submitMessage.textContent = "This CV text looks too short. Paste the full readable CV text.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Creating dashboard...";

  const dashboardData = createFixPack({
    fullName: getSubmitValue("#fullName"),
    email,
    targetRole,
    targetRoleLabel,
    cvText,
  });

  const { data, error } = await supabaseClient
    .from("fixpack_reports")
    .insert({
      email,
      full_name: getSubmitValue("#fullName"),
      target_role: targetRoleLabel,
      fixsend_score: getSubmitValue("#fixsendScore"),
      cv_text: cvText,
      decision: dashboardData.decision,
      overall_score: dashboardData.overallScore,
      readiness_score: dashboardData.readinessScore,
      role_fit: dashboardData.roleFit,
      dashboard_data: dashboardData,
    })
    .select("id")
    .single();

  if (error) {
    submitButton.disabled = false;
    submitButton.textContent = "Create dashboard";
    submitMessage.textContent =
      "Dashboard could not be created. Check the Supabase insert policy and try again.";
    return;
  }

  window.location.href = `dashboard.html?id=${data.id}`;
});
