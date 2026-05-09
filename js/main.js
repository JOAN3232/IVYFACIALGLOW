import { getCurrentUser, listenToAuthChanges } from "./auth.js";
import { supabase } from "./supabaseClient.js";

const ADMIN_EMAILS = ["ivyfacialsaesthetics@gmail.com"];

function injectSharedThemeStyles() {
  if (document.getElementById("ivy-shared-theme-styles")) return;

  const style = document.createElement("style");
  style.id = "ivy-shared-theme-styles";
  style.textContent = `
    #mobile-menu-overlay {
      padding: 1rem;
      background: rgba(55, 44, 48, 0.28) !important;
      backdrop-filter: blur(18px);
    }

    #mobile-menu-overlay > div {
      width: min(92vw, 23rem) !important;
      max-height: min(88vh, 40rem);
      overflow-y: auto;
      border-radius: 1.75rem !important;
      border: 1px solid rgba(234, 217, 221, 0.95);
      background: rgba(255, 252, 252, 0.94) !important;
      box-shadow: 0 24px 70px rgba(92, 74, 74, 0.22);
    }

    #mobile-menu-overlay .mobile-link {
      display: block;
      width: 100%;
      border-radius: 999px;
      padding: 0.7rem 1rem;
      color: #5c4a4a !important;
      transition: background 180ms ease, color 180ms ease, transform 180ms ease;
    }

    #mobile-menu-overlay .mobile-link:hover {
      background: #fff1f3;
      color: #c98590 !important;
      transform: translateY(-1px);
    }

    #mobile-menu-overlay ul {
      gap: 0.35rem !important;
    }

    #mobile-menu-overlay #mobile-theme-toggle,
    #mobile-menu-overlay #mobileLoginBtn,
    #mobile-menu-overlay #mobileLogoutBtn,
    #mobile-menu-overlay [data-auth="orders"] {
      min-height: 2.75rem;
      border-radius: 999px !important;
    }

    #close-menu {
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 180ms ease, color 180ms ease;
    }

    #close-menu:hover {
      background: #fff1f3;
      color: #c98590;
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
      background: rgba(36, 29, 33, 0.96) !important;
      border-color: #4a3b42;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38);
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

    body.dark-mode #back-to-top,
    body.dark-mode #menu-btn,
    body.dark-mode #accountDropdown {
      background: rgba(36, 29, 33, 0.94) !important;
      border-color: #4a3b42 !important;
      color: #f5e9ec !important;
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
