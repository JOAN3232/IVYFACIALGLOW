import { getCurrentUser, listenToAuthChanges } from "./auth.js";
import { supabase } from "./supabaseClient.js";
import { initIvyNotifications } from "./notifications.js";

const ADMIN_EMAILS = ["ivyfacialsaesthetics@gmail.com"];
let deferredInstallPrompt = null;

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function showInstallHint({ isIos = false } = {}) {
  if (isStandaloneApp() || localStorage.getItem("ivy_pwa_install_dismissed")) return;
  if (document.getElementById("ivy-install-hint")) return;

  const hint = document.createElement("div");
  hint.id = "ivy-install-hint";
  hint.className = "fixed inset-x-4 bottom-4 z-[99999] mx-auto max-w-md rounded-[1.35rem] border border-[#ead9dd] bg-white/95 p-4 text-[#5C4A4A] shadow-2xl backdrop-blur-xl";
  hint.innerHTML = `
    <p class="text-sm font-semibold">Install IvyFacialGlow</p>
    <p class="mt-1 text-xs leading-5 text-[#7A6A6A]">
      ${
        isIos
          ? "On iPhone, tap Share, then Add to Home Screen to use IvyFacialGlow like an app and prepare for order alerts."
          : "Add IvyFacialGlow to your device for quicker shopping and order updates."
      }
    </p>
    <div class="mt-3 flex gap-2">
      ${
        isIos
          ? ""
          : '<button type="button" data-install-app class="flex-1 rounded-full bg-[#d89ca4] px-4 py-2.5 text-xs font-medium text-white">Install</button>'
      }
      <button type="button" data-dismiss-install class="flex-1 rounded-full border border-[#ead9dd] px-4 py-2.5 text-xs font-medium">Not Now</button>
    </div>
  `;

  document.body.appendChild(hint);

  hint.querySelector("[data-dismiss-install]")?.addEventListener("click", () => {
    localStorage.setItem("ivy_pwa_install_dismissed", "1");
    hint.remove();
  });

  hint.querySelector("[data-install-app]")?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    hint.remove();
  });
}

function setupPwaInstall() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("service-worker.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch((error) => {
        console.log("Service worker registration failed:", error);
      });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    window.setTimeout(() => showInstallHint(), 1800);
  });

  if (isIosDevice()) {
    window.setTimeout(() => showInstallHint({ isIos: true }), 2200);
  }
}

