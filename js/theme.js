function injectThemeStyles() {
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

    @keyframes ivySoftPop {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.985);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes ivyMenuDrop {
      from {
        opacity: 0;
        transform: translateY(-0.5rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    html {
      scroll-behavior: smooth;
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

    body.auth-page main > section:first-child,
    body.auth-page .auth-panel,
    body.auth-page .login-panel {
      animation: ivySoftPop 640ms var(--ivy-ease) both;
    }

    body.auth-page main > section:first-child {
      animation-delay: 80ms;
    }

    body.admin-page .glass-panel,
    body.admin-page .stat-card,
    body.admin-page #adminProductsContainer > *,
    body.admin-page #ordersContainer > * {
      animation: ivyFadeUp 620ms var(--ivy-ease) both;
    }

    body.admin-page .stat-card:nth-child(2),
    body.admin-page #adminProductsContainer > *:nth-child(2),
    body.admin-page #ordersContainer > *:nth-child(2) {
      animation-delay: 70ms;
    }

    body.admin-page .stat-card:nth-child(3),
    body.admin-page #adminProductsContainer > *:nth-child(3),
    body.admin-page #ordersContainer > *:nth-child(3) {
      animation-delay: 140ms;
    }

    body.admin-page .admin-actions.is-open {
      animation: ivyMenuDrop 240ms var(--ivy-ease) both;
    }

    body.dark-mode {
      background:
        radial-gradient(circle at top right, rgba(216, 156, 164, 0.12), transparent 34rem),
        linear-gradient(135deg, #171215, #211a1e 55%, #181316) !important;
      color: #f5e9ec !important;
    }

    body.dark-mode main,
    body.dark-mode section {
      background-color: transparent !important;
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

    body.auth-page.dark-mode .auth-panel,
    body.auth-page.dark-mode .login-panel {
      background: rgba(36, 29, 33, 0.92) !important;
      border-color: #4a3b42 !important;
      box-shadow: 0 28px 80px rgba(0, 0, 0, 0.38) !important;
      color: #f5e9ec !important;
    }

    body.auth-page.dark-mode .auth-panel .script-font,
    body.auth-page.dark-mode .login-panel .script-font {
      color: #f0aebb !important;
    }

    body.auth-page.dark-mode .auth-panel h1,
    body.auth-page.dark-mode .auth-panel h2,
    body.auth-page.dark-mode .login-panel h1,
    body.auth-page.dark-mode .login-panel h2 {
      color: #fff3f6 !important;
    }

    body.auth-page.dark-mode .auth-panel p,
    body.auth-page.dark-mode .auth-panel label,
    body.auth-page.dark-mode .login-panel p,
    body.auth-page.dark-mode .login-panel label {
      color: #d8c8cd !important;
    }

    body.auth-page.dark-mode .auth-panel > div:first-child a:last-child,
    body.auth-page.dark-mode .login-panel > div:first-child a:last-child,
    body.auth-page.dark-mode [data-theme-toggle] {
      background: #33272d !important;
      border-color: #57464e !important;
      color: #fff3f6 !important;
    }

    body.auth-page.dark-mode [data-theme-toggle]:hover {
      background: rgba(216, 156, 164, 0.14) !important;
      color: #f0aebb !important;
    }

    body.auth-page.dark-mode section .rounded-\\[1\\.5rem\\] {
      background: rgba(36, 29, 33, 0.78) !important;
      border-color: #4a3b42 !important;
    }

    body.dark-mode .border,
    body.dark-mode .border-t,
    body.dark-mode .border-b,
    body.dark-mode .border-\\[\\#ead9dd\\],
    body.dark-mode .border-\\[\\#f1e4e7\\] {
      border-color: #4a3b42 !important;
    }

    body.dark-mode h1,
    body.dark-mode h2,
    body.dark-mode h3,
    body.dark-mode .main-text {
      color: #f5e9ec !important;
    }

    body.dark-mode p,
    body.dark-mode label,
    body.dark-mode .secondary-text {
      color: #d8c8cd !important;
    }

    body.dark-mode input,
    body.dark-mode textarea,
    body.dark-mode select,
    body.dark-mode .field {
      background: #1f181d !important;
      border-color: #57464e !important;
      color: #f5e9ec !important;
    }

    body.dark-mode .field:focus {
      border-color: #f0aebb !important;
      box-shadow: 0 0 0 4px rgba(240, 174, 187, 0.16) !important;
    }

    body.dark-mode input::placeholder,
    body.dark-mode textarea::placeholder {
      color: #b9a8ad !important;
      opacity: 1;
    }

    body.dark-mode button[type="submit"],
    body.dark-mode #loginBtn,
    body.dark-mode #signupBtn,
    body.dark-mode #adminLoginBtn {
      background: #d89ca4 !important;
      color: #241d21 !important;
    }

    body.dark-mode button[type="submit"]:hover,
    body.dark-mode #loginBtn:hover,
    body.dark-mode #signupBtn:hover,
    body.dark-mode #adminLoginBtn:hover {
      background: #f0aebb !important;
    }

    body.dark-mode #toggleLoginPassword,
    body.dark-mode #toggleSignupPassword {
      color: #f0aebb !important;
    }

    body.dark-mode .shadow-2xl,
    body.dark-mode .shadow-xl,
    body.dark-mode .shadow-lg {
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35) !important;
    }

    body.admin-page.dark-mode {
      background:
        radial-gradient(circle at 18% 8%, rgba(216, 156, 164, 0.13), transparent 28rem),
        linear-gradient(135deg, #171215, #211a1e 52%, #181316) !important;
    }

    body.admin-page.dark-mode .admin-shell {
      background: transparent !important;
    }

    body.admin-page.dark-mode header {
      background: rgba(23, 18, 21, 0.9) !important;
      border-color: #4a3b42 !important;
      box-shadow: 0 18px 55px rgba(0, 0, 0, 0.22);
    }

    body.admin-page.dark-mode .glass-panel {
      background: rgba(36, 29, 33, 0.74) !important;
      border-color: rgba(112, 88, 98, 0.85) !important;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28) !important;
      backdrop-filter: blur(18px);
    }

    body.admin-page.dark-mode .stat-card {
      background: rgba(31, 24, 29, 0.96) !important;
      border-color: #57464e !important;
      box-shadow: none !important;
    }

    body.admin-page.dark-mode .stat-card p {
      color: #cdbfc3 !important;
    }

    body.admin-page.dark-mode .stat-card h3 {
      color: #f0aebb !important;
    }

    body.admin-page.dark-mode .field,
    body.admin-page.dark-mode select.field,
    body.admin-page.dark-mode textarea.field {
      background: rgba(31, 24, 29, 0.96) !important;
      border-color: #57464e !important;
      color: #fff3f6 !important;
    }

    body.admin-page.dark-mode .field::placeholder {
      color: #b9a8ad !important;
      opacity: 1;
    }

    body.admin-page.dark-mode .upload-box {
      background: rgba(31, 24, 29, 0.82) !important;
      border-color: #73535e !important;
    }

    body.admin-page.dark-mode .upload-preview {
      background: #1f181d !important;
      border-color: #57464e !important;
    }

    body.admin-page.dark-mode article,
    body.admin-page.dark-mode #adminProductsContainer > *,
    body.admin-page.dark-mode #ordersContainer > * {
      background: rgba(31, 24, 29, 0.92) !important;
      border-color: #57464e !important;
      box-shadow: none !important;
    }

    body.admin-page.dark-mode article .bg-\\[\\#fffafa\\],
    body.admin-page.dark-mode article .bg-white,
    body.admin-page.dark-mode #ordersContainer .bg-\\[\\#fffafa\\],
    body.admin-page.dark-mode #adminProductsContainer .bg-\\[\\#faf6f7\\] {
      background-color: rgba(23, 18, 21, 0.72) !important;
    }

    body.admin-page.dark-mode button:not([type="submit"]),
    body.admin-page.dark-mode a[href="index.html"] {
      border-color: #57464e !important;
    }

    body.admin-page.dark-mode #adminLogoutBtn,
    body.admin-page.dark-mode a[href="index.html"],
    body.admin-page.dark-mode [data-theme-toggle],
    body.admin-page.dark-mode #adminActionsMenuBtn {
      background: #33272d !important;
      color: #fff3f6 !important;
    }

    body.admin-page.dark-mode #adminLogoutBtn:hover,
    body.admin-page.dark-mode a[href="index.html"]:hover,
    body.admin-page.dark-mode #cancelProductEditBtn:hover,
    body.admin-page.dark-mode [data-theme-toggle]:hover,
    body.admin-page.dark-mode #adminActionsMenuBtn:hover {
      background: rgba(216, 156, 164, 0.14) !important;
      color: #f0aebb !important;
    }

    body.admin-page.dark-mode .bg-yellow-100 {
      background-color: rgba(232, 184, 79, 0.14) !important;
      color: #f3cf7a !important;
    }

    body.admin-page.dark-mode .bg-green-100,
    body.admin-page.dark-mode .bg-green-50 {
      background-color: rgba(95, 185, 133, 0.14) !important;
      color: #90d7ac !important;
    }

    body.admin-page.dark-mode .bg-blue-100 {
      background-color: rgba(116, 164, 220, 0.16) !important;
      color: #9cc5f2 !important;
    }

    body.admin-page.dark-mode .bg-purple-100 {
      background-color: rgba(176, 139, 220, 0.16) !important;
      color: #d5b5f5 !important;
    }

    body.admin-page.dark-mode .bg-red-50 {
      background-color: rgba(220, 94, 110, 0.13) !important;
      color: #f09aa7 !important;
    }

    body.admin-page.dark-mode .bg-pink-50,
    body.admin-page.dark-mode .bg-pink-100 {
      background-color: rgba(216, 156, 164, 0.15) !important;
      color: #f0aebb !important;
    }

    body.admin-page.dark-mode button.bg-\\[\\#5C4A4A\\] {
      background: #d89ca4 !important;
      color: #241d21 !important;
    }

    body.admin-page.dark-mode button.bg-\\[\\#5C4A4A\\]:hover {
      background: #f0aebb !important;
    }

    body.admin-page.dark-mode #productSubmitBtn {
      background: #d89ca4 !important;
      color: #241d21 !important;
    }

    body.admin-page.dark-mode #productSubmitBtn:hover {
      background: #f0aebb !important;
    }

    body.admin-page.dark-mode #cancelProductEditBtn {
      background: transparent !important;
      color: #fff3f6 !important;
      border-color: #57464e !important;
    }

    body.admin-page.dark-mode .text-\\[\\#5C4A4A\\],
    body.admin-page.dark-mode .text-\\[\\#5c4a4a\\] {
      color: #fff3f6 !important;
    }

    body.admin-page.dark-mode .text-\\[\\#7A6A6A\\],
    body.admin-page.dark-mode .text-\\[\\#7a6a6a\\],
    body.admin-page.dark-mode .text-\\[\\#9b8a8a\\] {
      color: #cdbfc3 !important;
    }

    body.admin-page.dark-mode .text-\\[\\#b98a92\\],
    body.admin-page.dark-mode .text-\\[\\#d89ca4\\] {
      color: #f0aebb !important;
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
    }
  `;

  document.head.appendChild(style);
}

function applySavedTheme() {
  document.body.classList.toggle("dark-mode", localStorage.getItem("theme") === "dark");
}

function updateThemeToggleLabel(button) {
  if (!button) return;
  button.textContent = document.body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
}

injectThemeStyles();
applySavedTheme();

document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector("[data-theme-toggle]");
  updateThemeToggleLabel(button);

  button?.addEventListener("click", () => {
    const shouldUseDark = !document.body.classList.contains("dark-mode");
    document.body.classList.toggle("dark-mode", shouldUseDark);
    localStorage.setItem("theme", shouldUseDark ? "dark" : "light");
    updateThemeToggleLabel(button);
  });
});
