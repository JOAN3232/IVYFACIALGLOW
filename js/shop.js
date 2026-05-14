// Powers the shop page: loads database products, merges local/admin product
// state, filters/sorts products, and opens the product detail drawer.
import { supabase } from "./supabaseClient.js";

const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const moodFilter = document.getElementById("moodFilter");
const sortFilter = document.getElementById("sortFilter");
const resultsCount = document.getElementById("resultsCount");

const productDrawer = document.getElementById("productDrawer");
const productDrawerOverlay = document.getElementById("productDrawerOverlay");
const productDrawerContent = document.getElementById("productDrawerContent");
const closeProductDrawer = document.getElementById("closeProductDrawer");

const openMobileFilter = document.getElementById("openMobileFilter");
const mobileFilterOverlay = document.getElementById("mobileFilterOverlay");
const mobileFilterDrawer = document.getElementById("mobileFilterDrawer");
const closeMobileFilter = document.getElementById("closeMobileFilter");
const mobileCategoryFilter = document.getElementById("mobileCategoryFilter");
const mobileMoodFilter = document.getElementById("mobileMoodFilter");
const mobileSortFilter = document.getElementById("mobileSortFilter");
const applyMobileFilters = document.getElementById("applyMobileFilters");
const clearAllBtn = document.getElementById("clearAllBtn");

const ADMIN_PRODUCTS_KEY = "ivy_admin_products";
const OUT_OF_STOCK_KEY = "ivy_out_of_stock_product_ids";
const REMOVED_PRODUCTS_KEY = "ivy_removed_product_ids";
let remoteProducts = [];

const filterState = {
  search: "",
  category: "all",
  mood: "all",
  sort: "default",
};

const params = new URLSearchParams(window.location.search);
if (params.get("mood")) filterState.mood = params.get("mood");
if (params.get("category")) filterState.category = params.get("category");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStoredProducts() {
  return JSON.parse(localStorage.getItem(ADMIN_PRODUCTS_KEY)) || [];
}

function getOutOfStockIds() {
  return JSON.parse(localStorage.getItem(OUT_OF_STOCK_KEY)) || [];
}

function getRemovedProductIds() {
  return JSON.parse(localStorage.getItem(REMOVED_PRODUCTS_KEY)) || [];
}

function getVisibleProducts() {
  const baseProducts =
    typeof products !== "undefined" ? products : window.products || [];
  const hiddenIds = new Set(getOutOfStockIds().map(String));
  const removedIds = new Set(getRemovedProductIds().map(String));
  const replacedLegacyIds = new Set(
    remoteProducts.map((product) => String(product.legacyId || "")).filter(Boolean)
  );
  const visibleBaseProducts = baseProducts.filter(
    (product) =>
      !replacedLegacyIds.has(String(product.id)) &&
      !removedIds.has(String(product.id))
  );

  return [
    ...visibleBaseProducts,
    ...remoteProducts.filter((product) => product.isActive !== false),
    ...getStoredProducts(),
  ].filter(
    (product) =>
      !hiddenIds.has(String(product.id)) &&
      !removedIds.has(String(product.id))
  );
}

function normalizeProduct(product, source = "database") {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    mood: product.mood,
    price: Number(product.price || 0),
    image: product.image_url || product.image,
    description: product.description,
    funFact: product.fun_fact || product.funFact,
    legacyId: product.legacy_id || product.legacyId,
    source,
  };
}

async function loadRemoteProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("PRODUCT LOAD ERROR:", error);
    remoteProducts = [];
    return;
  }

  remoteProducts = (data || []).map((product) => normalizeProduct(product));
}

function getProductFunFact(product) {
  if (product.funFact) return product.funFact;

  const facts = {
    skincare: "A calm routine works best when products are used consistently, not aggressively.",
    "hair-accessories": "Gentle accessories can help reduce pulling and everyday hair breakage.",
    "fashion-accessories": "One soft statement piece can refresh a simple outfit instantly.",
    "beauty-tools": "Clean beauty tools help your routine feel fresher and more skin-friendly.",
    lifestyle: "Small room details can make your self-care corner feel more intentional.",
    jewelry: "Delicate jewelry keeps its shine longer when stored away from moisture.",
  };

  return facts[product.category] || "Little self-care details can make everyday routines feel special.";
}

