import fetch from 'node-fetch';

const API_KEY = '8d6d91941230817f7807d643736e8a49';
const BASE_URL = 'https://api.themoviedb.org/3';

async function searchMovie(query) {
  const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    const movie = data.results[0];
    console.log(`${query}: https://image.tmdb.org/t/p/w500${movie.backdrop_path}`);
  } else {
    console.log(`${query}: No results`);
  }
}

async function searchTV(query) {
  const response = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (data.results && data.results.length > 0) {
    const show = data.results[0];
    console.log(`${query} (TV): https://image.tmdb.org/t/p/w500${show.backdrop_path}`);
  } else {
    console.log(`${query} (TV): No results`);
  }
}

async function run() {
  // Sports
  await searchMovie('83'); // Cricket
  await searchMovie('Pele'); // Football
  await searchMovie('King Richard'); // Tennis
  await searchMovie('Panga'); // Kabaddi

  // Languages
  await searchMovie('Jawan'); // Hindi
  await searchMovie('Oppenheimer'); // English
  await searchMovie('Leo'); // Tamil
  await searchMovie('RRR'); // Telugu
  await searchMovie('Premalu'); // Malayalam
  await searchTV('Squid Game'); // Korean

  // Channels
  await searchMovie('Star Wars'); // Sparks / Sci-Fi
  await searchTV('The Newsroom'); // News
  await searchTV('Breaking Bad'); // TV Shows
  await searchMovie('The Dark Knight'); // Movies
  await searchMovie('Rush'); // Sports
}

run();
