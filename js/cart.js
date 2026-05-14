// Handles the cart page: reads cart items from localStorage, renders them,
// updates quantities/removal, and recalculates subtotal, delivery, and total.
const cartContainer = document.getElementById("cartItemsContainer");
const emptyState = document.getElementById("emptyCartState");

const subtotalEl = document.getElementById("cartSubtotal");
const totalEl = document.getElementById("cartTotal");
const deliveryEl = document.getElementById("deliveryPrice");
const deliverySelect = document.getElementById("deliverySelect");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =========================
// CART HELPERS
// =========================
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

// =========================
// RENDER CART
// =========================
function renderCart() {
  const cart = getCart();

  if (!cart.length) {
    cartContainer.innerHTML = "";
    emptyState.classList.remove("hidden");
    updateTotals();
    return;
  }

  emptyState.classList.add("hidden");

  cartContainer.innerHTML = cart
    .map(
      (item, index) => `
    <div class="cart-card rounded-[2rem] border border-[#ead9dd] p-5 flex gap-4 items-center">

      <div class="w-24 h-24 bg-[#faf6f7] rounded-xl flex items-center justify-center">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name || "Product")}" class="w-full h-full object-contain" />
      </div>

      <div class="flex-1">
        <h3 class="text-lg font-medium">${escapeHtml(item.name)}</h3>
        <p class="text-sm text-[#7a6a6a]">₦${Number(item.price).toLocaleString()}</p>

        <div class="flex items-center gap-3 mt-2">
          <button onclick="decreaseQty(${index})">−</button>
          <span>${item.quantity}</span>
          <button onclick="increaseQty(${index})">+</button>
        </div>
      </div>

      <button onclick="removeItem(${index})" class="text-red-400">✕</button>

    </div>
  `
    )
    .join("");

  updateTotals();
}

// =========================
// QUANTITY
// =========================
function increaseQty(index) {
  const cart = getCart();
  cart[index].quantity += 1;
  saveCart(cart);
  renderCart();
  updateCartCount?.();
}

function decreaseQty(index) {
  const cart = getCart();

  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
  } else {
    cart.splice(index, 1);
  }

  saveCart(cart);
  renderCart();
  updateCartCount?.();
}

function removeItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
  updateCartCount?.();
}

// =========================
// TOTALS
// =========================
function updateTotals() {
  const cart = getCart();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const delivery = Number(deliverySelect?.value || 0);
  const total = subtotal + delivery;

  if (subtotalEl) subtotalEl.textContent = `₦${subtotal.toLocaleString()}`;
  if (deliveryEl) deliveryEl.textContent = `₦${delivery.toLocaleString()}`;
  if (totalEl) totalEl.textContent = `₦${total.toLocaleString()}`;
}

// =========================
// DELIVERY CHANGE
// =========================
deliverySelect?.addEventListener("change", updateTotals);

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  updateCartCount?.();
});

// live sync from other pages
window.addEventListener("cartUpdated", () => {
  renderCart();
  updateTotals();
  updateCartCount?.();
});
