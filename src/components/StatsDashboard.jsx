import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Trophy, BarChart3, Film, Play, Star } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { firestoreService } from '../utils/firestore';
import { tmdb } from '../utils/tmdb';

const StatCard = ({ title, value, subtitle, icon: Icon, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, type: 'spring' }}
        className="relative overflow-hidden bg-glass-bg border border-glass-border p-6 rounded-3xl shadow-2xl group hover:border-white/20 transition-all duration-500"
    >
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-500 pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-8">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:border-accent/30 group-hover:bg-accent/10 transition-all">
                    <Icon className="w-6 h-6 text-white/70 group-hover:text-accent transition-colors" />
                </div>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{title}</span>
            </div>
            <div>
                <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{value}</h3>
                {subtitle && <p className="text-white/40 text-xs md:text-sm font-bold mt-2 uppercase tracking-tight">{subtitle}</p>}
            </div>
        </div>
    </motion.div>
);

export function StatsDashboard() {
    const { setCurrentView, user, activeProfile } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSeconds: 0,
        completedCount: 0,
        totalStarted: 0,
        favoriteGenres: [],
        topShow: null
    });

    useEffect(() => {
        const calculateStats = async () => {
            if (!user || !activeProfile) return;
            setLoading(true);
            try {
                const history = await firestoreService.getAllWatchProgress(user.uid, activeProfile.id);
                
                let totalSecs = 0;
                let completed = 0;
                let genreCounts = {};
                let mostWatchedSecs = 0;
                let topItem = null;

                const fetchPromises = history.map(async (item) => {
                    // Watch Time
                    const secs = item.progressSeconds || 0;
                    totalSecs += secs;
                    
                    if (secs > mostWatchedSecs) {
                        mostWatchedSecs = secs;
                        topItem = item;
                    }

                    // Completion
                    if (item.completed || item.progress >= 95) completed++;

                    // Genres
                    let itemGenres = item.genres || [];
                    
                    // Fallback for old history entries without genres
                    if (itemGenres.length === 0 && secs > 300) { // Only fetch for items watched > 5 mins to save API calls
                        const details = (item.type || item.contentType) === 'tv' 
                            ? await tmdb.fetchTVDetails(item.id)
                            : await tmdb.fetchMovieDetails(item.id);
                        const formatted = tmdb.formatMovie(details);
                        if (formatted && formatted.tags) itemGenres = formatted.tags;
                    }

                    itemGenres.forEach(g => {
                        genreCounts[g] = (genreCounts[g] || 0) + secs; // Weight genres by time spent watching
                    });
                });

                await Promise.all(fetchPromises);

                const sortedGenres = Object.entries(genreCounts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([name, weight]) => ({ name, weight }));

                setStats({
                    totalSeconds: totalSecs,
                    completedCount: completed,
                    totalStarted: history.length,
                    favoriteGenres: sortedGenres,
                    topShow: topItem
                });
            } catch (error) {
                console.error('Error calculating stats:', error);
            } finally {
                setLoading(false);
            }
        };

        calculateStats();
    }, [user, activeProfile]);

    const formatTime = (totalSeconds) => {
        if (totalSeconds < 60) return { val: totalSeconds, unit: 'Seconds' };
        if (totalSeconds < 3600) return { val: Math.floor(totalSeconds / 60), unit: 'Minutes' };
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        return { val: hrs, unit: `Hrs ${mins} Min` };
    };

    const time = formatTime(stats.totalSeconds);
    const completionRate = stats.totalStarted > 0 ? Math.round((stats.completedCount / stats.totalStarted) * 100) : 0;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#050505] overflow-y-auto hide-scrollbar"
        >
            {/* Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] bg-accent/10 rounded-full blur-[120px] transform translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] bg-blue-600/10 rounded-full blur-[100px] transform -translate-x-1/3 translate-y-1/3" />
            </div>

            <div className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-12 py-12 md:py-24">
                {/* Header */}
                <div className="flex items-center justify-between mb-12 md:mb-16">
                    <div>
                        <motion.h1 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white"
                        >
                            My <span className="text-accent drop-shadow-[0_0_20px_rgba(229,9,20,0.5)]">Stats</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-white/40 font-bold uppercase tracking-widest text-xs mt-2"
                        >
                            {activeProfile?.name}'s Viewing History
                        </motion.p>
                    </div>
                    <button 
                        onClick={() => setCurrentView('library')}
                        className="w-12 h-12 bg-white/5 border border-white/10 hover:border-white/30 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 tv-focusable"
                    >
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                        <div className="w-12 h-12 border-4 border-white/10 border-t-accent rounded-full animate-spin shadow-[0_0_30px_rgba(229,9,20,0.3)]"></div>
                        <p className="text-white/40 font-black uppercase tracking-widest text-xs animate-pulse">Crunching Numbers...</p>
                    </div>
                ) : (
                    <div className="space-y-8 md:space-y-12">
                        {/* Top Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard 
                                title="Total Watch Time" 
                                value={time.val} 
                                subtitle={time.unit} 
                                icon={Clock} 
                                delay={0.2} 
                            />
                            <StatCard 
                                title="Completion Rate" 
                                value={`${completionRate}%`} 
                                subtitle={`${stats.completedCount} / ${stats.totalStarted} titles finished`} 
                                icon={Trophy} 
                                delay={0.3} 
                            />
                            <StatCard 
                                title="Top Genre" 
                                value={stats.favoriteGenres[0]?.name || 'N/A'} 
                                subtitle="Most watched category" 
                                icon={Star} 
                                delay={0.4} 
                            />
                        </div>

                        {/* Detailed Breakdown Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                            
                            {/* Favorite Genres Chart */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white/5 border border-white/5 p-6 md:p-8 rounded-[32px]"
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <BarChart3 className="text-accent w-5 h-5" />
                                    <h3 className="text-lg font-black uppercase italic tracking-wider text-white">Genre Breakdown</h3>
                                </div>
                                <div className="space-y-6">
                                    {stats.favoriteGenres.length > 0 ? stats.favoriteGenres.map((genre, idx) => {
                                        const maxWeight = stats.favoriteGenres[0].weight;
                                        const percentage = Math.max(5, Math.round((genre.weight / maxWeight) * 100));
                                        return (
                                            <div key={genre.name} className="relative">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                                                    <span>{genre.name}</span>
                                                    <span className="text-white/40">#{idx + 1}</span>
                                                </div>
                                                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ delay: 0.8 + (idx * 0.1), duration: 1, type: "spring" }}
                                                        className={`h-full rounded-full ${idx === 0 ? 'bg-accent shadow-[0_0_10px_rgba(229,9,20,0.8)]' : 'bg-white/30'}`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <p className="text-white/30 text-sm font-semibold text-center py-10">Not enough data to calculate genres.</p>
                                    )}
                                </div>
                            </motion.div>

                            {/* Most Watched Title */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 md:p-8 rounded-[32px] relative overflow-hidden flex flex-col justify-between group"
                            >
                                {stats.topShow?.backdrop && (
                                    <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                                        <img src={stats.topShow.backdrop} className="w-full h-full object-cover mix-blend-overlay" alt="" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent"></div>
                                    </div>
                                )}
                                <div className="relative z-10 flex items-center gap-3 mb-8">
                                    <Film className="text-white w-5 h-5" />
                                    <h3 className="text-lg font-black uppercase italic tracking-wider text-white">Most Watched</h3>
                                </div>
                                
                                <div className="relative z-10">
                                    {stats.topShow ? (
                                        <div className="flex items-end gap-6">
                                            {stats.topShow.poster && (
                                                <img src={stats.topShow.poster} className="w-24 md:w-32 rounded-xl shadow-2xl border border-white/10 group-hover:scale-105 group-hover:rotate-2 transition-all duration-500" alt="" />
                                            )}
                                            <div className="flex-1 pb-2">
                                                <h4 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight text-white mb-2 leading-none drop-shadow-md">
                                                    {stats.topShow.title || 'Unknown'}
                                                </h4>
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/20 border border-accent/30 rounded-lg">
                                                    <Play className="w-3 h-3 text-accent" fill="currentColor" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                                                        {Math.floor(mostWatchedSecs / 60) || Math.floor((stats.topShow.progressSeconds || 0)/60)} Mins
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-white/30 text-sm font-semibold text-center py-10">No watch history yet.</p>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
