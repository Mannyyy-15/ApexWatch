import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

async function boot() {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value: activePath } = await Preferences.get({ key: 'active_webview_path' });
      // If there is an active path, AND we are NOT already running from it
      if (activePath && !window.location.href.includes(activePath)) {
        const result = await Filesystem.getUri({ directory: Directory.Data, path: activePath });
        const nativeUrl = Capacitor.convertFileSrc(result.uri);
        window.location.replace(`${nativeUrl}/index.html`);
        return; // Stop rendering here, wait for redirect
      }
    } catch (e) {
      console.error("Bootloader routing failed", e);
      document.body.innerHTML += '<div style="position:fixed;inset:0;z-index:999999;background:red;color:white;padding:20px;overflow:auto;word-wrap:break-word;"><h3>Bootloader Error</h3><pre>' + e.stack + '</pre></div>';
    }
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

boot();
