import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { NavigationIsland } from './components/NavigationIsland';
import { Hero } from './components/Hero';
import { MovieGrid } from './components/MovieGrid';
import { AppProvider, useAppContext } from './context/AppContext';
import { UpdateService } from './services/UpdateService';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, Keyboard, X } from 'lucide-react';
import { useTV } from './hooks/useTV';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { StatusBar, Style } from '@capacitor/status-bar';

const MovieDetails = lazy(() => import('./components/MovieDetails').then(m => ({ default: m.MovieDetails })));
const VideoPlayer = lazy(() => import('./components/VideoPlayer').then(m => ({ default: m.VideoPlayer })));
const Discover = lazy(() => import('./components/Discover').then(m => ({ default: m.Discover })));
const ProfilesSelection = lazy(() => import('./components/ProfilesSelection').then(m => ({ default: m.ProfilesSelection })));
const Auth = lazy(() => import('./components/Auth').then(m => ({ default: m.Auth })));
const Onboarding = lazy(() => import('./components/Onboarding').then(m => ({ default: m.Onboarding })));
const StatsDashboard = lazy(() => import('./components/StatsDashboard').then(m => ({ default: m.StatsDashboard })));
const CategoryView = lazy(() => import('./components/CategoryView').then(m => ({ default: m.CategoryView })));
const ProfileLibrary = lazy(() => import('./components/ProfileLibrary').then(m => ({ default: m.ProfileLibrary })));
const DevConsole = lazy(() => import('./components/DevConsole').then(m => ({ default: m.DevConsole })));
const UpdaterModal = lazy(() => import('./components/UpdaterModal').then(m => ({ default: m.UpdaterModal })));
const CategoryExplore = lazy(() => import('./components/CategoryExplore').then(m => ({ default: m.CategoryExplore })));
const Browse = lazy(() => import('./components/Browse').then(m => ({ default: m.Browse })));

const pageVariants = {
 initial: {
 opacity: 0,
 scale: 0.98,
 y: 10,
 },
 animate: {
 opacity: 1,
 scale: 1,
 y: 0,
 transition: {
 duration: 0.25,
 ease: "easeOut",
 }
 },
 exit: {
 opacity: 0,
 scale: 0.98,
 y: -10,
 transition: {
 duration: 0.2,
 ease: "easeIn"
 }
 }
};

function ShortcutsModal({ onClose }) {
 return (
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
 className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-[28px] shadow-2xl"
 >
 <button 
 onClick={onClose}
 className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all cursor-pointer"
 >
 <X size={18} />
 </button>

 <div className="flex items-center gap-3.5 mb-6">
 <div className="w-10 h-10 bg-accent/15 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
 <Keyboard size={20} />
 </div>
 <div>
 <h3 className="text-lg font-black uppercase tracking-wider text-white italic">Keyboard Shortcuts</h3>
 <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Controls & Navigation</p>
 </div>
 </div>

 <div className="space-y-4">
 {[
 { keys: ['?'], desc: 'Toggle this Shortcuts Guide' },
 { keys: ['Space'], desc: 'Play / Pause active video or trailer' },
 { keys: ['M'], desc: 'Toggle Mute / Unmute audio' },
 { keys: ['Esc'], desc: 'Close active video player or detail panel' },
 { keys: ['↑', '↓', '←', '→'], desc: 'TV navigation and layout focus' },
 ].map((item, idx) => (
 <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
 <span className="text-xs font-bold text-white/60">{item.desc}</span>
 <div className="flex gap-1.5">
 {item.keys.map((k, i) => (
 <kbd key={i} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/80 font-mono shadow-md">
 {k}
 </kbd>
 ))}
 </div>
 </div>
 ))}
 </div>

 <div className="text-[9px] text-white/30 font-black uppercase tracking-widest text-center mt-6 pt-4 border-t border-white/5">
 ApexWatch Navigation System
 </div>
 </motion.div>
 );
}

