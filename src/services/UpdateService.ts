import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import JSZip from 'jszip';
import pkg from '../../package.json';

const UPDATE_SERVER_URL = 'http://192.168.1.2:8080'; // Local dev server

export interface UpdateProgress {
    phase: 'idle' | 'checking' | 'downloading' | 'extracting' | 'ready' | 'error';
    progress: number; // 0-100
    message?: string;
}

type ProgressCallback = (state: UpdateProgress) => void;

class UpdateServiceClass {
    private onProgress?: ProgressCallback;

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
            
            // Basic semantic version compare
            if (this.isNewerVersion(currentVersion, data.latestVersion)) {
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
        try {
            const res = await fetch(`${UPDATE_SERVER_URL}/version.json?t=${Date.now()}`);
            const data = await res.json();
            const targetVersion = data.latestVersion;
            const zipUrl = `${UPDATE_SERVER_URL}/update.zip?v=${targetVersion}`;

            // 1. Download
            this.emit({ phase: 'downloading', progress: 0 });
            
            // Using standard fetch arrayBuffer as Capacitor Http doesn't support chunk progress well yet 
            // without custom native code, but fetch arrayBuffer is fine for small/medium bundles
            const response = await fetch(zipUrl);
            if (!response.ok) throw new Error('Failed to download update bundle');
            
            const contentLength = response.headers.get('content-length');
            const total = parseInt(contentLength || '0', 10);
            
            let loaded = 0;
            const reader = response.body?.getReader();
            const chunks: Uint8Array[] = [];

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) {
                        chunks.push(value);
                        loaded += value.length;
                        if (total > 0) {
                            this.emit({ phase: 'downloading', progress: Math.round((loaded / total) * 100) });
                        }
                    }
                }
            }
            
            // Concatenate chunks
            const zipBuffer = new Uint8Array(loaded);
            let position = 0;
            for (const chunk of chunks) {
                zipBuffer.set(chunk, position);
                position += chunk.length;
            }

            // 2. Extract
            this.emit({ phase: 'extracting', progress: 0 });
            const jszip = new JSZip();
            const zip = await jszip.loadAsync(zipBuffer);
            
            const targetDir = `updates/v${targetVersion}`;
            
            // Ensure dir exists (clear it if it does)
            try {
                await Filesystem.rmdir({ path: targetDir, directory: Directory.Data, recursive: true });
            } catch (e) { /* ignore */ }
            
            await Filesystem.mkdir({ path: targetDir, directory: Directory.Data, recursive: true });

            const files = Object.values(zip.files).filter(f => !f.dir);
            let extractedCount = 0;

            for (const file of files) {
                // Ensure subdirectories exist
                const parts = file.name.split('/');
                if (parts.length > 1) {
                    const dirPath = parts.slice(0, -1).join('/');
                    try {
                        await Filesystem.mkdir({ path: `${targetDir}/${dirPath}`, directory: Directory.Data, recursive: true });
                    } catch (e) { /* ignore if exists */ }
                }

                // Read file content as base64
                const content = await file.async('base64');
                
                await Filesystem.writeFile({
                    path: `${targetDir}/${file.name}`,
                    data: content,
                    directory: Directory.Data
                });
                
                extractedCount++;
                this.emit({ phase: 'extracting', progress: Math.round((extractedCount / files.length) * 100) });
            }

            // 3. Swap and Save Preferences
            await Preferences.set({
                key: 'active_webview_path',
                value: targetDir
            });

            this.emit({ phase: 'ready', progress: 100 });
            return true;

        } catch (error) {
            console.error('Update Install Error:', error);
            this.emit({ phase: 'error', progress: 0, message: (error as Error).message });
            return false;
        }
    }

    async getActivePath(): Promise<string | null> {
        const { value } = await Preferences.get({ key: 'active_webview_path' });
        return value;
    }

    async clearUpdates(): Promise<void> {
        try {
            await Preferences.remove({ key: 'active_webview_path' });
            await Filesystem.rmdir({ path: 'updates', directory: Directory.Data, recursive: true });
            window.location.href = window.location.origin; // Reload to native bundle
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
