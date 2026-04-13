import {
  collectionRef,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase.js";
import { STORE_CONFIG } from "config.js";

const PRODUCT_COLLECTION = "productos";
const CATEGORY_COLLECTION = "categorias";
const CART_KEY = "tiendac-cart";

const state = {
  products: [],
  categories: [],
  filters: { search: "", category: "all", price: 1000 },
  cart: readCart(),
  heroIndex: 0,
};

const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: STORE_CONFIG.currency,
});

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) ?? [];
  } catch {
    return [];
  }
}

function writeCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function cssVarName(key) {
  return `--color-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;
}

function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty("--font-primary", STORE_CONFIG.theme.fontPrimary);
  root.style.setProperty("--font-secondary", STORE_CONFIG.theme.fontSecondary);
  Object.entries(STORE_CONFIG.theme.colors).forEach(([key, value]) => root.style.setProperty(cssVarName(key), value));
}

function cartCount() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartBadges() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = cartCount();
  });
}

function buildHeader() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  header.innerHTML = `
    <div class="nav-shell">
      <a href="index.html" class="brand">
        <img src="${STORE_CONFIG.branding.logoUrl}" alt="${STORE_CONFIG.storeName}" class="brand__logo" />
        <div>
          <span class="brand__eyebrow">Store</span>
          <strong>${STORE_CONFIG.storeName}</strong>
        </div>
      </a>
      <button class="nav-toggle" aria-label="Abrir menú" data-nav-toggle>
        <span></span><span></span><span></span>
      </button>
      <nav class="nav-links" data-nav-menu>
        ${STORE_CONFIG.navigation.map((item) => `<a href="${item.href}">${item.label}</a>`).join("")}
        <button class="cart-button" data-open-cart>Carrito <span data-cart-count>${cartCount()}</span></button>
      </nav>
    </div>
  `;
}

function buildFooter() {
  const footer = document.querySelector("[data-footer]");
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-grid">
      <div>
        <div class="brand">
          <img src="${STORE_CONFIG.branding.logoUrl}" alt="${STORE_CONFIG.storeName}" class="brand__logo" />
          <div>
            <span class="brand__eyebrow">Store</span>
            <strong>${STORE_CONFIG.storeName}</strong>
          </div>
        </div>
        <p>${STORE_CONFIG.description}</p>
      </div>
      <div>
        <h4>Contacto</h4>
        <p>WhatsApp: <a href="https://wa.me/${STORE_CONFIG.whatsappNumber}" target="_blank" rel="noreferrer">+${STORE_CONFIG.whatsappNumber}</a></p>
        <p>Ubicación: ${STORE_CONFIG.location}</p>
      </div>
      <div>
        <h4>Redes</h4>
        <div class="social-links">
          <a href="${STORE_CONFIG.socialLinks.instagram}" target="_blank" rel="noreferrer">Instagram</a>
          <a href="${STORE_CONFIG.socialLinks.tiktok}" target="_blank" rel="noreferrer">TikTok</a>
          <a href="${STORE_CONFIG.socialLinks.facebook}" target="_blank" rel="noreferrer">Facebook</a>
        </div>
      </div>
    </div>
  `;
}

function buildHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;

  hero.innerHTML = `
    <div class="hero-slider">
      ${STORE_CONFIG.branding.heroSlides
        .map(
          (slide, index) => `
            <article class="hero-slide ${index === 0 ? "is-active" : ""}" style="background-image:url('${slide.image}')">
              <div class="hero-overlay"></div>
              <div class="hero-copy">
                <span class="section-kicker">Drop ${String(index + 1).padStart(2, "0")}</span>
                <h1>${slide.title}</h1>
                <p>${slide.subtitle}</p>
                <a href="#catalogo" class="btn btn-primary">Ver catálogo</a>
              </div>
            </article>
          `
        )
        .join("")}
      <div class="hero-dots">
        ${STORE_CONFIG.branding.heroSlides
          .map((_, index) => `<button class="${index === 0 ? "is-active" : ""}" data-hero-dot="${index}" aria-label="Slide ${index + 1}"></button>`)
          .join("")}
      </div>
    </div>
  `;

  const slides = [...hero.querySelectorAll(".hero-slide")];
  const dots = [...hero.querySelectorAll("[data-hero-dot]")];

  const activate = (index) => {
    state.heroIndex = index;
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  };

  hero.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-hero-dot]");
    if (dot) activate(Number(dot.dataset.heroDot));
  });

  setInterval(() => activate((state.heroIndex + 1) % slides.length), 5000);
}

