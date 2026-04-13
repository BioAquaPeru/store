import {
  addDoc,
  auth,
  collectionRef,
  deleteDoc,
  doc,
  getDocs,
  onAuthStateChanged,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  signInWithEmailAndPassword,
  signOut,
} from "./firebase.js";
import { STORE_CONFIG } from "../config.js";

const refs = {
  loginForm: document.querySelector("[data-login-form]"),
  loginError: document.querySelector("[data-login-error]"),
  authPanel: document.querySelector("[data-auth-panel]"),
  dashboard: document.querySelector("[data-dashboard]"),
  productForm: document.querySelector("[data-product-form]"),
  categoryForm: document.querySelector("[data-category-form]"),
  productTable: document.querySelector("[data-product-table]"),
  categoryList: document.querySelector("[data-category-list]"),
  categoryChecklist: document.querySelector("[data-product-category-list]"),
  colorInput: document.querySelector("[data-color-input]"),
  colorList: document.querySelector("[data-color-list]"),
  colorsHidden: document.querySelector("[data-colors-hidden]"),
  logoutButton: document.querySelector("[data-logout]"),
};

const state = {
  products: [],
  categories: [],
  editingProductId: null,
  selectedColors: [],
};

function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty("--font-primary", STORE_CONFIG.theme.fontPrimary);
  root.style.setProperty("--font-secondary", STORE_CONFIG.theme.fontSecondary);
  Object.entries(STORE_CONFIG.theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`, value);
  });
}

function splitComma(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function getFirebaseErrorMessage(error) {
  const code = error?.code || "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") return "Credenciales incorrectas. Revisa el email y la contraseña en Firebase Authentication.";
  if (code === "auth/invalid-api-key") return "La apiKey de Firebase no es válida.";
  if (code === "auth/network-request-failed") return "No se pudo conectar con Firebase. Abre el proyecto desde http://localhost y revisa tu conexión.";
  if (code === "permission-denied" || code === "firestore/permission-denied") return "El login funcionó, pero Firestore no permite leer datos. Revisa las reglas de seguridad.";
  if (code === "auth/operation-not-allowed") return "Debes habilitar Email/Password en Firebase Authentication.";
  return code ? `Error de Firebase: ${code}` : "No se pudo iniciar sesión. Revisa la configuración de Firebase.";
}

function selectedCategories() {
  return [...document.querySelectorAll("[data-category-check]:checked")].map((item) => item.value);
}

function syncColorsHidden() {
  refs.colorsHidden.value = state.selectedColors.join(", ");
}

function renderColorList() {
  refs.colorList.innerHTML =
    state.selectedColors.map((color) => `
      <button type="button" class="color-chip" data-remove-color="${color}">
        <span class="color-chip__swatch" style="background:${color}"></span>
        <span>${color}</span>
      </button>
    `).join("") || `<p class="helper-text">Aún no elegiste colores.</p>`;
  syncColorsHidden();
}

function addColor(color) {
  const normalized = String(color || "").trim().toLowerCase();
  if (!normalized || state.selectedColors.includes(normalized)) return;
  state.selectedColors.push(normalized);
  renderColorList();
}

function removeColor(color) {
  state.selectedColors = state.selectedColors.filter((item) => item !== color);
  renderColorList();
}

function resetProductForm() {
  state.editingProductId = null;
  state.selectedColors = [];
  refs.productForm.reset();
  document.querySelectorAll("[data-category-check]").forEach((item) => {
    item.checked = false;
  });
  renderColorList();
  refs.productForm.querySelector("[data-product-submit]").textContent = "Guardar producto";
}

async function loadAdminData() {
  const [productSnapshot, categorySnapshot] = await Promise.all([
    getDocs(query(collectionRef("productos"), orderBy("creadoEn", "desc"))),
    getDocs(query(collectionRef("categorias"), orderBy("creadoEn", "desc"))),
  ]);

  state.products = productSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  state.categories = categorySnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  renderCategoryChecklist();
  renderProducts();
  renderCategories();
}

function renderCategoryChecklist() {
  refs.categoryChecklist.innerHTML =
    state.categories.map((category) => `
      <label class="category-option">
        <input type="checkbox" value="${category.nombre}" data-category-check />
        <span>${category.nombre}</span>
      </label>
    `).join("") || `<p class="helper-text">Primero crea categorías para poder asignarlas.</p>`;
}

function renderProducts() {
  refs.productTable.innerHTML =
    state.products.map((product) => `
      <tr>
        <td>${product.nombre}</td>
        <td>${product.codigo}</td>
        <td>S/ ${Number(product.precioConDescuento || product.precio || 0).toFixed(2)}</td>
        <td>${(product.categorias || []).join(", ")}</td>
        <td class="table-actions">
          <button class="btn btn-ghost" data-edit-product="${product.id}">Editar</button>
          <button class="btn btn-danger" data-delete-product="${product.id}">Eliminar</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="5" class="empty-cell">No hay productos todavía.</td></tr>`;
}

function renderCategories() {
  refs.categoryList.innerHTML =
    state.categories.map((category) => `
      <article class="admin-card admin-card--mini">
        <div>
          <strong>${category.nombre}</strong>
          <p>${category.imagen || "Sin imagen"}</p>
        </div>
        <button class="btn btn-danger" data-delete-category="${category.id}">Eliminar</button>
      </article>
    `).join("") || `<p class="empty-state">Aún no hay categorías.</p>`;
}

function fillProductForm(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;

  state.editingProductId = productId;
  refs.productForm.nombre.value = product.nombre || "";
  refs.productForm.codigo.value = product.codigo || "";
  refs.productForm.precio.value = product.precio || "";
  refs.productForm.precioConDescuento.value = product.precioConDescuento || "";
  refs.productForm.descripcion.value = product.descripcion || "";
  refs.productForm.tallas.value = (product.tallas || []).join(", ");
  refs.productForm.imagenes.value = (product.imagenes || []).join(", ");
  state.selectedColors = [...(product.colores || [])];
  renderColorList();

  document.querySelectorAll("[data-category-check]").forEach((option) => {
    option.checked = (product.categorias || []).includes(option.value);
  });

  refs.productForm.querySelector("[data-product-submit]").textContent = "Actualizar producto";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveProduct(event) {
  event.preventDefault();

  const form = new FormData(refs.productForm);
  const payload = {
    nombre: String(form.get("nombre") || "").trim(),
    codigo: String(form.get("codigo") || "").trim(),
    precio: Number(form.get("precio") || 0),
    precioConDescuento: Number(form.get("precioConDescuento") || 0),
    descripcion: String(form.get("descripcion") || "").trim(),
    categorias: selectedCategories(),
    colores: [...state.selectedColors],
    tallas: splitComma(String(form.get("tallas") || "")),
    imagenes: splitComma(String(form.get("imagenes") || "")),
  };

  if (!payload.categorias.length) {
    alert("Debes seleccionar al menos una categoría.");
    return;
  }

  if (!payload.colores.length) {
    alert("Debes seleccionar al menos un color.");
    return;
  }

  if (payload.imagenes.length < 2) {
    alert("Debes ingresar al menos 2 URLs de imágenes.");
    return;
  }

  if (state.products.some((item) => item.codigo === payload.codigo && item.id !== state.editingProductId)) {
    alert("El código del producto debe ser único.");
    return;
  }

  const current = state.products.find((item) => item.id === state.editingProductId);

  if (state.editingProductId) {
    await setDoc(doc(collectionRef("productos"), state.editingProductId), {
      ...payload,
      creadoEn: current?.creadoEn || serverTimestamp(),
    });
  } else {
    await addDoc(collectionRef("productos"), {
      ...payload,
      creadoEn: serverTimestamp(),
    });
  }

  resetProductForm();
  await loadAdminData();
}

async function saveCategory(event) {
  event.preventDefault();
  const form = new FormData(refs.categoryForm);
  await addDoc(collectionRef("categorias"), {
    nombre: String(form.get("nombre") || "").trim(),
    imagen: String(form.get("imagen") || "").trim(),
    creadoEn: serverTimestamp(),
  });
  refs.categoryForm.reset();
  await loadAdminData();
}

async function removeProduct(productId) {
  await deleteDoc(doc(collectionRef("productos"), productId));
  await loadAdminData();
}

async function removeCategory(categoryId) {
  await deleteDoc(doc(collectionRef("categorias"), categoryId));
  await loadAdminData();
}

function bindEvents() {
  refs.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(refs.loginForm);
    try {
      refs.loginError.textContent = "";
      await signInWithEmailAndPassword(auth, String(form.get("email") || ""), String(form.get("password") || ""));
      refs.loginForm.reset();
    } catch (error) {
      console.error(error);
      refs.loginError.textContent = getFirebaseErrorMessage(error);
    }
  });

  refs.logoutButton.addEventListener("click", () => signOut(auth));
  refs.productForm.addEventListener("submit", saveProduct);
  refs.categoryForm.addEventListener("submit", saveCategory);

  document.body.addEventListener("click", (event) => {
    const editBtn = event.target.closest("[data-edit-product]");
    const deleteProductBtn = event.target.closest("[data-delete-product]");
    const deleteCategoryBtn = event.target.closest("[data-delete-category]");
    const cancelBtn = event.target.closest("[data-product-cancel]");
    const addColorBtn = event.target.closest("[data-add-color]");
    const removeColorBtn = event.target.closest("[data-remove-color]");

    if (editBtn) fillProductForm(editBtn.dataset.editProduct);
    if (deleteProductBtn) removeProduct(deleteProductBtn.dataset.deleteProduct);
    if (deleteCategoryBtn) removeCategory(deleteCategoryBtn.dataset.deleteCategory);
    if (cancelBtn) resetProductForm();
    if (addColorBtn) addColor(refs.colorInput.value);
    if (removeColorBtn) removeColor(removeColorBtn.dataset.removeColor);
  });
}

function handleAuth() {
  onAuthStateChanged(auth, async (user) => {
    refs.authPanel.hidden = Boolean(user);
    refs.dashboard.hidden = !user;
    if (!user) return;

    try {
      refs.loginError.textContent = "";
      await loadAdminData();
      renderColorList();
    } catch (error) {
      console.error(error);
      refs.authPanel.hidden = false;
      refs.dashboard.hidden = true;
      refs.loginError.textContent = getFirebaseErrorMessage(error);
    }
  });
}

applyTheme();
bindEvents();
renderColorList();
handleAuth();
