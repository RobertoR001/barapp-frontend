// =======================
//   LOGIN / SESIÓN (API)
// =======================

async function login() {
  const userInput = document.getElementById("user");
  const passInput = document.getElementById("pass");
  if (!userInput || !passInput) return;

  const username = userInput.value.trim();
  const password = passInput.value.trim();

  if (!username || !password) {
    alert("Escribe usuario y contraseña");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      alert("Usuario o contraseña incorrectos");
      return;
    }

    const data = await res.json();
    // data: { id, username, role }
    try {
      localStorage.setItem("userId", data.id);
      localStorage.setItem("rol", data.role);
      localStorage.setItem("usuario", data.username);
      localStorage.setItem("sesionInicio", Date.now().toString());
    } catch (e) {
      console.warn("No se pudo guardar sesión en localStorage", e);
    }

    mostrarVista();
  } catch (err) {
    console.error("Error en login:", err);
    alert("Error al conectar con el servidor");
  }
}

function logout() {
  try {
    localStorage.removeItem("userId");
    localStorage.removeItem("rol");
    localStorage.removeItem("usuario");
    localStorage.removeItem("sesionInicio");
  } catch (e) {
    console.warn("No se pudo limpiar sesión de localStorage", e);
  }
  mostrarVista();
}

function mostrarVista() {
  let rol = null;
  let usuario = null;

  try {
    rol = localStorage.getItem("rol");
    usuario = localStorage.getItem("usuario");
  } catch (e) {
    console.warn("No se pudo leer datos de sesión", e);
  }

  const publicHome = document.getElementById("public-home");
  const appHome = document.getElementById("app-home");
  const userInfo = document.getElementById("user-info");

  if (!publicHome || !appHome) return;

  if (rol) {
    // Hay sesión
    publicHome.style.display = "none";
    appHome.style.display = "block";

    const map = { admin: "Administrador", mesero: "Mesero" };
    if (userInfo) {
      userInfo.textContent = `Sesión: ${usuario || ""} (${map[rol] || rol})`;
    }

    const adminBtn = document.getElementById("admin-btn");
    const reportesBtn = document.getElementById("reportes-btn");
    const mesasBtn = document.getElementById("mesas-btn");
    const qrBtn = document.getElementById("qr-btn");

    if (rol === "admin") {
      if (adminBtn) adminBtn.style.display = "block";
      if (reportesBtn) reportesBtn.style.display = "block";
      if (mesasBtn) mesasBtn.style.display = "block";
      if (qrBtn) qrBtn.style.display = "block";
    } else if (rol === "mesero") {
      if (adminBtn) adminBtn.style.display = "none";
      if (reportesBtn) reportesBtn.style.display = "none";
      if (mesasBtn) mesasBtn.style.display = "block";
      if (qrBtn) qrBtn.style.display = "none";
    }
  } else {
    // No hay sesión
    publicHome.style.display = "block";
    appHome.style.display = "none";
    if (userInfo) userInfo.textContent = "";
  }
}

window.addEventListener("load", () => {
  // Expiración de sesión (30 minutos)
  let inicio = 0;
  try {
    inicio = parseInt(localStorage.getItem("sesionInicio") || "0", 10);
  } catch (e) {
    inicio = 0;
  }

  const maxMs = 30 * 60 * 1000;
  if (inicio && Date.now() - inicio > maxMs) {
    try {
      localStorage.removeItem("userId");
      localStorage.removeItem("rol");
      localStorage.removeItem("usuario");
      localStorage.removeItem("sesionInicio");
    } catch (e) {
      console.warn("No se pudo limpiar sesión expirada", e);
    }
  }

  mostrarVista();
});
