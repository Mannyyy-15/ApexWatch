import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, X, Play, RefreshCw, Star, Info, Sparkles, Trophy } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';

export function SurpriseMeModal({ isOpen, onClose }) {
  const { setActiveMovieId, setActiveMediaType, setCurrentView } = useAppContext();
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [candidatePool, setCandidatePool] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPool = async () => {
      setRolling(true);
      try {
        const [trending, topRated, popular] = await Promise.all([
          tmdb.fetchTrending('all'),
          tmdb.fetchTopRated('movie'),
          tmdb.fetchPopular('tv')
        ]);
        const formatted = [...trending, ...topRated, ...popular].map(tmdb.formatMovie).filter(Boolean);
        const unique = Array.from(new Map(formatted.map(item => [item.id, item])).values());
        setCandidatePool(unique);
        
        // Pick random
        rollRandom(unique);
      } catch (e) {
        console.error('Error fetching surprise pool:', e);
        setRolling(false);
      }
    };

    fetchPool();
  }, [isOpen]);

  const rollRandom = (pool = candidatePool) => {
    if (!pool || pool.length === 0) return;
    setRolling(true);
    setSelectedTitle(null);

    let counter = 0;
    const interval = setInterval(() => {
      const tempPick = pool[Math.floor(Math.random() * pool.length)];
      setSelectedTitle(tempPick);
      counter++;
      if (counter >= 12) {
        clearInterval(interval);
        const finalPick = pool[Math.floor(Math.random() * pool.length)];
        setSelectedTitle(finalPick);
        setRolling(false);
      }
    }, 80);
  };

  if (!isOpen) return null;

  const handlePlayNow = () => {
    if (!selectedTitle) return;
    setActiveMovieId(selectedTitle.id);
    setActiveMediaType(selectedTitle.type || 'movie');
    onClose();
    setCurrentView('player');
  };

  const handleViewDetails = () => {
    if (!selectedTitle) return;
    setActiveMovieId(selectedTitle.id);
    setActiveMediaType(selectedTitle.type || 'movie');
    onClose();
    setCurrentView('details');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative z-10 w-full max-w-md bg-[#0d0e14]/95 border border-white/15 rounded-3xl p-6 md:p-7 shadow-2xl overflow-hidden text-center"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Dices size={20} className="text-accent animate-spin" style={{ animationDuration: '6s' }} />
              <h3 className="text-base md:text-lg font-black uppercase tracking-wider text-white italic">Surprise Pick</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Slot Machine Card Box */}
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-black/50 border border-white/10 mb-4 shadow-xl">
            {selectedTitle && (
              <>
                <img
                  src={selectedTitle.backdrop || selectedTitle.poster}
                  alt=""
                  className={`w-full h-full object-cover transition-all duration-200 ${rolling ? 'blur-xs scale-105 opacity-70' : 'opacity-100 scale-100'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-accent text-white font-black text-[9px] uppercase tracking-wider">
                    {selectedTitle.type === 'tv' ? 'TV Series' : 'Movie'}
                  </span>
                  {selectedTitle.rating && (
                    <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/20 text-white font-bold text-[9px] flex items-center gap-1">
                      <Star size={9} className="text-yellow-400 fill-yellow-400" />
                      <span>{typeof selectedTitle.rating === 'number' ? selectedTitle.rating.toFixed(1) : selectedTitle.match}</span>
                    </span>
                  )}
                </div>

                {/* Bottom Title */}
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <h4 className="text-white font-black text-base md:text-lg line-clamp-1 drop-shadow-md">
                    {selectedTitle.title}
                  </h4>
                  <p className="text-[11px] text-white/60 line-clamp-1 mt-0.5">
                    {selectedTitle.description}
                  </p>
                </div>
              </>
            )}

            {rolling && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
                <Dices size={36} className="text-accent animate-bounce mb-2" />
                <span className="text-xs font-black uppercase tracking-widest text-white animate-pulse">Rolling your vibe...</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePlayNow}
              disabled={rolling || !selectedTitle}
              className="flex-1 py-3 bg-accent hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={14} fill="currentColor" />
              <span>Play Now</span>
            </button>

            <button
              onClick={() => rollRandom()}
              disabled={rolling}
              className="py-3 px-4 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              title="Roll Again"
            >
              <RefreshCw size={14} className={rolling ? 'animate-spin' : ''} />
              <span>Roll Again</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
