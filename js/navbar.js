// Keeps shared navigation in sync with buyer auth state, adding account links
// for signed-in users and wiring logout across desktop/mobile menus.
  import { getCurrentUser, listenToAuthChanges } from "./auth.js";
  import { supabase } from "./supabaseClient.js";

  function getLoginButtons() {
    return document.querySelectorAll("#loginBtn, #mobileLoginBtn, [data-auth='login'], nav a[href='login.html'], #mobile-menu-overlay a[href='login.html']");
  }

  function getLogoutButtons() {
    return document.querySelectorAll("#logoutBtn, #mobileLogoutBtn, [data-auth='logout']");
  }

  function ensureOrdersLinks() {
    const wrappers = new Set([...document.querySelectorAll("[data-auth-actions]"), ...Array.from(getLogoutButtons()).map((btn) => btn.parentElement).filter(Boolean)]);
    wrappers.forEach((wrap) => {
      if (wrap.querySelector("[data-auth='orders']")) return;

      const ordersLink = document.createElement("a");
      ordersLink.href = "orders.html";
      ordersLink.dataset.auth = "orders";
      ordersLink.textContent = "My Orders";
      ordersLink.className = "px-5 py-2 rounded-full text-sm border border-[#ead9dd] hover:bg-[#fff7f8]";
      ordersLink.style.color = "#5c4a4a";

      const logoutBtn = wrap.querySelector("#logoutBtn, #mobileLogoutBtn, [data-auth='logout']");
      wrap.insertBefore(ordersLink, logoutBtn || null);
    });
  }

  function setHidden(elements, hidden) {
    elements.forEach((el) => el.classList.toggle("hidden", hidden));
  }

  async function updateNavbar(userFromEvent) {
    const user = userFromEvent === undefined ? await getCurrentUser() : userFromEvent;

    ensureOrdersLinks();

    const loginBtns = getLoginButtons();
    const logoutBtns = getLogoutButtons();
    const ordersLinks = document.querySelectorAll("[data-auth='orders']");

    setHidden(loginBtns, Boolean(user));
    setHidden(logoutBtns, !user);
    setHidden(ordersLinks, !user);
  }

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("cartUpdated"));
    window.location.href = "index.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateNavbar();

    getLogoutButtons().forEach((btn) => {
      btn.addEventListener("click", logout);
    });

    listenToAuthChanges((user) => updateNavbar(user));
  });
