// Shared buyer authentication helpers used by pages that need the current
// Supabase user or must redirect guests to login.
import { supabase } from "./supabaseClient.js";

let currentUser = null;

export function isAuthExpiredError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("jwt expired") || message.includes("token is expired");
}

export async function handleExpiredSession(redirectAfterLogin = window.location.pathname.split("/").pop() || "index.html") {
  currentUser = null;
  sessionStorage.setItem("redirectAfterLogin", redirectAfterLogin);
  await supabase.auth.signOut();
  window.location.href = `login.html?next=${encodeURIComponent(redirectAfterLogin)}`;
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    currentUser = null;
    if (isAuthExpiredError(error)) {
      await handleExpiredSession();
    }
    return null;
  }

  currentUser = user;
  return user;
}

export function listenToAuthChanges(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    callback(currentUser);
  });
}

export async function requireAuth(redirectTo = "login.html") {
  const user = await getCurrentUser();

  if (!user) {
    const next = encodeURIComponent(window.location.pathname.split("/").pop() || "index.html");
    window.location.href = `${redirectTo}?next=${next}`;
    return null;
  }

  return user;
}
