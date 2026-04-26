import { motion } from 'motion/react';
import { Play, Plus, X, List, Share2, Heart, ExternalLink, Check, Film } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { tmdb } from '../utils/tmdb';
import { firestoreService } from '../utils/firestore';
import { MovieRow } from './MovieRow';

export function MovieDetails() {
    const { activeMovieId, setActiveMovieId, setCurrentView, user, activeProfile } = useAppContext();
    const [movie, setMovie] = useState(null);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');

    useEffect(() => {
        if (!activeMovieId) return;

        const loadMovieDetails = async () => {
            setLoading(true);
            try {
                let rawData;
                try {
                    rawData = await tmdb.fetchMovieDetails(activeMovieId);
                    if (!rawData.title) throw new Error('Not a movie');
                } catch {
                    rawData = await tmdb.fetchTVDetails(activeMovieId);
                }
                
                const formatted = tmdb.formatMovie(rawData);
                
                // Add extra data for redesign
                setMovie({
                    ...formatted,
                    tagline: rawData.tagline,
                    budget: rawData.budget ? `$${(rawData.budget / 1000000).toFixed(1)}M` : null,
                    revenue: rawData.revenue ? `$${(rawData.revenue / 1000000).toFixed(1)}M` : null,
                    status: rawData.status,
                    languages: rawData.spoken_languages?.map(l => l.english_name).join(', '),
                    production: rawData.production_companies?.slice(0, 2).map(p => p.name).join(' & '),
                    trailer: rawData.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key
                });

                if (user && activeProfile) {
                    const wl = await firestoreService.getWatchlist(user.uid, activeProfile.id);
                    setInWatchlist(wl.some(item => item.contentId === activeMovieId));
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
    }, [activeMovieId, user, activeProfile]);

    const toggleWatchlist = async () => {
        if (!activeProfile || !movie || !user) return;
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

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="details-container absolute inset-0 w-full h-[100dvh] overflow-y-auto bg-[#050505] text-white z-40 hide-scrollbar"
        >
            {/* Close Button */}
            <button onClick={() => setCurrentView('home')} className="fixed top-8 left-8 z-50 w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer shadow-2xl">
                <X size={24}/>
            </button>

            {/* Cinematic Hero Header */}
            <div className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden">
                {/* Backdrop Layer */}
                <div className="absolute inset-0">
                    <img src={movie.backdrop} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-transparent to-transparent"></div>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex items-end">
                    <div className="w-full px-8 md:px-20 pb-16 md:pb-24 grid md:grid-cols-[300px_1fr] gap-12 items-end">
                        {/* Poster Column - Hidden on small mobile */}
                        <motion.div 
                            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            className="hidden md:block relative group"
                        >
                            <img src={movie.poster} className="w-full aspect-[2/3] rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10" alt="" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center backdrop-blur-sm">
                                <Film size={40} className="text-white/40" />
                            </div>
                        </motion.div>

                        {/* Title & Actions Column */}
                        <div className="flex-1 space-y-8">
                            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-4 flex-wrap">
                                <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-md tracking-tighter uppercase">Nexus Original</span>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-md border border-white/10">
                                    <span className="text-green-400 text-xs font-black">{movie.match} Match</span>
                                </div>
                                <span className="text-white/60 text-sm font-bold">{movie.year} • {movie.duration} • {movie.rating}</span>
                            </motion.div>

                            <div>
                                <h1 className="display-text text-5xl md:text-8xl font-black tracking-tighter mb-4 leading-none uppercase">
                                    {movie.title}
                                </h1>
                                {movie.tagline && (
                                    <p className="text-xl md:text-2xl text-white/40 font-medium italic tracking-tight">{movie.tagline}</p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <button onClick={() => setCurrentView('player')} className="flex items-center gap-4 bg-white text-black px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-2xl active:scale-95">
                                    <Play fill="currentColor" size={24}/> Play Now
                                </button>
                                <button onClick={toggleWatchlist} className="px-8 py-5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
                                    {inWatchlist ? 'In Watchlist' : 'Add to List'}
                                </button>
                                <button className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all">
                                    <Share2 size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-8 md:px-20 border-b border-white/5 sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl">
                <div className="flex gap-12">
                    {['Overview', 'Details', 'More Like This'].map(tab => (
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
            <div className="px-8 md:px-20 py-16">
                {activeTab === 'Overview' && (
                    <div className="grid md:grid-cols-[1fr_400px] gap-20 max-w-[1600px]">
                        <div className="space-y-16">
                            {/* Synopsis */}
                            <section>
                                <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Storyline</h3>
                                <p className="text-2xl md:text-3xl text-white/80 leading-snug font-medium max-w-4xl">
                                    {movie.description}
                                </p>
                            </section>

                            {/* Main Cast */}
                            <section>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">Leading Cast</h3>
                                    <button className="text-xs font-bold text-white/40 hover:text-white">See Full Credits</button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
                                    {movie.cast.slice(0, 5).map((actor, idx) => (
                                        <div key={idx} className="group">
                                            <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-4 border border-white/5 shadow-xl transition-all duration-500 group-hover:border-white/20">
                                                <img src={actor.profilePath} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" alt="" />
                                            </div>
                                            <h4 className="font-bold text-sm text-white group-hover:text-red-500 transition-colors">{actor.name}</h4>
                                            <p className="text-[10px] text-white/30 font-black uppercase tracking-tighter">{actor.character}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Metadata Sidebar */}
                        <div className="space-y-12 bg-white/5 border border-white/10 p-10 rounded-[40px] h-fit">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h5 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Director</h5>
                                    <p className="font-bold text-lg">{movie.director}</p>
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Status</h5>
                                    <p className="font-bold text-lg">{movie.status}</p>
                                </div>
                                {movie.budget && (
                                    <div>
                                        <h5 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Budget</h5>
                                        <p className="font-bold text-lg text-green-400">{movie.budget}</p>
                                    </div>
                                )}
                                {movie.revenue && (
                                    <div>
                                        <h5 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Box Office</h5>
                                        <p className="font-bold text-lg text-blue-400">{movie.revenue}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6 pt-8 border-t border-white/5">
                                <div>
                                    <h5 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Production</h5>
                                    <p className="text-white/60 font-medium">{movie.production}</p>
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Languages</h5>
                                    <p className="text-white/60 font-medium">{movie.languages}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'More Like This' && (
                    <div className="max-w-[1600px]">
                        {movie.recommendations.length > 0 ? (
                            <MovieRow 
                                title="Curated Recommendations" 
                                movies={movie.recommendations} 
                                onMovieClick={setActiveMovieId} 
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
