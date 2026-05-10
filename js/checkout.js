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
// PAYMENT CONFIRMATION + PLACE ORDER
// =========================
function setupPlaceOrder(user) {
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  const confirmTransferBtn = document.getElementById("confirmTransferBtn");
  const checkoutForm = document.getElementById("checkoutForm");
  const successBox = document.getElementById("orderSuccess");
  const paymentStatusText = document.getElementById("paymentStatusText");
  const paymentConfirmedModal = document.getElementById("paymentConfirmedModal");
  const continueAfterPaymentBtn = document.getElementById("continueAfterPaymentBtn");
  const pendingOrderKey = `ivy_pending_payment_order_${user.id}`;
  let isSubmittingPayment = false;
  let confirmedOrderId = "";
  let paymentChannel = null;

  function setPaymentMessage(message) {
    if (paymentStatusText) paymentStatusText.textContent = message;
  }

  function lockPlaceOrder(message = "Place Order unlocks after the admin confirms your payment.") {
    if (placeOrderBtn) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.textContent = "Place Order";
    }
    setPaymentMessage(message);
  }

  function unlockPlaceOrder(orderId, showModal = true) {
    confirmedOrderId = orderId;
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place Order";
    }
    if (confirmTransferBtn) {
      confirmTransferBtn.disabled = true;
      confirmTransferBtn.textContent = "Payment Confirmed";
    }
    setPaymentMessage("Payment received. You can now place your order.");

    if (showModal) {
      paymentConfirmedModal?.classList.remove("hidden");
      paymentConfirmedModal?.classList.add("flex");
    }
  }

  function validateCheckoutDetails() {
    const cart = getCart();
    const name = document.getElementById("fullName")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const email = document.getElementById("email")?.value.trim() || user.email;
    const address = document.getElementById("address")?.value.trim();

    if (!name || !phone || !address) {
      alert("Please fill in required fields");
      return null;
    }

    if (!cart.length) {
      alert("Cart is empty");
      return null;
    }

    const delivery = Number(document.getElementById("deliverySelect")?.value || 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + delivery;

    return {
      user_id: user.id,
      full_name: name,
      phone,
      email,
      address,
      items: cart,
      subtotal,
      delivery,
      total,
      payment_method: "bank-transfer",
      payment_status: "awaiting_confirmation",
      status: "awaiting_payment",
      created_at: new Date().toISOString(),
    };
  }

  function watchPaymentConfirmation(orderId) {
    if (!orderId) return;
    if (paymentChannel) supabase.removeChannel(paymentChannel);

    paymentChannel = supabase
      .channel(`checkout-payment-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const order = payload.new;
          if (order?.payment_status === "confirmed") {
            unlockPlaceOrder(order.id, true);
          }
        }
      )
      .subscribe();
  }

  async function restorePendingPayment() {
    const pendingOrderId = sessionStorage.getItem(pendingOrderKey);
    if (!pendingOrderId) {
      lockPlaceOrder();
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("id,payment_status,status")
      .eq("id", pendingOrderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data || ["cancelled", "deleted"].includes(String(data.status || "").toLowerCase())) {
      sessionStorage.removeItem(pendingOrderKey);
      lockPlaceOrder();
      return;
    }

    watchPaymentConfirmation(data.id);

    if (data.payment_status === "confirmed") {
      unlockPlaceOrder(data.id, false);
      return;
    }

    if (confirmTransferBtn) {
      confirmTransferBtn.disabled = true;
      confirmTransferBtn.textContent = "Waiting For Admin Confirmation";
    }
    lockPlaceOrder("Transfer submitted. Waiting for admin to confirm payment.");
  }

  confirmTransferBtn?.addEventListener("click", async () => {
    if (isSubmittingPayment) return;

    const orderForDatabase = validateCheckoutDetails();
    if (!orderForDatabase) return;

    isSubmittingPayment = true;
    if (confirmTransferBtn) {
      confirmTransferBtn.disabled = true;
      confirmTransferBtn.textContent = "Sending for confirmation...";
    }
    lockPlaceOrder("Sending your payment confirmation to admin...");

    const { data, error } = await supabase
      .from("orders")
      .insert([orderForDatabase])
      .select("id")
      .single();

    if (error) {
      console.log("ORDER ERROR:", error);
      alert(error.message);
      isSubmittingPayment = false;
      if (confirmTransferBtn) {
        confirmTransferBtn.disabled = false;
        confirmTransferBtn.textContent = "I Have Made The Transfer";
      }
      lockPlaceOrder();
      return;
    }

    sessionStorage.setItem(pendingOrderKey, data.id);
    watchPaymentConfirmation(data.id);
    setPaymentMessage("Transfer submitted. Waiting for admin to confirm payment.");
    if (confirmTransferBtn) confirmTransferBtn.textContent = "Waiting For Admin Confirmation";
  });

  placeOrderBtn?.addEventListener("click", () => {
    if (!confirmedOrderId) {
      alert("Please wait for admin to confirm your payment first.");
      return;
    }

    localStorage.removeItem("cart");
    sessionStorage.removeItem(pendingOrderKey);
    refresh();
    checkoutForm?.classList.add("hidden");
    successBox?.classList.remove("hidden");

    setTimeout(() => {
      window.location.href = "orders.html";
    }, 1500);
  });

  continueAfterPaymentBtn?.addEventListener("click", () => {
    paymentConfirmedModal?.classList.add("hidden");
    paymentConfirmedModal?.classList.remove("flex");
  });

  restorePendingPayment();
}
