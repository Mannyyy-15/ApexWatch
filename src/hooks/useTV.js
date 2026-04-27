import { useState, useEffect } from 'react';

export function useTV() {
    const [isTV, setIsTV] = useState(false);

    useEffect(() => {
        const checkTV = () => {
            const ua = navigator.userAgent;
            const tvKeywords = ['TV', 'Android TV', 'Tizen', 'WebOS', 'Viera', 'AppleTV', 'PlayStation', 'Xbox', 'Large Screen'];
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

    return isTV;
}

export function useTVBackHandler(onBack) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'GoBack') {
                // Only handle back if we're on a TV or if it's a specific back key
                // preventing desktop backspace from breaking things
                if (document.body.classList.contains('is-tv') || e.key === 'GoBack') {
                    onBack();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBack]);
}
