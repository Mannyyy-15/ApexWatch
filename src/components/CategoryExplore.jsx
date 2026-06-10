import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { tmdb } from '../utils/tmdb';
import { MovieRow } from './MovieRow';
import { RowSkeleton } from './Skeleton';

export function CategoryExplore() {
    const { 
        exploreCategory, 
        setCurrentView, 
        setActiveMovieId, 
        setActiveMediaType,
        setActiveSeason,
        setActiveEpisode
    } = useAppContext();
    
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!exploreCategory) {
            setCurrentView('home');
            return;
        }

        const fetchCategoryContent = async () => {
            setLoading(true);
            try {
                const { type, item } = exploreCategory;
                const newRows = [];

                // Base params depending on if it's language or genre
                const baseParams = type === 'language' 
                    ? { with_original_language: item.id }
                    : { with_genres: item.id };

                // 1. Trending / Popular
                const popularMovies = await tmdb.fetchDiscover('movie', { ...baseParams, sort_by: 'popularity.desc' });
                if (popularMovies.length > 0) {
                    newRows.push({ title: 'Trending Movies', movies: popularMovies.map(tmdb.formatMovie).filter(Boolean) });
                }

                const popularTV = await tmdb.fetchDiscover('tv', { ...baseParams, sort_by: 'popularity.desc' });
                if (popularTV.length > 0) {
                    newRows.push({ title: 'Trending Series', movies: popularTV.map(tmdb.formatMovie).filter(Boolean) });
                }

                // 2. Top Rated
                const topRatedMovies = await tmdb.fetchDiscover('movie', { ...baseParams, sort_by: 'vote_average.desc', 'vote_count.gte': 300 });
                if (topRatedMovies.length > 0) {
                    newRows.push({ title: 'Critically Acclaimed', movies: topRatedMovies.map(tmdb.formatMovie).filter(Boolean) });
                }

                // 3. Action / Thriller within this category
                // We won't filter by action if the category IS action
                if (type === 'language' || item.id !== 28) {
                    const actionMovies = await tmdb.fetchDiscover('movie', { ...baseParams, with_genres: '28', sort_by: 'popularity.desc' });
                    if (actionMovies.length > 0) {
                        newRows.push({ title: 'Action Packed', movies: actionMovies.map(tmdb.formatMovie).filter(Boolean) });
                    }
                }

                // 4. Romance / Drama
                if (type === 'language' || (item.id !== 10749 && item.id !== 18)) {
                    const dramaMovies = await tmdb.fetchDiscover('movie', { ...baseParams, with_genres: '18', sort_by: 'popularity.desc' });
                    if (dramaMovies.length > 0) {
                        newRows.push({ title: 'Emotional Dramas', movies: dramaMovies.map(tmdb.formatMovie).filter(Boolean) });
                    }
                }

                setRows(newRows);
            } catch (error) {
                console.error('Error fetching category data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryContent();
    }, [exploreCategory, setCurrentView]);

    if (!exploreCategory) return null;

    return (
        <div className="min-h-screen bg-[#050505] pt-24 pb-20">
            {/* Header */}
            <div className="px-6 md:px-20 mb-8 flex items-center gap-4 sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-md py-4">
                <button 
                    onClick={() => setCurrentView('home')}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                    <ChevronLeft size={24} className="text-white" />
                </button>
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider drop-shadow-lg" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {exploreCategory.type === 'language' ? exploreCategory.item.native : exploreCategory.item.name}
                    </h1>
                    <p className="text-white/60 font-medium tracking-wide">
                        {exploreCategory.type === 'language' ? `Explore all ${exploreCategory.item.name} content` : `Explore ${exploreCategory.item.name} favorites`}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="px-6 md:px-20 space-y-12 md:space-y-20">
                    {[...Array(4)].map((_, i) => <RowSkeleton key={i} />)}
                </div>
            ) : (
                <div className="relative z-20 px-4 md:px-16 lg:px-20 flex flex-col gap-10 md:gap-14">
                    {rows.map((row, idx) => (
                        <MovieRow
                            key={`${row.title}-${idx}`}
                            title={row.title}
                            movies={row.movies}
                            onMovieClick={(id, mediaType) => {
                                setActiveMovieId(id);
                                setActiveMediaType(mediaType || 'movie');
                                setCurrentView('details');
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