function MainLayout() {
 const { currentView } = useAppContext();
 const isTV = useTV();
 const [showScrollUp, setShowScrollUp] = useState(false);
 const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
 const [showDevConsole, setShowDevConsole] = useState(false);
 const scrollContainerRef = useRef(null);

 useEffect(() => {
 const container = scrollContainerRef.current;
 if (!container) return;

 const handleScroll = () => {
 setShowScrollUp(container.scrollTop > 200);
 };

 container.addEventListener('scroll', handleScroll);
 
 // Fix status bar overlapping the app
 if (Capacitor.isNativePlatform()) {
 StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
 StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {});
 StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
 }
 
 const handleToggleDevConsole = () => {
 setShowDevConsole(prev => !prev);
 };
 window.addEventListener('toggle_dev_console', handleToggleDevConsole);

 return () => {
 container.removeEventListener('scroll', handleScroll);
 window.removeEventListener('toggle_dev_console', handleToggleDevConsole);
 };
 }, []);

 useEffect(() => {
 // Scroll to top on every view change
 scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
 }, [currentView]);

 useEffect(() => {
 const handleKeyDown = (e) => {
 if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
 return;
 }

 const key = e.key.toLowerCase();

 if (e.key === '?') {
 e.preventDefault();
 setShowShortcutsHelp(prev => !prev);
 return;
 }

 if (e.key === 'Escape') {
 setShowShortcutsHelp(false);
 }

 if (e.key === ' ' || key === 'm' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Escape') {
 e.preventDefault();
 const event = new CustomEvent('global_shortcut', { 
 detail: { key: e.key, code: e.code } 
 });
 window.dispatchEvent(event);
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 const scrollToTop = () => {
 if (scrollContainerRef.current) {
 scrollContainerRef.current.scrollTo({
 top: 0,
 behavior: 'smooth'
 });
 }
 };

 return (<div className="bg-black min-h-screen text-white font-sans selection:bg-white selection:text-black overflow-hidden relative">
 {currentView !== 'auth' && currentView !== 'onboarding' && currentView !== 'profiles' && currentView !== 'details' && currentView !== 'player' && <NavigationIsland />}
 
 <main ref={scrollContainerRef} className="w-full h-screen overflow-y-auto overflow-x-hidden hide-scrollbar pb-24 md:pb-0 md:pl-[120px] relative">
 <Suspense fallback={null}>
 <AnimatePresence mode="wait">
 {currentView === 'home' && (
 <motion.div 
 key="home"
 variants={pageVariants}
 initial="initial"
 animate="animate"
 exit="exit"
 className="pb-10"
 >
 <Hero />
 <MovieGrid />
 </motion.div>
 )}
 {currentView === 'movies' && (
 <motion.div 
 key="movies"
 variants={pageVariants}
 initial="initial"
 animate="animate"
 exit="exit"
 >
 <CategoryView type="movies" title="Movies" />
 </motion.div>
 )}
 {currentView === 'tv' && (
 <motion.div 
 key="tv"
 variants={pageVariants}
 initial="initial"
 animate="animate"
 exit="exit"
 >
 <CategoryView type="tv" title="TV Shows" />
 </motion.div>
 )}
 {currentView === 'anime' && (
 <motion.div 
 key="anime"
 variants={pageVariants}
 initial="initial"
 animate="animate"
 exit="exit"
 >
 <CategoryView type="anime" title="Anime" />
 </motion.div>
 )}
 {currentView === 'discover' && (
 <motion.div 
 key="discover"
 variants={pageVariants}
 initial="initial"
 animate="animate"
 exit="exit"
 >
 <Discover />
 </motion.div>
 )}
 {currentView === 'browse' && (
 <motion.div 
 key="browse"
 variants={pageVariants}
 initial="initial"
 animate="animate"
 exit="exit"
 >
 <Browse />
 </motion.div>
 )}
 {currentView === 'explore' && (
 <motion.div 
 key="explore"
 variants={pageVariants}
 initial="initial"
 animate="animate"
 exit="exit"
 >
 <CategoryExplore />
 </motion.div>
 )}
 {currentView === 'library' && (
 <motion.div 
 key="library"
 variants={pageVariants}
 initial="initial"
 animate="animate"
 exit="exit"
 >
 <ProfileLibrary />
 </motion.div>
 )}
 {currentView === 'stats' && (
 <motion.div 
 key="stats"
 variants={pageVariants}
 initial="initial"
 animate="animate"
 exit="exit"
 >
 <StatsDashboard />
 </motion.div>
 )}
 </AnimatePresence>
 </Suspense>
 </main>

 {/* Floating Actions */}
 <AnimatePresence>
 {showScrollUp && (
 <motion.button
 initial={{ opacity: 0, scale: 0.5, y: 50 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.5, y: 50 }}
 onClick={scrollToTop}
 className="hidden md:flex fixed bottom-10 right-10 z-[60] w-14 h-14 bg-red-600 rounded-full items-center justify-center text-white hover:scale-110 active:scale-95 transition-all group cursor-pointer"
 >
 <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />
 <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
 </motion.button>
 )}
 </AnimatePresence>

 {/* Shortcuts Help Modal */}
 {/* Overlays */}
 <Suspense fallback={null}>
 <AnimatePresence>
 {(showShortcutsHelp || showDevConsole) && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 pointer-events-auto">
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }} 
 onClick={() => { setShowShortcutsHelp(false); setShowDevConsole(false); }}
 className="absolute inset-0 bg-black/80 backdrop-blur-md"
 />
 {showShortcutsHelp && <ShortcutsModal onClose={() => setShowShortcutsHelp(false)} />}
 {showDevConsole && <DevConsole onClose={() => setShowDevConsole(false)} />}
 </div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {currentView === 'auth' && <Auth key="auth"/>}
 {currentView === 'onboarding' && <Onboarding key="onboarding"/>}
 {currentView === 'details' && <MovieDetails key="details"/>}
 {currentView === 'player' && <VideoPlayer key="player"/>}
 {currentView === 'profiles' && <ProfilesSelection key="profiles"/>}
 </AnimatePresence>
 <UpdaterModal />
 </Suspense>
 </div>);
}

export default function App() {
 // Global lock to portrait mode on startup
 useEffect(() => {
 if (Capacitor.isNativePlatform()) {
 ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
 }
 UpdateService.notifyAppReady();

 // Setup Dev Console Interceptor
 const originalLog = console.log;
 const originalWarn = console.warn;
 const originalError = console.error;

 const pushLog = (type, args) => {
 try {
 window.__DEV_LOGS__ = window.__DEV_LOGS__ || [];
 window.__DEV_LOGS__.push({
 type,
 timestamp: new Date().toLocaleTimeString(),
 message: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
 });
 if (window.__DEV_LOGS__.length > 100) window.__DEV_LOGS__.shift();
 window.dispatchEvent(new Event('dev_logs_updated'));
 } catch (e) {}
 };

 console.log = (...args) => { pushLog('info', args); originalLog.apply(console, args); };
 console.warn = (...args) => { pushLog('warn', args); originalWarn.apply(console, args); };
 console.error = (...args) => { pushLog('error', args); originalError.apply(console, args); };

 return () => {
 console.log = originalLog;
 console.warn = originalWarn;
 console.error = originalError;
 };
 }, []);

 return (<AppProvider>
 <MainLayout />
 </AppProvider>);
}
