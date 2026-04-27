import { Search, Home, Compass, User, Play, Menu, LogOut, LogIn, Users, Film, Tv, Sparkles, Library, History, BookMarked } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { tmdb } from '../utils/tmdb';

export function NavigationIsland() {
    const { 
        currentView, setCurrentView, 
        user, activeProfile, loadingAuth, 
        logout, searchQuery, setSearchQuery, 
        setLibraryTab, setActiveMovieId, setActiveMediaType 
    } = useAppContext();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [instantResults, setInstantResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const profileMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const searchRef = useRef(null);

    // Close menus on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            const isDesktopProfileMenu = profileMenuRef.current && profileMenuRef.current.contains(event.target);
            const isMobileMenu = mobileMenuRef.current && mobileMenuRef.current.contains(event.target);
            const isSearchArea = searchRef.current && searchRef.current.contains(event.target);
            
            if (!isDesktopProfileMenu && !isMobileMenu) {
                setShowProfileMenu(false);
            }
            
            if (!isSearchArea) {
                setShowSearchDropdown(false);
            }
        }
        
        if (showProfileMenu || showSearchDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileMenu, showSearchDropdown]);

    // Close menu on navigation
    useEffect(() => {
        setShowProfileMenu(false);
        setShowSearchDropdown(false);
    }, [currentView]);

    // Instant Search Logic
    useEffect(() => {
        const fetchResults = async () => {
            if (searchQuery.length < 2) {
                setInstantResults([]);
                setShowSearchDropdown(false);
                return;
            }

            setIsSearching(true);
            setShowSearchDropdown(true);
            try {
                const results = await tmdb.search(searchQuery);
                const formatted = results.map(tmdb.formatMovie).filter(Boolean);
                const uniqueResults = Array.from(new Map(formatted.map(item => [item.id, item])).values());
                setInstantResults(uniqueResults.slice(0, 6));
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleResultClick = (movie) => {
        setActiveMovieId(movie.id);
        setActiveMediaType(movie.type || 'movie');
        setCurrentView('details');
        setShowSearchDropdown(false);
        setSearchQuery('');
    };

    const avatarUrl = activeProfile?.avatarUrl || user?.photoURL;

    return (<>
      {/* TV Sidebar - Only shows when .is-tv class is on body */}
      <div className="tv-sidebar group/sidebar">
        <div 
          onClick={() => setCurrentView('home')} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') setCurrentView('home');
          }}
          tabIndex={0}
          role="button"
          className="flex items-center gap-4 mb-12 px-3 py-2 outline-none group rounded-2xl"
        >
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(229,9,20,0.4)] group-focus:scale-110 group-hover:scale-110 transition-all duration-500 flex-shrink-0">
            <img src="/logo.png" alt="ApexWatch" className="w-full h-full object-cover"/>
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase italic nav-label">
            Apex<span className="text-red-600">Watch</span>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <NavItem icon={<Home size={32}/>} label={<span className="nav-label ml-4 text-lg">Home</span>} active={currentView === 'home'} onClick={() => setCurrentView('home')}/>
          <NavItem icon={<Film size={32}/>} label={<span className="nav-label ml-4 text-lg">Movies</span>} active={currentView === 'movies'} onClick={() => setCurrentView('movies')}/>
          <NavItem icon={<Tv size={32}/>} label={<span className="nav-label ml-4 text-lg">TV Shows</span>} active={currentView === 'tv'} onClick={() => setCurrentView('tv')}/>
          <NavItem icon={<Sparkles size={32}/>} label={<span className="nav-label ml-4 text-lg">Anime</span>} active={currentView === 'anime'} onClick={() => setCurrentView('anime')}/>
          <NavItem icon={<Search size={32}/>} label={<span className="nav-label ml-4 text-lg">Search</span>} active={currentView === 'discover'} onClick={() => setCurrentView('discover')}/>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          {user && (
            <NavItem 
              icon={<div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 flex-shrink-0"><img src={avatarUrl} alt="" className="w-full h-full object-cover"/></div>} 
              label={<span className="nav-label ml-4 text-lg">{activeProfile?.name || "Profile"}</span>} 
              active={currentView === 'profiles'} 
              onClick={() => setCurrentView('profiles')}
            />
          )}
          <NavItem icon={<LogOut size={32} className="ml-1"/>} label={<span className="nav-label ml-4 text-lg">Sign Out</span>} onClick={() => setShowSignOutConfirm(true)}/>
        </div>
      </div>

      {/* Desktop Island */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} 
        className="hidden md:flex fixed top-8 left-1/2 -translate-x-1/2 z-50 items-center glass p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10 navigation-island-desktop"
      >
        <div 
          onClick={() => setCurrentView('home')} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') setCurrentView('home');
          }}
          tabIndex={0}
          role="button"
          className="flex items-center gap-3 pl-2 pr-6 cursor-pointer group flex-shrink-0 outline-none"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-[0_0_20px_rgba(229,9,20,0.3)] group-hover:scale-110 transition-all duration-500">
            <img src="/logo.png" alt="ApexWatch" className="w-full h-full object-cover"/>
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">
            Apex<span className="text-red-600">Watch</span>
          </span>
        </div>
        
        <div className="flex items-center gap-1 px-1 flex-shrink-0">
          <NavItem icon={<Home size={18}/>} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')}/>
          <NavItem icon={<Film size={18}/>} label="Movies" active={currentView === 'movies'} onClick={() => setCurrentView('movies')}/>
          <NavItem icon={<Tv size={18}/>} label="TV Shows" active={currentView === 'tv'} onClick={() => setCurrentView('tv')}/>
          <NavItem icon={<Sparkles size={18}/>} label="Anime" active={currentView === 'anime'} onClick={() => setCurrentView('anime')}/>
        </div>

        <div className="w-[1px] h-6 bg-white/10 mx-4 flex-shrink-0"></div>

        <div 
          ref={searchRef}
          className="flex items-center bg-white/5 hover:bg-white/10 transition-all rounded-full px-5 py-2.5 mr-3 group border border-white/5 focus-within:border-white/20 flex-shrink-0 relative"
        >
          <Search size={16} className="text-white/40 group-focus-within:text-white transition-colors"/>
          <input 
            type="text" 
            placeholder="Search content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                setCurrentView('discover');
                setShowSearchDropdown(false);
              }
            }}
            className="bg-transparent border-none text-sm text-white placeholder-white/30 focus:outline-none w-32 focus:w-56 transition-all duration-500 ml-3 font-medium"
          />

          {/* Search Dropdown */}
          <AnimatePresence>
            {showSearchDropdown && (searchQuery.length >= 2) && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-4 bg-[#0f0f0f] rounded-[1.5rem] border border-white/10 shadow-2xl p-2 z-50 overflow-hidden min-w-[300px]"
              >
                {isSearching ? (
                  <div className="p-4 text-center text-white/40 text-xs font-bold uppercase tracking-widest">Searching...</div>
                ) : instantResults.length > 0 ? (
                  <div className="space-y-1">
                    {instantResults.map(movie => (
                      <button
                        key={movie.id}
                        onClick={() => handleResultClick(movie)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all text-left group/item"
                      >
                        <div className="w-10 h-14 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                          <img src={movie.poster} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-white group-hover/item:text-red-500 transition-colors truncate">{movie.title}</span>
                          <div className="flex items-center gap-2 text-[10px] text-white/40 font-black uppercase tracking-wider">
                            <span>{movie.year}</span>
                            <span>•</span>
                            <span className="text-red-600/60">{movie.type === 'tv' ? 'TV' : 'Movie'}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                    <button 
                      onClick={() => { setCurrentView('discover'); setShowSearchDropdown(false); }}
                      className="w-full p-3 text-center text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-500 transition-colors border-t border-white/5 mt-1"
                    >
                      See all results
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-white/40 text-xs font-bold uppercase tracking-widest">No results found</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!loadingAuth && (<div className="relative" ref={profileMenuRef}>
            {user ? (
              <>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 cursor-pointer hover:border-white/30 transition-colors bg-white/5" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={20} className="text-white"/>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-52 bg-[#0f0f0f] rounded-[1.5rem] border border-white/10 shadow-2xl p-2 z-50 overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-3 border-b border-white/5 mb-1">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white line-clamp-1">{activeProfile?.name || user.displayName}</span>
                          <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">Premium</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <MenuButton icon={<BookMarked size={16}/>} label="Watchlist" onClick={() => { setLibraryTab('Watchlist'); setCurrentView('library'); setShowProfileMenu(false); }} />
                        <MenuButton icon={<History size={16}/>} label="History" onClick={() => { setLibraryTab('History'); setCurrentView('library'); setShowProfileMenu(false); }} />
                        <MenuButton icon={<Users size={16}/>} label="Switch Profile" onClick={() => { setCurrentView('profiles'); setShowProfileMenu(false); }} />
                      </div>

                      <div className="mt-1 pt-1 border-t border-white/5">
                        <MenuButton icon={<LogOut size={16}/>} label="Sign Out" onClick={() => { setShowSignOutConfirm(true); setShowProfileMenu(false); }} variant="danger" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <button 
                onClick={() => setCurrentView('auth')} 
                className="flex items-center gap-2 bg-white text-black px-3 py-2 md:px-5 md:py-2.5 rounded-full font-black text-[10px] md:text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              >
                <LogIn size={16} className="md:w-5 md:h-5"/>
                <span className="hidden xs:inline uppercase tracking-widest">Sign In</span>
                <span className="xs:hidden uppercase tracking-widest">Join</span>
              </button>
            )}
          </div>)}
      </motion.div>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-6 z-50 flex items-center justify-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none navigation-island-mobile">
        <div className="flex items-center gap-2 pointer-events-auto cursor-pointer" onClick={() => setCurrentView('home')}>
           <div className="w-8 h-8 rounded-full overflow-hidden shadow-[0_0_15px_rgba(229,9,20,0.3)]">
            <img src="/logo.png" alt="ApexWatch" className="w-full h-full object-cover"/>
           </div>
           <span className="font-black tracking-tighter text-xl uppercase italic">
            Apex<span className="text-red-600">Watch</span>
           </span>
        </div>
      </div>

      {/* Mobile Bottom Dock - Redesigned */}
      <motion.div 
        ref={mobileMenuRef}
        initial={{ y: 100 }} 
        animate={{ y: 0 }} 
        className="md:hidden fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between bg-black/80 backdrop-blur-3xl border border-white/10 p-2 px-4 rounded-[2rem] shadow-2xl navigation-island-mobile max-w-[500px] mx-auto"
      >
        <MobileNavItem icon={<Home size={20}/>} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')}/>
        <MobileNavItem icon={<Film size={20}/>} label="Movies" active={currentView === 'movies'} onClick={() => setCurrentView('movies')}/>
        <MobileNavItem icon={<Search size={20}/>} label="Search" active={currentView === 'discover'} onClick={() => setCurrentView('discover')}/>
        <MobileNavItem icon={<Tv size={20}/>} label="TV Shows" active={currentView === 'tv'} onClick={() => setCurrentView('tv')}/>
        
        {!loadingAuth && user ? (
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${showProfileMenu ? 'bg-white/10' : ''}`}
          >
             <div className={`p-1 rounded-xl transition-all ${showProfileMenu ? 'bg-red-600/10' : ''}`}>
                <div className={`w-6 h-6 rounded-full overflow-hidden border ${showProfileMenu ? 'border-red-500' : 'border-white/20'} bg-white/5`}>
                    {avatarUrl ? (
                       <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={12} className="text-white"/>
                      </div>
                    )}
                </div>
             </div>
             <span className={`text-[9px] font-bold ${showProfileMenu ? 'text-white' : 'text-white/40'}`}>Profile</span>
          </button>
        ) : (
          <MobileNavItem icon={<LogIn size={20}/>} label="Join" onClick={() => setCurrentView('auth')}/>
        )}

        {/* Mobile Profile Dropup */}
        <AnimatePresence>
          {showProfileMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="absolute bottom-[110%] left-0 right-0 bg-[#0f0f0f] rounded-[2rem] border border-white/10 shadow-2xl p-4 z-[60]"
            >
              <div className="flex items-center gap-4 mb-4 p-2">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-red-600">
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-white font-black uppercase text-lg italic tracking-tighter">{activeProfile?.name || user.displayName}</h4>
                  <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">Active Profile</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MenuButton icon={<BookMarked size={16}/>} label="Watchlist" onClick={() => { setLibraryTab('Watchlist'); setCurrentView('library'); setShowProfileMenu(false); }} />
                <MenuButton icon={<History size={16}/>} label="History" onClick={() => { setLibraryTab('History'); setCurrentView('library'); setShowProfileMenu(false); }} />
                <MenuButton icon={<Users size={16}/>} label="Switch" onClick={() => { setCurrentView('profiles'); setShowProfileMenu(false); }} />
                <MenuButton icon={<LogOut size={16}/>} label="Log out" onClick={() => { setShowSignOutConfirm(true); setShowProfileMenu(false); }} variant="danger" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowSignOutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass p-8 rounded-[2.5rem] border border-white/10 text-center"
            >
              <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut size={32} className="text-red-600 ml-1" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight italic">
                Sign Out?
              </h3>
              <p className="text-white/40 text-sm mb-8 leading-relaxed">
                You're about to leave your premium cinematic experience. Are you sure you want to log out?
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { logout(); setShowSignOutConfirm(false); }}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_10px_20px_rgba(229,9,20,0.3)] active:scale-95"
                >
                  Confirm Sign Out
                </button>
                <button 
                  onClick={() => setShowSignOutConfirm(false)}
                  className="w-full py-4 glass text-white/60 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 border-white/5 hover:border-white/20"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>);
}

function MenuButton({ icon, label, onClick, variant = 'default' }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        variant === 'danger' 
        ? 'text-red-500 hover:bg-red-500/10' 
        : 'text-white/70 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

function NavItem({ icon, label, active = false, onClick }) {
    return (<button onClick={onClick} className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 flex-shrink-0 ${active ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
      {icon}
      {typeof label === 'string' ? <span className="text-sm whitespace-nowrap ml-2">{label}</span> : label}
    </button>);
}

function MobileNavItem({ icon, label, active = false, onClick }) {
    return (
      <button 
        onClick={onClick} 
        className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
          active ? 'text-red-500 scale-110' : 'text-white/60'
        }`}
      >
        <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-red-600/10' : ''}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold tracking-tight ${active ? 'text-white' : 'text-white/40'}`}>
          {label}
        </span>
      </button>
    );
}
