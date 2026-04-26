import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookMarked, History as HistoryIcon, Play, Trash2, Clock, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { firestoreService } from '../utils/firestore';
import { tmdb } from '../utils/tmdb';
import { MovieCardSkeleton } from './Skeleton';

export function ProfileLibrary() {
    const { user, activeProfile, setActiveMovieId, setCurrentView, libraryTab: activeTab, setLibraryTab: setActiveTab } = useAppContext();
    const [watchlist, setWatchlist] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const tabs = [
        { name: 'Watchlist', icon: <BookMarked size={18} /> },
        { name: 'History', icon: <HistoryIcon size={18} /> }
    ];

    useEffect(() => {
        const loadLibraryData = async () => {
            if (!user || !activeProfile) return;
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
                        const details = item.type === 'tv' 
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

    const handleMovieClick = (id) => {
        setActiveMovieId(id);
        setCurrentView('details');
    };

    const removeFromWatchlist = async (e, id) => {
        e.stopPropagation();
        await firestoreService.removeFromWatchlist(user.uid, activeProfile.id, id);
        setWatchlist(prev => prev.filter(m => m.id !== id));
    };

    return (
        <div className="min-h-screen pt-24 md:pt-32 px-4 md:px-20 pb-32 w-full max-w-[1600px] mx-auto">
            
            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                >
                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
                            {[...Array(6)].map((_, i) => <MovieCardSkeleton key={i} />)}
                        </div>
                    ) : (
                        activeTab === 'Watchlist' ? (
                            watchlist.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
                                    {watchlist.map((movie) => (
                                        <div key={movie.id} className="group relative cursor-pointer" onClick={() => handleMovieClick(movie.id)}>
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
                                    <h3 className="text-2xl font-black uppercase italic italic italic">Your Watchlist is Empty</h3>
                                    <p className="max-w-xs mt-2">Start adding movies and shows to keep track of what you want to watch next.</p>
                                </div>
                            )
                        ) : (
                            history.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
                                    {history.map((movie) => (
                                        <div key={movie.id} className="group relative cursor-pointer" onClick={() => handleMovieClick(movie.id)}>
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
                                    <h3 className="text-2xl font-black uppercase italic italic italic">No Watch History</h3>
                                    <p className="max-w-xs mt-2">Pick something to watch and we'll track your progress right here.</p>
                                </div>
                            )
                        )
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
