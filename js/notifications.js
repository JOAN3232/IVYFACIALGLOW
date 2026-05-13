import { getCurrentUser } from "./auth.js";
import { supabase } from "./supabaseClient.js";

let notificationsChannel = null;

function ensureNotificationStyles() {
  if (document.getElementById("ivy-notification-styles")) return;

  const style = document.createElement("style");
  style.id = "ivy-notification-styles";
  style.textContent = `
    .ivy-notification-badge {
      display: none;
      min-width: 1.15rem;
      height: 1.15rem;
      padding: 0 0.25rem;
      border-radius: 999px;
      background: #d89ca4;
      color: #fff;
      font-size: 0.68rem;
      line-height: 1.15rem;
      text-align: center;
      font-weight: 600;
    }

    .ivy-notification-badge.is-visible {
      display: inline-block;
    }

    .ivy-notification-toast {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 99999;
      width: min(22rem, calc(100vw - 2rem));
      border: 1px solid #ead9dd;
      border-radius: 1.25rem;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 18px 50px rgba(92, 74, 74, 0.18);
      padding: 1rem;
      color: #5c4a4a;
      font-family: "Poppins", sans-serif;
    }
  `;
  document.head.appendChild(style);
}

function createNotificationLink(className = "") {
  const link = document.createElement("a");
  link.href = "notifications.html";
  link.dataset.auth = "notifications";
  link.className = className;
  link.innerHTML = `Notifications <span class="ivy-notification-badge" data-notification-count>0</span>`;
  return link;
}

function ensureNotificationLinks() {
  const dropdown = document.getElementById("accountDropdown");
  if (dropdown && !dropdown.querySelector("[data-auth='notifications']")) {
    const ordersLink = dropdown.querySelector("a[href='orders.html']");
    const link = createNotificationLink(
      "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl hover:bg-[#fff7f8] transition text-[#5C4A4A] text-sm font-medium"
    );
    ordersLink?.insertAdjacentElement("afterend", link);
  }

  const mobileLists = document.querySelectorAll("#mobile-menu-overlay ul");
  mobileLists.forEach((list) => {
    if (list.querySelector("[data-auth='notifications']")) return;

    const item = document.createElement("li");
    const link = createNotificationLink("mobile-link");
    item.appendChild(link);
    list.appendChild(item);
  });
}

function updateBadges(count) {
  document.querySelectorAll("[data-notification-count]").forEach((badge) => {
    badge.textContent = String(count);
    badge.classList.toggle("is-visible", count > 0);
  });
}

async function refreshUnreadCount(user) {
  if (!user) {
    updateBadges(0);
    return;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (!error) updateBadges(count || 0);
}

function showToast(notification) {
  const toast = document.createElement("div");
  toast.className = "ivy-notification-toast";
  toast.innerHTML = `
    <p class="text-xs uppercase tracking-[0.22em] text-[#b98a92] mb-2">Order Update</p>
    <p class="font-semibold mb-1">${notification.title || "Order update"}</p>
    <p class="text-sm leading-6 text-[#7A6A6A]">${notification.message || "Your order has been updated."}</p>
    <a href="notifications.html" class="inline-block mt-3 text-sm font-semibold text-[#d89ca4]">View notifications</a>
  `;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 7000);
}

function showBrowserNotification(notification) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const browserNotification = new Notification(notification.title || "Order update", {
    body: notification.message || "Your order has been updated.",
    tag: notification.id || notification.order_id || "ivy-order-update",
  });

  browserNotification.onclick = () => {
    window.focus();
    window.location.href = "notifications.html";
  };
}

function maybeOfferBrowserAlerts() {
  if (!("Notification" in window) || Notification.permission !== "default") return;
  if (localStorage.getItem("ivy_notification_prompt_seen")) return;

  const toast = document.createElement("div");
  toast.className = "ivy-notification-toast";
  toast.innerHTML = `
    <p class="font-semibold mb-1">Enable order alerts?</p>
    <p class="text-sm leading-6 text-[#7A6A6A]">Get browser alerts when your order status changes.</p>
    <div class="flex gap-2 mt-3">
      <button type="button" data-enable-alerts class="flex-1 rounded-full bg-[#d89ca4] px-4 py-2 text-sm text-white">Enable</button>
      <button type="button" data-dismiss-alerts class="flex-1 rounded-full border border-[#ead9dd] px-4 py-2 text-sm text-[#5C4A4A]">Not Now</button>
    </div>
  `;
  document.body.appendChild(toast);

  toast.querySelector("[data-enable-alerts]")?.addEventListener("click", async () => {
    localStorage.setItem("ivy_notification_prompt_seen", "1");
    await Notification.requestPermission();
    toast.remove();
  });

  toast.querySelector("[data-dismiss-alerts]")?.addEventListener("click", () => {
    localStorage.setItem("ivy_notification_prompt_seen", "1");
    toast.remove();
  });
}

function subscribeToNotifications(user) {
  if (!user) return;
  if (notificationsChannel) supabase.removeChannel(notificationsChannel);

  notificationsChannel = supabase
    .channel(`buyer-notifications-${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        refreshUnreadCount(user);
        showToast(payload.new);
        showBrowserNotification(payload.new);
      }
    )
    .subscribe();
}

export async function initIvyNotifications() {
  ensureNotificationStyles();
  ensureNotificationLinks();

  const user = await getCurrentUser();
  document.querySelectorAll("[data-auth='notifications']").forEach((el) => {
    el.classList.toggle("hidden", !user);
  });

  if (!user) return;

  await refreshUnreadCount(user);
  subscribeToNotifications(user);
  window.setInterval(() => refreshUnreadCount(user), 30000);
  window.setTimeout(maybeOfferBrowserAlerts, 1800);
}
