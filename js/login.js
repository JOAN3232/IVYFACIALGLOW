// Handles buyer login, password visibility, redirect-after-login behavior, and
// unfinished checkout prompts.
import { supabase } from "./supabaseClient.js";

const loginForm = document.getElementById("loginForm");
const btn = document.getElementById("loginBtn");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");
const message = document.getElementById("loginMessage");
const passwordInput = document.getElementById("loginPassword");
const toggleBtn = document.getElementById("toggleLoginPassword");
const continueCheckoutModal = document.getElementById("continueCheckoutModal");
const continueCheckoutBtn = document.getElementById("continueCheckoutBtn");
const skipContinueCheckoutBtn = document.getElementById("skipContinueCheckoutBtn");
const continueCheckoutMessage = document.getElementById("continueCheckoutMessage");

let normalRedirectTo = "index.html";
let pendingCheckoutUrl = "checkout.html?continueCheckout=1";

function setLoading(state) {
  if (!btn) return;

  btn.disabled = state;
  btnText.textContent = state ? "Logging in..." : "Login";
  btnLoader?.classList.toggle("hidden", !state);
}

function redirectTo(url) {
  window.location.href = url;
}

function showContinueCheckoutPrompt(checkout) {
  const order = checkout?.order;
  const orderId = order?.id || "";

  if (orderId) {
    pendingCheckoutUrl = `checkout.html?continueCheckout=1&order=${encodeURIComponent(orderId)}`;
    localStorage.setItem(`ivy_pending_payment_order_${order.user_id}`, orderId);
    sessionStorage.setItem(`ivy_pending_payment_order_${order.user_id}`, orderId);
  } else {
    pendingCheckoutUrl = "checkout.html?continueCheckout=1&draft=1";
  }

  if (continueCheckoutMessage) {
    continueCheckoutMessage.textContent =
      order?.payment_status === "confirmed"
        ? "Your payment has been confirmed. You can continue and place your order."
        : checkout?.type === "draft"
        ? "You started checkout on another device. Continue from where you stopped?"
        : "Your transfer checkout is still waiting. Continue from where you stopped?";
  }

  continueCheckoutModal?.classList.remove("hidden");
  continueCheckoutModal?.classList.add("flex");
}

async function getUnfinishedCheckout(user) {
  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("id,user_id,payment_status,status,created_at")
    .eq("user_id", user.id)
    .in("status", ["awaiting_payment"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && data) return { type: "order", order: data };

  const { data: draft, error: draftError } = await supabase
    .from("checkout_drafts")
    .select("user_id,items,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (draftError || !draft) return null;

  const hasItems = Array.isArray(draft.items) && draft.items.length > 0;
  return hasItems ? { type: "draft", draft } : null;
}

toggleBtn?.addEventListener("click", () => {
  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  toggleBtn.textContent = isHidden ? "Hide" : "Show";
});

continueCheckoutBtn?.addEventListener("click", () => {
  redirectTo(pendingCheckoutUrl);
});

skipContinueCheckoutBtn?.addEventListener("click", () => {
  redirectTo(normalRedirectTo);
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

  const { data, error } = await supabase.auth.signInWithPassword({
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

  normalRedirectTo = nextFromUrl || nextFromSession || "index.html";

  sessionStorage.removeItem("redirectAfterLogin");

  const unfinishedCheckout = await getUnfinishedCheckout(data.user);

  if (unfinishedCheckout && normalRedirectTo !== "checkout.html") {
    message.textContent = "Login successful. Checkout found.";
    showContinueCheckoutPrompt(unfinishedCheckout);
    return;
  }

  setTimeout(() => {
    redirectTo(normalRedirectTo);
  }, 800);
});
