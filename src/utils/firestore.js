import { db } from '../firebase';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs, 
    deleteDoc,
    serverTimestamp 
} from 'firebase/firestore';

// Fallback to LocalStorage for mock user or when Firestore permissions fail
const getStorageKey = (userId, profileId, type) => `apexwatch_${userId}_${profileId}_${type}`;

const localFallback = {
    save: (userId, profileId, type, id, data) => {
        const key = getStorageKey(userId, profileId, type);
        const stored = JSON.parse(localStorage.getItem(key) || '{}');
        stored[id] = { ...data, updatedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(stored));
    },
    get: (userId, profileId, type, id) => {
        const key = getStorageKey(userId, profileId, type);
        const stored = JSON.parse(localStorage.getItem(key) || '{}');
        return id ? stored[id] : Object.entries(stored).map(([id, data]) => ({ id, ...data }));
    },
    remove: (userId, profileId, type, id) => {
        const key = getStorageKey(userId, profileId, type);
        const stored = JSON.parse(localStorage.getItem(key) || '{}');
        delete stored[id];
        localStorage.setItem(key, JSON.stringify(stored));
    }
};

export const firestoreService = {
    // Watch Progress
    saveWatchProgress: async (userId, profileId, contentId, data) => {
        if (userId === 'mock-user') {
            localFallback.save(userId, profileId, 'progress', contentId, data);
            return;
        }
        try {
            const progressRef = doc(db, 'users', userId, 'profiles', profileId, 'watchProgress', contentId);
            await setDoc(progressRef, {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.warn('Firestore Save Error (Progress):', error.message);
            localFallback.save(userId, profileId, 'progress', contentId, data);
        }
    },

    getWatchProgress: async (userId, profileId, contentId) => {
        if (userId === 'mock-user') return localFallback.get(userId, profileId, 'progress', contentId);
        try {
            const progressRef = doc(db, 'users', userId, 'profiles', profileId, 'watchProgress', contentId);
            const snap = await getDoc(progressRef);
            return snap.exists() ? snap.data() : null;
        } catch (error) {
            console.warn('Firestore Get Error (Progress):', error.message);
            return localFallback.get(userId, profileId, 'progress', contentId);
        }
    },

    getAllWatchProgress: async (userId, profileId) => {
        if (userId === 'mock-user') return localFallback.get(userId, profileId, 'progress');
        try {
            const progressRef = collection(db, 'users', userId, 'profiles', profileId, 'watchProgress');
            const snap = await getDocs(progressRef);
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.warn('Firestore GetAll Error (Progress):', error.message);
            return localFallback.get(userId, profileId, 'progress');
        }
    },

    // Watchlist
    addToWatchlist: async (userId, profileId, contentId, contentType) => {
        const data = { contentId, contentType, addedAt: Date.now() };
        if (userId === 'mock-user') {
            localFallback.save(userId, profileId, 'watchlist', contentId, data);
            return;
        }
        try {
            const itemRef = doc(db, 'users', userId, 'profiles', profileId, 'watchlist', contentId);
            await setDoc(itemRef, {
                ...data,
                addedAt: serverTimestamp()
            });
        } catch (error) {
            console.warn('Firestore Save Error (Watchlist):', error.message);
            localFallback.save(userId, profileId, 'watchlist', contentId, data);
        }
    },

    removeFromWatchlist: async (userId, profileId, contentId) => {
        if (userId === 'mock-user') {
            localFallback.remove(userId, profileId, 'watchlist', contentId);
            return;
        }
        try {
            const itemRef = doc(db, 'users', userId, 'profiles', profileId, 'watchlist', contentId);
            await deleteDoc(itemRef);
        } catch (error) {
            console.warn('Firestore Remove Error (Watchlist):', error.message);
            localFallback.remove(userId, profileId, 'watchlist', contentId);
        }
    },

    getWatchlist: async (userId, profileId) => {
        if (userId === 'mock-user') return localFallback.get(userId, profileId, 'watchlist');
        try {
            const watchlistRef = collection(db, 'users', userId, 'profiles', profileId, 'watchlist');
            const snap = await getDocs(watchlistRef);
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.warn('Firestore Get Error (Watchlist):', error.message);
            return localFallback.get(userId, profileId, 'watchlist');
        }
    },

    // User Data & Profiles
    updateUserProfile: async (userId, profileId, data) => {
        if (userId === 'mock-user') return;
        try {
            const profileRef = doc(db, 'users', userId, 'profiles', profileId);
            await updateDoc(profileRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.warn('Firestore Update Error (Profile):', error.message);
        }
    },

    createNewProfile: async (userId, name, isKid) => {
        const profileId = Math.random().toString(36).substr(2, 9);
        const newProfile = {
            name,
            isKid,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`,
            hasOnboarded: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        if (userId === 'mock-user') return { id: profileId, ...newProfile };
        
        try {
            const profileRef = doc(db, 'users', userId, 'profiles', profileId);
            await setDoc(profileRef, {
                ...newProfile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { id: profileId, ...newProfile };
        } catch (error) {
            console.warn('Firestore Create Error (Profile):', error.message);
            return { id: profileId, ...newProfile };
        }
    }
};
