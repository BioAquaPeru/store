(function () {
  const header = document.querySelector("[data-header]");

  function syncScrollState() {
    if (!header) return;
    const stickyPages = ["product", "catalog"];
    const page = document.body.dataset.page || "";
    header.classList.toggle("is-scrolled", window.scrollY > 28 || stickyPages.includes(page));
  }

  document.addEventListener("click", function (event) {
    if (event.target.closest("[data-nav-toggle]") && header) {
      header.classList.toggle("menu-open");
    }

    if (event.target.closest("[data-open-cart]")) {
      document.body.classList.add("cart-open");
      if (header) header.classList.remove("menu-open");
    }

    if (event.target.closest("[data-close-cart]") || event.target.matches("[data-cart-overlay]")) {
      document.body.classList.remove("cart-open");
    }

    if (event.target.closest("[data-nav-menu] a")) {
      if (header) header.classList.remove("menu-open");
    }
  });

  window.addEventListener("scroll", syncScrollState);
  window.addEventListener("resize", syncScrollState);
  syncScrollState();
})();
