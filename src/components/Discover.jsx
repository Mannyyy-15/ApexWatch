import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Play, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';
import { MovieCardSkeleton } from './Skeleton';

export function Discover() {
    const { setActiveMovieId, setCurrentView, searchQuery, setSearchQuery } = useAppContext();
    const [searchResults, setSearchResults] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initial Trending Data
    useEffect(() => {
        const loadTrending = async () => {
            setLoading(true);
            try {
                const results = await tmdb.fetchTrending();
                setTrending(results.map(tmdb.formatMovie).filter(Boolean).slice(0, 20));
            } catch (error) {
                console.error('Error loading trending:', error);
            } finally {
                setLoading(false);
            }
        };
        loadTrending();
    }, []);

    // Search logic with global query
    const performSearch = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const results = await tmdb.search(query);
            setSearchResults(results.map(tmdb.formatMovie).filter(Boolean));
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (searchQuery) {
            performSearch(searchQuery);
        }
    }, [searchQuery, performSearch]);

    const handleMovieClick = (id) => {
        setActiveMovieId(id);
        setCurrentView('details');
    };

    const displayMovies = searchQuery.trim() ? searchResults : trending;

    return (
        <div className="min-h-screen pt-24 md:pt-32 px-4 md:px-20 pb-32 w-full max-w-[1600px] mx-auto">
            
            {/* Search Bar - Main Action */}
            <div className="mb-12 max-w-2xl mx-auto px-2">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/40 group-focus-within:text-red-500 transition-colors">
                        <Search size={22} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search for movies, TV series..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-xl text-white placeholder-white/20 focus:outline-none focus:border-red-600 focus:bg-black transition-all font-medium shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-5 flex items-center text-white/40 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {searchQuery && (
                <div className="mb-8 px-4">
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                        Found {searchResults.length} matches for "{searchQuery}"
                    </p>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 tv:grid-cols-8 gap-4 md:gap-6 px-2">
                {loading && displayMovies.length === 0 ? (
                     [...Array(24)].map((_, i) => <MovieCardSkeleton key={i} />)
                ) : (
                    <AnimatePresence mode="popLayout">
                        {displayMovies.map((movie) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.9 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.9 }} 
                                transition={{ duration: 0.3 }}
                                key={movie.id} 
                                className="group relative cursor-pointer outline-none" 
                                onClick={() => handleMovieClick(movie.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleMovieClick(movie.id);
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label={`View details for ${movie.title}`}
                            >
                                <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden mb-2 border border-white/10 group-hover:border-red-600/50 transition-colors">
                                    <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60"></div>
                                    
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                                            <Play size={24} className="fill-white text-white ml-1"/>
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-bold text-white group-hover:text-red-500 transition-colors truncate px-1">{movie.title}</h3>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-wider px-1">{movie.year} • {movie.type}</p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {!loading && displayMovies.length === 0 && searchQuery && (
                <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Search size={40} className="text-white/20" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">No Results Found</h2>
                    <p className="text-white/40 max-w-xs">We couldn't find any content matching your query. Try different keywords.</p>
                </div>
            )}
        </div>
    );
}
