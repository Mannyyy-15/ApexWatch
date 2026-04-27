import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { tmdb } from '../utils/tmdb';
import { MovieRow } from './MovieRow';
import { Play, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function CategoryView({ type, title }) {
    const { setActiveMovieId, setActiveMediaType, setCurrentView } = useAppContext();
    const [heroMovie, setHeroMovie] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCategoryData = async () => {
            setLoading(true);
            try {
                let trending;
                const tmdbType = type === 'movies' ? 'movie' : 'tv';

                if (type === 'anime') {
                    // Fetch comprehensive Anime rows
                    const [trendingAnime, movies, action, sciFi, fantasy, topRated, shonen, romance, adventure] = await Promise.all([
                        tmdb.fetchDiscover('tv', { with_genres: 16, with_keywords: '210024', sort_by: 'popularity.desc' }),
                        tmdb.fetchDiscover('movie', { with_genres: 16, with_keywords: '210024', sort_by: 'popularity.desc' }),
                        tmdb.fetchDiscover('tv', { with_genres: '16,10759', with_keywords: '210024' }),
                        tmdb.fetchDiscover('tv', { with_genres: '16,878', with_keywords: '210024' }),
                        tmdb.fetchDiscover('tv', { with_genres: '16,14', with_keywords: '210024' }),
                        tmdb.fetchDiscover('tv', { with_genres: 16, sort_by: 'vote_average.desc', 'vote_count.gte': 100 }),
                        tmdb.fetchDiscover('tv', { with_genres: 16, with_keywords: '210024,33467' }), // Shonen keyword proxy
                        tmdb.fetchDiscover('tv', { with_genres: '16,10749', with_keywords: '210024' }),
                        tmdb.fetchDiscover('tv', { with_genres: '16,10759', with_keywords: '210024' })
                    ]);

                    trending = trendingAnime.map(tmdb.formatMovie).filter(Boolean);
                    setRows([
                        { title: 'Trending Anime Series', movies: trending },
                        { title: 'Anime Movie Hits', movies: movies.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Action & Shonen', movies: shonen.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Fantasy Worlds', movies: fantasy.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Sci-Fi & Cyberpunk', movies: sciFi.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'All-Time Top Rated', movies: topRated.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Romantic Anime', movies: romance.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Adventure Quests', movies: adventure.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Adrenaline Rush', movies: action.map(tmdb.formatMovie).filter(Boolean) }
                    ]);
                } else {
                    const [trendingData, topRated, nowPlaying, indianHits, action, comedy, horror, sciFi, romance, family, mystery] = await Promise.all([
                        tmdb.fetchTrending(tmdbType),
                        tmdb.fetchTopRated(tmdbType),
                        tmdbType === 'movie' ? tmdb.fetchNowPlaying() : tmdb.fetchDiscover('tv', { sort_by: 'first_air_date.desc' }),
                        tmdb.fetchDiscover(tmdbType, { with_origin_country: 'IN', sort_by: 'popularity.desc' }),
                        tmdb.fetchByGenre(tmdbType === 'movie' ? 28 : 10759, tmdbType),
                        tmdb.fetchByGenre(35, tmdbType),
                        tmdb.fetchByGenre(27, tmdbType),
                        tmdb.fetchByGenre(878, tmdbType),
                        tmdb.fetchByGenre(10749, tmdbType),
                        tmdb.fetchByGenre(10751, tmdbType),
                        tmdb.fetchByGenre(9648, tmdbType)
                    ]);

                    trending = trendingData.map(tmdb.formatMovie).filter(Boolean);
                    const categoryRows = [
                        { title: `Trending ${title}`, movies: trending },
                        { title: 'New Releases', movies: nowPlaying.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Popular in India', movies: indianHits.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Critically Acclaimed', movies: topRated.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Action & Adventure', movies: action.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Comedy Gold', movies: comedy.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Chilling Horror', movies: horror.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Sci-Fi & Fantasy', movies: sciFi.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Romantic Hits', movies: romance.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Family Night', movies: family.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Mystery & Thriller', movies: mystery.map(tmdb.formatMovie).filter(Boolean) }
                    ];

                    setRows(categoryRows);
                }

                setHeroMovie(trending[0]);
            } catch (error) {
                console.error('Error loading category data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCategoryData();
        window.scrollTo(0, 0);
    }, [type, title]);

    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-[#050505]">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen hide-scrollbar scroll-smooth">
            {/* Category Hero - Matching Hero.jsx Scale */}
            {heroMovie && (
                <div className="relative w-full h-[85vh] md:h-[95vh] flex items-end overflow-hidden group mb-12">
                    <div className="absolute inset-0">
                        <img src={heroMovie.backdrop} className="w-full h-full object-cover transform scale-105" alt="" />
                        {/* Moody Cinematic Overlays */}
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent hidden md:block"></div>
                    </div>

                    <div className="relative z-10 w-full px-6 md:px-20 pb-12 md:pb-24 max-w-4xl">
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-8"
                        >
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-md tracking-tighter uppercase">Featured {title}</span>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full">
                                    <span className="text-white/60 text-xs font-bold">{heroMovie.year}</span>
                                    <span className="text-white/30 text-[10px]">•</span>
                                    <span className="text-white/60 text-xs font-bold">{heroMovie.rating}</span>
                                </div>
                            </div>

                            <h1 className="display-text text-4xl md:text-[5.5rem] font-black tracking-tighter mb-4 leading-[0.95] text-white filter drop-shadow-2xl uppercase italic">
                                {heroMovie.title}
                            </h1>

                            <p className="max-w-2xl text-lg text-white/70 font-medium leading-relaxed drop-shadow-md hidden md:block line-clamp-3">
                                {heroMovie.description}
                            </p>

                            <div className="flex flex-col gap-3 w-full md:flex-row md:items-center md:gap-4 pt-4">
                                <button 
                                    onClick={() => { 
                                        setActiveMovieId(heroMovie.id); 
                                        setActiveMediaType(heroMovie.type);
                                        setCurrentView('player'); 
                                    }} 
                                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-black px-8 py-3.5 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-xl hover:scale-105 transition-all shadow-2xl active:scale-95"
                                >
                                    <Play fill="currentColor" size={20} className="md:w-6 md:h-6" /> Play Now
                                </button>
                                <button 
                                    onClick={() => { 
                                        setActiveMovieId(heroMovie.id); 
                                        setActiveMediaType(heroMovie.type);
                                        setCurrentView('details'); 
                                    }} 
                                    className="w-full md:w-auto flex items-center justify-center gap-3 glass px-8 py-3.5 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-xl text-white hover:bg-white/10 transition-all active:scale-95"
                                >
                                    <Info size={20} className="md:w-6 md:h-6" /> More Info
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Category Content Rows - With matching home spacing */}
            <div className="relative z-10 px-6 md:px-20 -mt-10 flex flex-col gap-12 md:gap-16 pb-32">
                {rows.map((row, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="hover:z-50 transition-all"
                    >
                        <MovieRow
                            title={row.title}
                            movies={row.movies}
                            onMovieClick={(id, mediaType) => { 
                                setActiveMovieId(id); 
                                setActiveMediaType(mediaType || (type === 'movies' ? 'movie' : 'tv'));
                                setCurrentView('details'); 
                            }}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
