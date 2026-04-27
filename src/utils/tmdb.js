const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || ''; 
const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN || '';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const fetchWithErrorHandling = async (url) => {
    if (!TMDB_API_KEY && !TMDB_ACCESS_TOKEN) {
        console.warn('TMDB API credentials missing.');
        return { results: [], error: 'Missing Credentials' };
    }
    
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            ...(TMDB_ACCESS_TOKEN ? { Authorization: `Bearer ${TMDB_ACCESS_TOKEN}` } : {})
        }
    };

    // If using API key, append it to URL if not already present
    const finalUrl = (!TMDB_ACCESS_TOKEN && !url.includes('api_key=')) 
        ? `${url}${url.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`
        : url;

    try {
        const response = await fetch(finalUrl, options);
        if (!response.ok) {
            const errorData = await response.json();
            console.error('TMDB API Error:', errorData.status_message || response.statusText);
            return { results: [] };
        }
        return await response.json();
    } catch (error) {
        console.error('TMDB Fetch Error (Check your network/VPN):', error);
        return { results: [] };
    }
};

export const tmdb = {
    fetchTrending: async (type = 'movie', page = 1) => {
        const data = await fetchWithErrorHandling(`${BASE_URL}/trending/${type}/week?page=${page}`);
        return data.results || [];
    },

    fetchPopular: async (type = 'movie', page = 1) => {
        const data = await fetchWithErrorHandling(`${BASE_URL}/${type}/popular?page=${page}`);
        return data.results || [];
    },

    fetchMovieDetails: async (id) => {
        if (!id || id === 'undefined') return { results: [], error: 'Invalid ID' };
        return await fetchWithErrorHandling(`${BASE_URL}/movie/${id}?append_to_response=credits,videos,recommendations`);
    },

    fetchTVDetails: async (id) => {
        if (!id || id === 'undefined') return { results: [], error: 'Invalid ID' };
        return await fetchWithErrorHandling(`${BASE_URL}/tv/${id}?append_to_response=credits,videos,recommendations`);
    },

    fetchTopRated: async (type = 'movie', page = 1) => {
        const data = await fetchWithErrorHandling(`${BASE_URL}/${type}/top_rated?page=${page}`);
        return data.results || [];
    },

    fetchByGenre: async (genreId, type = 'movie') => {
        const data = await fetchWithErrorHandling(`${BASE_URL}/discover/${type}?with_genres=${genreId}&sort_by=popularity.desc`);
        return data.results || [];
    },

    fetchRecommended: async (id, type = 'movie') => {
        if (!id || id === 'undefined') return [];
        const data = await fetchWithErrorHandling(`${BASE_URL}/${type}/${id}/recommendations`);
        return data.results || [];
    },

    search: async (query) => {
        const data = await fetchWithErrorHandling(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}`);
        return data.results || [];
    },

    getPosterUrl: (path, size = 'w342') => path ? `${IMAGE_BASE_URL}/${size}${path}` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=80',
    getBackdropUrl: (path, size = 'w1280') => path ? `${IMAGE_BASE_URL}/${size}${path}` : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',

    formatMovie: (item) => {
        if (!item || (!item.id && !item.tmdbId)) return null;
        
        // Extract crew
        const crew = item.credits?.crew || [];
        const director = crew.find(c => c.job === 'Director')?.name || 'Visionary Director';
        const writers = crew.filter(c => c.department === 'Writing').slice(0, 2).map(c => c.name).join(', ') || 'Screenplay Author';

        return {
            id: (item.id || item.tmdbId).toString(),
            tmdbId: (item.id || item.tmdbId).toString(),
            type: item.media_type || (item.first_air_date ? 'tv' : 'movie'),
            title: item.title || item.name || 'Untitled',
            backdrop: tmdb.getBackdropUrl(item.backdrop_path, 'w1280'),
            poster: tmdb.getPosterUrl(item.poster_path, 'w342'),
            match: item.vote_average ? `${Math.round(item.vote_average * 10)}%` : '85%',
            year: (item.release_date || item.first_air_date || '2024').split('-')[0],
            rating: item.adult ? 'R' : 'PG-13',
            duration: item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : (item.number_of_seasons ? `${item.number_of_seasons} Seasons` : '2h 15m'),
            tags: item.genres ? item.genres.map(g => g.name) : [],
            description: item.overview || 'No description available.',
            cast: item.credits?.cast?.slice(0, 10).map(c => ({
                name: c.name,
                character: c.character,
                profilePath: c.profile_path ? tmdb.getPosterUrl(c.profile_path, 'w185') : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random&size=200`
            })) || [],
            director,
            writers,
            recommendations: item.recommendations?.results?.slice(0, 10).map(tmdb.formatMovie).filter(Boolean) || []
        };
    }
};
