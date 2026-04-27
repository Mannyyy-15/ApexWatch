import { Play, Plus, Film, Check, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { tmdb } from '../utils/tmdb';
import { firestoreService } from '../utils/firestore';

export function Hero() {
  const { setActiveMovieId, setActiveMediaType, setCurrentView, user, activeProfile } = useAppContext();
  const [heroesList, setHeroesList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const heroMovie = heroesList[currentIndex];
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHeroes = async () => {
      try {
        const trending = await tmdb.fetchTrending();
        const formatted = trending.map(tmdb.formatMovie).filter(Boolean);
        setHeroesList(formatted.slice(0, 5));
      } catch (error) {
        console.error('Error loading heroes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadHeroes();
  }, []);

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

  if (loading || !heroMovie)
    return <div className="w-full h-[85vh] bg-[#050505] animate-pulse"></div>;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % heroesList.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + heroesList.length) % heroesList.length);

  return (
    <div className="relative w-full h-[90dvh] md:h-[95vh] flex items-end overflow-hidden group">
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence initial={true} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <motion.img 
              src={heroMovie.backdrop} 
              alt={heroMovie.title} 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: "linear" }}
              className="w-full h-full object-cover" 
            />
            {/* Moody Cinematic Overlays */}
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#020202] via-transparent to-transparent hidden md:block"></div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows - Repositioned to Bottom Right */}
      <div className="absolute right-12 bottom-12 z-40 hidden md:flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <button onClick={prevSlide} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-90 shadow-2xl">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 font-black text-[10px] text-white/20 uppercase tracking-[0.2em]">
          <span className="text-white/60">{currentIndex + 1}</span>
          <span>/</span>
          <span>{heroesList.length}</span>
        </div>
        <button onClick={nextSlide} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-90 shadow-2xl">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-20 pb-20 md:pb-24 grid md:grid-cols-2 gap-4 md:gap-8 items-end">

        <div className="flex flex-col items-start min-h-[200px] md:min-h-[300px] justify-end">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full"
            >
              <div className="flex items-center gap-3 mb-3 md:mb-6">
                <span className="px-3 py-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase text-white">Trending</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full">
                  <span className="text-[#e50914] text-xs font-bold">Match</span>
                  <span className="text-white text-xs font-bold">{heroMovie.match}</span>
                </div>
                <span className="text-white/60 text-xs font-medium tracking-wider hidden sm:inline">{heroMovie.year} • {heroMovie.duration} • {heroMovie.rating || '18+'}</span>
              </div>

              <h1 className="display-text text-4xl md:text-[5.5rem] font-black tracking-tighter mb-4 md:mb-6 leading-[0.95] text-white filter drop-shadow-xl uppercase">
                {heroMovie.title}
              </h1>

              <p className="max-w-xl text-lg text-white/80 mb-6 md:mb-8 font-medium leading-relaxed drop-shadow-md hidden md:block line-clamp-3">
                {heroMovie.description}
              </p>

              <div className="flex flex-col gap-3 w-full md:flex-row md:flex-wrap md:items-center md:gap-4">
                <button 
                  onClick={() => { 
                    setActiveMovieId(heroMovie.id); 
                    setActiveMediaType(heroMovie.type);
                    setCurrentView('player'); 
                  }} 
                  className="w-full md:w-auto flex items-center justify-center gap-3 bg-red-600 text-white px-8 py-3.5 md:px-10 md:py-4 rounded-xl md:rounded-2xl font-black text-base md:text-xl hover:scale-105 md:hover:scale-110 transition-all duration-500 active:scale-95"
                >
                  <Play fill="currentColor" size={20} className="md:w-6 md:h-6" />
                  PLAY NOW
                </button>

                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    onClick={toggleWatchlist} 
                    className="flex-1 md:w-14 md:h-14 glass flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-2xl font-bold text-xs md:text-lg hover:bg-white/10 hover:border-white/40 transition-all text-white group py-3 md:py-0"
                  >
                    {inWatchlist ? <Check size={20} className="text-white" /> : <Plus size={20} className="text-white group-hover:scale-125 transition-transform" />}
                    <span className="md:hidden">LIST</span>
                  </button>

                  <button 
                    onClick={() => { 
                      setActiveMovieId(heroMovie.id); 
                      setActiveMediaType(heroMovie.type);
                      setCurrentView('details'); 
                    }} 
                    className="flex-1 md:w-14 md:h-14 glass flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-2xl font-bold text-xs md:text-lg hover:bg-white/10 hover:border-white/40 transition-all text-white group py-3 md:py-0"
                  >
                    <Info size={20} className="text-white/60 group-hover:text-white transition-colors" />
                    <span className="md:hidden">INFO</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Vertical Cinematic Navigation - Right Center */}
      <div className="hidden md:flex flex-col justify-center items-end absolute right-12 top-0 bottom-0 z-30 pointer-events-none">
        <div className="flex flex-col gap-10 items-end pointer-events-auto pr-4 border-r border-white/5">
          {heroesList.map((movie, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="relative group text-right"
            >
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[9px] font-black tracking-[0.3em] uppercase transition-all duration-700 ${
                  idx === currentIndex ? 'text-red-500' : 'text-white/20 group-hover:text-white/60'
                }`}>
                  {idx === currentIndex ? 'Now Playing' : `Next 0${idx + 1}`}
                </span>
                <span className={`text-sm font-bold tracking-tight transition-all duration-500 ${
                  idx === currentIndex ? 'text-white translate-x-0' : 'text-white/30 group-hover:text-white/70 translate-x-2'
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
                      className="w-full bg-red-600 shadow-[0_0_15px_rgba(229,9,20,0.6)]"
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
