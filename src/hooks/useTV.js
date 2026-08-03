import { useState, useEffect } from 'react';

export function useTV() {
  const [isTV, setIsTV] = useState(false);

  useEffect(() => {
    const checkTV = () => {
      const ua = navigator.userAgent;
      const tvKeywords = ['TV', 'Android TV', 'Tizen', 'WebOS', 'Viera', 'AppleTV', 'PlayStation', 'Xbox', 'Large Screen', 'FireTV', 'HbbTV', 'AFTB', 'AFTT', 'SMART-TV'];
      const isTVDetected = tvKeywords.some(keyword => ua.includes(keyword)) || 
        (window.matchMedia && window.matchMedia('(max-device-width: 960px) and (orientation: landscape) and (pointer: none)').matches);
      
      setIsTV(isTVDetected);
      
      if (isTVDetected) {
        document.body.classList.add('is-tv');
      } else {
        document.body.classList.remove('is-tv');
      }
    };

    checkTV();
  }, []);

  // Global Spatial Navigation Engine
  useEffect(() => {
    const handleKeyDown = (e) => {
      const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const keys = [...navKeys, 'Enter', ' '];
      
      // Auto-activate TV mode whenever D-Pad arrow keys are used on any platform/screen
      if (navKeys.includes(e.key) && !document.body.classList.contains('is-tv')) {
        document.body.classList.add('is-tv');
        setIsTV(true);
      }

      if (!keys.includes(e.key)) return;

      // If we are typing in an input/textarea, ignore arrow navigation (unless Enter)
      if (document.activeElement && (
        document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable
      )) {
        if (e.key !== 'Enter') return;
      }

      // Determine active view container to prevent leaking focus to covered background elements
      let containerSelector = '';
      if (document.querySelector('.updater-modal-container')) {
        containerSelector = '.updater-modal-container ';
      } else if (document.querySelector('.video-player-container')) {
        containerSelector = '.video-player-container ';
      } else if (document.querySelector('.details-container')) {
        containerSelector = '.details-container ';
      } else if (document.querySelector('.profiles-container')) {
        containerSelector = '.profiles-container ';
      } else if (document.querySelector('.auth-container')) {
        containerSelector = '.auth-container ';
      }

      const focusables = Array.from(document.querySelectorAll(`${containerSelector}.tv-focusable`));
      if (focusables.length === 0) return;

      // Only prevent default if it's an arrow key navigation
      if (navKeys.includes(e.key)) {
        e.preventDefault();
      }

      const activeEl = document.activeElement;
      
      // If active element is not part of the active focusable set, focus the first visible one
      if (!activeEl || !focusables.includes(activeEl)) {
        const visible = focusables.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        if (visible.length > 0) {
          visible[0].focus();
          if (!containerSelector.includes('updater-modal')) {
            visible[0].scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
          }
        }
        return;
      }

      if (e.key === 'Enter') {
        activeEl.click();
        return;
      }

      // Calculate bounding rect of current active element
      const activeRect = activeEl.getBoundingClientRect();
      const activeCenter = {
        x: activeRect.left + activeRect.width / 2,
        y: activeRect.top + activeRect.height / 2
      };

      let candidates = [];

      focusables.forEach(el => {
        if (el === activeEl) return;
        
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return; // Skip invisible elements

        const center = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };

        const dx = center.x - activeCenter.x;
        const dy = center.y - activeCenter.y;

        let isCandidate = false;
        let score = 0;

        // Restrict candidates strictly in key direction and calculate weighted Euclidean distance
        if (e.key === 'ArrowLeft') {
          if (dx < -5) {
            isCandidate = true;
            score = (-dx) + 3.5 * Math.abs(dy);
          }
        } else if (e.key === 'ArrowRight') {
          if (dx > 5) {
            isCandidate = true;
            score = dx + 3.5 * Math.abs(dy);
          }
        } else if (e.key === 'ArrowUp') {
          if (dy < -5) {
            isCandidate = true;
            score = (-dy) + 3.5 * Math.abs(dx);
          }
        } else if (e.key === 'ArrowDown') {
          if (dy > 5) {
            isCandidate = true;
            score = dy + 3.5 * Math.abs(dx);
          }
        }

        if (isCandidate) {
          candidates.push({ el, score });
        }
      });

      if (candidates.length > 0) {
        candidates.sort((a, b) => a.score - b.score);
        const nextEl = candidates[0].el;
        nextEl.focus();

        // Scroll the newly focused element smoothly into the center of the 50-60" screen
        nextEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return isTV;
}

export function useTVBackHandler(onBack) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable);

      const isBackKey = 
        e.key === 'Escape' || 
        e.key === 'GoBack' || 
        e.key === 'BrowserBack' || 
        e.keyCode === 10009 || // Samsung Tizen return key
        e.keyCode === 461 ||   // LG WebOS return key
        e.keyCode === 27 ||    // Escape key
        (e.key === 'Backspace' && !isInput);

      if (isBackKey && !isInput) {
        e.preventDefault();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);
}
