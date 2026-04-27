import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, RotateCcw, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';
import { firestoreService } from '../utils/firestore';

export function VideoPlayer() {
    const { activeMovieId, setCurrentView, user, activeProfile } = useAppContext();
    const [movie, setMovie] = useState(null);
    const [startTime, setStartTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [savedProgress, setSavedProgress] = useState(null);
    const [playerReady, setPlayerReady] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0); // 0: Resume, 1: Start Over, 2: Cancel
    const iframeRef = useRef(null);

    useEffect(() => {
        if (!activeMovieId) return;

        const loadMovieAndProgress = async () => {
            setLoading(true);
            try {
                let data;
                try {
                    data = await tmdb.fetchMovieDetails(activeMovieId);
                    if (!data.title) throw new Error('Not a movie');
                } catch {
                    data = await tmdb.fetchTVDetails(activeMovieId);
                }
                const formatted = tmdb.formatMovie(data);
                setMovie(formatted);

                if (user && activeProfile) {
                    const progress = await firestoreService.getWatchProgress(user.uid, activeProfile.id, activeMovieId);
                    if (progress && progress.progressSeconds > 30) {
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

    // KEYBOARD / D-PAD NAVIGATION
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Global Back Action (TV Back button usually maps to Escape or Backspace)
            if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'BrowserBack') {
                e.preventDefault();
                handleClose();
                return;
            }

            if (showResumePrompt) {
                switch (e.key) {
                    case 'ArrowDown':
                        setFocusedIndex(prev => Math.min(prev + 1, 2));
                        break;
                    case 'ArrowUp':
                        setFocusedIndex(prev => Math.max(prev - 1, 0));
                        break;
                    case 'Enter':
                        if (focusedIndex === 0) handleResume();
                        else if (focusedIndex === 1) handleStartOver();
                        else handleClose();
                        break;
                }
                return;
            }

            // If player is ready but iframe doesn't have focus, focus it on any key
            if (playerReady && iframeRef.current && document.activeElement !== iframeRef.current) {
                iframeRef.current.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showResumePrompt, focusedIndex, playerReady]);

    // Auto-focus iframe when ready
    useEffect(() => {
        if (playerReady && iframeRef.current) {
            iframeRef.current.focus();
        }
    }, [playerReady]);

    useEffect(() => {
        if (!movie || !user || !activeProfile) return;

        const handleMessage = async (event) => {
            try {
                if (typeof event.data === 'string') {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'PLAYER_EVENT') {
                        const { currentTime, duration } = payload.data;
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

    const handleClose = () => setCurrentView('details');

    const handleResume = () => {
        if (savedProgress) setStartTime(savedProgress.progressSeconds);
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
                <div className="w-16 h-16 border-8 border-white/5 border-t-red-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const baseUrl = movie.type === 'tv' 
        ? `https://www.vidking.net/embed/tv/${movie.tmdbId}/${movie.season || 1}/${movie.episode || 1}`
        : `https://www.vidking.net/embed/movie/${movie.tmdbId}`;
    
    const params = new URLSearchParams({
        color: 'e50914',
        autoPlay: 'true',
        episodeSelector: 'true',
        nextEpisode: 'true',
    });

    if (startTime > 5) params.set('progress', Math.floor(startTime).toString());
    const embedUrl = `${baseUrl}?${params.toString()}`;

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
        >
            <AnimatePresence>
                {showResumePrompt && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                        className="relative z-[60] w-full max-w-lg p-8"
                    >
                        <div className="glass rounded-[50px] p-12 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] text-center relative overflow-hidden">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full"></div>
                            
                            <div className="w-24 h-24 bg-red-600 rounded-[30px] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_50px_rgba(229,9,20,0.3)] animate-float">
                                <Play size={40} className="text-white fill-white ml-2" />
                            </div>
                            
                            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Resume Show?</h2>
                            <p className="text-white/40 mb-12 text-xl">
                                You left off at <span className="text-white font-bold">{Math.floor(savedProgress.progressSeconds / 60)}m {Math.floor(savedProgress.progressSeconds % 60)}s</span>.
                            </p>
                            
                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={handleResume}
                                    onMouseEnter={() => setFocusedIndex(0)}
                                    className={`w-full py-6 rounded-2xl font-black text-2xl transition-all ${
                                        focusedIndex === 0 
                                        ? 'bg-white text-black scale-105 shadow-[0_0_50px_rgba(255,255,255,0.3)]' 
                                        : 'bg-white/5 text-white/60'
                                    }`}
                                >
                                    Resume {savedProgress.progress}%
                                </button>
                                <button 
                                    onClick={handleStartOver}
                                    onMouseEnter={() => setFocusedIndex(1)}
                                    className={`w-full py-6 rounded-2xl font-black text-2xl transition-all flex items-center justify-center gap-3 ${
                                        focusedIndex === 1 
                                        ? 'bg-white/10 text-white border-2 border-white/20 scale-105' 
                                        : 'bg-transparent text-white/30'
                                    }`}
                                >
                                    <RotateCcw size={24} />
                                    Watch from Start
                                </button>
                                <button 
                                    onClick={handleClose}
                                    onMouseEnter={() => setFocusedIndex(2)}
                                    className={`mt-6 py-4 font-black uppercase tracking-[0.3em] text-xs transition-all ${
                                        focusedIndex === 2 ? 'text-red-500 scale-110' : 'text-white/20'
                                    }`}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {playerReady && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 w-full h-full">
                    <iframe 
                        ref={iframeRef}
                        src={embedUrl} 
                        className="w-full h-full border-none outline-none" 
                        allowFullScreen 
                        allow="autoplay; encrypted-media; picture-in-picture"
                        tabIndex="0"
                    />
                </motion.div>
            )}

            {/* TV Back Button Overlay (Visible only when UI is shown) */}
            <div className="absolute top-10 left-10 z-50">
                <button 
                    onClick={handleClose} 
                    className="w-16 h-16 bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:scale-110 hover:bg-red-600 transition-all opacity-20 hover:opacity-100 group"
                >
                    <ArrowLeft size={32}/>
                </button>
            </div>
        </motion.div>
    );
}

