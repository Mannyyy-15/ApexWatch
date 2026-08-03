import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DownloadCloud, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { UpdateService, UpdateProgress } from '../services/UpdateService';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function UpdaterModal() {
    const [isVisible, setIsVisible] = useState(false);
    const [progressState, setProgressState] = useState<UpdateProgress>({ phase: 'idle', progress: 0 });

    useEffect(() => {
        UpdateService.setProgressListener((state) => {
            setProgressState(state);
            if (state.phase === 'update_available' || state.phase === 'downloading' || state.phase === 'extracting' || state.phase === 'ready' || state.phase === 'error') {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        });

        // Trigger a background silent check on mount if native platform
        if (Capacitor.isNativePlatform()) {
            UpdateService.checkForUpdate(true); // Silent check
        }
    }, []);

    // Auto-focus first button on TV remote D-Pad when update modal appears
    useEffect(() => {
        if (isVisible) {
            const focusModalButton = () => {
                const focusable = document.querySelectorAll('.updater-modal-container .tv-focusable');
                if (focusable.length > 0) {
                    (focusable[0] as HTMLElement).focus();
                }
            };
            focusModalButton();
            const t1 = setTimeout(focusModalButton, 50);
            const t2 = setTimeout(focusModalButton, 200);
            const t3 = setTimeout(focusModalButton, 500);
            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
            };
        }
    }, [isVisible, progressState.phase]);

    const handleInstall = async () => {
        await UpdateService.downloadAndInstallUpdate();
    };

    const handleRestart = async () => {
        await UpdateService.applyUpdateAndRestart();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 updater-modal-container">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                        onClick={() => setIsVisible(false)}
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative z-10 w-full max-w-sm bg-[#0d0d0d] border border-white/15 p-6 md:p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            {progressState.phase === 'update_available' && <DownloadCloud className="text-accent animate-bounce" size={28} />}
                            {progressState.phase === 'downloading' && <DownloadCloud className="text-accent animate-pulse" size={28} />}
                            {progressState.phase === 'extracting' && <RefreshCw className="text-blue-500 animate-spin" size={28} />}
                            {progressState.phase === 'ready' && <CheckCircle2 className="text-green-500" size={28} />}
                            {progressState.phase === 'error' && <AlertCircle className="text-red-500" size={28} />}
                        </div>

                        <h3 className="text-xl font-black text-white uppercase tracking-wider italic mb-2">
                            {progressState.phase === 'update_available' && `Update ${UpdateService.getTargetVersion() || ''} Available`}
                            {progressState.phase === 'downloading' && 'Downloading'}
                            {progressState.phase === 'extracting' && 'Extracting Assets'}
                            {progressState.phase === 'ready' && 'Update Ready'}
                            {progressState.phase === 'error' && 'Update Failed'}
                        </h3>
                        
                        <p className="text-white/40 text-xs mb-8">
                            {progressState.phase === 'update_available' && 'A new version is ready to be installed over the air.'}
                            {progressState.phase === 'downloading' && 'Fetching the latest improvements over the air.'}
                            {progressState.phase === 'extracting' && 'Installing the new bundle directly to your device.'}
                            {progressState.phase === 'ready' && 'A new version has been successfully installed.'}
                            {progressState.phase === 'error' && (progressState.message || 'Something went wrong during the update process.')}
                        </p>

                        {(progressState.phase === 'downloading' || progressState.phase === 'extracting') && (
                            <div className="w-full mb-6">
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        className={`h-full ${progressState.phase === 'downloading' ? 'bg-accent' : 'bg-blue-500'}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressState.progress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <div className="mt-2 text-[10px] font-black tracking-widest text-white/40 uppercase text-right">
                                    {progressState.progress}%
                                </div>
                            </div>
                        )}

                        <div className="w-full space-y-3">
                            {progressState.phase === 'update_available' && (
                                <button 
                                    onClick={handleInstall}
                                    tabIndex={0}
                                    autoFocus
                                    className="w-full py-4 bg-accent text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(229,9,20,0.5)] cursor-pointer tv-focusable"
                                >
                                    Install Now
                                </button>
                            )}

                            {progressState.phase === 'ready' && (
                                <button 
                                    onClick={handleRestart}
                                    tabIndex={0}
                                    autoFocus
                                    className="w-full py-4 bg-green-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(34,197,94,0.5)] cursor-pointer tv-focusable"
                                >
                                    Restart App to Apply
                                </button>
                            )}

                            {(progressState.phase === 'error' || progressState.phase === 'update_available') && (
                                <button 
                                    onClick={() => setIsVisible(false)}
                                    tabIndex={0}
                                    className="w-full py-3.5 bg-white/10 text-white/70 hover:text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all cursor-pointer tv-focusable"
                                >
                                    Dismiss / Remind Me Later
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
