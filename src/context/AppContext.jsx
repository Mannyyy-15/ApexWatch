import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query } from 'firebase/firestore';

const AppContext = createContext(undefined);

export function AppProvider({ children }) {
    const [currentView, setCurrentView] = useState('home');
    const [activeMovieId, setActiveMovieId] = useState(null);
    const [user, setUser] = useState({ uid: 'mock-user', displayName: 'Developer', email: 'dev@nexus.com' });
    const [userData, setUserData] = useState({ subscriptionPlan: 'premium' });
    const [profiles, setProfiles] = useState([
        { id: 'dev-profile', name: 'Dev Profile', avatarUrl: 'https://ui-avatars.com/api/?name=Dev&background=random', isKid: false, hasOnboarded: true }
    ]);
    const [activeProfile, setActiveProfile] = useState({ id: 'dev-profile', name: 'Dev Profile', avatarUrl: 'https://ui-avatars.com/api/?name=Dev&background=random', isKid: false, hasOnboarded: true });
    const [loadingAuth, setLoadingAuth] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [libraryTab, setLibraryTab] = useState('Watchlist');

    useEffect(() => {
        // Auth listeners disabled as requested
        /*
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            ...
        });
        return () => unsubscribe();
        */
    }, []);

    const login = async () => {
        try {
            setLoadingAuth(true);
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Login Error:', error);
            setLoadingAuth(false);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setActiveProfile(null);
            setCurrentView('auth');
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };

    return (<AppContext.Provider value={{
            currentView, setCurrentView,
            activeMovieId, setActiveMovieId,
            user, userData, profiles, setProfiles, activeProfile, setActiveProfile,
            loadingAuth, login, logout,
            searchQuery, setSearchQuery,
            libraryTab, setLibraryTab
        }}>
      {children}
    </AppContext.Provider>);
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context)
        throw new Error('useAppContext must be used within AppProvider');
    return context;
}
