import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { MovieRow } from './MovieRow';
import { tmdb } from '../utils/tmdb';
import { RowSkeleton } from './Skeleton';
import { CardStack } from './CardStack';
import { CategoryRow } from './CategoryRow';
import { firestoreService } from '../utils/firestore';

export function MovieGrid() {
    const { activeProfile, user, setActiveMovieId, setActiveMediaType, setCurrentView, watchlist, movieRows, setMovieRows, setActiveSeason, setActiveEpisode } = useAppContext();
    const [loading, setLoading] = useState(movieRows.length === 0);
    const [historyItems, setHistoryItems] = useState(() => {
        const saved = localStorage.getItem('apexwatch_cached_history');
        return saved ? JSON.parse(saved) : [];
    });

    const loadContent = async () => {
        // Only show full loading skeleton if we have NO cached rows at all
        if (movieRows.length === 0) setLoading(true);
        try {
            const baseRows = [
                { title: 'Trending Now', fetch: () => tmdb.fetchTrending('all') },
                { title: 'Recently Added', fetch: () => tmdb.fetchNowPlaying() },
                { title: 'Top 10 Movies This Week', fetch: async () => (await tmdb.fetchTrending('movie')).slice(0, 10) },
                { title: 'Top 10 Series This Week', fetch: async () => (await tmdb.fetchTrending('tv')).slice(0, 10) },
                { title: 'Top 10 Anime Series', fetch: async () => (await tmdb.fetchDiscover('tv', { with_genres: 16, with_keywords: '210024' })).slice(0, 10) },
                { title: 'New on ApexWatch', fetch: () => tmdb.fetchUpcoming() },
                { title: 'Most Popular', fetch: () => tmdb.fetchPopular('all') },
                { title: 'Top Hindi Hits', fetch: () => tmdb.fetchDiscover('movie', { with_original_language: 'hi', sort_by: 'vote_count.desc' }) },
                { title: 'South Indian Cinema', fetch: () => tmdb.fetchDiscover('movie', { with_origin_country: 'IN', with_original_language: 'te|ta|kn|ml' }) },
                { title: 'Award-Winning Hits', fetch: () => tmdb.fetchTopRated('movie') },
                { title: 'Binge-Worthy TV Series', fetch: () => tmdb.fetchPopular('tv') },
                {
                    title: 'Top 50 Most Viewed', fetch: async () => {
                        const p1 = await tmdb.fetchPopular('all', 1);
                        const p2 = await tmdb.fetchPopular('all', 2);
                        const p3 = await tmdb.fetchPopular('all', 3);
                        return [...p1, ...p2, ...p3].slice(0, 50);
                    }
                },
                { title: 'Hollywood Blockbusters', fetch: () => tmdb.fetchDiscover('movie', { with_original_language: 'en', with_origin_country: 'US', sort_by: 'revenue.desc' }) },
                { title: 'Family Movie Night', fetch: () => tmdb.fetchByGenre(10751) },
                { title: 'Chilling Horror', fetch: () => tmdb.fetchByGenre(27) },
                { title: 'Action Packed', fetch: () => tmdb.fetchByGenre(28) },
                { title: 'Sci-Fi Universe', fetch: () => tmdb.fetchByGenre(878) },
                { title: 'Comedy Gold', fetch: () => tmdb.fetchByGenre(35) },
                { title: 'Suspense & Mystery', fetch: () => tmdb.fetchByGenre(9648) },
                { title: 'Epic Fantasy', fetch: () => tmdb.fetchByGenre(14) },
                { title: 'Romance Collection', fetch: () => tmdb.fetchByGenre(10749) },
                { title: 'Epic Animation', fetch: () => tmdb.fetchByGenre(16) },
                { title: 'Anime Movies', fetch: () => tmdb.fetchDiscover('movie', { with_genres: 16, with_keywords: '210024' }) },
                { title: 'Reality TV', fetch: () => tmdb.fetchDiscover('tv', { with_genres: 10764 }) },
                { title: 'Gripping Documentaries', fetch: () => tmdb.fetchByGenre(99) }
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

            // Ensure priority rows (Trending, Recent, Top 10s) come first even for logged-in users
            const priorityRows = baseRows.slice(0, 5);
            const secondaryRows = baseRows.slice(5);
            const allRowsToFetch = [...priorityRows, ...personalizedRows, ...secondaryRows];

            // Fetch History for "Continue Watching"
            let history = [];
            if (user && activeProfile) {
                const rawHistory = await firestoreService.getAllWatchProgress(user.uid, activeProfile.id);
                // Filter out completed movies (>95%) but keep all TV shows, and sort by recency
                history = rawHistory
                    .filter(item => (item.type || item.contentType) === 'tv' || item.progress < 95)
                    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
                    .slice(0, 15);
                setHistoryItems(history);
                localStorage.setItem('apexwatch_cached_history', JSON.stringify(history));
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
                    progress: item.progress,
                    season: item.season,
                    episode: item.episode
                }));
                finalRows.unshift({
                    title: 'Continue Watching',
                    movies: historyMovies,
                    isHistory: true
                });

                // Fetch Recommendations for "For You" CardStack
                try {
                    const lastWatched = history[0];
                    const rawRecs = await tmdb.fetchRecommended(lastWatched.id, lastWatched.contentType || 'movie');
                    if (rawRecs && rawRecs.length > 0) {
                        const recs = rawRecs.map(tmdb.formatMovie).filter(Boolean);
                        finalRows.splice(1, 0, {
                            title: 'For You',
                            movies: recs,
                            isForYou: true
                        });
                    }
                } catch (e) { console.error('Error fetching recs', e); }
            }

            // Insert Category Carousels
            finalRows.splice(history.length > 0 ? 2 : 1, 0, {
                title: 'Popular Languages',
                isLanguages: true
            });
            finalRows.splice(history.length > 0 ? 4 : 3, 0, {
                title: 'Popular Genres',
                isGenres: true
            });

            setMovieRows(finalRows);
        } catch (error) {
            console.error('Error loading personalized grid:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
    }, [activeProfile?.id]); // Refresh if profile changes, but run at least once on mount



    if (loading) {
        return (
            <div className="px-6 md:px-20 -mt-20 space-y-12 md:space-y-20 pb-32">
                {[...Array(5)].map((_, i) => <RowSkeleton key={i} />)}
            </div>
        );
    }

    return (
        <div className="relative z-20 px-4 md:px-16 lg:px-20 mt-8 md:mt-12 flex flex-col gap-4 md:gap-6 pb-20">
            {movieRows.map((row, idx) => {
                if (row.isForYou) {
                    return (
                        <div key={`foryou-${idx}`}>
                            <h2 className="text-xl md:text-2xl font-black text-white/90 tracking-wide mb-3 md:mb-4 px-1 md:px-2">
                                {row.title}
                            </h2>
                            <CardStack movies={row.movies} onMovieClick={(id, type) => {
                                setActiveMovieId(id);
                                setActiveMediaType(type);
                                setCurrentView('details');
                            }} />
                        </div>
                    );
                }

                if (row.isLanguages) {
                    return <CategoryRow key={`lang-${idx}`} title={row.title} type="language" />;
                }

                if (row.isGenres) {
                    return <CategoryRow key={`genre-${idx}`} title={row.title} type="genre" />;
                }

                return (
                    <MovieRow
                        key={`${row.title}-${idx}`}
                        title={row.title}
                        movies={row.movies}
                        isContinueWatching={row.isHistory}
                        isTop10={row.title.toLowerCase().includes('top 10')}
                        continueWatchingItems={row.isHistory ? historyItems : null}
                        onMovieClick={(id, type) => {
                            setActiveMovieId(id);
                            setActiveMediaType(type || 'movie');
                            
                            if (row.isHistory) {
                                const item = historyItems.find(h => h.id === id);
                                if (item && item.type === 'tv') {
                                    if (item.season) setActiveSeason(item.season);
                                    if (item.episode) setActiveEpisode(item.episode);
                                }
                                setCurrentView('player');
                            } else {
                                setCurrentView('details');
                            }
                        }}
                    />
                );
            })}
        </div>
    );
}
