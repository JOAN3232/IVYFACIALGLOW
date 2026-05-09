import { getCurrentUser } from "./auth.js";
import { supabase } from "./supabaseClient.js";

// =========================
// CART HELPERS
// =========================
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

// =========================
// AUTH + INIT
// =========================
document.addEventListener("DOMContentLoaded", async () => {
 const user = await getCurrentUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  refresh();

  document
    .getElementById("deliverySelect")
    ?.addEventListener("change", refresh);

  setupPlaceOrder(user);
});

// =========================
// CART COUNT
// =========================
function updateCartCount() {
  const cart = getCart();

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const el = document.getElementById("cart-count");
  if (el) el.textContent = totalItems;
}

// =========================
// RENDER CHECKOUT
// =========================
function renderCheckout(cart) {
  const checkoutItems = document.getElementById("checkoutItems");
  const subtotalEl = document.getElementById("checkoutSubtotal");
  const deliveryEl = document.getElementById("checkoutDelivery");
  const totalEl = document.getElementById("checkoutTotal");
  const emptyState = document.getElementById("emptyCheckoutState");
  const deliverySelect = document.getElementById("deliverySelect");

  if (!checkoutItems) return;

  checkoutItems.innerHTML = "";

  if (!cart.length) {
    emptyState?.classList.remove("hidden");

    subtotalEl.textContent = "₦0";
    deliveryEl.textContent = "₦0";
    totalEl.textContent = "₦0";
    return;
  }

  emptyState?.classList.add("hidden");

  let subtotal = 0;

  cart.forEach((item) => {
    subtotal += item.price * item.quantity;

    checkoutItems.innerHTML += `
      <div class="flex items-center justify-between text-sm border-b border-[#ead9dd] pb-3">
        <div class="flex items-center gap-3">
          <img src="${item.image}" class="w-12 h-12 rounded-lg object-cover" />
          <div>
            <p class="font-medium">${item.name}</p>
            <p class="text-xs text-gray-500">Qty: ${item.quantity}</p>
          </div>
        </div>

        <p class="text-[#d89ca4] font-medium">
          ₦${(item.price * item.quantity).toLocaleString()}
        </p>
      </div>
    `;
  });

  const delivery = Number(deliverySelect?.value || 0);
  const total = subtotal + delivery;

  subtotalEl.textContent = `₦${subtotal.toLocaleString()}`;
  deliveryEl.textContent = `₦${delivery.toLocaleString()}`;
  totalEl.textContent = `₦${total.toLocaleString()}`;
}

// =========================
// REFRESH
// =========================
function refresh() {
  const cart = getCart();
  renderCheckout(cart);
  updateCartCount();
}

// =========================
// LIVE CART SYNC
// =========================
window.addEventListener("cartUpdated", refresh);

// =========================
// PLACE ORDER (SUPABASE)
// =========================
function setupPlaceOrder(user) {
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  const checkoutForm = document.getElementById("checkoutForm");
  const successBox = document.getElementById("orderSuccess");
  let isPlacingOrder = false;

  placeOrderBtn?.addEventListener("click", async () => {
    if (isPlacingOrder) return;

    const cart = getCart();

    const name = document.getElementById("fullName")?.value;
    const phone = document.getElementById("phone")?.value;
    const email = document.getElementById("email")?.value || user.email;
    const address = document.getElementById("address")?.value;

    if (!name || !phone || !address) {
      alert("Please fill in required fields");
      return;
    }

    if (!cart.length) {
      alert("Cart is empty");
      return;
    }

    const delivery = Number(
      document.getElementById("deliverySelect")?.value || 0,
    );

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const total = subtotal + delivery;

    // 🔥 INSERT ORDER INTO SUPABASE
    const orderForDatabase = {
      user_id: user.id,
      full_name: name,
      phone,
      email,
      address,
      items: cart,
      subtotal,
      delivery,
      total,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    isPlacingOrder = true;
    if (placeOrderBtn) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.textContent = "Placing order...";
    }

    const { error } = await supabase
      .from("orders")
      .insert([orderForDatabase]);

    if (error) {
      console.log("ORDER ERROR:", error);
      alert(error.message);
      isPlacingOrder = false;
      if (placeOrderBtn) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = "Place Order";
      }
      return;
    }

    // clear cart
    localStorage.removeItem("cart");

    refresh();

    checkoutForm?.classList.add("hidden");
    successBox?.classList.remove("hidden");
    setTimeout(() => {
      window.location.href = "orders.html";
    }, 1500);
  });
}
