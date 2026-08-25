import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { UpdateService } from './services/UpdateService';

// Immediately notify Capgo on load to commit new bundles
UpdateService.notifyAppReady().catch(() => {});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