function injectSharedThemeStyles() {
  if (document.getElementById("ivy-shared-theme-styles")) return;

  const style = document.createElement("style");
  style.id = "ivy-shared-theme-styles";
  style.textContent = `
    :root {
      --ivy-ease: cubic-bezier(0.22, 1, 0.36, 1);
    }

    #navbar {
      display: block !important;
      padding: 0 !important;
      background: rgba(255, 255, 255, 0.94) !important;
      border-bottom: 1px solid #ead9dd !important;
      backdrop-filter: blur(18px);
    }

    .ivy-nav-shell {
      width: min(100%, 1200px);
      margin: 0 auto;
      padding: 0 1.25rem;
    }

    .ivy-nav-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 2.15rem;
      border-bottom: 1px solid #f3e5e8;
      font-size: 0.72rem;
      color: #7a6a6a;
    }

    .ivy-nav-topbar a {
      color: inherit;
      transition: color 180ms ease;
    }

    .ivy-nav-topbar a:hover {
      color: #d89ca4;
    }

    .ivy-nav-top-links,
    .ivy-nav-socials {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      white-space: nowrap;
    }

    .ivy-nav-mainrow {
      display: grid;
      grid-template-columns: minmax(11rem, 17rem) 1fr auto;
      align-items: center;
      gap: 1.5rem;
      min-height: 4.45rem;
    }

    .ivy-brand-target {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: "Great Vibes", cursive;
      color: #d89ca4;
      font-size: clamp(2.25rem, 3.1vw, 3rem) !important;
      line-height: 1;
      letter-spacing: 0 !important;
    }

    .ivy-nav-links {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: clamp(1.25rem, 2.4vw, 2.4rem);
      color: #5c4a4a;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .ivy-nav-links a {
      position: relative;
      padding: 0.35rem 0;
      color: inherit;
    }

    .ivy-nav-links a::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: -0.1rem;
      height: 2px;
      background: #d89ca4;
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 180ms ease;
    }

    .ivy-nav-links a:hover::after,
    .ivy-nav-links a.is-active::after {
      transform: scaleX(1);
    }

    .ivy-nav-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.72rem;
      min-width: 0;
    }

    .ivy-nav-promo {
      display: block;
      margin-bottom: 0.35rem;
      background: #111;
      color: #fff;
      text-align: center;
      font-size: 0.75rem;
      line-height: 1.1;
      padding: 0.58rem 1rem;
    }

    .ivy-nav-promo a {
      color: #f7c6ce;
      font-weight: 600;
    }

    .ivy-nav-icon-row {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      margin-left: auto;
    }

    .ivy-nav-icon-btn {
      position: relative;
      display: inline-flex;
      width: 2.65rem;
      height: 2.65rem;
      align-items: center;
      justify-content: center;
      border: 1px solid #ead9dd;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.88);
      color: #5c4a4a;
      box-shadow: 0 10px 30px rgba(92, 74, 74, 0.08);
      transition: background 180ms ease, transform 180ms ease, border-color 180ms ease;
    }

    .ivy-nav-icon-btn:hover {
      background: #fff7f8;
      border-color: #e0c8ce;
      transform: translateY(-1px);
    }

    .ivy-nav-icon-btn svg {
      width: 1.08rem;
      height: 1.08rem;
    }

    .ivy-nav-icon-btn[data-nav-cart] {
      display: inline-flex;
    }

    .ivy-nav-account {
      position: relative;
    }

    .ivy-nav-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.65rem;
      border: 1px solid #ead9dd;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.88);
      color: #5c4a4a;
      padding: 0 1.1rem;
      font-size: 0.88rem;
      font-weight: 500;
      white-space: nowrap;
      transition: background 180ms ease, border-color 180ms ease;
    }

    .ivy-nav-pill:hover {
      background: #fff7f8;
      border-color: #e0c8ce;
    }

    .ivy-mobile-row {
      display: none;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      min-height: 4.25rem;
      padding: 0.75rem 0;
    }

    .ivy-mobile-actions {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
    }

    .ivy-nav-count {
      position: absolute;
      top: -0.36rem;
      right: -0.28rem;
      min-width: 1.18rem;
      height: 1.18rem;
      padding: 0 0.22rem;
      border-radius: 999px;
      background: #d89ca4;
      color: #fff;
      font-size: 0.64rem;
      line-height: 1.18rem;
      text-align: center;
      font-weight: 600;
      box-shadow: 0 0 0 2px #fff;
    }

    .ivy-nav-count:empty,
    .ivy-nav-count[data-empty="true"] {
      display: none;
    }

    .ivy-back-to-top {
      position: fixed;
      right: 1.2rem;
      bottom: 1.2rem;
      z-index: 9998;
      width: 3rem;
      height: 3rem;
      border: 1px solid #ead9dd;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.92);
      color: #d89ca4;
      box-shadow: 0 16px 38px rgba(92, 74, 74, 0.16);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      pointer-events: none;
      transform: translateY(0.65rem);
      transition: opacity 180ms ease, transform 180ms ease, background 180ms ease;
    }

    .ivy-back-to-top.is-visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .ivy-back-to-top:hover {
      background: #fff7f8;
    }

    @keyframes ivyFadeUp {
      from {
        opacity: 0;
        transform: translateY(18px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes ivyBackdropIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes ivyMenuSlideIn {
      from {
        opacity: 0;
        transform: translateX(1.4rem);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes ivySheetSlideIn {
      from {
        opacity: 0;
        transform: translateY(1rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    html {
      scroll-behavior: smooth;
    }

    .ivy-reveal {
      opacity: 0;
      transform: translateY(18px);
      transition:
        opacity 700ms var(--ivy-ease),
        transform 700ms var(--ivy-ease);
      transition-delay: var(--ivy-reveal-delay, 0ms);
      will-change: opacity, transform;
    }

    .ivy-reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .shop-card,
    .product-card,
    .cart-card,
    .checkout-card,
    .order-card,
    .summary-card,
    #ordersContainer > *,
    #cartItems > *,
    #checkoutItems > *,
    #productsGrid > * {
      transition:
        transform 260ms var(--ivy-ease),
        box-shadow 260ms ease,
        border-color 260ms ease,
        background-color 260ms ease;
    }

    .shop-card:hover,
    .product-card:hover,
    #productsGrid > article:hover {
      transform: translateY(-4px);
    }

    #mobile-menu-overlay {
      padding: 0;
      background: rgba(31, 24, 29, 0.42) !important;
      backdrop-filter: blur(10px);
      justify-content: flex-end !important;
      align-items: stretch !important;
    }

    #mobile-menu-overlay.flex {
      animation: ivyBackdropIn 220ms ease-out both;
    }

    #menu-btn {
      font-size: 0 !important;
      gap: 0.22rem;
      flex-direction: column;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    #menu-btn::before,
    #menu-btn::after,
    #menu-btn .hamburger-line {
      content: "";
      display: block;
      width: 1.15rem;
      height: 2px;
      border-radius: 999px;
      background: #5c4a4a;
    }

    #mobile-menu-overlay > div {
      width: min(86vw, 22rem) !important;
      min-height: 100vh;
      max-height: 100vh;
      overflow-y: auto;
      border-radius: 0 !important;
      border: 0 !important;
      border-left: 1px solid rgba(234, 217, 221, 0.95) !important;
      background:
        linear-gradient(180deg, rgba(255, 250, 251, 0.98), rgba(255, 247, 248, 0.98)) !important;
      box-shadow: -24px 0 70px rgba(92, 74, 74, 0.22);
      padding: 1.4rem 1.25rem 1.6rem !important;
    }

    #mobile-menu-overlay > div > a:first-of-type {
      display: block;
      width: min-content;
      max-width: 12rem;
      margin: 0 3rem 1.6rem 0;
      font-size: clamp(2rem, 8vw, 2.6rem) !important;
      line-height: 1 !important;
      color: #d89ca4 !important;
    }

    #mobile-menu-overlay .mobile-link {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;
      border-radius: 0.95rem;
      min-height: 3rem;
      padding: 0.75rem 0.95rem;
      color: #5c4a4a !important;
      font-size: 0.95rem !important;
      line-height: 1.2 !important;
      font-weight: 600 !important;
      letter-spacing: 0 !important;
      border: 1px solid transparent;
      transition: background 180ms ease, color 180ms ease, border-color 180ms ease, transform 180ms ease;
    }

    #mobile-menu-overlay .mobile-link:hover {
      background: rgba(255, 241, 243, 0.86);
      border-color: #ead9dd;
      color: #c98590 !important;
      transform: translateX(2px);
    }

    #mobile-menu-overlay ul {
      gap: 0.35rem !important;
      font-size: 1rem !important;
      line-height: 1.2 !important;
      margin: 0 !important;
      padding: 0.85rem 0 !important;
      border-top: 1px solid #f1e4e7;
      border-bottom: 1px solid #f1e4e7;
    }

    #mobile-menu-overlay [data-auth-actions],
    #mobile-menu-overlay #mobile-auth-area,
    #mobile-menu-overlay .mt-8 {
      margin-top: 1.1rem !important;
      gap: 0.55rem !important;
    }

    #mobile-menu-overlay #mobile-theme-toggle,
    #mobile-menu-overlay #mobileLoginBtn,
    #mobile-menu-overlay #mobileLogoutBtn,
    #mobile-menu-overlay [data-auth="orders"] {
      min-height: 2.75rem;
      border-radius: 0.95rem !important;
      padding: 0.7rem 1rem !important;
      font-size: 0.9rem !important;
      font-weight: 600 !important;
      line-height: 1.2 !important;
      text-align: center;
      background: rgba(255, 255, 255, 0.72);
    }

    #close-menu {
      width: 2.1rem;
      height: 2.1rem;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.45rem !important;
      line-height: 1 !important;
      top: 1.2rem !important;
      right: 1.2rem !important;
      transition: background 180ms ease, color 180ms ease;
    }

    #close-menu:hover {
      background: #fff1f3;
      color: #c98590;
    }

    #mobile-menu-overlay.flex > div {
      animation: ivyMenuSlideIn 360ms var(--ivy-ease) both;
    }

    #productDrawerOverlay:not(.hidden),
    #mobileFilterOverlay:not(.hidden),
    #quiz-modal.flex {
      animation: ivyBackdropIn 220ms ease-out both;
    }

    #productDrawer,
    #mobileFilterDrawer,
    .drawer-panel,
    .mobile-filter-panel {
      transition:
        transform 420ms var(--ivy-ease),
        opacity 260ms ease !important;
      will-change: transform, opacity;
    }

    #productDrawer.drawer-open,
    #mobileFilterDrawer.drawer-open {
      animation: ivySheetSlideIn 360ms var(--ivy-ease) both;
    }

    button,
    a,
    input,
    textarea,
    select {
      transition:
        background-color 220ms ease,
        border-color 220ms ease,
        color 220ms ease,
        box-shadow 220ms ease,
        transform 220ms var(--ivy-ease);
    }

    button:hover,
    a[href]:hover {
      transform: translateY(-1px);
    }

    #menu-btn::before,
    #menu-btn::after,
    #menu-btn .hamburger-line {
      transition:
        transform 240ms var(--ivy-ease),
        opacity 200ms ease,
        background-color 220ms ease;
    }

    #menu-btn:hover::before {
      transform: translateX(-2px);
    }

    #menu-btn:hover::after {
      transform: translateX(2px);
    }

    body.dark-mode {
      background: #1f1a1d !important;
      color: #f5e9ec !important;
    }

    body.dark-mode #navbar {
      background: rgba(31, 26, 29, 0.88) !important;
      border-color: #3b3136 !important;
    }

    body.dark-mode #navbar a,
    body.dark-mode #navbar button,
    body.dark-mode #navbar span,
    body.dark-mode .main-text,
    body.dark-mode h1,
    body.dark-mode h2,
    body.dark-mode h3 {
      color: #f5e9ec !important;
    }

    body.dark-mode .secondary-text,
    body.dark-mode p,
    body.dark-mode label {
      color: #d8c8cd !important;
    }

    body.dark-mode .bg-white,
    body.dark-mode .bg-white\\/80,
    body.dark-mode .bg-white\\/90,
    body.dark-mode .bg-white\\/95,
    body.dark-mode .bg-\\[\\#fffafa\\],
    body.dark-mode .bg-\\[\\#fff7f8\\],
    body.dark-mode .bg-\\[\\#fff1f3\\] {
      background-color: #241d21 !important;
    }

    body.dark-mode .border,
    body.dark-mode .border-t,
    body.dark-mode .border-b,
    body.dark-mode .border-\\[\\#ead9dd\\],
    body.dark-mode .border-\\[\\#f1e4e7\\] {
      border-color: #4a3b42 !important;
    }

    body.dark-mode input,
    body.dark-mode textarea,
    body.dark-mode select {
      background: #241d21 !important;
      border-color: #4a3b42 !important;
      color: #f5e9ec !important;
    }

    body.dark-mode input::placeholder,
    body.dark-mode textarea::placeholder {
      color: #b9a8ad !important;
    }

    body.dark-mode #mobile-menu-overlay {
      background: rgba(12, 9, 11, 0.62) !important;
    }

    body.dark-mode #mobile-menu-overlay > div {
      background:
        linear-gradient(180deg, rgba(36, 29, 33, 0.98), rgba(31, 24, 29, 0.98)) !important;
      border-color: #4a3b42;
      box-shadow: -24px 0 70px rgba(0, 0, 0, 0.42);
    }

    body.dark-mode #mobile-menu-overlay ul {
      border-color: #4a3b42 !important;
    }

    body.dark-mode #mobile-menu-overlay .mobile-link,
    body.dark-mode #mobile-menu-overlay button,
    body.dark-mode #mobile-menu-overlay a {
      color: #f5e9ec !important;
    }

    body.dark-mode #mobile-menu-overlay .mobile-link:hover,
    body.dark-mode #close-menu:hover {
      background: rgba(216, 156, 164, 0.12) !important;
      color: #f0aebb !important;
    }

    body.dark-mode #mobile-menu-overlay #mobile-theme-toggle,
    body.dark-mode #mobile-menu-overlay #mobileLoginBtn,
    body.dark-mode #mobile-menu-overlay #mobileLogoutBtn,
    body.dark-mode #mobile-menu-overlay [data-auth="orders"] {
      background: rgba(31, 24, 29, 0.84) !important;
      border-color: #57464e !important;
    }

    body.dark-mode #back-to-top,
    body.dark-mode .ivy-back-to-top,
    body.dark-mode #menu-btn,
    body.dark-mode .ivy-nav-icon-btn,
    body.dark-mode .ivy-nav-pill,
    body.dark-mode #accountDropdown {
      background: rgba(36, 29, 33, 0.94) !important;
      border-color: #4a3b42 !important;
      color: #f5e9ec !important;
    }

    body.dark-mode .ivy-nav-count {
      box-shadow: 0 0 0 2px #241d21;
    }

    body.dark-mode #menu-btn {
      background: rgba(36, 29, 33, 0.94) !important;
      border: 1px solid #4a3b42 !important;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18) !important;
    }

    body.dark-mode #menu-btn::before,
    body.dark-mode #menu-btn::after,
    body.dark-mode #menu-btn .hamburger-line {
      background: #f5e9ec;
    }

    @media (prefers-reduced-motion: reduce) {
      html {
        scroll-behavior: auto;
      }

      *,
      *::before,
      *::after {
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 1ms !important;
      }

      .ivy-reveal {
        opacity: 1;
        transform: none;
      }
    }

    @media (max-width: 767px) {
      #navbar {
        min-height: 0;
      }

      .ivy-nav-shell {
        padding: 0 0.9rem;
      }

      .ivy-nav-topbar,
      .ivy-nav-mainrow,
      .ivy-nav-promo {
        display: none;
      }

      .ivy-mobile-row {
        display: flex;
      }

      .ivy-brand-target {
        max-width: 7rem;
        font-size: clamp(2rem, 8vw, 2.35rem) !important;
      }

      #menu-btn {
        position: static !important;
        z-index: auto !important;
        width: 2.65rem !important;
        height: 2.65rem !important;
        flex: 0 0 2.65rem;
        background: rgba(255, 255, 255, 0.9) !important;
        box-shadow: 0 10px 30px rgba(92, 74, 74, 0.08) !important;
      }
    }

    @media (min-width: 768px) and (max-width: 1180px) {
      .ivy-nav-mainrow {
        grid-template-columns: minmax(10rem, 13rem) 1fr auto;
        gap: 1rem;
      }

      .ivy-nav-links {
        gap: 1.1rem;
        font-size: 0.88rem;
      }

      .ivy-nav-pill {
        padding: 0 0.85rem;
      }
    }
  `;

  document.head.appendChild(style);
}

