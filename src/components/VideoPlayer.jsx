import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play } from 'lucide-react';
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
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [savedProgress, setSavedProgress] = useState(null);
    const [playerReady, setPlayerReady] = useState(false);

    useEffect(() => {
        const lockOrientation = async () => {
            try {
                // Request orientation lock if supported
                if (window.screen.orientation && window.screen.orientation.lock) {
                    await window.screen.orientation.lock('landscape').catch(() => {
                        // Silently fail if not allowed by browser policy (usually requires fullscreen)
                        console.log('Orientation lock requested.');
                    });
                }
                
                // On mobile, try to enter fullscreen for better experience
                if (document.documentElement.requestFullscreen && window.innerHeight < 600) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } catch (error) {
                console.warn('Orientation control error:', error);
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
        return () => unlockOrientation();
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
                    if (progress && progress.progressSeconds > 30) { // Only prompt if more than 30s watched
                        setSavedProgress(progress);
                        setShowResumePrompt(true);
                    } else {
                        setPlayerReady(true);
                    }
                } else {
                    setPlayerReady(true);
                }
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

    const handleResume = () => {
        if (savedProgress) {
            setStartTime(savedProgress.progressSeconds);
        }
        setShowResumePrompt(false);
        setPlayerReady(true);
    };

    const handleStartOver = () => {
        setStartTime(0);
        setShowResumePrompt(false);
        setPlayerReady(true);
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
        params.set('progress', Math.floor(startTime).toString());
    }

    const embedUrl = `${baseUrl}?${params.toString()}`;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
        >
            <AnimatePresence>
                {showResumePrompt && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.1, y: -20 }}
                        className="relative z-[60] w-full max-w-md p-8 text-center"
                    >
                        <div className="glass rounded-[40px] p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                            {/* Glow Effect */}
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/20 blur-[100px] rounded-full"></div>
                            
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10">
                                <Play size={32} className="text-white fill-white ml-1" />
                            </div>
                            
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Resume Watching?</h2>
                            <p className="text-white/40 mb-10 text-lg leading-relaxed">
                                We saved your spot at <span className="text-white font-bold">{Math.floor(savedProgress.progressSeconds / 60)}m {Math.floor(savedProgress.progressSeconds % 60)}s</span> ({savedProgress.progress}%).
                            </p>
                            
                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={handleResume}
                                    className="w-full bg-white text-black py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                                >
                                    Resume at {savedProgress.progress}%
                                </button>
                                <button 
                                    onClick={handleStartOver}
                                    className="w-full bg-white/5 border border-white/10 text-white py-5 rounded-2xl font-black text-xl hover:bg-white/10 transition-all"
                                >
                                    Watch from Start
                                </button>
                                <button 
                                    onClick={handleClose}
                                    className="mt-4 text-white/40 hover:text-white font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
                        title={movie.title}
                    />
                </motion.div>
            )}

            <div className="absolute top-6 left-6 pointer-events-auto z-50">
                <button onClick={handleClose} className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:bg-white hover:text-black hover:scale-110 transition-all opacity-30 hover:opacity-100 group" title="Go Back">
                    <ArrowLeft size={24}/>
                </button>
            </div>
        </motion.div>
    );
}
