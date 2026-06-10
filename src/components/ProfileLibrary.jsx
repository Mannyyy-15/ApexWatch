import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookMarked, History as HistoryIcon, Play, Trash2, Clock, ChevronRight, ChevronDown, Lock, Download } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { firestoreService } from '../utils/firestore';
import { tmdb } from '../utils/tmdb';
import { MovieCardSkeleton } from './Skeleton';

export function ProfileLibrary() {
 const { user, activeProfile, setActiveMovieId, setActiveMediaType, setCurrentView, libraryTab: activeTab, setLibraryTab: setActiveTab, downloads, removeDownload } = useAppContext();
 const [watchlist, setWatchlist] = useState([]);
 const [history, setHistory] = useState([]);
 const [loading, setLoading] = useState(true);

 const [wifiOnly, setWifiOnly] = useState(() => {
 return localStorage.getItem('apexwatch_download_wifi_only') === 'true';
 });
 const [downloadQuality, setDownloadQuality] = useState(() => {
 return localStorage.getItem('apexwatch_download_quality') || '1080p';
 });

 const handleWifiToggle = (e) => {
 setWifiOnly(e.target.checked);
 localStorage.setItem('apexwatch_download_wifi_only', e.target.checked);
 };

 const handleQualityChange = (e) => {
 setDownloadQuality(e.target.value);
 localStorage.setItem('apexwatch_download_quality', e.target.value);
 };

 // Calculate Storage details
 const parseSize = (sizeStr) => {
 if (!sizeStr) return 1.4;
 const num = parseFloat(sizeStr);
 if (sizeStr.includes('MB')) return num / 1024;
 return num;
 };
 const apexwatchUsed = downloads.reduce((acc, d) => acc + parseSize(d.size), 0);
 const otherAppsUsed = 24.8; 
 const totalStorage = 64; 
 const freeSpace = Math.max(0, totalStorage - otherAppsUsed - apexwatchUsed);
 const apexwatchPercent = (apexwatchUsed / totalStorage) * 100;
 const otherPercent = (otherAppsUsed / totalStorage) * 100;
 const freePercent = (freeSpace / totalStorage) * 100;

 const tabs = [
 { name: 'Watchlist', icon: <BookMarked size={14} /> },
 { name: 'History', icon: <HistoryIcon size={14} /> },
 { name: 'Downloads', icon: <Download size={14} /> }
 ];

 useEffect(() => {
 const loadLibraryData = async () => {
 if (!user || !activeProfile) {
 setLoading(false);
 return;
 }
 setLoading(true);
 try {
 const [wlRaw, histRaw] = await Promise.all([
 firestoreService.getWatchlist(user.uid, activeProfile.id),
 firestoreService.getAllWatchProgress(user.uid, activeProfile.id)
 ]);

 const wlDetails = await Promise.all(
 wlRaw.map(async (item) => {
 const details = item.contentType === 'tv' 
 ? await tmdb.fetchTVDetails(item.contentId)
 : await tmdb.fetchMovieDetails(item.contentId);
 return tmdb.formatMovie(details);
 })
 );

 const histDetails = await Promise.all(
 histRaw.map(async (item) => {
 const details = (item.type || item.contentType) === 'tv' 
 ? await tmdb.fetchTVDetails(item.id)
 : await tmdb.fetchMovieDetails(item.id);
 return {
 ...tmdb.formatMovie(details),
 progress: item.progress,
 lastWatched: item.updatedAt
 };
 })
 );

 setWatchlist(wlDetails.filter(Boolean));
 setHistory(histDetails.filter(Boolean).sort((a, b) => b.lastWatched - a.lastWatched));
 } catch (error) {
 console.error('Error loading library:', error);
 } finally {
 setLoading(false);
 }
 };

 loadLibraryData();
 }, [user, activeProfile]);

 const handleMovieClick = (id, type) => {
 setActiveMovieId(id);
 setActiveMediaType(type || 'movie');
 setCurrentView('details');
 };

 const removeFromWatchlist = async (e, id) => {
 e.stopPropagation();
 await firestoreService.removeFromWatchlist(user.uid, activeProfile.id, id);
 setWatchlist(prev => prev.filter(m => m.id !== id));
 };

 return (
 <div className="library-container min-h-screen pt-28 md:pt-36 px-4 md:px-16 lg:px-20 pb-32 w-full max-w-[1600px] mx-auto">
 
 {/* Library Header & Tabs Switcher */}
 {user && (
 <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
 <div>
 <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-1">
 My <span className="text-red-600">Library</span>
 </h2>
 <p className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-[0.25em]">
 Your personalized workspace
 </p>
 </div>
 
 {/* Tabs Selector Strip */}
 <div className="flex gap-2.5 overflow-x-auto hide-scrollbar scroll-smooth">
 {tabs.map((tab) => {
 const isActive = activeTab === tab.name;
 return (
 <button
 key={tab.name}
 onClick={() => setActiveTab(tab.name)}
 className={`library-tab-button flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest border transition-all duration-300 cursor-pointer select-none active:scale-95 tv-focusable ${
 isActive
 ? 'bg-accent border-accent text-white '
 : 'bg-white/5 border-white/5 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/10'
 }`}
 >
 {tab.icon}
 <span>{tab.name}</span>
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* Content Area */}
 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 transition={{ duration: 0.4 }}
 >
 {!user ? (
 <div className="py-20 flex flex-col items-center justify-center text-center">
 <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
 <Lock size={40} className="text-white/20" />
 </div>
 <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Login Required</h2>
 <p className="text-white/40 max-w-sm mb-10 text-lg leading-relaxed">
 Join ApexWatch to save your favorite movies, track your progress, and sync across all your devices.
 </p>
 <button 
 onClick={() => setCurrentView('auth')}
 className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all tv-focusable"
 >
 Sign In Now
 </button>
 </div>
 ) : (
 loading ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
 {[...Array(24)].map((_, i) => <MovieCardSkeleton key={i} />)}
 </div>
 ) : (
 activeTab === 'Watchlist' ? (
 watchlist.length > 0 ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
 {watchlist.map((movie) => (
 <div 
 key={movie.id} 
 className="group relative cursor-pointer tv-focusable" 
 onClick={() => handleMovieClick(movie.id, movie.type)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleMovieClick(movie.id, movie.type);
 }}
 tabIndex={0}
 role="button"
 >
 <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden mb-2 border border-white/10 group-hover:border-red-600 transition-colors">
 <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
 <button 
 onClick={(e) => removeFromWatchlist(e, movie.id)}
 className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-black transition-all border border-white/10"
 >
 <Trash2 size={18} />
 </button>
 </div>
 <h3 className="text-sm font-bold text-white truncate px-1">{movie.title}</h3>
 <p className="text-[10px] text-white/40 font-black uppercase tracking-wider px-1">{movie.year}</p>
 </div>
 ))}
 </div>
 ) : (
 <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
 <BookMarked size={60} className="mb-6" />
 <h3 className="text-2xl font-black uppercase italic">Your Watchlist is Empty</h3>
 <p className="max-w-xs mt-2">Start adding movies and shows to keep track of what you want to watch next.</p>
 </div>
 )
 ) : activeTab === 'History' ? (
 history.length > 0 ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
 {history.map((movie) => (
 <div 
 key={movie.id} 
 className="group relative cursor-pointer tv-focusable" 
 onClick={() => handleMovieClick(movie.id, movie.type)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleMovieClick(movie.id, movie.type);
 }}
 tabIndex={0}
 role="button"
 >
 <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden mb-2 border border-white/10">
 <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover"/>
 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 <Play size={32} className="text-white fill-white" />
 </div>
 <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
 <div 
 className="h-full bg-red-600" 
 style={{ width: `${movie.progress}%` }}
 ></div>
 </div>
 </div>
 <h3 className="text-sm font-bold text-white truncate px-1">{movie.title}</h3>
 <div className="flex items-center gap-2 px-1">
 <Clock size={10} className="text-red-500" />
 <span className="text-[10px] text-white/40 font-bold">{movie.progress}% Watched</span>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
 <HistoryIcon size={60} className="mb-6" />
 <h3 className="text-2xl font-black uppercase italic">No Watch History</h3>
 <p className="max-w-xs mt-2">Pick something to watch and we'll track your progress right here.</p>
 </div>
 )
 ) : (
 <div className="space-y-10">
 {/* Storage & Settings Dashboard */}
 <div className="grid md:grid-cols-2 gap-6">
 {/* Storage Card */}
 <div className="bg-white/3 border border-white/5 p-6 rounded-[24px] backdrop-blur-md">
 <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4">Device Storage</h3>
 
 {/* Stacked Progress Bar */}
 <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex mb-6">
 <div 
 style={{ width: `${apexwatchPercent}%` }} 
 className="h-full bg-accent transition-all duration-500 "
 title={`ApexWatch: ${apexwatchUsed.toFixed(2)} GB`}
 />
 <div 
 style={{ width: `${otherPercent}%` }} 
 className="h-full bg-white/20 transition-all duration-500"
 title={`Other Apps: ${otherAppsUsed} GB`}
 />
 <div 
 style={{ width: `${freePercent}%` }} 
 className="h-full bg-transparent transition-all duration-500"
 title={`Free Space: ${freeSpace.toFixed(2)} GB`}
 />
 </div>

 {/* Storage Legend */}
 <div className="grid grid-cols-3 gap-4">
 <div>
 <div className="flex items-center gap-1.5 mb-1">
 <div className="w-2.5 h-2.5 rounded-full bg-accent" />
 <span className="text-[10px] font-black uppercase tracking-wider text-white/50">ApexWatch</span>
 </div>
 <span className="text-sm font-bold text-white">{apexwatchUsed.toFixed(2)} GB</span>
 </div>
 <div>
 <div className="flex items-center gap-1.5 mb-1">
 <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
 <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Other Apps</span>
 </div>
 <span className="text-sm font-bold text-white">{otherAppsUsed} GB</span>
 </div>
 <div>
 <div className="flex items-center gap-1.5 mb-1">
 <div className="w-2.5 h-2.5 rounded-full border border-white/20 bg-transparent" />
 <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Free Space</span>
 </div>
 <span className="text-sm font-bold text-white">{freeSpace.toFixed(2)} GB</span>
 </div>
 </div>
 </div>

 {/* Download Settings Card */}
 <div className="bg-white/3 border border-white/5 p-6 rounded-[24px] backdrop-blur-md flex flex-col justify-between">
 <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4">Download Preferences</h3>
 
 <div className="space-y-4">
 {/* Wi-Fi Toggle */}
 <div className="flex items-center justify-between">
 <div>
 <span className="text-xs font-bold text-white block">Download over Wi-Fi Only</span>
 <span className="text-[9px] text-white/40 uppercase font-black tracking-wider">Prevent cellular data usage</span>
 </div>
 <label className="relative inline-flex items-center cursor-pointer select-none">
 <input 
 type="checkbox" 
 checked={wifiOnly}
 onChange={handleWifiToggle}
 className="sr-only peer" 
 />
 <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
 </label>
 </div>

 {/* Quality Select */}
 <div className="flex items-center justify-between">
 <div>
 <span className="text-xs font-bold text-white block">Download Quality</span>
 <span className="text-[9px] text-white/40 uppercase font-black tracking-wider">Affects storage space used</span>
 </div>
 <div className="relative">
 <select 
 value={downloadQuality}
 onChange={handleQualityChange}
 className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-10 font-bold text-white text-xs focus:outline-none focus:ring-2 focus:ring-accent"
 >
 <option value="720p" className="bg-[#050505] text-white">Standard (720p)</option>
 <option value="1080p" className="bg-[#050505] text-white">High (1080p)</option>
 </select>
 <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 pointer-events-none" />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Downloads Grid */}
 <div>
 <div className="flex items-center gap-3.5 md:gap-4 mb-6">
 <div className="w-1.5 h-6 bg-accent rounded-full "></div>
 <h3 className="text-lg font-black uppercase tracking-wider italic text-white">Downloaded Files</h3>
 </div>

 {downloads.length > 0 ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
 {downloads.map((movie) => (
 <div 
 key={movie.id} 
 className="group relative cursor-pointer animate-fade-in tv-focusable" 
 onClick={() => handleMovieClick(movie.id, movie.type)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleMovieClick(movie.id, movie.type);
 }}
 tabIndex={0}
 role="button"
 >
 <div className="relative aspect-[2/3] rounded-[24px] overflow-hidden mb-2 border border-white/10 group-hover:border-accent transition-colors">
 <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"/>
 
 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 <Play size={32} className="text-white fill-white scale-90 group-hover:scale-100 transition-transform duration-300" />
 </div>

 <button 
 onClick={(e) => {
 e.stopPropagation();
 removeDownload(movie.id);
 }}
 className="absolute top-4 right-4 w-10 h-10 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-black transition-all border border-white/10 z-20"
 title="Delete Download"
 >
 <Trash2 size={18} />
 </button>
 <div className="absolute bottom-3 left-3 bg-[#0a0a0a]/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase border border-white/5 text-white/70">
 {movie.size || '1.4 GB'}
 </div>
 </div>
 <h3 className="text-sm font-bold text-white truncate px-1">{movie.title}</h3>
 <div className="flex items-center gap-1.5 px-1 text-[10px] text-white/40 font-black uppercase tracking-wider">
 <span>{movie.year}</span>
 <span>•</span>
 <span className="text-accent">{movie.quality || '1080p'}</span>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
 <Download size={60} className="mb-6" />
 <h3 className="text-2xl font-black uppercase italic">No Downloads</h3>
 <p className="max-w-xs mt-2">Download movies and shows to watch offline on your local device.</p>
 </div>
 )}
 </div>
 </div>
 )
 )
 )}
 </motion.div>
 </AnimatePresence>
 </div>
 );
}
