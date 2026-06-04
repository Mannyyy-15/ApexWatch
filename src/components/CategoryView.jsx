import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { tmdb } from '../utils/tmdb';
import { MovieRow } from './MovieRow';
import { Play, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { HeroSkeleton, RowSkeleton } from './Skeleton';

export function CategoryView({ type, title }) {
    const { setActiveMovieId, setActiveMediaType, setCurrentView, categoryCache, setCategoryCache } = useAppContext();
    const [heroMovie, setHeroMovie] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCategoryData = async () => {
            if (categoryCache[type]) {
                setHeroMovie(categoryCache[type].heroMovie);
                setRows(categoryCache[type].rows);
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                let trending;
                const tmdbType = type === 'movies' ? 'movie' : 'tv';

                let finalRows = [];

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
                    finalRows = [
                        { title: 'Trending Anime Series', movies: trending },
                        { title: 'Anime Movie Hits', movies: movies.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Action & Shonen', movies: shonen.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Fantasy Worlds', movies: fantasy.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Sci-Fi & Cyberpunk', movies: sciFi.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'All-Time Top Rated', movies: topRated.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Romantic Anime', movies: romance.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Adventure Quests', movies: adventure.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Adrenaline Rush', movies: action.map(tmdb.formatMovie).filter(Boolean) }
                    ];
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
                    finalRows = [
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
                }

                const newHero = trending[0];
                setHeroMovie(newHero);
                setRows(finalRows);
                setCategoryCache(prev => ({ ...prev, [type]: { rows: finalRows, heroMovie: newHero } }));
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
            <div className="w-full min-h-screen bg-[#020202] pb-20 overflow-hidden">
                <HeroSkeleton />
                <div className="-mt-12 md:-mt-20 space-y-8 md:space-y-12 relative z-20">
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen hide-scrollbar scroll-smooth">
            {/* Category Hero - Matching Hero.jsx Scale */}
            {heroMovie && (
                <div className="relative w-full h-[90dvh] md:h-[95vh] flex items-end overflow-hidden group">
                    <div className="absolute inset-0 overflow-hidden">
                        <img src={heroMovie.backdrop} className="w-full h-full object-cover transform scale-102" alt="" />
                        {/* Moody Cinematic Overlays */}
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#020202] via-transparent to-transparent hidden md:block"></div>
                    </div>

                    <div className="relative z-10 w-full px-6 md:px-20 pb-20 md:pb-24 grid md:grid-cols-2 gap-4 md:gap-8 items-end">
                        <div className="flex flex-col items-start min-h-[200px] md:min-h-[300px] justify-end">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="w-full"
                            >
                                <div className="flex items-center gap-2.5 mb-4 md:mb-6">
                                    <span className="px-2.5 py-0.5 bg-accent/15 border border-accent/30 rounded-full text-[9px] font-black tracking-[0.2em] uppercase text-white shadow-[0_0_15px_rgba(229,9,20,0.2)]">Featured {title}</span>
                                    <div className="flex items-center gap-1 px-2.5 py-0.5 bg-black/40 backdrop-blur-xl border border-white/5 rounded-full">
                                        <span className="text-white text-[10px] font-black">{heroMovie.year}</span>
                                        <span className="text-white/30 text-[10px]">•</span>
                                        <span className="text-white text-[10px] font-black">{heroMovie.rating || 'PG-13'}</span>
                                    </div>
                                </div>

                                <h1 className="display-text text-4xl md:text-[5rem] lg:text-[6rem] font-black tracking-tighter mb-4 md:mb-5 leading-[0.9] text-white filter drop-shadow-xl uppercase italic">
                                    {heroMovie.title}
                                </h1>

                                <p className="max-w-xl text-sm md:text-base text-white/60 mb-6 md:mb-8 font-medium leading-relaxed drop-shadow-md hidden md:block line-clamp-3">
                                    {heroMovie.description}
                                </p>

                                <div className="flex flex-col gap-3 w-full md:flex-row md:flex-wrap md:items-center md:gap-3.5">
                                    <button 
                                        onClick={() => { 
                                            setActiveMovieId(heroMovie.id); 
                                            setActiveMediaType(heroMovie.type);
                                            setCurrentView('player'); 
                                        }} 
                                        className="w-full md:w-auto flex items-center justify-center gap-3 bg-accent text-white px-8 py-3.5 md:px-9 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:bg-accent-hover hover:scale-105 hover:shadow-[0_0_30px_rgba(229,9,20,0.4)] transition-all duration-300 active:scale-95 cursor-pointer tv-focusable"
                                    >
                                        <Play fill="currentColor" size={16} className="md:w-5 md:h-5" />
                                        PLAY NOW
                                    </button>

                                    <button 
                                        onClick={() => { 
                                            setActiveMovieId(heroMovie.id); 
                                            setActiveMediaType(heroMovie.type);
                                            setCurrentView('details'); 
                                        }} 
                                        className="w-full md:w-auto flex items-center justify-center gap-3 bg-glass-bg border border-glass-border px-8 py-3.5 md:px-9 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:bg-glass-hover hover:border-white/15 transition-all text-white hover:scale-105 duration-300 active:scale-95 cursor-pointer tv-focusable"
                                    >
                                        <Info size={16} className="text-white/60" />
                                        INFO
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Content Rows - With matching home spacing */}
            <div className="relative z-20 px-4 md:px-16 lg:px-20 mt-8 md:mt-12 flex flex-col gap-10 md:gap-14 pb-20">
                {rows.filter(row => row.movies && row.movies.length > 0).map((row, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
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
