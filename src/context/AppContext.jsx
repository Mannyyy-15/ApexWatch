import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { firestoreService } from '../utils/firestore';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import pkg from '../../package.json';

const AppContext = createContext(undefined);

const AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Caspian',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Tiberius',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aurelius'
];

const getRandomAvatar = () => AVATARS[Math.floor(Math.random() * AVATARS.length)];

export function AppProvider({ children }) {
    const [currentView, setCurrentView] = useState('home');
    const [activeMovieId, setActiveMovieId] = useState(null);
    const [activeMediaType, setActiveMediaType] = useState('movie');
    // Optimistic Initial State from LocalStorage
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('apexwatch_cached_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [userData, setUserData] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [activeProfile, setActiveProfile] = useState(() => {
        const saved = localStorage.getItem('apexwatch_cached_profile');
        return saved ? JSON.parse(saved) : null;
    });
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [libraryTab, setLibraryTab] = useState('Watchlist');
    const [activeSeason, setActiveSeason] = useState(1);
    const [activeEpisode, setActiveEpisode] = useState(1);
    const [watchlist, setWatchlist] = useState(() => {
        const saved = localStorage.getItem('apexwatch_cached_watchlist');
        return saved ? JSON.parse(saved) : [];
    });
    const [movieRows, setMovieRows] = useState(() => {
        const saved = localStorage.getItem('apexwatch_cached_movie_rows');
        return saved ? JSON.parse(saved) : [];
    }); // Global cache for Home content
    const [cachedDetails, setCachedDetails] = useState({}); // Global cache for Movie Details
    const [categoryCache, setCategoryCache] = useState({}); // Cache for Movies, TV, Anime tabs
    const [discoverCache, setDiscoverCache] = useState(null); // Cache for Discover tab
    const [heroCache, setHeroCache] = useState(null); // Cache for Hero trending movies
    const [downloads, setDownloads] = useState([]);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    // ── View History Stack (for hardware back button) ──────────────────
    // Root views where back should EXIT the app, not go back
    const ROOT_VIEWS = new Set(['home', 'auth', 'profiles', 'onboarding']);
    const viewHistoryRef = useRef(['home']); // internal stack, not state to avoid re-renders

    // Wrapped setCurrentView that also pushes to our internal history stack
    const navigateTo = (view) => {
        setCurrentView(prev => {
            if (prev !== view) {
                viewHistoryRef.current = [...viewHistoryRef.current, view];
            }
            return view;
        });
    };

    // Go back one step in our view history
    const goBack = () => {
        const stack = viewHistoryRef.current;
        if (stack.length <= 1) {
            // Already at root — exit app on Android
            CapApp.exitApp();
            return;
        }
        // Pop the current view off the stack
        const newStack = stack.slice(0, -1);
        viewHistoryRef.current = newStack;
        const previousView = newStack[newStack.length - 1];
        setCurrentView(previousView);
    };

    useEffect(() => {
        // Handle Google Redirect Result
        getRedirectResult(auth).catch((error) => {
            console.error('Redirect Result Error:', error);
        });

        // ── Capacitor Android Hardware Back Button ─────────────────────
        let backListener = null;
        const setupBackHandler = async () => {
            try {
                backListener = await CapApp.addListener('backButton', () => {
                    goBack();
                });
            } catch (e) {
                // Not running in Capacitor (browser) — use popstate instead
                const handlePopState = () => goBack();
                window.addEventListener('popstate', handlePopState);
                return () => window.removeEventListener('popstate', handlePopState);
            }
        };
        setupBackHandler();

        // ── Check For App Updates ──────────────────────────────────────
        const checkForUpdates = async () => {
            if (!Capacitor.isNativePlatform()) return;
            try {
                const response = await fetch(`https://raw.githubusercontent.com/Mannyyy-15/ApexWatch/main/package.json?t=${Date.now()}`);
                const data = await response.json();
                
                const oldParts = pkg.version.split('.').map(Number);
                const newParts = data.version.split('.').map(Number);
                let isNewer = false;
                for (let i = 0; i < 3; i++) {
                    if (newParts[i] > oldParts[i]) { isNewer = true; break; }
                    if (newParts[i] < oldParts[i]) break;
                }
                if (isNewer) setUpdateAvailable(true);
            } catch (error) {}
        };
        setTimeout(checkForUpdates, 3000);

        return () => {
            if (backListener) backListener.remove();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Cache user basic info
                const userToCache = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    photoURL: currentUser.photoURL
                };
                setUser(userToCache);
                localStorage.setItem('apexwatch_cached_user', JSON.stringify(userToCache));

                // Fetch or Initialize User Data
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    // Initialize new user
                    const newUserData = {
                        email: currentUser.email,
                        createdAt: new Date().toISOString(),
                        subscriptionPlan: 'free'
                    };
                    await setDoc(userDocRef, newUserData);
                    setUserData(newUserData);

                    // Create first profile
                    const name = currentUser.displayName || currentUser.email.split('@')[0];
                    const avatarUrl = currentUser.photoURL || getRandomAvatar();
                    const profile = await firestoreService.createNewProfile(currentUser.uid, name, false, avatarUrl);
                    
                    setProfiles([profile]);
                    setActiveProfile(profile);
                    localStorage.setItem('apexwatch_cached_profile', JSON.stringify(profile));
                    setCurrentView('onboarding'); 
                } else {
                    setUserData(userDoc.data());
                    // Fetch Profiles
                    const profilesRef = collection(db, 'users', currentUser.uid, 'profiles');
                    const q = query(profilesRef);
                    onSnapshot(q, (snapshot) => {
                        const profs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setProfiles(profs);
                        
                        // Persistent Profile Logic
                        const savedProfileId = localStorage.getItem(`apexwatch_profile_${currentUser.uid}`);
                        const savedProfile = profs.find(p => p.id === savedProfileId);

                        if (savedProfile && !activeProfile) {
                            setActiveProfile(savedProfile);
                            localStorage.setItem('apexwatch_cached_profile', JSON.stringify(savedProfile));
                            if (currentView === 'profiles') setCurrentView('home');
                        } else if (!activeProfile && profs.length > 0 && currentView !== 'onboarding') {
                            setCurrentView('profiles');
                        }
                    });
                }
            } else {
                setUser(null);
                setUserData(null);
                setProfiles([]);
                setActiveProfile(null);
                localStorage.removeItem('apexwatch_cached_user');
                localStorage.removeItem('apexwatch_cached_profile');
                localStorage.removeItem('apexwatch_cached_watchlist');
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []); // Removed activeProfile dependency to prevent infinite loops

    // Persist active profile changes
    useEffect(() => {
        if (user && activeProfile) {
            localStorage.setItem(`apexwatch_profile_${user.uid}`, activeProfile.id);
            localStorage.setItem('apexwatch_cached_profile', JSON.stringify(activeProfile));
        }
    }, [activeProfile, user]);

    // Cache movie rows for instant re-hydration
    useEffect(() => {
        if (movieRows.length > 0) {
            localStorage.setItem('apexwatch_cached_movie_rows', JSON.stringify(movieRows));
        }
    }, [movieRows]);

    // Cache watchlist changes
    useEffect(() => {
        if (watchlist.length > 0) {
            localStorage.setItem('apexwatch_cached_watchlist', JSON.stringify(watchlist));
        }
    }, [watchlist]);

    const login = async (email, password) => {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email, password, name) => {
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        return userCredential;
    };

    const loginWithGoogle = async () => {
        try {
            setLoadingAuth(true);
            
            if (Capacitor.isNativePlatform()) {
                // NATIVE GOOGLE LOGIN (Capacitor WebView)
                const result = await FirebaseAuthentication.signInWithGoogle();
                const credential = await import('firebase/auth').then(m => m.GoogleAuthProvider.credential(result.credential?.idToken));
                return await import('firebase/auth').then(m => m.signInWithCredential(auth, credential));
            } else {
                // WEB BROWSER LOGIN
                const isMobileBrowser = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobileBrowser) {
                    await signInWithRedirect(auth, googleProvider);
                } else {
                    return await signInWithPopup(auth, googleProvider);
                }
            }
        } catch (error) {
            console.error('Google Login Error:', error);
            setLoadingAuth(false);
            if (Capacitor.isNativePlatform()) {
                alert(`Google Login Failed: ${error.message || error}`);
            }
            if (!Capacitor.isNativePlatform() && (error.code === 'auth/popup-blocked' || error.message?.includes('Cross-Origin-Opener-Policy'))) {
                await signInWithRedirect(auth, googleProvider);
            } else if (!Capacitor.isNativePlatform()) {
                throw error;
            }
        }
    };

    const logout = async () => {
        try {
            if (user) {
                localStorage.removeItem(`apexwatch_profile_${user.uid}`);
            }
            await signOut(auth);
            setActiveProfile(null);
            localStorage.removeItem('apexwatch_cached_user');
            localStorage.removeItem('apexwatch_cached_profile');
            localStorage.removeItem('apexwatch_cached_watchlist');
            localStorage.removeItem('apexwatch_cached_history');
            setCurrentView('auth');
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };

    // Fetch Watchlist on Profile Change
    useEffect(() => {
        const fetchWatchlist = async () => {
            if (user && activeProfile) {
                const items = await firestoreService.getWatchlist(user.uid, activeProfile.id);
                setWatchlist(items);
            } else {
                setWatchlist([]);
            }
        };
        fetchWatchlist();
    }, [user?.uid, activeProfile?.id]); // Use specific IDs to avoid unnecessary refetching

    // Fetch Downloads on Profile Change
    useEffect(() => {
        if (user && activeProfile) {
            const saved = localStorage.getItem(`apexwatch_downloads_${user.uid}_${activeProfile.id}`);
            setDownloads(saved ? JSON.parse(saved) : []);
        } else {
            setDownloads([]);
        }
    }, [user?.uid, activeProfile?.id]);

    const addDownload = (movie) => {
        if (!user || !activeProfile) return;
        setDownloads(prev => {
            if (prev.some(d => d.id === movie.id)) return prev;
            const mockSize = movie.type === 'tv' ? '850 MB' : '1.4 GB';
            const downloadItem = {
                id: movie.id,
                tmdbId: movie.tmdbId || movie.id,
                title: movie.title,
                poster: movie.poster,
                backdrop: movie.backdrop,
                year: movie.year,
                type: movie.type || 'movie',
                downloadedAt: Date.now(),
                size: mockSize,
                quality: '1080p'
            };
            const updated = [...prev, downloadItem];
            localStorage.setItem(`apexwatch_downloads_${user.uid}_${activeProfile.id}`, JSON.stringify(updated));
            return updated;
        });
    };

    const removeDownload = (movieId) => {
        if (!user || !activeProfile) return;
        setDownloads(prev => {
            const updated = prev.filter(d => d.id !== movieId);
            localStorage.setItem(`apexwatch_downloads_${user.uid}_${activeProfile.id}`, JSON.stringify(updated));
            return updated;
        });
    };

    const [activeParty, setActiveParty] = useState(null);
    const [isPartyHost, setIsPartyHost] = useState(false);

    // Watch Party Real-time Listener
    useEffect(() => {
        if (!activeParty || !user || user.uid === 'mock-user') return;
        const code = activeParty.partyCode;
        const partyRef = doc(db, 'watchParties', code);

        const unsubscribe = onSnapshot(partyRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                setActiveParty(data);
            }
        });
        return () => unsubscribe();
    }, [activeParty?.partyCode, user?.uid]);

    const createWatchParty = async (movie) => {
        if (!movie) return;
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const partyRef = doc(db, 'watchParties', code);
        const hostName = activeProfile?.name || user?.displayName || 'Host';
        const hostAvatar = activeProfile?.avatarUrl || user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Host';
        
        const initialParty = {
            partyCode: code,
            hostId: user?.uid || 'mock-host',
            contentId: movie.id,
            contentType: movie.type || 'movie',
            contentTitle: movie.title,
            contentPoster: movie.poster,
            isPlaying: false,
            currentTime: 0,
            members: [{ name: hostName, avatar: hostAvatar, joinedAt: Date.now() }],
            createdAt: Date.now()
        };

        setIsPartyHost(true);
        setActiveParty(initialParty);

        if (user && user.uid !== 'mock-user') {
            try {
                await setDoc(partyRef, initialParty);
            } catch (error) {
                console.warn('Firestore WatchParty Create Error:', error.message);
            }
        }
        
        setActiveMovieId(movie.id);
        setActiveMediaType(movie.type || 'movie');
        setCurrentView('player');
        return code;
    };

    const joinWatchParty = async (code) => {
        if (!code) return false;
        const cleanCode = code.trim().toUpperCase();
        const partyRef = doc(db, 'watchParties', cleanCode);
        const memberName = activeProfile?.name || user?.displayName || 'Guest';
        const memberAvatar = activeProfile?.avatarUrl || user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest';

        let partyData = null;

        if (user && user.uid !== 'mock-user') {
            try {
                const snap = await getDoc(partyRef);
                if (snap.exists()) {
                    partyData = snap.data();
                    const updatedMembers = [...(partyData.members || [])];
                    if (!updatedMembers.some(m => m.name === memberName)) {
                        updatedMembers.push({ name: memberName, avatar: memberAvatar, joinedAt: Date.now() });
                        await setDoc(partyRef, { members: updatedMembers }, { merge: true });
                    }
                }
            } catch (error) {
                console.warn('Firestore WatchParty Join Error:', error.message);
            }
        }

        if (!partyData) {
            partyData = {
                partyCode: cleanCode,
                hostId: 'simulated-host',
                contentId: activeMovieId || '273240',
                contentType: activeMediaType || 'tv',
                contentTitle: 'Off Campus',
                contentPoster: '',
                isPlaying: false,
                currentTime: 0,
                members: [
                    { name: 'Host', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Host', joinedAt: Date.now() - 10000 },
                    { name: memberName, avatar: memberAvatar, joinedAt: Date.now() }
                ]
            };
        }

        setIsPartyHost(partyData.hostId === (user?.uid || 'mock-host'));
        setActiveParty(partyData);
        setActiveMovieId(partyData.contentId);
        setActiveMediaType(partyData.contentType);
        setCurrentView('player');
        return true;
    };

    const leaveWatchParty = async () => {
        if (activeParty) {
            const cleanCode = activeParty.partyCode;
            const partyRef = doc(db, 'watchParties', cleanCode);
            const memberName = activeProfile?.name || user?.displayName || 'Guest';

            if (user && user.uid !== 'mock-user') {
                try {
                    const snap = await getDoc(partyRef);
                    if (snap.exists()) {
                        const partyData = snap.data();
                        const updatedMembers = (partyData.members || []).filter(m => m.name !== memberName);
                        await setDoc(partyRef, { members: updatedMembers }, { merge: true });
                    }
                } catch (error) {
                    console.warn('Firestore WatchParty Leave Error:', error.message);
                }
            }
        }
        setActiveParty(null);
        setIsPartyHost(false);
        setCurrentView('home');
    };

    const updatePartyState = async (fields) => {
        if (!activeParty) return;
        const code = activeParty.partyCode;
        const partyRef = doc(db, 'watchParties', code);
        
        setActiveParty(prev => prev ? { ...prev, ...fields } : null);

        if (user && user.uid !== 'mock-user') {
            try {
                await setDoc(partyRef, fields, { merge: true });
            } catch (error) {
                // Ignore silent warnings
            }
        }
    };

    const toggleWatchlist = async (movie) => {
        if (!user || !activeProfile) return;
        
        const isInList = watchlist.some(item => item.contentId === movie.id);
        if (isInList) {
            await firestoreService.removeFromWatchlist(user.uid, activeProfile.id, movie.id);
            setWatchlist(prev => prev.filter(item => item.contentId !== movie.id));
        } else {
            const watchlistItem = {
                contentId: movie.id,
                contentType: movie.type || 'movie',
                title: movie.title,
                poster: movie.poster,
                year: movie.year,
                addedAt: Date.now()
            };
            await firestoreService.addToWatchlist(user.uid, activeProfile.id, movie.id, movie.type || 'movie');
            setWatchlist(prev => [...prev, watchlistItem]);
        }
    };

    return (<AppContext.Provider value={{
            currentView, setCurrentView: navigateTo,
            goBack,
            activeMovieId, setActiveMovieId,
            activeMediaType, setActiveMediaType,
            user, userData, profiles, setProfiles, activeProfile, setActiveProfile,
            loadingAuth, login, signUp, logout, loginWithGoogle,
            searchQuery, setSearchQuery,
            libraryTab, setLibraryTab,
            activeSeason, setActiveSeason,
            activeEpisode, setActiveEpisode,
            watchlist, setWatchlist,
            movieRows, setMovieRows,
            cachedDetails, setCachedDetails,
            categoryCache, setCategoryCache,
            discoverCache, setDiscoverCache,
            heroCache, setHeroCache,
            downloads, addDownload, removeDownload,
            activeParty, isPartyHost, createWatchParty, joinWatchParty, leaveWatchParty, updatePartyState,
            updateAvailable
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
