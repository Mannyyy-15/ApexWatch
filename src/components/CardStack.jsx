import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Play, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function CardStack({ movies, onMovieClick }) {
 const [activeIndex, setActiveIndex] = useState(0);
 const { addDownload } = useAppContext();

 if (!movies || movies.length === 0) return null;

 const handleSwipe = (direction) => {
 if (direction === 'left' && activeIndex < movies.length - 1) {
 setActiveIndex(prev => prev + 1);
 } else if (direction === 'right' && activeIndex > 0) {
 setActiveIndex(prev => prev - 1);
 }
 };

 return (
 <div className="relative w-full h-[550px] md:h-[700px] flex items-center justify-center perspective-1000">
 {movies.map((movie, index) => {
 // Render only 1 previous card and 3 upcoming cards for performance
 if (index < activeIndex - 1 || index > activeIndex + 3) return null;

 const isSwiped = index < activeIndex; // Card is behind (swiped away)
 const isTop = index === activeIndex;
 const offset = index - activeIndex;
 
 return (
 <Card
 key={movie.id}
 movie={movie}
 isTop={isTop}
 isSwiped={isSwiped}
 offset={offset}
 onSwipe={handleSwipe}
 onClick={() => isTop && onMovieClick(movie.id, movie.type)}
 onAdd={() => addDownload(movie)}
 />
 );
 })}
 
 {activeIndex >= movies.length && (
 <div className="text-white/50 text-sm">No more recommendations.</div>
 )}
 </div>
 );
}

function Card({ movie, isTop, isSwiped, offset, onSwipe, onClick, onAdd }) {
 const x = useMotionValue(0);
 const rotate = useTransform(x, [-200, 200], [-8, 8]);
 const dragOpacity = useTransform(x, [-200, -50, 0, 50, 200], [0, 1, 1, 1, 0]);

 const handleDragEnd = (event, info) => {
 const threshold = 60;
 if (info.offset.x < -threshold) {
 // Swipe left -> go forward
 onSwipe('left');
 x.set(0); 
 } else if (info.offset.x > threshold) {
 // Swipe right -> go backward
 onSwipe('right');
 x.set(0);
 }
 };

 // Smooth card positioning logic based on state
 let animateProps = {
 x: 0,
 y: 0,
 scale: 1,
 opacity: 1,
 zIndex: 10 - offset,
 };

 if (isSwiped) {
 animateProps = {
 x: -window.innerWidth, // Hide off-screen left
 y: 50,
 scale: 0.8,
 opacity: 0,
 zIndex: 10 - offset,
 };
 } else if (!isTop) {
 animateProps = {
 x: offset * 15,
 y: offset * 25, // Move down so the bottom edge is visible
 scale: 1 - offset * 0.05,
 opacity: 1,
 zIndex: 10 - offset,
 rotate: offset * 3, // Add rotation for a deck effect
 };
 }

 return (
 <motion.div
 style={{ 
 x: isTop ? x : 0, 
 rotate: isTop ? rotate : animateProps.rotate, 
 opacity: isTop ? dragOpacity : animateProps.opacity,
 zIndex: animateProps.zIndex 
 }}
 drag={isTop ? 'x' : false}
 dragConstraints={{ left: 0, right: 0 }}
 dragElastic={0.5}
 onDragEnd={handleDragEnd}
 whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
 initial={{ scale: 0.8, y: 50, opacity: 0 }}
 animate={{
 scale: animateProps.scale,
 y: animateProps.y,
 x: isTop ? 0 : animateProps.x,
 }}
 transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 1 }}
 className={`absolute w-[320px] sm:w-[400px] md:w-[460px] lg:w-[500px] h-[480px] md:h-[600px] rounded-2xl md:rounded-3xl border border-white/10 bg-[#111] cursor-pointer origin-center ${isSwiped ? 'pointer-events-none' : ''}`}
 onClick={onClick}
 >
 <div className="absolute inset-0 rounded-2xl md:rounded-3xl overflow-hidden pointer-events-none">
 <img
 src={movie.poster || movie.backdrop}
 alt={movie.title}
 className="absolute inset-0 w-full h-full object-cover pointer-events-none"
 />
 
 {/* Dark Gradient Overlay */}
 <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-[#000]/60 to-transparent pointer-events-none"></div>
 </div>

 {/* IMDb Badge */}
 {movie.match && (
 <div className="absolute top-4 md:top-6 left-4 md:left-6 bg-black/80 backdrop-blur-md px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-white/10 flex items-center gap-1.5 pointer-events-none z-10">
 <span className="text-yellow-400 font-black text-xs md:text-sm">IMDb</span>
 <span className="text-white font-bold text-sm md:text-base">{movie.match.replace('%', '') / 10}</span>
 </div>
 )}

 {/* Bottom Content */}
 <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-row justify-between items-end gap-4 z-10">
 <div className="flex-1 pointer-events-none">
 <h2 className="text-white font-black text-4xl md:text-6xl leading-[1] mb-2 md:mb-3 drop-shadow-2xl italic tracking-tighter uppercase" style={{ fontFamily: "'Bebas Neue', 'Inter', sans-serif", WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>
 {movie.title}
 </h2>
 <div className="flex flex-wrap items-center gap-1.5 md:gap-2 text-white/70 text-xs md:text-sm font-semibold tracking-wide">
 <span>{movie.year}</span>
 <span>•</span>
 <span>{movie.type === 'tv' ? 'Series' : 'Movie'}</span>
 {movie.tags && movie.tags.length > 0 && (
 <>
 <span>•</span>
 <span>{movie.tags.join(' • ')}</span>
 </>
 )}
 </div>
 </div>

 {/* Floating Actions */}
 <div className="flex flex-col gap-3 self-end mb-1 md:mb-2 z-20 pointer-events-auto">
 <button 
 onClick={(e) => { e.stopPropagation(); onAdd(); }}
 className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-lg cursor-pointer"
 >
 <Plus size={24} />
 </button>
 <button 
 onClick={(e) => { e.stopPropagation(); onClick(); }}
 className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-black hover:bg-white transition-colors cursor-pointer"
 >
 <Play size={28} className="ml-1" fill="currentColor" />
 </button>
 </div>
 </div>
 </motion.div>
 );
}
