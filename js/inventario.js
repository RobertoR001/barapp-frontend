// ================================
//   INVENTARIO – CONEXIÓN BACKEND
// ================================

const invContainer = document.getElementById("inventario-container");
const histContainer = document.getElementById("historial-container");

let inventario = [];

// Obtener ID de usuario actual (para registrar movimientos)
function getCurrentUserId() {
  try {
    const uid = parseInt(localStorage.getItem("userId") || "0", 10);
    return isNaN(uid) ? null : uid;
  } catch (e) {
    return null;
  }
}

// ================================
//    CARGAR INVENTARIO COMPLETO
// ================================

async function cargarInventario() {
  try {
    const res = await fetch(`${API_URL}/inventory`);
    inventario = await res.json();
    renderInventario();
  } catch (err) {
    console.error("Error cargando inventario:", err);
  }
}

// ================================
//         MOSTRAR INVENTARIO
// ================================

function renderInventario() {
  if (!invContainer) return;

  invContainer.innerHTML = "";

  if (!inventario.length) {
    invContainer.innerHTML =
      "<p style='text-align:center; grid-column:1/-1;'>Sin productos</p>";
    return;
  }

  inventario.forEach((p) => {
    const lowClass = p.stock <= 5 ? "low-stock" : "";
    const lowMsg = p.stock <= 5 ? "<p>⚠ Pocas existencias</p>" : "";

    invContainer.innerHTML += `
      <div class="card ${lowClass}">
        <h3>${p.name}</h3>
        <p>Stock: <strong>${p.stock}</strong></p>
        ${lowMsg}
        <button type="button" onclick="moverStock(${p.id}, 1)">+1</button>
        <button type="button" onclick="moverStock(${p.id}, -1)">-1</button>
        <button type="button" onclick="sinStock(${p.id})">Sin stock</button>
        <button type="button" onclick="eliminarProducto(${p.id})">Eliminar producto</button>
      </div>
    `;
  });
}

// ================================
//     ALTERAR STOCK ( + / - )
// ================================

async function moverStock(product_id, delta) {
  try {
    const user_id = getCurrentUserId();
    const res = await fetch(`${API_URL}/inventory/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id,
        delta,
        user_id: user_id || null
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Error moviendo stock");
      return;
    }

    await cargarInventario();
    await cargarHistorial();
  } catch (err) {
    console.error("Error moviendo stock:", err);
  }
}

// ================================
//         DEJAR STOCK EN 0
// ================================

async function sinStock(id) {
  const prod = inventario.find((p) => p.id === id);
  if (!prod || prod.stock <= 0) return;
  await moverStock(id, -prod.stock);
}

// ================================
//      AGREGAR NUEVO PRODUCTO
// ================================

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
    alert("Precio inválido");
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
    await cargarInventario();
  } catch (err) {
    console.error("Error agregando producto:", err);
  }
}

// ================================
//     HISTORIAL DE MOVIMIENTOS
// ================================

async function cargarHistorial() {
  if (!histContainer) return;
  try {
    const res = await fetch(`${API_URL}/inventory/movements`);
    const movs = await res.json();
    renderHistorial(movs);
  } catch (err) {
    console.error("Error cargando historial:", err);
  }
}

function renderHistorial(movimientos) {
  if (!histContainer) return;

  if (!movimientos.length) {
    histContainer.innerHTML =
      "<p class='historial-empty'>Sin movimientos registrados.</p>";
    return;
  }

  let html =
    "<table class='tabla-historial'><thead><tr>" +
    "<th>Fecha y hora</th>" +
    "<th>Producto</th>" +
    "<th>Cambio</th>" +
    "<th>Nuevo stock</th>" +
    "<th>Usuario</th>" +
    "</tr></thead><tbody>";

  movimientos.forEach((m) => {
    const cambio = m.delta > 0 ? "+" + m.delta : m.delta;
    html += `<tr>
      <td>${m.created_at}</td>
      <td>${m.product_name}</td>
      <td>${cambio}</td>
      <td>${m.new_stock}</td>
      <td>${m.user || "desconocido"}</td>
    </tr>`;
  });

  html += "</tbody></table>";
  histContainer.innerHTML = html;
}

// ================================
//    EXPORTAR HISTORIAL A EXCEL
// ================================

async function exportarHistorialAExcel() {
  try {
    const res = await fetch(`${API_URL}/inventory/movements`);
    const movs = await res.json();

    if (!movs.length) {
      alert("No hay movimientos para exportar.");
      return;
    }

    const headers = [
      "Fecha y hora",
      "Producto",
      "Cambio",
      "Nuevo stock",
      "Usuario"
    ];
    let csv = "\uFEFF" + headers.join(";") + "\n";

    movs.forEach((m) => {
      const row = [
        m.created_at,
        m.product_name,
        m.delta,
        m.new_stock,
        m.user || "desconocido"
      ];
      csv += row.join(";") + "\n";
    });

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historial_inventario.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error exportando historial:", err);
  }
}

// ================================
//   COMPROBAR SI PRODUCTO ESTÁ EN USO
//   (mesas con pedido abierto que lo tengan)
// ================================

async function productoEnUso(productId) {
  const mesasEnUso = [];
  try {
    const resMesas = await fetch(`${API_URL}/tables`);
    const mesas = await resMesas.json();

    for (const mesa of mesas) {
      // Solo revisamos las ocupadas para ahorrar llamadas
      if (!mesa.occupied) continue;

      const resPedido = await fetch(
        `${API_URL}/tables/${mesa.id}/order`
      );
      const data = await resPedido.json();
      const items = data.items || [];

      if (items.some((it) => it.product_id === productId)) {
        mesasEnUso.push(mesa.id);
      }
    }
  } catch (err) {
    console.error("Error revisando si producto está en uso:", err);
  }
  return mesasEnUso;
}

// ================================
//      ELIMINAR PRODUCTO
// ================================

async function eliminarProducto(id) {
  try {
    const mesasEnUso = await productoEnUso(id);

    if (mesasEnUso.length > 0) {
      const msg =
        "El producto está siendo utilizado actualmente en las mesas: " +
        mesasEnUso.join(", ") +
        ".\n\nNo se recomienda eliminarlo hasta cerrar esas cuentas.\n\n" +
        "¿Deseas eliminarlo de todos modos?";
      const seguir = confirm(msg);
      if (!seguir) return;
    } else {
      const seguro = confirm(
        "¿Seguro que deseas eliminar este producto del sistema?"
      );
      if (!seguro) return;
    }

    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(
        err.error ||
          "No se pudo eliminar el producto (puede estar vinculado a ventas anteriores)."
      );
      return;
    }

    alert("Producto eliminado correctamente.");
    await cargarInventario();
  } catch (err) {
    console.error("Error eliminando producto:", err);
    alert("Ocurrió un error al eliminar el producto.");
  }
}

// ================================
//          INICIALIZACIÓN
// ================================

document.addEventListener("DOMContentLoaded", async () => {
  await cargarInventario();
  await cargarHistorial();
  const btn = document.getElementById("btn-exportar-historial");
  if (btn) btn.addEventListener("click", exportarHistorialAExcel);
});
