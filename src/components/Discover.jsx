import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Play, X, Mic, MicOff, TrendingUp, Sparkles, Film, Tv, Flame, Clapperboard, Smile, Swords, Ghost, Rocket, Heart, Star } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';
import { MovieCardSkeleton } from './Skeleton';

const CATEGORY_PILLS = [
  { id: 'india', name: 'India', icon: TrendingUp },
  { id: 'movies', name: 'Movies', icon: Film, type: 'movie' },
  { id: 'shows', name: 'Shows', icon: Tv, type: 'tv' },
  { id: 'action', name: 'Action', genreId: 28, type: 'movie', icon: Swords },
  { id: 'comedy', name: 'Comedy', genreId: 35, type: 'movie', icon: Smile },
  { id: 'romance', name: 'Romance', genreId: 10749, type: 'movie', icon: Heart },
  { id: 'drama', name: 'Drama', genreId: 18, type: 'movie', icon: Clapperboard },
  { id: 'anime', name: 'Anime', genreId: 16, type: 'tv', icon: Sparkles },
  { id: 'kdrama', name: 'K-Drama', type: 'tv', lang: 'ko', icon: Flame },
  { id: 'scifi', name: 'Sci-Fi', genreId: 878, type: 'movie', icon: Rocket },
  { id: 'horror', name: 'Horror', genreId: 27, type: 'movie', icon: Ghost }
];

const SEARCH_PLACEHOLDERS = [
  "Search for 'shows'",
  "Search for 'movies'",
  "Search for 'Khatron Ke Khiladi'",
  "Search for 'Bigg Boss'",
  "Search for 'anime'",
  "Search for 'action movies'",
  "Search for 'Stree 2'",
  "Search for 'actors, genres...'"
];

