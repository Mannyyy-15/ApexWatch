import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Play, Chrome } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';

export function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const { login } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [backgroundMovies, setBackgroundMovies] = useState([]);

    useEffect(() => {
        const loadBackground = async () => {
            try {
                const results = await tmdb.fetchTrending();
                const formatted = results.map(tmdb.formatMovie).filter(Boolean);
                setBackgroundMovies(formatted.slice(0, 18));
            } catch (error) {
                console.error('Error loading background movies:', error);
            }
        };
        loadBackground();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        login();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-sm"></div>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 opacity-40 scale-110">
                    {backgroundMovies.map((movie, i) => (
                        <div key={i} className="aspect-[2/3] rounded-lg overflow-hidden grayscale">
                            <img src={movie.poster} alt="" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black z-20"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-30 w-full max-w-md p-8 md:p-12"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-12">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                        <Play size={28} className="fill-black text-black ml-1" />
                    </div>
                    <span className="text-4xl font-black tracking-tighter text-white uppercase">Apex</span>
                </div>

                <div className="glass rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    {/* Subtle Internal Glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
                            {isLogin ? 'Welcome Back' : 'Join the Apex'}
                        </h2>
                        <p className="text-white/40 text-sm font-medium tracking-wide">
                            {isLogin ? 'Your cinematic universe awaits.' : 'The future of streaming starts here.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="relative"
                                >
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                            <input 
                                type="email" 
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                            <input 
                                type="password" 
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-all"
                            />
                        </div>

                        <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                            {isLogin ? 'Sign In' : 'Get Started'}
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black px-4 text-white/40 tracking-widest font-bold">Or continue with</span>
                        </div>
                    </div>

                    <button 
                        onClick={login}
                        className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                    >
                        <Chrome size={20} />
                        Google Account
                    </button>
                </div>

                <p className="text-center mt-8 text-white/40 text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-white font-bold hover:underline"
                    >
                        {isLogin ? 'Create one' : 'Sign in'}
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
