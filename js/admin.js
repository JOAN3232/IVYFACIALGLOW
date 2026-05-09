import { adminSupabase } from "./adminClient.js";

const ADMIN_EMAILS = ["ivyfacialsaesthetics@gmail.com"];
const ADMIN_PRODUCTS_KEY = "ivy_admin_products";
const OUT_OF_STOCK_KEY = "ivy_out_of_stock_product_ids";
const REMOVED_PRODUCTS_KEY = "ivy_removed_product_ids";

const ordersContainer = document.getElementById("ordersContainer");
const totalOrdersEl = document.getElementById("totalOrders");
const pendingOrdersEl = document.getElementById("pendingOrders");
const approvedOrdersEl = document.getElementById("approvedOrders");
const productForm = document.getElementById("productForm");
const adminProductsContainer = document.getElementById("adminProductsContainer");
const adminProductMessage = document.getElementById("adminProductMessage");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const productImageInput = document.getElementById("productImage");
const productImagePreview = document.getElementById("productImagePreview");
const productImageName = document.getElementById("productImageName");
const productSubmitBtn = document.getElementById("productSubmitBtn");
const cancelProductEditBtn = document.getElementById("cancelProductEditBtn");
const adminActionsMenuBtn = document.getElementById("adminActionsMenuBtn");
const adminActions = document.getElementById("adminActions");

const EMPTY_IMAGE_PREVIEW = productImagePreview?.src || "";
let selectedProductImage = "";
let selectedProductFile = null;
let currentOrders = [];
let remoteProducts = [];
let editingProduct = null;

