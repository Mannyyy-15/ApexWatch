import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const LANGUAGES = [
 { id: 'hi', name: 'Hindi', native: 'हिन्दी', color: 'from-[#3A4374]', image: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=500&q=80' },
 { id: 'en', name: 'English', native: 'English', color: 'from-[#8B453E]', image: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=500&q=80' },
 { id: 'ta', name: 'Tamil', native: 'தமிழ்', color: 'from-[#5C3D32]', image: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=500&q=80' },
 { id: 'te', name: 'Telugu', native: 'తెలుగు', color: 'from-[#4A5D23]', image: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=500&q=80' },
 { id: 'ml', name: 'Malayalam', native: 'മലയാളം', color: 'from-[#2C3E50]', image: 'https://images.unsplash.com/photo-1557682260-96773eb01377?w=500&q=80' },
 { id: 'ko', name: 'Korean', native: '한국어', color: 'from-[#6E4E73]', image: 'https://images.unsplash.com/photo-1557683304-673a23048d34?w=500&q=80' },
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

const CHANNELS = [
 { id: 'sparks', name: 'Sparks', color: 'from-[#E50914]', image: 'https://images.unsplash.com/photo-1514826786317-59744fe2a548?w=500&q=80' },
 { id: 'news', name: 'News', color: 'from-[#2563EB]', image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=500&q=80' },
 { id: 'tv', name: 'TV Shows', color: 'from-[#10B981]', image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=500&q=80' },
 { id: 'movies', name: 'Movies', color: 'from-[#F59E0B]', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80' },
 { id: 'sports', name: 'Sports', color: 'from-[#8B5CF6]', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&q=80' },
];

const SPORTS = [
 { id: 'cricket', name: 'Cricket', color: 'from-[#059669]', image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80' },
 { id: 'football', name: 'Football', color: 'from-[#DC2626]', image: 'https://images.unsplash.com/photo-1518605368461-1ee7a5342894?w=500&q=80' },
 { id: 'tennis', name: 'Tennis', color: 'from-[#D97706]', image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=500&q=80' },
 { id: 'kabaddi', name: 'Kabaddi', color: 'from-[#4F46E5]', image: 'https://images.unsplash.com/photo-1565992441121-4367c2967103?w=500&q=80' },
];

export function CategoryRow({ title, type }) {
 const rowRef = useRef(null);
 const [showArrows, setShowArrows] = useState(false);
 const [isAtStart, setIsAtStart] = useState(true);
 const [isAtEnd, setIsAtEnd] = useState(false);
 
 const { setCurrentView, setExploreCategory } = useAppContext();

 const items = type === 'language' ? LANGUAGES : type === 'genre' ? GENRES : type === 'channel' ? CHANNELS : SPORTS;

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
 className="absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-black/50 hover:bg-black/80 text-white p-3 md:p-4 rounded-r-2xl md:rounded-r-3xl backdrop-blur-sm border border-white/10 border-l-0 transition-all cursor-pointer tv-focusable group/btn hidden md:block"
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
 className="absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-black/50 hover:bg-black/80 text-white p-3 md:p-4 rounded-l-2xl md:rounded-l-3xl backdrop-blur-sm border border-white/10 border-r-0 transition-all cursor-pointer tv-focusable group/btn hidden md:block"
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
 className="flex-none w-[240px] md:w-[380px] h-[135px] md:h-[215px] rounded-xl md:rounded-2xl relative cursor-pointer tv-focusable group snap-start transition-all duration-300 md:hover:scale-105 hover:border-white/40 border border-white/5 overflow-hidden"
 >
 {/* Background Color & Image */}
 <div className={`absolute inset-0 ${item.color.replace('from-', 'bg-')} transition-transform duration-700 group-hover:scale-110`}>
 <img
 src={item.image}
 alt={item.name}
 className="w-full h-full object-cover opacity-40 mix-blend-luminosity group-hover:opacity-70 transition-opacity duration-500"
 onError={(e) => {
 e.target.onerror = null;
 e.target.src = 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=500&q=80';
 }}
 />
 <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>
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
