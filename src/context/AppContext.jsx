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
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [activeProfile, setActiveProfile] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [libraryTab, setLibraryTab] = useState('Watchlist');

    useEffect(() => {
        // Handle Google Redirect Result
        getRedirectResult(auth).catch((error) => {
            console.error('Redirect Result Error:', error);
        });
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(true);

            if (currentUser) {
                // Fetch or Initialize User Data
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    // Initialize new user (Works for both Email and Google)
                    const newUserData = {
                        email: currentUser.email,
                        createdAt: new Date().toISOString(),
                        subscriptionPlan: 'free'
                    };
                    await setDoc(userDocRef, newUserData);
                    setUserData(newUserData);

                    // Create first profile
                    const name = currentUser.displayName || currentUser.email.split('@')[0];
                    // Use Google photo if available, otherwise random character
                    const avatarUrl = currentUser.photoURL || getRandomAvatar();
                    const profile = await firestoreService.createNewProfile(currentUser.uid, name, false, avatarUrl);
                    
                    setProfiles([profile]);
                    setActiveProfile(profile);
                    setCurrentView('onboarding'); 
                } else {
                    setUserData(userDoc.data());
                    // Fetch Profiles
                    const profilesRef = collection(db, 'users', currentUser.uid, 'profiles');
                    const q = query(profilesRef);
                    onSnapshot(q, (snapshot) => {
                        const profs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setProfiles(profs);
                        
                        // Only show profile selection if no profile is active and it's not a fresh onboarding
                        if (!activeProfile && profs.length > 0 && currentView !== 'onboarding') {
                            setCurrentView('profiles');
                        }
                    });
                }
            } else {
                setUserData(null);
                setProfiles([]);
                setActiveProfile(null);
                // If not logged in, keep them on current view (might be guest)
                // Unless they try to access restricted areas
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, [activeProfile]);

    const login = async (email, password) => {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email, password, name) => {
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        // The rest is handled by onAuthStateChanged!
        return userCredential;
    };

    const loginWithGoogle = async () => {
        try {
            setLoadingAuth(true);
            const result = await signInWithPopup(auth, googleProvider);
            // Result handling is taken care of by onAuthStateChanged
            return result;
        } catch (error) {
            console.error('Google Login Error:', error);
            setLoadingAuth(false);
            // Alert user if there's a specific block
            if (error.code === 'auth/popup-blocked') {
                alert('Please allow popups for this site to sign in with Google.');
            }
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
            loadingAuth, login, signUp, logout, loginWithGoogle,
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