async function loadData() {
  const [productSnapshot, categorySnapshot] = await Promise.all([
    getDocs(query(collectionRef(PRODUCT_COLLECTION), orderBy("creadoEn", "desc"))),
    getDocs(query(collectionRef(CATEGORY_COLLECTION), orderBy("creadoEn", "desc"))),
  ]);

  state.products = productSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  state.categories = categorySnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

function finalPrice(product) {
  const discount = Number(product.precioConDescuento || 0);
  return discount > 0 && discount < Number(product.precio || 0) ? discount : Number(product.precio || 0);
}

function hasCategory(product, category) {
  const wanted = normalizeText(category);
  return (product.categorias || []).some((item) => normalizeText(item) === wanted);
}

function productCard(product) {
  const image1 = product.imagenes?.[0] || STORE_CONFIG.branding.heroSlides[0].image;
  const image2 = product.imagenes?.[1] || image1;
  const hasDiscount = Number(product.precioConDescuento || 0) > 0 && Number(product.precioConDescuento) < Number(product.precio || 0);
  const discount = hasDiscount ? Math.round(((product.precio - product.precioConDescuento) / product.precio) * 100) : 0;

  return `
    <article class="product-card">
      <a href="producto.html?id=${product.id}" class="product-media">
        <img src="${image1}" alt="${product.nombre}" class="primary" />
        <img src="${image2}" alt="${product.nombre}" class="secondary" />
        ${hasDiscount ? `<span class="badge">-${discount}%</span>` : ""}
      </a>
      <div class="product-card__body">
        <div class="product-card__meta">
          <span>${product.codigo || ""}</span>
          <strong>${product.nombre || "Producto"}</strong>
        </div>
        <div class="price-row">
          <strong>${money.format(finalPrice(product))}</strong>
          ${hasDiscount ? `<span>${money.format(Number(product.precio || 0))}</span>` : ""}
        </div>
        <div class="swatch-row">${(product.colores || []).map((color) => `<span class="color-dot" style="background:${color}" title="${color}"></span>`).join("")}</div>
        <div class="size-row">${(product.tallas || []).map((size) => `<span>${size}</span>`).join("")}</div>
        <div class="product-card__actions">
          <a href="producto.html?id=${product.id}" class="btn btn-secondary">Ver producto</a>
          <button class="btn btn-primary" data-add-cart="${product.id}">Agregar al carrito</button>
        </div>
      </div>
    </article>
  `;
}

function renderCollections() {
  const node = document.querySelector("[data-collections]");
  if (!node) return;

  node.innerHTML =
    state.categories
      .map(
        (category) => `
          <button class="collection-card" data-category-filter="${category.nombre}">
            <div class="collection-card__image" style="background-image:url('${category.imagen || STORE_CONFIG.branding.heroSlides[0].image}')"></div>
            <div class="collection-card__content">
              <span>Colección</span>
              <strong>${category.nombre}</strong>
            </div>
          </button>
        `
      )
      .join("") || `<p class="empty-state">Aún no hay categorías en Firebase.</p>`;
}

function renderNewCollection() {
  const node = document.querySelector("[data-new-collection]");
  if (!node) return;
  const freshProducts = state.products.filter((product) => hasCategory(product, "nueva coleccion")).slice(0, 3);

  node.innerHTML =
    freshProducts
      .map(
        (product, index) => `
          <article class="new-collection-card ${index === 0 ? "is-featured" : ""}">
            <div class="new-collection-card__image" style="background-image:url('${product.imagenes?.[0] || STORE_CONFIG.branding.heroSlides[0].image}')"></div>
            <div class="new-collection-card__content">
              <span class="section-kicker">Nueva colección</span>
              <h3>${product.nombre}</h3>
              <p>${(product.descripcion || "Piezas nuevas con estética streetwear y presencia visual.").slice(0, 110)}</p>
              <div class="new-collection-card__actions">
                <span>${money.format(finalPrice(product))}</span>
                <a href="producto.html?id=${product.id}" class="btn btn-primary">Ver drop</a>
              </div>
            </div>
          </article>
        `
      )
      .join("") || `<p class="empty-state">No hay productos con la categoría Nueva colección.</p>`;
}

function renderSale() {
  const node = document.querySelector("[data-sale-products]");
  if (!node) return;
  const saleProducts = state.products.filter((product) => hasCategory(product, "sale"));
  node.innerHTML = saleProducts.map(productCard).join("") || `<p class="empty-state">No hay productos en sale todavía.</p>`;
}

function renderCategoryFilter() {
  const select = document.querySelector("[data-filter-category]");
  if (!select) return;
  select.innerHTML = `<option value="all">Todas las categorías</option>${state.categories
    .map((category) => `<option value="${category.nombre}">${category.nombre}</option>`)
    .join("")}`;
}

function filteredProducts() {
  return state.products.filter((product) => {
    const haystack = `${product.nombre || ""} ${product.codigo || ""}`.toLowerCase();
    const categoryMatch = state.filters.category === "all" || hasCategory(product, state.filters.category);
    const searchMatch = haystack.includes(state.filters.search.toLowerCase());
    const priceMatch = finalPrice(product) <= Number(state.filters.price || 1000);
    return categoryMatch && searchMatch && priceMatch;
  });
}

function renderCatalog() {
  const grid = document.querySelector("[data-product-grid]");
  if (!grid) return;
  const products = filteredProducts();
  grid.innerHTML = products.map(productCard).join("") || `<p class="empty-state">No encontramos productos con esos filtros.</p>`;
  const count = document.querySelector("[data-results-count]");
  if (count) count.textContent = `${products.length} productos`;
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  const existing = state.cart.find((item) => item.id === productId);

  if (existing) existing.quantity += 1;
  else {
    state.cart.push({
      id: product.id,
      nombre: product.nombre,
      codigo: product.codigo,
      precio: finalPrice(product),
      imagen: product.imagenes?.[0] || "",
      quantity: 1,
    });
  }

  writeCart();
  updateCartBadges();
  renderCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.id !== productId);
  writeCart();
  updateCartBadges();
  renderCart();
}

