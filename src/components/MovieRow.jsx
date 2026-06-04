import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const MovieCard = React.memo(({ movie, index, isContinueWatching, isTop10, progress, onMovieClick }) => {
    const { watchlist, toggleWatchlist } = useAppContext();
    const isInWatchlist = watchlist.some(item => item.contentId === movie.id);
    const rank = index + 1;

    return (
        <div
            className={`flex-shrink-0 snap-start cursor-pointer transition-all duration-500 group tv-focusable
                ${isTop10
                    ? 'w-[calc((100vw-48px-24px)/2.4)] md:w-[calc((100vw-160px-100px)/5)] pl-8 md:pl-10'
                    : isContinueWatching 
                        ? 'w-[calc((100vw-48px-12px)/1.5)] md:w-[calc((100vw-160px-40px)/3)]' 
                        : 'w-[calc((100vw-48px-24px)/3)] md:w-[calc((100vw-160px-100px)/6)]'
                }`}
            style={isTop10 ? { position: 'relative' } : {}}
            onClick={(e) => {
                if (e.target.closest('.watchlist-btn')) return;
                onMovieClick(movie.id, movie.type);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') onMovieClick(movie.id, movie.type);
            }}
            tabIndex={0}
            role="button"
            aria-label={`#${rank} ${movie.title}`}
        >
            {/* Top 10 Rank Number */}
            {isTop10 && (
                <div
                    className="absolute left-0 bottom-8 md:bottom-10 z-20 select-none pointer-events-none"
                    style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: 'clamp(72px, 14vw, 130px)',
                        fontWeight: '900',
                        fontStyle: 'italic',
                        lineHeight: 1,
                        color: 'transparent',
                        WebkitTextStroke: rank <= 3 ? '2px rgba(229,9,20,0.9)' : '2px rgba(255,255,255,0.35)',
                        textShadow: rank <= 3 ? '0 0 40px rgba(229,9,20,0.3)' : 'none',
                        userSelect: 'none',
                    }}
                >
                    {rank}
                </div>
            )}

            {/* Thumbnail Container */}
            <div className={`relative ${isContinueWatching ? 'aspect-video' : 'aspect-[2/3]'} rounded-xl md:rounded-[20px] overflow-hidden mb-2 md:mb-3.5 border border-white/10 shadow-2xl transition-all duration-500 group-hover:border-accent/40 group-hover:shadow-[0_0_30px_rgba(229,9,20,0.25)]`}>
                <img
                    src={isContinueWatching ? (movie.backdrop || movie.poster) : movie.poster}
                    alt={movie.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-[0.16,1,0.3,1] group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500"></div>

                {isContinueWatching && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                        <div className="h-full bg-accent shadow-[0_0_10px_rgba(229,9,20,0.8)]" style={{ width: `${progress}%` }}></div>
                    </div>
                )}

                {!isContinueWatching && (
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-2">
                        <span className="px-1.5 py-0.5 bg-[#0a0a0a]/80 backdrop-blur-md text-white/95 text-[8px] md:text-[9px] font-black rounded border border-white/5 shadow-lg uppercase tracking-tighter">
                            {movie.rating}
                        </span>
                    </div>
                )}

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(movie);
                    }}
                    className="watchlist-btn absolute top-2 right-2 md:top-3 md:right-3 w-7 h-7 md:w-8 md:h-8 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-accent hover:border-accent hover:scale-105 active:scale-95 z-30 cursor-pointer"
                    aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                >
                    {isInWatchlist ? <Check size={14} className="md:w-4 md:h-4" /> : <Plus size={14} className="md:w-4 md:h-4" />}
                </button>
            </div>

            {/* Text Content */}
            <div className="px-0.5">
                <h3 className="text-[10px] md:text-sm font-bold text-white truncate mb-0.5 transition-colors duration-300 group-hover:text-accent">
                    {movie.title}
                </h3>
                <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-white/40 font-black uppercase tracking-wider">
                    {isContinueWatching && movie.type === 'tv' && movie.season !== undefined ? (
                        <span className="text-accent">S{movie.season} E{movie.episode}</span>
                    ) : (
                        <span>{movie.year}</span>
                    )}
                    <span className="w-0.5 h-0.5 bg-white/20 rounded-full"></span>
                    <span>{movie.type === 'tv' ? 'TV' : 'Movie'}</span>
                </div>
            </div>
        </div>
    );
});