injectSharedThemeStyles();

// =================================
// CART COUNT
// =================================
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const counters = document.querySelectorAll("#cartCount, #cart-count, [data-cart-count]");
  counters.forEach((el) => {
    el.textContent = String(count);
    el.dataset.empty = count > 0 ? "false" : "true";
  });
}

window.updateCartCount = updateCartCount;
window.addEventListener("cartUpdated", updateCartCount);
document.addEventListener("DOMContentLoaded", updateCartCount);

function setupRevealAnimations(root = document) {
  const elements = Array.from(
    root.querySelectorAll(
      [
        "main > section",
        "footer",
        ".shop-card",
        ".product-card",
        ".cart-card",
        ".checkout-card",
        ".summary-card",
        "#productsGrid > *",
        "#cartItems > *",
        "#checkoutItems > *",
        "#ordersContainer > *",
      ].join(",")
    )
  ).filter((element) => {
    return (
      !element.classList.contains("ivy-reveal") &&
      !element.closest("#mobile-menu-overlay") &&
      !element.closest("#productDrawer") &&
      !element.closest("#mobileFilterDrawer")
    );
  });

  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("ivy-reveal", "is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  elements.forEach((element, index) => {
    element.classList.add("ivy-reveal");
    element.style.setProperty("--ivy-reveal-delay", `${Math.min(index % 6, 5) * 55}ms`);
    observer.observe(element);
  });
}

