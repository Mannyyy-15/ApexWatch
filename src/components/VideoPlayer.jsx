import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, RotateCw, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';
import { useTVBackHandler } from '../hooks/useTV';
import { firestoreService } from '../utils/firestore';

export function VideoPlayer() {
    const { activeMovieId, setCurrentView, user, activeProfile, activeSeason, activeEpisode, activeMediaType } = useAppContext();

    useTVBackHandler(() => setCurrentView('details'));
    const [movie, setMovie] = useState(null);
    const [startTime, setStartTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [playerReady, setPlayerReady] = useState(false);
    const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
    const [savedProgress, setSavedProgress] = useState(null);
    const [showResumeToast, setShowResumeToast] = useState(false);

    useEffect(() => {
        const checkOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        const lockOrientation = async () => {
            try {
                // Request orientation lock if supported
                if (window.screen.orientation && window.screen.orientation.lock) {
                    await window.screen.orientation.lock('landscape').catch(() => {
                        // Silently fail if not allowed by browser policy (usually requires fullscreen)
                    });
                }
                
                // On mobile, try to enter fullscreen for better experience - wrap in check to avoid console noise
                if (document.documentElement.requestFullscreen && window.innerHeight < 600) {
                    // Only attempt if not already in fullscreen
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(() => {
                            // This is expected to fail without direct user gesture in some cases
                        });
                    }
                }
            } catch (error) {
                // Silently handle
            }
        };

        const unlockOrientation = () => {
            try {
                if (window.screen.orientation && window.screen.orientation.unlock) {
                    window.screen.orientation.unlock();
                }
                if (document.exitFullscreen && document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                }
            } catch (error) { }
        };

        lockOrientation();
        return () => {
            unlockOrientation();
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    useEffect(() => {
        if (!activeMovieId) return;

        const loadMovieAndProgress = async () => {
            setLoading(true);
            try {
                // Fetch Metadata
                let data;
                if (activeMediaType === 'movie') {
                    data = await tmdb.fetchMovieDetails(activeMovieId);
                    if (!data.title && !data.id) {
                        data = await tmdb.fetchTVDetails(activeMovieId);
                    }
                } else {
                    data = await tmdb.fetchTVDetails(activeMovieId);
                    if (!data.name && !data.id) {
                        data = await tmdb.fetchMovieDetails(activeMovieId);
                    }
                }
                const formatted = tmdb.formatMovie(data);
                setMovie(formatted);

                // Fetch Progress
                if (user && activeProfile) {
                    const progress = await firestoreService.getWatchProgress(user.uid, activeProfile.id, activeMovieId);
                    if (progress && progress.progressSeconds > 30) { 
                        setSavedProgress(progress);
                        setShowResumeToast(true);
                        // Auto-hide after 10 seconds
                        setTimeout(() => setShowResumeToast(false), 10000);
                    }
                }
                setPlayerReady(true);
            } catch (error) {
                console.error('Error loading movie for player:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMovieAndProgress();
    }, [activeMovieId, user, activeProfile]);

    useEffect(() => {
        if (!movie || !user || !activeProfile) return;

        const handleMessage = async (event) => {
            try {
                if (typeof event.data === 'string') {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'PLAYER_EVENT') {
                        const { event: eventName, currentTime, progress, id, mediaType, duration } = payload.data;
                        
                        await firestoreService.saveWatchProgress(user.uid, activeProfile.id, movie.id, {
                            progressSeconds: currentTime,
                            durationSeconds: duration,
                            completed: (currentTime / duration) >= 0.95,
                            contentType: movie.type,
                            title: movie.title,
                            poster: movie.poster,
                            backdrop: movie.backdrop,
                            year: movie.year
                        });
                    }
                }
            } catch (e) { }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [movie, user, activeProfile]);

    const handleClose = (e) => {
        if (e) e.stopPropagation();
        setCurrentView('details');
    };

    const handleManualRotate = async () => {
        try {
            if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
            if (window.screen.orientation && window.screen.orientation.lock) {
                await window.screen.orientation.lock('landscape');
            }
        } catch (err) {
            console.error('Failed to rotate manually:', err);
        }
    };

    if (loading || !movie) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    // Construct Vidking embed URL dynamically
    const baseUrl = movie.type === 'tv' 
        ? `https://www.vidking.net/embed/tv/${movie.tmdbId}/${activeSeason || 1}/${activeEpisode || 1}`
        : `https://www.vidking.net/embed/movie/${movie.tmdbId}`;
    
    const params = new URLSearchParams({
        color: 'e50914',
        autoPlay: 'true',
        episodeSelector: 'true',
        nextEpisode: 'true',
    });

    if (startTime > 5) {
        params.set('t', Math.floor(startTime).toString());
    }

    const embedUrl = `${baseUrl}?${params.toString()}`;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
        >

            {playerReady && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="absolute inset-0 w-full h-full"
                >
                    <iframe 
                        src={embedUrl} 
                        className="w-full h-full border-none" 
                        allowFullScreen 
                        allow="autoplay; encrypted-media; picture-in-picture"
                        title={movie.title}
                    />
                </motion.div>
            )}

            <div className="absolute top-6 left-6 pointer-events-auto z-50">
                <button onClick={handleClose} className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:bg-white hover:text-black hover:scale-110 transition-all opacity-30 hover:opacity-100 group" title="Go Back">
                    <ArrowLeft size={24}/>
                </button>
            </div>

            {isPortrait && (
                <div className="absolute top-6 right-6 pointer-events-auto z-[60]">
                    <button 
                        onClick={handleManualRotate} 
                        className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 text-white hover:bg-white/20 transition-all shadow-xl"
                    >
                        <RotateCw size={16} className="text-red-500" />
                        <span className="font-bold text-sm">Rotate</span>
                    </button>
                </div>
            )}

            <AnimatePresence>
                {showResumeToast && savedProgress && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        className="absolute top-24 right-6 z-[70] pointer-events-auto"
                    >
                        <button 
                            onClick={() => {
                                setStartTime(savedProgress.progressSeconds);
                                setShowResumeToast(false);
                            }}
                            className="bg-black/90 backdrop-blur-2xl border border-white/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all shadow-[0_30px_60px_rgba(0,0,0,0.8)] group border-l-4 border-l-red-600"
                        >
                            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(229,9,20,0.4)] group-hover:scale-110 transition-transform">
                                <Play size={20} fill="currentColor" className="ml-1" />
                            </div>
                            <div className="text-left pr-4">
                                <p className="text-white font-black text-[10px] uppercase tracking-widest mb-0.5 opacity-50">Resume Playback?</p>
                                <p className="text-white text-sm font-bold">
                                    Last watched at {Math.floor(savedProgress.progressSeconds / 60)}:{(Math.floor(savedProgress.progressSeconds % 60)).toString().padStart(2, '0')}
                                </p>
                            </div>
                            <div 
                                onClick={(e) => { e.stopPropagation(); setShowResumeToast(false); }}
                                className="p-2 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all ml-2"
                            >
                                <X size={16} />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
