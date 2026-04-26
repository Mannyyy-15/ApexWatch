import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { Plus } from 'lucide-react';
import { firestoreService } from '../utils/firestore';

export function ProfilesSelection() {
    const { profiles, setActiveProfile, setCurrentView, user } = useAppContext();

    const handleSelectProfile = (profile) => {
        setActiveProfile(profile);
        if (profile.hasOnboarded) {
            setCurrentView('home');
        } else {
            setCurrentView('onboarding');
        }
    };

    const handleAddProfile = async () => {
        if (!user) return;
        
        const name = window.prompt("Enter profile name:");
        if (!name || name.trim() === '')
            return;
        const isKid = window.confirm("Is this a kids profile? (Click OK for Yes, Cancel for No)");
        
        try {
            await firestoreService.createNewProfile(user.uid, name.trim(), isKid);
        } catch (error) {
            console.error('Error adding profile:', error);
        }
    };

    return (<div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent opacity-30"></div>
      
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="text-center relative z-10">
        <h1 className="display-text text-5xl md:text-7xl font-black text-white mb-16 tracking-tighter uppercase filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            Who's Watching?
        </h1>
        
        <div className="flex flex-wrap justify-center gap-10 md:gap-14">
          {profiles.map((profile, idx) => (<motion.div 
              key={profile.id} 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -15 }} 
              onClick={() => handleSelectProfile(profile)} 
              className="flex flex-col items-center gap-6 cursor-pointer group"
            >
              <div className="w-28 h-28 md:w-40 md:h-40 rounded-[32px] overflow-hidden border-2 border-white/5 group-hover:border-white transition-all duration-500 shadow-2xl relative group-hover:shadow-[0_0_50px_rgba(255,255,255,0.15)] bg-white/5">
                <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer"/>
                {profile.isKid && (<div className="absolute top-2 right-2 glass px-3 py-1 rounded-lg text-[10px] font-black tracking-widest text-white border-white/20">
                    KIDS
                  </div>)}
              </div>
              <span className="text-white/40 group-hover:text-white transition-all text-xl font-bold tracking-tight">{profile.name}</span>
            </motion.div>))}

          {profiles.length < 5 && (<motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: profiles.length * 0.1 }}
              whileHover={{ y: -15 }} 
              onClick={handleAddProfile} 
              className="flex flex-col items-center gap-6 cursor-pointer group"
            >
              <div className="w-28 h-28 md:w-40 md:h-40 rounded-[32px] border-2 border-white/10 flex items-center justify-center group-hover:border-white group-hover:bg-white/10 transition-all duration-500 glass">
                <Plus size={56} className="text-white/20 group-hover:text-white transition-all duration-500"/>
              </div>
              <span className="text-white/40 group-hover:text-white transition-all text-xl font-bold tracking-tight">Add New</span>
            </motion.div>)}
        </div>

        <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }} 
            whileTap={{ scale: 0.95 }} 
            className="mt-20 px-10 py-3 glass rounded-2xl text-white/40 hover:text-white uppercase tracking-[0.2em] text-xs font-black transition-all border-white/10"
        >
          Manage Profiles
        </motion.button>
      </motion.div>
    </div>);
}
