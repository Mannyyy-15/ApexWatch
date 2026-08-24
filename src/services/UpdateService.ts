import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import pkg from '../../package.json';

const UPDATE_SERVER_URL = 'https://apex-watch.vercel.app'; // Production server

export interface UpdateProgress {
    phase: 'idle' | 'checking' | 'update_available' | 'downloading' | 'extracting' | 'ready' | 'error';
    progress: number; // 0-100
    message?: string;
}

type ProgressCallback = (state: UpdateProgress) => void;

class UpdateServiceClass {
    private onProgress?: ProgressCallback;
    private targetVersion: string | null = null;
    private downloadedBundle: any = null;

    setProgressListener(cb: ProgressCallback) {
        this.onProgress = cb;
    }

    private emit(state: UpdateProgress) {
        if (this.onProgress) this.onProgress(state);
    }

    getTargetVersion(): string | null {
        return this.targetVersion;
    }

    async getCurrentAppVersion(): Promise<string> {
        let currentVersion = pkg.version;
        if (Capacitor.isNativePlatform()) {
            try {
                const currentBundle = await CapacitorUpdater.current();
                if (currentBundle && currentBundle.bundle && currentBundle.bundle.id) {
                    const cleanId = currentBundle.bundle.id.replace(/^update-/, '');
                    if (/^\d+\.\d+/.test(cleanId)) {
                        currentVersion = cleanId;
                    }
                }
            } catch (e) {
                console.warn('[UpdateService] Could not fetch current CapacitorUpdater bundle:', e);
            }
        }
        return currentVersion;
    }

    async checkForUpdate(silent = true): Promise<boolean> {
        if (!silent) this.emit({ phase: 'checking', progress: 0 });
        try {
            const res = await fetch(`${UPDATE_SERVER_URL}/version.json?t=${Date.now()}`);
            if (!res.ok) throw new Error('Failed to fetch version metadata');
            
            const data = await res.json();
            const currentVersion = await this.getCurrentAppVersion();
            
            console.log(`[UpdateService] Current: ${currentVersion}, Latest Remote: ${data.latestVersion}`);

            if (this.isNewerVersion(currentVersion, data.latestVersion)) {
                this.targetVersion = data.latestVersion;
                this.emit({ phase: 'update_available', progress: 0 });
                return true;
            }
            this.emit({ phase: 'idle', progress: 0 });
            return false;
        } catch (error) {
            console.error('Update Check Error:', error);
            if (!silent) {
                this.emit({ phase: 'error', progress: 0, message: (error as Error).message });
            } else {
                this.emit({ phase: 'idle', progress: 0 });
            }
            return false;
        }
    }

    async downloadAndInstallUpdate(): Promise<boolean> {
        if (!this.targetVersion) return false;
        
        let zipUrl = '';
        try {
            this.emit({ phase: 'downloading', progress: 20 });
            
            if (Capacitor.isNativePlatform()) {
                zipUrl = `${UPDATE_SERVER_URL}/update-${this.targetVersion}.zip`;
                const uniqueVersionId = this.targetVersion;
                
                CapacitorUpdater.addListener('download', (info: any) => {
                    this.emit({ phase: 'downloading', progress: info.percent });
                });

                const bundle = await CapacitorUpdater.download({
                    url: zipUrl,
                    version: uniqueVersionId,
                });
                
                this.downloadedBundle = bundle;
                this.emit({ phase: 'ready', progress: 100 });
                return true;
            } else {
                // Mobile Web or Browser: Trigger APK download or reload
                this.emit({ phase: 'downloading', progress: 70 });
                setTimeout(() => {
                    window.open('https://github.com/Mannyyy-15/ApexWatch/raw/main/ApexWatch.apk', '_blank');
                    this.emit({ phase: 'ready', progress: 100 });
                }, 500);
                return true;
            }
        } catch (error: any) {
            console.error('Update Install Error:', error);
            const errMsg = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
            this.emit({ 
                phase: 'error', 
                progress: 0, 
                message: `URL: ${zipUrl} | Error: ${errMsg}` 
            });
            return false;
        }
    }

    async applyUpdateAndRestart(): Promise<void> {
        if (this.downloadedBundle) {
            try {
                // This swaps the native Capgo pointer and reloads the WebView instantly
                await CapacitorUpdater.set({ id: this.downloadedBundle.id });
            } catch (e) {
                console.error("Failed to swap version", e);
                window.location.reload();
            }
        } else {
            window.location.reload();
        }
    }

    async clearUpdates(): Promise<void> {
        try {
            await CapacitorUpdater.reset();
        } catch (error) {
            console.error('Error clearing updates', error);
        }
    }

    async notifyAppReady(): Promise<void> {
        try {
            if (Capacitor.isNativePlatform()) {
                await CapacitorUpdater.notifyAppReady();
                console.log('[UpdateService] Notified Capgo that app is ready (health check passed)');
            }
        } catch (error) {
            console.error('[UpdateService] Error notifying app ready:', error);
        }
    }

    private isNewerVersion(oldVer: string, newVer: string): boolean {
        if (!newVer) return false;
        if (!oldVer || !/^\d+\.\d+/.test(oldVer)) oldVer = pkg.version;
        const oldParts = oldVer.split('.').map(n => parseInt(n) || 0);
        const newParts = newVer.split('.').map(n => parseInt(n) || 0);
        for (let i = 0; i < Math.max(oldParts.length, newParts.length); i++) {
            const o = oldParts[i] || 0;
            const n = newParts[i] || 0;
            if (n > o) return true;
            if (n < o) return false;
        }
        return false;
    }
}

export const UpdateService = new UpdateServiceClass();