window.setupIvyAnimations = setupRevealAnimations;

function applySavedTheme() {
  document.body.classList.toggle("dark-mode", localStorage.getItem("theme") === "dark");
}

function updateThemeButtonLabels() {
  const isDark = document.body.classList.contains("dark-mode");
  document.querySelectorAll("#theme-toggle, #mobile-theme-toggle").forEach((button) => {
    button.textContent = isDark ? "Light Mode" : "Dark Mode";
    button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  });
}

function setTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateThemeButtonLabels();
}

applySavedTheme();

function createNavIcon({ href, label, badgeType, svg }) {
  const link = document.createElement("a");
  link.href = href;
  link.className = "ivy-nav-icon-btn";
  if (badgeType === "cart") link.dataset.navCart = "true";
  if (badgeType === "notifications") link.dataset.navNotifications = "true";
  link.setAttribute("aria-label", label);
  link.innerHTML = `
    ${svg}
    <span class="ivy-nav-count" ${badgeType === "cart" ? "data-cart-count" : "data-notification-count"} data-empty="true">0</span>
  `;
  return link;
}

function getNavHref(anchor) {
  const onHome = /(^|\/)index\.html$|\/$/.test(window.location.pathname);
  return onHome ? `#${anchor}` : `index.html#${anchor}`;
}

