import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, SafeAreaView } from 'react-native';
import { Hero } from './src/components/Hero';
import { MovieRow } from './src/components/MovieRow';
import { allMovies } from './src/data/mockData';

export default function App() {
  const heroMovie = allMovies[0];
  const continueWatching = allMovies.slice(1, 3);
  const trending = allMovies.slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} bounces={false}>
        <Hero movie={heroMovie} />
        
        <View style={styles.grid}>
          <MovieRow title="Continue Watching" movies={continueWatching} isContinueWatching={true} />
          <MovieRow title="Trending Now" movies={trending} isContinueWatching={false} />
          <MovieRow title="Action & Sci-Fi" movies={allMovies} isContinueWatching={false} />
        </View>

        <StatusBar style="light" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  grid: {
    marginTop: -40, // overlap hero a bit
    paddingBottom: 40,
  }
});