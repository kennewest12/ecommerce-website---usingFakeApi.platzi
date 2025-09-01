// ======== DOM ELEMENTS ========
const featuredContainer = document.getElementById("product-list");
const categoryGrid = document.getElementById("category-grid");
const categoryProducts = document.getElementById("category-products");
const categoryTitle = document.getElementById("selected-category-title");
const detailContainer = document.getElementById("product-detail");

// ======== API BASE ========
const API_BASE = "https://api.escuelajs.co/api/v1";

// ======== PATH SETUP ========
const folderPath = window.location.pathname.includes("/pages/") ? ".." : ".";

// ======== SEARCH BAR TOGGLE ========
function setupExpandableSearch(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const input = container.querySelector(".search-input");
  const icon = container.querySelector(".search-icon");

  icon.addEventListener("click", () => {
    container.classList.toggle("active");
    if (container.classList.contains("active")) input.focus();
    else input.blur();
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove("active");
      input.value = "";
    }
  });
}
setupExpandableSearch("searchRight");

// ======== MOBILE MENU TOGGLE ========
const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () =>
    navMenu.classList.toggle("active")
  );
  document.addEventListener("click", (e) => {
    if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
      navMenu.classList.remove("active");
    }
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => navMenu.classList.remove("active"));
  });
}

// ==============================
// CART HANDLING
// ==============================
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cartCount = document.getElementById("cart-count");
  if (!cartCount) return;
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = totalItems;
}

async function addToCart(productId) {
  try {
    const res = await fetch(`${API_BASE}/products/${productId}`);
    const product = await res.json();

    let cart = getCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }

    saveCart(cart);
    alert(`${product.title} added to cart!`);
  } catch (err) {
    console.error("Failed to add to cart:", err);
  }
}
// ======== RENDER CART PAGE ========
function renderCart() {
  const cartContainer = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");
  if (!cartContainer) return; // only run on cart.html

  const cart = getCart();

  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center">Your cart is empty.</td>
      </tr>
    `;
    if (subtotalEl) subtotalEl.textContent = "0";
    if (totalEl) totalEl.textContent = "0";
    return;
  }

  let subtotal = 0;

  cartContainer.innerHTML = cart
    .map((item) => {
      const imgSrc =
        item.images && item.images.length > 0
          ? item.images[0]
          : "https://via.placeholder.com/150";
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      return `
          <tr>
            <td>
              <img src="${imgSrc}" 
                   alt="${item.title}" 
                   style="width:50px;height:50px;object-fit:contain;"/>
              ${item.title}
            </td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
              <button onclick="changeQty(${
                item.id
              }, -1)" class="qty-btn">-</button>
              ${item.qty}
              <button onclick="changeQty(${
                item.id
              }, 1)" class="qty-btn">+</button>
            </td>
            <td>$${itemTotal.toFixed(2)}</td>
            <td>
              <button onclick="removeFromCart(${
                item.id
              })" class="remove-btn">X</button>
            </td>
          </tr>
        `;
    })
    .join("");

  if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
  if (totalEl) totalEl.textContent = subtotal.toFixed(2);
}
// ======== UPDATE QUANTITY ========
function changeQty(productId, delta) {
  let cart = getCart();
  const item = cart.find((p) => p.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((p) => p.id !== productId);
  }
  saveCart(cart);
  renderCart();
}
// ======== REMOVE ITEM ========
function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter((item) => item.id !== productId);
  saveCart(cart);
  renderCart();
}

// ==============================
// RENDER PRODUCT CARD (helper)
// ==============================
function renderProductCard(p) {
  const imgSrc =
    p.images && p.images.length > 0
      ? p.images[0]
      : "https://via.placeholder.com/150";
  return `
    <div class="product-card">
      <img src="${imgSrc}" alt="${p.title}" class="product-image"/>
      <h3 class="product-title">${p.title}</h3>
      <span class="product-category">${p.category?.name || ""}</span>
      <p class="product-price">$${p.price}</p>
      <a href="${folderPath}/pages/product.html?id=${
    p.id
  }" class="view-details">View Details</a>
    </div>
  `;
}

// ==============================
// FETCH FEATURED PRODUCTS
// ==============================
async function fetchProducts() {
  if (!featuredContainer) return;

  try {
    const res = await fetch(`${API_BASE}/products?offset=0&limit=8`);
    const products = await res.json();

    featuredContainer.innerHTML = products.map(renderProductCard).join("");
  } catch (err) {
    featuredContainer.innerHTML = `<p>Failed to load products.</p>`;
  }
}

// ==============================
// FETCH SINGLE PRODUCT
// ==============================
async function fetchProduct() {
  if (!detailContainer) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  if (!productId) {
    detailContainer.innerHTML = "<p>No product selected.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/products/${productId}`);
    const product = await res.json();

    const imgSrc =
      product.images && product.images.length > 0
        ? product.images[0]
        : "https://via.placeholder.com/300";

    detailContainer.innerHTML = `
  <div class="product-details">
    <div class="gallery">
      <img src="${imgSrc}" alt="${product.title}" class="product-image-large"/>
    </div>
    
    <div class="product-info">
      <h1>${product.title}</h1>
      <p class="category">Category: ${product.category?.name || ""}</p>
      <p class="price">$${product.price}</p>
      <p class="description">${product.description}</p>
      
      <button onclick="addToCart(${product.id})" class="add-to-cart">
        Add to Cart
      </button>
      
      <a href="${folderPath}/pages/cart.html" class="view-cart">
        View Cart
      </a>
    </div>
  </div>
`;
  } catch (err) {
    detailContainer.innerHTML = `<p>Failed to load product.</p>`;
  }
}

