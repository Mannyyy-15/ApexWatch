import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import { MovieRow } from './MovieRow';
import { tmdb } from '../utils/tmdb';
import { RowSkeleton } from './Skeleton';
import { CardStack } from './CardStack';
import { CategoryRow } from './CategoryRow';
import { firestoreService } from '../utils/firestore';
import { Virtuoso } from 'react-virtuoso';

export function MovieGrid() {
 const { activeProfile, user, setActiveMovieId, setActiveMediaType, setCurrentView, watchlist, movieRows, setMovieRows, setActiveSeason, setActiveEpisode } = useAppContext();
 const [loading, setLoading] = useState(movieRows.length === 0);
 const [historyItems, setHistoryItems] = useState(() => {
 const saved = localStorage.getItem('apexwatch_cached_history');
 return saved ? JSON.parse(saved) : [];
 });
 const [scrollParent, setScrollParent] = useState(null);

 useEffect(() => {
   setScrollParent(document.querySelector('main'));
 }, []);

 const loadContent = async () => {
    // Only show full loading skeleton if we have NO cached rows at all
    if (movieRows.length === 0) setLoading(true);
    try {
      // ── Netflix/Hotstar-Grade Smart Categorization Engine ──────────
      const hour = new Date().getHours();
      const isLateNight = hour >= 22 || hour < 5;
      const isEvening = hour >= 17 && hour < 22;
      const isWeekend = [0, 6].includes(new Date().getDay());

      const baseRows = [
        { title: '🔥 Trending Now', fetch: () => tmdb.fetchTrending('all') },
        { title: 'Recently Added', fetch: () => tmdb.fetchNowPlaying() },
        { title: 'Top 10 Movies in India This Week', fetch: async () => (await tmdb.fetchTrending('movie')).slice(0, 10) },
        { title: 'Top 10 TV Shows in India This Week', fetch: async () => (await tmdb.fetchTrending('tv')).slice(0, 10) },
        { title: 'New on ApexWatch', fetch: () => tmdb.fetchUpcoming() },
        { title: 'Most Popular Right Now', fetch: () => tmdb.fetchPopular('all') },
      ];

      // ── Smart Time-of-Day Rows ──────────────────────────────────
      if (isLateNight) {
        baseRows.push(
          { title: '🌙 Late Night Thrillers', fetch: () => tmdb.fetchByGenre(53) },
          { title: '👻 Midnight Horror', fetch: () => tmdb.fetchByGenre(27) },
          { title: 'Psychological Mind-Benders', fetch: () => tmdb.fetchDiscover('movie', { with_genres: '53,9648', sort_by: 'vote_average.desc', 'vote_count.gte': 500 }) }
        );
      } else if (isEvening) {
        baseRows.push(
          { title: '🍿 Tonight\'s Perfect Watch', fetch: () => tmdb.fetchDiscover('movie', { sort_by: 'popularity.desc', 'vote_average.gte': 7 }) },
          { title: 'Binge-worthy Series Tonight', fetch: () => tmdb.fetchDiscover('tv', { sort_by: 'popularity.desc', 'vote_average.gte': 7.5 }) }
        );
      }

      if (isWeekend) {
        baseRows.push(
          { title: '🎉 Weekend Blockbusters', fetch: () => tmdb.fetchDiscover('movie', { sort_by: 'revenue.desc', with_original_language: 'en' }) },
          { title: 'Family Movie Marathon', fetch: () => tmdb.fetchByGenre(10751) }
        );
      }

      // ── Regional India Content (Hotstar-Style) ──────────────────
      const indianRows = [
        { title: '🇮🇳 Bollywood Blockbusters', fetch: () => tmdb.fetchDiscover('movie', { with_original_language: 'hi', sort_by: 'vote_count.desc' }) },
        { title: 'Hindi TV Hits', fetch: () => tmdb.fetchDiscover('tv', { with_original_language: 'hi', sort_by: 'popularity.desc' }) },
        { title: 'South Indian Cinema', fetch: () => tmdb.fetchDiscover('movie', { with_origin_country: 'IN', with_original_language: 'te|ta|kn|ml' }) },
        { title: 'Tamil Blockbusters', fetch: () => tmdb.fetchDiscover('movie', { with_original_language: 'ta', sort_by: 'popularity.desc' }) },
        { title: 'Telugu Hits', fetch: () => tmdb.fetchDiscover('movie', { with_original_language: 'te', sort_by: 'popularity.desc' }) },
      ];

      // ── Genre Deep Dives (Netflix-Style) ────────────────────────
      const genreRows = [
        { title: '💥 Action Packed', fetch: () => tmdb.fetchByGenre(28) },
        { title: '😂 Comedy Gold', fetch: () => tmdb.fetchByGenre(35) },
        { title: '💖 Romance Collection', fetch: () => tmdb.fetchByGenre(10749) },
        { title: '🎭 Award-Winning Dramas', fetch: () => tmdb.fetchDiscover('movie', { with_genres: 18, sort_by: 'vote_average.desc', 'vote_count.gte': 1000 }) },
        { title: '🔮 Sci-Fi & Fantasy', fetch: () => tmdb.fetchDiscover('movie', { with_genres: '878,14', sort_by: 'popularity.desc' }) },
        { title: '🕵️ Crime & Mystery', fetch: () => tmdb.fetchDiscover('movie', { with_genres: '80,9648', sort_by: 'popularity.desc' }) },
        { title: '🎬 Critically Acclaimed', fetch: () => tmdb.fetchTopRated('movie') },
        { title: '📺 Binge-Worthy TV Series', fetch: () => tmdb.fetchPopular('tv') },
        { title: 'Epic Animation', fetch: () => tmdb.fetchByGenre(16) },
        { title: 'Gripping Documentaries', fetch: () => tmdb.fetchByGenre(99) },
      ];

      // ── International Content (Netflix Global Catalog) ──────────
      const globalRows = [
        { title: '🇺🇸 Hollywood Blockbusters', fetch: () => tmdb.fetchDiscover('movie', { with_original_language: 'en', with_origin_country: 'US', sort_by: 'revenue.desc' }) },
        { title: '🇰🇷 Korean Dramas', fetch: () => tmdb.fetchDiscover('tv', { with_original_language: 'ko', sort_by: 'popularity.desc' }) },
        { title: '🇰🇷 Korean Movies', fetch: () => tmdb.fetchDiscover('movie', { with_original_language: 'ko', sort_by: 'vote_average.desc', 'vote_count.gte': 200 }) },
        { title: '🇯🇵 Anime Series', fetch: async () => (await tmdb.fetchDiscover('tv', { with_genres: 16, with_keywords: '210024' })).slice(0, 10) },
        { title: '🇯🇵 Anime Movies', fetch: () => tmdb.fetchDiscover('movie', { with_genres: 16, with_keywords: '210024' }) },
        { title: '🇪🇸 Spanish Language Hits', fetch: () => tmdb.fetchDiscover('movie', { with_original_language: 'es', sort_by: 'popularity.desc' }) },
        { title: '🇹🇷 Turkish Series', fetch: () => tmdb.fetchDiscover('tv', { with_original_language: 'tr', sort_by: 'popularity.desc' }) },
      ];

      // ── Mood & Vibe Rows ────────────────────────────────────────
      const vibeRows = [
        { title: '😢 Emotional & Moving', fetch: () => tmdb.fetchDiscover('movie', { with_genres: '18,10749', sort_by: 'vote_average.desc', 'vote_count.gte': 800 }) },
        { title: '🤯 Mind-Bending Plots', fetch: () => tmdb.fetchDiscover('movie', { with_genres: '878,53', sort_by: 'vote_average.desc', 'vote_count.gte': 500 }) },
        { title: '⚔️ Epic War & History', fetch: () => tmdb.fetchDiscover('movie', { with_genres: '10752,36', sort_by: 'popularity.desc' }) },
        { title: 'Reality & Competition TV', fetch: () => tmdb.fetchDiscover('tv', { with_genres: 10764, sort_by: 'popularity.desc' }) },
        { title: 'Based on True Events', fetch: () => tmdb.fetchDiscover('movie', { with_keywords: '9672', sort_by: 'vote_average.desc', 'vote_count.gte': 300 }) },
      ];

      // ── Volume Rows ─────────────────────────────────────────────
      const volumeRows = [
        {
          title: 'Top 50 Most Watched', fetch: async () => {
            const p1 = await tmdb.fetchPopular('all', 1);
            const p2 = await tmdb.fetchPopular('all', 2);
            return [...p1, ...p2].slice(0, 40);
          }
        },
        { title: 'Hidden Gems', fetch: () => tmdb.fetchDiscover('movie', { sort_by: 'vote_average.desc', 'vote_count.gte': 200, 'vote_count.lte': 2000, 'vote_average.gte': 7.5 }) },
        { title: 'Underrated TV Shows', fetch: () => tmdb.fetchDiscover('tv', { sort_by: 'vote_average.desc', 'vote_count.gte': 100, 'vote_count.lte': 1500, 'vote_average.gte': 7.5 }) },
      ];

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
              title: `🎯 Top ${genreName} Picks for You`,
              fetch: () => tmdb.fetchByGenre(id)
            });
          }
        });
      }

      const priorityRows = baseRows.slice(0, 6);
      // Smart interleaving: personalized → indian → genres → global → vibes → volume
      const secondaryRows = [
        ...personalizedRows,
        ...baseRows.slice(6),
        ...indianRows,
        ...genreRows,
        ...globalRows,
        ...vibeRows,
        ...volumeRows,
      ];

      // Fetch History for "Continue Watching"
      let history = [];
      if (user && activeProfile) {
        const rawHistory = await firestoreService.getAllWatchProgress(user.uid, activeProfile.id);
        history = rawHistory
          .filter(item => (item.type || item.contentType) === 'tv' || item.progress < 95)
          .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
          .slice(0, 15);
        setHistoryItems(history);
        localStorage.setItem('apexwatch_cached_history', JSON.stringify(history));
      }

      // Priority Batch Fetch
      const priorityResults = await Promise.all(
        priorityRows.map(async (row) => ({
          title: row.title,
          movies: (await row.fetch()).map(tmdb.formatMovie).filter(Boolean)
        }))
      );

      // Build initial rows structure
      const initialFinalRows = priorityResults.filter(r => r.movies.length > 0);
      if (history.length > 0) {
        const historyMovies = history.map(item => {
          let p = item.progress || 0;
          if (!p && item.durationSeconds > 0) {
            p = (item.progressSeconds / item.durationSeconds) * 100;
          }
          return {
            id: item.id,
            title: item.title || 'Unknown Title',
            poster: item.poster,
            backdrop: item.backdrop,
            year: item.year || '',
            type: item.contentType || 'movie',
            progress: p,
            season: item.season,
            episode: item.episode
          };
        });
        initialFinalRows.unshift({
          title: 'Continue Watching',
          movies: historyMovies,
          isHistory: true
        });

        // ── "Because You Watched" Rows (Netflix Signature Feature) ──
        // Generate recommendations based on multiple history items, not just the last one
        try {
          const recentItems = history.slice(0, 3); // Top 3 most recent
          const recPromises = recentItems.map(async (item) => {
            try {
              const rawRecs = await tmdb.fetchRecommended(item.id, item.contentType || 'movie');
              if (rawRecs && rawRecs.length > 0) {
                return {
                  title: `Because You Watched ${item.title || 'Recently'}`,
                  movies: rawRecs.map(tmdb.formatMovie).filter(Boolean),
                  isBecauseYouWatched: true
                };
              }
            } catch (e) { /* skip failed rec */ }
            return null;
          });
          const recResults = (await Promise.all(recPromises)).filter(Boolean);
          
          // Insert "For You" as the combined first rec
          if (recResults.length > 0) {
            // Combine first rec as "For You" card stack
            initialFinalRows.splice(1, 0, {
              title: 'For You',
              movies: recResults[0].movies,
              isForYou: true
            });
            // Insert remaining "Because You Watched" rows after priority content
            recResults.slice(1).forEach((rec, idx) => {
              initialFinalRows.splice(3 + idx, 0, rec);
            });
          }
        } catch (e) { console.error('Error fetching recs', e); }
      }

      // Immediately present priority content
      setMovieRows(initialFinalRows);
      setLoading(false);

      // Fetch Secondary Batch in background chunks of 5
      const chunkSize = 5;
      const allSecondaryResults = [];
      for (let i = 0; i < secondaryRows.length; i += chunkSize) {
        const chunk = secondaryRows.slice(i, i + chunkSize);
        const chunkResults = await Promise.all(
          chunk.map(async (row) => ({
            title: row.title,
            movies: (await row.fetch()).map(tmdb.formatMovie).filter(Boolean)
          }))
        );
        allSecondaryResults.push(...chunkResults.filter(r => r.movies.length > 0));
        
        // Progressive rendering: update UI after each chunk
        if (i === 0) {
          setMovieRows(prev => [...prev, ...chunkResults.filter(r => r.movies.length > 0)]);
        }
      }

      const completeRows = [...initialFinalRows, ...allSecondaryResults];

      // ── Insert Category Carousels at strategic positions ────────
      const topOffset = (history.length > 0 ? 2 : 1);
      const totalRows = completeRows.length;
      const step = Math.max(4, Math.floor((totalRows - topOffset) / 6));

      const categoryInserts = [
        { title: 'Popular Languages', isLanguages: true },
        { title: 'Popular Genres', isGenres: true },
        { title: 'Channels', isChannels: true },
        { title: 'Sports', isSports: true },
      ];

      const insertPositions = [
        topOffset + step,
        topOffset + step * 2,
        topOffset + step * 3,
        topOffset + step * 4,
      ];

      for (let i = categoryInserts.length - 1; i >= 0; i--) {
        if (insertPositions[i] < completeRows.length) {
          completeRows.splice(insertPositions[i], 0, categoryInserts[i]);
        }
      }

      setMovieRows(completeRows);
    } catch (error) {
      console.error('Error loading personalized grid:', error);
    } finally {
      setLoading(false);
    }
  };

 const handleRemoveHistory = async (contentId) => {
 if (!user || !activeProfile) return;
 try {
 await firestoreService.removeWatchProgress(user.uid, activeProfile.id, contentId);
 loadContent(); // Refresh grid
 } catch (error) {
 console.error('Error removing history:', error);
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
  <div className="relative z-20 px-2 md:px-8 lg:px-10 mt-8 md:mt-12 pb-20">
  {scrollParent ? (
    <Virtuoso
      customScrollParent={scrollParent}
      data={movieRows}
      itemContent={(idx, row) => {
        const itemClass = "pb-4 md:pb-6";

        if (row.isForYou) {
          return (
            <div key={`foryou-${idx}`} className={`md:hidden ${itemClass}`}>
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

        if (row.isBecauseYouWatched) {
          return (
            <div key={`byw-${idx}`} className={itemClass}>
              <MovieRow
                title={row.title}
                movies={row.movies}
                onMovieClick={(id, type) => {
                  setActiveMovieId(id);
                  setActiveMediaType(type || 'movie');
                  setCurrentView('details');
                }}
              />
            </div>
          );
        }

        if (row.isLanguages) {
          return <div key={`lang-${idx}`} className={itemClass}><CategoryRow title={row.title} type="language" /></div>;
        }

        if (row.isGenres) {
          return <div key={`genre-${idx}`} className={itemClass}><CategoryRow title={row.title} type="genre" /></div>;
        }

        if (row.isChannels) {
          return <div key={`channel-${idx}`} className={itemClass}><CategoryRow title={row.title} type="channel" /></div>;
        }

        if (row.isSports) {
          return <div key={`sport-${idx}`} className={itemClass}><CategoryRow title={row.title} type="sport" /></div>;
        }

        return (
          <div key={`${row.title}-${idx}`} className={itemClass}>
            <MovieRow
              title={row.title}
              movies={row.movies}
              isContinueWatching={row.isHistory}
              isTop10={row.title.toLowerCase().includes('top 10')}
              continueWatchingItems={row.isHistory ? historyItems : null}
              onRemoveFromContinueWatching={handleRemoveHistory}
              onMovieClick={(id, type) => {
                setActiveMovieId(id);
                setActiveMediaType(type || 'movie');
                
                if (row.isHistory) {
                  const item = historyItems.find(h => h.id === id);
                  if (item && item.type === 'tv') {
                    if (item.season) setActiveSeason(item.season);
                    if (item.episode) setActiveEpisode(item.episode);
                    sessionStorage.setItem(`apexwatch_tab_${id}`, 'Episodes');
                  }
                }
                setCurrentView('details');
              }}
            />
          </div>
        );
      }}
    />
  ) : (
    <div className="h-[1000px]"></div>
  )}
  </div>
  );
}
