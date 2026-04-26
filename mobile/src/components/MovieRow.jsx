import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';

export function MovieRow({ title, movies, isContinueWatching }) {
  if (!movies || movies.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {movies.map((movie) => (
          <TouchableOpacity key={movie.id} style={styles.movieContainer}>
            <Image 
              source={{ uri: isContinueWatching ? movie.backdrop : movie.poster }} 
              style={[styles.image, isContinueWatching ? styles.imageContinue : styles.imageStandard]} 
            />
            {isContinueWatching && (
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: '40%' }]} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 20,
  },
  scrollContainer: {
    paddingHorizontal: 20,
  },
  movieContainer: {
    marginRight: 16,
  },
  image: {
    borderRadius: 8,
    backgroundColor: '#333',
  },
  imageStandard: {
    width: 120,
    height: 180,
  },
  imageContinue: {
    width: 240,
    height: 135,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#e50914',
  }
});
