import { Search, Home, Compass, User, Play, Menu, LogOut, LogIn, Users, Film, Tv, Sparkles, Library, History, BookMarked, Smartphone, Download, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { tmdb } from '../utils/tmdb';

export function NavigationIsland() {
    const { 
        currentView, 
        setCurrentView, 
        user, 
        activeProfile, 
        searchQuery, 
        setSearchQuery,
        loadingAuth,
        setLibraryTab,
        setActiveMovieId,
        setActiveMediaType,
        updateAvailable
    } = useAppContext();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [instantResults, setInstantResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const profileMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const searchRef = useRef(null);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleDownloadApp = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            // Fallback/Direct APK link - change this URL to your generated APK link
            window.open('https://apexwatch.app/download', '_blank');
        }
    };

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
          className="flex items-center gap-4 mb-12 px-3 py-2 outline-none group rounded-2xl tv-focusable"
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
          {updateAvailable && <NavItem icon={<Download size={32} className="text-accent" />} label={<span className="nav-label ml-4 text-lg text-red-500 font-bold italic">Update App</span>} onClick={handleDownloadApp}/>}
          <NavItem icon={<LogOut size={32} className="ml-1"/>} label={<span className="nav-label ml-4 text-lg">Sign Out</span>} onClick={() => setShowSignOutConfirm(true)}/>
        </div>
      </div>

      {/* Desktop Island */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} 
        className="hidden md:flex fixed top-6 left-1/2 -translate-x-1/2 z-50 items-center bg-glass-bg backdrop-blur-2xl border border-glass-border py-3.5 px-7 rounded-full shadow-[0_25px_50px_rgba(0,0,0,0.6)] navigation-island-desktop hover:border-white/10 transition-all duration-300 gap-2.5"
      >
        <div 
          onClick={() => setCurrentView('home')} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') setCurrentView('home');
          }}
          tabIndex={0}
          role="button"
          className="flex items-center gap-3 pl-4 pr-5 cursor-pointer group flex-shrink-0 outline-none tv-focusable"
        >
          <div className="w-11 h-11 rounded-full overflow-hidden shadow-[0_0_15px_rgba(229,9,20,0.4)] group-hover:scale-105 transition-all duration-500">
            <img src="/logo.png" alt="ApexWatch" className="w-full h-full object-cover"/>
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase italic text-white/90 group-hover:text-white transition-colors">
            Apex<span className="text-accent">Watch</span>
          </span>
        </div>
        
        <div className="flex items-center gap-2 px-1 flex-shrink-0">
          <NavItem icon={<Home size={20}/>} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')}/>
          <NavItem icon={<Film size={20}/>} label="Movies" active={currentView === 'movies'} onClick={() => setCurrentView('movies')}/>
          <NavItem icon={<Tv size={20}/>} label="TV Shows" active={currentView === 'tv'} onClick={() => setCurrentView('tv')}/>
          <NavItem icon={<Sparkles size={20}/>} label="Anime" active={currentView === 'anime'} onClick={() => setCurrentView('anime')}/>
        </div>

        <div className="w-[1px] h-6 bg-white/10 mx-3 flex-shrink-0"></div>

        <div 
          ref={searchRef}
          className="flex items-center bg-white/5 hover:bg-white/10 transition-all rounded-full px-6 py-3.5 mr-2 group border border-white/5 focus-within:border-accent/40 focus-within:bg-black/40 flex-shrink-0 relative"
        >
          <Search size={18} className="text-white/40 group-focus-within:text-accent transition-colors"/>
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
            className="bg-transparent border-none text-base text-white placeholder-white/30 focus:outline-none w-32 focus:w-52 transition-all duration-500 ml-2.5 font-medium"
          />

          {/* Search Dropdown */}
          <AnimatePresence>
            {showSearchDropdown && (searchQuery.length >= 2) && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-3 bg-[#0a0a0a]/95 backdrop-blur-3xl rounded-[20px] border border-glass-border shadow-2xl p-1.5 z-50 overflow-hidden min-w-[280px]"
              >
                {isSearching ? (
                  <div className="p-4 text-center text-white/40 text-[10px] font-black uppercase tracking-widest">Searching...</div>
                ) : instantResults.length > 0 ? (
                  <div className="space-y-0.5">
                    {instantResults.map(movie => (
                      <button
                        key={movie.id}
                        onClick={() => handleResultClick(movie)}
                        className="w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-glass-hover transition-all text-left group/item cursor-pointer"
                      >
                        <div className="w-9 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 border border-white/5">
                          <img src={movie.poster} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white group-hover/item:text-accent transition-colors truncate">{movie.title}</span>
                          <div className="flex items-center gap-1.5 text-[9px] text-white/30 font-black uppercase tracking-wider">
                            <span>{movie.year}</span>
                            <span>•</span>
                            <span className="text-accent/80">{movie.type === 'tv' ? 'TV' : 'Movie'}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                    <button 
                      onClick={() => { setCurrentView('discover'); setShowSearchDropdown(false); }}
                      className="w-full p-2.5 text-center text-[9px] font-black uppercase tracking-widest text-accent hover:text-red-400 transition-colors border-t border-white/5 mt-1 cursor-pointer"
                    >
                      See all results
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-white/40 text-[10px] font-black uppercase tracking-widest">No results found</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative mr-1.5" ref={profileMenuRef}>
            {loadingAuth ? (
                <div className="w-11 h-11 rounded-full bg-white/10 animate-pulse border border-white/5 flex items-center justify-center">
                    <User size={18} className="text-white/20"/>
                </div>
            ) : user ? (
              <>
                <div className="relative" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 hover:border-accent transition-all bg-white/5 cursor-pointer">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={18} className="text-white"/>
                      </div>
                    )}
                  </div>
                  {updateAvailable && <div className="absolute top-0 right-0 w-3 h-3 bg-red-600 rounded-full border-2 border-black z-10" />}
                </div>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-48 bg-[#0a0a0a]/95 backdrop-blur-3xl rounded-[20px] border border-glass-border shadow-2xl p-1.5 z-50 overflow-hidden"
                    >
                      <div className="flex items-center gap-2.5 p-2.5 border-b border-white/5 mb-1">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-white/15">
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white truncate">{activeProfile?.name || user.displayName}</span>
                          <span className="text-[8px] text-accent font-black uppercase tracking-widest">Premium</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <MenuButton icon={<BookMarked size={14}/>} label="Watchlist" onClick={() => { setLibraryTab('Watchlist'); setCurrentView('library'); setShowProfileMenu(false); }} />
                        <MenuButton icon={<History size={14}/>} label="History" onClick={() => { setLibraryTab('History'); setCurrentView('library'); setShowProfileMenu(false); }} />
                        <MenuButton icon={<Download size={14}/>} label="Downloads" onClick={() => { setLibraryTab('Downloads'); setCurrentView('library'); setShowProfileMenu(false); }} />
                        {updateAvailable && <MenuButton icon={<Download size={14} className="text-accent"/>} label="Update App" onClick={() => { handleDownloadApp(); setShowProfileMenu(false); }} />}
                        <MenuButton icon={<Users size={14}/>} label="Switch Profile" onClick={() => { setCurrentView('profiles'); setShowProfileMenu(false); }} />
                      </div>

                      <div className="mt-1 pt-1 border-t border-white/5">
                        <MenuButton icon={<LogOut size={14}/>} label="Sign Out" onClick={() => { setShowSignOutConfirm(true); setShowProfileMenu(false); }} variant="danger" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <button 
                onClick={() => setCurrentView('auth')} 
                className="flex items-center gap-2.5 bg-white text-black px-6 py-3 rounded-full font-black text-[13px] hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer"
              >
                <LogIn size={16}/>
                <span className="hidden xs:inline uppercase tracking-wider">Sign In</span>
                <span className="xs:hidden uppercase tracking-wider">Join</span>
              </button>
            )}
        </div>
      </motion.div>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-5 z-50 flex items-center justify-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none navigation-island-mobile">
        <div className="flex items-center gap-2 pointer-events-auto cursor-pointer" onClick={() => setCurrentView('home')}>
           <div className="w-7 h-7 rounded-full overflow-hidden shadow-[0_0_10px_rgba(229,9,20,0.3)]">
            <img src="/logo.png" alt="ApexWatch" className="w-full h-full object-cover"/>
           </div>
           <span className="font-black tracking-tighter text-lg uppercase italic text-white/90">
            Apex<span className="text-accent">Watch</span>
           </span>
        </div>
      </div>

      {/* Mobile Bottom Dock - Redesigned */}
      <motion.div 
        ref={mobileMenuRef}
        initial={{ y: 100 }} 
        animate={{ y: 0 }} 
        className="md:hidden fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between bg-black/80 backdrop-blur-3xl border border-glass-border p-1.5 px-3 rounded-[24px] shadow-2xl navigation-island-mobile max-w-[480px] mx-auto"
      >
        <MobileNavItem icon={<Home size={18}/>} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')}/>
        <MobileNavItem icon={<Film size={18}/>} label="Movies" active={currentView === 'movies'} onClick={() => setCurrentView('movies')}/>
        <MobileNavItem icon={<Search size={18}/>} label="Search" active={currentView === 'discover'} onClick={() => setCurrentView('discover')}/>
        <MobileNavItem icon={<Tv size={18}/>} label="TV Shows" active={currentView === 'tv'} onClick={() => setCurrentView('tv')}/>
        
        {loadingAuth ? (
          <div className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl">
             <div className="p-1 rounded-lg">
                <div className="w-5.5 h-5.5 rounded-full bg-white/10 animate-pulse border border-white/5 flex items-center justify-center">
                    <User size={10} className="text-white/20"/>
                </div>
             </div>
             <span className="text-[8px] font-bold text-white/40">Profile</span>
          </div>
        ) : user ? (
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${showProfileMenu ? 'bg-white/5' : ''}`}
          >
             <div className="p-1 rounded-lg relative">
                <div className={`w-5.5 h-5.5 rounded-full overflow-hidden border ${showProfileMenu ? 'border-accent' : 'border-white/20'} bg-white/5`}>
                    {avatarUrl ? (
                       <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={10} className="text-white"/>
                      </div>
                    )}
                </div>
                {updateAvailable && <div className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full border border-black z-10 translate-x-1/4 -translate-y-1/4" />}
             </div>
             <span className={`text-[8px] font-bold ${showProfileMenu ? 'text-white' : 'text-white/40'}`}>Profile</span>
          </button>
        ) : (
          <MobileNavItem icon={<LogIn size={18}/>} label="Join" onClick={() => setCurrentView('auth')}/>
        )}

        {/* Mobile Profile Dropup */}
        <AnimatePresence>
          {showProfileMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="absolute bottom-[115%] left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-3xl rounded-[24px] border border-glass-border shadow-2xl p-3.5 z-[60]"
            >
              <div className="flex items-center gap-3 mb-3 p-1.5">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent">
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-white font-black uppercase text-base italic tracking-tight">{activeProfile?.name || user.displayName}</h4>
                  <p className="text-accent text-[9px] font-black uppercase tracking-widest">Active Profile</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <MenuButton icon={<BookMarked size={14}/>} label="Watchlist" onClick={() => { setLibraryTab('Watchlist'); setCurrentView('library'); setShowProfileMenu(false); }} />
                <MenuButton icon={<History size={14}/>} label="History" onClick={() => { setLibraryTab('History'); setCurrentView('library'); setShowProfileMenu(false); }} />
                <MenuButton icon={<Download size={14}/>} label="Downloads" onClick={() => { setLibraryTab('Downloads'); setCurrentView('library'); setShowProfileMenu(false); }} />
                {updateAvailable && <MenuButton icon={<Download size={14} className="text-accent"/>} label="Update App" onClick={() => { handleDownloadApp(); setShowProfileMenu(false); }} />}
                <MenuButton icon={<Users size={14}/>} label="Switch" onClick={() => { setCurrentView('profiles'); setShowProfileMenu(false); }} />
                <div className="col-span-2 mt-1 border-t border-white/5 pt-1.5">
                  <MenuButton icon={<LogOut size={14}/>} label="Log out" onClick={() => { setShowSignOutConfirm(true); setShowProfileMenu(false); }} variant="danger" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowSignOutConfirm(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xs bg-bg-surface border border-glass-border p-6 rounded-[28px] text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={28} className="text-accent ml-1" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight italic">
                Sign Out?
              </h3>
              <p className="text-white/40 text-xs mb-6 leading-relaxed">
                You're about to leave your premium cinematic experience. Are you sure you want to log out?
              </p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => { logout(); setShowSignOutConfirm(false); }}
                  className="w-full py-3.5 bg-accent hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_10px_20px_rgba(229,9,20,0.3)] active:scale-95 cursor-pointer"
                >
                  Confirm Sign Out
                </button>
                <button 
                  onClick={() => setShowSignOutConfirm(false)}
                  className="w-full py-3.5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 border border-white/5 cursor-pointer"
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
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left cursor-pointer ${
        variant === 'danger' 
        ? 'text-accent hover:bg-accent/10' 
        : 'text-white/70 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

function NavItem({ icon, label, active = false, onClick }) {
    return (<button onClick={onClick} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all duration-300 flex-shrink-0 cursor-pointer tv-focusable ${active ? 'bg-white/10 text-white font-bold shadow-inner' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
      {icon}
      {typeof label === 'string' ? <span className="text-xs md:text-sm font-bold tracking-tight whitespace-nowrap ml-1.5">{label}</span> : label}
    </button>);
}

function MobileNavItem({ icon, label, active = false, onClick }) {
    return (
      <button 
        onClick={onClick} 
        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all cursor-pointer ${
          active ? 'text-accent scale-105' : 'text-white/65'
        }`}
      >
        <div className={`p-1 rounded-lg transition-all ${active ? 'bg-accent/10' : ''}`}>
          {icon}
        </div>
        <span className={`text-[8px] font-bold tracking-tight ${active ? 'text-white' : 'text-white/40'}`}>
          {label}
        </span>
      </button>
    );
}
