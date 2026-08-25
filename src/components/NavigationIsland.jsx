import { Search, Home, Compass, User, Play, Menu, LogOut, LogIn, Users, Film, Tv, Sparkles, Library, History, BookMarked, Smartphone, Download, BarChart3, LayoutGrid, Cast, Dices } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CastModal } from './CastModal';
import { tmdb } from '../utils/tmdb';
import pkg from '../../package.json';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

export function NavigationIsland() {
 const { 
 currentView, 
 setCurrentView, 
 user, 
 activeProfile, 
 searchQuery, 
 setSearchQuery,
 loadingAuth,
 logout,
 setLibraryTab,
 setActiveMovieId,
 setActiveMediaType,
 updateAvailable,
 manualCheckForUpdates,
 setShowAIMoodModal,
 setShowSurpriseModal
 } = useAppContext();
 const [showProfileMenu, setShowProfileMenu] = useState(false);
 const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
 const [instantResults, setInstantResults] = useState([]);
 const [isSearching, setIsSearching] = useState(false);
 const [showSearchDropdown, setShowSearchDropdown] = useState(false);
 const profileMenuRef = useRef(null);
 const mobileMenuRef = useRef(null);
 const searchRef = useRef(null);
 const devHoldTimeoutRef = useRef(null);
 const [deferredPrompt, setDeferredPrompt] = useState(null);
 const [isUpdating, setIsUpdating] = useState(false);
 const [showCastModal, setShowCastModal] = useState(false);
 const isNative = Capacitor.isNativePlatform();

 useEffect(() => {
 const handleBeforeInstallPrompt = (e) => {
 e.preventDefault();
 setDeferredPrompt(e);
 };
 window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
 return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
 }, []);

  const handleDownloadApp = async () => {
    const latestApkUrl = `https://github.com/Mannyyy-15/ApexWatch/releases/download/v${pkg.version}/ApexWatch.apk`;
    if (Capacitor.isNativePlatform()) {
      if (manualCheckForUpdates) {
        manualCheckForUpdates();
      }
    } else {
      window.open(latestApkUrl, '_blank');
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
       className="flex items-center h-12 mb-4 outline-none rounded-xl tv-focusable overflow-hidden cursor-pointer flex-shrink-0"
     >
       <div className="w-[70px] h-full flex items-center justify-center flex-shrink-0">
         <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-white/20">
           <img src="/logo.png" alt="ApexWatch" className="w-full h-full object-cover"/>
         </div>
       </div>
       <span className="font-black text-lg tracking-tighter uppercase italic nav-label pr-4 whitespace-nowrap">
         Apex<span className="text-red-600">Watch</span>
       </span>
     </div>

     <div className="flex flex-col gap-1.5 flex-shrink-0">
       <TVNavItem icon={<Home size={24}/>} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')}/>
       <TVNavItem icon={<Film size={24}/>} label="Movies" active={currentView === 'movies'} onClick={() => setCurrentView('movies')}/>
       <TVNavItem icon={<Tv size={24}/>} label="TV Shows" active={currentView === 'tv'} onClick={() => setCurrentView('tv')}/>
       <TVNavItem icon={<Sparkles size={24}/>} label="Anime" active={currentView === 'anime'} onClick={() => setCurrentView('anime')}/>
       <TVNavItem icon={<Search size={24}/>} label="Search" active={currentView === 'discover'} onClick={() => setCurrentView('discover')}/>
     </div>

     <div className="mt-auto flex flex-col gap-1.5 pt-2 flex-shrink-0">
       {user && (
         <TVNavItem 
           icon={<div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex-shrink-0"><img src={avatarUrl} alt="" className="w-full h-full object-cover"/></div>} 
           label={activeProfile?.name || "Profile"} 
           active={currentView === 'profiles'} 
           onClick={() => setCurrentView('profiles')}
         />
       )}
       <TVNavItem 
         icon={<Download size={24} className={updateAvailable ? 'text-red-500 animate-bounce' : 'text-white/70'} />} 
         label={updateAvailable ? "Update Available" : "Download App"} 
         onClick={() => {
           window.open('https://github.com/Mannyyy-15/ApexWatch/raw/main/ApexWatch.apk', '_blank');
         }}
       />
       {user && <TVNavItem icon={<LogOut size={24} />} label="Sign Out" onClick={() => setShowSignOutConfirm(true)}/>}
     </div>
  </div>

 {/* Desktop Sidebar (Hotstar Style) */}
  <motion.div 
  initial={{ x: -100, opacity: 0 }} 
  animate={{ x: 0, opacity: 1 }} 
  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
  className="desktop-sidebar hidden md:flex flex-col fixed top-6 bottom-6 left-6 z-[60] w-[80px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl transition-all duration-500 overflow-visible"
  >
  <div className="flex flex-col h-full py-8 items-start justify-center w-full relative">
 {/* Logo */}
 <div 
 onClick={() => setCurrentView('home')} 
 className="flex items-center justify-center cursor-pointer flex-shrink-0 outline-none tv-focusable mb-14 w-[80px] group/logo"
 >
 <div className="w-10 h-10 rounded-xl overflow-hidden group-hover/logo:scale-105 transition-all duration-500 flex-shrink-0">
 <img src="/logo.png" alt="ApexWatch" className="w-full h-full object-cover"/>
 </div>
 </div>
 
 {/* Nav Items */}
 <div className="flex flex-col gap-2 w-full flex-1 justify-center pb-20">
 <SidebarNavItem icon={<Home size={24} strokeWidth={2.5}/>} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')} />
 <SidebarNavItem icon={<Search size={24} strokeWidth={2.5}/>} label="Search" active={currentView === 'discover'} onClick={() => setCurrentView('discover')} />
 <SidebarNavItem icon={<Tv size={24} strokeWidth={2.5}/>} label="TV Shows" active={currentView === 'tv'} onClick={() => setCurrentView('tv')} />
 <SidebarNavItem icon={<Film size={24} strokeWidth={2.5}/>} label="Movies" active={currentView === 'movies'} onClick={() => setCurrentView('movies')} />
 <SidebarNavItem icon={<Sparkles size={24} strokeWidth={2.5}/>} label="Anime" active={currentView === 'anime'} onClick={() => setCurrentView('anime')} />
 <SidebarNavItem icon={<LayoutGrid size={24} strokeWidth={2.5}/>} label="Browse" active={currentView === 'browse'} onClick={() => setCurrentView('browse')} />
 <div className="relative mt-2" ref={profileMenuRef}>
 <SidebarNavItem 
 icon={
 user ? (
 <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 ">
 <img src={avatarUrl || ''} alt="" className="w-full h-full object-cover"/>
 </div>
 ) : <User size={24} strokeWidth={2.5}/>
 } 
 label={user ? (activeProfile?.name || "Profile") : "Sign In"} 
 active={currentView === 'profiles' || currentView === 'auth'} 
 onClick={() => user ? setShowProfileMenu(!showProfileMenu) : setCurrentView('auth')} 
 />
 
 {/* Desktop Profile Menu Popup */}
 <AnimatePresence>
 {showProfileMenu && user && (
 <motion.div 
 initial={{ opacity: 0, x: -10, scale: 0.95 }}
 animate={{ opacity: 1, x: 0, scale: 1 }}
 exit={{ opacity: 0, x: -10, scale: 0.95 }}
 className="absolute left-[80px] bottom-0 ml-4 w-56 bg-[#0A0A0F]/95 backdrop-blur-3xl rounded-[20px] border border-glass-border shadow-2xl p-2 z-[60] overflow-hidden"
 >
 <div className="flex items-center gap-3 p-3 border-b border-white/5 mb-1">
 <div className="w-9 h-9 rounded-full overflow-hidden border border-white/15">
 <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-sm font-bold text-white truncate">{activeProfile?.name || user.displayName}</span>
 <span className="text-[9px] text-accent font-black uppercase tracking-widest">Premium</span>
 </div>
 </div>
 <div className="space-y-0.5">
 <MenuButton icon={<BookMarked size={16}/>} label="Watchlist" onClick={() => { setLibraryTab('Watchlist'); setCurrentView('library'); setShowProfileMenu(false); }} />
 <MenuButton icon={<History size={16}/>} label="History" onClick={() => { setLibraryTab('History'); setCurrentView('library'); setShowProfileMenu(false); }} />
 <MenuButton icon={<Download size={16}/>} label="Downloads" onClick={() => { setLibraryTab('Downloads'); setCurrentView('library'); setShowProfileMenu(false); }} />
 <MenuButton icon={<Cast size={16}/>} label="Cast to TV" onClick={() => { setShowCastModal(true); setShowProfileMenu(false); }} />
 <MenuButton icon={<Users size={16}/>} label="Switch Profile" onClick={() => { setCurrentView('profiles'); setShowProfileMenu(false); }} />
 </div>
 <div className="mt-1 pt-1 border-t border-white/5">
 <MenuButton icon={<LogOut size={16}/>} label="Sign Out" onClick={() => { setShowSignOutConfirm(true); setShowProfileMenu(false); }} variant="danger" />
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>

 {/* Bottom Actions */}
 <div className="flex flex-col gap-2 w-full mb-6">
 <SidebarNavItem icon={<Sparkles size={24} className="text-accent" strokeWidth={2.5}/>} label="AI Mood Match" onClick={() => setShowAIMoodModal(true)}/>
 <SidebarNavItem icon={<Dices size={24} className="text-yellow-400" strokeWidth={2.5}/>} label="Surprise Me" onClick={() => setShowSurpriseModal(true)}/>
 <SidebarNavItem icon={<Cast size={24} strokeWidth={2.5}/>} label="Cast to TV" onClick={() => setShowCastModal(true)}/>
 {!isNative && (
 <SidebarNavItem icon={<Smartphone size={24} strokeWidth={2.5}/>} label="Get App" onClick={handleDownloadApp}/>
 )}
 </div>
 </div>
 </motion.div>

  {/* Mobile Top Header (Hidden on discover/search to give full room to search bar) */}
  {currentView !== 'discover' && (
    <div className="md:hidden fixed top-0 left-0 right-0 px-4 py-3 z-50 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none navigation-island-mobile">
      <div className="flex items-center gap-2 pointer-events-auto cursor-pointer" onClick={() => setCurrentView('home')}>
        <div className="w-7 h-7 rounded-full overflow-hidden">
          <img src="/logo.png" alt="ApexWatch" className="w-full h-full object-cover"/>
        </div>
        <span className="font-black tracking-tighter text-lg uppercase italic text-white/90">
          Apex<span className="text-accent">Watch</span>
        </span>
      </div>

      {!isNative && (
        <button 
          onClick={handleDownloadApp}
          className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-wider shadow-lg shadow-red-950/50 active:scale-95 transition-all cursor-pointer border border-white/15"
        >
          <Smartphone size={13} />
          <span>Get App</span>
        </button>
      )}
    </div>
  )}

 {/* Mobile Bottom Dock - Redesigned */}
 <motion.div 
 ref={mobileMenuRef}
 initial={{ y: 100 }} 
 animate={{ y: 0 }} 
 className="md:hidden fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between bg-black/90 backdrop-blur-3xl border border-white/10 p-2.5 px-4 rounded-full shadow-2xl navigation-island-mobile max-w-[480px] mx-auto"
 >
 <MobileNavItem 
 icon={<Home size={22}/>} 
 label="Home" 
 active={currentView === 'home'} 
 onClick={() => setCurrentView('home')}
 onPointerDown={() => {
 devHoldTimeoutRef.current = setTimeout(() => {
 window.dispatchEvent(new Event('toggle_dev_console'));
 }, 2000);
 }}
 onPointerUp={() => clearTimeout(devHoldTimeoutRef.current)}
 onPointerLeave={() => clearTimeout(devHoldTimeoutRef.current)}
 onTouchStart={() => {
 devHoldTimeoutRef.current = setTimeout(() => {
 window.dispatchEvent(new Event('toggle_dev_console'));
 }, 2000);
 }}
 onTouchEnd={() => clearTimeout(devHoldTimeoutRef.current)}
 onTouchCancel={() => clearTimeout(devHoldTimeoutRef.current)}
 />
 <MobileNavItem icon={<Film size={22}/>} label="Movies" active={currentView === 'movies'} onClick={() => setCurrentView('movies')}/>
 <MobileNavItem icon={<Search size={22}/>} label="Search" active={currentView === 'discover'} onClick={() => setCurrentView('discover')}/>
 <MobileNavItem icon={<Tv size={22}/>} label="TV Shows" active={currentView === 'tv'} onClick={() => setCurrentView('tv')}/>
 
        {loadingAuth ? (
          <div className="flex items-center p-2.5 rounded-full bg-transparent">
            <div className="w-[22px] h-[22px] rounded-full bg-white/10 animate-pulse border border-white/5 flex items-center justify-center">
              <User size={12} className="text-white/20"/>
            </div>
          </div>
        ) : user ? (
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex items-center p-2.5 rounded-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${
              showProfileMenu ? 'bg-white/15 shadow-inner backdrop-blur-md' : 'bg-transparent'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <div className={`w-[22px] h-[22px] rounded-full overflow-hidden border transition-colors duration-300 ${showProfileMenu ? 'border-white' : 'border-white/20 hover:border-white/50'} bg-white/5`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={12} className="text-white"/>
                  </div>
                )}
              </div>
              {updateAvailable && <div className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full border border-black z-10 translate-x-1/2 -translate-y-1/2" />}
            </div>
            <div 
              className={`transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex items-center ${
                showProfileMenu ? 'max-w-[80px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'
              }`}
            >
              <span className="text-[11px] font-black tracking-wider text-white uppercase whitespace-nowrap">
                Profile
              </span>
            </div>
          </button>
 ) : (
 <MobileNavItem icon={<LogIn size={22}/>} label="Join" onClick={() => setCurrentView('auth')}/>
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
  <MenuButton icon={<Sparkles size={14} className="text-accent"/>} label="AI Vibe Match" onClick={() => { setShowAIMoodModal(true); setShowProfileMenu(false); }} />
  <MenuButton icon={<Dices size={14} className="text-yellow-400"/>} label="Surprise Me" onClick={() => { setShowSurpriseModal(true); setShowProfileMenu(false); }} />
  <MenuButton icon={<BookMarked size={14}/>} label="Watchlist" onClick={() => { setLibraryTab('Watchlist'); setCurrentView('library'); setShowProfileMenu(false); }} />
  <MenuButton icon={<History size={14}/>} label="History" onClick={() => { setLibraryTab('History'); setCurrentView('library'); setShowProfileMenu(false); }} />
  <MenuButton icon={<Download size={14}/>} label="Downloads" onClick={() => { setLibraryTab('Downloads'); setCurrentView('library'); setShowProfileMenu(false); }} />
  {isNative ? (
  updateAvailable && (
  <MenuButton icon={<Download size={14} className="text-accent"/>} label="Update App" onClick={() => { handleDownloadApp(); setShowProfileMenu(false); }} />
  )
  ) : (
  <MenuButton icon={<Smartphone size={14}/>} label="Download App" onClick={() => { handleDownloadApp(); setShowProfileMenu(false); }} />
  )}
  <MenuButton icon={<Users size={14}/>} label="Switch" onClick={() => { setCurrentView('profiles'); setShowProfileMenu(false); }} />
 <div className="col-span-2 mt-1 border-t border-white/5 pt-1.5">
 <MenuButton icon={<LogOut size={14}/>} label="Log out" onClick={() => { setShowSignOutConfirm(true); setShowProfileMenu(false); }} variant="danger" />
 <div className="text-center pt-2 pb-1">
 <span className="text-[10px] text-white/20 font-black tracking-widest uppercase">ApexWatch v{pkg.version}</span>
 </div>
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
 className="w-full py-3.5 bg-accent hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 cursor-pointer"
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
 <CastModal isOpen={showCastModal} onClose={() => setShowCastModal(false)} />
 </>);
}

function MenuButton({ icon, label, onClick, variant = 'default' }) {
  return (
    <button 
      onClick={onClick}
      tabIndex={0}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left cursor-pointer tv-focusable ${
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

function SidebarNavItem({ icon, label, active = false, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center py-4 w-full transition-all duration-300 flex-shrink-0 cursor-pointer outline-none tv-focusable group/item relative
      ${active ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
    >
      {active && (
        <motion.div 
          layoutId="activeIndicator"
          className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full"
        />
      )}
      <div className="w-[80px] flex items-center justify-center flex-shrink-0 relative">
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover/item:scale-110'}`}>
          {icon}
        </div>
      </div>
      {/* Floating Tooltip */}
      <div className="absolute left-[80px] opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-2 -translate-x-2 transition-all duration-300 pointer-events-none z-[100] flex items-center">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-2xl">
          <span className="text-[13px] font-bold tracking-wider whitespace-nowrap text-white drop-shadow-md">
            {label}
          </span>
        </div>
      </div>
    </button>
  );
}

function TVNavItem({ icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      tabIndex={0}
      className={`flex items-center h-12 w-full rounded-xl transition-all duration-300 cursor-pointer tv-focusable overflow-hidden flex-shrink-0 ${
        active 
          ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(229,9,20,0.6)]' 
          : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      <div className="w-[70px] h-full flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="nav-label text-sm font-bold tracking-wide uppercase whitespace-nowrap pr-4">
        {label}
      </div>
    </button>
  );
}

function NavItem({ icon, label, active = false, onClick }) {
 return (<button onClick={onClick} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all duration-300 flex-shrink-0 cursor-pointer tv-focusable ${active ? 'bg-white/10 text-white font-bold shadow-inner' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
 {icon}
 {typeof label === 'string' ? <span className="text-xs md:text-sm font-bold tracking-tight whitespace-nowrap ml-1.5">{label}</span> : label}
 </button>);
}

function MobileNavItem({ icon, label, active = false, onClick, onPointerDown, onPointerUp, onPointerLeave, onTouchStart, onTouchEnd, onTouchCancel }) {
  return (
    <button 
      onClick={onClick} 
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      className={`flex items-center p-2.5 rounded-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${
        active ? 'bg-white/15 shadow-inner backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className={`transition-colors duration-300 flex items-center justify-center ${active ? 'text-white' : 'text-white/50 hover:text-white/80'}`}>
        {icon}
      </div>
      <div 
        className={`transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex items-center ${
          active ? 'max-w-[80px] opacity-100 ml-2' : 'max-w-0 opacity-0 ml-0'
        }`}
      >
        <span className="text-[11px] font-black tracking-wider text-white uppercase whitespace-nowrap">
          {label}
        </span>
      </div>
    </button>
  );
}
