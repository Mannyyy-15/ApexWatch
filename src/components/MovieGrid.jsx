import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useMemo } from 'react';
import { Play, Plus, Film, Check, ChevronDown, Loader2 } from 'lucide-react';
import { MovieRow } from './MovieRow';
import { tmdb } from '../utils/tmdb';
import { MovieCardSkeleton, RowSkeleton } from './Skeleton';

const featuredGenres = [
    'For You', 'Trending', 'New Releases', 'Action', 'Sci-Fi', 'Animation', 'Horror', 'Comedy'
];

export function MovieGrid() {
    const { setActiveMovieId, setCurrentView, user, activeProfile } = useAppContext();
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [popularMovies, setPopularMovies] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Trending');
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [genreMovies, setGenreMovies] = useState([]);
    const [page, setPage] = useState(1);

    const genreMap = {
        'Action': 28,
        'Adventure': 12,
        'Animation': 16,
        'Fiction': 878,
        'Heroes': 10759,
        'Comedy': 35,
        'Drama': 18,
        'Horror': 27
    };

    // Combined Data Fetching Logic
    const loadContent = async (isLoadMore = false) => {
        if (!isLoadMore) setLoading(true);
        else setLoadingMore(true);
        
        try {
            const timer = new Promise(resolve => setTimeout(resolve, isLoadMore ? 1000 : 800));
            
            const genreId = selectedGenre ? genreMap[selectedGenre] : null;
            const targetPage = isLoadMore ? page + 1 : 1;

            let url = `https://api.themoviedb.org/3/discover/movie?api_key=7d43baf815f5ee19cbd9a07736e34098&include_adult=false&include_video=false&language=en-US&page=${targetPage}`;

            if (genreId) url += `&with_genres=${genreId}`;

            switch(selectedCategory) {
                case 'Trending': url += `&sort_by=popularity.desc`; break;
                case 'Popular': url += `&sort_by=vote_count.desc`; break;
                case 'Recently Added': url += `&sort_by=primary_release_date.desc&primary_release_date.lte=${new Date().toISOString().split('T')[0]}`; break;
                case 'Premium': url += `&sort_by=vote_average.desc&vote_average.gte=7.5&vote_count.gte=500`; break;
                default: url += `&sort_by=popularity.desc`;
            }

            const [response] = await Promise.all([
                fetch(url).then(res => res.json()),
                timer
            ]);

            const results = response.results?.map(tmdb.formatMovie).filter(Boolean) || [];
            
            if (isLoadMore) {
                setGenreMovies(prev => [...prev, ...results]);
                setPage(targetPage);
            } else {
                setGenreMovies(results);
                setPage(1);
            }

            if (trendingMovies.length === 0) {
                const [tRaw, pRaw] = await Promise.all([tmdb.fetchTrending(), tmdb.fetchPopular()]);
                setTrendingMovies(tRaw.map(tmdb.formatMovie).filter(Boolean));
                setPopularMovies(pRaw.map(tmdb.formatMovie).filter(Boolean));
            }

        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        loadContent(false);
    }, [selectedCategory, selectedGenre, activeProfile, user]);

    const activeContent = genreMovies;

    if (loading && trendingMovies.length === 0) {
        return (
            <div className="px-6 md:px-20 -mt-20 space-y-20 pb-32">
                <RowSkeleton />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                    {[...Array(12)].map((_, i) => <MovieCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    const handleMovieClick = (id) => {
        setActiveMovieId(id);
        setCurrentView('details');
    };

    const categories = [
        { name: 'Trending' },
        { name: 'Popular' },
        { name: 'Recently Added' },
        { name: 'Premium' }
    ];

    const genres = ['Action', 'Adventure', 'Animation', 'Fiction', 'Heroes', 'Comedy', 'Drama', 'Horror'];

    return (
        <div className="relative z-20 px-6 md:px-20 -mt-20 flex flex-col gap-6 pb-32">
            
            {/* Top Row: Refined Popular Now Section */}
            <section className="mb-2 md:mb-4 pt-12 md:pt-0">
                <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex flex-col">
                        <h2 className="text-lg md:text-2xl font-black text-white/90 uppercase tracking-[0.2em]">Popular <span className="text-red-600">Now</span></h2>
                        <div className="w-12 h-1 bg-red-600 mt-2 rounded-full opacity-50"></div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === 0 ? 'w-8 bg-red-600' : 'w-2 bg-white/10'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar py-2 -mx-6 px-6 md:-mx-2 md:px-2">
                    {popularMovies.slice(0, 10).map((movie, idx) => (
                        <div 
                            key={movie.id} 
                            onClick={() => handleMovieClick(movie.id)}
                            className="min-w-[130px] sm:min-w-[160px] md:min-w-[180px] aspect-[2/3] relative group cursor-pointer"
                        >
                            <img 
                                src={movie.poster} 
                                className="w-full h-full object-cover rounded-xl md:rounded-2xl border border-white/5 transition-all duration-500 group-hover:scale-105 group-hover:border-white/20 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]" 
                                alt={movie.title} 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl md:rounded-2xl"></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Premium Category Selector */}
            <div className="flex items-center md:justify-center gap-8 md:gap-16 border-b border-white/5 pb-6 md:pb-10 overflow-x-auto hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
                {categories.map((cat) => (
                    <button 
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`flex flex-col items-center gap-3 md:gap-4 relative group transition-all flex-shrink-0 ${
                            selectedCategory === cat.name ? 'text-white' : 'text-white/30 hover:text-white/60'
                        }`}
                    >
                        <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all ${
                            selectedCategory === cat.name ? 'opacity-100 scale-110' : 'opacity-50 group-hover:opacity-100'
                        }`}>
                            {cat.name}
                        </span>
                        {selectedCategory === cat.name && (
                            <motion.div 
                                layoutId="active-cat-indicator"
                                className="w-8 md:w-12 h-0.5 md:h-1 bg-red-600 rounded-full shadow-[0_0_20px_rgba(229,9,20,0.8)]"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Genre Ribbon */}
            <div className="flex gap-3 md:gap-4 overflow-x-auto hide-scrollbar items-center md:justify-center -mx-6 px-6 md:mx-0 md:px-0">
                <button 
                    onClick={() => { setSelectedGenre(null); setSelectedCategory('Trending'); }}
                    className={`px-6 md:px-10 py-2.5 md:py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all border flex-shrink-0 ${
                        !selectedGenre 
                        ? 'bg-red-600 text-white border-red-600 shadow-[0_0_20px_rgba(229,9,20,0.4)]' 
                        : 'glass text-white/40 border-white/5 hover:text-white'
                    }`}
                >
                    All
                </button>
                {genres.map((genre) => (
                    <button 
                        key={genre}
                        onClick={() => setSelectedGenre(genre)}
                        className={`px-6 md:px-10 py-2.5 md:py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all border flex-shrink-0 ${
                            selectedGenre === genre 
                            ? 'bg-red-600 text-white border-red-600 shadow-[0_0_20px_rgba(229,9,20,0.4)]' 
                            : 'glass text-white/40 border-white/5 hover:text-white'
                        }`}
                    >
                        {genre}
                    </button>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5 pt-8 md:pt-12">
                <AnimatePresence mode="popLayout">
                    {activeContent.map((movie, idx) => (
                        <motion.div 
                            key={`${movie.id}-${idx}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            className="group flex flex-col gap-2 cursor-pointer"
                            onClick={() => handleMovieClick(movie.id)}
                        >
                            <div className="relative aspect-[2/3] overflow-hidden rounded-[2.5rem] border border-white/5 transition-all duration-700 group-hover:scale-[1.05] group-hover:border-white/20 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
                                <img src={movie.poster} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={movie.title} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                            <div className="space-y-1.5 px-2">
                                <h4 className="font-bold text-sm text-white truncate group-hover:text-red-500 transition-colors tracking-tight">
                                    {movie.title}
                                </h4>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/30 font-black uppercase tracking-tighter">
                                        {movie.year} • {movie.rating}
                                    </span>
                                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                        <div className="w-1 h-1 bg-red-600 rounded-full shadow-[0_0_5px_rgba(229,9,20,1)]"></div>
                                        <span className="text-[9px] font-black text-white/40 tracking-tighter">HD</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {loadingMore && [...Array(6)].map((_, i) => (
                        <MovieCardSkeleton key={`skeleton-${i}`} />
                    ))}
                </AnimatePresence>
            </div>

            {/* Load More Action */}
            {!loading && activeContent.length > 0 && (
                <div className="flex justify-center pt-10">
                    <button 
                        onClick={() => loadContent(true)}
                        disabled={loadingMore}
                        className="group flex items-center gap-4 px-12 py-5 glass rounded-full text-xs font-black uppercase tracking-[0.3em] text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all border border-white/5 disabled:opacity-50"
                    >
                        {loadingMore ? (
                            <Loader2 size={18} className="animate-spin text-red-600" />
                        ) : (
                            <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
                        )}
                        {loadingMore ? 'Syncing...' : 'Show More'}
                    </button>
                </div>
            )}
        </div>
    );
}
