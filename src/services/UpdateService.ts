import { CapacitorUpdater } from '@capgo/capacitor-updater';
import pkg from '../../package.json';

const UPDATE_SERVER_URL = 'https://apex-watch.vercel.app'; // Production server

export interface UpdateProgress {
    phase: 'idle' | 'checking' | 'downloading' | 'extracting' | 'ready' | 'error';
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

    async checkForUpdate(): Promise<boolean> {
        this.emit({ phase: 'checking', progress: 0 });
        try {
            const res = await fetch(`${UPDATE_SERVER_URL}/version.json?t=${Date.now()}`);
            if (!res.ok) throw new Error('Failed to fetch version metadata');
            
            const data = await res.json();
            const currentVersion = pkg.version;
            
            if (this.isNewerVersion(currentVersion, data.latestVersion)) {
                this.targetVersion = data.latestVersion;
                return true;
            }
            this.emit({ phase: 'idle', progress: 0 });
            return false;
        } catch (error) {
            console.error('Update Check Error:', error);
            this.emit({ phase: 'error', progress: 0, message: (error as Error).message });
            return false;
        }
    }

    async downloadAndInstallUpdate(): Promise<boolean> {
        if (!this.targetVersion) return false;
        
        try {
            this.emit({ phase: 'downloading', progress: 50 }); // Capgo doesn't do chunk progress well natively in standard API without listeners, spoofing a bit
            
            // 1. Download via Capgo's native C++/Swift engine
            const zipUrl = `${UPDATE_SERVER_URL}/update.zip`;
            
            CapacitorUpdater.addListener('download', (info: any) => {
                this.emit({ phase: 'downloading', progress: info.percent });
            });

            const bundle = await CapacitorUpdater.download({
                url: zipUrl,
                version: this.targetVersion,
            });
            
            this.downloadedBundle = bundle;

            // 2. Ready for swap
            this.emit({ phase: 'ready', progress: 100 });
            return true;

        } catch (error) {
            console.error('Update Install Error:', error);
            this.emit({ phase: 'error', progress: 0, message: (error as Error).message });
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
