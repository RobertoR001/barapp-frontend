// ===============
//  CATÁLOGO PÚBLICO
// ===============

document.addEventListener("DOMContentLoaded", async () => {
  const menuContainer = document.getElementById("menu");
  if (!menuContainer) return;

  await loadMenuData();
  if (!window.menuData || !window.menuData.length) {
    menuContainer.innerHTML =
      "<p style='text-align:center; grid-column:1/-1;'>Sin productos</p>";
    return;
  }

  window.menuData.forEach((item) => {
    menuContainer.innerHTML += `
      <div class="card">
        <h3>${item.name}</h3>
        <p>Precio: <strong>$${item.price}</strong></p>
      </div>
    `;
  });
});