function syncInputs() {
  if (searchInput) searchInput.value = filterState.search;
  if (categoryFilter) categoryFilter.value = filterState.category;
  if (moodFilter) moodFilter.value = filterState.mood;
  if (sortFilter) sortFilter.value = filterState.sort;
  if (mobileCategoryFilter) mobileCategoryFilter.value = filterState.category;
  if (mobileMoodFilter) mobileMoodFilter.value = filterState.mood;
  if (mobileSortFilter) mobileSortFilter.value = filterState.sort;
}

function sortProducts(items) {
  const sorted = [...items];

  if (filterState.sort === "low-high") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (filterState.sort === "high-low") {
    sorted.sort((a, b) => b.price - a.price);
  } else if (filterState.sort === "a-z") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  return sorted;
}

function displayProducts(items) {
  if (!productsGrid) return;

  productsGrid.innerHTML = "";

  if (resultsCount) {
    resultsCount.textContent = `${items.length} product${items.length === 1 ? "" : "s"}`;
  }

  if (!items.length) {
    productsGrid.innerHTML = `
      <div class="col-span-full rounded-[2rem] border border-[#ead9dd] bg-white/80 p-10 text-center shadow-sm">
        <h3 class="text-3xl mb-3 display-font" style="color:#5C4A4A;">
          No products found
        </h3>
        <p class="text-sm" style="color:#7A6A6A;">
          Try changing your filters.
        </p>
      </div>
    `;
    window.setupIvyAnimations?.(productsGrid);
    return;
  }

  items.forEach((product) => {
    const productId = escapeHtml(product.id);

    productsGrid.innerHTML += `
      <article data-product-id="${productId}"
        class="shop-card group cursor-pointer rounded-[1.5rem] p-3 md:p-4 border border-[#ead9dd] hover:-translate-y-1 hover:shadow-xl transition duration-300">

        <div class="aspect-square bg-[#faf6f7] rounded-[1.25rem] md:rounded-[1.5rem] mb-4 flex items-center justify-center p-3 overflow-hidden">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-contain rounded-xl group-hover:scale-105 transition duration-500"/>
        </div>

        <p class="text-[11px] uppercase tracking-[0.18em] mb-2 text-[#b98a92]">
          ${escapeHtml(product.category).replace(/-/g, " ")}
        </p>

        <h3 class="text-base md:text-lg mb-3 leading-snug" style="font-family:'Playfair Display'; color:#5C4A4A;">
          ${escapeHtml(product.name)}
        </h3>

        <div class="flex justify-between items-center gap-3">
          <span class="text-[#d89ca4] font-semibold">
            ₦${Number(product.price).toLocaleString()}
          </span>
          <span class="text-xs md:text-sm rounded-full px-3 py-1 border border-[#ead9dd] text-[#d89ca4] bg-white">
            View
          </span>
        </div>
      </article>
    `;
  });

  window.setupIvyAnimations?.(productsGrid);
}

function applyFilters() {
  syncInputs();

  let filtered = getVisibleProducts().filter((product) => {
    return (
      product.name.toLowerCase().includes(filterState.search.toLowerCase()) &&
      (filterState.category === "all" || product.category === filterState.category) &&
      (filterState.mood === "all" || product.mood === filterState.mood)
    );
  });

  filtered = sortProducts(filtered);
  displayProducts(filtered);
}

function resetFilters() {
  filterState.search = "";
  filterState.category = "all";
  filterState.mood = "all";
  filterState.sort = "default";
  applyFilters();
}

function openFilterDrawer() {
  mobileFilterOverlay?.classList.remove("hidden");
  mobileFilterDrawer?.classList.add("drawer-open");
}

function closeFilterDrawer() {
  mobileFilterDrawer?.classList.remove("drawer-open");
  mobileFilterOverlay?.classList.add("hidden");
}

