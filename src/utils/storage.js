// LocalStorage helper for Demo Mode
const PREFIX = 'apex_watch_';

export const storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(PREFIX + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage Error:', e);
            return defaultValue;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage Error:', e);
        }
    },
    remove: (key) => {
        localStorage.removeItem(PREFIX + key);
    }
};

// Key format helpers
export const getWatchlistKey = (profileId) => `watchlist_${profileId}`;
export const getProgressKey = (profileId) => `progress_${profileId}`;
