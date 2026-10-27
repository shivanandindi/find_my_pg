const form = document.getElementById("auth-form");
const errorBox = document.getElementById("form-error");
const submitButton = document.getElementById("submit-button");
const params = new URLSearchParams(window.location.search);
const state = {
  role: params.get("role")?.toUpperCase() === "OWNER" ? "OWNER" : "STUDENT",
  mode: params.get("mode") === "register" ? "register" : "login",
  csrf: null
};

function safeNext() {
  const next = params.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function updateForm() {
  const registering = state.mode === "register";
  document.querySelectorAll("[data-role]").forEach((button) => {
    button.classList.toggle("active", button.dataset.role === state.role);
    button.setAttribute("aria-selected", String(button.dataset.role === state.role));
  });
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
    button.setAttribute("aria-selected", String(button.dataset.mode === state.mode));
  });
  document.querySelectorAll(".register-field").forEach((field) => field.classList.toggle("hidden", !registering));
  document.querySelectorAll(".login-field").forEach((field) => field.classList.toggle("hidden", registering));
  document.querySelectorAll(".student-field").forEach((field) => field.classList.toggle("hidden", !registering || state.role !== "STUDENT"));
  document.querySelectorAll(".owner-field").forEach((field) => field.classList.toggle("hidden", !registering || state.role !== "OWNER"));
  const email = form.elements.email;
  const loginEmail = form.elements.loginEmail;
  email.required = registering;
  loginEmail.required = !registering;
  form.elements.fullName.required = registering;
  form.elements.phone.required = registering;
  form.elements.password.autocomplete = registering ? "new-password" : "current-password";
  form.elements.college.required = registering && state.role === "STUDENT";
  form.elements.workplace.required = registering && state.role === "STUDENT";
  form.elements.businessName.required = registering && state.role === "OWNER";
  form.elements.businessAddress.required = registering && state.role === "OWNER";
  document.getElementById("page-eyebrow").textContent = registering ? "MAKE YOURSELF AT HOME" : "YOUR NEXT CHAPTER";
  document.getElementById("page-title").textContent = registering ? "Let's get you settled" : "Welcome back";
  document.getElementById("page-description").textContent = registering
    ? state.role === "OWNER" ? "Set up your owner account and bring your PG online." : "Create your seeker account and find a place that fits."
    : "Sign in to pick up where you left off.";
  document.getElementById("submit-label").textContent = registering ? "Create account" : "Sign in";
  document.querySelector(".register-hint").classList.toggle("hidden", !registering);
  errorBox.classList.add("hidden");
  document.title = `${registering ? "Create account" : "Sign in"} | Find My PG`;
  window.history.replaceState(null, "", `?role=${state.role.toLowerCase()}&mode=${state.mode}&next=${encodeURIComponent(safeNext())}`);
}

async function getCsrf() {
  const response = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  if (!response.ok) throw new Error("Could not start a secure session. Refresh and try again.");
  const data = await response.json();
  state.csrf = data.token;
  return data;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  errorBox.focus?.();
}

document.querySelectorAll("[data-role]").forEach((button) => button.addEventListener("click", () => {
  state.role = button.dataset.role;
  updateForm();
}));

document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
  state.mode = button.dataset.mode;
  updateForm();
}));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.classList.add("hidden");
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const registering = state.mode === "register";
  const payload = registering
    ? {
        fullName: values.get("fullName").trim(),
        email: values.get("email").trim(),
        password: values.get("password"),
        phone: values.get("phone").trim(),
        role: state.role,
        college: values.get("college").trim() || null,
        course: values.get("course").trim() || null,
        workplace: values.get("workplace").trim() || null,
        preferredArea: values.get("preferredArea").trim() || null,
        businessName: values.get("businessName").trim() || null,
        businessAddress: values.get("businessAddress").trim() || null
      }
    : { email: values.get("loginEmail").trim(), password: values.get("password") };

  submitButton.disabled = true;
  document.getElementById("submit-label").textContent = registering ? "Creating account…" : "Signing in…";
  try {
    const csrf = await getCsrf();
    const response = await fetch(`/api/auth/${registering ? "register" : "login"}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", [csrf.headerName]: csrf.token },
      body: JSON.stringify(payload)
    });
    const result = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(result?.detail || "We couldn't complete that request. Please check your details.");
    if (registering) {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", [csrf.headerName]: csrf.token },
        body: JSON.stringify({ email: payload.email, password: payload.password })
      });
      if (!loginResponse.ok) throw new Error("Your account was created, but we couldn't sign you in. Please sign in with your new account.");
    }
    window.location.assign(safeNext());
  } catch (error) {
    showError(error.message || "Could not connect to Find My PG. Check your connection and try again.");
    submitButton.disabled = false;
    document.getElementById("submit-label").textContent = registering ? "Create account" : "Sign in";
  }
});

updateForm();
getCsrf().catch((error) => showError(error.message));
if (window.lucide) window.lucide.createIcons();