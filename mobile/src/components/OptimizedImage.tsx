import React, { useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { colors } from '../lib/tokens';

interface Props {
  source: { uri?: string } | number;
  placeholder?: { uri?: string } | number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Image optimisée avec:
 * - Progressive loading (thumbnail → full)
 * - Placeholder pendant le chargement
 * - Gestion des erreurs
 * - Cache automatique via expo-image
 */
export function OptimizedImage({
  source,
  placeholder,
  style,
  containerStyle,
  resizeMode = 'cover',
  onLoad,
  onError,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  // Si c'est une source locale (number), utiliser Image standard
  if (typeof source === 'number') {
    return <Image source={source} style={style} resizeMode={resizeMode} />;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <ExpoImage
        source={source.uri}
        placeholder={placeholder}
        contentFit={resizeMode}
        transition={200}
        style={[styles.image, style]}
        onLoad={handleLoad}
        onError={handleError}
        cachePolicy="memory-disk" // Cache en mémoire et disque
        priority="normal"
      />

      {loading && !error && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {error && (
        <View style={[styles.errorContainer, style]}>
          {/* Placeholder en cas d'erreur */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceAlt,
  },
});
