import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { tmdb } from '../utils/tmdb';
import { MovieRow } from './MovieRow';
import { Play, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function CategoryView({ type, title }) {
    const { setActiveMovieId, setCurrentView } = useAppContext();
    const [heroMovie, setHeroMovie] = useState(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCategoryData = async () => {
            setLoading(true);
            try {
                let trending, genres;
                
                if (type === 'anime') {
                    // For Anime, we filter Animation genre + Japanese language
                    const data = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=7d43baf815f5ee19cbd9a07736e34098&with_genres=16&with_original_language=ja&sort_by=popularity.desc`).then(res => res.json());
                    trending = data.results.map(tmdb.formatMovie).filter(Boolean);
                    
                    // Specific Anime Rows
                    const actionAnime = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=7d43baf815f5ee19cbd9a07736e34098&with_genres=16,10759&with_original_language=ja`).then(res => res.json());
                    const dramaAnime = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=7d43baf815f5ee19cbd9a07736e34098&with_genres=16,18&with_original_language=ja`).then(res => res.json());
                    
                    setRows([
                        { title: 'Trending Anime', movies: trending },
                        { title: 'Action & Adventure', movies: actionAnime.results.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Emotional Dramas', movies: dramaAnime.results.map(tmdb.formatMovie).filter(Boolean) }
                    ]);
                } else {
                    const tmdbType = type === 'movies' ? 'movie' : 'tv';
                    const trendingData = await tmdb.fetchTrending(tmdbType);
                    trending = trendingData.map(tmdb.formatMovie).filter(Boolean);
                    
                    const topRated = await tmdb.fetchTopRated(tmdbType);
                    
                    // Fetch some genre-specific rows
                    const genre1 = type === 'movies' ? 28 : 10759; // Action
                    const genre2 = type === 'movies' ? 35 : 35;    // Comedy
                    
                    const actionData = await tmdb.fetchByGenre(genre1, tmdbType);
                    const comedyData = await tmdb.fetchByGenre(genre2, tmdbType);

                    setRows([
                        { title: `Trending ${title}`, movies: trending },
                        { title: 'Critically Acclaimed', movies: topRated.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Action Packed', movies: actionData.map(tmdb.formatMovie).filter(Boolean) },
                        { title: 'Comedy Gold', movies: comedyData.map(tmdb.formatMovie).filter(Boolean) }
                    ]);
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

                            <h1 className="display-text text-5xl md:text-[6.5rem] font-black tracking-tighter mb-4 leading-[0.9] text-white filter drop-shadow-2xl uppercase italic">
                                {heroMovie.title}
                            </h1>

                            <p className="max-w-2xl text-lg md:text-xl text-white/70 font-medium leading-relaxed drop-shadow-md hidden md:block line-clamp-3">
                                {heroMovie.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 pt-4">
                                <button onClick={() => { setActiveMovieId(heroMovie.id); setCurrentView('player'); }} className="flex items-center gap-4 bg-white text-black px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all duration-500 active:scale-95 shadow-2xl">
                                    <Play fill="currentColor" size={24}/> Play Now
                                </button>
                                <button onClick={() => { setActiveMovieId(heroMovie.id); setCurrentView('details'); }} className="flex items-center gap-4 glass px-10 py-5 rounded-2xl font-black text-xl text-white hover:bg-white/10 transition-all duration-500">
                                    <Info size={24}/> More Info
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
                            onMovieClick={(id) => { setActiveMovieId(id); setCurrentView('details'); }}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
