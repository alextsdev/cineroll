// --------------------- Selectores ---------------------
const genresContainer = document.getElementById("genresContainer");
const providersDiv = document.getElementById("providersSelect");
const button = document.getElementById("randomBtn");
const movieDiv = document.getElementById("movie");
const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");

// --------------------- Estado ---------------------
const selectedGenres = new Set();
const selectedPlatforms = new Set();
let allGenres = [];
let loadingInterval;

// --------------------- Mensajes dinámicos del loader ---------------------
const loadingMessages = [
  "🎬 Buscando una joya para ti...",
  "🍿 Revisando las mejores plataformas...",
  "🎞️ Analizando el catálogo...",
  "🎥 Esto puede tardar unos segundos...",
  "✨ Encontrando algo especial..."
];

// --------------------- Cargar géneros ---------------------
async function cargarGeneros() {
  const res = await fetch("/genres");
  const generos = await res.json();
  allGenres = generos;

  generos.forEach(g => {
    const btn = document.createElement("div");
    btn.classList.add("genre");
    btn.textContent = g.name;
    btn.dataset.id = g.id;

    btn.addEventListener("click", () => {
      if (selectedGenres.has(g.id)) {
        selectedGenres.delete(g.id);
        btn.classList.remove("selected");
      } else {
        selectedGenres.add(g.id);
        btn.classList.add("selected");
      }
    });

    genresContainer.appendChild(btn);
  });
}

// --------------------- Selección de plataformas ---------------------
providersDiv.addEventListener("click", e => {
  const platform = e.target.closest(".platform");
  if (!platform) return;

  const name = platform.dataset.name;
  if (selectedPlatforms.has(name)) {
    selectedPlatforms.delete(name);
    platform.classList.remove("selected");
  } else {
    selectedPlatforms.add(name);
    platform.classList.add("selected");
  }
});

// --------------------- Helpers ---------------------
function getGenreNameById(id) {
  const g = allGenres.find(gg => gg.id == id);
  return g ? g.name : "";
}

function getProviderLogo(name) {
  switch (name.toLowerCase()) {
    case "netflix": return "img/netflix-logo.svg";
    case "amazon prime video": return "img/prime-video-logo.svg";
    case "disney plus": return "img/disney-plus-logo.svg";
    case "hbo max": return "img/hbo-max-logo.svg";
    case "apple tv+": return "img/apple-tv-logo.svg";
    default: return "";
  }
}

function getProviderUrl(name) {
  switch (name.toLowerCase()) {
    case "netflix": return "https://www.netflix.com";
    case "amazon prime video": return "https://www.primevideo.com";
    case "disney plus": return "https://www.disneyplus.com";
    case "hbo max": return "https://www.hbomax.com";
    case "apple tv+": return "https://tv.apple.com";
    default: return "#";
  }
}

// --------------------- Obtener película ---------------------
async function obtenerPelicula() {
  // 🔒 Bloqueamos el botón y cambiamos estilo y texto
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Cargando...";

  movieDiv.innerHTML = "";
  loading.style.display = "block";

  let i = 0;
  loadingText.textContent = loadingMessages[0];
  clearInterval(loadingInterval);
  loadingInterval = setInterval(() => {
    i = (i + 1) % loadingMessages.length;
    loadingText.textContent = loadingMessages[i];
  }, 2000);

  const genre = Array.from(selectedGenres).join(",");
  const providers = Array.from(selectedPlatforms);

  try {
    const query = new URLSearchParams();
    if (genre) query.append("genre", genre);
    if (providers.length) query.append("providers", providers.join(","));

    const res = await fetch(`/movies/random?${query.toString()}`);
    const movie = await res.json();

    if (!movie.title) {
      movieDiv.innerHTML = "<p>No se encontró ninguna película 😕</p>";
      return;
    }

    const genreHTML = movie.genre_ids
      .map(g => `<div class="genre-chip">${getGenreNameById(g)}</div>`)
      .join("");

    const providersHTML = movie.providers
      ?.map(p => {
        const url = getProviderUrl(p.name);
        const className = p.name.toLowerCase().replace(/\s+/g, '-');
        return `<a href="${url}" target="_blank" class="platform-link ${className}">
                  <img src="${getProviderLogo(p.name)}" alt="${p.name}" title="${p.name}" />
                </a>`;
      }).join('') || '';

    // Trailer (si existe)
    const trailerHTML = movie.trailers?.length
      ? `<a href="https://www.youtube.com/watch?v=${movie.trailers[0].key}" target="_blank" class="trailer-button">🎬 Ver trailer</a>`
      : '';

    movieDiv.innerHTML = `
      <div class="movie-container">
        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}" />
        <div class="movie-info">
          <h2>${movie.title} (${movie.release_date?.split("-")[0] || "?"})</h2>
          <p>${movie.overview || "Sin descripción disponible."}</p>
          <div class="movie-extra">
            <p>🕒 ${movie.runtime || "?"} min · ⭐ ${movie.vote_average?.toFixed(2) || "?"}</p>
            ${trailerHTML}
          </div>

          <div class="movie-meta">${genreHTML}</div>
          <div class="movie-platforms" style="margin-top:10px;">${providersHTML}</div>
        </div>
      </div>
    `;

    throwConfetti();

    window.scrollTo({ top: 0, behavior: "smooth" });

  } catch (err) {
    console.error(err);
    movieDiv.innerHTML = "<p>Error al obtener la película 😔</p>";
  } finally {
    clearInterval(loadingInterval);
    loading.style.display = "none";
    // 🔓 Desbloqueamos el botón y restauramos el texto
    button.disabled = false;
    button.textContent = originalText;
  }
}

// --------------------- Efecto de confeti ---------------------
function throwConfetti() {
  confetti({
    colors: ["#ff4500", "#ff6533"],
    particleCount: 100,
    startVelocity: 60,
    spread: 100,
    angle: 60,
    origin: { x: 0, y: 1 },
  });
  confetti({
    colors: ["#ff4500", "#ff6533"],
    particleCount: 100,
    startVelocity: 60,
    spread: 100,
    angle: 120,
    origin: { x: 1, y: 1 },
  });
}

// --------------------- Inicialización ---------------------
cargarGeneros();
button.addEventListener("click", obtenerPelicula);
