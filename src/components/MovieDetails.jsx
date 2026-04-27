// Fresh Build - Ensuring all icons are properly imported
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Share2, Info, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { useTVBackHandler } from '../hooks/useTV';
import { tmdb } from '../utils/tmdb';
import { firestoreService } from '../utils/firestore';
import { MovieRow } from './MovieRow';

export function MovieDetails() {
    const { activeMovieId, setActiveMovieId, setCurrentView, user, activeProfile, activeSeason, setActiveSeason, activeEpisode, setActiveEpisode, activeMediaType, setActiveMediaType, cachedDetails, setCachedDetails } = useAppContext();
    
    useTVBackHandler(() => setCurrentView('home'));
    const [movie, setMovie] = useState(() => cachedDetails[activeMovieId] || null);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [hasProgress, setHasProgress] = useState(null);
    const [loading, setLoading] = useState(!cachedDetails[activeMovieId]);
    const [activeTab, setActiveTab] = useState('Overview');
    const [episodes, setEpisodes] = useState([]);
    const [fetchingEpisodes, setFetchingEpisodes] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        if (!activeMovieId) return;

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
                    if (progress && progress.progressSeconds > 30) {
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

        // Auto-play trailer after 5 seconds
        setShowTrailer(false);
        const timer = setTimeout(() => {
            setShowTrailer(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, [activeMovieId, user, activeProfile]);

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

    if (loading || !movie) {
        return (
            <div className="absolute inset-0 bg-[#050505] z-40 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    const tabs = ['Overview', 'Details', 'More Like This'];
    if (movie.type === 'tv') tabs.splice(1, 0, 'Episodes');

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="details-container absolute inset-0 w-full h-[100dvh] overflow-y-auto bg-[#050505] text-white z-40 hide-scrollbar"
        >
            {/* Close Button */}
            <button onClick={() => setCurrentView('home')} className="fixed top-4 left-4 md:top-8 md:left-8 z-50 w-10 h-10 md:w-12 md:h-12 bg-black/40 md:bg-white/10 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer shadow-2xl">
                <X size={20}/>
            </button>

            {/* Cinematic Hero Header */}
            <div className="relative w-full min-h-[75vh] md:h-[90vh] flex items-end overflow-hidden">
                {/* Backdrop Layer */}
                <div className="absolute inset-0">
                    <AnimatePresence initial={false}>
                        {!showTrailer || !movie.trailer ? (
                            <motion.img 
                                key="backdrop"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1 }}
                                src={movie.backdrop} 
                                className="w-full h-full object-cover transform scale-105" 
                                alt="" 
                            />
                        ) : (
                            <motion.div 
                                key="trailer"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5 }}
                                className="absolute inset-0 w-full h-full overflow-hidden"
                            >
                                <iframe 
                                    src={`https://www.youtube.com/embed/${movie.trailer}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&playlist=${movie.trailer}&loop=1&enablejsapi=1`}
                                    className="w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none scale-110"
                                    title="Background Trailer"
                                    frameBorder="0"
                                    allow="autoplay; encrypted-media"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Unmute Button - Only if trailer is playing */}
                    {showTrailer && movie.trailer && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(!isMuted);
                            }}
                            className="absolute bottom-10 right-6 md:bottom-24 md:right-20 z-30 p-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white hover:text-black transition-all group"
                        >
                            {isMuted ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><path d="m11 5-7 5H2v4h2l7 5V5z"></path><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><path d="M11 5L4 10H2V14H4L11 19V5Z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                            )}
                        </button>
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
                            <img src={movie.poster} className="w-full aspect-[2/3] rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10" alt="" />
                        </motion.div>

                        {/* Title & Actions Column */}
                        <div className="flex-1 space-y-6 md:space-y-8">
                            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3 flex-wrap">
                                <span className="px-2.5 py-1 bg-red-600 text-white text-[9px] md:text-[10px] font-black rounded-md tracking-tighter uppercase">Apex Original</span>
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-md border border-white/10">
                                    <span className="text-green-400 text-[10px] md:text-xs font-black">{movie.match} Match</span>
                                </div>
                                <span className="text-white/60 text-xs md:text-sm font-bold">{movie.year} • {movie.duration} • {movie.rating}</span>
                            </motion.div>

                            <div className="space-y-3">
                                <h1 className="display-text text-3xl md:text-6xl lg:text-8xl font-black tracking-tighter mb-2 md:mb-4 leading-[1] md:leading-[0.9] uppercase italic">
                                    {movie.title}
                                </h1>
                                {movie.tagline && (
                                    <p className="text-base md:text-xl lg:text-2xl text-white/50 font-medium italic tracking-tight line-clamp-2 md:line-clamp-none">{movie.tagline}</p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full">
                                <button 
                                    onClick={() => setCurrentView('player')} 
                                    className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 md:px-12 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-xl hover:scale-105 transition-all shadow-2xl active:scale-95 ${
                                        hasProgress ? 'bg-red-600 text-white shadow-[0_0_40px_rgba(229,9,20,0.4)]' : 'bg-white text-black'
                                    }`}
                                >
                                    <Play fill="currentColor" size={20} className="md:w-6 md:h-6"/> 
                                    {hasProgress ? `Resume (${hasProgress.progress}%)` : 'Play Now'}
                                </button>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button onClick={toggleWatchlist} className="flex-1 sm:flex-none px-6 py-3.5 md:px-8 md:py-5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl font-bold text-sm md:text-lg hover:bg-white/20 transition-all whitespace-nowrap text-center">
                                        {inWatchlist ? 'In Watchlist' : 'Add to List'}
                                    </button>
                                    <button className="w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all">
                                        <Share2 size={18} className="md:w-6 md:h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 md:px-20 border-b border-white/5 sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl overflow-x-auto hide-scrollbar">
                <div className="flex gap-8 md:gap-12 min-w-max">
                    {tabs.map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`py-6 text-sm font-black uppercase tracking-[0.2em] relative transition-colors ${
                                activeTab === tab ? 'text-white' : 'text-white/30 hover:text-white/60'
                            }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 shadow-[0_0_10px_rgba(229,9,20,0.8)]" />
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
                                            <div className="aspect-[3/4] rounded-xl md:rounded-2xl overflow-hidden mb-3 md:mb-4 border border-white/5 shadow-xl transition-all duration-500 group-hover:border-white/20">
                                                <img src={actor.profilePath} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" alt="" />
                                            </div>
                                            <h4 className="font-bold text-xs md:text-sm text-white group-hover:text-red-500 transition-colors truncate">{actor.name}</h4>
                                            <p className="text-[9px] md:text-[10px] text-white/30 font-black uppercase tracking-tighter truncate">{actor.character}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Metadata Sidebar */}
                        <div className="space-y-8 md:space-y-12 bg-white/5 border border-white/10 p-6 md:p-10 rounded-3xl md:rounded-[40px] h-fit">
                            <div className="grid grid-cols-2 gap-6 md:gap-8">
                                <div>
                                    <h5 className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest mb-1 md:mb-2">Director</h5>
                                    <p className="font-bold text-base md:text-lg truncate">{movie.director}</p>
                                </div>
                                <div>
                                    <h5 className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest mb-1 md:mb-2">Status</h5>
                                    <p className="font-bold text-base md:text-lg">{movie.status}</p>
                                </div>
                                {movie.budget && (
                                    <div>
                                        <h5 className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest mb-1 md:mb-2">Budget</h5>
                                        <p className="font-bold text-base md:text-lg text-green-400">{movie.budget}</p>
                                    </div>
                                )}
                                {movie.revenue && (
                                    <div>
                                        <h5 className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest mb-1 md:mb-2">Box Office</h5>
                                        <p className="font-bold text-base md:text-lg text-blue-400">{movie.revenue}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 md:space-y-6 pt-6 md:pt-8 border-t border-white/5">
                                <div>
                                    <h5 className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest mb-1 md:mb-2">Production</h5>
                                    <p className="text-white/60 text-sm md:text-base font-medium">{movie.production}</p>
                                </div>
                                <div>
                                    <h5 className="text-[9px] md:text-[10px] font-black text-white/20 uppercase tracking-widest mb-1 md:mb-2">Languages</h5>
                                    <p className="text-white/60 text-sm md:text-base font-medium">{movie.languages}</p>
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
                            <div className="py-20 flex justify-center">
                                <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="grid gap-3 md:gap-6">
                                {episodes.map((ep) => (
                                    <motion.div 
                                        key={ep.id}
                                        onClick={() => {
                                            setActiveEpisode(ep.episode_number);
                                            setCurrentView('player');
                                        }}
                                        className="group flex gap-4 md:gap-8 p-3 md:p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl cursor-pointer transition-all items-start"
                                    >
                                        <div className="relative w-32 sm:w-40 md:w-72 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                                            <img 
                                                src={ep.still_path ? tmdb.getBackdropUrl(ep.still_path, 'w780') : movie.backdrop} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                alt="" 
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-2xl">
                                                    <Play fill="currentColor" size={18} />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] md:text-[10px] font-black uppercase">
                                                {ep.runtime ? `${ep.runtime}m` : '45m'}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex items-start justify-between gap-3 mb-1 md:mb-2">
                                                <h4 className="text-sm md:text-2xl font-black italic tracking-tight leading-tight line-clamp-2 group-hover:text-red-500 transition-colors">
                                                    {ep.episode_number}. {ep.name}
                                                </h4>
                                                <span className="text-[8px] md:text-xs font-bold text-white/20 uppercase tracking-widest mt-1">{ep.air_date?.split('-')[0]}</span>
                                            </div>
                                            <p className="text-white/40 text-[10px] md:text-base line-clamp-2 md:line-clamp-3 leading-snug md:leading-relaxed">
                                                {ep.overview || "No overview available for this episode."}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'More Like This' && (
                    <div className="max-w-[1600px]">
                        {movie.recommendations.length > 0 ? (
                            <MovieRow 
                                title="Curated Recommendations" 
                                movies={movie.recommendations} 
                                onMovieClick={(id, type) => {
                                    setActiveMovieId(id);
                                    setActiveMediaType(type || 'movie');
                                }} 
                            />
                        ) : (
                            <div className="py-20 text-center border border-white/5 rounded-3xl">
                                <p className="text-white/20 font-black uppercase tracking-[0.5em]">No similar titles found</p>
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
        </motion.div>
    );
}
