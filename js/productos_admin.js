// ==================================
//   ADMINISTRAR PRODUCTOS (BACKEND)
// ==================================

function requireAdminProductos() {
  try {
    const rol = localStorage.getItem("rol");
    if (!rol || rol !== "admin") {
      alert("Solo el administrador puede administrar los productos.");
      window.location.href = "index.html";
    }
  } catch (e) {
    console.warn("No se pudo leer rol", e);
  }
}

async function obtenerMenu() {
  const res = await fetch(`${API_URL}/products`);
  return await res.json();
}

async function renderProductos() {
  const cont = document.getElementById("productos-lista");
  if (!cont) return;

  let menu = [];
  try {
    menu = await obtenerMenu();
  } catch (err) {
    console.error("Error cargando productos:", err);
  }

  cont.innerHTML = "";
  if (!menu.length) {
    cont.innerHTML =
      "<p style='grid-column:1/-1; text-align:center;'>Sin productos</p>";
    return;
  }

  menu.forEach((item) => {
    cont.innerHTML += `
      <div class="card">
        <h3>ID ${item.id}</h3>
        <input
          type="text"
          value="${item.name}"
          data-field="name"
          data-id="${item.id}"
          placeholder="Nombre">
        <input
          type="number"
          min="0"
          step="1"
          value="${item.price}"
          data-field="price"
          data-id="${item.id}"
          placeholder="Precio">
        <button onclick="guardarCambios(${item.id})">Guardar cambios</button>
        <button onclick="eliminarProducto(${item.id})">Eliminar</button>
      </div>
    `;
  });
}

async function guardarCambios(id) {
  const nombreInput = document.querySelector(
    'input[data-field="name"][data-id="' + id + '"]'
  );
  const precioInput = document.querySelector(
    'input[data-field="price"][data-id="' + id + '"]'
  );
  if (!nombreInput || !precioInput) return;

  const nombre = nombreInput.value.trim();
  const precio = parseFloat(precioInput.value);

  if (!nombre) {
    alert("El nombre no puede estar vacío");
    return;
  }
  if (isNaN(precio) || precio < 0) {
    alert("Precio inválido");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nombre, price: precio })
    });

    if (!res.ok) {
      alert("Error actualizando producto");
      return;
    }

    alert("Producto actualizado");
    await renderProductos();
  } catch (err) {
    console.error("Error guardando cambios:", err);
  }
}

async function eliminarProducto(id) {
  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      alert("Error eliminando producto");
      return;
    }

    alert("Producto eliminado");
    await renderProductos();
  } catch (err) {
    console.error("Error eliminando producto:", err);
  }
}

async function agregarProducto() {
  const nombreInput = document.getElementById("nuevo-nombre");
  const precioInput = document.getElementById("nuevo-precio");
  if (!nombreInput || !precioInput) return;

  const nombre = nombreInput.value.trim();
  const precio = parseFloat(precioInput.value);

  if (!nombre) {
    alert("Escribe un nombre para el producto");
    return;
  }
  if (isNaN(precio) || precio < 0) {
    alert("Escribe un precio válido");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nombre, price: precio })
    });

    if (!res.ok) {
      alert("Error agregando producto");
      return;
    }

    nombreInput.value = "";
    precioInput.value = "";
    alert("Producto agregado");
    await renderProductos();
  } catch (err) {
    console.error("Error agregando producto:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  requireAdminProductos();
  await renderProductos();
});
