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
  const checkoutDraftKey = `ivy_checkout_draft_${user.id}`;
  let isSubmittingPayment = false;
  let confirmedOrderId = "";
  let paymentChannel = null;
  let draftSaveTimer = null;
  let isRestoringCheckout = false;
  let shouldSyncCheckoutDraft = true;

  const draftFields = ["fullName", "phone", "email", "deliverySelect", "address", "notes"];

  function getSavedPendingOrderId() {
    const savedOrderId = localStorage.getItem(pendingOrderKey) || sessionStorage.getItem(pendingOrderKey) || "";

    if (savedOrderId && !localStorage.getItem(pendingOrderKey)) {
      localStorage.setItem(pendingOrderKey, savedOrderId);
    }

    return savedOrderId;
  }

  function savePendingOrderId(orderId) {
    localStorage.setItem(pendingOrderKey, orderId);
    sessionStorage.setItem(pendingOrderKey, orderId);
  }

  function clearPendingOrderId() {
    localStorage.removeItem(pendingOrderKey);
    sessionStorage.removeItem(pendingOrderKey);
  }

  function fillCheckoutField(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field && value !== undefined && value !== null) field.value = value;
  }

  function restoreCheckoutFromOrder(order) {
    if (!order) return;

    fillCheckoutField("fullName", order.full_name);
    fillCheckoutField("phone", order.phone);
    fillCheckoutField("email", order.email || user.email);
    fillCheckoutField("address", order.address);
    fillCheckoutField("deliverySelect", String(order.delivery || 0));

    if (Array.isArray(order.items) && order.items.length) {
      localStorage.setItem("cart", JSON.stringify(order.items));
      window.dispatchEvent(new Event("cartUpdated"));
    }

    saveCheckoutDraft();
    refresh();
  }

  function getCheckoutDraftPayload() {
    return {
      user_id: user.id,
      full_name: document.getElementById("fullName")?.value.trim() || null,
      phone: document.getElementById("phone")?.value.trim() || null,
      email: document.getElementById("email")?.value.trim() || user.email,
      address: document.getElementById("address")?.value.trim() || null,
      notes: document.getElementById("notes")?.value.trim() || null,
      delivery: Number(document.getElementById("deliverySelect")?.value || 0),
      items: getCart(),
      updated_at: new Date().toISOString(),
    };
  }

  async function saveRemoteCheckoutDraft() {
    if (isRestoringCheckout || !shouldSyncCheckoutDraft) return;

    const draft = getCheckoutDraftPayload();
    const hasCheckoutProgress =
      draft.items.length || draft.full_name || draft.phone || draft.address || draft.notes;

    if (!hasCheckoutProgress) return;

    await supabase.from("checkout_drafts").upsert(draft, { onConflict: "user_id" });
  }

  function scheduleRemoteCheckoutDraftSave() {
    window.clearTimeout(draftSaveTimer);
    draftSaveTimer = window.setTimeout(saveRemoteCheckoutDraft, 450);
  }

  function saveCheckoutDraft() {
    const draft = {};

    draftFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) draft[fieldId] = field.value;
    });

    localStorage.setItem(checkoutDraftKey, JSON.stringify(draft));
    scheduleRemoteCheckoutDraftSave();
  }

  function restoreCheckoutDraft() {
    let savedDraft = {};

    try {
      savedDraft = JSON.parse(localStorage.getItem(checkoutDraftKey) || "{}");
    } catch (error) {
      localStorage.removeItem(checkoutDraftKey);
    }

    draftFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field && Object.prototype.hasOwnProperty.call(savedDraft, fieldId)) {
        field.value = savedDraft[fieldId];
      }
    });

    refresh();
  }

  draftFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    field?.addEventListener("input", saveCheckoutDraft);
    field?.addEventListener("change", saveCheckoutDraft);
  });
  window.addEventListener("cartUpdated", saveCheckoutDraft);

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
    const params = new URLSearchParams(window.location.search);
    const orderFromUrl = params.get("order");
    const pendingOrderId = orderFromUrl || getSavedPendingOrderId();
    let query = supabase
      .from("orders")
      .select("id,user_id,full_name,phone,email,address,items,delivery,payment_status,status,created_at")
      .eq("user_id", user.id)
      .in("status", ["awaiting_payment"]);

    if (pendingOrderId) {
      query = query.eq("id", pendingOrderId).maybeSingle();
    } else {
      query = query.order("created_at", { ascending: false }).limit(1).maybeSingle();
    }

    const { data, error } = await query;

    if (error || !data || ["cancelled", "deleted"].includes(String(data.status || "").toLowerCase())) {
      clearPendingOrderId();
      lockPlaceOrder();
      return false;
    }

    isRestoringCheckout = true;
    savePendingOrderId(data.id);
    restoreCheckoutFromOrder(data);
    isRestoringCheckout = false;
    watchPaymentConfirmation(data.id);

    if (data.payment_status === "confirmed") {
      unlockPlaceOrder(data.id, false);
      return true;
    }

    if (confirmTransferBtn) {
      confirmTransferBtn.disabled = true;
      confirmTransferBtn.textContent = "Waiting For Admin Confirmation";
    }
    lockPlaceOrder("Transfer submitted. Waiting for admin to confirm payment.");
    return true;
  }

  async function restoreRemoteCheckoutDraft() {
    const { data, error } = await supabase
      .from("checkout_drafts")
      .select("full_name,phone,email,address,notes,delivery,items")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return;

    isRestoringCheckout = true;
    fillCheckoutField("fullName", data.full_name);
    fillCheckoutField("phone", data.phone);
    fillCheckoutField("email", data.email || user.email);
    fillCheckoutField("address", data.address);
    fillCheckoutField("notes", data.notes);
    fillCheckoutField("deliverySelect", String(data.delivery || 0));

    if (Array.isArray(data.items) && data.items.length) {
      localStorage.setItem("cart", JSON.stringify(data.items));
    }

    saveCheckoutDraft();
    refresh();
    isRestoringCheckout = false;
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

    saveCheckoutDraft();
    savePendingOrderId(data.id);
    shouldSyncCheckoutDraft = false;
    window.clearTimeout(draftSaveTimer);
    await supabase.from("checkout_drafts").delete().eq("user_id", user.id);
    watchPaymentConfirmation(data.id);
    setPaymentMessage("Transfer submitted. Waiting for admin to confirm payment.");
    if (confirmTransferBtn) confirmTransferBtn.textContent = "Waiting For Admin Confirmation";
  });

  placeOrderBtn?.addEventListener("click", async () => {
    if (!confirmedOrderId) {
      alert("Please wait for admin to confirm your payment first.");
      return;
    }

    localStorage.removeItem("cart");
    localStorage.removeItem(checkoutDraftKey);
    clearPendingOrderId();
    shouldSyncCheckoutDraft = false;
    window.clearTimeout(draftSaveTimer);
    await supabase.from("checkout_drafts").delete().eq("user_id", user.id);
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

  async function initCheckoutProgress() {
    restoreCheckoutDraft();

    const restoredPendingPayment = await restorePendingPayment();
    if (restoredPendingPayment) return;

    await restoreRemoteCheckoutDraft();
    scheduleRemoteCheckoutDraftSave();
  }

  initCheckoutProgress();
}