function buildCartWhatsappLink() {
  const lines = state.cart.map((item) => `- ${item.nombre} (${item.codigo}) x${item.quantity} - ${money.format(item.precio * item.quantity)}`);
  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hola, quiero consultar por este carrito:\n${lines.join("\n")}`)}`;
}

function buildProductWhatsappLink(product) {
  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hola, quiero consultar por el producto ${product.nombre} (código: ${product.codigo})`)}`;
}

function renderCart() {
  const panel = document.querySelector("[data-cart-panel]");
  if (!panel) return;
  const total = state.cart.reduce((sum, item) => sum + item.precio * item.quantity, 0);

  panel.innerHTML = `
    <div class="cart-panel__header">
      <div><span class="section-kicker">Tu selección</span><h3>Carrito</h3></div>
      <button class="icon-button" data-close-cart aria-label="Cerrar carrito">×</button>
    </div>
    <div class="cart-items">
      ${
        state.cart.length
          ? state.cart.map((item) => `
              <article class="cart-item">
                <img src="${item.imagen}" alt="${item.nombre}" />
                <div>
                  <strong>${item.nombre}</strong>
                  <p>${item.codigo}</p>
                  <span>${item.quantity} x ${money.format(item.precio)}</span>
                </div>
                <button class="icon-button" data-remove-cart="${item.id}" aria-label="Eliminar">×</button>
              </article>
            `).join("")
          : `<p class="empty-state">Tu carrito está vacío.</p>`
      }
    </div>
    <div>
      <div class="cart-total"><span>Total</span><strong>${money.format(total)}</strong></div>
      <a class="btn btn-primary ${state.cart.length ? "" : "is-disabled"}" ${state.cart.length ? `href="${buildCartWhatsappLink()}" target="_blank" rel="noreferrer"` : ""}>Enviar por WhatsApp</a>
    </div>
  `;
}

