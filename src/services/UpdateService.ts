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
                    if (cleanId) currentVersion = cleanId;
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
            this.emit({ phase: 'downloading', progress: 0 });
            
            // 1. Download via Capgo's native C++/Swift engine
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

            // 2. Ready for swap
            this.emit({ phase: 'ready', progress: 100 });
            return true;

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
        const oldParts = oldVer.split('.').map(Number);
        const newParts = newVer.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (newParts[i] > oldParts[i]) return true;
            if (newParts[i] < oldParts[i]) return false;
        }
        return false;
    }
}

export const UpdateService = new UpdateServiceClass();
