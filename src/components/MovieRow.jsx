import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MovieRow({ title, movies, isContinueWatching = false, continueWatchingItems, onMovieClick, onRemoveFromContinueWatching }) {
    const rowRef = useRef(null);
    const [showArrows, setShowArrows] = useState(false);

    if (!movies || movies.length === 0) return null;

    // Create infinite loop by duplicating items
    const infiniteMovies = [...movies, ...movies, ...movies];

    useEffect(() => {
        // Start in the middle set of movies for infinite feel
        if (rowRef.current) {
            const singleSetWidth = rowRef.current.scrollWidth / 3;
            rowRef.current.scrollLeft = singleSetWidth;
        }
    }, [movies]);

    const handleInfiniteScroll = () => {
        if (!rowRef.current) return;
        const { scrollLeft, scrollWidth } = rowRef.current;
        const singleSetWidth = scrollWidth / 3;

        // Reset to middle if we scroll too far left
        if (scrollLeft < singleSetWidth / 2) {
            rowRef.current.scrollTo({ left: scrollLeft + singleSetWidth, behavior: 'instant' });
        }
        // Reset to middle if we scroll too far right
        else if (scrollLeft > singleSetWidth * 1.5) {
            rowRef.current.scrollTo({ left: scrollLeft - singleSetWidth, behavior: 'instant' });
        }
    };

    const scroll = (direction) => {
        if (rowRef.current) {
            const { clientWidth } = rowRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
            rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section 
            className="relative group/row mb-8" 
            onMouseEnter={() => setShowArrows(true)}
            onMouseLeave={() => setShowArrows(false)}
        >
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-red-600 rounded-full shadow-[0_0_15px_rgba(229,9,20,0.6)]"></div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">
                            {title}
                        </h2>
                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mt-1.5">
                            Nexus Curated Collection
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="relative">
                <AnimatePresence>
                    {showArrows && (
                        <>
                            <motion.button 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onClick={() => scroll('left')}
                                className="absolute left-0 top-[40%] -translate-y-1/2 z-40 w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white hover:text-black transition-all shadow-2xl ml-[-20px] hidden md:flex"
                            >
                                <ChevronLeft size={24} />
                            </motion.button>
                            
                            <motion.button 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onClick={() => scroll('right')}
                                className="absolute right-0 top-[40%] -translate-y-1/2 z-40 w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white hover:text-black transition-all shadow-2xl mr-[-20px] hidden md:flex"
                            >
                                <ChevronRight size={24} />
                            </motion.button>
                        </>
                    )}
                </AnimatePresence>

                <div 
                    ref={rowRef}
                    onScroll={handleInfiniteScroll}
                    className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar pb-8 pr-10 snap-x snap-mandatory scroll-smooth"
                >
                    {infiniteMovies.map((movie, index) => {
                        let progress = 0;
                        if (isContinueWatching && continueWatchingItems) {
                            const item = continueWatchingItems.find(i => i.id === movie.id);
                            if (item) progress = item.progress;
                        }
                        
                        return (
                            <div 
                                key={`${movie.id}-${index}`} 
                                className={`flex-shrink-0 snap-start cursor-pointer transition-all duration-500 ${isContinueWatching ? 'w-[280px] md:w-[320px]' : 'w-[150px] md:w-[190px] lg:w-[220px]'}`} 
                                onClick={() => onMovieClick(movie.id)}
                            >
                                {/* Thumbnail Container */}
                                <div className={`group relative ${isContinueWatching ? 'aspect-video' : 'aspect-[2/3]'} rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-2xl transition-all duration-700 ease-[0.16,1,0.3,1] hover:border-white/30 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]`}>
                                    <img 
                                        src={isContinueWatching ? (movie.backdrop || movie.poster) : movie.poster} 
                                        alt={movie.title} 
                                        loading="lazy" 
                                        className="w-full h-full object-cover transition-transform duration-1000 ease-[0.16,1,0.3,1] group-hover:scale-110"
                                    />
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500"></div>

                                    {isContinueWatching && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                                            <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(229,9,20,0.8)]" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    )}
                                    
                                    {!isContinueWatching && (
                                        <div className="absolute top-3 left-3">
                                            <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-black rounded-md shadow-lg border border-white/10 uppercase tracking-tighter">
                                                {movie.rating}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Text Content */}
                                <div className="px-1">
                                    <h3 className="text-sm md:text-base font-bold text-white truncate mb-1.5 transition-colors duration-300 group-hover:text-red-500">
                                        {movie.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-white/40 font-bold uppercase tracking-wider">
                                        <span>{movie.year}</span>
                                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                        <span>{movie.type === 'tv' ? 'TV Series' : 'Movie'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
