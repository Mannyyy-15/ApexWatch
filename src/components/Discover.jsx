import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Play, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';
import { MovieCardSkeleton } from './Skeleton';

export function Discover() {
    const { setActiveMovieId, setActiveMediaType, setCurrentView, searchQuery, setSearchQuery, discoverCache, setDiscoverCache } = useAppContext();
    const [searchResults, setSearchResults] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeGenre, setActiveGenre] = useState('trending');
    const [recentSearches, setRecentSearches] = useState(() => {
        const saved = localStorage.getItem('apexwatch_recent_searches');
        return saved ? JSON.parse(saved) : [];
    });

    const saveRecentSearch = (query) => {
        if (!query.trim()) return;
        setRecentSearches(prev => {
            const updated = [query.trim(), ...prev.filter(q => q.toLowerCase() !== query.trim().toLowerCase())].slice(0, 3);
            localStorage.setItem('apexwatch_recent_searches', JSON.stringify(updated));
            return updated;
        });
    };

    const GENRES = [
        { id: 'trending', name: 'Trending Now' },
        { id: 28, name: 'Action', type: 'movie' },
        { id: 35, name: 'Comedy', type: 'movie' },
        { id: 18, name: 'Drama', type: 'movie' },
        { id: 878, name: 'Sci-Fi', type: 'movie' },
        { id: 27, name: 'Horror', type: 'movie' },
        { id: 10749, name: 'Romance', type: 'movie' },
        { id: 99, name: 'Documentaries', type: 'movie' },
        { id: 16, name: 'Anime', type: 'tv' }
    ];

    // Initial Trending/Mixed Data
    useEffect(() => {
        const loadContent = async () => {
            if (discoverCache) {
                setTrending(discoverCache);
                return;
            }

            setLoading(true);
            try {
                const [trendingRaw, movies, tv, anime] = await Promise.all([
                    tmdb.fetchTrending('all'),
                    tmdb.fetchPopular('movie'),
                    tmdb.fetchPopular('tv'),
                    tmdb.fetchDiscover('tv', { with_genres: 16, with_keywords: '210024' })
                ]);
                
                const allContent = [...trendingRaw, ...movies, ...tv, ...anime]
                    .map(tmdb.formatMovie)
                    .filter(Boolean);
                
                // Filter unique IDs
                const uniqueMixed = Array.from(new Map(allContent.map(item => [item.id, item])).values());
                
                // Shuffle for variety
                const shuffled = uniqueMixed.sort(() => 0.5 - Math.random());
                const finalContent = shuffled.slice(0, 60);
                
                setTrending(finalContent);
                setDiscoverCache(finalContent);
            } catch (error) {
                console.error('Error loading content:', error);
            } finally {
                setLoading(false);
            }
        };
        loadContent();
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
            const formatted = results.map(tmdb.formatMovie).filter(Boolean);
            const uniqueResults = Array.from(new Map(formatted.map(item => [item.id, item])).values());
            setSearchResults(uniqueResults);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (searchQuery) {
            setActiveGenre(null);
            performSearch(searchQuery);
        }
    }, [searchQuery, performSearch]);

    const handleGenreClick = async (genre) => {
        setSearchQuery('');
        setActiveGenre(genre.id);
        if (genre.id === 'trending') {
            return;
        }
        setLoading(true);
        try {
            let results = [];
            if (genre.name === 'Anime') {
                results = await tmdb.fetchDiscover('tv', { with_genres: 16, with_keywords: '210024' });
            } else {
                results = await tmdb.fetchByGenre(genre.id, genre.type);
            }
            setSearchResults(results.map(tmdb.formatMovie).filter(Boolean));
        } catch (error) {
            console.error('Error fetching genre results:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMovieClick = (id, type) => {
        if (searchQuery.trim()) {
            saveRecentSearch(searchQuery);
        }
        setActiveMovieId(id);
        setActiveMediaType(type || 'movie');
        setCurrentView('details');
    };

    const displayMovies = searchQuery.trim() 
        ? searchResults 
        : (activeGenre && activeGenre !== 'trending' ? searchResults : trending);

    return (
        <div className="discover-container min-h-screen pt-28 md:pt-36 px-4 md:px-16 lg:px-20 pb-32 w-full max-w-[1600px] mx-auto relative z-10">
            
            {/* Search Bar */}
            <div className="mb-6 md:mb-12 w-full max-w-5xl mx-auto px-2">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-4 md:left-6 flex items-center pointer-events-none text-white/40 group-focus-within:text-white transition-colors">
                        <Search size={18} className="md:w-[28px] md:h-[28px]" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Movies, shows and more" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1A1A24]/60 border border-white/10 rounded-xl md:rounded-2xl py-3.5 md:py-6 pl-12 md:pl-20 pr-12 md:pr-16 text-base md:text-2xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-[#1A1A24] transition-all font-semibold shadow-2xl"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-4 md:right-6 flex items-center text-white/40 hover:text-white transition-colors"
                        >
                            <X size={20} className="md:w-7 md:h-7" />
                        </button>
                    )}
                </div>
            </div>

            {/* Recent Searches (Only visible when search bar is empty) */}
            {!searchQuery.trim() && recentSearches.length > 0 && (
                <div className="mb-8 md:mb-10 w-full max-w-5xl mx-auto px-4 md:px-2">
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <span className="text-[10px] md:text-xs text-white/40 font-black uppercase tracking-widest">Recent Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5 md:gap-3">
                        {recentSearches.map((term, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSearchQuery(term)}
                                className="flex items-center gap-1.5 px-3.5 md:px-5 py-1.5 md:py-2.5 bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all font-bold text-xs md:text-sm uppercase tracking-wider cursor-pointer"
                            >
                                <span>{term}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Horizontal Genre Filters Strip */}
            <div className="flex md:flex-wrap items-center md:justify-center gap-2.5 md:gap-3.5 overflow-x-auto hide-scrollbar py-3.5 md:py-0 mb-8 md:mb-12 -mx-4 px-4 md:-mx-0 md:px-0 scroll-smooth border-b border-white/5 md:border-none">
                {GENRES.map((genre) => {
                    const isActive = activeGenre === genre.id;
                    return (
                        <button
                            key={genre.id}
                            onClick={() => handleGenreClick(genre)}
                            className={`genre-filter-button flex-shrink-0 px-5 md:px-6 py-2.5 md:py-3 rounded-full font-black text-[10px] md:text-sm uppercase tracking-widest transition-all duration-300 border cursor-pointer select-none active:scale-95 tv-focusable ${
                                isActive
                                    ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105'
                                    : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/10'
                            }`}
                        >
                            {genre.name}
                        </button>
                    );
                })}
            </div>

            {/* Results Header - Only if searching */}
            {searchQuery.trim() && (
                <div className="mb-8 md:mb-12 relative z-20">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-1.5 h-8 bg-red-600 rounded-full shadow-[0_0_20px_rgba(229,9,20,0.6)]"></div>
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                                Search <span className="text-red-600">Results</span>
                            </h2>
                            <p className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mt-1.5">
                                Found {searchResults.length} matches for "{searchQuery}"
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 tv:grid-cols-8 gap-4 md:gap-6 px-1">
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
                                onClick={() => handleMovieClick(movie.id, movie.type)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleMovieClick(movie.id, movie.type);
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label={`View details for ${movie.title}`}
                            >
                                <div className="relative aspect-[2/3] rounded-xl md:rounded-[24px] overflow-hidden mb-1.5 md:mb-2 border border-white/10 group-hover:border-red-600/50 transition-colors">
                                    <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60"></div>
                                </div>
                                <h3 className="text-[10px] md:text-sm font-bold text-white group-hover:text-red-500 transition-colors truncate px-0.5">{movie.title}</h3>
                                <div className="flex items-center gap-1 text-[8px] md:text-[10px] text-white/40 font-black uppercase tracking-wider px-0.5">
                                    <span>{movie.year}</span>
                                    <span>•</span>
                                    <span>{movie.type === 'tv' ? 'TV' : 'Movie'}</span>
                                </div>
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
