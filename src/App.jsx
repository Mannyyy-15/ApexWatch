import { NavigationIsland } from './components/NavigationIsland';
import { Hero } from './components/Hero';
import { MovieGrid } from './components/MovieGrid';
import { MovieDetails } from './components/MovieDetails';
import { VideoPlayer } from './components/VideoPlayer';
import { Discover } from './components/Discover';
import { ProfilesSelection } from './components/ProfilesSelection';
import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { CategoryView } from './components/CategoryView';
import { ProfileLibrary } from './components/ProfileLibrary';
import { AppProvider, useAppContext } from './context/AppContext';
import { AnimatePresence, motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTV } from './hooks/useTV';

function MainLayout() {
    const { currentView } = useAppContext();
    const isTV = useTV();
    const [showScrollUp, setShowScrollUp] = useState(false);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setShowScrollUp(container.scrollTop > 200);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Scroll to top on every view change
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    }, [currentView]);

    const scrollToTop = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };
    return (<div className="bg-[#020202] min-h-screen text-white font-sans selection:bg-white selection:text-black overflow-hidden relative">
      <div className="atmosphere"></div>
      <div className="vignette"></div>
      {currentView !== 'auth' && currentView !== 'onboarding' && currentView !== 'profiles' && currentView !== 'details' && currentView !== 'player' && <NavigationIsland />}
      
      <main ref={scrollContainerRef} className="w-full h-screen overflow-y-auto overflow-x-hidden hide-scrollbar pb-24 md:pb-10 scroll-smooth">
        {currentView === 'home' && (<div className="pb-10">
            <Hero />
            <MovieGrid />
          </div>)}
        {currentView === 'movies' && <CategoryView type="movies" title="Movies" />}
        {currentView === 'tv' && <CategoryView type="tv" title="TV Shows" />}
        {currentView === 'anime' && <CategoryView type="anime" title="Anime" />}
        {currentView === 'discover' && <Discover />}
        {currentView === 'library' && <ProfileLibrary />}
      </main>

      {/* Floating Actions */}
      <AnimatePresence>
        {showScrollUp && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            onClick={scrollToTop}
            className="hidden md:flex fixed bottom-10 right-10 z-[60] w-14 h-14 bg-red-600 rounded-full items-center justify-center text-white shadow-[0_0_30px_rgba(229,9,20,0.5)] hover:scale-110 active:scale-95 transition-all group"
          >
            <ArrowUp size={24} className="group-hover:-translate-y-1 transition-transform" />
            <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overlays */}
      <AnimatePresence>
        {currentView === 'auth' && <Auth key="auth"/>}
        {currentView === 'onboarding' && <Onboarding key="onboarding"/>}
        {currentView === 'details' && <MovieDetails key="details"/>}
        {currentView === 'player' && <VideoPlayer key="player"/>}
        {currentView === 'profiles' && <ProfilesSelection key="profiles"/>}
      </AnimatePresence>
    </div>);
}
export default function App() {
    return (<AppProvider>
      <MainLayout />
    </AppProvider>);
}
