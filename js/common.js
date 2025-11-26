// ================================
//   CONFIGURACIÓN GLOBAL FRONTEND
// ================================

// URL base del backend
const API_URL = "https://barapp-backend-p5br.onrender.com/api";


// Cache de productos
window.menuData = [];
window.menuPromise = null;

// Carga la lista de productos desde el backend (una sola vez)
function loadMenuData() {
  if (window.menuPromise) return window.menuPromise;
  window.menuPromise = fetch(`${API_URL}/products`)
    .then((res) => res.json())
    .then((data) => {
      window.menuData = data || [];
      return window.menuData;
    })
    .catch((err) => {
      console.error("Error cargando productos desde backend:", err);
      window.menuData = [];
      return [];
    });
  return window.menuPromise;
}

// ===============
//   THEME (UI)
// ===============
function applyTheme(theme) {
  const body = document.body;
  if (!body) return;
  body.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {
    console.warn("No se pudo guardar el tema en localStorage", e);
  }

  const btn = document.querySelector(".theme-toggle");
  if (btn) {
    btn.textContent = theme === "dark" ? "☀️ Claro" : "🌙 Oscuro";
  }
}

function initThemeToggle() {
  const body = document.body;
  if (!body) return;

  let saved = "dark";
  try {
    saved = localStorage.getItem("theme") || "dark";
  } catch (e) {
    console.warn("No se pudo leer theme desde localStorage", e);
  }

  body.setAttribute("data-theme", saved);

  const header = document.querySelector("header");
  if (!header) {
    applyTheme(saved);
    return;
  }

  let btn = document.querySelector(".theme-toggle");
  if (!btn) {
    btn = document.createElement("button");
    btn.className = "theme-toggle";
    header.appendChild(btn);
  }

  applyTheme(saved);

  btn.addEventListener("click", () => {
    const current = document.body.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
  });
}

document.addEventListener("DOMContentLoaded", initThemeToggle);