adminActionsMenuBtn?.addEventListener("click", () => {
  const isOpen = adminActions?.classList.toggle("is-open");
  adminActionsMenuBtn.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

function readJson(key, fallback = []) {
  return JSON.parse(localStorage.getItem(key)) || fallback;
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMoney(value) {
  return `NGN ${Number(value || 0).toLocaleString()}`;
}

function getShortOrderId(orderId) {
  return String(orderId || "").replace(/-/g, "").slice(0, 8).toUpperCase();
}

function normalizeOrderStatus(status) {
  const value = String(status || "pending").toLowerCase();
  if (["accepted", "approved", "confirmed"].includes(value)) return "approved";
  if (["preparing", "processing"].includes(value)) return "preparing";
  if (["out_for_delivery", "out-for-delivery", "delivery"].includes(value)) return "out_for_delivery";
  if (value === "delivered") return "delivered";
  return "pending";
}

function getOrderStatusMeta(status) {
  const normalized = normalizeOrderStatus(status);
  const meta = {
    pending: {
      label: "Pending",
      badgeClass: "bg-yellow-100 text-yellow-700",
      nextLabel: "Approve",
      nextStatus: "approved",
    },
    approved: {
      label: "Approved",
      badgeClass: "bg-green-100 text-green-700",
      nextLabel: "Mark Preparing",
      nextStatus: "preparing",
    },
    preparing: {
      label: "Preparing",
      badgeClass: "bg-blue-100 text-blue-700",
      nextLabel: "Out for Delivery",
      nextStatus: "out_for_delivery",
    },
    out_for_delivery: {
      label: "Out for Delivery",
      badgeClass: "bg-purple-100 text-purple-700",
      nextLabel: "Mark Delivered",
      nextStatus: "delivered",
    },
    delivered: {
      label: "Delivered",
      badgeClass: "bg-[#f0f7f2] text-green-800",
      nextLabel: "",
      nextStatus: "",
    },
  };

  return meta[normalized] || meta.pending;
}

function getBaseProducts() {
  return typeof products !== "undefined" ? products : window.products || [];
}

function getAdminProducts() {
  return readJson(ADMIN_PRODUCTS_KEY);
}

function getOutOfStockIds() {
  return readJson(OUT_OF_STOCK_KEY).map(String);
}

function getRemovedProductIds() {
  return readJson(REMOVED_PRODUCTS_KEY).map(String);
}

function setProductMessage(message) {
  if (!adminProductMessage) return;
  adminProductMessage.textContent = message;
  setTimeout(() => {
    adminProductMessage.textContent = "";
  }, 2500);
}

function readUploadedImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function resizeImage(dataUrl, maxSize = 1000, quality = 0.82) {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function resetProductImageUpload() {
  selectedProductImage = "";
  selectedProductFile = null;
  if (productImageInput) productImageInput.value = "";
  if (productImagePreview) productImagePreview.src = EMPTY_IMAGE_PREVIEW;
  if (productImageName) productImageName.textContent = "Tap to choose from your phone";
}

function getAllManageableProducts() {
  return [
    ...getBaseProducts().map((product) => ({ ...product, source: "store" })),
    ...remoteProducts.map((product) => ({ ...product, source: "database" })),
    ...getAdminProducts().map((product) => ({ ...product, source: "admin" })),
  ];
}

function findManageableProduct(productId) {
  return getAllManageableProducts().find(
    (product) => String(product.id) === String(productId)
  );
}

function resetProductForm() {
  editingProduct = null;
  productForm?.reset();
  resetProductImageUpload();
  if (productImageInput) productImageInput.required = true;
  if (productSubmitBtn) productSubmitBtn.textContent = "Add Product";
  cancelProductEditBtn?.classList.add("hidden");
}

function startProductEdit(productId) {
  const product = findManageableProduct(productId);
  if (!product) return;

  editingProduct = {
    id: product.id,
    source: product.source,
    image: product.image,
    legacyId: product.legacyId || (product.source === "store" ? String(product.id) : null),
  };

  document.getElementById("productName").value = product.name || "";
  document.getElementById("productPrice").value = product.price || "";
  document.getElementById("productCategory").value = product.category || "skincare";
  document.getElementById("productMood").value = product.mood || "soft-calming";
  document.getElementById("productDescription").value = product.description || "";

  selectedProductImage = "";
  if (productImageInput) productImageInput.required = false;
  if (productImagePreview) productImagePreview.src = product.image || EMPTY_IMAGE_PREVIEW;
  if (productImageName) productImageName.textContent = "Current image kept unless you choose a new one";
  if (productSubmitBtn) productSubmitBtn.textContent = "Save Changes";
  cancelProductEditBtn?.classList.remove("hidden");
  productForm?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

function normalizeProduct(product, source = "database") {
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price || 0),
    image: product.image_url || product.image,
    category: product.category,
    mood: product.mood,
    description: product.description,
    funFact: product.fun_fact || product.funFact,
    legacyId: product.legacy_id || product.legacyId,
    isActive: product.is_active !== false,
    source,
  };
}

async function uploadProductImage(productName) {
  if (!selectedProductImage) return "";

  const blob = dataUrlToBlob(selectedProductImage);
  const safeName = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const filePath = `${Date.now()}-${safeName || "product"}.jpg`;

  const { error } = await adminSupabase.storage
    .from("product-images")
    .upload(filePath, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    console.log("PRODUCT IMAGE UPLOAD ERROR:", error);
    return selectedProductImage;
  }

  const { data } = adminSupabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

async function loadRemoteProducts() {
  const { data, error } = await adminSupabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("ADMIN PRODUCT LOAD ERROR:", error);
    remoteProducts = [];
    return;
  }

  remoteProducts = (data || []).map((product) => normalizeProduct(product));
}

async function createRemoteProduct(product) {
  const imageUrl = selectedProductImage
    ? await uploadProductImage(product.name)
    : product.image;

  const payload = {
    name: product.name,
    price: product.price,
    image_url: imageUrl,
    category: product.category,
    mood: product.mood,
    description: product.description,
    fun_fact: product.funFact || null,
    legacy_id: product.legacyId || null,
    is_active: true,
  };

  const query = product.legacyId
    ? adminSupabase
        .from("products")
        .upsert(payload, { onConflict: "legacy_id" })
        .select()
        .single()
    : adminSupabase
        .from("products")
        .insert([payload])
        .select()
        .single();

  const { data, error } = await query;

  if (error) {
    console.log("PRODUCT CREATE ERROR:", error);
    setProductMessage(error.message || "Could not save product online.");
    return null;
  }

  return normalizeProduct(data);
}

async function updateRemoteProduct(product) {
  const imageUrl = selectedProductImage
    ? await uploadProductImage(product.name)
    : editingProduct.image;

  const { data, error } = await adminSupabase
    .from("products")
    .update({
      name: product.name,
      price: product.price,
      image_url: imageUrl,
      category: product.category,
      mood: product.mood,
      description: product.description,
      fun_fact: product.funFact || null,
      legacy_id: editingProduct.legacyId || null,
    })
    .eq("id", editingProduct.id)
    .select()
    .single();

  if (error) {
    console.log("PRODUCT UPDATE ERROR:", error);
    return null;
  }

  return normalizeProduct(data);
}

async function createReplacementForStoreProduct(product) {
  return createRemoteProduct({
    ...product,
    image: selectedProductImage || editingProduct.image,
    legacyId: editingProduct.legacyId,
  });
}

function updateLocalProduct(product) {
  const nextProducts = getAdminProducts().map((item) => {
    if (String(item.id) !== String(editingProduct.id)) return item;

    return {
      ...item,
      name: product.name,
      price: product.price,
      image: selectedProductImage || editingProduct.image || item.image,
      category: product.category,
      mood: product.mood,
      description: product.description,
      funFact: product.funFact,
    };
  });

  writeJson(ADMIN_PRODUCTS_KEY, nextProducts);
}

async function checkAdmin() {
  const { data } = await adminSupabase.auth.getUser();
  const user = data?.user;

  if (!user) {
    window.location.href = "admin-login.html";
    return null;
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    alert("You are not allowed to access this admin page.");
    window.location.href = "index.html";
    return null;
  }

  return user;
}

function updateOrderStats(orders) {
  totalOrdersEl.textContent = orders.length;
  pendingOrdersEl.textContent = orders.filter((o) => normalizeOrderStatus(o.status) === "pending").length;
  approvedOrdersEl.textContent = orders.filter(
    (o) => normalizeOrderStatus(o.status) !== "pending"
  ).length;
}

function isVisibleOrder(order) {
  return !["cancelled", "deleted"].includes(String(order.status || "").toLowerCase());
}

function renderOrders(orders) {
  if (!orders.length) {
    ordersContainer.innerHTML = `
      <div class="bg-white border border-[#ead9dd] rounded-[1.5rem] p-8 text-center shadow-sm">
        <p class="text-sm text-[#7A6A6A]">No orders yet.</p>
      </div>
    `;
    return;
  }

  ordersContainer.innerHTML = orders.map((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const status = getOrderStatusMeta(order.status);
    const orderNumber = getShortOrderId(order.id);

    return `
      <article class="bg-white border border-[#ead9dd] rounded-[1.5rem] p-5 md:p-6 shadow-sm hover:shadow-xl transition">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
          <div>
            <p class="text-[11px] text-[#b98a92] uppercase tracking-[0.22em] mb-2">Order ID</p>
            <h3 class="text-xl font-semibold text-[#5C4A4A]">#${escapeHtml(orderNumber)}</h3>
          </div>

          <span class="w-fit px-4 py-1.5 rounded-full text-xs font-medium ${status.badgeClass}">
            ${status.label}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 text-sm">
          <div class="rounded-2xl bg-[#fffafa] border border-[#f1e4e7] p-3">
            <p class="text-xs text-[#9b8a8a] mb-1">Customer</p>
            <p class="font-medium text-[#5C4A4A]">${escapeHtml(order.full_name || "N/A")}</p>
          </div>
          <div class="rounded-2xl bg-[#fffafa] border border-[#f1e4e7] p-3">
            <p class="text-xs text-[#9b8a8a] mb-1">Phone</p>
            <p class="font-medium text-[#5C4A4A]">${escapeHtml(order.phone || "N/A")}</p>
          </div>
          <div class="rounded-2xl bg-[#fffafa] border border-[#f1e4e7] p-3">
            <p class="text-xs text-[#9b8a8a] mb-1">Email</p>
            <p class="font-medium text-[#5C4A4A] truncate">${escapeHtml(order.email || "N/A")}</p>
          </div>
          <div class="rounded-2xl bg-[#fffafa] border border-[#f1e4e7] p-3">
            <p class="text-xs text-[#9b8a8a] mb-1">Delivery</p>
            <p class="font-medium text-[#5C4A4A]">${escapeHtml(order.address || "N/A")}</p>
          </div>
        </div>

        <div class="mb-5">
          <p class="text-sm font-semibold mb-3 text-[#5C4A4A]">Items</p>
          ${items.map((item) => `
            <div class="flex items-center justify-between gap-3 text-sm border-b border-[#f1e4e7] py-3">
              <div class="flex items-center gap-3 min-w-0">
                <img src="${escapeHtml(item.image || "images/products/product1.jpg")}" alt="${escapeHtml(item.name || "Product")}" class="w-12 h-12 rounded-xl object-cover bg-[#faf6f7]" />
                <div class="min-w-0">
                  <p class="truncate font-medium text-[#5C4A4A]">${escapeHtml(item.name || "Product")}</p>
                  <p class="text-xs text-[#9b8a8a]">Qty ${item.quantity || 1}</p>
                </div>
              </div>
              <span class="font-medium text-[#d89ca4]">${formatMoney((item.price || 0) * (item.quantity || 1))}</span>
            </div>
          `).join("")}
        </div>

        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mt-5">
          <p class="text-2xl font-semibold text-[#d89ca4]">
            ${formatMoney(order.total)}
          </p>

          <div class="flex flex-col sm:flex-row gap-2">
            ${
              status.nextStatus
                ? `<button onclick="updateOrderStatus('${escapeHtml(order.id)}', '${status.nextStatus}')" class="px-5 py-2.5 rounded-full bg-[#5C4A4A] hover:bg-green-600 transition text-white text-sm font-medium">
                    ${status.nextLabel}
                  </button>`
                : `<button disabled class="px-5 py-2.5 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                    Delivered
                  </button>`
            }
            <button onclick="deleteOrder('${order.id}')" class="px-5 py-2.5 rounded-full bg-red-50 hover:bg-red-100 transition text-red-500 text-sm font-medium">
              Delete
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

async function loadAdminOrders() {
  const { data: remoteOrders, error } = await adminSupabase
    .from("orders")
    .select("*")
    .not("status", "in", "(cancelled,deleted)")
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
  }

  localStorage.removeItem("ivy_orders");

  const orders = (remoteOrders || []).filter(isVisibleOrder);
  currentOrders = orders;
  updateOrderStats(orders);
  renderOrders(orders);
}

window.updateOrderStatus = async function (orderId, status) {
  const { error } = await adminSupabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.log(error);
    alert("Could not update order status.");
    return;
  }

  alert("Order status updated.");
  loadAdminOrders();
};

window.approveOrder = function (orderId) {
  window.updateOrderStatus(orderId, "approved");
};

window.deleteOrder = async function (orderId) {
  const confirmed = window.confirm("Remove this order from the dashboard?");
  if (!confirmed) return;

  const { error } = await adminSupabase
    .from("orders")
    .update({ status: "deleted" })
    .eq("id", orderId);

  if (error) {
    console.log(error);
    alert("Could not delete order.");
    return;
  }

  alert("Order removed.");
  loadAdminOrders();
};

function renderProducts() {
  const hiddenIds = new Set(getOutOfStockIds());
  const removedIds = new Set(getRemovedProductIds());
  const replacedLegacyIds = new Set(
    remoteProducts.map((product) => String(product.legacyId || "")).filter(Boolean)
  );
  const visibleBaseProducts = getBaseProducts().filter(
    (product) =>
      !replacedLegacyIds.has(String(product.id)) &&
      !removedIds.has(String(product.id))
  );
  const allProducts = [
    ...visibleBaseProducts.map((product) => ({ ...product, source: "store" })),
    ...remoteProducts.map((product) => ({ ...product, source: "database" })),
    ...getAdminProducts()
      .filter((product) => !removedIds.has(String(product.id)))
      .map((product) => ({ ...product, source: "admin" })),
  ];

  adminProductsContainer.innerHTML = allProducts.map((product) => {
    const isHidden = product.isActive === false || hiddenIds.has(String(product.id));

    return `
      <article class="bg-white border border-[#ead9dd] rounded-[1.25rem] p-4 flex gap-4 shadow-sm hover:shadow-lg transition">
        <img src="${product.image}" alt="${product.name}" class="w-20 h-20 rounded-xl object-cover bg-[#faf6f7] border border-[#f1e4e7]" />
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="font-semibold truncate text-[#5C4A4A]">${product.name}</h3>
              <p class="text-sm text-[#d89ca4] font-medium">₦${Number(product.price || 0).toLocaleString()}</p>
            </div>
            <span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] ${product.source !== "store" ? "bg-[#fff1f3] text-[#b98a92]" : "bg-[#f7f2f3] text-[#7A6A6A]"}">
              ${product.source === "database" ? "Online" : product.source === "admin" ? "Local" : "Store"}
            </span>
          </div>
          <p class="text-xs mt-2 ${isHidden ? "text-red-500" : "text-green-600"}">
            ${isHidden ? "Out of stock" : "In stock"}
          </p>
          <div class="flex flex-wrap gap-2 mt-3">
            <button onclick="toggleStock('${product.id}')" class="px-3 py-2 rounded-full border border-[#ead9dd] hover:bg-[#fff1f3] transition text-xs">
              ${isHidden ? "Restore" : "Out of Stock"}
            </button>
            <button onclick="editProduct('${product.id}')" class="px-3 py-2 rounded-full border border-[#ead9dd] hover:bg-[#fff1f3] transition text-xs">
              Edit
            </button>
            <button onclick="removeAdminProduct('${product.id}')" class="px-3 py-2 rounded-full bg-red-50 hover:bg-red-100 transition text-red-500 text-xs">
              Remove
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

window.toggleStock = async function (productId) {
  const remoteProduct = remoteProducts.find((product) => String(product.id) === String(productId));

  if (remoteProduct) {
    const nextStatus = remoteProduct.isActive === false;
    const { error } = await adminSupabase
      .from("products")
      .update({ is_active: nextStatus })
      .eq("id", productId);

    if (error) {
      console.log("PRODUCT STOCK ERROR:", error);
      setProductMessage("Could not update product online.");
      return;
    }

    await loadRemoteProducts();
    renderProducts();
    setProductMessage("Product availability updated.");
    return;
  }

  const hiddenIds = new Set(getOutOfStockIds());

  if (hiddenIds.has(String(productId))) {
    hiddenIds.delete(String(productId));
  } else {
    hiddenIds.add(String(productId));
  }

  writeJson(OUT_OF_STOCK_KEY, [...hiddenIds]);
  renderProducts();
  setProductMessage("Product availability updated.");
};

window.removeAdminProduct = async function (productId) {
  const confirmed = window.confirm("Remove this product from the shop?");
  if (!confirmed) return;

  const remoteProduct = remoteProducts.find((product) => String(product.id) === String(productId));

  if (remoteProduct) {
    const { error } = await adminSupabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.log("PRODUCT DELETE ERROR:", error);
      setProductMessage("Could not remove product online.");
      return;
    }

    await loadRemoteProducts();
    renderProducts();
    setProductMessage("Product removed.");
    return;
  }

  const storeProduct = getBaseProducts().find((product) => String(product.id) === String(productId));

  if (storeProduct) {
    const removedIds = new Set(getRemovedProductIds());
    const hiddenIds = new Set(getOutOfStockIds());
    removedIds.add(String(productId));
    hiddenIds.delete(String(productId));
    writeJson(REMOVED_PRODUCTS_KEY, [...removedIds]);
    writeJson(OUT_OF_STOCK_KEY, [...hiddenIds]);
    renderProducts();
    setProductMessage("Product removed from the shop.");
    return;
  }

  const nextProducts = getAdminProducts().filter(
    (product) => String(product.id) !== String(productId)
  );
  writeJson(ADMIN_PRODUCTS_KEY, nextProducts);
  renderProducts();
  setProductMessage("Product removed.");
};

window.editProduct = function (productId) {
  startProductEdit(productId);
};

function setupProductForm() {
  productImageInput?.addEventListener("change", async () => {
    const file = productImageInput.files?.[0];

    if (!file) {
      resetProductImageUpload();
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProductMessage("Please choose an image file.");
      resetProductImageUpload();
      return;
    }

    const uploadedImage = await readUploadedImage(file);
    selectedProductImage = await resizeImage(uploadedImage);
    if (productImagePreview) productImagePreview.src = selectedProductImage;
    if (productImageName) productImageName.textContent = file.name;
  });

  productForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const product = {
      id: `admin-${Date.now()}`,
      name: document.getElementById("productName").value.trim(),
      price: Number(document.getElementById("productPrice").value),
      image: selectedProductImage,
      category: document.getElementById("productCategory").value,
      mood: document.getElementById("productMood").value,
      description: document.getElementById("productDescription").value.trim(),
      funFact: "",
    };

    if (!product.name || !product.price || (!product.image && !editingProduct?.image)) {
      setProductMessage("Please fill in product name, price, and image.");
      return;
    }

    if (editingProduct) {
      if (editingProduct.source === "database") {
        const updatedProduct = await updateRemoteProduct(product);

        if (!updatedProduct) {
          setProductMessage("Could not update product online.");
          return;
        }

        remoteProducts = remoteProducts.map((item) =>
          String(item.id) === String(updatedProduct.id) ? updatedProduct : item
        );
        setProductMessage("Product updated online.");
      } else if (editingProduct.source === "store") {
        const replacementProduct = await createReplacementForStoreProduct(product);

        if (!replacementProduct) {
          if (!adminProductMessage?.textContent) {
            setProductMessage("Could not save edited product online.");
          }
          return;
        }

        remoteProducts = [replacementProduct, ...remoteProducts];
        setProductMessage("Original product edited online.");
      } else {
        updateLocalProduct(product);
        setProductMessage("Product updated.");
      }

      resetProductForm();
      renderProducts();
      return;
    }

    const remoteProduct = await createRemoteProduct(product);

    if (remoteProduct) {
      remoteProducts = [remoteProduct, ...remoteProducts];
    } else {
      writeJson(ADMIN_PRODUCTS_KEY, [product, ...getAdminProducts()]);
      setProductMessage("Saved locally. Run the Supabase setup to save products online.");
    }

    resetProductForm();
    renderProducts();
    if (remoteProduct) setProductMessage("Product added online.");
  });

  cancelProductEditBtn?.addEventListener("click", resetProductForm);
}

document.addEventListener("DOMContentLoaded", async () => {
  const admin = await checkAdmin();
  if (!admin) return;

  adminLogoutBtn?.addEventListener("click", async () => {
    await adminSupabase.auth.signOut();
    window.location.href = "admin-login.html";
  });

  setupProductForm();
  await loadRemoteProducts();
  renderProducts();
  loadAdminOrders();
});