function getActivePage() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  if (page === "index.html" || page === "") return "home";
  if (page === "shop.html") return "shop";
  if (page === "orders.html") return "orders";
  if (page === "notifications.html") return "notifications";
  return "";
}

function renderReferenceNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar || navbar.dataset.ivyNavReady === "true") return;

  const activePage = getActivePage();
  const linkClass = (page) => (activePage === page ? "is-active" : "");

  navbar.dataset.ivyNavReady = "true";
  navbar.innerHTML = `
    <div class="ivy-nav-shell">
      <div class="ivy-nav-topbar">
        <div class="ivy-nav-top-links">
          <a href="privacy-policy.html">Privacy</a>
          <a href="terms.html">Terms</a>
          <a href="orders.html">Track Order</a>
        </div>
        <div class="ivy-nav-socials">
          <a href="notifications.html">Notifications</a>
          <a href="https://wa.link/w482ij" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>

      <div class="ivy-nav-mainrow">
        <a href="index.html" class="ivy-brand-target">IvyFacialGlow</a>

        <div class="ivy-nav-links">
          <a href="index.html" class="${linkClass("home")}">Home</a>
          <a href="shop.html" class="${linkClass("shop")}">Shop</a>
          <a href="${getNavHref("skin-quiz")}">Skin Quiz</a>
          <a href="${getNavHref("about")}">About</a>
          <a href="${getNavHref("contact")}">Contact</a>
        </div>

        <div class="ivy-nav-actions">
          <button id="theme-toggle" type="button" class="ivy-nav-pill">Dark Mode</button>
          <a href="cart.html" class="ivy-nav-icon-btn" data-nav-cart aria-label="Open cart">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M6 8h12l-1 11H7L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            <span class="ivy-nav-count" data-cart-count data-empty="true">0</span>
          </a>
          <a href="notifications.html" class="ivy-nav-icon-btn" data-auth="notifications" data-nav-notifications aria-label="Open notifications">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M15 17H9" />
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            <span class="ivy-nav-count" data-notification-count data-empty="true">0</span>
          </a>
          <a id="loginBtn" href="login.html" class="ivy-nav-pill">Login</a>
          <div class="ivy-nav-account hidden" id="accountWrapper">
            <button id="accountBtn" type="button" class="ivy-nav-pill">My Account ▾</button>
            <div
              id="accountDropdown"
              class="hidden absolute right-0 mt-4 w-64 bg-white/95 backdrop-blur-xl border border-[#f1dfe3] rounded-[1.35rem] shadow-2xl p-2 z-50 overflow-hidden"
            >
              <a href="profile.html" class="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#fff7f8] transition text-[#5C4A4A] text-sm font-medium">
                <span class="text-lg">Profile</span>
              </a>
              <a href="orders.html" class="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#fff7f8] transition text-[#5C4A4A] text-sm font-medium">
                <span class="text-lg">My Orders</span>
              </a>
              <a href="notifications.html" data-auth="notifications" class="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl hover:bg-[#fff7f8] transition text-[#5C4A4A] text-sm font-medium">
                <span>Notifications</span>
                <span class="ivy-notification-badge" data-notification-count>0</span>
              </a>
              <a href="admin-login.html" id="adminLink" class="hidden flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#fff7f8] transition text-[#5C4A4A] text-sm font-medium">
                <span class="text-lg">Admin Dashboard</span>
              </a>
              <div class="my-2 border-t border-[#f3e5e8]"></div>
              <button id="logoutBtn" data-auth="logout" class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-[#fff1f3] transition text-[#d89ca4] text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="ivy-mobile-row">
        <a href="index.html" class="ivy-brand-target">IvyGlow</a>
        <div class="ivy-mobile-actions">
          <a href="cart.html" class="ivy-nav-icon-btn" data-nav-cart aria-label="Open cart">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M6 8h12l-1 11H7L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            <span class="ivy-nav-count" data-cart-count data-empty="true">0</span>
          </a>
          <a href="notifications.html" class="ivy-nav-icon-btn" data-auth="notifications" data-nav-notifications aria-label="Open notifications">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M15 17H9" />
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            <span class="ivy-nav-count" data-notification-count data-empty="true">0</span>
          </a>
          <button id="menu-btn" type="button" aria-label="Open menu" class="ivy-nav-icon-btn">
            <span class="hamburger-line"></span>
          </button>
        </div>
      </div>

      <a class="ivy-nav-promo" href="shop.html">
        Soft glow essentials are ready. Shop skincare, self-care, and beauty picks now.
      </a>
    </div>
  `;

  updateCartCount();
}

