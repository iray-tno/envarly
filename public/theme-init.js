(function () {
  var stored = localStorage.getItem("envarly-theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = stored === "dark" || stored === "light" ? stored : prefersDark ? "dark" : "light";
  document.documentElement.classList.add(theme);
})();
