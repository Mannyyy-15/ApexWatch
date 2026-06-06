import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, RotateCw, X, Server, Globe, Users, Subtitles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';
import { useTVBackHandler } from '../hooks/useTV';
import { firestoreService } from '../utils/firestore';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

export function VideoPlayer() {
    const { activeMovieId, setCurrentView, user, activeProfile, activeSeason, activeEpisode, setActiveEpisode, activeMediaType, activeParty, isPartyHost, leaveWatchParty, updatePartyState, goBack } = useAppContext();

    useTVBackHandler(() => {
        if (activeParty) {
            leaveWatchParty();
        } else {
            goBack();
        }
    });

    const [movie, setMovie] = useState(null);
    const [startTime, setStartTime] = useState(0);
    const [loading, setLoading] = useState(true);
    const [playerReady, setPlayerReady] = useState(false);
    const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
    const [savedProgress, setSavedProgress] = useState(null);
    const [showResumeToast, setShowResumeToast] = useState(false);
    const [selectedServer, setSelectedServer] = useState('vidlink');
    const [showServerMenu, setShowServerMenu] = useState(false);

    // Watch Party & Custom Caption States
    const [localTime, setLocalTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [subStyles, setSubStyles] = useState({
        size: 'normal',
        color: '#ffffff',
        bgOpacity: '0.4'
    });
    const [showSubMenu, setShowSubMenu] = useState(false);

    // Next Episode Countdown States
    const [countdown, setCountdown] = useState(15);
    const [showNextEpPopup, setShowNextEpPopup] = useState(false);
    const [cancelAutoPlay, setCancelAutoPlay] = useState(false);

    // Auto-hide controls state
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef(null);

    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 4000);
    }, []);

    useEffect(() => {
        resetControlsTimeout();
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [resetControlsTimeout]);

    const SERVERS = [
        { id: 'vidlink', name: 'Server 1 (VidLink Pro - Fast/Auto)' },
        { id: 'vidsrc_net', name: 'Server 2 (VidSrc Net - Subtitles)' },
        { id: 'vidsrc_cc', name: 'Server 3 (VidSrc CC - Stable)' },
        { id: 'embed_su', name: 'Server 4 (Embed.su - High Quality)' },
        { id: 'autoembed', name: 'Server 5 (Autoembed - Backup)' },
        { id: '2embed', name: 'Server 6 (2Embed - Backup)' }
    ];


    useEffect(() => {
        // Lock to landscape when player opens
        const lockLandscape = async () => {
            try {
                await ScreenOrientation.lock({ orientation: 'landscape' });
                setIsPortrait(false);
            } catch (e) {
                // Fallback: try Web API (works on some browsers/WebViews)
                try {
                    if (window.screen?.orientation?.lock) {
                        await window.screen.orientation.lock('landscape');
                        setIsPortrait(false);
                    }
                } catch (_) {}
                // If both fail, show the rotate button so user can tap manually
            }
        };

        lockLandscape();

        if (Capacitor.isNativePlatform()) {
            StatusBar.hide().catch(() => {});
            Capacitor.Plugins.AppPIP?.setPipEnabled({ enabled: true }).catch(() => {});
        }

        const checkOrientation = () => {
            setIsPortrait(window.innerHeight > window.innerWidth);
            if (Capacitor.isNativePlatform()) {
                StatusBar.hide().catch(() => {});
            }
        };
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            // Unlock orientation when player closes
            ScreenOrientation.unlock().catch(() => {
                try { window.screen?.orientation?.unlock(); } catch (_) {}
            });
            if (Capacitor.isNativePlatform()) {
                StatusBar.show().catch(() => {});
                Capacitor.Plugins.AppPIP?.setPipEnabled({ enabled: false }).catch(() => {});
            }
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    useEffect(() => {
        if (!activeMovieId) return;

        const loadMovieAndProgress = async () => {
            setLoading(true);
            try {
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

                // If joining a Watch Party, sync starting time from the active room
                if (activeParty) {
                    setStartTime(activeParty.currentTime || 0);
                } else if (user && activeProfile) {
                    const progress = await firestoreService.getWatchProgress(user.uid, activeProfile.id, activeMovieId);
                    if (progress && progress.progressSeconds > 30) { 
                        setSavedProgress(progress);
                        setShowResumeToast(true);
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
    }, [activeMovieId, user, activeProfile, activeParty?.partyCode]);

    // Handle messages and watch progress updates
    useEffect(() => {
        if (!movie || !user || !activeProfile) return;

        const handleMessage = async (event) => {
            try {
                if (typeof event.data === 'string') {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'PLAYER_EVENT') {
                        const { event: eventName, currentTime, progress, duration: videoDuration } = payload.data;
                        
                        if (currentTime !== undefined) setLocalTime(currentTime);
                        if (videoDuration !== undefined) setDuration(videoDuration);

                        // If host, sync active plays/pauses to Firestore
                        if (activeParty && isPartyHost) {
                            if (eventName === 'pause') {
                                updatePartyState({ isPlaying: false, currentTime });
                            } else if (eventName === 'play') {
                                updatePartyState({ isPlaying: true, currentTime });
                            }
                        }

                        // Save watch progress to history list
                        await firestoreService.saveWatchProgress(user.uid, activeProfile.id, movie.id, {
                            progressSeconds: currentTime || 0,
                            durationSeconds: videoDuration || duration,
                            completed: ((currentTime || 0) / (videoDuration || duration)) >= 0.95,
                            contentType: movie.type,
                            title: movie.title,
                            poster: movie.poster,
                            backdrop: movie.backdrop,
                            year: movie.year,
                            season: activeSeason,
                            episode: activeEpisode,
                            genres: movie.tags || []
                        });
                    }
                }
            } catch (e) {}
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [movie, user, activeProfile, activeParty, isPartyHost, duration]);

    // Host Watch Party Periodical Sync Effect
    useEffect(() => {
        if (!activeParty || !isPartyHost) return;
        
        const timer = setInterval(() => {
            if (localTime > 0) {
                updatePartyState({
                    currentTime: localTime,
                    isPlaying: true
                });
            }
        }, 4000);

        return () => clearInterval(timer);
    }, [activeParty?.partyCode, isPartyHost, localTime]);

    // Guest Watch Party Sync Effect
    useEffect(() => {
        if (!activeParty || isPartyHost) return;

        // Note: Because we use 3rd-party iframes, forcing a seek requires a full iframe reload, 
        // which completely interrupts playback and causes aggressive buffering.
        // We rely on the initial load sync (in loadMovieAndProgress) for room synchronization.
    }, [activeParty?.isPlaying, activeParty?.currentTime, isPartyHost]);

    // Auto-Play countdown timer
    useEffect(() => {
        if (activeMediaType !== 'tv' || cancelAutoPlay || duration === 0) return;
        
        const remaining = duration - localTime;
        if (remaining > 0 && remaining < 15) {
            setShowNextEpPopup(true);
        } else {
            setShowNextEpPopup(false);
        }
    }, [localTime, duration, cancelAutoPlay, activeMediaType]);

    useEffect(() => {
        if (!showNextEpPopup || cancelAutoPlay) return;

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleNextEpisode();
                    return 15;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [showNextEpPopup, cancelAutoPlay]);

    const handleNextEpisode = () => {
        setActiveEpisode(prev => prev + 1);
        setStartTime(0);
        setLocalTime(0);
        setDuration(0);
        setCountdown(15);
        setShowNextEpPopup(false);
        setPlayerReady(false);
        setTimeout(() => setPlayerReady(true), 200);
    };

    const handleClose = (e) => {
        if (e) e.stopPropagation();
        if (activeParty) {
            leaveWatchParty();
        } else {
            goBack();
        }
    };

    const handleManualRotate = async () => {
        try {
            await ScreenOrientation.lock({ orientation: 'landscape' });
            setIsPortrait(false);
        } catch (e) {
            try {
                if (window.screen?.orientation?.lock) {
                    await window.screen.orientation.lock('landscape');
                    setIsPortrait(false);
                }
            } catch (_) {}
        }
    };

    if (loading || !movie) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    const getEmbedUrl = () => {
        if (!movie) return '';
        const id = movie.tmdbId || movie.id;
        const s = activeSeason || 1;
        const e = activeEpisode || 1;

        if (selectedServer === 'vidlink') {
            const baseUrl = movie.type === 'tv' 
                ? `https://vidlink.pro/tv/${id}/${s}/${e}`
                : `https://vidlink.pro/movie/${id}`;
            const params = new URLSearchParams({
                primaryColor: 'e50914',
                autoplay: 'true'
            });
            if (startTime > 5) params.set('t', Math.floor(startTime).toString());
            return `${baseUrl}?${params.toString()}`;
        }

        if (selectedServer === 'vidsrc_net') {
            return movie.type === 'tv'
                ? `https://vidsrc.net/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
                : `https://vidsrc.net/embed/movie?tmdb=${id}`;
        }

        if (selectedServer === 'vidsrc_cc') {
            return movie.type === 'tv'
                ? `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`
                : `https://vidsrc.cc/v2/embed/movie/${id}`;
        }

        if (selectedServer === 'embed_su') {
            return movie.type === 'tv'
                ? `https://embed.su/embed/tv/${id}/${s}/${e}`
                : `https://embed.su/embed/movie/${id}`;
        }

        if (selectedServer === 'autoembed') {
            return movie.type === 'tv'
                ? `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`
                : `https://player.autoembed.cc/embed/movie/${id}`;
        }

        if (selectedServer === '2embed') {
            return movie.type === 'tv'
                ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
                : `https://www.2embed.cc/embed/${id}`;
        }

        return '';
    };

    const copyRoomCode = () => {
        if (activeParty) {
            navigator.clipboard.writeText(activeParty.partyCode);
            alert("Watch Party room code copied!");
        }
    };

    const embedUrl = getEmbedUrl();

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden"
        >
            <div className="flex w-full h-full relative">
                {/* Left Side: Video Player Column */}
                <div className={`relative h-full transition-all duration-300 ${activeParty ? 'w-full md:w-[calc(100%-320px)]' : 'w-full'}`}>
                    
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


                    {/* Invisible Trigger Area to show controls when hovering/tapping the top of the screen */}
                    <div 
                        className="absolute top-0 left-0 right-0 h-32 z-40"
                        onMouseMove={resetControlsTimeout}
                        onTouchStart={resetControlsTimeout}
                        onClick={resetControlsTimeout}
                    />

                    {/* Top-Left Controls: Back */}
                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-6 left-6 pointer-events-auto z-50"
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleClose(e); }}
                                    className="w-12 h-12 bg-black/60 backdrop-blur-md rounded-full border border-white/15 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-lg cursor-pointer"
                                    title="Go Back"
                                >
                                    <ArrowLeft size={22} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Top-Right Controls: Subtitles, Server, Rotate */}
                    <AnimatePresence>
                        {showControls && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-6 right-6 pointer-events-auto z-50 flex items-center gap-2.5"
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowServerMenu(true); }}
                                    className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-3 rounded-full border border-white/15 text-white hover:bg-white hover:text-black transition-all shadow-xl cursor-pointer"
                                    title="Select Server"
                                >
                                    <Server size={18} />
                                </button>
                                {isPortrait && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleManualRotate(); }}
                                        className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/15 text-white hover:bg-white/20 transition-all shadow-xl cursor-pointer"
                                    >
                                        <RotateCw size={15} className="text-accent" />
                                        <span className="font-bold text-[11px] uppercase tracking-wider hidden sm:inline">Rotate</span>
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Guest Synced Pause Blur Overlay */}
                    {activeParty && !activeParty.isPlaying && !isPartyHost && (
                        <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto text-center p-6">
                            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6 border border-accent/20 animate-pulse">
                                <Play size={36} className="text-accent ml-1" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-widest italic text-white mb-2">Watch Party Paused</h3>
                            <p className="text-white/40 text-sm max-w-xs font-semibold">The host has paused streaming. Sync will resume automatically.</p>
                        </div>
                    )}


                    {/* Netflix-style Next Episode Auto-Play Countdown Popup */}
                    <AnimatePresence>
                        {showNextEpPopup && (
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                                className="absolute bottom-24 right-8 z-[60] pointer-events-auto bg-[#0a0a0a]/95 border border-white/10 rounded-2xl p-5 w-72 shadow-[0_25px_50px_rgba(0,0,0,0.8)] border-r-4 border-r-accent"
                            >
                                <h4 className="text-[10px] font-black text-accent uppercase tracking-widest mb-1.5">Next Episode playing</h4>
                                <p className="text-white font-bold text-sm mb-3">Season {activeSeason}, Episode {activeEpisode + 1}</p>
                                <div className="flex items-center justify-between gap-3">
                                    <button 
                                        onClick={handleNextEpisode}
                                        className="flex-1 py-2 px-3 bg-accent text-white font-black text-[10px] uppercase tracking-wider rounded-lg active:scale-95 transition-all cursor-pointer"
                                    >
                                        Play Now ({countdown}s)
                                    </button>
                                    <button 
                                        onClick={() => setCancelAutoPlay(true)}
                                        className="py-2 px-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Resume Playback Toast */}
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
                                        setPlayerReady(false);
                                        setTimeout(() => setPlayerReady(true), 200);
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
                </div>

                {/* Right Side: Watch Party Sidebar */}
                {activeParty && (
                    <div className="hidden md:flex w-80 h-full bg-[#080808]/95 border-l border-white/10 flex-col p-6 justify-between relative z-40">
                        <div className="space-y-6">
                            <div className="pb-4 border-b border-white/5">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users size={20} className="text-accent" />
                                    <h3 className="text-lg font-black uppercase tracking-wider italic text-white">Watch Party</h3>
                                </div>
                                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Co-streaming room</p>
                            </div>

                            {/* Room Code Info Box */}
                            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Invite Room Code</span>
                                <h4 className="text-2xl font-black tracking-widest text-accent font-mono mb-3">{activeParty.partyCode}</h4>
                                <button 
                                    onClick={copyRoomCode}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer"
                                >
                                    Copy Code
                                </button>
                            </div>

                            {/* Members Joined List */}
                            <div className="space-y-3">
                                <h5 className="text-[9px] font-black text-white/40 uppercase tracking-widest">Members ({activeParty.members?.length || 1})</h5>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 hide-scrollbar">
                                    {activeParty.members?.map((member, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/3 border border-white/5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/15">
                                                    <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-xs font-bold text-white truncate">{member.name}</span>
                                            </div>
                                            {activeParty.hostId === user?.uid && idx === 0 ? (
                                                <span className="text-[7px] font-black bg-accent text-white py-0.5 px-1.5 rounded uppercase tracking-wider">Host</span>
                                            ) : (
                                                <span className="text-[7px] font-black bg-white/10 text-white/60 py-0.5 px-1.5 rounded uppercase tracking-wider">Member</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer Control: Leave Room */}
                        <div className="space-y-4">
                            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-2.5 text-[9px] text-white/40 font-black uppercase tracking-wide">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></div>
                                <span>Party Session Active</span>
                            </div>
                            <button 
                                onClick={handleClose}
                                className="w-full py-3.5 bg-accent hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all active:scale-95 cursor-pointer shadow-[0_10px_20px_rgba(229,9,20,0.2)]"
                            >
                                Leave Watch Party
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sliding Server Switcher Drawer */}
            <AnimatePresence>
                {showServerMenu && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowServerMenu(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[70] pointer-events-auto"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                            className="absolute top-0 right-0 bottom-0 w-80 md:w-96 bg-[#080808]/95 backdrop-blur-2xl border-l border-white/10 z-[80] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col pointer-events-auto justify-between"
                        >
                            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <Server size={20} className="text-accent" />
                                        <h3 className="text-lg font-black uppercase tracking-wider italic">Stream Sources</h3>
                                    </div>
                                    <button 
                                        onClick={() => setShowServerMenu(false)} 
                                        className="p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer text-white/50 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-white/60 space-y-2 leading-relaxed">
                                    <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider text-[10px]">
                                        <Globe size={12} className="text-accent animate-spin-slow" />
                                        <span>Language & Subtitles</span>
                                    </div>
                                    <p>
                                        If subtitles are missing or the audio language is incorrect, switch to <strong className="text-white">Server 2</strong> or <strong className="text-white">Server 3</strong>. Some servers support dual audio tracks.
                                    </p>
                                </div>

                                <div className="space-y-2.5 overflow-y-auto flex-1 pr-2 pb-4 hide-scrollbar">
                                    {SERVERS.map((srv) => {
                                        const isSelected = selectedServer === srv.id;
                                        return (
                                            <button
                                                key={srv.id}
                                                onClick={() => {
                                                    setSelectedServer(srv.id);
                                                    setShowServerMenu(false);
                                                }}
                                                className={`w-full flex items-center justify-between p-4 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer active:scale-98 text-left ${
                                                    isSelected
                                                        ? 'bg-accent border-accent text-white shadow-[0_0_20px_rgba(229,9,20,0.25)]'
                                                        : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/10'
                                                }`}
                                            >
                                                <span>{srv.name}</span>
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="text-[10px] text-white/30 uppercase font-black tracking-widest text-center pt-4 border-t border-white/5">
                                Playing on ApexWatch Premium
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Sliding Subtitles Styling Drawer */}
            <AnimatePresence>
                {showSubMenu && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSubMenu(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[70] pointer-events-auto"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                            className="absolute top-0 right-0 bottom-0 w-80 md:w-96 bg-[#080808]/95 backdrop-blur-2xl border-l border-white/10 z-[80] p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col pointer-events-auto justify-between"
                        >
                            <div className="space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <Subtitles size={20} className="text-accent" />
                                        <h3 className="text-lg font-black uppercase tracking-wider italic">Subtitle Options</h3>
                                    </div>
                                    <button 
                                        onClick={() => setShowSubMenu(false)} 
                                        className="p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer text-white/50 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Text Size */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Text Size</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['small', 'normal', 'large'].map((sz) => (
                                            <button
                                                key={sz}
                                                onClick={() => setSubStyles(prev => ({ ...prev, size: sz }))}
                                                className={`py-2 px-3 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all ${
                                                    subStyles.size === sz
                                                        ? 'bg-accent border-accent text-white'
                                                        : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                                                }`}
                                            >
                                                {sz}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Text Color</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { code: '#ffffff', name: 'White' },
                                            { code: '#ffff00', name: 'Yellow' },
                                            { code: '#00ffff', name: 'Cyan' }
                                        ].map((color) => (
                                            <button
                                                key={color.code}
                                                onClick={() => setSubStyles(prev => ({ ...prev, color: color.code }))}
                                                className={`py-2 px-3 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all ${
                                                    subStyles.color === color.code
                                                        ? 'bg-accent border-accent text-white'
                                                        : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                                                }`}
                                            >
                                                {color.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Background Opacity */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Background Opacity</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { code: '0', name: 'None' },
                                            { code: '0.4', name: 'Medium' },
                                            { code: '0.8', name: 'Dark' }
                                        ].map((op) => (
                                            <button
                                                key={op.code}
                                                onClick={() => setSubStyles(prev => ({ ...prev, bgOpacity: op.code }))}
                                                className={`py-2 px-3 rounded-lg border font-bold text-[10px] uppercase tracking-widest transition-all ${
                                                    subStyles.bgOpacity === op.code
                                                        ? 'bg-accent border-accent text-white'
                                                        : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                                                }`}
                                            >
                                                {op.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="text-[10px] text-white/30 uppercase font-black tracking-widest text-center pt-4 border-t border-white/5">
                                Subtitle Options
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
