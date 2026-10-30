// Modo claro / oscuro. Se carga en el <head> para que la página no parpadee.
// Si el usuario nunca eligió, sigue el modo del sistema; al elegir, se recuerda.
(function () {
  const CLAVE = "tema"; // "claro" | "oscuro"
  const sistemaOscuro = window.matchMedia("(prefers-color-scheme: dark)");

  function elegido() {
    try { return localStorage.getItem(CLAVE); } catch (e) { return null; }
  }

  function modoActual() {
    const e = elegido();
    if (e === "claro") return "light";
    if (e === "oscuro") return "dark";
    return sistemaOscuro.matches ? "dark" : "light";
  }

  function aplicar() {
    document.documentElement.setAttribute("data-bs-theme", modoActual());
  }

  // Lo llaman los botones de sol/luna
  window.alternarTema = function () {
    try { localStorage.setItem(CLAVE, modoActual() === "dark" ? "claro" : "oscuro"); } catch (e) {}
    aplicar();
  };

  sistemaOscuro.addEventListener("change", aplicar);
  aplicar();
})();
