import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cast, Tv, Smartphone, Check } from 'lucide-react';
import { castService } from '../services/castService';
import { useAppContext } from '../context/AppContext';

export function TVReceiverOverlay() {
  const { 
    user, 
    setCurrentView, 
    setActiveMovieId, 
    setActiveMediaType, 
    setActiveSeason, 
    setActiveEpisode 
  } = useAppContext();

  const [tvPairingCode, setTvPairingCode] = useState('');
  const [incomingCastToast, setIncomingCastToast] = useState(null);

  useEffect(() => {
    const isTV = document.body.classList.contains('is-tv');
    if (!isTV) return;
    
    let cleanup = null;
    try {
      const { code } = castService.registerTVReceiver(user, (sessionData) => {
        if (!sessionData) return;

        const { command, mediaId, mediaType, title, season, episode, currentTime, server, senderName } = sessionData;

        if (command === 'LOAD_MEDIA' && mediaId) {
          setIncomingCastToast({
            title,
            senderName: senderName || 'Mobile Device'
          });

          // Switch TV playback immediately
          if (setActiveMovieId) setActiveMovieId(mediaId);
          if (setActiveMediaType) setActiveMediaType(mediaType || 'movie');
          if (setActiveSeason) setActiveSeason(season || 1);
          if (setActiveEpisode) setActiveEpisode(episode || 1);
          if (setCurrentView) setCurrentView('player');

          setTimeout(() => setIncomingCastToast(null), 6000);
        }
      });

      setTvPairingCode(code);
      cleanup = () => castService.unregisterTVReceiver();
    } catch (e) {
      console.warn('TV receiver registration error:', e);
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [user]);

  if (!tvPairingCode) return null;

  return (
    <>
      {/* Subtle TV Pairing Badge in Top Right of TV */}
      <div className="fixed top-6 right-8 z-[40] pointer-events-none hidden group-[.is-tv]/body:flex items-center gap-2.5 py-1.5 px-3.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <Cast size={14} className="text-white/60" />
        <span className="text-[11px] font-black uppercase tracking-widest text-white/80 font-mono">
          TV Cast: {tvPairingCode}
        </span>
      </div>

      {/* Incoming Cast Animated Toast */}
      <AnimatePresence>
        {incomingCastToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-black/95 backdrop-blur-2xl border-2 border-accent p-5 rounded-3xl shadow-[0_0_50px_rgba(229,9,20,0.5)] flex items-center gap-4 text-white"
          >
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg">
              <Cast size={26} className="text-white animate-bounce" />
            </div>
            <div>
              <p className="text-[11px] font-black text-accent uppercase tracking-widest">
                Casting from {incomingCastToast.senderName}
              </p>
              <h4 className="text-lg font-black tracking-tight">{incomingCastToast.title}</h4>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
