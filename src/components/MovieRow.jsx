import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Check, MoreVertical, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';

const MovieCard = React.memo(({ movie, index, isContinueWatching, isTop10, progress, onMovieClick, onRemoveFromContinueWatching }) => {
  const { watchlist, toggleWatchlist } = useAppContext();
  const isInWatchlist = watchlist.some(item => item.contentId === movie.id);
  const [showMenu, setShowMenu] = useState(false);
  const rank = index + 1;

  const [isHovered, setIsHovered] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const hoverTimerRef = useRef(null);

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(async () => {
      setIsHovered(true);
      if (!trailerKey) {
        try {
          const data = movie.type === 'tv' 
            ? await tmdb.fetchTVDetails(movie.id)
            : await tmdb.fetchMovieDetails(movie.id);
          const trailer = data?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
          if (trailer) setTrailerKey(trailer.key);
        } catch(e) {}
      }
    }, 1200);
  };
  
  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsHovered(false);
  };

  return (
    <div
      className={`flex-shrink-0 snap-start cursor-pointer transition-transform duration-200 group tv-focusable active:scale-[0.98] will-change-transform
      ${isTop10
        ? 'movie-card-top10 w-[calc((100vw-36px)/1.9)] sm:w-[calc((100vw-48px)/2.8)] md:w-[calc((100vw-160px-100px)/5)] min-w-[155px] sm:min-w-[190px] md:min-w-[210px] pl-8 sm:pl-10 md:pl-12'
        : isContinueWatching 
        ? 'movie-card-cw w-[calc((100vw-36px)/1.35)] sm:w-[calc((100vw-48px)/2.2)] md:w-[calc((100vw-160px-40px)/3)] min-w-[220px] sm:min-w-[280px] md:min-w-[320px]' 
        : 'movie-card-standard w-[calc((100vw-36px)/2.4)] sm:w-[calc((100vw-48px)/3.5)] md:w-[calc((100vw-160px-100px)/6)] min-w-[130px] sm:min-w-[160px] md:min-w-[180px]'
      }`}
      style={{ position: 'relative', contain: 'content' }}
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
      {/* Top 10 Massive Number */}
      {isTop10 && (
        <div 
          className="absolute left-0 md:left-1 bottom-[32px] sm:bottom-[40px] md:bottom-[45px] z-20 pointer-events-none select-none text-[85px] sm:text-[110px] md:text-[140px] leading-[0.75] tracking-tighter"
          style={{ 
            color: '#0a0a0a',
            WebkitTextStroke: '2.5px white', 
            textShadow: '3px 3px 0px #E50914, 0px 10px 20px rgba(0,0,0,0.8)',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 900,
          }}
        >
          {index + 1}
        </div>
      )}

      {/* Thumbnail Container */}
      <div 
        className={`relative ${isContinueWatching ? 'aspect-video' : 'aspect-[2/3]'} rounded-xl md:rounded-2xl overflow-hidden mb-2.5 md:mb-3.5 border border-white/10 shadow-2xl transition-all duration-300 group-hover:border-accent/50 bg-[#121218]`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={isContinueWatching ? (movie.backdrop || movie.poster) : movie.poster}
          alt={movie.title}
          loading={index < 4 ? 'eager' : 'lazy'}
          fetchPriority={index < 2 ? 'high' : 'auto'}
          decoding="async"
          className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${isHovered && trailerKey ? 'opacity-0' : 'opacity-100'}`}
        />

        {isHovered && trailerKey && (
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${trailerKey}`}
            allow="autoplay; encrypted-media"
            className="absolute inset-0 w-full h-full scale-[1.35] pointer-events-none"
            title="Trailer"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>

        {isContinueWatching && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-10">
            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, movie.progress || progress || 0))}%` }}></div>
          </div>
        )}

        {!isContinueWatching && movie.rating && (
          <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-2">
            <span className="px-2 py-0.5 bg-[#0a0a0a]/85 backdrop-blur-md text-white font-black text-[9px] sm:text-[10px] md:text-xs rounded-md border border-white/10 shadow-lg uppercase tracking-wider">
              ⭐ {movie.rating}
            </span>
          </div>
        )}

        {isContinueWatching ? (
          <div className="absolute top-2 right-2 md:top-3 md:right-3 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onMouseLeave={() => setShowMenu(false)}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="w-7 h-7 md:w-8 md:h-8 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 cursor-pointer"
            >
              <MoreVertical size={16} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-[#111] border border-white/10 rounded-xl overflow-hidden py-1 z-50 origin-top-right"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      if (onRemoveFromContinueWatching) {
                        onRemoveFromContinueWatching(movie.id);
                      }
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-sm text-red-500 font-semibold hover:bg-red-500/10 transition-colors text-left"
                  >
                    <Trash2 size={16} />
                    <span>Remove from history</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleWatchlist(movie);
            }}
            className="watchlist-btn absolute top-2 right-2 md:top-3 md:right-3 w-8 h-8 md:w-9 md:h-9 bg-black/70 backdrop-blur-md border border-white/15 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-accent hover:border-accent hover:scale-105 active:scale-95 z-30 cursor-pointer shadow-xl"
            aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            {isInWatchlist ? <Check size={16} /> : <Plus size={16} />}
          </button>
        )}
      </div>

      {/* Text Content */}
      <div className="px-1">
        <h3 className="text-xs sm:text-sm md:text-base font-bold text-white truncate mb-0.5 transition-colors duration-300 group-hover:text-accent">
          {movie.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] md:text-xs text-white/50 font-bold uppercase tracking-wider">
          {isContinueWatching && movie.type === 'tv' && movie.season !== undefined ? (
            <span className="text-accent font-black">S{movie.season} E{movie.episode}</span>
          ) : (
            <span>{movie.year}</span>
          )}
          <span className="w-1 h-1 bg-white/30 rounded-full"></span>
          <span>{movie.type === 'tv' ? 'TV Show' : 'Movie'}</span>
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
  const scrollRaf = useRef(null);

  if (!movies || movies.length === 0) return null;

  const handleScroll = () => {
    if (scrollRaf.current) return;
    scrollRaf.current = requestAnimationFrame(() => {
      if (rowRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
        setIsAtStart(scrollLeft <= 10);
        setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 10);
      }
      scrollRaf.current = null;
    });
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('resize', handleScroll);
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    };
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
      className="relative group/row mb-2 md:mb-4"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      {title && (
        <div className="flex items-center justify-between mb-3 md:mb-4 px-1 md:px-2">
          <h2 className="row-title text-xl md:text-2xl font-black text-white/90 tracking-wide">
            {title}
          </h2>
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
                  className={`absolute left-2 md:left-4 z-40 w-12 h-12 md:w-14 md:h-14 bg-black/60 hover:bg-accent backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:border-accent transition-all cursor-pointer hover:scale-110 active:scale-95 hidden md:flex -translate-y-1/2 ${
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
                  className={`absolute right-2 md:right-4 z-40 w-12 h-12 md:w-14 md:h-14 bg-black/60 hover:bg-accent backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:border-accent transition-all cursor-pointer hover:scale-110 active:scale-95 hidden md:flex -translate-y-1/2 ${
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
          className="flex gap-2 md:gap-3 overflow-x-auto hide-scrollbar pr-10 snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain will-change-scroll"
          style={{ transform: 'translateZ(0)', WebkitOverflowScrolling: 'touch' }}
        >
          {movies.map((movie, index) => {
            return (
              <MovieCard
                key={`${movie.id}-${index}`}
                movie={movie}
                index={index}
                isContinueWatching={isContinueWatching}
                isTop10={isTop10}
                progress={movie.progress || 0}
                onMovieClick={onMovieClick}
                onRemoveFromContinueWatching={onRemoveFromContinueWatching}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