function openProductDrawerById(id) {
  const product = getVisibleProducts().find((p) => String(p.id) === String(id));
  if (!product || !productDrawer || !productDrawerOverlay || !productDrawerContent) return;

  const productId = escapeHtml(product.id);

  productDrawerContent.innerHTML = `
    <div class="pt-10 space-y-5">
      <div class="w-full h-80 bg-[#faf6f7] rounded-[1.8rem] p-5 flex items-center justify-center border border-[#f1e4e7]">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="w-full h-full object-contain rounded-[1.2rem]" />
      </div>

      <p class="uppercase tracking-[0.22em] text-xs text-[#b98a92]">
        ${escapeHtml(product.category).replace(/-/g, " ")}
      </p>

      <h2 class="text-4xl leading-tight" style="font-family:'Playfair Display'; color:#5C4A4A;">
        ${escapeHtml(product.name)}
      </h2>

      <p class="text-[#d89ca4] text-2xl font-semibold">
        ₦${Number(product.price).toLocaleString()}
      </p>

      <p class="text-sm leading-7 text-[#7A6A6A]">
        ${escapeHtml(product.description || "A luxury skincare essential designed to elevate your glow and routine.")}
      </p>

      <div class="rounded-[1.4rem] border border-[#ead9dd] bg-[#fffafa] p-4">
        <p class="text-xs uppercase tracking-[0.18em] text-[#d89ca4] mb-2">
          Fun Fact
        </p>
        <p class="text-sm leading-6 text-[#7A6A6A]">
          ${escapeHtml(getProductFunFact(product))}
        </p>
      </div>

      <button
        data-add-to-cart="${productId}"
        class="w-full px-6 py-4 rounded-full bg-[#5C4A4A] hover:bg-[#d89ca4] transition text-white font-medium"
      >
        Add to Bag
      </button>
    </div>
  `;

  productDrawerOverlay.classList.remove("hidden");
  productDrawer.classList.add("drawer-open");
}

function addToCart(id) {
  const product = getVisibleProducts().find((p) => String(p.id) === String(id));
  if (!product) return;

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existing = cart.find((item) => String(item.id) === String(id));

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
  showCartToast(product.name);
}

function showCartToast(name) {
  let toast = document.getElementById("cartToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "cartToast";
    toast.className =
      "fixed bottom-6 right-6 z-[99999] px-5 py-3 rounded-full bg-[#d89ca4] text-white shadow-lg transition-all duration-300 opacity-0 translate-y-5";
    document.body.appendChild(toast);
  }

  toast.textContent = `${name} added to bag`;
  toast.classList.remove("hidden");
  toast.style.display = "block";

  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-5");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-5");
  }, 2000);

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
}

window.openProductDrawerById = openProductDrawerById;
window.addToCart = addToCart;

document.addEventListener("DOMContentLoaded", () => {
  productsGrid?.addEventListener("click", (e) => {
    const card = e.target.closest("[data-product-id]");
    if (!card) return;
    openProductDrawerById(card.dataset.productId);
  });

  productDrawerContent?.addEventListener("click", (e) => {
    const addButton = e.target.closest("[data-add-to-cart]");
    if (!addButton) return;
    addToCart(addButton.dataset.addToCart);
  });

  searchInput?.addEventListener("input", (e) => {
    filterState.search = e.target.value.trim();
    applyFilters();
  });

  categoryFilter?.addEventListener("change", (e) => {
    filterState.category = e.target.value;
    applyFilters();
  });

  moodFilter?.addEventListener("change", (e) => {
    filterState.mood = e.target.value;
    applyFilters();
  });

  sortFilter?.addEventListener("change", (e) => {
    filterState.sort = e.target.value;
    applyFilters();
  });

  clearAllBtn?.addEventListener("click", resetFilters);

  openMobileFilter?.addEventListener("click", openFilterDrawer);
  closeMobileFilter?.addEventListener("click", closeFilterDrawer);
  mobileFilterOverlay?.addEventListener("click", (e) => {
    if (e.target === mobileFilterOverlay) closeFilterDrawer();
  });

  applyMobileFilters?.addEventListener("click", () => {
    filterState.category = mobileCategoryFilter?.value || "all";
    filterState.mood = mobileMoodFilter?.value || "all";
    filterState.sort = mobileSortFilter?.value || "default";
    applyFilters();
    closeFilterDrawer();
  });

  closeProductDrawer?.addEventListener("click", () => {
    productDrawer?.classList.remove("drawer-open");
    productDrawerOverlay?.classList.add("hidden");
  });

  productDrawerOverlay?.addEventListener("click", () => {
    productDrawer?.classList.remove("drawer-open");
    productDrawerOverlay?.classList.add("hidden");
  });

  loadRemoteProducts().finally(applyFilters);
});
