import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';
import { firestoreService } from '../utils/firestore';

export function VideoPlayer() {
    const { activeMovieId, setCurrentView, user, activeProfile } = useAppContext();
    const [movie, setMovie] = useState(null);
    const [startTime, setStartTime] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeMovieId) return;

        const loadMovieAndProgress = async () => {
            setLoading(true);
            try {
                // Fetch Metadata
                let data;
                try {
                    data = await tmdb.fetchMovieDetails(activeMovieId);
                    if (!data.title) throw new Error('Not a movie');
                } catch {
                    data = await tmdb.fetchTVDetails(activeMovieId);
                }
                const formatted = tmdb.formatMovie(data);
                setMovie(formatted);

                // Fetch Progress
                if (user && activeProfile) {
                    const progress = await firestoreService.getWatchProgress(user.uid, activeProfile.id, activeMovieId);
                    if (progress && progress.progressSeconds > 5) {
                        setStartTime(progress.progressSeconds);
                    }
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
                            contentType: movie.type
                        });
                    }
                }
            } catch (e) { }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [movie, user, activeProfile]);

    const handleClose = (e) => {
        e.stopPropagation();
        setCurrentView('details');
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
        ? `https://www.vidking.net/embed/tv/${movie.tmdbId}/${movie.season || 1}/${movie.episode || 1}`
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

    return (<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="fixed inset-0 z-50 bg-black">
      <iframe 
        src={embedUrl} 
        className="w-full h-full border-none" 
        allowFullScreen 
        allow="autoplay; encrypted-media; picture-in-picture"
      />

      <div className="absolute top-6 left-6 pointer-events-auto z-50">
        <button onClick={handleClose} className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:bg-white hover:text-black hover:scale-110 transition-all opacity-30 hover:opacity-100 group" title="Go Back">
          <ArrowLeft size={24}/>
        </button>
      </div>
    </motion.div>);
}
