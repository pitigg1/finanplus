// Modo claro / oscuro. Si el usuario nunca eligió, sigue el modo del sistema; al elegir, se recuerda.
const CLAVE = 'tema'; // "claro" | "oscuro"
const sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)');

function elegido() {
  try { return localStorage.getItem(CLAVE); } catch (e) { return null; }
}

export function modoActual() {
  const e = elegido();
  if (e === 'claro') return 'light';
  if (e === 'oscuro') return 'dark';
  return sistemaOscuro.matches ? 'dark' : 'light';
}

function aplicar() {
  document.documentElement.setAttribute('data-bs-theme', modoActual());
}

// Lo llaman los botones de sol/luna
export function alternarTema() {
  try { localStorage.setItem(CLAVE, modoActual() === 'dark' ? 'claro' : 'oscuro'); } catch (e) {}
  aplicar();
}

// Se llama una vez antes de pintar la app para que la página no parpadee
export function inicializarTema() {
  sistemaOscuro.addEventListener('change', aplicar);
  aplicar();
}
