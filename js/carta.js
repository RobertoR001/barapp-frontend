// ================================
//   CARTA – MODO MESERO (BACKEND)
// ================================

const totalMesas = 8;

function getCurrentUserId() {
  try {
    const uid = parseInt(localStorage.getItem("userId") || "0", 10);
    return isNaN(uid) ? null : uid;
  } catch (e) {
    return null;
  }
}

async function renderCarta() {
  const menuCarta = document.getElementById("menu");
  if (!menuCarta) return;

  await loadMenuData();
  const productos = window.menuData || [];

  if (!productos.length) {
    menuCarta.innerHTML =
      "<p style='text-align:center; grid-column:1/-1;'>Sin productos</p>";
    return;
  }

  menuCarta.innerHTML = "";

  productos.forEach((item) => {
    let opciones = '<option value="" disabled selected>Selecciona mesa</option>';
    for (let i = 1; i <= totalMesas; i++) {
      opciones += `<option value="${i}">Mesa ${i}</option>`;
    }

    const card = `
      <div class="card">
        <h3>${item.name}</h3>
        <p>$${item.price}</p>
        <select data-id="${item.id}">
          ${opciones}
        </select>
        <input type="number" min="1" value="1" data-id="qty-${item.id}" placeholder="Cantidad">
        <button onclick="addToMesa(${item.id})">Agregar a Mesa</button>
      </div>
    `;
    menuCarta.innerHTML += card;
  });
}

async function addToMesa(productId) {
  const select = document.querySelector(`select[data-id="${productId}"]`);
  const qtyInput = document.querySelector(`input[data-id="qty-${productId}"]`);

  if (!select || !qtyInput) {
    alert("No se encontró el elemento de la carta.");
    return;
  }

  const mesa = parseInt(select.value || "0", 10);
  const cantidad = parseInt(qtyInput.value || "0", 10);

  if (!mesa) {
    alert("Selecciona una mesa");
    return;
  }
  if (isNaN(cantidad) || cantidad <= 0) {
    alert("Cantidad inválida");
    return;
  }

  const userId = getCurrentUserId();

  try {
    const res = await fetch(`${API_URL}/tables/${mesa}/order/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId || null,
        items: [
          {
            product_id: productId,
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

    const prod = (window.menuData || []).find((p) => p.id === productId);
    alert(
      `Agregado ${prod ? prod.name : "producto"} x${cantidad} a Mesa ${mesa}`
    );
    select.value = "";
    qtyInput.value = "1";
  } catch (err) {
    console.error("Error agregando a mesa:", err);
    alert("Error al conectar con el servidor");
  }
}

document.addEventListener("DOMContentLoaded", renderCarta);
