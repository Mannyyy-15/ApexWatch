import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cast, Tv, Monitor, Smartphone, X, Search, Wifi, Check, Sparkles, RefreshCw, AlertCircle, ArrowRight, Radio } from 'lucide-react';
import { castService } from '../services/castService';
import { useAppContext } from '../context/AppContext';

export function CastModal({ isOpen, onClose, currentMedia, onCastStarted }) {
  const { user } = useAppContext();
  const [nearbyTVs, setNearbyTVs] = useState([]);
  const [scanning, setScanning] = useState(true);
  const [pairingCode, setPairingCode] = useState('');
  const [connectingTvId, setConnectingTvId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('tvs'); // 'tvs' | 'native' | 'mirror'

  // Scan for nearby TV receivers
  const scanForTVs = async () => {
    setScanning(true);
    setErrorMsg('');
    try {
      const tvs = await castService.discoverNearbyTVs(user);
      setNearbyTVs(tvs);
    } catch (e) {
      console.warn('Error scanning for TVs:', e);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      scanForTVs();
    }
  }, [isOpen]);

  // Handle Direct TV Cloud Cast
  const handleConnectTV = async (tv) => {
    if (!currentMedia) {
      setErrorMsg('No active media to cast.');
      return;
    }
    setConnectingTvId(tv.tvId);
    setErrorMsg('');

    try {
      const success = await castService.castToTV(tv.tvId, currentMedia);
      if (success) {
        if (onCastStarted) onCastStarted({ type: 'apex_cast', tvName: tv.name || 'Smart TV', tvId: tv.tvId });
        onClose();
      } else {
        setErrorMsg('Failed to connect to TV. Please make sure the app is open on the TV.');
      }
    } catch (err) {
      setErrorMsg('Connection error: ' + (err.message || err));
    } finally {
      setConnectingTvId(null);
    }
  };

  // Handle Code Pair
  const handlePairByCode = async (e) => {
    e.preventDefault();
    if (!pairingCode.trim()) return;
    setConnectingTvId('code');
    setErrorMsg('');

    try {
      const tv = await castService.findTVByCode(pairingCode);
      if (!tv) {
        setErrorMsg(`No active TV found with code "${pairingCode.toUpperCase()}". Open ApexWatch on your TV to view its code.`);
        setConnectingTvId(null);
        return;
      }

      await handleConnectTV(tv);
    } catch (err) {
      setErrorMsg('Pairing error: ' + err.message);
      setConnectingTvId(null);
    }
  };

  // Handle Google Cast / Presentation API
  const handleNativeCast = async () => {
    setErrorMsg('');
    try {
      const res = await castService.startNativeCast();
      if (res.success) {
        if (onCastStarted) onCastStarted({ type: res.type, tvName: 'Wireless Display' });
        onClose();
      } else {
        setErrorMsg('No wireless display or Chromecast found on your local network. You can also use ApexCast with your TV Pairing Code.');
      }
    } catch (err) {
      setErrorMsg('Cast error: ' + err.message);
    }
  };

  // Handle Screen Mirroring
  const handleScreenMirror = async () => {
    setErrorMsg('');
    try {
      const res = await castService.startScreenMirror();
      if (res.success) {
        if (onCastStarted) onCastStarted({ type: 'mirror', tvName: 'Screen Mirror' });
        onClose();
      } else {
        setErrorMsg(res.error || 'Screen mirroring could not be initiated.');
      }
    } catch (err) {
      setErrorMsg('Mirroring error: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0e0e0e] border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                <Cast size={22} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight uppercase italic flex items-center gap-2">
                  Cast to TV <span className="text-[10px] not-italic px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold">ApexCast™</span>
                </h3>
                <p className="text-xs text-white/50">Stream movie & control playback on TV</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-xs text-red-200"
            >
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 my-4 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              onClick={() => setActiveTab('tvs')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'tvs' ? 'bg-accent text-white shadow-lg' : 'text-white/60 hover:text-white'
              }`}
            >
              <Tv size={14} />
              <span>Smart TVs</span>
            </button>
            <button
              onClick={() => setActiveTab('native')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'native' ? 'bg-accent text-white shadow-lg' : 'text-white/60 hover:text-white'
              }`}
            >
              <Radio size={14} />
              <span>Chromecast</span>
            </button>
            <button
              onClick={() => setActiveTab('mirror')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'mirror' ? 'bg-accent text-white shadow-lg' : 'text-white/60 hover:text-white'
              }`}
            >
              <Monitor size={14} />
              <span>Mirror</span>
            </button>
          </div>

          {/* TAB 1: Smart TVs (Cloud Pair) */}
          {activeTab === 'tvs' && (
            <div className="space-y-4">
              {/* Nearby Discovered TVs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-white/50">Discovered TVs</span>
                  <button 
                    onClick={scanForTVs}
                    disabled={scanning}
                    className="text-[11px] text-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} className={scanning ? 'animate-spin' : ''} />
                    <span>{scanning ? 'Scanning...' : 'Refresh'}</span>
                  </button>
                </div>

                {nearbyTVs.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {nearbyTVs.map(tv => (
                      <button
                        key={tv.tvId}
                        onClick={() => handleConnectTV(tv)}
                        disabled={connectingTvId === tv.tvId}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-accent/20 border border-white/10 hover:border-accent/40 transition-all text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/80 group-hover:text-accent group-hover:bg-accent/20 transition-colors">
                            <Tv size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white group-hover:text-accent transition-colors">{tv.name || 'Smart TV'}</p>
                            <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                              Ready to Cast ({tv.code})
                            </span>
                          </div>
                        </div>
                        <div className="py-1 px-3 bg-accent/20 text-accent group-hover:bg-accent group-hover:text-white rounded-lg text-xs font-bold transition-all">
                          {connectingTvId === tv.tvId ? 'Connecting...' : 'Cast'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <p className="text-xs text-white/60">
                      {scanning ? 'Searching for active Smart TVs on your network...' : 'No Smart TV auto-detected yet.'}
                    </p>
                    <p className="text-[10px] text-white/40 mt-1">Make sure ApexWatch is open on your TV or enter its code below.</p>
                  </div>
                )}
              </div>

              {/* Enter TV Code Form */}
              <div className="pt-2 border-t border-white/10">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/50 block mb-2">Or Pair by TV Code</span>
                <form onSubmit={handlePairByCode} className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="e.g. APEX-4829"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-white/5 border border-white/15 focus:border-accent rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-widest text-white placeholder-white/30 outline-none uppercase transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!pairingCode.trim() || connectingTvId === 'code'}
                    className="py-2.5 px-5 bg-accent hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {connectingTvId === 'code' ? 'Connecting...' : 'Connect'}
                    <ArrowRight size={14} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Google Cast / AirPlay */}
          {activeTab === 'native' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mx-auto">
                <Radio size={32} className="animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">Google Cast & AirPlay</h4>
                <p className="text-xs text-white/60 mt-1 max-w-xs mx-auto">
                  Stream to any Chromecast, Google TV, Apple TV, or wireless display connected to your Wi-Fi.
                </p>
              </div>
              <button
                onClick={handleNativeCast}
                className="w-full py-3.5 bg-accent hover:bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2"
              >
                <Cast size={16} />
                <span>Search Wireless Displays</span>
              </button>
            </div>
          )}

          {/* TAB 3: Screen Mirroring */}
          {activeTab === 'mirror' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto">
                <Monitor size={32} />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">Screen Mirroring</h4>
                <p className="text-xs text-white/60 mt-1 max-w-xs mx-auto">
                  Mirror your current browser tab or entire screen directly to an external monitor or projector.
                </p>
              </div>
              <button
                onClick={handleScreenMirror}
                className="w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Monitor size={16} />
                <span>Start Screen Mirror</span>
              </button>
            </div>
          )}

          {/* Footer Guide */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40">
            <span>💡 Tip: Keep ApexWatch open on your TV</span>
            <span className="font-mono text-accent">v1.0.90</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
