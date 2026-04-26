import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export function Hero({ movie }) {
  if (!movie) return null;

  return (
    <View style={styles.container}>
      <Image source={{ uri: movie.backdrop }} style={styles.backdrop} />
      {/* Fallback gradient approximation for pure RN using Views */}
      <View style={styles.overlay} />
      
      <View style={styles.content}>
        <Text style={styles.title}>{movie.title.toUpperCase()}</Text>
        <Text style={styles.tags}>{movie.year} • {movie.duration} • {movie.rating}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.playButton}>
            <Text style={styles.playButtonText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoButton}>
            <Text style={styles.infoButtonText}>Info</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height: 500,
    backgroundColor: '#050505',
  },
  backdrop: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  title: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 8,
  },
  tags: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 20,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    minWidth: 100,
    alignItems: 'center',
    marginRight: 10,
  },
  playButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: 100,
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
