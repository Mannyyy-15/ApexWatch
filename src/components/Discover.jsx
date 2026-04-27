import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const gridRef = useRef(null);

    // Columns for spatial navigation
    const columns = 4; // TV Optimized grid usually has 4-5 columns

    // Initial Trending Data
    useEffect(() => {
        const loadTrending = async () => {
            setLoading(true);
            try {
                const results1 = await tmdb.fetchTrending();
                const results2 = await tmdb.fetchTrending('movie', 2);
                const combined = [...results1, ...results2];
                setTrending(combined.map(tmdb.formatMovie).filter(Boolean).slice(0, 24));
            } catch (error) {
                console.error('Error loading trending:', error);
            } finally {
                setLoading(false);
            }
        };
        loadTrending();
    }, []);

    // Search logic
    const performSearch = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const results = await tmdb.search(query);
            setSearchResults(results.map(tmdb.formatMovie).filter(Boolean));
            setFocusedIndex(0); // Auto focus first result on TV
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

    const displayMovies = searchQuery.trim() ? searchResults : trending;

    // D-PAD / KEYBOARD NAVIGATION
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (displayMovies.length === 0) return;

            // If index is -1, start at 0 on any arrow key
            if (focusedIndex === -1 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                setFocusedIndex(0);
                return;
            }

            let nextIndex = focusedIndex;

            switch (e.key) {
                case 'ArrowRight':
                    nextIndex = Math.min(focusedIndex + 1, displayMovies.length - 1);
                    break;
                case 'ArrowLeft':
                    nextIndex = Math.max(focusedIndex - 1, 0);
                    break;
                case 'ArrowDown':
                    nextIndex = Math.min(focusedIndex + columns, displayMovies.length - 1);
                    break;
                case 'ArrowUp':
                    nextIndex = Math.max(focusedIndex - columns, 0);
                    break;
                case 'Enter':
                    if (focusedIndex !== -1) {
                        handleMovieClick(displayMovies[focusedIndex].id);
                    }
                    break;
                default:
                    return;
            }

            if (nextIndex !== focusedIndex) {
                e.preventDefault();
                setFocusedIndex(nextIndex);
                
                // Scroll into view
                const element = document.getElementById(`movie-${displayMovies[nextIndex].id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focusedIndex, displayMovies]);

    const handleMovieClick = (id) => {
        setActiveMovieId(id);
        setCurrentView('details');
    };

    return (
        <div className="min-h-screen pt-24 md:pt-32 px-4 md:px-20 pb-32 w-full max-w-[1800px] mx-auto">
            
            {/* TV Optimized Search Bar */}
            <div className="mb-16 max-w-3xl mx-auto px-2">
                <div className={`relative group transition-all duration-500 ${focusedIndex === -1 ? 'scale-105' : 'opacity-50'}`}>
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-white/40 group-focus-within:text-red-500 transition-colors">
                        <Search size={28} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search movies, shows, anime..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setFocusedIndex(-1)}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-[30px] py-7 pl-20 pr-8 text-2xl text-white placeholder-white/20 focus:outline-none focus:border-red-600 focus:bg-black/80 transition-all font-bold shadow-2xl"
                    />
                </div>
            </div>

            {searchQuery && (
                <div className="mb-10 px-4">
                    <p className="text-red-600 text-xs font-black uppercase tracking-[0.3em] italic">
                        Found {searchResults.length} results for "{searchQuery}"
                    </p>
                </div>
            )}

            {/* Grid - TV Optimized (4 columns on large screens for bigger posters) */}
            <div 
                ref={gridRef}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-8 md:gap-12 px-2"
            >
                {loading && displayMovies.length === 0 ? (
                     [...Array(12)].map((_, i) => <MovieCardSkeleton key={i} />)
                ) : (
                    <AnimatePresence mode="popLayout">
                        {displayMovies.map((movie, index) => (
                            <motion.div 
                                id={`movie-${movie.id}`}
                                layout
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ 
                                    opacity: 1, 
                                    y: 0,
                                    scale: focusedIndex === index ? 1.1 : 1,
                                    zIndex: focusedIndex === index ? 10 : 1
                                }} 
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                key={movie.id} 
                                className={`relative cursor-pointer group rounded-[32px] transition-all duration-300 ${
                                    focusedIndex === index ? 'ring-8 ring-red-600 ring-offset-8 ring-offset-black shadow-[0_0_100px_rgba(229,9,20,0.4)]' : ''
                                }`} 
                                onClick={() => handleMovieClick(movie.id)}
                                onMouseEnter={() => setFocusedIndex(index)}
                            >
                                <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden mb-4 border border-white/10">
                                    <img 
                                        src={movie.poster} 
                                        alt={movie.title} 
                                        className={`w-full h-full object-cover transition-transform duration-700 ${focusedIndex === index ? 'scale-110' : ''}`}
                                    />
                                    <div className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent transition-opacity duration-500 ${focusedIndex === index ? 'opacity-100' : 'opacity-60'}`}></div>
                                    
                                    {/* Focus Indicator / Play Icon */}
                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${focusedIndex === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                                        <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(229,9,20,0.6)]">
                                            <Play size={32} className="fill-white text-white ml-1"/>
                                        </div>
                                    </div>

                                    {/* Info Overlay (Always visible on TV when focused) */}
                                    <div className={`absolute bottom-0 left-0 right-0 p-6 transition-all duration-500 ${focusedIndex === index ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                                        <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">{movie.year} • {movie.type}</p>
                                        <h3 className="text-xl font-black text-white leading-tight">{movie.title}</h3>
                                    </div>
                                </div>
                                
                                {/* Static Labels (Visible when not focused or on small screens) */}
                                <div className={`px-2 transition-opacity duration-300 ${focusedIndex === index ? 'opacity-0' : 'opacity-100'}`}>
                                    <h3 className="text-base font-bold text-white truncate">{movie.title}</h3>
                                    <p className="text-[10px] text-white/40 font-black uppercase tracking-wider">{movie.year} • {movie.type}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {!loading && displayMovies.length === 0 && searchQuery && (
                <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
                        <Search size={48} className="text-white/20" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">No Results Found</h2>
                    <p className="text-white/40 max-w-sm text-lg">We couldn't find any content matching your query. Try different keywords.</p>
                </div>
            )}
        </div>
    );
}

