import { adminSupabase } from "./adminClient.js";

const ADMIN_EMAILS = ["ivyfacialsaesthetics@gmail.com"];

const form = document.getElementById("adminLoginForm");
const button = document.getElementById("adminLoginBtn");
const message = document.getElementById("adminLoginMessage");

function setupAdminBackToTop() {
  if (document.getElementById("back-to-top")) return;

  const style = document.createElement("style");
  style.textContent = `
    .admin-back-to-top {
      position: fixed;
      right: 1.2rem;
      bottom: 1.2rem;
      z-index: 9998;
      width: 3rem;
      height: 3rem;
      border: 1px solid #ead9dd;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.94);
      color: #d89ca4;
      box-shadow: 0 16px 38px rgba(92, 74, 74, 0.16);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transform: translateY(0.65rem);
      transition: opacity 180ms ease, transform 180ms ease;
    }
    .admin-back-to-top.is-visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.id = "back-to-top";
  button.type = "button";
  button.className = "admin-back-to-top";
  button.setAttribute("aria-label", "Back to top");
  button.innerHTML = "↑";
  document.body.appendChild(button);

  const toggleButton = () => button.classList.toggle("is-visible", window.scrollY > 420);
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", toggleButton, { passive: true });
  toggleButton();
}

document.addEventListener("DOMContentLoaded", setupAdminBackToTop);

function setMessage(text, color) {
  if (!message) return;
  message.textContent = text;
  message.style.color = color;
}

function setLoading(isLoading) {
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? "Logging in..." : "Login to Dashboard";
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("adminEmail")?.value.trim();
  const password = document.getElementById("adminPassword")?.value;

  if (!email || !password) {
    setMessage("Please enter admin email and password.", "red");
    return;
  }

  if (!ADMIN_EMAILS.includes(email)) {
    setMessage("This email is not allowed to access admin.", "red");
    return;
  }

  setLoading(true);
  setMessage("", "");

  const { error } = await adminSupabase.auth.signInWithPassword({
    email,
    password,
  });

  setLoading(false);

  if (error) {
    setMessage(error.message, "red");
    return;
  }

  setMessage("Admin login successful. Redirecting...", "green");

  setTimeout(() => {
    window.location.href = "admin-dashboard.html";
  }, 700);
});
