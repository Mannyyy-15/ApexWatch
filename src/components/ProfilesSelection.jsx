import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Plus } from 'lucide-react';
import { firestoreService } from '../utils/firestore';
import { AvatarBuilderModal } from './AvatarBuilderModal';
import React, { useState, useEffect } from 'react';

export function ProfilesSelection() {
 const { profiles, setActiveProfile, setCurrentView, user } = useAppContext();
 const [isBuilderOpen, setIsBuilderOpen] = useState(false);

 useEffect(() => {
    const timer = setTimeout(() => {
      const firstFocusable = document.querySelector('.profiles-container .tv-focusable');
      if (firstFocusable) firstFocusable.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

 const handleSelectProfile = (profile) => {
    sessionStorage.setItem('apexwatch_profile_chosen_session', 'true');
    sessionStorage.setItem('apexwatch_tv_profile_selected', 'true');
    setActiveProfile(profile);
    if (profile.hasOnboarded) {
      setCurrentView('home');
    } else {
      setCurrentView('onboarding');
    }
  };

 const handleAddProfileClick = () => {
 if (!user) return;
 setIsBuilderOpen(true);
 };

 const handleSaveProfile = async (name, isKid, avatarUrl) => {
 try {
 await firestoreService.createNewProfile(user.uid, name, isKid, avatarUrl);
 setIsBuilderOpen(false);
 } catch (error) {
 console.error('Error adding profile:', error);
 }
 };

 return (<div className="profiles-container fixed inset-0 bg-bg-base z-[100] flex flex-col items-center justify-center p-6 overflow-hidden">
 <div className="absolute inset-0 bg-radial-gradient from-accent/5 via-transparent to-transparent opacity-60 pointer-events-none"></div>
 
 <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="text-center relative z-10">
 <h1 className="display-text text-4xl md:text-6xl font-black text-white mb-12 tracking-tighter uppercase filter italic">
 Who's Watching?
 </h1>
 
 <div className="flex flex-wrap justify-center gap-8 md:gap-12">
 {profiles.map((profile, idx) => (<motion.div 
 key={profile.id} 
 initial={{ opacity: 0, scale: 0.85 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: idx * 0.08 }}
 whileHover={{ y: -10 }} 
 onClick={() => handleSelectProfile(profile)} 
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleSelectProfile(profile);
 }}
 tabIndex={0}
 role="button"
 className="flex flex-col items-center gap-4 cursor-pointer group outline-none tv-focusable"
 >
 <div className="w-24 h-24 md:w-36 md:h-36 rounded-[24px] overflow-hidden border border-white/10 group-hover:border-accent group-focus:border-accent transition-all duration-500 shadow-2xl relative bg-white/5">
 <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover group-hover:scale-105 group-focus:scale-105 transition-transform duration-500" referrerPolicy="no-referrer"/>
 {profile.isKid && (<div className="absolute top-2 right-2 bg-accent/20 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black tracking-widest text-white border border-accent/30 shadow-md">
 KIDS
 </div>)}
 </div>
 <span className="text-white/40 group-hover:text-white group-focus:text-white transition-all text-sm md:text-base font-black uppercase tracking-wider">{profile.name}</span>
 </motion.div>))}

 {profiles.length < 5 && (<motion.div 
 initial={{ opacity: 0, scale: 0.85 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ delay: profiles.length * 0.08 }}
 whileHover={{ y: -10 }} 
 onClick={handleAddProfileClick} 
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleAddProfileClick();
 }}
 tabIndex={0}
 role="button"
 className="flex flex-col items-center gap-4 cursor-pointer group outline-none tv-focusable"
 >
 <div className="w-24 h-24 md:w-36 md:h-36 rounded-[24px] border border-white/10 flex items-center justify-center group-hover:border-accent group-hover:bg-accent/5 group-focus:border-accent transition-all duration-500 bg-glass-bg backdrop-blur-xl">
 <Plus size={36} className="text-white/20 group-hover:text-accent transition-all duration-500"/>
 </div>
 <span className="text-white/40 group-hover:text-white transition-all text-sm md:text-base font-black uppercase tracking-wider">Add New</span>
 </motion.div>)}
 </div>

 <motion.button 
 whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }} 
 whileTap={{ scale: 0.98 }} 
 className="mt-16 px-8 py-3.5 bg-glass-bg border border-glass-border hover:border-white/20 rounded-xl text-white/40 hover:text-white uppercase tracking-[0.2em] text-[9px] font-black transition-all cursor-pointer shadow-lg tv-focusable"
 >
 Manage Profiles
 </motion.button>
 </motion.div>

 <AvatarBuilderModal 
 isOpen={isBuilderOpen}
 onClose={() => setIsBuilderOpen(false)}
 onSave={handleSaveProfile}
 />
 </div>);
}
