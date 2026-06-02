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
    const [selectedLanguages, setSelectedLanguages] = useState(['English']);

    const toggleGenre = (genre) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    const toggleLanguage = (lang) => {
        if (selectedLanguages.includes(lang)) {
            if (selectedLanguages.length > 1) {
                setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
            }
        } else {
            setSelectedLanguages([...selectedLanguages, lang]);
        }
    };

    const handleComplete = async () => {
        if (!activeProfile || !user) return;
        
        try {
            await firestoreService.updateUserProfile(user.uid, activeProfile.id, {
                hasOnboarded: true,
                preferredGenres: selectedGenres,
                preferredLanguages: selectedLanguages
            });
            setCurrentView('home');
        } catch (error) {
            console.error('Error completing onboarding:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-bg-base flex items-center justify-center overflow-y-auto p-6 md:p-12">
            <div className="absolute inset-0 bg-radial-gradient from-accent/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
            
            <div className="max-w-4xl w-full relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/5 border border-glass-border rounded-full mb-5">
                        <Sparkles size={12} className="text-yellow-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Step 2 of 2</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight italic">Personalize your feed</h1>
                    <p className="text-white/40 text-sm md:text-base max-w-xl mx-auto">Select your preferred genres and languages to curate your cinematic universe.</p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-10">
                    {/* Genres */}
                    <div className="space-y-5">
                        <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                            Favorite Genres
                            <span className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Pick at least 3</span>
                        </h3>
                        <div className="flex flex-wrap gap-2.5">
                            {GENRES.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => toggleGenre(genre)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border cursor-pointer ${
                                        selectedGenres.includes(genre)
                                            ? 'bg-accent text-white border-accent shadow-[0_0_20px_rgba(229,9,20,0.3)]'
                                            : 'bg-glass-bg text-white/50 border-glass-border hover:border-white/20 hover:bg-glass-hover'
                                    }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language */}
                    <div className="space-y-6">
                        <div className="space-y-5">
                            <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                                <Languages size={18} className="text-white/40" />
                                Preferred Language
                            </h3>
                            <div className="grid grid-cols-2 gap-2.5">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => toggleLanguage(lang)}
                                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-between cursor-pointer ${
                                            selectedLanguages.includes(lang)
                                                ? 'bg-accent/15 text-white border-accent/40 shadow-[0_0_20px_rgba(229,9,20,0.15)]'
                                                : 'bg-glass-bg text-white/40 border-glass-border hover:border-white/20 hover:bg-glass-hover'
                                        }`}
                                    >
                                        {lang}
                                        {selectedLanguages.includes(lang) && <Check size={14} className="text-accent" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: selectedGenres.length >= 3 ? 1.02 : 1 }}
                            whileTap={{ scale: selectedGenres.length >= 3 ? 0.98 : 1 }}
                            disabled={selectedGenres.length < 3}
                            onClick={handleComplete}
                            className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2.5 transition-all uppercase tracking-widest cursor-pointer ${
                                selectedGenres.length >= 3
                                    ? 'bg-accent text-white shadow-[0_0_30px_rgba(229,9,20,0.4)] hover:bg-accent-hover'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                            }`}
                        >
                            Finish Setup
                            <ArrowRight size={18} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}
