/* main.js - carga header/footer + filtro + paginador + dropdown robusto */
document.addEventListener("DOMContentLoaded", () => {
  // ---------------- detect basePath ----------------
  const path = window.location.pathname;
  let basePath = "./";

  // normalizar a minúsculas para matching
  const p = path.toLowerCase();

  if (p.includes("/productos/")) {
    // subcategorías dentro de /productos/<categoria>/
    if (p.match(/\/productos\/(bicicletas|accesorios|repuestos)\//)) {
      basePath = "../../";
    } else {
      // página productos en /productos/productos.html
      basePath = "../";
    }
  } else if (p.includes("/producto-detalle")) {
    // si estás en /productos/producto-detalle.html (según tu estructura)
    basePath = "./";
  } else {
    basePath = "./";
  }

  // ---------------- CARGAR HEADER ----------------
  fetch(`${basePath}components/header.html`)
    .then(r => r.text())
    .then(html => {
      document.getElementById("header").innerHTML = html;

      // ajustar rutas y menús
      const prefix = basePath;
      const logo = document.getElementById("logo-img");
      const logoLink = document.getElementById("link-logo");
      const menu = document.getElementById("menu-links");

      if (logo) logo.src = `${prefix}img/logonairo.jpg`;
      if (logoLink) logoLink.href = `${prefix}index.html`;

      if (menu) {
        menu.innerHTML = `
          <li class="nav-item"><a class="nav-link" href="${prefix}index.html">Inicio</a></li>
          <li class="nav-item dropdown" id="menuProductos">
            <a class="nav-link dropdown-toggle" href="${prefix}productos/productos.html" id="productosDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">Productos</a>
            <ul class="dropdown-menu" aria-labelledby="productosDropdown">
              <li><h6 class="dropdown-header">Bicicletas</h6></li>
              <li><a class="dropdown-item" href="${prefix}productos/bicicletas/productos-ruta.html">Ruta</a></li>
              <li><a class="dropdown-item" href="${prefix}productos/bicicletas/productos-mtb.html">MTB</a></li>
              <li><a class="dropdown-item" href="${prefix}productos/bicicletas/productos-todoterreno.html">Infantiles</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><h6 class="dropdown-header">Accesorios</h6></li>
              <li><a class="dropdown-item" href="${prefix}productos/accesorios/productos-cascos.html">Cascos</a></li>
              <li><a class="dropdown-item" href="${prefix}productos/accesorios/productos-guantes.html">Guantes</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><h6 class="dropdown-header">Repuestos</h6></li>
              <li><a class="dropdown-item" href="${prefix}productos/repuestos/productos-llantas.html">Llantas</a></li>
              <li><a class="dropdown-item" href="${prefix}productos/repuestos/productos-tenedores.html">Suspenciones</a></li>
            </ul>
          </li>
          <li class="nav-item"><a class="nav-link" href="${prefix}acerca.html">Acerca de</a></li>
          <li class="nav-item"><a class="nav-link" href="${prefix}contacto.html">Contacto</a></li>
        `;
      }

      // initialize bootstrap dropdowns
      document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(el => {
        try { new bootstrap.Dropdown(el); } catch(e){/* ignore */ }
      });

      // hover en escritorio para productos
      const menuProductos = document.getElementById("menuProductos");
      const productosDropdown = document.getElementById("productosDropdown");
      const dropdownMenu = menuProductos?.querySelector(".dropdown-menu");

      if (window.innerWidth > 992 && menuProductos && dropdownMenu) {
        // usar mouseenter/leave para mostrar/ocultar, sin crear conflictos
        menuProductos.addEventListener("mouseenter", () => {
          dropdownMenu.classList.add("show");
          productosDropdown.setAttribute("aria-expanded", "true");
        });
        menuProductos.addEventListener("mouseleave", () => {
          dropdownMenu.classList.remove("show");
          productosDropdown.setAttribute("aria-expanded", "false");
        });
      }

      // doble-clic en desktop para navegar a la página productos
      if (productosDropdown) {
        let lastClick = 0;
        productosDropdown.addEventListener("click", (e) => {
          const now = Date.now();
          const isDesktop = window.innerWidth > 992;
          if (isDesktop) {
            // si doble click -> navegar
            if (now - lastClick < 400) {
              e.preventDefault();
              window.location.href = `${prefix}productos/productos.html`;
            } else {
              // primer click -> mostrar dropdown (si existe)
              // dejar que hover se encargue; previene navegación inmediata
              e.preventDefault();
              // toggle show
              const isShown = dropdownMenu.classList.contains("show");
              if (!isShown) {
                dropdownMenu.classList.add("show");
                productosDropdown.setAttribute("aria-expanded", "true");
              } else {
                dropdownMenu.classList.remove("show");
                productosDropdown.setAttribute("aria-expanded", "false");
              }
            }
            lastClick = now;
          }
          // en mobile no interceptamos (bootstrap maneja el colapso)
        });
      }
    })
    .catch(err => console.error("Error cargando header:", err));

  // ---------------- CARGAR FOOTER ----------------
  fetch(`${basePath}components/footer.html`)
    .then(r => r.text())
    .then(html => {
      const cont = document.getElementById("footer");
      cont.innerHTML = html;

      // ajustar rutas relativas internas del footer
      cont.querySelectorAll("a[href]").forEach(link => {
        const href = link.getAttribute("href");
        if (href && !href.startsWith("http") && !href.startsWith("#")) {
          link.href = basePath + href.replace(/^\.\//, "");
        }
      });

      // logo del footer (si existe)
      const footerLogo = cont.querySelector("img");
      if (footerLogo) footerLogo.src = basePath + "img/logonairo.jpg";
    })
    .catch(err => console.error("Error cargando footer:", err));

  // ---------------- INYECTAR FILTRO + PAGINADOR EN PRODUCTOS ----------------
  if (p.includes("/productos/")) {
    // Dejamos margen para que header ya esté inyectado
    setTimeout(() => {
      injectFilter();
      setupPaginationAndCounter();
      // si estamos en subcategoria (ej: /productos/bicicletas/productos-mtb.html) seleccionar categoría
      const subcatMatch = p.match(/\/productos\/(bicicletas|accesorios|repuestos)\/productos-([a-z0-9-]+)\.html$/);
      if (subcatMatch) {
        const categoria = subcatMatch[1];
        const sel = document.getElementById("categoria");
        if (sel) { sel.value = categoria; }
        // ejecutar filtrado
        document.getElementById("filterForm")?.dispatchEvent(new Event("submit"));
      }
    }, 200);
  }

  // ---------------- util: inyecta filtro si existe contenedor ----------------
  function injectFilter() {
    const container = document.getElementById("filtro-container") || document.getElementById("filtro-aside");
    if (!container) return;

    container.innerHTML = `
      <div class="card shadow-sm border-0 filtros-card">
        <div class="card-body">
          <h5 class="fw-bold mb-3 text-primary"><i class="fa fa-filter me-2"></i>Filtrar Productos</h5>
          <form id="filterForm" class="row g-3">
            <div class="col-12">
              <label class="form-label fw-semibold">Categoría</label>
              <select class="form-select" id="categoria">
                <option value="">Todas</option>
                <option value="bicicletas">Bicicletas</option>
                <option value="accesorios">Accesorios</option>
                <option value="repuestos">Repuestos</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">Marca</label>
              <select class="form-select" id="marca">
                <option value="">Todas</option>
                <option value="nairo">Nairo</option>
                <option value="trek">Trek</option>
                <option value="gw">Gw</option>
                <option value="specialized">Specialized</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">Precio</label>
              <select class="form-select" id="precio">
                <option value="">Todos</option>
                <option value="1">$50.000 - $200.000</option>
                <option value="2">$200.000 - $500.000</option>
                <option value="3">$500.000 - $1.000.000</option>
                <option value="4">Más de $1.000.000</option>
              </select>
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">Género</label>
              <select class="form-select" id="genero">
                <option value="">Todos</option>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <div class="col-12 text-end">
              <button type="submit" class="btn btn-warning fw-bold text-dark"><i class="fa fa-search me-1"></i> Filtrar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // hookup del filtrado
    const form = document.getElementById("filterForm");
    form?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      applyFilterAndResetPagination();
    });
  }

  // ---------------- paginador y contador ----------------
  function setupPaginationAndCounter() {
    const cantidadSelect = document.getElementById("cantidadProductos");
    const productosContainer = document.getElementById("productosContainer");
    if (!productosContainer) return;

    // convertir NodeList a array
    const allProducts = Array.from(productosContainer.querySelectorAll(".producto-item"));

    // crear contadores visuales (si no existen)
    const topCounter = document.getElementById("contadorProductos");
    const bottomCounter = document.getElementById("contadorInferior");

    // estado
    let pageSize = cantidadSelect ? cantidadSelect.value : "4";
    if (pageSize !== "todos") pageSize = parseInt(pageSize, 10);

    let currentPage = 1;

    // helper: mostrar página
    function showPage(page) {
      const visibleProducts = allProducts.filter(p => p.style.display !== "none" && p.getAttribute("data-hidden-by-filter") !== "true");
      const total = visibleProducts.length;

      if (pageSize === "todos") {
        // mostrar todos dentro de los visibles por filtro
        visibleProducts.forEach(p => p.style.display = "block");
        updateCounters(visibleProducts.length, total);
        return;
      }

      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      currentPage = page;

      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      visibleProducts.forEach((p, i) => {
        p.style.display = (i >= start && i < end) ? "block" : "none";
      });

      updateCounters(Math.min(end, total), total, page, totalPages);
      renderPagerControls(page, totalPages);
    }

    // update counter text
    function updateCounters(shownCount, total, page = 1, totalPages = 1) {
      const topText = `Mostrando ${shownCount} de ${total} productos`;
      if (topCounter) topCounter.textContent = topText;
      if (bottomCounter) bottomCounter.textContent = topText;
    }

    // render simple pager (prev/next right-aligned)
    function renderPagerControls(page, totalPages) {
      let pager = document.getElementById("productosPager");
      if (!pager) {
        pager = document.createElement("div");
        pager.id = "productosPager";
        pager.className = "d-flex gap-2 justify-content-end mt-3";
        // append to main area (if existe)
        const mainCol = document.querySelector("#productosContainer");
        if (mainCol && mainCol.parentElement) {
          mainCol.parentElement.appendChild(pager);
        }
      }
      pager.innerHTML = `
        <button class="btn btn-sm btn-outline-primary" id="prevPage" ${page <= 1 ? "disabled" : ""}>Anterior</button>
        <span class="align-self-center px-2">Página ${page} de ${totalPages}</span>
        <button class="btn btn-sm btn-outline-primary" id="nextPage" ${page >= totalPages ? "disabled" : ""}>Siguiente</button>
      `;
      pager.querySelector("#prevPage").addEventListener("click", () => showPage(page - 1));
      pager.querySelector("#nextPage").addEventListener("click", () => showPage(page + 1));
    }

    // aplicar filtro + reset paginación
    function applyFilterAndResetPagination() {
      const categoria = document.getElementById("categoria")?.value || "";
      const marca = document.getElementById("marca")?.value || "";
      const precio = document.getElementById("precio")?.value || "";
      const genero = document.getElementById("genero")?.value || "";

      allProducts.forEach(prod => {
        const matches =
          (!categoria || prod.dataset.categoria === categoria) &&
          (!marca || (prod.dataset.marca && prod.dataset.marca.toLowerCase() === marca.toLowerCase())) &&
          (!precio || (prod.dataset.precio && prod.dataset.precio === precio)) &&
          (!genero || (prod.dataset.genero && prod.dataset.genero.toLowerCase() === genero.toLowerCase()));

        // marcar producto como oculto por filtro o no
        if (matches) {
          prod.style.display = "block";
          prod.removeAttribute("data-hidden-by-filter");
        } else {
          // ocultamos pero dejamos atributo para diferenciar del paginado
          prod.style.display = "none";
          prod.setAttribute("data-hidden-by-filter", "true");
        }
      });

      // reset page
      currentPage = 1;
      // recomputar pageSize desde el select
      const sel = document.getElementById("cantidadProductos");
      pageSize = sel ? (sel.value === "todos" ? "todos" : parseInt(sel.value, 10)) : pageSize;
      showPage(currentPage);
    }

    // listener select cantidad
    if (cantidadSelect) {
      cantidadSelect.addEventListener("change", (e) => {
        pageSize = e.target.value === "todos" ? "todos" : parseInt(e.target.value, 10);
        currentPage = 1;
        showPage(currentPage);
      });
    }

    // init: quitar marcadores de 'hidden' (si quedaron)
    allProducts.forEach(p => p.removeAttribute("data-hidden-by-filter"));

    // primer render
    // si ya hubo un filtrado previo (ej. subcategoria), respetarlo: filtrar por select categoria si viene marcado
    const initialCategoria = document.getElementById("categoria")?.value;
    if (initialCategoria) {
      document.getElementById("filterForm")?.dispatchEvent(new Event("submit"));
    } else {
      showPage(1);
    }
  } // end setupPaginationAndCounter

}); // end DOMContentLoaded

// ================== CARRITO GLOBAL ==================
function agregarAlCarrito(producto) {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const existente = carrito.find(p => p.id === producto.id);

  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  mostrarModalCarrito(producto.nombre);
}

// Mostrar el modal Bootstrap con el nombre del producto
function mostrarModalCarrito(nombreProducto) {
  const modalProducto = document.getElementById("modalCarritoProducto");
  if (modalProducto) modalProducto.textContent = `${nombreProducto} fue agregado al carrito 🎉`;

  const modal = new bootstrap.Modal(document.getElementById("modalCarritoConfirmacion"));
  modal.show();
}

// Capturar todos los botones "Agregar al carrito"
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".agregar-carrito");
  if (btn) {
    const card = btn.closest(".producto-item");
    if (!card) return;

    const producto = {
      id: card.dataset.id,
      nombre: card.querySelector(".card-title")?.textContent.trim(),
      precio: parseInt(card.querySelector(".text-success")?.textContent.replace(/[$,.]/g, "")) || 0,
      imagen: card.querySelector("img")?.src || "",
    };

    agregarAlCarrito(producto);
  }
});
