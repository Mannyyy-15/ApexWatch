import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Chrome, X, AlertCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';

export function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const { login, signUp, loginWithGoogle, setCurrentView } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [backgroundMovies, setBackgroundMovies] = useState([]);

    useEffect(() => {
        const loadBackground = async () => {
            try {
                const results = await tmdb.fetchTrending();
                const formatted = results.map(tmdb.formatMovie).filter(Boolean);
                setBackgroundMovies(formatted.slice(0, 12));
            } catch (error) {
                console.error('Error loading background movies:', error);
            }
        };
        loadBackground();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                if (!name.trim()) throw new Error('Please enter your name');
                await signUp(email, password, name);
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message.includes('auth/user-not-found') ? 'No account found.' : 
                  err.message.includes('auth/wrong-password') ? 'Incorrect password.' :
                  err.message.includes('auth/email-already-in-use') ? 'Email already in use.' :
                  err.message || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center">
            {/* Simple Background - Less busy */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-[#050505]/40 z-10"></div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4 opacity-20 scale-105 grayscale">
                    {backgroundMovies.map((movie, i) => (
                        <div key={i} className="aspect-[2/3] rounded-xl overflow-hidden">
                            <img src={movie.poster} alt="" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Clean Close Button */}
            <button 
                onClick={() => setCurrentView('home')}
                className="fixed top-10 right-10 z-[110] p-4 text-white/30 hover:text-white transition-all group"
            >
                <X size={32} className="group-hover:scale-110 transition-transform" />
            </button>

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-30 w-full max-w-[440px] px-6"
            >
                {/* Minimal Logo */}
                <div className="flex flex-col items-center mb-12">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden mb-4 shadow-[0_0_40px_rgba(229,9,20,0.2)]">
                        <img src="/logo.png" alt="ApexWatch" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white uppercase italic">Apex<span className="text-red-600">Watch</span></h1>
                </div>

                <div className="bg-[#0f0f0f]/80 backdrop-blur-2xl rounded-[32px] p-8 md:p-10 border border-white/5 shadow-2xl">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </h2>
                        <p className="text-white/40 text-sm">
                            {isLogin ? 'Welcome back to your collection.' : 'Join to start building your watchlist.'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 text-red-500 text-xs font-semibold flex items-center gap-2"
                            >
                                <AlertCircle size={14} />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition-all text-sm"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <input 
                                type="email" 
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition-all text-sm"
                            />
                        </div>

                        <div className="relative">
                            <input 
                                type="password" 
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 text-white placeholder-white/20 focus:outline-none focus:border-white/10 transition-all text-sm"
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                            <span className="bg-[#121212] px-4 text-white/20">or</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => loginWithGoogle()}
                        disabled={loading}
                        className="w-full bg-white/5 border border-white/5 text-white py-4 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-sm"
                    >
                        <Chrome size={18} />
                        Continue with Google
                    </button>

                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-white/40 text-sm hover:text-white transition-colors"
                        >
                            {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
