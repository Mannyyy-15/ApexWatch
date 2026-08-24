import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Tv, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Server, 
  ListVideo, 
  Volume2, 
  VolumeX, 
  Cast, 
  Maximize2 
} from 'lucide-react';
import { castService } from '../services/castService';

export function CastRemoteControl({ castSession, onDisconnect }) {
  const [sessionData, setSessionData] = useState(castSession || {});
  const [isMinimized, setIsMinimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(castSession?.currentTime || 0);
  const [duration, setDuration] = useState(castSession?.duration || 0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (castSession) {
      setSessionData(castSession);
      setIsPlaying(castSession.isPlaying ?? true);
      setCurrentTime(castSession.currentTime || 0);
      setDuration(castSession.duration || 0);
    }
  }, [castSession]);

  // Handle Play/Pause
  const togglePlayPause = () => {
    const newPlayState = !isPlaying;
    setIsPlaying(newPlayState);
    castService.sendRemoteCommand(newPlayState ? 'PLAY' : 'PAUSE');
  };

  // Handle Seek -10s
  const handleSeekBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    castService.sendRemoteCommand('SEEK', { time: newTime });
  };

  // Handle Seek +10s
  const handleSeekForward = () => {
    const newTime = currentTime + 10;
    setCurrentTime(newTime);
    castService.sendRemoteCommand('SEEK', { time: newTime });
  };

  // Handle Next Episode
  const handleNextEpisode = () => {
    const nextEp = (sessionData.episode || 1) + 1;
    setSessionData(prev => ({ ...prev, episode: nextEp }));
    castService.sendRemoteCommand('NEXT_EPISODE', { episode: nextEp });
  };

  // Handle Server Switch
  const handleServerChange = (serverId) => {
    setSessionData(prev => ({ ...prev, server: serverId }));
    castService.sendRemoteCommand('CHANGE_SERVER', { server: serverId });
  };

  // Handle Disconnect
  const handleStopCast = async () => {
    await castService.stopCasting();
    if (onDisconnect) onDisconnect();
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!castSession) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[95%] max-w-lg bg-[#0e0e0e]/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-white overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="p-4 bg-gradient-to-r from-accent/20 via-black to-black border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg">
              <Tv size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Casting to {sessionData.tvName || 'Smart TV'}
                </span>
              </div>
              <p className="text-[11px] text-white/60 font-semibold truncate max-w-[200px] sm:max-w-[280px]">
                {sessionData.title} {sessionData.mediaType === 'tv' ? `(S${sessionData.season}:E${sessionData.episode})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <button
              onClick={handleStopCast}
              className="py-1 px-3 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-red-500/30"
              title="Stop Casting"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Expanded Remote Control Body */}
        {!isMinimized && (
          <div className="p-5 space-y-5">
            {/* Media Progress Bar */}
            <div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2">
                <div 
                  className="bg-accent h-full rounded-full transition-all duration-300"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 35}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{duration > 0 ? formatTime(duration) : 'Live Cast'}</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-6 py-2">
              {/* -10s */}
              <button
                onClick={handleSeekBackward}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer"
                title="Rewind 10s"
              >
                <RotateCcw size={20} />
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePlayPause}
                className="w-16 h-16 rounded-full bg-accent hover:bg-red-700 text-white shadow-[0_0_25px_rgba(229,9,20,0.6)] flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
              </button>

              {/* +10s */}
              <button
                onClick={handleSeekForward}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer"
                title="Forward 10s"
              >
                <RotateCw size={20} />
              </button>
            </div>

            {/* Quick Actions Row: Next Episode / Server */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              {sessionData.mediaType === 'tv' && (
                <button
                  onClick={handleNextEpisode}
                  className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ListVideo size={14} className="text-accent" />
                  <span>Next Episode (E{(sessionData.episode || 1) + 1})</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Server:</span>
                <select
                  value={sessionData.server || 'vidlink'}
                  onChange={(e) => handleServerChange(e.target.value)}
                  className="bg-white/10 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="vidlink" className="bg-black">VidLink Pro</option>
                  <option value="videasy" className="bg-black">Videasy HD</option>
                  <option value="vidsrc_pm" className="bg-black">VidSrc PM</option>
                  <option value="autoembed_co" className="bg-black">AutoEmbed</option>
                  <option value="smashystream" className="bg-black">SmashyStream</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
