// Builds the notifications page list, marks messages as read, and refreshes
// when new order notifications arrive.
import { getCurrentUser } from "./auth.js";
import { supabase } from "./supabaseClient.js";

const list = document.getElementById("notificationsList");
const emptyState = document.getElementById("notificationsEmpty");
const markAllReadBtn = document.getElementById("markAllReadBtn");
const enableAlertsBtn = document.getElementById("enableAlertsBtn");
const stats = document.getElementById("notificationStats");
const filterButtons = document.querySelectorAll("[data-filter]");

let currentUser = null;
let notifications = [];
let activeFilter = "all";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderStats() {
  const unread = notifications.filter((item) => !item.read_at).length;
  const total = notifications.length;

  if (!stats) return;

  stats.innerHTML = `
    <div class="rounded-[1.25rem] border border-[#ead9dd] bg-white/82 p-4">
      <p class="text-[11px] uppercase tracking-[0.22em] text-[#b98a92]">Unread</p>
      <p class="mt-2 text-3xl font-semibold text-[#d89ca4]">${unread}</p>
    </div>
    <div class="rounded-[1.25rem] border border-[#ead9dd] bg-white/82 p-4">
      <p class="text-[11px] uppercase tracking-[0.22em] text-[#b98a92]">Total</p>
      <p class="mt-2 text-3xl font-semibold text-[#5C4A4A]">${total}</p>
    </div>
  `;
}

function getVisibleNotifications() {
  if (activeFilter === "unread") return notifications.filter((item) => !item.read_at);
  if (activeFilter === "read") return notifications.filter((item) => item.read_at);
  return notifications;
}

function renderNotification(notification) {
  const isUnread = !notification.read_at;
  const cardClass = isUnread ? "bg-[#fff7f8]" : "bg-white/88";
  const badge = isUnread ? "New" : "Read";
  const badgeClass = isUnread
    ? "border-[#e6b4bd] bg-white text-[#c98590]"
    : "border-[#ead9dd] bg-[#faf6f7] text-[#9f8c8c]";

  return `
    <article class="${cardClass} rounded-[1.25rem] border border-[#ead9dd] p-4 md:p-5 transition hover:shadow-md">
      <div class="flex gap-3 md:gap-4">
        <div class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ead9dd] bg-white text-[#d89ca4]">
          <span class="text-lg leading-none">i</span>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span class="rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${badgeClass}">
                  ${badge}
                </span>
                <span class="text-xs text-[#9f8c8c]">${escapeHtml(formatDate(notification.created_at))}</span>
              </div>
              <h2 class="text-base font-semibold leading-6 text-[#5C4A4A]">${escapeHtml(notification.title)}</h2>
            </div>
          </div>

          <p class="mt-2 text-sm leading-6 text-[#7A6A6A]">${escapeHtml(notification.message)}</p>

          <div class="mt-4 flex flex-col gap-2 sm:flex-row">
            ${
              notification.order_id
                ? `<a href="orders.html" class="rounded-full bg-[#d89ca4] px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-[#c98590]">View Order</a>`
                : ""
            }
            ${
              isUnread
                ? `<button type="button" data-mark-read="${escapeHtml(notification.id)}" class="rounded-full border border-[#ead9dd] bg-white px-5 py-2.5 text-sm font-medium text-[#5C4A4A] hover:bg-[#fffafa]">Mark Read</button>`
                : ""
            }
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderList() {
  renderStats();

  const visible = getVisibleNotifications();
  emptyState?.classList.toggle("hidden", visible.length > 0);

  if (!list) return;
  list.innerHTML = visible.map(renderNotification).join("");

  if (!visible.length) {
    list.innerHTML = "";
  }
}

function renderLoading() {
  if (!list) return;

  emptyState?.classList.add("hidden");
  list.innerHTML = Array.from({ length: 3 })
    .map(
      () => `
        <div class="rounded-[1.25rem] border border-[#ead9dd] bg-white/80 p-5">
          <div class="mb-4 h-4 w-28 rounded-full bg-[#f3e5e8]"></div>
          <div class="mb-3 h-5 w-3/4 rounded-full bg-[#f3e5e8]"></div>
          <div class="h-4 w-full rounded-full bg-[#f7edf0]"></div>
        </div>
      `
    )
    .join("");
}

function renderError(error) {
  if (!list) return;

  const needsSetup = String(error?.message || "").toLowerCase().includes("notifications");

  emptyState?.classList.add("hidden");
  list.innerHTML = `
    <div class="rounded-[1.25rem] border border-[#f0c8cf] bg-[#fff5f6] p-6">
      <p class="text-xs uppercase tracking-[0.22em] text-[#b98a92]">Notifications unavailable</p>
      <h2 class="display-font mt-2 text-2xl text-[#5C4A4A]">We could not load your updates</h2>
      <p class="mt-3 text-sm leading-6 text-[#7A6A6A]">
        ${
          needsSetup
            ? "The notifications table is not ready online yet. Run the updated Supabase SQL setup, then refresh this page."
            : "Please refresh the page or check your connection."
        }
      </p>
      <p class="mt-3 rounded-2xl bg-white/70 p-3 text-xs leading-5 text-[#9b6f77]">
        ${escapeHtml(error?.message || "Unknown notification error")}
      </p>
    </div>
  `;
}

async function loadNotifications() {
  currentUser = await getCurrentUser();

  if (!currentUser) {
    sessionStorage.setItem("redirectAfterLogin", "notifications.html");
    window.location.href = "login.html";
    return;
  }

  renderLoading();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    renderError(error);
    return;
  }

  notifications = data || [];
  renderList();
}

async function markNotificationRead(notificationId) {
  if (!currentUser || !notificationId) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", currentUser.id);

  if (!error) {
    notifications = notifications.map((item) =>
      item.id === notificationId ? { ...item, read_at: new Date().toISOString() } : item
    );
    renderList();
  }
}

async function markAllRead() {
  if (!currentUser) return;

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("user_id", currentUser.id)
    .is("read_at", null);

  if (!error) {
    notifications = notifications.map((item) => ({ ...item, read_at: item.read_at || now }));
    renderList();
  }
}

async function enableBrowserAlerts() {
  if (!("Notification" in window)) {
    alert("This browser does not support notification alerts.");
    return;
  }

  const permission = await Notification.requestPermission();
  enableAlertsBtn.textContent = permission === "granted" ? "Alerts Enabled" : "Enable Alerts";
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderList();
  });
});

list?.addEventListener("click", (event) => {
  const markReadBtn = event.target.closest("[data-mark-read]");
  if (!markReadBtn) return;
  markNotificationRead(markReadBtn.dataset.markRead);
});

document.addEventListener("DOMContentLoaded", loadNotifications);
markAllReadBtn?.addEventListener("click", markAllRead);
enableAlertsBtn?.addEventListener("click", enableBrowserAlerts);