// ==============================
// FETCH CATEGORIES WITH IMAGES
// ==============================
async function fetchCategories() {
  if (!categoryGrid) return;

  try {
    const res = await fetch(`${API_BASE}/categories`);
    const categories = await res.json();

    categoryGrid.innerHTML = categories
      .map(
        (cat) => `
        <button class="category-btn" onclick="fetchCategoryProducts(${cat.id}, '${cat.name}')">
          <img src="${cat.image}" alt="${cat.name}" class="category-image"/>
          <span>${cat.name}</span>
        </button>
      `
      )
      .join("");
  } catch (err) {
    categoryGrid.innerHTML = `<p>Failed to load categories.</p>`;
  }
}

// ==============================
// FETCH PRODUCTS BY CATEGORY
// ==============================
async function fetchCategoryProducts(categoryId, categoryName) {
  if (!categoryProducts || !categoryTitle) return;

  try {
    const res = await fetch(`${API_BASE}/categories/${categoryId}/products`);
    const products = await res.json();

    categoryTitle.textContent = `Products in "${categoryName}"`;
    categoryTitle.style.display = "block";

    categoryProducts.innerHTML = products.map(renderProductCard).join("");
  } catch (err) {
    categoryProducts.innerHTML = `<p>Failed to load products.</p>`;
  }
}

// ==============================
// SEARCH FUNCTIONALITY
// ==============================
function setupSearch() {
  const input = document.querySelector(".search-input");
  if (!input) return;

  input.addEventListener("input", async (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length < 2) return;

    try {
      const res = await fetch(`${API_BASE}/products`);
      const products = await res.json();
      const filtered = products.filter((p) =>
        p.title.toLowerCase().includes(query)
      );
      if (featuredContainer) {
        featuredContainer.innerHTML = filtered.map(renderProductCard).join("");
      }
    } catch (err) {
      console.error("Search failed", err);
    }
  });
}
setupSearch();

// ==============================
// INITIALIZE
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  if (featuredContainer) fetchProducts();
  if (categoryGrid) fetchCategories();
  if (detailContainer) fetchProduct();
  renderCart();
});
