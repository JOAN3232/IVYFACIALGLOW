import { adminSupabase } from "./adminClient.js";

const ADMIN_EMAILS = ["ivyfacialsaesthetics@gmail.com"];

const form = document.getElementById("adminLoginForm");
const button = document.getElementById("adminLoginBtn");
const message = document.getElementById("adminLoginMessage");

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
