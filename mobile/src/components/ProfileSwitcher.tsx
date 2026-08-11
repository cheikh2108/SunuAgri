import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getActiveProfile, setActiveProfile, type ActiveProfile } from "../lib/active-profile";
import { colors, fontSize, spacing } from "../lib/tokens";

interface Profile {
  id: string;
  type: "OWNER" | "PRODUCER" | "BUYER" | "INVESTOR" | "PROVIDER";
  displayName: string;
}

interface ProfileSwitcherProps {
  profiles: Profile[];
  onSwitch?: (profile: ActiveProfile) => void;
}

const PROFILE_ICONS = {
  OWNER: "home",
  PRODUCER: "leaf",
  BUYER: "cart",
  INVESTOR: "cash",
  PROVIDER: "construct",
} as const;

const PROFILE_LABELS = {
  OWNER: "Propriétaire",
  PRODUCER: "Producteur",
  BUYER: "Acheteur",
  INVESTOR: "Investisseur",
  PROVIDER: "Prestataire",
};

const PROFILE_COLORS = {
  OWNER: colors.primary,
  PRODUCER: "#f59e0b",
  BUYER: "#3b82f6",
  INVESTOR: "#8b5cf6",
  PROVIDER: "#f97316",
};

export function ProfileSwitcher({ profiles, onSwitch }: ProfileSwitcherProps) {
  const [activeProfile, setActiveProfileState] = useState<ActiveProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadActiveProfile();
  }, [profiles]);

  const loadActiveProfile = async () => {
    const current = await getActiveProfile();
    if (current) {
      setActiveProfileState(current);
    } else if (profiles.length > 0) {
      // Définir le premier profil comme actif par défaut
      const defaultProfile: ActiveProfile = {
        id: profiles[0].id,
        type: profiles[0].type,
        displayName: profiles[0].displayName,
      };
      await setActiveProfile(defaultProfile);
      setActiveProfileState(defaultProfile);
    }
  };

  const handleSwitchProfile = async (profile: Profile) => {
    const newActiveProfile: ActiveProfile = {
      id: profile.id,
      type: profile.type,
      displayName: profile.displayName,
    };

    await setActiveProfile(newActiveProfile);
    setActiveProfileState(newActiveProfile);
    setModalVisible(false);

    if (onSwitch) {
      onSwitch(newActiveProfile);
    }
  };

  if (profiles.length === 0) {
    return null;
  }

  if (profiles.length === 1) {
    // Un seul profil, pas besoin de switcher
    const profile = profiles[0];
    const profileColor = PROFILE_COLORS[profile.type];

    return (
      <View style={[styles.singleProfile, { backgroundColor: `${profileColor}20`, borderColor: profileColor }]}>
        <Ionicons name={PROFILE_ICONS[profile.type] as any} size={20} color={profileColor} />
        <Text style={[styles.singleProfileText, { color: profileColor }]}>
          {PROFILE_LABELS[profile.type]}
        </Text>
      </View>
    );
  }

  const currentColor = activeProfile ? PROFILE_COLORS[activeProfile.type] : colors.primary;

  return (
    <View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: `${currentColor}20`, borderColor: currentColor }]}
        onPress={() => setModalVisible(true)}
      >
        {activeProfile && (
          <>
            <Ionicons name={PROFILE_ICONS[activeProfile.type] as any} size={20} color={currentColor} />
            <Text style={[styles.buttonText, { color: currentColor }]}>
              {PROFILE_LABELS[activeProfile.type]}
            </Text>
            <Ionicons name="chevron-down" size={16} color={currentColor} />
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Changer de profil</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.profileList}>
              {profiles.map((profile) => {
                const isActive = activeProfile?.id === profile.id;
                const profileColor = PROFILE_COLORS[profile.type];

                return (
                  <TouchableOpacity
                    key={profile.id}
                    style={[styles.profileItem, isActive && styles.profileItemActive]}
                    onPress={() => handleSwitchProfile(profile)}
                  >
                    <View style={[styles.profileIcon, { backgroundColor: `${profileColor}20` }]}>
                      <Ionicons name={PROFILE_ICONS[profile.type] as any} size={24} color={profileColor} />
                    </View>

                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName}>{profile.displayName}</Text>
                      <Text style={styles.profileType}>{PROFILE_LABELS[profile.type]}</Text>
                    </View>

                    {isActive && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.addProfile} onPress={() => setModalVisible(false)}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addProfileText}>Ajouter un profil</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  singleProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  singleProfileText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
  },
  profileList: {
    maxHeight: 400,
  },
  profileItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileItemActive: {
    backgroundColor: `${colors.primary}10`,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  profileType: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  addProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addProfileText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.primary,
  },
});
