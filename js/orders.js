import { getCurrentUser } from "./auth.js";
import { supabase } from "./supabaseClient.js";

let currentUser = null;
let ordersChannel = null;
let refreshTimer = null;
let isLoadingOrders = false;

const SELLER_PHONE = "2347071291927";
const SELLER_EMAIL = "ivyfacialsasthetics@gmail.com";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isVisibleOrder(order) {
  return !["cancelled", "deleted"].includes(String(order.status || "").toLowerCase());
}

function formatMoney(value) {
  return `NGN ${Number(value || 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getShortOrderId(orderId) {
  return String(orderId || "").replace(/-/g, "").slice(0, 8).toUpperCase();
}

function normalizeStatus(status) {
  const value = String(status || "pending").toLowerCase();
  if (["accepted", "approved", "confirmed"].includes(value)) return "approved";
  if (["preparing", "processing"].includes(value)) return "preparing";
  if (["out_for_delivery", "out-for-delivery", "delivery"].includes(value)) return "out_for_delivery";
  if (value === "delivered") return "delivered";
  if (value === "cancelled") return "cancelled";
  return "pending";
}

function getStatusMeta(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "approved") {
    return {
      label: "Approved",
      badgeClass: "bg-green-100 text-green-700 border-green-200",
      messageClass: "bg-green-50 border-green-200",
      title: "Your order has been approved",
      body: "The seller has approved your order and will start preparing it soon.",
      activeStep: 2,
    };
  }

  if (normalized === "preparing") {
    return {
      label: "Preparing",
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
      messageClass: "bg-blue-50 border-blue-200",
      title: "Your order is being prepared",
      body: "Your products are being packed and prepared for delivery.",
      activeStep: 3,
    };
  }

  if (normalized === "out_for_delivery") {
    return {
      label: "Out for Delivery",
      badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
      messageClass: "bg-purple-50 border-purple-200",
      title: "Your order is out for delivery",
      body: "Your order is on its way. Please keep your phone available.",
      activeStep: 4,
    };
  }

  if (normalized === "delivered") {
    return {
      label: "Delivered",
      badgeClass: "bg-[#f0f7f2] text-green-800 border-green-200",
      messageClass: "bg-[#f0f7f2] border-green-200",
      title: "Your order has been delivered",
      body: "Thank you for shopping with IvyFacialGlow.",
      activeStep: 5,
    };
  }

  return {
    label: "Pending",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
    messageClass: "bg-yellow-50 border-yellow-200",
    title: "Waiting for admin approval",
    body: "Your order has been received and is being reviewed.",
    activeStep: 1,
  };
}

function renderTimeline(activeStep) {
  const steps = ["Placed", "Pending", "Approved", "Preparing", "On the way", "Delivered"];

  return `
    <div class="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-2">
      ${steps
        .map((step, index) => {
          const isActive = index <= activeStep;
          const dotClass = isActive ? "bg-[#d89ca4] border-[#d89ca4]" : "bg-white border-[#ead9dd]";
          const textClass = isActive ? "text-[#5C4A4A]" : "text-[#b0a3a3]";

          return `
            <div class="relative text-center">
              ${
                index > 0
                  ? `<span class="hidden md:block absolute top-[10px] -left-1/2 w-full h-px ${isActive ? "bg-[#d89ca4]" : "bg-[#ead9dd]"}"></span>`
                  : ""
              }
              <span class="relative mx-auto mb-2 block w-5 h-5 rounded-full border-2 ${dotClass}"></span>
              <p class="text-[10px] md:text-xs font-medium ${textClass}">${step}</p>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderItems(items) {
  if (!items.length) {
    return `
      <div class="rounded-2xl border border-[#f1e4e7] bg-[#fffafa] p-4 text-sm text-[#7A6A6A]">
        Product details are unavailable for this order.
      </div>
    `;
  }

  return items
    .map((item) => {
      const quantity = Number(item.quantity || 1);
      const lineTotal = Number(item.price || 0) * quantity;

      return `
        <div class="flex items-center gap-3 rounded-2xl border border-[#f1e4e7] bg-white p-3">
          <img
            src="${escapeHtml(item.image || "images/products/product1.jpg")}"
            alt="${escapeHtml(item.name || "Product")}"
            class="w-14 h-14 rounded-xl object-cover bg-[#faf6f7]"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-[#5C4A4A] truncate">${escapeHtml(item.name || "Product")}</p>
            <p class="text-xs text-[#7A6A6A]">Qty: ${quantity}</p>
          </div>
          <p class="text-sm font-semibold text-[#d89ca4] whitespace-nowrap">
            ${formatMoney(lineTotal)}
          </p>
        </div>
      `;
    })
    .join("");
}

function getContactLink(order) {
  const orderNumber = getShortOrderId(order.id);
  const text = encodeURIComponent(`Hello IvyFacialGlow, please I want to ask about Order #${orderNumber}.`);
  return `https://wa.me/${SELLER_PHONE}?text=${text}`;
}

async function fetchRemoteOrders(user) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .not("status", "in", "(cancelled,deleted)")
    .order("created_at", { ascending: false });

  return { orders: (data || []).filter(isVisibleOrder), error };
}

function renderOrderCard(order) {
  const status = getStatusMeta(order.status);
  const items = Array.isArray(order.items) ? order.items : [];
  const canCancel = normalizeStatus(order.status) === "pending";
  const orderNumber = getShortOrderId(order.id);

  return `
    <article class="bg-white/90 backdrop-blur-xl border border-[#ead9dd] rounded-[2rem] p-5 md:p-6 shadow-sm hover:shadow-xl transition duration-300">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <p class="text-[11px] uppercase tracking-[0.25em] text-[#b0a3a3] mb-2">Order Number</p>
          <h3 class="text-xl font-semibold text-[#5C4A4A]">#${escapeHtml(orderNumber)}</h3>
          <p class="text-xs text-[#7A6A6A] mt-2">Placed ${escapeHtml(formatDate(order.created_at))}</p>
        </div>

        <span class="w-fit px-4 py-2 rounded-full border text-xs font-semibold ${status.badgeClass}">
          ${status.label}
        </span>
      </div>

      <div class="rounded-[1.5rem] bg-[#fffafa] border border-[#f1e4e7] p-4 mb-6">
        ${renderTimeline(status.activeStep)}
      </div>

      <div class="space-y-3 mb-6">
        <p class="text-sm font-semibold text-[#5C4A4A]">Order Items</p>
        ${renderItems(items)}
      </div>

      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="rounded-2xl bg-[#fffafa] border border-[#f1e4e7] p-4">
          <p class="text-xs text-[#7A6A6A] mb-1">Subtotal</p>
          <p class="text-base font-semibold text-[#5C4A4A]">${formatMoney(order.subtotal)}</p>
        </div>
        <div class="rounded-2xl bg-[#fffafa] border border-[#f1e4e7] p-4">
          <p class="text-xs text-[#7A6A6A] mb-1">Total</p>
          <p class="text-base font-semibold text-[#d89ca4]">${formatMoney(order.total)}</p>
        </div>
      </div>

      <div class="rounded-2xl border p-4 mb-5 ${status.messageClass}">
        <p class="font-semibold text-[#5C4A4A] mb-1">${status.title}</p>
        <p class="text-sm text-[#7A6A6A] leading-6">${status.body}</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <a
          href="${getContactLink(order)}"
          target="_blank"
          rel="noopener"
          class="flex-1 text-center px-5 py-3 rounded-full bg-[#d89ca4] text-white text-sm font-semibold hover:bg-[#c98590] transition"
        >
          Message Seller
        </a>

        ${
          canCancel
            ? `<button
                type="button"
                data-cancel-order="${escapeHtml(order.id)}"
                class="flex-1 px-5 py-3 rounded-full border border-red-200 bg-red-50 text-red-500 text-sm font-semibold hover:bg-red-100 transition"
              >
                Cancel Order
              </button>`
            : `<a
                href="mailto:${SELLER_EMAIL}?subject=Order%20%23${escapeHtml(orderNumber)}"
                class="flex-1 text-center px-5 py-3 rounded-full border border-[#ead9dd] text-[#5C4A4A] text-sm font-semibold hover:bg-[#fff7f8] transition"
              >
                Email Seller
              </a>`
        }
      </div>
    </article>
  `;
}

async function loadOrders() {
  if (isLoadingOrders) return;
  isLoadingOrders = true;

  const user = await getCurrentUser();
  currentUser = user;

  if (!user) {
    sessionStorage.setItem("redirectAfterLogin", "orders.html");
    window.location.href = "login.html";
    return;
  }

  startLiveOrderUpdates(user);

  const container = document.getElementById("ordersContainer");

  if (!container) {
    isLoadingOrders = false;
    return;
  }

  container.innerHTML = `
    <div class="col-span-full text-center bg-white border border-[#ead9dd] rounded-[2rem] p-10">
      <p class="text-[#7A6A6A]">Loading your orders...</p>
    </div>
  `;

  localStorage.removeItem("ivy_orders");

  const { orders, error } = await fetchRemoteOrders(user);

  if (error && !orders.length) {
    container.innerHTML = `
      <div class="col-span-full bg-red-50 border border-red-200 text-red-600 rounded-2xl p-6 text-center">
        Error loading orders. Please try again.
      </div>
    `;
    isLoadingOrders = false;
    return;
  }

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center bg-white border border-[#ead9dd] rounded-[2rem] p-10">
        <h2 class="text-2xl mb-3 text-[#5C4A4A]" style="font-family: 'Playfair Display', serif;">
          No orders yet
        </h2>
        <p class="text-[#7A6A6A] mb-6">
          You have not placed any orders yet.
        </p>
        <a href="shop.html" class="inline-block px-6 py-3 rounded-full bg-[#d89ca4] text-white">
          Start Shopping
        </a>
      </div>
    `;
    isLoadingOrders = false;
    return;
  }

  container.innerHTML = orders.map(renderOrderCard).join("");
  isLoadingOrders = false;
}

function refreshOrdersQuietly() {
  if (!currentUser) return;
  loadOrders();
}

function startLiveOrderUpdates(user) {
  if (!user || ordersChannel) return;

  ordersChannel = supabase
    .channel(`buyer-orders-${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${user.id}`,
      },
      refreshOrdersQuietly
    )
    .subscribe();

  refreshTimer = window.setInterval(refreshOrdersQuietly, 15000);
}

async function cancelOrder(orderId) {
  if (!currentUser) return;

  const confirmed = window.confirm("Cancel this order? This can only be done before it is approved.");
  if (!confirmed) return;

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("user_id", currentUser.id)
    .eq("status", "pending")
    .select("id");

  if (error) {
    alert("Could not cancel order. If it has already been approved, please contact the seller.");
    console.log(error);
    return;
  }

  if (!data || data.length === 0) {
    alert("This order could not be canceled. It may already be approved or it may not belong to this account.");
    loadOrders();
    return;
  }

  loadOrders();
}

document.addEventListener("DOMContentLoaded", loadOrders);

document.addEventListener("click", (e) => {
  const cancelBtn = e.target.closest("[data-cancel-order]");
  if (!cancelBtn) return;
  cancelOrder(cancelBtn.dataset.cancelOrder);
});