async function renderProductDetail() {
  const node = document.querySelector("[data-product-detail]");
  if (!node) return;
  const productId = new URLSearchParams(window.location.search).get("id");

  if (!productId) {
    node.innerHTML = `<div class="product-detail-card"><p class="empty-state">No se indicó un producto válido.</p></div>`;
    return;
  }

  const snapshot = await getDoc(doc(collectionRef(PRODUCT_COLLECTION), productId));
  if (!snapshot.exists()) {
    node.innerHTML = `<div class="product-detail-card"><p class="empty-state">Producto no encontrado.</p></div>`;
    return;
  }

  const product = { id: snapshot.id, ...snapshot.data() };
  node.innerHTML = `
    <section class="product-detail-card">
      <div class="product-detail__media">
        <img src="${product.imagenes?.[0] || ""}" alt="${product.nombre}" data-main-product-image />
        <div class="thumb-grid">
          ${(product.imagenes || []).map((image, index) => `<button class="thumb ${index === 0 ? "is-active" : ""}" data-thumb="${index}"><img src="${image}" alt="${product.nombre}" /></button>`).join("")}
        </div>
      </div>
      <div class="product-detail__content">
        <span class="section-kicker">${product.codigo || ""}</span>
        <h1>${product.nombre}</h1>
        <div class="price-row">
          <strong>${money.format(finalPrice(product))}</strong>
          ${Number(product.precioConDescuento || 0) > 0 && Number(product.precioConDescuento || 0) < Number(product.precio || 0) ? `<span>${money.format(Number(product.precio || 0))}</span>` : ""}
        </div>
        <p>${product.descripcion || "Sin descripción disponible."}</p>
        <div class="detail-actions">
          <button class="btn btn-primary" data-add-cart="${product.id}">Agregar al carrito</button>
          <a class="btn btn-whatsapp" href="${buildProductWhatsappLink(product)}" target="_blank" rel="noreferrer">Consultar por WhatsApp</a>
        </div>
        <div class="detail-block">
          <h4>Categorías</h4>
          <div class="chip-row">${(product.categorias || []).map((value) => `<span>${value}</span>`).join("")}</div>
        </div>
        <div class="detail-block">
          <h4>Colores</h4>
          <div class="swatch-row">${(product.colores || []).map((value) => `<span class="color-dot color-dot--large" style="background:${value}" title="${value}"></span>`).join("")}</div>
        </div>
        <div class="detail-block">
          <h4>Tallas</h4>
          <div class="size-row">${(product.tallas || []).map((value) => `<span>${value}</span>`).join("")}</div>
        </div>
      </div>
    </section>
  `;

  node.addEventListener("click", (event) => {
    const thumb = event.target.closest("[data-thumb]");
    if (!thumb) return;
    const image = product.imagenes?.[Number(thumb.dataset.thumb)];
    const main = node.querySelector("[data-main-product-image]");
    if (main && image) main.src = image;
    node.querySelectorAll(".thumb").forEach((button) => button.classList.toggle("is-active", button === thumb));
  });
}

function bindEvents() {
  document.body.addEventListener("click", (event) => {
    const addBtn = event.target.closest("[data-add-cart]");
    const removeBtn = event.target.closest("[data-remove-cart]");
    const categoryBtn = event.target.closest("[data-category-filter]");

    if (addBtn) addToCart(addBtn.dataset.addCart);
    if (removeBtn) removeFromCart(removeBtn.dataset.removeCart);
    if (event.target.closest("[data-close-cart]") || event.target.matches("[data-cart-overlay]")) document.body.classList.remove("cart-open");

    if (categoryBtn) {
      state.filters.category = categoryBtn.dataset.categoryFilter;
      const select = document.querySelector("[data-filter-category]");
      if (select) select.value = state.filters.category;
      renderCatalog();
      document.querySelector("#catalogo")?.scrollIntoView({ behavior: "smooth" });
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-filter-search]")) {
      state.filters.search = event.target.value;
      renderCatalog();
    }
    if (event.target.matches("[data-filter-category]")) {
      state.filters.category = event.target.value;
      renderCatalog();
    }
    if (event.target.matches("[data-filter-price]")) {
      state.filters.price = Number(event.target.value || 1000);
      const label = document.querySelector("[data-price-output]");
      if (label) label.textContent = `Hasta ${money.format(state.filters.price)}`;
      renderCatalog();
    }
  });
}

async function init() {
  applyTheme();
  buildHeader();
  buildFooter();
  buildHero();
  bindEvents();
  renderCart();
  updateCartBadges();

  try {
    await loadData();
    renderCollections();
    renderNewCollection();
    renderSale();
    renderCategoryFilter();
    renderCatalog();
    await renderProductDetail();
  } catch (error) {
    console.error(error);
    document.querySelectorAll("[data-sale-products], [data-product-grid], [data-collections], [data-new-collection], [data-product-detail]").forEach((node) => {
      node.innerHTML = `<p class="empty-state">No se pudo conectar con Firebase. Revisa tu configuración en config.js.</p>`;
    });
  }
}

init();
