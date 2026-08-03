import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Chrome, X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';

export function Auth() {
 const [isLogin, setIsLogin] = useState(true);
 const { login, signUp, loginWithGoogle, setCurrentView } = useAppContext();
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [name, setName] = useState('');
 const [error, setError] = useState('');
 const [success, setSuccess] = useState('');
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

 useEffect(() => {
 const timer = setTimeout(() => {
 const firstFocusable = document.querySelector('.auth-container .tv-focusable');
 if (firstFocusable) firstFocusable.focus();
 }, 200);
 return () => clearTimeout(timer);
 }, []);

 const handleSubmit = async (e) => {
 e.preventDefault();
 setError('');
 setSuccess('');
 setLoading(true);
 try {
 if (isLogin) {
 await login(email, password);
 } else {
 if (!name.trim()) throw new Error('Please enter your name');
 await signUp(email, password, name);
 }
 setSuccess('Successfully logged in!');
 setTimeout(() => setCurrentView('profiles'), 1200);
 } catch (err) {
 console.error('Auth error:', err);
 setError(err.message.includes('auth/user-not-found') ? 'No account found.' : 
 err.message.includes('auth/wrong-password') ? 'Incorrect password.' :
 err.message.includes('auth/email-already-in-use') ? 'Email already in use.' :
 err.message || 'Authentication failed.');
 setLoading(false);
 }
 };

 const handleGoogleLogin = async () => {
 setError('');
 setSuccess('');
 setLoading(true);
 try {
 await loginWithGoogle();
 setSuccess('Successfully logged in!');
 setTimeout(() => setCurrentView('profiles'), 1200);
 } catch (err) {
 console.error('Google Auth error:', err);
 setError('Google login failed.');
 setLoading(false);
 }
 };

 return (
 <div className="auth-container fixed inset-0 z-[100] bg-bg-base flex items-center justify-center">
 <div className="absolute inset-0 bg-radial-gradient from-accent/5 via-transparent to-transparent opacity-60 pointer-events-none"></div>
 
 {/* Simple Background - Less busy */}
 <div className="absolute inset-0 z-0">
 <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/90 to-bg-base/30 z-10"></div>
 <div className="grid grid-cols-3 md:grid-cols-6 gap-4 opacity-15 scale-105 grayscale">
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
 className="fixed top-8 right-8 z-[110] p-3 text-white/30 hover:text-white hover:scale-105 transition-all group cursor-pointer tv-focusable"
 >
 <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
 </button>

 <motion.div 
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative z-30 w-full max-w-[400px] px-6"
 >
 {/* Minimal Logo */}
 <div className="flex flex-col items-center mb-8">
 <div className="w-12 h-12 rounded-xl overflow-hidden mb-3.5 ">
 <img src="/logo.png" alt="ApexWatch" className="w-full h-full object-cover" />
 </div>
 <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">Apex<span className="text-accent">Watch</span></h1>
 </div>

 <div className="bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[24px] p-6 md:p-8 border border-glass-border hover:border-white/10 transition-colors duration-500">
 <div className="mb-6">
 <h2 className="text-xl font-black text-white mb-1.5 uppercase tracking-tight italic">
 {isLogin ? 'Sign In' : 'Create Account'}
 </h2>
 <p className="text-white/40 text-xs font-semibold">
 {isLogin ? 'Welcome back to your collection.' : 'Join to start building your watchlist.'}
 </p>
 </div>

 <AnimatePresence mode="wait">
 {error && (
 <motion.div 
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="mb-5 text-accent text-[11px] font-bold flex items-center gap-1.5"
 >
 <AlertCircle size={12} />
 {error}
 </motion.div>
 )}
 {success && (
 <motion.div 
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="mb-5 text-green-500 text-[11px] font-bold flex items-center gap-1.5"
 >
 <CheckCircle2 size={12} />
 {success}
 </motion.div>
 )}
 </AnimatePresence>

 <form onSubmit={handleSubmit} className="space-y-3.5">
 {!isLogin && (
 <div className="relative">
 <input 
 type="text" 
 placeholder="Name"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="w-full bg-white/5 border border-glass-border rounded-xl py-3.5 px-4 text-xs font-semibold text-white placeholder-white/25 focus:outline-none focus:border-accent/40 focus:bg-black/50 transition-all tv-focusable"
 />
 </div>
 )}

 <div className="relative">
 <input 
 type="email" 
 placeholder="Email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full bg-white/5 border border-glass-border rounded-xl py-3.5 px-4 text-xs font-semibold text-white placeholder-white/25 focus:outline-none focus:border-accent/40 focus:bg-black/50 transition-all tv-focusable"
 />
 </div>

 <div className="relative">
 <input 
 type="password" 
 placeholder="Password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full bg-white/5 border border-glass-border rounded-xl py-3.5 px-4 text-xs font-semibold text-white placeholder-white/25 focus:outline-none focus:border-accent/40 focus:bg-black/50 transition-all tv-focusable"
 />
 </div>

 <button 
 type="submit" 
 disabled={loading}
 className="w-full bg-accent text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-accent-hover hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer tv-focusable"
 >
 {loading ? <Loader2 className="animate-spin" size={16} /> : (isLogin ? 'Sign In' : 'Create Account')}
 </button>
 </form>

 <div className="relative my-6">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full border-t border-white/5"></div>
 </div>
 <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest">
 <span className="bg-[#0a0a0a] px-3.5 text-white/20">or</span>
 </div>
 </div>

 <button 
 onClick={handleGoogleLogin}
 disabled={loading}
 className="w-full bg-glass-bg border border-glass-border text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-glass-hover hover:border-white/20 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer tv-focusable"
 >
 <Chrome size={16} />
 Continue with Google
 </button>

 <div className="mt-6 text-center">
 <button 
 onClick={() => setIsLogin(!isLogin)}
 className="text-white/40 text-xs font-black uppercase tracking-wider hover:text-white transition-colors cursor-pointer tv-focusable"
 >
 {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 );
}
