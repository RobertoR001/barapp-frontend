// =======================================
//   CONTROL DE MESAS – VISTA DE MESERO
//   (Backend + Ticket de consumo)
// =======================================

const totalMesas = 8;
let mesaActual = null;
let cerrandoCuenta = false;
let pedidoActual = []; // aquí guardamos los items del pedido actual

const mesasContainer = document.getElementById("mesas-container");
const pedidoSection = document.getElementById("pedido-section");

// ID de usuario (para mostrar en ticket)
function getCurrentUserId() {
  try {
    const uid = parseInt(localStorage.getItem("userId") || "0", 10);
    return isNaN(uid) ? null : uid;
  } catch (e) {
    return null;
  }
}

function getCurrentUsername() {
  try {
    return localStorage.getItem("usuario") || "desconocido";
  } catch (e) {
    return "desconocido";
  }
}

// ==========================
//   CARGAR LISTA DE MESAS
// ==========================
async function cargarMesas() {
  if (!mesasContainer) return;
  mesasContainer.innerHTML = "";

  try {
    const res = await fetch(`${API_URL}/tables`);
    const mesas = await res.json();

    mesas.forEach((m) => {
      const ocupada = m.occupied ? "mesa-ocupada" : "";
      mesasContainer.innerHTML += `
        <div class="card ${ocupada}" id="mesa-card-${m.id}">
          <h3>${m.name}</h3>
          <button onclick="abrirMesa(${m.id})">Abrir Pedido</button>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error cargando mesas:", err);
  }
}

// ==========================
//      ABRIR UNA MESA
// ==========================
async function abrirMesa(n) {
  mesaActual = n;
  pedidoActual = []; // limpiamos por si acaso

  if (pedidoSection) pedidoSection.style.display = "block";
  const title = document.getElementById("mesa-title");
  if (title) title.textContent = n;

  await cargarPedido();
}

// ==========================
//    CARGAR PEDIDO DE MESA
// ==========================
async function cargarPedido() {
  const list = document.getElementById("order-list");
  const totalEl = document.getElementById("total");
  if (!list || mesaActual == null) return;

  list.innerHTML = "";
  if (totalEl) totalEl.textContent = "Total: $0";
  pedidoActual = [];

  try {
    const res = await fetch(`${API_URL}/tables/${mesaActual}/order`);
    const data = await res.json();
    const items = data.items || [];

    if (!items.length) {
      list.innerHTML =
        "<p style='text-align:center; grid-column:1/-1;'>Sin pedidos</p>";
      return;
    }

    pedidoActual = items.slice(); // guardamos copia para el ticket

    let total = 0;
    items.forEach((item) => {
      const subtotal = item.price * item.qty;
      total += subtotal;
      list.innerHTML += `
        <div class="card">
          <h3>${item.name}</h3>
          <p>Cant: ${item.qty}</p>
          <p>Subtotal: $${subtotal}</p>
        </div>
      `;
    });

    if (totalEl) totalEl.textContent = "Total: $" + total;
  } catch (err) {
    console.error("Error cargando pedido:", err);
  }
}

// ==========================
//      IMPRIMIR TICKET
// ==========================
function imprimirTicket(mesa, items, total) {
  if (!items || !items.length) {
    alert("No hay items para imprimir el ticket.");
    return;
  }

  const usuario = getCurrentUsername();
  const fecha = new Date().toLocaleString();

  let html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Ticket Mesa ${mesa}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 16px;
      font-size: 14px;
    }
    h1, h2, h3, p {
      margin: 0 0 4px;
    }
    h2 {
      text-align: center;
      margin-bottom: 8px;
    }
    .ticket-header {
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th, td {
      border-bottom: 1px solid #ccc;
      padding: 4px;
      text-align: left;
      font-size: 13px;
    }
    th {
      font-weight: 600;
    }
    tfoot td {
      font-weight: bold;
    }
    .total-row td {
      border-top: 1px solid #000;
    }
    .center {
      text-align: center;
    }
  </style>
</head>
<body>
  <h2>Ticket de consumo</h2>
  <div class="ticket-header">
    <p><strong>Mesa:</strong> ${mesa}</p>
    <p><strong>Fecha:</strong> ${fecha}</p>
    <p><strong>Atendió:</strong> ${usuario}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Cant</th>
        <th>Precio</th>
        <th>Subt.</th>
      </tr>
    </thead>
    <tbody>
`;

  items.forEach((it) => {
    const subtotal = it.price * it.qty;
    html += `
      <tr>
        <td>${it.name}</td>
        <td>${it.qty}</td>
        <td>$${it.price}</td>
        <td>$${subtotal}</td>
      </tr>
    `;
  });

  html += `
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3">Total</td>
        <td>$${total}</td>
      </tr>
    </tfoot>
  </table>
  <p class="center" style="margin-top: 12px;">¡Gracias por su visita!</p>
</body>
</html>
`;

  const w = window.open("", "_blank", "width=400,height=600");
  if (!w) {
    alert(
      "No se pudo abrir la ventana de impresión. Revisa si el navegador está bloqueando ventanas emergentes."
    );
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

// ==========================
//        CERRAR CUENTA
// ==========================
async function cerrarCuenta() {
  if (mesaActual == null) {
    alert("No hay mesa seleccionada");
    return;
  }
  if (!pedidoActual || !pedidoActual.length) {
    alert("No hay pedidos para esta mesa");
    return;
  }
  if (cerrandoCuenta) return;
  cerrandoCuenta = true;

  try {
    const res = await fetch(`${API_URL}/tables/${mesaActual}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "No se pudo cerrar la cuenta");
      cerrandoCuenta = false;
      return;
    }

    const data = await res.json(); // { success, order_id, total }

    // Imprimir ticket con la información del pedido que ya teníamos cargado
    imprimirTicket(mesaActual, pedidoActual, data.total);

    alert(`Cuenta cerrada. Total: $${data.total}`);

    // Limpiar y refrescar
    pedidoActual = [];
    await cargarMesas();
    await cargarPedido();
  } catch (err) {
    console.error("Error cerrando cuenta:", err);
    alert("Error al conectar con el servidor");
  } finally {
    cerrandoCuenta = false;
  }
}

// ==========================
//        INICIALIZACIÓN
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
  if (pedidoSection) pedidoSection.style.display = "none";
  await cargarMesas();
});
