// ================================
//   QR POR MESA – MODO CLIENTE
// ================================

const totalMesasQR = 8;

document.addEventListener("DOMContentLoaded", () => {
  const baseInput = document.getElementById("base-url");
  const cont = document.getElementById("qr-mesas");

  // Intentar deducir una URL base por defecto
  const defaultBase = (() => {
    const loc = window.location;
    // Reemplazamos "qr.html" por "cliente.html" en la ruta actual
    let base = loc.origin + loc.pathname;
    base = base.replace(/qr\.html$/i, "cliente.html");
    return base;
  })();

  if (baseInput) {
    baseInput.value = defaultBase;
  }

  function renderQrs() {
    if (!cont) return;
    cont.innerHTML = "";

    const baseUrl = (baseInput.value || defaultBase).trim();
    if (!baseUrl) return;

    for (let i = 1; i <= totalMesasQR; i++) {
      const urlMesa = `${baseUrl}?mesa=${i}`;
      const imgSrc =
        "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
        encodeURIComponent(urlMesa);

      cont.innerHTML += `
        <div class="card">
          <h3>Mesa ${i}</h3>
          <p style="word-break:break-all; font-size: 12px;">${urlMesa}</p>
          <img src="${imgSrc}" alt="QR Mesa ${i}" />
        </div>
      `;
    }
  }

  if (baseInput) {
    baseInput.addEventListener("change", renderQrs);
    baseInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") renderQrs();
    });
  }

  renderQrs();
});