function setupSharedNavActions() {
  const navbar = document.getElementById("navbar");
  if (!navbar || navbar.querySelector(".ivy-nav-icon-row") || navbar.dataset.ivyNavReady === "true") return;

  const row = document.createElement("div");
  row.className = "ivy-nav-icon-row";

  row.append(
    createNavIcon({
      href: "cart.html",
      label: "Open cart",
      badgeType: "cart",
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M6 8h12l-1 11H7L6 8Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      `,
    }),
    createNavIcon({
      href: "notifications.html",
      label: "Open notifications",
      badgeType: "notifications",
      svg: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M15 17H9" />
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      `,
    })
  );

  const menuBtn = document.getElementById("menu-btn");
  if (menuBtn?.parentElement === navbar) {
    navbar.insertBefore(row, menuBtn);
  } else {
    navbar.appendChild(row);
  }

  updateCartCount();
}

function setupResponsiveBrandName() {
  const navbar = document.getElementById("navbar");
  const brand =
    navbar?.querySelector(":scope > a:first-child") ||
    navbar?.querySelector(":scope > div:first-child > a:first-child") ||
    navbar?.querySelector(":scope > div:first-child");
  if (!brand) return;

  const fullName = (brand.textContent || "IvyFacialGlow").trim() || "IvyFacialGlow";
  const shortName = "IvyGlow";
  brand.classList.add("ivy-brand-target");

  function updateBrand() {
    brand.textContent = window.innerWidth < 520 ? shortName : fullName;
  }

  updateBrand();
  window.addEventListener("resize", updateBrand);
}

