import { getCurrentUser } from "./auth.js";
import { supabase } from "./supabaseClient.js";

const list = document.getElementById("notificationsList");
const emptyState = document.getElementById("notificationsEmpty");
const markAllReadBtn = document.getElementById("markAllReadBtn");

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

function renderNotification(notification) {
  const unreadClass = notification.read_at ? "bg-white/80" : "bg-[#fff7f8]";
  const unreadDot = notification.read_at
    ? ""
    : `<span class="mt-1 h-2.5 w-2.5 rounded-full bg-[#d89ca4]"></span>`;

  return `
    <article class="${unreadClass} rounded-[1.5rem] border border-[#ead9dd] p-5 shadow-sm">
      <div class="flex items-start gap-3">
        ${unreadDot}
        <div class="flex-1">
          <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <h2 class="text-base font-semibold text-[#5C4A4A]">${escapeHtml(notification.title)}</h2>
            <p class="text-xs text-[#9f8c8c]">${escapeHtml(formatDate(notification.created_at))}</p>
          </div>
          <p class="mt-2 text-sm leading-6 text-[#7A6A6A]">${escapeHtml(notification.message)}</p>
          ${
            notification.order_id
              ? `<a href="orders.html" class="mt-4 inline-block rounded-full bg-[#d89ca4] px-5 py-2.5 text-sm font-medium text-white">View Order</a>`
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

async function loadNotifications() {
  const user = await getCurrentUser();

  if (!user) {
    sessionStorage.setItem("redirectAfterLogin", "notifications.html");
    window.location.href = "login.html";
    return;
  }

  if (list) {
    list.innerHTML = `
      <div class="rounded-[1.5rem] border border-[#ead9dd] bg-white p-6 text-center text-sm text-[#7A6A6A]">
        Loading notifications...
      </div>
    `;
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    if (list) {
      list.innerHTML = `
        <div class="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
          Could not load notifications.
        </div>
      `;
    }
    return;
  }

  const notifications = data || [];
  emptyState?.classList.toggle("hidden", notifications.length > 0);
  if (list) list.innerHTML = notifications.map(renderNotification).join("");
}

async function markAllRead() {
  const user = await getCurrentUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  loadNotifications();
}

document.addEventListener("DOMContentLoaded", loadNotifications);
markAllReadBtn?.addEventListener("click", markAllRead);
