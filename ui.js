(function () {
  const header = document.querySelector("[data-header]");
  const overlay = document.querySelector("[data-cart-overlay]");

  function syncScrollState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 28 || window.location.pathname.includes("producto.html"));
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-nav-toggle]") && header) {
      header.classList.toggle("menu-open");
    }

    if (event.target.closest("[data-open-cart]")) {
      document.body.classList.add("cart-open");
    }

    if (event.target.closest("[data-close-cart]") || event.target.matches("[data-cart-overlay]")) {
      document.body.classList.remove("cart-open");
    }
  });

  window.addEventListener("scroll", syncScrollState);
  syncScrollState();
})();
