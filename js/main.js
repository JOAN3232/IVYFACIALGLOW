import { getCurrentUser, listenToAuthChanges } from "./auth.js";
import { supabase } from "./supabaseClient.js";

const ADMIN_EMAILS = ["ivyfacialsaesthetics@gmail.com"];

function injectSharedThemeStyles() {
  if (document.getElementById("ivy-shared-theme-styles")) return;

  const style = document.createElement("style");
  style.id = "ivy-shared-theme-styles";
  style.textContent = `
    :root {
      --ivy-ease: cubic-bezier(0.22, 1, 0.36, 1);
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
    body.dark-mode #menu-btn,
    body.dark-mode #accountDropdown {
      background: rgba(36, 29, 33, 0.94) !important;
      border-color: #4a3b42 !important;
      color: #f5e9ec !important;
    }

    body.dark-mode #menu-btn {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
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

  const el =
    document.getElementById("cartCount") ||
    document.getElementById("cart-count");

  if (el) el.textContent = count;
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
