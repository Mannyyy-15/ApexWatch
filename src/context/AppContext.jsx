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
    const [movieRows, setMovieRows] = useState([]); // Global cache for Home content
    const [cachedDetails, setCachedDetails] = useState({}); // Global cache for Movie Details

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
            cachedDetails, setCachedDetails
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
