import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { MovieRow } from './MovieRow';
import { tmdb } from '../utils/tmdb';
import { RowSkeleton } from './Skeleton';
import { firestoreService } from '../utils/firestore';

export function MovieGrid() {
    const { activeProfile, user, setActiveMovieId, setCurrentView } = useAppContext();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyItems, setHistoryItems] = useState([]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const baseRows = [
                { title: 'Trending Now', fetch: tmdb.fetchTrending },
                { title: 'Top Rated', fetch: tmdb.fetchTopRated },
                { title: 'Popular Movies', fetch: () => tmdb.fetchPopular('movie') },
                { title: 'Popular TV Shows', fetch: () => tmdb.fetchPopular('tv') }
            ];

            // Add Personalized Rows if interests exist
            const personalizedRows = [];
            if (activeProfile?.preferredGenres?.length > 0) {
                const genreMap = {
                    'Action': 28, 'Sci-Fi': 878, 'Horror': 27, 'Comedy': 35, 
                    'Drama': 18, 'Thriller': 53, 'Animation': 16, 'Documentary': 99, 
                    'Fantasy': 14, 'Romance': 10749, 'Mystery': 9648, 'Crime': 80
                };

                activeProfile.preferredGenres.forEach(genreName => {
                    const id = genreMap[genreName];
                    if (id) {
                        personalizedRows.push({
                            title: `Top ${genreName} Picks`,
                            fetch: () => tmdb.fetchByGenre(id)
                        });
                    }
                });
            }

            const allRowsToFetch = [...personalizedRows, ...baseRows];

            // Fetch History for "Continue Watching"
            let history = [];
            if (user && activeProfile) {
                const rawHistory = await firestoreService.getAllWatchProgress(user.uid, activeProfile.id);
                // Filter out completed ones (>95%) and sort by recency
                history = rawHistory
                    .filter(item => item.progress < 95)
                    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
                    .slice(0, 15);
                setHistoryItems(history);
            }

            const results = await Promise.all(
                allRowsToFetch.map(async (row) => ({
                    title: row.title,
                    movies: (await row.fetch()).map(tmdb.formatMovie).filter(Boolean)
                }))
            );
            
            // Add history as the very first row if it exists
            const finalRows = results.filter(r => r.movies.length > 0);
            if (history.length > 0) {
                const historyMovies = history.map(item => ({
                    id: item.id,
                    title: item.title || 'Unknown Title',
                    poster: item.poster,
                    backdrop: item.backdrop,
                    year: item.year || '',
                    type: item.contentType || 'movie',
                    progress: item.progress
                }));
                finalRows.unshift({
                    title: 'Continue Watching',
                    movies: historyMovies,
                    isHistory: true
                });
            }

            setRows(finalRows);
        } catch (error) {
            console.error('Error loading personalized grid:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
    }, [activeProfile]);

    if (loading) {
        return (
            <div className="px-6 md:px-20 -mt-20 space-y-12 md:space-y-20 pb-32">
                {[...Array(5)].map((_, i) => <RowSkeleton key={i} />)}
            </div>
        );
    }

    return (
        <div className="relative z-20 px-6 md:px-20 -mt-10 md:-mt-20 flex flex-col gap-10 md:gap-16 pb-32">
            {rows.map((row, idx) => (
                <MovieRow 
                    key={`${row.title}-${idx}`} 
                    title={row.title} 
                    movies={row.movies}
                    isContinueWatching={row.isHistory}
                    continueWatchingItems={row.isHistory ? historyItems : null}
                    onMovieClick={(id) => {
                        setActiveMovieId(id);
                        setCurrentView('details');
                    }}
                />
            ))}
        </div>
    );
}
