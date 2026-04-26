import { Search, Home, Compass, User, Play, Menu, LogOut, LogIn, Users, Film, Tv, Sparkles, Library, History, BookMarked } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import React, { useState } from 'react';

export function NavigationIsland() {
    const { currentView, setCurrentView, user, activeProfile, loadingAuth, login, logout, searchQuery, setSearchQuery, setLibraryTab } = useAppContext();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const avatarUrl = activeProfile?.avatarUrl || user?.photoURL;

    return (<>
      {/* Desktop Island */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} 
        className="hidden md:flex fixed top-8 left-1/2 -translate-x-1/2 z-50 items-center glass p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10"
      >
        <div onClick={() => setCurrentView('home')} className="flex items-center gap-3 pl-2 pr-6 cursor-pointer group flex-shrink-0">
          <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-full shadow-[0_0_20px_rgba(229,9,20,0.4)] group-hover:scale-110 transition-all duration-500">
            <Play size={20} className="fill-white text-white ml-1"/>
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

        <div className="flex items-center bg-white/5 hover:bg-white/10 transition-all rounded-full px-5 py-2.5 mr-3 group border border-white/5 focus-within:border-white/20 flex-shrink-0">
          <Search size={16} className="text-white/40 group-focus-within:text-white transition-colors"/>
          <input 
            type="text" 
            placeholder="Search content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                setCurrentView('discover');
              }
            }}
            className="bg-transparent border-none text-sm text-white placeholder-white/30 focus:outline-none w-32 focus:w-56 transition-all duration-500 ml-3 font-medium"
          />
        </div>

        {!loadingAuth && (<div className="relative">
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
                        <MenuButton icon={<LogOut size={16}/>} label="Sign Out" onClick={() => { logout(); setShowProfileMenu(false); }} variant="danger" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <button onClick={login} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform">
                <LogIn size={16}/>
                Sign In
              </button>
            )}
          </div>)}
      </motion.div>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-6 z-50 flex items-center justify-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto cursor-pointer" onClick={() => setCurrentView('home')}>
           <div className="flex items-center justify-center w-8 h-8 bg-red-600 rounded-full shadow-[0_0_15px_rgba(229,9,20,0.4)]">
            <Play size={14} className="fill-white text-white ml-1"/>
           </div>
           <span className="font-black tracking-tighter text-xl uppercase italic">
            Apex<span className="text-red-600">Watch</span>
           </span>
        </div>
      </div>

      {/* Mobile Bottom Dock - Simplified */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-8 bg-black/60 backdrop-blur-3xl border border-white/10 p-2 px-6 rounded-[2rem] shadow-2xl">
        <MobileNavItem icon={<Home size={22}/>} label="Home" active={currentView === 'home'} onClick={() => setCurrentView('home')}/>
        <MobileNavItem icon={<Compass size={22}/>} label="Explore" active={currentView === 'movies'} onClick={() => setCurrentView('movies')}/>
        <MobileNavItem icon={<Search size={22}/>} label="Search" active={currentView === 'discover'} onClick={() => setCurrentView('discover')}/>
        
        {!loadingAuth && user ? (
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${showProfileMenu ? 'bg-white/10' : ''}`}
          >
             <div className="w-7 h-7 rounded-full overflow-hidden border border-white/20 bg-white/5">
                {avatarUrl ? (
                   <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={14} className="text-white"/>
                  </div>
                )}
             </div>
             <span className="text-[10px] font-bold text-white/60">Profile</span>
          </button>
        ) : (
          <MobileNavItem icon={<LogIn size={22}/>} label="Join" onClick={login}/>
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
                <MenuButton icon={<LogOut size={16}/>} label="Log out" onClick={() => { logout(); setShowProfileMenu(false); }} variant="danger" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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
    return (<button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 flex-shrink-0 ${active ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
      {icon}
      <span className="text-sm whitespace-nowrap">{label}</span>
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
