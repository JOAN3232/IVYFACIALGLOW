import { supabase } from "./supabaseClient.js";

// =====================
// ELEMENTS
// =====================
const signupForm = document.getElementById("signupForm");
const btn = document.getElementById("signupBtn");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");
const message = document.getElementById("signupMessage");

// =====================
// LOADING STATE
// =====================
function setLoading(state) {
  if (!btn) return;

  if (state) {
    btn.disabled = true;
    btnText.textContent = "Creating...";
    btnLoader?.classList.remove("hidden");
  } else {
    btn.disabled = false;
    btnText.textContent = "Create Account";
    btnLoader?.classList.add("hidden");
  }
}

// =====================
// PASSWORD TOGGLE
// =====================
const passwordInput = document.getElementById("signupPassword");
const toggleBtn = document.getElementById("toggleSignupPassword");

toggleBtn?.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  toggleBtn.textContent = isHidden ? "Hide" : "Show";
});

// =====================
// SIGNUP LOGIC
// =====================
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  setLoading(true);
  message.textContent = "";

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  setLoading(false);

  if (error) {
    message.textContent = error.message;
    message.style.color = "red";
    return;
  }

  message.textContent = "Account created successfully 🎉 Redirecting...";
  message.style.color = "green";

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
});