// ================================
//        REPORTES – BACKEND
// ================================

function requireAdmin() {
  try {
    const rol = localStorage.getItem("rol");
    if (!rol || rol !== "admin") {
      alert("Solo el administrador puede ver los reportes.");
      window.location.href = "index.html";
    }
  } catch (e) {
    console.warn("No se pudo leer rol", e);
  }
}

function renderTabla(containerId, headers, rows) {
  const cont = document.getElementById(containerId);
  if (!cont) return;

  if (!rows.length) {
    cont.innerHTML = "<p class='historial-empty'>No hay datos.</p>";
    return;
  }

  let html = "<table class='tabla-reportes'><thead><tr>";
  headers.forEach((h) => (html += `<th>${h}</th>`));
  html += "</tr></thead><tbody>";
  rows.forEach((r) => {
    html += "<tr>";
    r.forEach((c) => (html += `<td>${c}</td>`));
    html += "</tr>";
  });
  html += "</tbody></table>";
  cont.innerHTML = html;
}

async function cargarReporteMesas() {
  try {
    const res = await fetch(`${API_URL}/reports/mesas`);
    const data = await res.json();
    const rows = data.map((d) => [d.mesa, `$${d.total}`]);
    renderTabla("reporte-mesas", ["Mesa", "Total"], rows);
  } catch (err) {
    console.error("Error reportes mesas:", err);
  }
}

async function cargarReporteProductos() {
  try {
    const res = await fetch(`${API_URL}/reports/productos`);
    const data = await res.json();
    const rows = data.map((d) => [d.producto, d.cantidad, `$${d.ingresos}`]);
    renderTabla("reporte-productos", ["Producto", "Cantidad", "Ingresos"], rows);
  } catch (err) {
    console.error("Error reportes productos:", err);
  }
}

async function cargarReporteUsuarios() {
  try {
    const res = await fetch(`${API_URL}/reports/usuarios`);
    const data = await res.json();
    const rows = data.map((d) => [d.usuario, `$${d.total}`]);
    renderTabla("reporte-usuarios", ["Usuario", "Total"], rows);
  } catch (err) {
    console.error("Error reportes usuarios:", err);
  }
}

async function cargarReporteDetalle() {
  const cont = document.getElementById("reporte-detalle");
  if (!cont) return;

  try {
    const res = await fetch(`${API_URL}/reports/detalle`);
    const rows = await res.json();

    if (!rows.length) {
      cont.innerHTML = "<p class='historial-empty'>Sin ventas registradas.</p>";
      return;
    }

    let html =
      "<table class='tabla-historial'><thead><tr>" +
      "<th>Fecha y hora</th>" +
      "<th>Mesa</th>" +
      "<th>Usuario</th>" +
      "<th>Producto</th>" +
      "<th>Cantidad</th>" +
      "<th>Total</th>" +
      "</tr></thead><tbody>";

    rows.forEach((r) => {
      html += "<tr>";
      html += `<td>${r.fecha}</td>`;
      html += `<td>${r.mesa}</td>`;
      html += `<td>${r.usuario}</td>`;
      html += `<td>${r.producto}</td>`;
      html += `<td>${r.cantidad}</td>`;
      html += `<td>$${r.total}</td>`;
      html += "</tr>";
    });

    html += "</tbody></table>";
    cont.innerHTML = html;
  } catch (err) {
    console.error("Error reporte detalle:", err);
  }
}

async function exportarVentasAExcel() {
  try {
    const res = await fetch(`${API_URL}/reports/detalle`);
    const rows = await res.json();

    if (!rows.length) {
      alert("No hay ventas para exportar.");
      return;
    }

    const headers = [
      "Fecha y hora",
      "Mesa",
      "Usuario",
      "Producto",
      "Cantidad",
      "Total"
    ];
    let csv = "\uFEFF" + headers.join(";") + "\n";

    rows.forEach((r) => {
      csv += [
        r.fecha,
        r.mesa,
        r.usuario,
        r.producto,
        r.cantidad,
        r.total
      ].join(";") + "\n";
    });

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "detalle_ventas.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error exportando ventas:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  requireAdmin();
  await cargarReporteMesas();
  await cargarReporteProductos();
  await cargarReporteUsuarios();
  await cargarReporteDetalle();
  const btn = document.getElementById("btn-exportar-ventas");
  if (btn) btn.addEventListener("click", exportarVentasAExcel);
});
