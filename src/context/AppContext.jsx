import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { firestoreService } from '../utils/firestore';
// import { mockAuth } from '../utils/mockAuth';

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
    const [downloads, setDownloads] = useState([]);

    useEffect(() => {
        // Handle Google Redirect Result
        getRedirectResult(auth).catch((error) => {
            console.error('Redirect Result Error:', error);
        });

        // Initialize history with current view
        window.history.replaceState({ view: currentView, movieId: activeMovieId }, '');

        const handlePopState = (event) => {
            if (event.state) {
                const { view, movieId } = event.state;
                
                // Block going back to auth/profiles if we are already logged in and have a profile
                if (user && activeProfile && (view === 'auth' || view === 'profiles' || view === 'onboarding')) {
                    // Stay on current view if they try to go back to restricted areas
                    window.history.pushState({ view: currentView, movieId: activeMovieId }, '');
                    return;
                }

                setCurrentView(view);
                setActiveMovieId(movieId);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [user, activeProfile]); // Re-bind when auth state changes to update guard logic

    // Sync state changes TO history
    useEffect(() => {
        const currentState = window.history.state;
        if (!currentState || currentState.view !== currentView || currentState.movieId !== activeMovieId) {
            // Don't push state if we are just setting up
            if (loadingAuth) return;

            // Avoid pushing auth view if we are logged in
            if (user && currentView === 'auth') return;

            window.history.pushState({ view: currentView, movieId: activeMovieId }, '');
        }
    }, [currentView, activeMovieId, loadingAuth, user]);

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
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
                await signInWithRedirect(auth, googleProvider);
            } else {
                const result = await signInWithPopup(auth, googleProvider);
                return result;
            }
        } catch (error) {
            console.error('Google Login Error:', error);
            setLoadingAuth(false);
            if (error.code === 'auth/popup-blocked' || error.message.includes('Cross-Origin-Opener-Policy')) {
                await signInWithRedirect(auth, googleProvider);
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
            currentView, setCurrentView,
            activeMovieId, setActiveMovieId,
            activeMediaType, setActiveMediaType,
            user, userData, profiles, setProfiles, activeProfile, setActiveProfile,
            loadingAuth, login, signUp, logout, loginWithGoogle,
            searchQuery, setSearchQuery,
            libraryTab, setLibraryTab,
            activeSeason, setActiveSeason,
            activeEpisode, setActiveEpisode,
            watchlist, toggleWatchlist,
            movieRows, setMovieRows,
            cachedDetails, setCachedDetails,
            downloads, addDownload, removeDownload,
            activeParty, isPartyHost, createWatchParty, joinWatchParty, leaveWatchParty, updatePartyState
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
