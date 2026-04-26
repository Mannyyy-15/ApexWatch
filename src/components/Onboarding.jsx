import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, Languages, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { firestoreService } from '../utils/firestore';

const GENRES = [
    'Action', 'Sci-Fi', 'Horror', 'Comedy', 'Drama', 'Thriller', 
    'Animation', 'Documentary', 'Fantasy', 'Romance', 'Mystery', 'Crime'
];

const LANGUAGES = [
    'English', 'Spanish', 'French', 'Japanese', 'Korean', 'Hindi', 'German'
];

export function Onboarding() {
    const { setCurrentView, activeProfile, user } = useAppContext();
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('English');

    const toggleGenre = (genre) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    const handleComplete = async () => {
        if (!activeProfile || !user) return;
        
        try {
            await firestoreService.updateUserProfile(user.uid, activeProfile.id, {
                hasOnboarded: true,
                preferredGenres: selectedGenres,
                preferredLanguage: selectedLanguage
            });
            setCurrentView('home');
        } catch (error) {
            console.error('Error completing onboarding:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center overflow-y-auto p-6 md:p-12">
            <div className="max-w-4xl w-full">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-6">
                        <Sparkles size={14} className="text-yellow-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Step 2 of 2</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight">Personalize your experience</h1>
                    <p className="text-white/50 text-lg max-w-2xl mx-auto">Select the genres and languages you love to help us curate your perfect cinematic universe.</p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Genres */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            Favorite Genres
                            <span className="text-xs font-medium text-white/30">Select at least 3</span>
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {GENRES.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => toggleGenre(genre)}
                                    className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all border ${
                                        selectedGenres.includes(genre)
                                            ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                            : 'bg-white/5 text-white/60 border-white/10 hover:border-white/30'
                                    }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <Languages size={24} className="text-white/40" />
                                Preferred Language
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => setSelectedLanguage(lang)}
                                        className={`px-6 py-4 rounded-2xl text-sm font-bold transition-all border flex items-center justify-between ${
                                            selectedLanguage === lang
                                                ? 'bg-white/10 text-white border-white/40'
                                                : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                                        }`}
                                    >
                                        {lang}
                                        {selectedLanguage === lang && <Check size={16} className="text-green-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={selectedGenres.length < 3}
                            onClick={handleComplete}
                            className={`w-full py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all ${
                                selectedGenres.length >= 3
                                    ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.3)]'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                            }`}
                        >
                            Finish Setup
                            <ArrowRight size={24} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