export function Discover() {
  const { setActiveMovieId, setActiveMediaType, setCurrentView, searchQuery, setSearchQuery, discoverCache, setDiscoverCache } = useAppContext();
  const [searchResults, setSearchResults] = useState([]);
  const [categoryContent, setCategoryContent] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('india');
  const [searchFilter, setSearchFilter] = useState('all'); // 'all', 'movie', 'tv'
  const [isListening, setIsListening] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const recognitionRef = useRef(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('apexwatch_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });

  // Cycle animated placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

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

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) setSearchQuery(transcript);
      };
      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err) {
      console.error("Failed to start voice recognition:", err);
      setIsListening(false);
    }
  };

  const saveRecentSearch = (query) => {
    if (!query.trim()) return;
    setRecentSearches(prev => {
      const updated = [query.trim(), ...prev.filter(q => q.toLowerCase() !== query.trim().toLowerCase())].slice(0, 5);
      localStorage.setItem('apexwatch_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  // Initial Content Load (Default: Indian Trending Content)
  useEffect(() => {
    const loadInitialContent = async () => {
      if (discoverCache && discoverCache.length > 0) {
        setTrending(discoverCache);
        return;
      }

      setLoading(true);
      try {
        const indianRaw = await tmdb.fetchIndianTrending();
        const formatted = indianRaw.map(tmdb.formatMovie).filter(Boolean);
        const uniqueItems = Array.from(new Map(formatted.map(item => [item.id, item])).values());
        
        if (uniqueItems.length > 0) {
          setTrending(uniqueItems);
          setDiscoverCache(uniqueItems);
        } else {
          // Fallback to general trending if regional is empty
          const fallbackRaw = await tmdb.fetchTrending('all');
          const fallbackFormatted = fallbackRaw.map(tmdb.formatMovie).filter(Boolean);
          setTrending(fallbackFormatted);
          setDiscoverCache(fallbackFormatted);
        }
      } catch (error) {
        console.error('Error loading initial content:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialContent();
  }, []);

  // Search API Call
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
    
    if (pill.id === 'india') {
      if (trending.length > 0) {
        setCategoryContent(trending);
      } else {
        setLoading(true);
        const data = await tmdb.fetchIndianTrending();
        setCategoryContent(data.map(tmdb.formatMovie).filter(Boolean));
        setLoading(false);
      }
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

  const currentDisplayList = searchQuery.trim() 
    ? (searchFilter === 'all' ? searchResults : searchResults.filter(m => m.type === searchFilter))
    : (activeCategory !== 'india' && categoryContent.length > 0 ? categoryContent : trending);

  // Renders individual Bento Card with specific aspect ratio & badge styling
  const renderBentoCard = (item, options = {}) => {
    if (!item) return null;
    const { 
      badgeType = null, 
      isTall = false, 
      className = "", 
      aspect = "aspect-[16/10]" 
    } = options;

    const bgImage = isTall ? (item.poster || item.backdrop) : (item.backdrop || item.poster);

    return (
      <motion.div
        key={item.id}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleMovieClick(item.id, item.type)}
        className={`group relative rounded-xl md:rounded-2xl overflow-hidden cursor-pointer select-none bg-[#14151c] border border-white/5 hover:border-white/20 transition-all duration-300 shadow-md ${aspect} ${className} tv-focusable`}
        tabIndex={0}
      >
        {/* Background Image */}
        <img
          src={bgImage}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Cinematic Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          {item.rating && (
            <div className="bg-black/60 backdrop-blur-md border border-white/15 text-white font-bold text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-lg">
              <Star size={9} className="text-yellow-400 fill-yellow-400" />
              <span>{typeof item.rating === 'number' ? item.rating.toFixed(1) : item.match || '8.2'}</span>
            </div>
          )}
          {badgeType === 'top10' && (
            <div className="bg-accent text-white font-black text-[8px] md:text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-lg">
              Top 10
            </div>
          )}
        </div>

        {/* Bottom Content & Badges */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex flex-col gap-1">
          {badgeType === 'new_release' && (
            <div>
              <span className="px-2 py-0.5 rounded bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 text-white font-black text-[7px] md:text-[8px] uppercase tracking-wider shadow-lg inline-block">
                New Release
              </span>
            </div>
          )}

          {badgeType === 'live' && (
            <div>
              <span className="inline-flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded text-white font-black text-[7px] md:text-[8px] uppercase tracking-wider shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                Live
              </span>
            </div>
          )}

          <h4 className={`text-white font-black leading-tight line-clamp-1 group-hover:text-accent transition-colors drop-shadow-md ${isTall ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}>
            {item.title}
          </h4>
          
          <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-white/60 font-semibold">
            <span>{item.year || '2026'}</span>
            <span>•</span>
            <span className="uppercase tracking-wider">{item.type === 'tv' ? 'Series' : 'Movie'}</span>
          </div>
        </div>

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
            <Play size={18} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
      </motion.div>
    );
  };

  // Structured Staggered Bento Layout Matching the JioCinema/Hotstar Screenshot Pattern
  const renderBentoGrid = (items) => {
    if (!items || items.length === 0) return null;

    // Split items into repeating structured chunks
    const chunks = [];
    let i = 0;
    while (i < items.length) {
      chunks.push(items.slice(i, i + 8));
      i += 8;
    }

    return (
      <div className="space-y-2.5 md:space-y-4">
        {chunks.map((chunk, chunkIdx) => {
          const item0 = chunk[0];
          const item1 = chunk[1];
          const item2 = chunk[2];
          const item3 = chunk[3];
          const item4 = chunk[4];
          const item5 = chunk[5];
          const item6 = chunk[6];
          const item7 = chunk[7];

          return (
            <div key={chunkIdx} className="space-y-2.5 md:space-y-4">
              {/* Row 1: 2 Equal Wide Cards (Item 0 with New Release badge, Item 1 with Live/Top10 badge) */}
              {(item0 || item1) && (
                <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                  {item0 && renderBentoCard(item0, { badgeType: 'new_release', aspect: 'aspect-[16/10] md:aspect-[16/9]' })}
                  {item1 && renderBentoCard(item1, { badgeType: 'live', aspect: 'aspect-[16/10] md:aspect-[16/9]' })}
                </div>
              )}

              {/* Row 2: Asymmetric Bento (Left: 2 stacked cards, Right: 1 Tall Featured Card) */}
              {(item2 || item3 || item4) && (
                <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                  {/* Left Column: 2 Stacked Cards */}
                  <div className="flex flex-col gap-2.5 md:gap-4 justify-between h-full">
                    {item2 && renderBentoCard(item2, { badgeType: null, aspect: 'aspect-[16/10] flex-1' })}
                    {item3 && renderBentoCard(item3, { badgeType: 'new_release', aspect: 'aspect-[16/10] flex-1' })}
                  </div>

                  {/* Right Column: 1 Tall Card Spanning the Full 2-Row Height */}
                  {item4 && (
                    <div className="h-full">
                      {renderBentoCard(item4, { 
                        isTall: true, 
                        badgeType: null, 
                        aspect: 'h-full min-h-[220px] sm:min-h-[280px] md:min-h-[360px] aspect-[9/14] md:aspect-[9/13]' 
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Row 3: 3 Equal-Width Landscape Cards */}
              {(item5 || item6 || item7) && (
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {item5 && renderBentoCard(item5, { badgeType: null, aspect: 'aspect-[4/3] md:aspect-[16/10]' })}
                  {item6 && renderBentoCard(item6, { badgeType: null, aspect: 'aspect-[4/3] md:aspect-[16/10]' })}
                  {item7 && renderBentoCard(item7, { badgeType: null, aspect: 'aspect-[4/3] md:aspect-[16/10]' })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="discover-container min-h-screen pt-6 md:pt-10 lg:pt-12 px-3.5 md:px-6 lg:px-10 pb-36 w-full max-w-[1400px] mx-auto relative z-10">
      
      {/* Search Bar - Exact JioCinema / Hotstar Pill Design */}
      <div className="mb-4 md:mb-6 w-full max-w-3xl mx-auto">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
            <Search size={20} />
          </div>

          <input 
            type="text" 
            placeholder={isListening ? "Listening... Speak now..." : SEARCH_PLACEHOLDERS[placeholderIndex]} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            tabIndex={0}
            className={`w-full bg-[#1e1f26] border rounded-2xl py-3.5 pl-12 pr-24 text-sm md:text-base text-white placeholder-white/40 focus:outline-none transition-all font-medium shadow-xl tv-focusable ${
              isListening 
                ? 'border-accent ring-2 ring-accent/40 bg-[#22232d]' 
                : 'border-white/5 focus:border-white/20 focus:bg-[#252631]'
            }`}
          />

          <div className="absolute inset-y-0 right-3 flex items-center gap-1.5">
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                tabIndex={0}
                className="text-white/40 hover:text-white transition-colors cursor-pointer tv-focusable p-1 rounded-full"
                title="Clear search"
              >
                <X size={18} />
              </button>
            )}

            {/* AI Sparkle / Voice Button */}
            <button 
              onClick={startVoiceSearch}
              tabIndex={0}
              className={`p-2 rounded-xl transition-all cursor-pointer tv-focusable ${
                isListening ? 'bg-accent text-white animate-pulse' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              title={isListening ? "Listening... Click to stop" : "Voice & Smart Search"}
            >
              {isListening ? <MicOff size={18} /> : <Sparkles size={18} className="text-white/70" />}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Searches Chips */}
      {!searchQuery.trim() && recentSearches.length > 0 && (
        <div className="mb-4 w-full max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider flex-shrink-0">Recent:</span>
          {recentSearches.map((term, idx) => (
            <button
              key={idx}
              onClick={() => setSearchQuery(term)}
              className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white text-xs font-semibold flex-shrink-0 cursor-pointer transition-all active:scale-95"
            >
              <Search size={10} className="text-white/40" />
              <span>{term}</span>
            </button>
          ))}
        </div>
      )}

      {/* Category Header & Filter Chips Strip */}
      {!searchQuery.trim() && (
        <div className="mb-4 md:mb-6 w-full max-w-3xl mx-auto">
          <h2 className="text-lg md:text-xl font-black text-white tracking-tight mb-3">
            Popular Searches in
          </h2>

          {/* Horizontally Scrollable Category Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto hide-scrollbar py-1 -mx-3 px-3 md:-mx-0 md:px-0 scroll-smooth overscroll-contain">
            {CATEGORY_PILLS.map((pill) => {
              const isActive = activeCategory === pill.id;
              const Icon = pill.icon;
              return (
                <button
                  key={pill.id}
                  onClick={() => handleCategoryClick(pill)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all duration-200 border cursor-pointer select-none active:scale-95 tv-focusable ${
                    isActive
                      ? 'bg-[#292a35] border-white/30 text-white shadow-md'
                      : 'bg-[#181920] border-white/10 text-white/70 hover:text-white hover:border-white/20'
                  }`}
                >
                  {Icon && <Icon size={14} className={isActive ? 'text-white' : 'text-white/60'} />}
                  <span>{pill.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Search Results Header when Query Active */}
      {searchQuery.trim() && (
        <div className="mb-5 max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
              Results for <span className="text-accent italic">"{searchQuery}"</span>
            </h2>
            <p className="text-white/40 text-xs font-semibold mt-0.5">
              Found {currentDisplayList.length} titles
            </p>
          </div>

          {/* Type Filter Tabs (All, Movies, Shows) */}
          <div className="flex items-center gap-1.5 bg-[#181920] p-1 rounded-xl border border-white/10">
            {['all', 'movie', 'tv'].map((type) => (
              <button
                key={type}
                onClick={() => setSearchFilter(type)}
                className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  searchFilter === type ? 'bg-white/15 text-white shadow' : 'text-white/50 hover:text-white'
                }`}
              >
                {type === 'all' ? 'All' : type === 'movie' ? 'Movies' : 'Shows'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-full max-w-3xl mx-auto">
        {loading && currentDisplayList.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => <MovieCardSkeleton key={i} />)}
          </div>
        ) : searchQuery.trim() ? (
          /* Live Search Results Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {currentDisplayList.map((movie) => (
              <motion.div
                key={movie.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMovieClick(movie.id, movie.type)}
                className="group relative rounded-xl overflow-hidden bg-[#121319] border border-white/10 hover:border-accent/60 cursor-pointer shadow-lg transition-all tv-focusable aspect-[2/3]"
                tabIndex={0}
              >
                <img
                  src={movie.poster || movie.backdrop}
                  alt={movie.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                  <h4 className="text-white font-bold text-xs md:text-sm line-clamp-1 group-hover:text-accent transition-colors">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[9px] text-white/50 font-semibold mt-0.5">
                    <span>{movie.year || '2026'}</span>
                    <span>•</span>
                    <span className="uppercase">{movie.type === 'tv' ? 'Series' : 'Movie'}</span>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-xl">
                    <Play size={16} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Asymmetric Staggered Bento Grid (Hotstar / JioCinema Style) */
          renderBentoGrid(currentDisplayList)
        )}

        {/* Empty Search State */}
        {!loading && currentDisplayList.length === 0 && searchQuery && (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Search size={28} className="text-white/30" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No matches found</h3>
            <p className="text-xs text-white/40 max-w-xs">We couldn't find any results for "{searchQuery}". Try a different keyword or explore the categories above.</p>
          </div>
        )}
      </div>

    </div>
  );
}
