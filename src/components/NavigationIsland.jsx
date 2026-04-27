import { Search, Home, Compass, User, Play, Menu, LogOut, LogIn, Users, Film, Tv, Sparkles, Library, History, BookMarked } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import React, { useState, useRef, useEffect } from 'react';

export function NavigationIsland() {
    const { currentView, setCurrentView, user, activeProfile, loadingAuth, logout, searchQuery, setSearchQuery, setLibraryTab } = useAppContext();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const [focusedNavIndex, setFocusedNavIndex] = useState(-1);
    const [isNavFocused, setIsNavFocused] = useState(false);
    
    const profileMenuRef = useRef(null);
    const mobileMenuRef = useRef(null);

    const navItems = [
      { id: 'home', label: 'Home', icon: <Home size={24}/>, view: 'home' },
      { id: 'movies', label: 'Movies', icon: <Film size={24}/>, view: 'movies' },
      { id: 'tv', label: 'TV Shows', icon: <Tv size={24}/>, view: 'tv' },
      { id: 'anime', label: 'Anime', icon: <Sparkles size={24}/>, view: 'anime' },
      { id: 'discover', label: 'Search', icon: <Search size={24}/>, view: 'discover' },
      { id: 'library', label: 'Library', icon: <Library size={24}/>, view: 'library' },
    ];

    // D-PAD Navigation for Side Rail
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (!isNavFocused) {
          // If we are in the content area and press Left, focus the nav
          if (e.key === 'ArrowLeft' && focusedNavIndex === -1) {
            setIsNavFocused(true);
            setFocusedNavIndex(0);
          }
          return;
        }

        switch (e.key) {
          case 'ArrowDown':
            setFocusedNavIndex(prev => Math.min(prev + 1, navItems.length - 1));
            break;
          case 'ArrowUp':
            setFocusedNavIndex(prev => Math.max(prev - 1, 0));
            break;
          case 'ArrowRight':
            setIsNavFocused(false); // Move focus back to content
            break;
          case 'Enter':
            const item = navItems[focusedNavIndex];
            if (item) {
              setCurrentView(item.view);
              if (item.view === 'library') setLibraryTab('Watchlist');
            }
            break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isNavFocused, focusedNavIndex]);

    // Close menu on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        }
        if (showProfileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showProfileMenu]);

    const avatarUrl = activeProfile?.avatarUrl || user?.photoURL;

    return (<>
      {/* TV SIDE RAIL - Visible on Landscape / TV Screens */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-24 hover:w-64 bg-black/40 backdrop-blur-3xl border-r border-white/5 z-[60] flex-col items-center py-10 transition-all duration-500 group/rail"
        onMouseEnter={() => setIsNavFocused(true)}
        onMouseLeave={() => setIsNavFocused(false)}
      >
        {/* Logo */}
        <div className="mb-12 cursor-pointer flex items-center gap-4 px-6 w-full" onClick={() => setCurrentView('home')}>
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(229,9,20,0.4)] flex-shrink-0">
            <img src="/logo.png" alt="" className="w-full h-full object-cover"/>
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase italic opacity-0 group-hover/rail:opacity-100 transition-opacity whitespace-nowrap">
            Apex<span className="text-red-600">Watch</span>
          </span>
        </div>

        {/* Nav Items */}
        <div className="flex-1 w-full px-4 space-y-4">
          {navItems.map((item, index) => (
            <button 
              key={item.id}
              onClick={() => {
                setCurrentView(item.view);
                if (item.view === 'library') setLibraryTab('Watchlist');
              }}
              className={`w-full flex items-center gap-6 p-4 rounded-2xl transition-all duration-300 ${
                currentView === item.view 
                  ? 'bg-red-600 text-white shadow-[0_0_40px_rgba(229,9,20,0.4)]' 
                  : (isNavFocused && focusedNavIndex === index ? 'bg-white/10 text-white scale-105' : 'text-white/40 hover:text-white hover:bg-white/5')
              }`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span className="font-black uppercase tracking-widest text-xs opacity-0 group-hover/rail:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Profile / Bottom Action */}
        <div className="mt-auto w-full px-4">
          {!loadingAuth && user ? (
             <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${
                isNavFocused && focusedNavIndex === navItems.length ? 'bg-white/10' : ''
              }`}
             >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="opacity-0 group-hover/rail:opacity-100 transition-opacity overflow-hidden">
                  <p className="text-[10px] font-black text-white truncate">{activeProfile?.name || user.displayName}</p>
                  <p className="text-[8px] font-black text-red-600 uppercase tracking-tighter">Premium</p>
                </div>
             </button>
          ) : (
            <button onClick={() => setCurrentView('auth')} className="w-full flex items-center gap-6 p-4 text-white/40 hover:text-white">
              <LogIn size={24} />
              <span className="font-black uppercase text-xs opacity-0 group-hover/rail:opacity-100 transition-opacity">Sign In</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Desktop Island (Top) - Remains for smaller desktops */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="hidden md:flex lg:hidden fixed top-8 left-1/2 -translate-x-1/2 z-50 items-center glass p-2 rounded-full shadow-2xl border-white/10"
      >
        <NavItem icon={<Home size={18}/>} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')}/>
        <NavItem icon={<Film size={18}/>} label="Movies" active={currentView === 'movies'} onClick={() => setCurrentView('movies')}/>
        <NavItem icon={<Tv size={18}/>} label="TV" active={currentView === 'tv'} onClick={() => setCurrentView('tv')}/>
        <NavItem icon={<Search size={18}/>} label="Explore" active={currentView === 'discover'} onClick={() => setCurrentView('discover')}/>
      </motion.div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-6 z-50 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <span className="font-black text-xl uppercase italic">Apex<span className="text-red-600">Watch</span></span>
        {user && (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20" onClick={() => setShowProfileMenu(true)}>
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Mobile/TV Bottom Dock (Fallback) */}
      <motion.div 
        initial={{ y: 100 }} 
        animate={{ y: 0 }} 
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 bg-black/60 backdrop-blur-3xl border border-white/10 p-2 px-6 rounded-[2rem] shadow-2xl"
      >
        <MobileNavItem icon={<Home size={22}/>} active={currentView === 'home'} onClick={() => setCurrentView('home')}/>
        <MobileNavItem icon={<Compass size={22}/>} active={currentView === 'movies'} onClick={() => setCurrentView('movies')}/>
        <MobileNavItem icon={<Search size={22}/>} active={currentView === 'discover'} onClick={() => setCurrentView('discover')}/>
        <MobileNavItem icon={<User size={22}/>} active={currentView === 'profiles'} onClick={() => setCurrentView('profiles')}/>
      </motion.div>
      
      {/* Sign Out Confirmation */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-10 rounded-[3rem] border border-white/10 text-center max-w-sm"
            >
              <h3 className="text-2xl font-black text-white mb-4 uppercase italic">Sign Out?</h3>
              <p className="text-white/40 mb-8">Are you sure you want to end your session?</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => logout()} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">Confirm</button>
                <button onClick={() => setShowSignOutConfirm(false)} className="w-full py-4 glass text-white/60 rounded-2xl font-black uppercase text-xs">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>);
}

function NavItem({ icon, label, active = false, onClick }) {
    return (<button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${active ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white'}`}>
      {icon}
      <span className="text-sm font-bold">{label}</span>
    </button>);
}

function MobileNavItem({ icon, active = false, onClick }) {
    return (
      <button onClick={onClick} className={`p-3 rounded-2xl transition-all ${active ? 'bg-red-600 text-white shadow-lg' : 'text-white/40'}`}>
        {icon}
      </button>
    );
}

function MenuButton({ icon, label, onClick, variant = 'default' }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${variant === 'danger' ? 'text-red-500 hover:bg-red-500/10' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
      {icon}
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

