import React, { useState } from "react";
import {
  View,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius } from "../lib/tokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = 280;

interface Props {
  images: string[];
  placeholder?: "field" | "production";
}

export function ImageGallery({ images, placeholder = "field" }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);

  const displayImages = images.length > 0 ? images : [];
  const hasImages = displayImages.length > 0;

  const placeholderColor = placeholder === "field" ? colors.primary : colors.secondary;
  const placeholderIcon = placeholder === "field" ? "leaf-outline" : "nutrition-outline";

  return (
    <>
      <View style={styles.container}>
        {hasImages ? (
          <Pressable onPress={() => setFullscreenVisible(true)} activeOpacity={0.9}>
            <Image
              source={{ uri: displayImages[selectedIndex] }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          </Pressable>
        ) : (
          <View style={[styles.placeholder, { backgroundColor: placeholderColor }]}>
            <Ionicons name={placeholderIcon} size={64} color={colors.white} style={{ opacity: 0.4 }} />
          </View>
        )}

        {hasImages && displayImages.length > 1 && (
          <>
            <View style={styles.counter}>
              <Ionicons name="images-outline" size={16} color={colors.white} />
              <View style={{ width: 4 }} />
              {selectedIndex + 1} / {displayImages.length}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnails}
              contentContainerStyle={styles.thumbnailsContent}
            >
              {displayImages.map((img, i) => (
                <Pressable
                  key={i}
                  onPress={() => setSelectedIndex(i)}
                  style={[
                    styles.thumbnail,
                    i === selectedIndex && styles.thumbnailActive,
                  ]}
                >
                  <Image source={{ uri: img }} style={styles.thumbnailImage} resizeMode="cover" />
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </View>

      {hasImages && (
        <Modal
          visible={fullscreenVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFullscreenVisible(false)}
        >
          <View style={styles.fullscreenContainer}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setFullscreenVisible(false)}
            >
              <Ionicons name="close" size={28} color={colors.white} />
            </Pressable>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setSelectedIndex(index);
              }}
            >
              {displayImages.map((img, i) => (
                <View key={i} style={styles.fullscreenImageWrapper}>
                  <Image
                    source={{ uri: img }}
                    style={styles.fullscreenImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: IMAGE_HEIGHT,
    position: "relative",
  },
  mainImage: {
    width: "100%",
    height: IMAGE_HEIGHT,
  },
  placeholder: {
    width: "100%",
    height: IMAGE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    fontSize: 12,
    color: colors.white,
  },
  thumbnails: {
    position: "absolute",
    bottom: spacing.md,
    left: 0,
    right: 0,
  },
  thumbnailsContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailActive: {
    borderColor: colors.white,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: spacing.base,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: radius.full,
  },
  fullscreenImageWrapper: {
    width: SCREEN_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
});
