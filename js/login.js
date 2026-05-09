import { supabase } from "./supabaseClient.js";

const loginForm = document.getElementById("loginForm");
const btn = document.getElementById("loginBtn");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");
const message = document.getElementById("loginMessage");
const passwordInput = document.getElementById("loginPassword");
const toggleBtn = document.getElementById("toggleLoginPassword");

function setLoading(state) {
  if (!btn) return;

  btn.disabled = state;
  btnText.textContent = state ? "Logging in..." : "Login";
  btnLoader?.classList.toggle("hidden", !state);
}

toggleBtn?.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  toggleBtn.textContent = isHidden ? "Hide" : "Show";
});

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    message.textContent = "Please enter your email and password.";
    message.style.color = "red";
    return;
  }

  setLoading(true);
  message.textContent = "";

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  setLoading(false);

  if (error) {
    message.textContent = error.message;
    message.style.color = "red";
    return;
  }

  message.textContent = "Login successful 🎉 Redirecting...";
  message.style.color = "green";

  const params = new URLSearchParams(window.location.search);
  const nextFromUrl = params.get("next");
  const nextFromSession = sessionStorage.getItem("redirectAfterLogin");

  const redirectTo = nextFromUrl || nextFromSession || "index.html";

  sessionStorage.removeItem("redirectAfterLogin");

  setTimeout(() => {
    window.location.href = redirectTo;
  }, 800);
});