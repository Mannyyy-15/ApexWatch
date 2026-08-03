import { Play, Plus, Check, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { tmdb } from '../utils/tmdb';
import { firestoreService } from '../utils/firestore';

export function Hero() {
 const { setActiveMovieId, setActiveMediaType, setCurrentView, user, activeProfile, heroCache, setHeroCache } = useAppContext();
 const [heroesList, setHeroesList] = useState(heroCache || []);
 const [currentIndex, setCurrentIndex] = useState(0);
 const heroMovie = heroesList[currentIndex];
 const [inWatchlist, setInWatchlist] = useState(false);
 const [loading, setLoading] = useState(!heroCache);

 useEffect(() => {
 const loadHeroes = async () => {
 if (heroCache) return; // Skip if we already have it
 try {
 const trending = await tmdb.fetchTrending();
 const formatted = trending.map(tmdb.formatMovie).filter(Boolean).slice(0, 5);
 setHeroesList(formatted);
 setHeroCache(formatted);
 } catch (error) {
 console.error('Error loading heroes:', error);
 } finally {
 setLoading(false);
 }
 };
 loadHeroes();
 }, [heroCache, setHeroCache]);

 useEffect(() => {
 const timer = setInterval(() => {
 if (heroesList.length > 0) {
 setCurrentIndex((prev) => (prev + 1) % heroesList.length);
 }
 }, 8000);
 return () => clearInterval(timer);
 }, [heroesList]);

 useEffect(() => {
 if (!activeProfile || !heroMovie || !user) return;

 const checkWatchlist = async () => {
 const wl = await firestoreService.getWatchlist(user.uid, activeProfile.id);
 setInWatchlist(wl.some(item => item.contentId === heroMovie.id));
 };
 checkWatchlist();
 }, [activeProfile, heroMovie, user]);

 const toggleWatchlist = async () => {
 if (!activeProfile || !heroMovie || !user) return;

 try {
 if (inWatchlist) {
 await firestoreService.removeFromWatchlist(user.uid, activeProfile.id, heroMovie.id);
 setInWatchlist(false);
 } else {
 await firestoreService.addToWatchlist(user.uid, activeProfile.id, heroMovie.id, heroMovie.type);
 setInWatchlist(true);
 }
 } catch (error) {
 console.error('Error toggling watchlist:', error);
 }
 };

 const [scrollY, setScrollY] = useState(0);

 useEffect(() => {
 const mainEl = document.querySelector('main');
 if (!mainEl) return;
 const handleScroll = () => {
 setScrollY(mainEl.scrollTop);
 };
 mainEl.addEventListener('scroll', handleScroll, { passive: true });
 return () => mainEl.removeEventListener('scroll', handleScroll);
 }, []);

  if (loading || !heroMovie)
    return (
      <div className="w-[calc(100%-16px)] md:w-[calc(100%-48px)] mx-auto mt-2 md:mt-6 h-[75dvh] md:h-[calc(100vh-48px)] rounded-3xl border border-white/10 overflow-hidden bg-[#050505] flex items-end px-6 pb-20">
        <div className="w-2/3 h-12 bg-white/5 animate-pulse rounded-xl mb-4"></div>
      </div>
    );

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % heroesList.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + heroesList.length) % heroesList.length);

  return (
    <div className="relative w-[calc(100%-16px)] md:w-[calc(100%-48px)] mx-auto mt-2 md:mt-6 h-[82dvh] md:h-[calc(100vh-48px)] rounded-3xl border border-white/10 overflow-hidden flex items-end group">
 <div className="absolute inset-0 overflow-hidden bg-[#020202]">
 <AnimatePresence initial={true} mode="wait">
 <motion.div
 key={currentIndex}
 initial={{ opacity: 0, scale: 1.02 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.98 }}
 transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
 className="absolute inset-0"
 >
  <motion.div 
  className="absolute inset-x-0 w-full"
  style={{ height: '130%', top: '-15%', y: scrollY * 0.5 }}
  >
  <picture>
  <source media="(max-width: 768px)" srcSet={heroMovie.poster || heroMovie.backdrop.replace('/w1280/', '/w780/')} />
  <img
  src={heroMovie.backdrop}
  alt={heroMovie.title}
  className="w-full h-full object-cover object-center"
  loading={currentIndex === 0 ? 'eager' : 'lazy'}
  fetchPriority={currentIndex === 0 ? 'high' : 'auto'}
  />
  </picture>
  </motion.div>
  {/* Moody Cinematic Overlays */}
  <div className="absolute inset-0 bg-black/30"></div>
  {/* Mobile: strong bottom gradient for text legibility */}
  <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/70 to-[#020202]/10 md:via-[#020202]/50 md:to-transparent"></div>
  {/* Desktop: left side gradient */}
  <div className="absolute inset-0 bg-gradient-to-r from-[#020202] via-transparent to-transparent hidden md:block"></div>
 </motion.div>
 </AnimatePresence>
 </div>

  {/* Navigation Arrows */}
  <div className="absolute right-5 md:right-12 bottom-5 md:bottom-12 z-40 hidden md:flex items-center gap-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
  <button onClick={prevSlide} className="w-10 h-10 rounded-full bg-glass-bg backdrop-blur-xl border border-glass-border flex items-center justify-center text-white/40 hover:text-white hover:bg-glass-hover hover:border-white/15 transition-all active:scale-90 shadow-2xl cursor-pointer">
  <ChevronLeft size={20} />
  </button>
  <div className="flex items-center gap-2 font-black text-[9px] text-white/20 uppercase tracking-[0.25em]">
  <span className="text-white/60">{currentIndex + 1}</span>
  <span>/</span>
  <span>{heroesList.length}</span>
  </div>
  <button onClick={nextSlide} className="w-10 h-10 rounded-full bg-glass-bg backdrop-blur-xl border border-glass-border flex items-center justify-center text-white/40 hover:text-white hover:bg-glass-hover hover:border-white/15 transition-all active:scale-90 shadow-2xl cursor-pointer">
  <ChevronRight size={20} />
  </button>
  </div>

  {/* Content */}
  <div className="relative z-10 w-full">
    {/* Mobile Layout */}
    <div className="md:hidden px-5 pb-7">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 bg-accent/20 border border-accent/40 rounded-full text-[9px] font-black tracking-[0.2em] uppercase text-accent">Trending</span>
            <span className="text-white/40 text-[10px] font-bold">{heroMovie.year} • {heroMovie.rating || 'U/A'}</span>
          </div>

          {/* Title */}
          <h1 className="display-text text-[2.6rem] font-black tracking-tighter leading-[0.88] text-white drop-shadow-xl uppercase italic mb-3">
            {heroMovie.title}
          </h1>

          {/* Description */}
          <p className="text-[13px] text-white/55 font-medium leading-relaxed mb-5 line-clamp-2">
            {heroMovie.description}
          </p>

          {/* Buttons */}
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                setActiveMovieId(heroMovie.id);
                setActiveMediaType(heroMovie.type);
                setCurrentView('player');
              }}
              className="flex-1 flex items-center justify-center gap-2.5 bg-accent text-white py-3.5 rounded-2xl font-black text-sm hover:bg-accent-hover active:scale-95 transition-all cursor-pointer"
            >
              <Play fill="currentColor" size={15} />
              PLAY
            </button>
            <button
              onClick={toggleWatchlist}
              className="w-12 h-12 bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center rounded-2xl text-white active:scale-90 transition-all cursor-pointer"
            >
              {inWatchlist ? <Check size={18} /> : <Plus size={18} />}
            </button>
            <button
              onClick={() => {
                setActiveMovieId(heroMovie.id);
                setActiveMediaType(heroMovie.type);
                setCurrentView('details');
              }}
              className="w-12 h-12 bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center rounded-2xl text-white/70 active:scale-90 transition-all cursor-pointer"
            >
              <Info size={18} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Mobile Dot Indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-5">
        {heroesList.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`rounded-full transition-all duration-500 cursor-pointer ${
              idx === currentIndex
                ? 'w-6 h-1.5 bg-accent'
                : 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>

    {/* Desktop Layout */}
    <div className="hidden md:block px-10 pb-24">
      <div className="grid md:grid-cols-2 gap-8 items-end">
        <div className="flex flex-col items-start min-h-[300px] justify-end">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full"
            >
              <div className="flex items-center gap-2.5 mb-6">
                <span className="hero-badge px-2.5 py-0.5 bg-accent/15 border border-accent/30 rounded-full text-[9px] font-black tracking-[0.2em] uppercase text-white">Trending</span>
                <div className="flex items-center gap-1 px-2.5 py-0.5 bg-black/40 backdrop-blur-xl border border-white/5 rounded-full">
                  <span className="text-accent text-[10px] font-black uppercase">Match</span>
                  <span className="text-white text-[10px] font-black">{heroMovie.match}</span>
                </div>
                <span className="hero-badge-meta text-white/50 text-[11px] font-bold tracking-wider">{heroMovie.year} • {heroMovie.duration} • {heroMovie.rating || '18+'}</span>
              </div>

              <h1 className="hero-title display-text text-[5rem] lg:text-[6rem] font-black tracking-tighter mb-5 leading-[0.9] text-white filter drop-shadow-xl uppercase italic">
                {heroMovie.title}
              </h1>

              <p className="hero-desc max-w-xl text-base text-white/60 mb-8 font-medium leading-relaxed drop-shadow-md line-clamp-3">
                {heroMovie.description}
              </p>

              <div className="flex flex-row flex-wrap items-center gap-3.5">
                <button
                  onClick={() => {
                    setActiveMovieId(heroMovie.id);
                    setActiveMediaType(heroMovie.type);
                    setCurrentView('player');
                  }}
                  className="hero-play-btn flex items-center gap-3 bg-accent text-white px-9 py-4 rounded-2xl font-black text-base hover:bg-accent-hover hover:scale-105 transition-all duration-300 active:scale-95 cursor-pointer tv-focusable"
                >
                  <Play fill="currentColor" size={20} />
                  PLAY NOW
                </button>
                <button
                  onClick={toggleWatchlist}
                  className="hero-icon-btn w-12 h-12 bg-glass-bg border border-glass-border flex items-center justify-center rounded-2xl hover:bg-glass-hover hover:border-white/15 transition-all text-white cursor-pointer tv-focusable"
                >
                  {inWatchlist ? <Check size={18} /> : <Plus size={18} />}
                </button>
                <button
                  onClick={() => {
                    setActiveMovieId(heroMovie.id);
                    setActiveMediaType(heroMovie.type);
                    setCurrentView('details');
                  }}
                  className="hero-icon-btn w-12 h-12 bg-glass-bg border border-glass-border flex items-center justify-center rounded-2xl hover:bg-glass-hover hover:border-white/15 transition-all text-white/70 hover:text-white cursor-pointer tv-focusable"
                >
                  <Info size={18} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  </div>

  {/* Vertical Cinematic Navigation - Right Center */}
  <div className="hidden md:flex flex-col justify-center items-end absolute right-12 top-0 bottom-0 z-30 pointer-events-none">
  <div className="flex flex-col gap-8 items-end pointer-events-auto pr-4 border-r border-white/5">
  {heroesList.map((movie, idx) => (
  <button
  key={idx}
  onClick={() => setCurrentIndex(idx)}
  className="relative group text-right cursor-pointer"
  >
  <div className="flex flex-col items-end gap-1">
  <span className={`text-[8px] font-black tracking-[0.25em] uppercase transition-all duration-700 ${
  idx === currentIndex ? 'text-accent' : 'text-white/20 group-hover:text-white/50'
  }`}>
  {idx === currentIndex ? 'Now Playing' : `Next 0${idx + 1}`}
  </span>
  <span className={`text-xs font-bold tracking-tight transition-all duration-500 ${
  idx === currentIndex ? 'text-white translate-x-0' : 'text-white/30 group-hover:text-white/60 translate-x-1.5'
  }`}>
  {movie.title}
  </span>
  
  {idx === currentIndex && (
  <div className="absolute -right-[18px] top-0 bottom-0 w-[2px] bg-white/5">
  <motion.div
  key={currentIndex}
  initial={{ height: 0 }}
  animate={{ height: '100%' }}
  transition={{ duration: 8, ease: "linear" }}
  className="w-full bg-accent "
  />
  </div>
  )}
  </div>
  </button>
  ))}
  </div>
  </div>
  </div>
  );
}
