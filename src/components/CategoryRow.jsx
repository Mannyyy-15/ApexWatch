import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const LANGUAGES = [
    { id: 'hi', name: 'Hindi', native: 'हिन्दी', color: 'from-[#3A4374]', image: 'https://image.tmdb.org/t/p/w500/1XDDXPXGiI8id7MrUxK36ke7wow.jpg' },
    { id: 'en', name: 'English', native: 'English', color: 'from-[#8B453E]', image: 'https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg' },
    { id: 'ta', name: 'Tamil', native: 'தமிழ்', color: 'from-[#5C3D32]', image: 'https://image.tmdb.org/t/p/w500/e5IdZ1OEWMYxTeu51tI67gXvfpn.jpg' },
    { id: 'te', name: 'Telugu', native: 'తెలుగు', color: 'from-[#4A5D23]', image: 'https://image.tmdb.org/t/p/w500/yF1eOkaYvwiORauRCPWznV9xVvi.jpg' },
    { id: 'ml', name: 'Malayalam', native: 'മലയാളം', color: 'from-[#2C3E50]', image: 'https://image.tmdb.org/t/p/w500/5RkZOvu9FC0A8NypE2BL7oKNOTU.jpg' },
    { id: 'ko', name: 'Korean', native: '한국어', color: 'from-[#6E4E73]', image: 'https://image.tmdb.org/t/p/w500/2meX1nMdScFOoV4370rqHWKmXhY.jpg' },
];

const GENRES = [
    { id: 10749, name: 'Romance', color: 'from-[#B25353]', image: 'https://image.tmdb.org/t/p/w500/l5QgEvlfK6eHPM4YPEk7AArXmh8.jpg' }, 
    { id: 18, name: 'Drama', color: 'from-[#4B7973]', image: 'https://image.tmdb.org/t/p/w500/oPsRr7AfNLw6XaPuMpvkWK0bIUA.jpg' }, 
    { id: 10751, name: 'Family', color: 'from-[#736E4E]', image: 'https://image.tmdb.org/t/p/w500/9Z2uDYXqJrlmePznQQJhL6d92Rq.jpg' }, 
    { id: 28, name: 'Action', color: 'from-[#1A2639]', image: 'https://image.tmdb.org/t/p/w500/vVpEOvdxVBP2aV166j5Xlvb5Cdc.jpg' }, 
    { id: 35, name: 'Comedy', color: 'from-[#D4A373]', image: 'https://image.tmdb.org/t/p/w500/kWSi5N0uVv6E4WkP5X12m8fE8gJ.jpg' }, 
    { id: 27, name: 'Horror', color: 'from-[#2D2D2D]', image: 'https://image.tmdb.org/t/p/w500/4k99kV4R1bbbrsnjR205v91Xbin.jpg' }, 
    { id: 878, name: 'Sci-Fi', color: 'from-[#3A506B]', image: 'https://image.tmdb.org/t/p/w500/6zg7A9ICOthNR2TSXlT51KvXrsA.jpg' }, 
];

export function CategoryRow({ title, type }) {
    const rowRef = useRef(null);
    const [showArrows, setShowArrows] = useState(false);
    const [isAtStart, setIsAtStart] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(false);
    
    const { setCurrentView, setExploreCategory } = useAppContext();

    const items = type === 'language' ? LANGUAGES : GENRES;

    const handleScroll = () => {
        if (!rowRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
        setIsAtStart(scrollLeft <= 10);
        setIsAtEnd(scrollLeft >= scrollWidth - clientWidth - 10);
    };

    const scroll = (direction) => {
        if (rowRef.current) {
            const { clientWidth } = rowRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth + 100 : clientWidth - 100;
            rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const handleCategoryClick = (item) => {
        setExploreCategory({ type, item });
        setCurrentView('explore');
    };

    return (
        <section
            className="relative group/row mb-2 md:mb-4"
            onMouseEnter={() => setShowArrows(true)}
            onMouseLeave={() => setShowArrows(false)}
        >
            <div className="flex items-center justify-between mb-3 md:mb-4 px-1 md:px-2">
                <h2 className="text-xl md:text-2xl font-black text-white/90 tracking-wide">
                    {title}
                </h2>
            </div>

            <div className="relative">
                <AnimatePresence>
                    {showArrows && (
                        <>
                            {!isAtStart && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => scroll('left')}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-black/50 hover:bg-black/80 text-white p-3 md:p-4 rounded-r-2xl md:rounded-r-3xl backdrop-blur-sm border border-white/10 border-l-0 shadow-[10px_0_20px_rgba(0,0,0,0.5)] transition-all cursor-pointer tv-focusable group/btn hidden md:block"
                                >
                                    <ChevronLeft size={24} className="md:w-8 md:h-8 group-hover/btn:-translate-x-1 transition-transform" />
                                </motion.button>
                            )}

                            {!isAtEnd && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => scroll('right')}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-black/50 hover:bg-black/80 text-white p-3 md:p-4 rounded-l-2xl md:rounded-l-3xl backdrop-blur-sm border border-white/10 border-r-0 shadow-[-10px_0_20px_rgba(0,0,0,0.5)] transition-all cursor-pointer tv-focusable group/btn hidden md:block"
                                >
                                    <ChevronRight size={24} className="md:w-8 md:h-8 group-hover/btn:translate-x-1 transition-transform" />
                                </motion.button>
                            )}
                        </>
                    )}
                </AnimatePresence>

                <div
                    ref={rowRef}
                    onScroll={handleScroll}
                    className="flex gap-3 md:gap-5 overflow-x-auto hide-scrollbar pr-10 snap-x snap-mandatory scroll-smooth py-4"
                >
                    {items.map((item, index) => (
                        <div
                            key={item.id}
                            onClick={() => handleCategoryClick(item)}
                            className="flex-none w-[200px] md:w-[280px] h-[110px] md:h-[150px] rounded-xl md:rounded-2xl relative cursor-pointer tv-focusable group snap-start transition-all duration-300 md:hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:border-white/40 border border-white/5 overflow-hidden"
                        >
                            {/* Background Image */}
                            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className={`absolute inset-0 bg-gradient-to-t ${item.color} mix-blend-multiply opacity-80 group-hover:opacity-50 transition-opacity duration-500`}></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 p-4 md:p-5 flex flex-col justify-end pointer-events-none z-10">
                                <div className="transform transition-all duration-500 group-hover:-translate-y-2">
                                    {type === 'language' ? (
                                        <>
                                            <h3 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg tracking-tight uppercase italic">{item.native}</h3>
                                            <p className="text-xs md:text-sm text-white/80 font-bold uppercase tracking-widest">{item.name}</p>
                                        </>
                                    ) : (
                                        <h3 className="text-xl md:text-2xl font-black text-white drop-shadow-lg uppercase tracking-tight italic">{item.name}</h3>
                                    )}
                                </div>
                                
                                {/* Reveal on hover */}
                                <div className="absolute bottom-4 left-4 md:left-5 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-1.5">
                                    Explore <ChevronRight size={12} strokeWidth={4} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
