// Fresh Build - Ensuring all icons are properly imported
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Share2, Info, ChevronDown, Download, Check, Trash2, Users, Volume2, VolumeX } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState, useEffect, useRef } from 'react';
import { useTVBackHandler } from '../hooks/useTV';
import { tmdb } from '../utils/tmdb';
import { firestoreService } from '../utils/firestore';
import { MovieRow } from './MovieRow';
import { MovieDetailsSkeleton } from './Skeleton';

export function MovieDetails() {
 const { activeMovieId, setActiveMovieId, setCurrentView, goBack, user, activeProfile, activeSeason, setActiveSeason, activeEpisode, setActiveEpisode, activeMediaType, setActiveMediaType, cachedDetails, setCachedDetails, downloads, addDownload, removeDownload, createWatchParty, joinWatchParty } = useAppContext();
 const [showPartyModal, setShowPartyModal] = useState(false);
 const [partyCodeInput, setPartyCodeInput] = useState('');
 
 useTVBackHandler(() => goBack());
 const [movie, setMovie] = useState(() => cachedDetails[activeMovieId] || null);
 const [inWatchlist, setInWatchlist] = useState(false);
 const [hasProgress, setHasProgress] = useState(null);
 const [loading, setLoading] = useState(!cachedDetails[activeMovieId]);
 const [activeTab, setActiveTab] = useState(() => {
 const saved = sessionStorage.getItem(`apexwatch_tab_${activeMovieId}`);
 return saved || 'Overview';
 });

 useEffect(() => {
 sessionStorage.setItem(`apexwatch_tab_${activeMovieId}`, activeTab);
 }, [activeTab, activeMovieId]);
 const [episodes, setEpisodes] = useState([]);
 const [fetchingEpisodes, setFetchingEpisodes] = useState(false);

 const [isPipActive, setIsPipActive] = useState(false);
 const [isPipDismissed, setIsPipDismissed] = useState(false);
 const [downloadProgress, setDownloadProgress] = useState(null);
 const [trailerReady, setTrailerReady] = useState(false);
 const [isMuted, setIsMuted] = useState(true);
 const trailerTimerRef = useRef(null);

 useEffect(() => {
 if (!activeMovieId) return;
 setIsPipActive(false);
 setIsPipDismissed(false);
 setDownloadProgress(null);
 setTrailerReady(false);
 setIsMuted(true);
 clearTimeout(trailerTimerRef.current);

 const loadMovieDetails = async () => {
 setLoading(true);
 try {
 let rawData;
 if (activeMediaType === 'movie') {
 rawData = await tmdb.fetchMovieDetails(activeMovieId);
 // Double check if it's actually a movie (fallback for old bookmarks/history)
 if (!rawData.title && !rawData.id) {
 rawData = await tmdb.fetchTVDetails(activeMovieId);
 }
 } else {
 rawData = await tmdb.fetchTVDetails(activeMovieId);
 if (!rawData.name && !rawData.id) {
 rawData = await tmdb.fetchMovieDetails(activeMovieId);
 }
 }
 
 const formatted = tmdb.formatMovie(rawData);
 const finalMovie = {
 ...formatted,
 tagline: rawData.tagline,
 budget: rawData.budget ? `$${(rawData.budget / 1000000).toFixed(1)}M` : null,
 revenue: rawData.revenue ? `$${(rawData.revenue / 1000000).toFixed(1)}M` : null,
 status: rawData.status,
 languages: rawData.spoken_languages?.map(l => l.english_name).join(', '),
 production: rawData.production_companies?.slice(0, 2).map(p => p.name).join(' & '),
 trailer: rawData.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key
 };
 
 setMovie(finalMovie);
 setCachedDetails(prev => ({ ...prev, [activeMovieId]: finalMovie }));

 if (user && activeProfile) {
 const [wl, progress] = await Promise.all([
 firestoreService.getWatchlist(user.uid, activeProfile.id),
 firestoreService.getWatchProgress(user.uid, activeProfile.id, activeMovieId)
 ]);
 setInWatchlist(wl.some(item => item.contentId === activeMovieId));
 if (progress && (progress.progressSeconds > 30 || movie?.type === 'tv' || activeMediaType === 'tv')) {
 setHasProgress(progress);
 } else {
 setHasProgress(null);
 }
 }
 } catch (error) {
 console.error('Error loading movie details:', error);
 } finally {
 setLoading(false);
 }
 };

 loadMovieDetails();
 const container = document.querySelector('.details-container');
 if (container) container.scrollTo(0, 0);

 return () => {};
 }, [activeMovieId, user, activeProfile]);

 useEffect(() => {
 const container = document.querySelector('.details-container');
 if (!container) return;

 const handleScroll = () => {
 if (container.scrollTop > 380) {
 setIsPipActive(true);
 } else {
 setIsPipActive(false);
 }
 };

 container.addEventListener('scroll', handleScroll);
 return () => container.removeEventListener('scroll', handleScroll);
 }, [movie]);

 useEffect(() => {
 if (movie?.type === 'tv' && activeSeason) {
 const loadEpisodes = async () => {
 setFetchingEpisodes(true);
 try {
 const data = await tmdb.fetchTVSeasonDetails(movie.tmdbId, activeSeason);
 setEpisodes(data.episodes || []);
 } catch (err) {
 console.error('Error fetching episodes:', err);
 } finally {
 setFetchingEpisodes(false);
 }
 };
 loadEpisodes();
 }
 }, [movie, activeSeason]);

 const toggleWatchlist = async () => {
 if (!user) {
 setCurrentView('auth');
 return;
 }
 if (!activeProfile || !movie) return;
 try {
 if (inWatchlist) {
 await firestoreService.removeFromWatchlist(user.uid, activeProfile.id, movie.id);
 setInWatchlist(false);
 } else {
 await firestoreService.addToWatchlist(user.uid, activeProfile.id, movie.id, movie.type);
 setInWatchlist(true);
 }
 } catch (error) { console.error('Error toggling watchlist:', error); }
 };

 const isDownloaded = movie ? downloads.some(d => d.id === movie.id) : false;

 const downloadIntervalRef = useRef(null);

 useEffect(() => {
 return () => {
 if (downloadIntervalRef.current) clearInterval(downloadIntervalRef.current);
 };
 }, []);

 const startDownloadSimulation = () => {
 if (!movie) return;
 setDownloadProgress(0);
 let current = 0;
 
 if (downloadIntervalRef.current) clearInterval(downloadIntervalRef.current);
 
 downloadIntervalRef.current = setInterval(() => {
 current += 10;
 if (current >= 100) {
 current = 100;
 setDownloadProgress(100);
 clearInterval(downloadIntervalRef.current);
 setTimeout(() => {
 setDownloadProgress(null);
 try { addDownload(movie); } catch(e){}
 }, 500);
 } else {
 setDownloadProgress(current);
 }
 }, 300);
 };

 const handleDownloadClick = () => {
 if (!user) {
 setCurrentView('auth');
 return;
 }
 if (isDownloaded) {
 removeDownload(movie.id);
 } else if (downloadProgress === null) {
 startDownloadSimulation();
 }
 };

 if (loading || !movie) {
 return <MovieDetailsSkeleton />;
 }

 const tabs = ['Overview', 'Details'];
 if (movie.type === 'tv') tabs.splice(1, 0, 'Episodes');

 // Ensure we don't land on Episodes if it's not a TV show
 if (activeTab === 'Episodes' && movie.type !== 'tv') {
 setActiveTab('Overview');
 }

 return (
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="details-container absolute inset-0 w-full h-[100dvh] overflow-y-auto bg-[#050505] text-white z-40 hide-scrollbar"
 >
 {/* Close Button */}
 <button onClick={() => goBack()} className="close-button fixed top-6 left-6 z-50 w-10 h-10 bg-black/40 hover:bg-accent border border-glass-border hover:border-accent hover:text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xl duration-300 tv-focusable">
 <X size={18}/>
 </button>

 {/* Cinematic Hero Header */}
 <div className="relative w-full min-h-[75vh] md:h-[90vh] flex items-end overflow-hidden">
 {/* Backdrop Layer */}
 <div className="absolute inset-0">
 <AnimatePresence initial={false}>
 {/* Static backdrop - fades out when trailer plays */}
 <motion.img 
 key="backdrop"
 initial={{ opacity: 0 }}
 animate={{ opacity: trailerReady ? 0 : 1 }}
 transition={{ duration: 1.2 }}
 src={movie.backdrop} 
 className="w-full h-full object-cover transform scale-105 absolute inset-0" 
 alt="" 
 />
 </AnimatePresence>

 {/* Trailer iframe - loads after a short delay */}
 {movie.trailer && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: trailerReady ? 1 : 0 }}
 transition={{ duration: 1.2 }}
 className="absolute inset-0 overflow-hidden"
 >
 <iframe
 key={movie.trailer}
 src={`https://www.youtube.com/embed/${movie.trailer}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${movie.trailer}&modestbranding=1&iv_load_policy=3&cc_load_policy=0`}
 className="absolute inset-0 w-full h-full pointer-events-none"
 style={{ transform: 'scale(1.12)', transformOrigin: 'center', border: 'none' }}
 allow="autoplay; encrypted-media"
 onLoad={() => { trailerTimerRef.current = setTimeout(() => setTrailerReady(true), 1500); }}
 />
 </motion.div>
 )}

 {/* Mute toggle */}
 {movie.trailer && trailerReady && (
 <motion.button
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: 0.5 }}
 onClick={() => setIsMuted(m => !m)}
 className="absolute bottom-28 md:bottom-32 right-6 md:right-20 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90 cursor-pointer shadow-xl"
 >
 {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
 </motion.button>
 )}

 {/* Stronger mobile gradients for visibility */}
 <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 md:via-[#050505]/40 to-transparent"></div>
 <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-transparent"></div>
 <div className="absolute inset-0 bg-black/20 md:bg-transparent"></div>
 </div>

 {/* Content Overlay */}
 <div className="relative z-10 w-full px-6 md:px-20 pb-12 md:pb-24">
 <div className="grid lg:grid-cols-[280px_1fr] gap-8 md:gap-12 items-end">
 {/* Poster Column - Hidden on mobile */}
 <motion.div 
 initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
 className="hidden lg:block relative group"
 >
 <img src={movie.poster} className="w-full aspect-[2/3] rounded-2xl border border-white/10" alt="" />
 </motion.div>

 {/* Title & Actions Column */}
 <div className="flex-1 space-y-6 md:space-y-8">
 <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2.5 flex-wrap">
 <span className="px-2.5 py-0.5 bg-accent/20 border border-accent/40 text-white text-[9px] font-black rounded-md tracking-tighter uppercase ">Apex Original</span>
 <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white/5 border border-glass-border rounded-md">
 <span className="text-accent text-[10px] font-black uppercase">{movie.match} Match</span>
 </div>
 <span className="text-white/50 text-xs font-bold">{movie.year} • {movie.duration} • {movie.rating}</span>
 </motion.div>

 <div className="space-y-2.5">
 <h1 className="display-text text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-2 leading-[0.95] uppercase italic">
 {movie.title}
 </h1>
 {movie.tagline && (
 <p className="text-sm md:text-lg lg:text-xl text-white/40 font-bold italic tracking-tight line-clamp-2 md:line-clamp-none">{movie.tagline}</p>
 )}
 </div>

 <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
 <button 
 onClick={() => {
 if (hasProgress && movie.type === 'tv') {
 if (hasProgress.season) setActiveSeason(hasProgress.season);
 if (hasProgress.episode) setActiveEpisode(hasProgress.episode);
 }
 setCurrentView('player');
 }} 
 className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 md:px-9 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-base hover:scale-105 transition-all shadow-2xl active:scale-95 cursor-pointer tv-focusable ${
 hasProgress ? 'bg-accent text-white ' : 'bg-white text-black hover:bg-white/95'
 }`}
 >
 <Play fill="currentColor" size={16} className="md:w-5 md:h-5"/> 
 {hasProgress ? (
 movie.type === 'tv' && hasProgress.episode
 ? `Resume S${hasProgress.season || 1}E${hasProgress.episode} (${hasProgress.progress}%)`
 : `Resume (${hasProgress.progress}%)`
 ) : 'Play Now'}
 </button>
 <div className="flex flex-col gap-2.5 w-full sm:w-auto">
 <div className="flex gap-3 w-full sm:w-auto">
 <button onClick={toggleWatchlist} className="flex-1 sm:flex-none px-6 py-3.5 md:px-8 md:py-4 bg-white/5 border border-glass-border rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider hover:bg-white/10 hover:border-white/20 transition-all whitespace-nowrap text-center cursor-pointer tv-focusable">
 {inWatchlist ? 'In Watchlist' : 'Add to List'}
 </button>

 <button 
 onClick={handleDownloadClick}
 className={`w-12 h-12 md:w-14 md:h-14 bg-white/5 border border-glass-border rounded-xl md:rounded-2xl flex items-center justify-center transition-all cursor-pointer relative group tv-focusable ${
 isDownloaded ? 'text-green-500 border-green-500/20 bg-green-500/5 hover:bg-green-500/10' : 'hover:bg-white/10 hover:border-white/20'
 }`}
 title={isDownloaded ? "Remove Download" : downloadProgress !== null ? `Downloading ${downloadProgress}%` : "Download Offline"}
 >
 {downloadProgress !== null ? (
 <div className="relative flex items-center justify-center w-6 h-6">
 <svg className="w-6 h-6 -rotate-90 absolute" viewBox="0 0 24 24">
 <circle
 className="text-white/10"
 strokeWidth="2.5"
 stroke="currentColor"
 fill="transparent"
 r="9"
 cx="12"
 cy="12"
 />
 <circle
 className="text-accent transition-all duration-300"
 strokeWidth="2.5"
 strokeDasharray={56.5}
 strokeDashoffset={56.5 - (downloadProgress / 100) * 56.5}
 strokeLinecap="round"
 stroke="currentColor"
 fill="transparent"
 r="9"
 cx="12"
 cy="12"
 />
 </svg>
 <span className="text-[7px] font-black text-white">{downloadProgress}</span>
 </div>
 ) : isDownloaded ? (
 <Check size={16} className="md:w-5 md:h-5 text-green-500 group-hover:hidden" />
 ) : (
 <Download size={16} className="md:w-5 md:h-5 text-white" />
 )}
 {isDownloaded && (
 <Trash2 size={16} className="md:w-5 md:h-5 text-red-500 hidden group-hover:block absolute" />
 )}
 </button>

 <button className="w-12 h-12 md:w-14 md:h-14 bg-white/5 border border-glass-border rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer tv-focusable">
 <Share2 size={16} className="md:w-5 md:h-5" />
 </button>

 <button 
 onClick={() => setShowPartyModal(true)}
 className="w-12 h-12 md:w-14 md:h-14 bg-white/5 border border-glass-border rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-[#e50914] hover:border-[#e50914] transition-all cursor-pointer tv-focusable group"
 title="Watch Party"
 >
 <Users size={16} className="md:w-5 md:h-5 text-white group-hover:scale-110 transition-transform" />
 </button>
 </div>
 {downloadProgress !== null && (
 <div className="text-[10px] text-accent font-black uppercase tracking-wider flex items-center gap-2 mt-1">
 <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
 <span>Downloading offline... {downloadProgress}% (Remaining: {Math.ceil((100 - downloadProgress) * 0.4)}s — 12.4 MB/s)</span>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Sticky Tabs Navbar with Glassmorphism */}
 <div className="px-6 md:px-20 border-b border-glass-border sticky top-0 z-30 bg-[#0A0A0F]/80 backdrop-blur-2xl overflow-x-auto hide-scrollbar">
 <div className="flex gap-6 md:gap-9 min-w-max">
 {tabs.map(tab => (
 <button 
 key={tab} 
 onClick={() => setActiveTab(tab)}
 className={`tab-button py-5 text-xs font-black uppercase tracking-[0.25em] relative transition-colors cursor-pointer tv-focusable ${
 activeTab === tab ? 'text-white' : 'text-white/35 hover:text-white/60'
 }`}
 >
 {tab}
 {activeTab === tab && (
 <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent " />
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Tab Content */}
 <div className="px-6 md:px-20 py-10 md:py-16">
 {activeTab === 'Overview' && (
 <div className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-20 max-w-[1600px]">
 <div className="space-y-12 md:space-y-16">
 {/* Synopsis */}
 <section>
 <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-4 md:mb-6">Storyline</h3>
 <p className="text-lg md:text-2xl lg:text-3xl text-white/80 leading-snug font-medium max-w-4xl">
 {movie.description}
 </p>
 </section>

 {/* Main Cast */}
 <section>
 <div className="flex items-center justify-between mb-6 md:mb-8">
 <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">Leading Cast</h3>
 <button className="text-xs font-bold text-white/40 hover:text-white">See Full Credits</button>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
 {movie.cast.slice(0, 5).map((actor, idx) => (
 <div key={idx} className="group">
 <div className="aspect-[3/4] rounded-xl md:rounded-[20px] overflow-hidden mb-3 border border-glass-border shadow-xl transition-all duration-500 group-hover:border-accent/40 ">
 <img src={actor.profilePath} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105" alt="" />
 </div>
 <h4 className="font-bold text-xs md:text-sm text-white group-hover:text-accent transition-colors truncate">{actor.name}</h4>
 <p className="text-[8px] md:text-[9px] text-white/30 font-black uppercase tracking-tighter truncate">{actor.character}</p>
 </div>
 ))}
 </div>
 </section>
 </div>

 {/* Metadata Sidebar */}
 <div className="space-y-6 md:space-y-8 bg-glass-bg border border-glass-border p-6 md:p-8 rounded-[24px] h-fit shadow-2xl">
 <div className="grid grid-cols-2 gap-6">
 <div>
 <h5 className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Director</h5>
 <p className="font-bold text-sm md:text-base truncate text-white/95">{movie.director}</p>
 </div>
 <div>
 <h5 className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Status</h5>
 <p className="font-bold text-sm md:text-base text-white/95">{movie.status}</p>
 </div>
 {movie.budget && (
 <div>
 <h5 className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Budget</h5>
 <p className="font-bold text-sm md:text-base text-green-400">{movie.budget}</p>
 </div>
 )}
 {movie.revenue && (
 <div>
 <h5 className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Box Office</h5>
 <p className="font-bold text-sm md:text-base text-blue-400">{movie.revenue}</p>
 </div>
 )}
 </div>

 <div className="space-y-4 pt-6 border-t border-white/5">
 <div>
 <h5 className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Production</h5>
 <p className="text-white/60 text-xs md:text-sm font-semibold">{movie.production}</p>
 </div>
 <div>
 <h5 className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Languages</h5>
 <p className="text-white/60 text-xs md:text-sm font-semibold">{movie.languages}</p>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'Episodes' && (
 <div className="space-y-6 md:space-y-12 max-w-[1600px]">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
 <div className="flex items-center gap-4">
 <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter italic">Seasons</h3>
 <div className="relative">
 <select 
 value={activeSeason} 
 onChange={(e) => setActiveSeason(Number(e.target.value))}
 className="appearance-none bg-white/5 border border-white/10 rounded-lg md:rounded-xl px-4 py-2 pr-10 font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm md:text-base"
 >
 {movie.seasons?.filter(s => s.season_number > 0).map(s => (
 <option key={s.id} value={s.season_number} className="bg-[#050505]">Season {s.season_number}</option>
 ))}
 </select>
 <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
 </div>
 </div>
 <p className="text-white/40 text-[10px] md:text-sm font-black uppercase tracking-widest">{episodes.length} Episodes</p>
 </div>

 {fetchingEpisodes ? (
 <div className="space-y-4 md:space-y-5">
 {[1, 2, 3].map(i => (
 <div key={i} className="flex gap-4 md:gap-6 p-4 md:p-5 bg-white/3 border border-white/5 rounded-2xl shimmer items-start h-32">
 <div className="w-32 sm:w-40 md:w-64 aspect-video rounded-xl bg-white/5 flex-shrink-0"></div>
 <div className="flex-1 space-y-3 py-1">
 <div className="h-5 bg-white/10 rounded w-1/3"></div>
 <div className="h-3 bg-white/5 rounded w-full"></div>
 <div className="h-3 bg-white/5 rounded w-5/6"></div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="grid gap-3.5 md:gap-5">
 {episodes.map((ep) => (
 <motion.div 
 key={ep.id}
 onClick={() => {
 setActiveEpisode(ep.episode_number);
 setCurrentView('player');
 }}
 tabIndex={0}
 role="button"
 className="group flex gap-4 md:gap-6 p-4 md:p-5 bg-glass-bg hover:bg-glass-hover border border-glass-border hover:border-white/10 rounded-2xl cursor-pointer transition-all duration-300 items-start tv-focusable"
 >
 <div className="relative w-32 sm:w-40 md:w-64 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-white/5 border border-white/5">
 <img 
 src={ep.still_path ? tmdb.getBackdropUrl(ep.still_path, 'w780') : movie.backdrop} 
 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
 alt="" 
 />
 <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-black shadow-2xl group-hover:scale-110 transition-transform">
 <Play fill="currentColor" size={14} />
 </div>
 </div>
 <div className="absolute bottom-2 right-2 bg-[#0a0a0a]/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase border border-white/5">
 {ep.runtime ? `${ep.runtime}m` : '45m'}
 </div>
 </div>
 <div className="flex-1 min-w-0 py-0.5">
 <div className="flex items-start justify-between gap-3 mb-1.5">
 <h4 className="text-sm md:text-xl font-black italic tracking-tight leading-tight line-clamp-1 group-hover:text-accent transition-colors">
 {ep.episode_number}. {ep.name}
 </h4>
 <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-0.5">{ep.air_date?.split('-')[0]}</span>
 </div>
 <p className="text-white/40 text-[10px] md:text-sm line-clamp-2 leading-relaxed">
 {ep.overview || "No overview available for this episode."}
 </p>
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </div>
 )}

 {activeTab === 'Details' && (
 <div className="grid md:grid-cols-2 gap-20 max-w-[1600px]">
 <div className="space-y-12">
 <section>
 <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Creative Team</h3>
 <div className="space-y-4">
 <div className="flex justify-between py-4 border-b border-white/5">
 <span className="text-white/40 font-bold">Writers</span>
 <span className="font-bold">{movie.writers}</span>
 </div>
 <div className="flex justify-between py-4 border-b border-white/5">
 <span className="text-white/40 font-bold">Original Type</span>
 <span className="font-bold uppercase tracking-widest">{movie.type}</span>
 </div>
 </div>
 </section>
 </div>
 
 {/* YouTube Trailer Preview */}
 {movie.trailer && (
 <section>
 <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Official Trailer</h3>
 <div className="aspect-video w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
 <iframe 
 src={`https://www.youtube.com/embed/${movie.trailer}?modestbranding=1&rel=0&iv_load_policy=3&color=white`}
 className="w-full h-full"
 title="Trailer"
 frameBorder="0"
 allowFullScreen
 ></iframe>
 </div>
 </section>
 )}
 </div>
 )}
 </div>

 {/* You May Also Like / Recommendations Section */}
 <div className="w-full px-6 md:px-20 pb-20 border-t border-white/5 pt-10 md:pt-16">
 {movie.recommendations && movie.recommendations.length > 0 ? (
 <MovieRow 
 title="You May Also Like" 
 subtitle="More titles you might enjoy"
 movies={movie.recommendations} 
 onMovieClick={(id, type) => {
 setActiveMovieId(id);
 setActiveMediaType(type || 'movie');
 const container = document.querySelector('.details-container');
 if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
 }} 
 />
 ) : (
 <div className="py-12 text-center bg-white/3 border border-white/5 rounded-2xl">
 <p className="text-white/20 font-black uppercase tracking-[0.3em] text-xs">No similar titles found</p>
 </div>
 )}
 </div>


 {/* Watch Party Dialog Modal */}
 <AnimatePresence>
 {showPartyModal && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }} 
 onClick={() => setShowPartyModal(false)}
 className="absolute inset-0 bg-black/80 backdrop-blur-md"
 />
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="relative w-full max-w-sm bg-[#0a0a0a] border border-glass-border p-6 rounded-[28px] text-center shadow-2xl"
 >
 <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <Users size={28} className="text-accent" />
 </div>
 <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight italic">
 Sync Watch Party
 </h3>
 <p className="text-white/40 text-xs mb-6 leading-relaxed">
 Stream in perfect sync with your friends. Create a new room code or enter an existing code to join.
 </p>
 
 <div className="space-y-4">
 <button 
 onClick={async () => {
 setShowPartyModal(false);
 await createWatchParty(movie);
 }}
 className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 cursor-pointer tv-focusable"
 >
 Create Watch Party
 </button>
 
 <div className="relative flex items-center gap-2 border-t border-white/5 pt-4">
 <input 
 type="text" 
 placeholder="ENTER PARTY CODE" 
 value={partyCodeInput}
 onChange={(e) => setPartyCodeInput(e.target.value.toUpperCase())}
 maxLength={6}
 className="flex-1 bg-white/5 border border-glass-border rounded-xl py-3 px-4 text-center font-bold text-sm tracking-widest text-white placeholder-white/20 focus:outline-none focus:border-accent/40 focus:bg-black"
 />
 <button 
 onClick={async () => {
 if (partyCodeInput.trim().length >= 4) {
 setShowPartyModal(false);
 const success = await joinWatchParty(partyCodeInput);
 if (!success) {
 alert("Party room not found");
 }
 }
 }}
 className="py-3 px-5 bg-white text-black font-black uppercase text-[10px] rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer tv-focusable"
 >
 Join
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </motion.div>
 );
}
