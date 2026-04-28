import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const MovieCard = React.memo(({ movie, index, isContinueWatching, progress, onMovieClick }) => {
    const { watchlist, toggleWatchlist } = useAppContext();
    const isInWatchlist = watchlist.some(item => item.contentId === movie.id);

    return (
        <div
            className={`flex-shrink-0 snap-start cursor-pointer transition-all duration-500 
                ${isContinueWatching 
                    ? 'w-[calc((100vw-48px-12px)/1.5)] md:w-[calc((100vw-160px-40px)/3)]' 
                    : 'w-[calc((100vw-48px-24px)/3)] md:w-[calc((100vw-160px-100px)/6)]'
                }`}
            onClick={(e) => {
                if (e.target.closest('.watchlist-btn')) return;
                onMovieClick(movie.id, movie.type);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') onMovieClick(movie.id, movie.type);
            }}
            tabIndex={0}
            role="button"
            aria-label={`View details for ${movie.title}`}
        >
            {/* Thumbnail Container */}
            <div className={`group relative ${isContinueWatching ? 'aspect-video' : 'aspect-[2/3]'} rounded-xl md:rounded-2xl overflow-hidden mb-2 md:mb-4 border border-white/10 shadow-2xl transition-all duration-700 ease-[0.16,1,0.3,1] hover:border-white/30 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]`}>
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
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-2">
                        <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-black/60 backdrop-blur-md text-white/90 text-[8px] md:text-[10px] font-black rounded md:rounded-md shadow-lg border border-white/10 uppercase tracking-tighter">
                            {movie.rating}
                        </span>
                    </div>
                )}

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(movie);
                    }}
                    className="watchlist-btn absolute top-2 right-2 md:top-3 md:right-3 w-7 h-7 md:w-9 md:h-9 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:text-black hover:scale-110 active:scale-95 z-30"
                    aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                >
                    {isInWatchlist ? <Check size={16} className="md:w-5 md:h-5" /> : <Plus size={16} className="md:w-5 md:h-5" />}
                </button>
            </div>

            {/* Text Content */}
            <div className="px-0.5">
                <h3 className="text-[11px] md:text-base font-bold text-white truncate mb-1 transition-colors duration-300 group-hover:text-red-500">
                    {movie.title}
                </h3>
                <div className="flex items-center gap-1.5 text-[9px] md:text-xs text-white/40 font-bold uppercase tracking-wider">
                    <span>{movie.year}</span>
                    <span className="w-0.5 h-0.5 bg-white/20 rounded-full"></span>
                    <span>{movie.type === 'tv' ? 'TV' : 'Movie'}</span>
                </div>
            </div>
        </div>
    );
});

export function MovieRow({ title, movies, isContinueWatching = false, continueWatchingItems, onMovieClick, onRemoveFromContinueWatching }) {
    const rowRef = useRef(null);
    const [showArrows, setShowArrows] = useState(false);

    if (!movies || movies.length === 0) return null;

    // Only create infinite loop towards the right if we have enough items
    const shouldLoop = movies.length >= 6;
    const infiniteMovies = shouldLoop ? [...movies, ...movies] : movies;
    const [isAtStart, setIsAtStart] = useState(true);

    const handleInfiniteScroll = () => {
        if (!rowRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;

        // Update at-start state for arrows
        setIsAtStart(scrollLeft <= 10);

        if (!shouldLoop) return;

        const singleSetWidth = scrollWidth / 2;

        // Reset to start if we scroll too far right (past the first set)
        if (scrollLeft >= singleSetWidth) {
            rowRef.current.scrollTo({ left: scrollLeft - singleSetWidth, behavior: 'instant' });
        }
    };

    const scroll = (direction) => {
        if (rowRef.current) {
            const container = rowRef.current;
            const firstCard = container.querySelector('div');
            if (firstCard) {
                const cardWidth = firstCard.offsetWidth;
                const gap = parseInt(window.getComputedStyle(container).gap) || 0;
                const scrollAmount = direction === 'left' ? -(cardWidth + gap) : (cardWidth + gap);
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <section
            className="relative group/row mb-12 md:mb-20"
            onMouseEnter={() => setShowArrows(true)}
            onMouseLeave={() => setShowArrows(false)}
        >
            <div className="flex items-center justify-between mb-6 md:mb-8 px-1">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-1.5 md:w-2 h-10 md:h-12 bg-red-600 rounded-full shadow-[0_0_20px_rgba(229,9,20,0.8)]"></div>
                    <div>
                        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none italic">
                            {title}
                        </h2>
                        <p className="text-[10px] md:text-xs text-white/30 font-black uppercase tracking-[0.3em] mt-2 md:mt-3">
                            ApexWatch Curated Collection
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative">
                <AnimatePresence>
                    {showArrows && shouldLoop && (
                        <>
                            {!isAtStart && (
                                <motion.button
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onClick={() => scroll('left')}
                                    className="absolute left-0 top-[40%] -translate-y-1/2 z-40 w-12 h-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white hover:text-black transition-all shadow-2xl ml-[-20px] hidden md:flex"
                                >
                                    <ChevronLeft size={24} />
                                </motion.button>
                            )}

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
                    className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar  pr-10 snap-x snap-mandatory scroll-smooth"
                >
                    {infiniteMovies.map((movie, index) => {
                        let progress = 0;
                        if (isContinueWatching && continueWatchingItems) {
                            const item = continueWatchingItems.find(i => i.id === movie.id);
                            if (item) progress = item.progress;
                        }

                        return (
                            <MovieCard
                                key={`${movie.id}-${index}`}
                                movie={movie}
                                index={index}
                                isContinueWatching={isContinueWatching}
                                progress={progress}
                                onMovieClick={onMovieClick}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
