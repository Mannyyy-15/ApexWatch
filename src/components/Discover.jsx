import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Play, X, Mic, MicOff, TrendingUp, Film, Tv, Flame, Sparkles, Smile, Swords, Ghost, Rocket, Heart, Clapperboard } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';
import { MovieCardSkeleton } from './Skeleton';

const CATEGORY_PILLS = [
  { id: 'trending', name: 'Trending', icon: TrendingUp },
  { id: 'movies', name: 'Movies', icon: Film, type: 'movie' },
  { id: 'shows', name: 'Shows', icon: Tv, type: 'tv' },
  { id: 'action', name: 'Action', genreId: 28, type: 'movie', icon: Swords },
  { id: 'comedy', name: 'Comedy', genreId: 35, type: 'movie', icon: Smile },
  { id: 'drama', name: 'Drama', genreId: 18, type: 'movie', icon: Clapperboard },
  { id: 'anime', name: 'Anime', genreId: 16, type: 'tv', icon: Sparkles },
  { id: 'kdrama', name: 'K-Drama', type: 'tv', lang: 'ko', icon: Flame },
  { id: 'scifi', name: 'Sci-Fi', genreId: 878, type: 'movie', icon: Rocket },
  { id: 'horror', name: 'Horror', genreId: 27, type: 'movie', icon: Ghost },
  { id: 'romance', name: 'Romance', genreId: 10749, type: 'movie', icon: Heart }
];

