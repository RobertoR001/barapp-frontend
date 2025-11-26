// ================================
//   MODO CLIENTE – PEDIDOS POR MESA
// ================================

function getMesaFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get("mesa") || "0", 10);
}

async function renderCliente() {
  const mesa = getMesaFromURL();
  const mesaLabel = document.getElementById("mesa-label");
  const menuDiv = document.getElementById("menu");

  if (mesaLabel) {
    if (!mesa) {
      mesaLabel.textContent = "Mesa no definida";
      alert("URL sin mesa. Ejemplo: cliente.html?mesa=1");
    } else {
      mesaLabel.textContent = "Mesa " + mesa;
    }
  }

  if (!menuDiv) return;

  await loadMenuData();
  const productos = window.menuData || [];

  if (!productos.length) {
    menuDiv.innerHTML =
      "<p style='text-align:center; grid-column:1/-1;'>Sin productos</p>";
    return;
  }

  menuDiv.innerHTML = "";

  productos.forEach((item) => {
    const card = `
      <div class="card">
        <h3>${item.name}</h3>
        <p>$${item.price}</p>
        <input type="number" min="1" value="1" data-id="${item.id}" placeholder="Cantidad">
        <button onclick="agregar(${item.id})">Agregar a mi pedido</button>
      </div>
    `;
    menuDiv.innerHTML += card;
  });
}

async function agregar(id) {
  const mesa = getMesaFromURL();
  if (!mesa) {
    alert("Mesa no definida");
    return;
  }

  const input = document.querySelector(`input[data-id="${id}"]`);
  if (!input) {
    alert("No se encontró el campo de cantidad.");
    return;
  }

  const cantidad = parseInt(input.value || "0", 10);
  if (isNaN(cantidad) || cantidad <= 0) {
    alert("Cantidad inválida");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/tables/${mesa}/order/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: null, // Modo cliente
        items: [
          {
            product_id: id,
            qty: cantidad
          }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Error agregando a la mesa");
      return;
    }

    const prod = (window.menuData || []).find((p) => p.id === id);
    alert(
      `Agregado ${prod ? prod.name : "producto"} x${cantidad} a tu mesa ${mesa}`
    );
    input.value = "1";
  } catch (err) {
    console.error("Error agregando producto:", err);
    alert("Error al conectar con el servidor");
  }
}

document.addEventListener("DOMContentLoaded", renderCliente);