function setupBackToTop() {
  let button = document.getElementById("back-to-top") || document.querySelector(".ivy-back-to-top");

  if (!button) {
    button = document.createElement("button");
    button.id = "back-to-top";
    button.type = "button";
    button.className = "ivy-back-to-top";
    button.setAttribute("aria-label", "Back to top");
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m18 15-6-6-6 6" />
      </svg>
    `;
    document.body.appendChild(button);
  } else {
    button.classList.add("ivy-back-to-top");
  }

  const toggleButton = () => {
    button.classList.toggle("is-visible", window.scrollY > 420);
    button.classList.toggle("opacity-0", false);
    button.classList.toggle("pointer-events-none", false);
  };

  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", toggleButton, { passive: true });
  toggleButton();
}

function ensureMobileMenu() {
  if (document.getElementById("mobile-menu-overlay")) return;

  const menu = document.createElement("div");
  menu.id = "mobile-menu-overlay";
  menu.className = "fixed inset-0 bg-black/20 backdrop-blur-md hidden items-center justify-center z-50 lg:hidden";
  menu.innerHTML = `
    <div class="bg-white/90 backdrop-blur-xl rounded-[1.5rem] px-8 py-9 w-[88%] max-w-sm shadow-2xl text-center relative">
      <button id="close-menu" type="button" class="absolute top-4 right-5 text-3xl" style="color:#5c4a4a;">×</button>
      <h2 class="text-4xl mb-7 text-[#d89ca4]" style="font-family:'Great Vibes', cursive;">IvyGlow</h2>
      <ul class="flex flex-col gap-4 text-lg font-medium" style="color:#5c4a4a;">
        <li><a href="index.html" class="mobile-link">Home</a></li>
        <li><a href="shop.html" class="mobile-link">Shop</a></li>
        <li><a href="${getNavHref("skin-quiz")}" class="mobile-link">Skin Quiz</a></li>
        <li><a href="${getNavHref("about")}" class="mobile-link">About</a></li>
        <li><a href="${getNavHref("contact")}" class="mobile-link">Contact</a></li>
        <li><a href="orders.html" class="mobile-link">Orders</a></li>
        <li><a href="notifications.html" data-auth="notifications" class="mobile-link">Notifications</a></li>
      </ul>
      <div class="mt-7 flex flex-col gap-3">
        <button id="mobile-theme-toggle" type="button" class="border border-stone-300 rounded-full py-3 text-base" style="color:#5c4a4a;">Dark Mode</button>
        <a id="mobileLoginBtn" href="login.html" class="rounded-full py-3 text-white text-base bg-[#d89ca4]">Login</a>
        <button id="mobileLogoutBtn" data-auth="logout" class="hidden rounded-full py-3 border border-[#ead9dd] text-base" style="color:#5c4a4a;">Logout</button>
      </div>
    </div>
  `;
  document.body.appendChild(menu);
}

// =================================
// AUTH UI
// =================================
function getLoginButtons() {
  return document.querySelectorAll(
    "#loginBtn, #mobileLoginBtn, [data-auth='login'], nav a[href='login.html'], #mobile-menu-overlay a[href='login.html']"
  );
}

function getLogoutButtons() {
  return document.querySelectorAll(
    "#logoutBtn, #mobileLogoutBtn, [data-auth='logout']"
  );
}

function setHidden(elements, hidden) {
  elements.forEach((el) => el.classList.toggle("hidden", hidden));
}

async function updateAuthUI(userFromEvent) {
  const user =
    userFromEvent === undefined ? await getCurrentUser() : userFromEvent;

  const accountWrapper = document.getElementById("accountWrapper");
  const accountBtn = document.getElementById("accountBtn");
  const adminLink = document.getElementById("adminLink");

  if (user) {
    accountWrapper?.classList.remove("hidden");
    accountBtn?.classList.remove("hidden");
  } else {
    accountWrapper?.classList.add("hidden");
    accountBtn?.classList.add("hidden");
  }

  setHidden(getLoginButtons(), Boolean(user));
  setHidden(getLogoutButtons(), !user);

  if (user && ADMIN_EMAILS.includes(user.email)) {
    adminLink?.classList.remove("hidden");
  } else {
    adminLink?.classList.add("hidden");
  }
}

updateAuthUI();

listenToAuthChanges((user) => {
  updateAuthUI(user);
});

// =================================
// LOGOUT
// =================================
document.addEventListener("click", async (e) => {
  const logoutBtn = e.target.closest(
    "#logoutBtn, #mobileLogoutBtn, [data-auth='logout']"
  );

  if (!logoutBtn) return;

  await supabase.auth.signOut();
  localStorage.removeItem("cart");
  window.dispatchEvent(new Event("cartUpdated"));
  window.location.href = "index.html";
});

// =================================
// MAIN UI INIT
// =================================
document.addEventListener("DOMContentLoaded", () => {
  setupRevealAnimations();
  renderReferenceNavbar();
  ensureMobileMenu();
  setupResponsiveBrandName();
  setupSharedNavActions();
  updateAuthUI();
  setupBackToTop();
  setupPwaInstall();
  initIvyNotifications();

  // ACCOUNT DROPDOWN
  const accountBtn = document.getElementById("accountBtn");
  const accountDropdown = document.getElementById("accountDropdown");

  accountBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    accountDropdown?.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (
      !accountBtn?.contains(e.target) &&
      !accountDropdown?.contains(e.target)
    ) {
      accountDropdown?.classList.add("hidden");
    }
  });

  // MOBILE MENU
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu-overlay");
  const closeMenu = document.getElementById("close-menu");

  menuBtn?.addEventListener("click", () => {
    mobileMenu?.classList.remove("hidden");
    mobileMenu?.classList.add("flex");
  });

  closeMenu?.addEventListener("click", () => {
    mobileMenu?.classList.add("hidden");
    mobileMenu?.classList.remove("flex");
  });

  mobileMenu?.addEventListener("click", (e) => {
    if (e.target === mobileMenu) {
      mobileMenu.classList.add("hidden");
      mobileMenu.classList.remove("flex");
    }
  });

  // DARK MODE
  const toggle = document.getElementById("theme-toggle");
  const mobileToggle = document.getElementById("mobile-theme-toggle");

  function toggleDarkMode() {
    setTheme(!document.body.classList.contains("dark-mode"));
  }

  toggle?.addEventListener("click", toggleDarkMode);
  mobileToggle?.addEventListener("click", toggleDarkMode);
  updateThemeButtonLabels();

  // CATEGORY SLIDER
  const categorySlider = document.getElementById("category-slider");

  if (categorySlider && categorySlider.children.length > 0) {
    let index = 0;
    const totalSlides = categorySlider.children.length;

    setInterval(() => {
      index = (index + 1) % totalSlides;
      categorySlider.style.transform = `translateX(-${index * 100}%)`;
    }, 4000);
  }

  // BEST SELLER SLIDER
  const bestSlider = document.getElementById("best-seller-slider");

  if (bestSlider && bestSlider.children.length > 0) {
    let index = 0;
    const cards = bestSlider.children;
    const cardWidth = cards[0].offsetWidth + 24;

    setInterval(() => {
      index++;

      if (index > cards.length - 3) index = 0;

      bestSlider.style.transform = `translateX(-${index * cardWidth}px)`;
    }, 3000);
  }

  // QUIZ MODAL
  const quizModal = document.getElementById("quiz-modal");
  const openQuiz = document.getElementById("open-quiz");
  const closeQuiz = document.getElementById("close-quiz");

  function openModal() {
    quizModal?.classList.remove("hidden");
    quizModal?.classList.add("flex");
  }

  function closeModal() {
    quizModal?.classList.add("hidden");
    quizModal?.classList.remove("flex");
  }

  openQuiz?.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });

  closeQuiz?.addEventListener("click", closeModal);

  quizModal?.addEventListener("click", (e) => {
    if (e.target === quizModal) closeModal();
  });

  updateCartCount();
});

// =================================
// ADD TO CART
// =================================
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if (!btn) return;

  const productCard = btn.closest(".product-card");
  if (!productCard) return;

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  const product = {
    id: productCard.dataset.id,
    name: productCard.dataset.name,
    price: Number(productCard.dataset.price),
    image: productCard.dataset.image,
    quantity: 1,
  };

  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push(product);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
});