export function Discover() {
  const { setActiveMovieId, setActiveMediaType, setCurrentView, searchQuery, setSearchQuery, discoverCache, setDiscoverCache } = useAppContext();
  const [searchResults, setSearchResults] = useState([]);
  const [categoryContent, setCategoryContent] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('trending');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('apexwatch_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
        }
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start voice recognition:", err);
      setIsListening(false);
    }
  };

  const saveRecentSearch = (query) => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
      const updated = [query.trim(), ...prev.filter(q => q.toLowerCase() !== query.trim().toLowerCase())].slice(0, 4);
      localStorage.setItem('apexwatch_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  // Initial Trending Data
  useEffect(() => {
    const loadContent = async () => {
      if (discoverCache && discoverCache.length > 0) {
        setTrending(discoverCache);
        return;
      }

      setLoading(true);
      try {
        const [trendingRaw, movies, tv] = await Promise.all([
          tmdb.fetchTrending('all'),
          tmdb.fetchPopular('movie'),
          tmdb.fetchPopular('tv')
        ]);
        
        const allContent = [...trendingRaw, ...movies, ...tv]
          .map(tmdb.formatMovie)
          .filter(Boolean);
        
        const uniqueMixed = Array.from(new Map(allContent.map(item => [item.id, item])).values());
        setTrending(uniqueMixed);
        setDiscoverCache(uniqueMixed);
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  // Search logic
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
      performSearch(searchQuery);
    }
  }, [searchQuery, performSearch]);

  const handleCategoryClick = async (pill) => {
    setSearchQuery('');
    setActiveCategory(pill.id);
    
    if (pill.id === 'trending') {
      setCategoryContent([]);
      return;
    }

    setLoading(true);
    try {
      let results = [];
      if (pill.id === 'movies') {
        results = await tmdb.fetchPopular('movie');
      } else if (pill.id === 'shows') {
        results = await tmdb.fetchPopular('tv');
      } else if (pill.id === 'anime') {
        results = await tmdb.fetchDiscover('tv', { with_genres: 16, with_keywords: '210024' });
      } else if (pill.id === 'kdrama') {
        results = await tmdb.fetchDiscover('tv', { with_original_language: 'ko' });
      } else if (pill.genreId) {
        results = await tmdb.fetchByGenre(pill.genreId, pill.type || 'movie');
      }
      setCategoryContent(results.map(tmdb.formatMovie).filter(Boolean));
    } catch (error) {
      console.error('Error fetching category:', error);
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
    : (activeCategory !== 'trending' && categoryContent.length > 0 ? categoryContent : trending);

  const activeCategoryObj = CATEGORY_PILLS.find(p => p.id === activeCategory) || CATEGORY_PILLS[0];

  return (
    <div className="discover-container min-h-screen pt-20 md:pt-16 px-3.5 md:px-8 lg:px-12 pb-32 w-full max-w-[1600px] mx-auto relative z-10">
      
      {/* Search Bar - Hotstar/Netflix Pill Style */}
      <div className="mb-5 md:mb-8 w-full max-w-4xl mx-auto">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 md:left-5 flex items-center pointer-events-none text-white/50 group-focus-within:text-accent transition-colors">
            <Search size={20} className="md:w-6 md:h-6" />
          </div>
          <input 
            type="text" 
            placeholder={isListening ? "Listening... Speak now..." : "Search for 'shows', 'movies', 'anime'..."} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            tabIndex={0}
            className={`w-full bg-[#121218]/90 border rounded-2xl md:rounded-full py-3.5 md:py-4 pl-12 md:pl-14 pr-24 text-sm md:text-base text-white placeholder-white/40 focus:outline-none transition-all font-medium shadow-2xl tv-focusable ${
              isListening ? 'border-accent ring-2 ring-accent/40 bg-[#161620]' : 'border-white/10 focus:border-white/25 focus:bg-[#161622]'
            }`}
          />
          <div className="absolute inset-y-0 right-3.5 md:right-4 flex items-center gap-2">
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                tabIndex={0}
                className="text-white/40 hover:text-white transition-colors cursor-pointer tv-focusable p-1 rounded-full"
              >
                <X size={18} />
              </button>
            )}
            <button 
              onClick={startVoiceSearch}
              tabIndex={0}
              className={`p-2 rounded-full transition-all cursor-pointer tv-focusable ${
                isListening ? 'bg-accent text-white animate-pulse' : 'bg-white/5 hover:bg-white/15 text-white/60 hover:text-white border border-white/10'
              }`}
              title={isListening ? "Listening... Click to stop" : "Search by voice"}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Searches */}
      {!searchQuery.trim() && recentSearches.length > 0 && (
        <div className="mb-6 w-full max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] md:text-xs text-white/40 font-black uppercase tracking-widest">Recent Searches</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((term, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(term)}
                tabIndex={0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white transition-all font-semibold text-xs cursor-pointer tv-focusable active:scale-95"
              >
                <Search size={11} className="text-white/40" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Heading & Pills Strip (Hotstar / JioCinema Style) */}
      {!searchQuery.trim() && (
        <div className="mb-6 w-full max-w-4xl mx-auto">
          <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
            <span>Popular Searches in</span>
            <span className="text-accent italic font-black">{activeCategoryObj.name}</span>
          </h3>

          {/* Horizontal Scrolling Pills */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1 -mx-3.5 px-3.5 md:-mx-0 md:px-0 scroll-smooth overscroll-contain">
            {CATEGORY_PILLS.map((pill) => {
              const isActive = activeCategory === pill.id;
              const Icon = pill.icon;
              return (
                <button
                  key={pill.id}
                  onClick={() => handleCategoryClick(pill)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs md:text-sm tracking-wide transition-all duration-200 border cursor-pointer select-none active:scale-95 tv-focusable ${
                    isActive
                      ? 'bg-accent border-accent text-white shadow-lg shadow-red-950/50 scale-105'
                      : 'bg-[#16161e] border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-white' : 'text-white/60'} />
                  <span>{pill.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Header when Search Query Active */}
      {searchQuery.trim() && (
        <div className="mb-5 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-accent rounded-full"></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Search Results for <span className="text-accent font-black italic">"{searchQuery}"</span>
              </h2>
              <p className="text-white/40 text-[10px] md:text-xs font-semibold uppercase tracking-wider mt-0.5">
                Found {searchResults.length} matches
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Visual Poster Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
        {loading && displayMovies.length === 0 ? (
          [...Array(18)].map((_, i) => <MovieCardSkeleton key={i} />)
        ) : (
          <AnimatePresence mode="popLayout">
            {displayMovies.map((movie, idx) => {
              const isTop = idx < 3;
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.92 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.92 }} 
                  transition={{ duration: 0.25 }}
                  key={movie.id} 
                  className="group relative cursor-pointer outline-none" 
                  onClick={() => handleMovieClick(movie.id, movie.type)}
                  tabIndex={0}
                  role="button"
                >
                  <div className="relative aspect-[2/3] rounded-2xl md:rounded-[22px] overflow-hidden mb-2 bg-[#121218] border border-white/10 group-hover:border-accent/60 group-hover:shadow-[0_0_25px_rgba(229,9,20,0.35)] transition-all duration-300">
                    <img 
                      src={movie.poster} 
                      alt={movie.title} 
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-30 transition-opacity"></div>

                    {/* Dynamic Badges */}
                    {isTop && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-accent/90 backdrop-blur-md text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
                        Trending #{idx + 1}
                      </div>
                    )}
                    {movie.rating > 7.5 && !isTop && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
                        ★ {movie.rating?.toFixed(1)}
                      </div>
                    )}

                    {/* Quick Play Hover Indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                        <Play size={20} fill="currentColor" className="ml-1" />
                      </div>
                    </div>
                  </div>

                  <h4 className="text-xs md:text-sm font-bold text-white group-hover:text-accent transition-colors truncate px-1">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-semibold px-1 mt-0.5">
                    <span>{movie.year || '2026'}</span>
                    <span>•</span>
                    <span className="uppercase">{movie.type === 'tv' ? 'Series' : 'Movie'}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {!loading && displayMovies.length === 0 && searchQuery && (
        <div className="py-20 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="text-white/30" />
          </div>
          <h3 className="text-xl font-bold text-white mb-1">No matches found</h3>
          <p className="text-xs text-white/40 max-w-xs">We couldn't find any results for "{searchQuery}". Try a different keyword or explore trending pills.</p>
        </div>
      )}
    </div>
  );
}