export function MovieRow({ title, subtitle = "ApexWatch Curated Collection", movies, isContinueWatching = false, isTop10 = false, continueWatchingItems, onMovieClick, onRemoveFromContinueWatching }) {
    const rowRef = useRef(null);
    const [showArrows, setShowArrows] = useState(false);
    const [isAtStart, setIsAtStart] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(false);

    if (!movies || movies.length === 0) return null;

    const handleScroll = () => {
        if (!rowRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
        setIsAtStart(scrollLeft <= 10);
        setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 10);
    };

    useEffect(() => {
        handleScroll();
        // Recalculate on window resize
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [movies]);

    const scroll = (direction) => {
        if (rowRef.current) {
            const container = rowRef.current;
            const firstCard = container.querySelector('div');
            if (firstCard) {
                const cardWidth = firstCard.offsetWidth;
                const gap = parseInt(window.getComputedStyle(container).gap) || 0;
                const scrollAmount = direction === 'left' ? -(cardWidth + gap) * 2 : (cardWidth + gap) * 2;
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    const hasScroll = movies.length > 3;

    return (
        <section
            className="relative group/row mb-12 md:mb-16"
            onMouseEnter={() => setShowArrows(true)}
            onMouseLeave={() => setShowArrows(false)}
        >
            {title && (
                <div className="flex items-center justify-between mb-5 md:mb-6 px-1">
                    <div className="flex items-center gap-3.5 md:gap-4">
                        <div className="w-1 h-6 md:h-8 bg-accent rounded-full shadow-[0_0_15px_rgba(229,9,20,0.6)]"></div>
                        <div>
                            <h2 className="text-lg md:text-2xl font-black text-white tracking-tighter uppercase leading-none italic">
                                {title}
                            </h2>
                            <p className="text-[8px] md:text-[9px] text-white/30 font-black uppercase tracking-[0.25em] mt-1.5">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative">
                <AnimatePresence>
                    {showArrows && hasScroll && (
                        <>
                            {!isAtStart && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => scroll('left')}
                                    className={`absolute left-2 md:left-4 z-40 w-12 h-12 md:w-14 md:h-14 bg-black/60 hover:bg-accent backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:border-accent transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(229,9,20,0.5)] cursor-pointer hover:scale-110 active:scale-95 hidden md:flex -translate-y-1/2 ${
                                        isContinueWatching ? 'top-[35%]' : 'top-[42%]'
                                    }`}
                                >
                                    <ChevronLeft size={24} className="md:w-7 md:h-7 text-white" />
                                </motion.button>
                            )}

                            {!isAtEnd && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => scroll('right')}
                                    className={`absolute right-2 md:right-4 z-40 w-12 h-12 md:w-14 md:h-14 bg-black/60 hover:bg-accent backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:border-accent transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(229,9,20,0.5)] cursor-pointer hover:scale-110 active:scale-95 hidden md:flex -translate-y-1/2 ${
                                        isContinueWatching ? 'top-[35%]' : 'top-[42%]'
                                    }`}
                                >
                                    <ChevronRight size={24} className="md:w-7 md:h-7 text-white" />
                                </motion.button>
                            )}
                        </>
                    )}
                </AnimatePresence>

                <div
                    ref={rowRef}
                    onScroll={handleScroll}
                    className="flex gap-4 md:gap-5 overflow-x-auto hide-scrollbar pr-10 snap-x snap-mandatory scroll-smooth"
                >
                    {movies.map((movie, index) => {
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
                                isTop10={isTop10}
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
