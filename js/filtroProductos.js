export function inicializarFiltroProductos() {
  const filterForm = document.getElementById('filterForm');
  if (!filterForm) return;

  filterForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const categoria = document.getElementById('categoria').value.toLowerCase();
    const marca = document.getElementById('marca').value.toLowerCase();
    const precio = document.getElementById('precio').value;
    const genero = document.getElementById('genero').value.toLowerCase();

    document.querySelectorAll('.producto').forEach(prod => {
      const matchCategoria = !categoria || prod.dataset.categoria === categoria;
      const matchMarca = !marca || prod.dataset.marca === marca;
      const matchPrecio = !precio || prod.dataset.precio === precio;
      const matchGenero = !genero || prod.dataset.genero === genero;

      prod.style.display = (matchCategoria && matchMarca && matchPrecio && matchGenero)
        ? 'block' : 'none';
    });
  });
}
