import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Play, Info, Flame, Rocket, Smile, Swords, Ghost, Heart, Star, Clapperboard, Compass, RefreshCw, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';

const MOOD_PRESETS = [
  {
    id: 'mindbending',
    label: 'Mind-Bending Sci-Fi',
    emoji: '🚀',
    icon: Rocket,
    desc: 'Complex plots, time travel & reality shifts',
    genreId: 878,
    type: 'movie',
    query: 'Inception Interstellar Matrix'
  },
  {
    id: 'adrenaline',
    label: 'Late-Night Adrenaline',
    emoji: '🔥',
    icon: Flame,
    desc: 'High-octane action & nonstop chases',
    genreId: 28,
    type: 'movie',
    query: 'John Wick Mission Impossible'
  },
  {
    id: 'comfort_comedy',
    label: 'Cozy Feel-Good Comedy',
    emoji: '🍿',
    icon: Smile,
    desc: 'Lighthearted laughs & comforting vibes',
    genreId: 35,
    type: 'movie',
    query: 'Superbad Hangover'
  },
  {
    id: 'korean_thriller',
    label: 'Dark Korean Thrillers',
    emoji: '🕵️',
    icon: Swords,
    desc: 'Gripping suspense & shocking twists',
    type: 'tv',
    lang: 'ko',
    query: 'Squid Game Parasite'
  },
  {
    id: 'emotional_romance',
    label: 'Tearjerker Romance',
    emoji: '💖',
    icon: Heart,
    desc: 'Deep emotional connections & heartbreak',
    genreId: 10749,
    type: 'movie',
    query: 'La La Land Titanic'
  },
  {
    id: 'midnight_horror',
    label: 'Midnight Jump-Scares',
    emoji: '👻',
    icon: Ghost,
    desc: 'Haunting atmosphere & intense terror',
    genreId: 27,
    type: 'movie',
    query: 'Conjuring Insidious'
  }
];

export function AIMoodMatcherModal({ isOpen, onClose }) {
  const { setActiveMovieId, setActiveMediaType, setCurrentView } = useAppContext();
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [matchedResults, setMatchedResults] = useState([]);
  const [activeMoodTitle, setActiveMoodTitle] = useState('');

  if (!isOpen) return null;

  const handleSelectPreset = async (preset) => {
    setLoading(true);
    setActiveMoodTitle(preset.label);
    try {
      let data = [];
      if (preset.genreId) {
        data = await tmdb.fetchByGenre(preset.genreId, preset.type);
      } else if (preset.lang) {
        data = await tmdb.fetchDiscover(preset.type, { with_original_language: preset.lang, sort_by: 'popularity.desc' });
      } else {
        data = await tmdb.search(preset.query);
      }
      const formatted = data.map(tmdb.formatMovie).filter(Boolean).slice(0, 6);
      setMatchedResults(formatted);
    } catch (e) {
      console.error('Error fetching mood preset:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomPromptSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!customPrompt.trim()) return;

    setLoading(true);
    setActiveMoodTitle(`"${customPrompt}"`);
    try {
      const results = await tmdb.search(customPrompt);
      let formatted = results.map(tmdb.formatMovie).filter(Boolean);
      if (formatted.length === 0) {
        // Fallback to trending
        const trending = await tmdb.fetchTrending('all');
        formatted = trending.map(tmdb.formatMovie).filter(Boolean);
      }
      setMatchedResults(formatted.slice(0, 6));
    } catch (e) {
      console.error('Error searching custom mood:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieAction = (id, type, action = 'details') => {
    setActiveMovieId(id);
    setActiveMediaType(type || 'movie');
    onClose();
    if (action === 'play') {
      setCurrentView('player');
    } else {
      setCurrentView('details');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 md:p-6 overflow-y-auto">
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
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="relative z-10 w-full max-w-2xl bg-[#0c0d12]/95 border border-white/15 rounded-3xl p-5 md:p-7 shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-accent to-pink-600 flex items-center justify-center text-white shadow-lg shadow-red-950/40">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <span>AI Mood Matcher</span>
                  <span className="text-[10px] font-bold bg-white/10 text-accent px-2 py-0.5 rounded-full uppercase tracking-widest">
                    Beta
                  </span>
                </h3>
                <p className="text-[11px] text-white/50 font-medium">Tell us what you feel like watching, and our AI will find the vibe.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Natural Language Prompt Input */}
          <form onSubmit={handleCustomPromptSubmit} className="mb-5">
            <div className="relative flex items-center">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Space exploration with mind-blowing twists or heartwarming family animation..."
                className="w-full bg-[#181920] border border-white/10 rounded-2xl py-3.5 pl-4 pr-24 text-sm text-white placeholder-white/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!customPrompt.trim() || loading}
                className="absolute right-2 px-4 py-2 rounded-xl bg-accent hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                {loading ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
                <span>Match</span>
              </button>
            </div>
          </form>

          {/* Quick Mood Pills */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">Quick Vibe Select</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MOOD_PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-accent/40 text-left transition-all group cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{preset.emoji}</span>
                      <span className="text-xs font-bold text-white group-hover:text-accent transition-colors line-clamp-1">
                        {preset.label}
                      </span>
                    </div>
                    <p className="text-[9px] text-white/40 line-clamp-1">{preset.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Display */}
          {matchedResults.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Top Vibe Matches for <span className="text-accent italic">{activeMoodTitle}</span>
                </span>
                <span className="text-[10px] text-white/40 font-semibold">{matchedResults.length} matches</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1 hide-scrollbar">
                {matchedResults.map((movie, idx) => (
                  <div
                    key={movie.id}
                    className="group relative rounded-xl overflow-hidden bg-[#15161f] border border-white/10 hover:border-accent/60 transition-all flex flex-col justify-between p-2 shadow-lg"
                  >
                    <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-black/40">
                      <img src={movie.backdrop || movie.poster} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[8px] font-bold text-accent">
                        {98 - idx * 2}% Match
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-white line-clamp-1 group-hover:text-accent transition-colors">
                        {movie.title}
                      </h5>
                      <p className="text-[9px] text-white/40 mt-0.5">{movie.year || '2026'} • {movie.type === 'tv' ? 'Series' : 'Movie'}</p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => handleMovieAction(movie.id, movie.type, 'play')}
                        className="flex-1 py-1 px-2 bg-accent hover:bg-red-700 text-white rounded-lg font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Play size={10} fill="currentColor" />
                        <span>Play</span>
                      </button>
                      <button
                        onClick={() => handleMovieAction(movie.id, movie.type, 'details')}
                        className="p-1 px-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Info size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
