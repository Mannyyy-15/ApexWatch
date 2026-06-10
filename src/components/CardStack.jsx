import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Play, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function CardStack({ movies, onMovieClick }) {
    const [cards, setCards] = useState(movies);
    const { addDownload } = useAppContext();

    if (!cards || cards.length === 0) return null;

    const topCard = cards[0];

    const handleSwipe = () => {
        setCards((prev) => prev.slice(1));
    };

    return (
        <div className="relative w-full h-[450px] md:h-[600px] flex items-center justify-center perspective-1000">
            <AnimatePresence>
                {cards.map((movie, index) => {
                    // Only render top 3 cards for performance and visual effect
                    if (index > 2) return null;

                    const isTop = index === 0;
                    
                    return (
                        <Card
                            key={movie.id}
                            movie={movie}
                            index={index}
                            isTop={isTop}
                            onSwipe={handleSwipe}
                            onClick={() => isTop && onMovieClick(movie.id, movie.type)}
                            onAdd={() => addDownload(movie)}
                        />
                    );
                })}
            </AnimatePresence>
            
            {cards.length === 0 && (
                <div className="text-white/50 text-sm">No more recommendations.</div>
            )}
        </div>
    );
}

function Card({ movie, index, isTop, onSwipe, onClick, onAdd }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-10, 10]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    const handleDragEnd = (event, info) => {
        const threshold = 100;
        if (info.offset.x > threshold || info.offset.x < -threshold) {
            onSwipe();
        }
    };

    return (
        <motion.div
            style={{ x, rotate, opacity: isTop ? opacity : 1 }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{
                scale: 1 - index * 0.05,
                y: index * 15,
                x: index * 20,
                opacity: 1 - index * 0.2,
                zIndex: 10 - index,
            }}
            exit={{ x: -300, opacity: 0, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`absolute w-[280px] md:w-[360px] h-[400px] md:h-[520px] rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#111] cursor-pointer`}
            onClick={onClick}
        >
            <img
                src={movie.poster || movie.backdrop}
                alt={movie.title}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            
            {/* Dark Gradient Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none"></div>

            {/* IMDb Badge */}
            {movie.match && (
                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 pointer-events-none">
                    <span className="text-yellow-400 font-black text-[10px]">IMDb</span>
                    <span className="text-white font-bold text-xs">{movie.match.replace('%', '') / 10}</span>
                </div>
            )}

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 w-full p-5 flex justify-between items-end">
                <div className="flex-1 pointer-events-none pr-4">
                    <h2 className="text-white font-black text-2xl md:text-3xl leading-tight mb-2 drop-shadow-lg" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {movie.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-white/70 text-xs font-semibold">
                        <span>{movie.year}</span>
                        <span>•</span>
                        <span>{movie.type === 'tv' ? 'Series' : 'Movie'}</span>
                        {movie.tags?.[0] && (
                            <>
                                <span>•</span>
                                <span>{movie.tags[0]}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Floating Actions */}
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAdd(); }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors pointer-events-auto shadow-lg"
                    >
                        <Plus size={20} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center text-black hover:bg-white/90 transition-colors pointer-events-auto shadow-xl"
                    >
                        <Play size={24} className="ml-1" fill="currentColor" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
