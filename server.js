const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

// -------------------- Middlewares --------------------
app.use(cors());
app.use(express.static('public'));

// -------------------- Endpoint: géneros --------------------
app.get('/genres', async (req, res) => {
  try {
    const response = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
      params: { api_key: process.env.TMDB_API_KEY, language: 'es-ES' },
    });
    res.json(response.data.genres);
  } catch (err) {
    console.error('❌ Error al obtener géneros:', err.message);
    res.status(500).json({ message: 'Error al obtener géneros' });
  }
});

// -------------------- Endpoint: película aleatoria --------------------
app.get('/movies/random', async (req, res) => {
  const { genre, providers } = req.query;
  const selectedProviders = providers ? providers.split(',').map(p => p.toLowerCase()) : [];
  const selectedGenres = genre ? genre.split(',').map(g => parseInt(g)) : [];
  const allowedPlatforms = ['netflix', 'amazon prime video', 'disney plus', 'hbo max', 'apple tv+'];

  try {
    console.log("🎬 Buscando película que cumpla los filtros...");

    const firstCall = await axios.get('https://api.themoviedb.org/3/discover/movie', {
      params: { api_key: process.env.TMDB_API_KEY, language: 'es-ES' },
    });

    let totalPages = Math.min(firstCall.data.total_pages || 1, 500);
    let movie = null;
    let searchAttempts = 0;

    while (!movie) {
      searchAttempts++;
      const randomPage = Math.floor(Math.random() * totalPages) + 1;

      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'es-ES',
          sort_by: 'popularity.desc',
          page: randomPage,
        },
      });

      const movies = response.data.results;
      if (!movies || movies.length === 0) continue;

      const randomMovie = movies[Math.floor(Math.random() * movies.length)];

      const matchesGenre = selectedGenres.length === 0 ||
        randomMovie.genre_ids.some(id => selectedGenres.includes(id));
      if (!matchesGenre) continue;

      const provRes = await axios.get(
        `https://api.themoviedb.org/3/movie/${randomMovie.id}/watch/providers`,
        { params: { api_key: process.env.TMDB_API_KEY } }
      );

      let providersList = provRes.data.results?.ES?.flatrate || [];
      providersList = providersList.filter(p =>
        allowedPlatforms.includes(p.provider_name.toLowerCase())
      );
      if (!providersList.length) continue;

      const movieProviders = providersList.map(p => p.provider_name.toLowerCase());
      const matchesProvider =
        selectedProviders.length === 0 ||
        selectedProviders.some(sp => movieProviders.some(mp => mp.includes(sp)));

      if (matchesProvider) {
        const detailsRes = await axios.get(`https://api.themoviedb.org/3/movie/${randomMovie.id}`, {
          params: { api_key: process.env.TMDB_API_KEY, language: 'es-ES' },
        });
        const details = detailsRes.data;

        const videosRes = await axios.get(`https://api.themoviedb.org/3/movie/${randomMovie.id}/videos`, {
          params: { api_key: process.env.TMDB_API_KEY, language: 'es-ES' },
        });
        const trailers = videosRes.data.results.filter(
          v => v.site === 'YouTube' && v.type === 'Trailer'
        );

        movie = {
          ...randomMovie,
          providers: providersList.map(p => ({ name: p.provider_name, logo_path: p.logo_path })),
          runtime: details.runtime,
          vote_average: details.vote_average,
          trailers,
        };

        console.log(`✅ Encontrada (${searchAttempts} intentos): ${movie.title}`);
      }
    }

    res.json({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      release_date: movie.release_date,
      poster_path: movie.poster_path,
      genre_ids: movie.genre_ids,
      providers: movie.providers,
      runtime: movie.runtime,
      vote_average: movie.vote_average,
      trailers: movie.trailers,
    });

  } catch (error) {
    console.error('❌ Error al obtener película aleatoria:', error.message);
    res.status(500).json({ message: 'Error al obtener película aleatoria' });
  }
});

// -------------------- Iniciar servidor --------------------
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});