import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import { colors, spacing, radius, fontSize, fontWeight } from "../lib/tokens";

interface PickerOption {
  label: string;
  value: string;
}

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  options: PickerOption[];
  onValueChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function Picker({
  label,
  placeholder = "Sélectionner...",
  value,
  options,
  onValueChange,
  error,
  disabled,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[
          styles.trigger,
          error && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Ouvrir la liste de sélection"
      >
        <Text
          style={[
            styles.triggerText,
            !value && styles.triggerTextPlaceholder,
          ]}
        >
          {displayText}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      {error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label ?? "Sélectionner"}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.value === value }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surface,
  },
  triggerError: {
    borderColor: colors.destructive,
  },
  triggerDisabled: {
    opacity: 0.5,
    backgroundColor: colors.surfaceAlt,
  },
  triggerText: {
    fontSize: fontSize.base,
    color: colors.text,
    flex: 1,
  },
  triggerTextPlaceholder: {
    color: colors.textMuted,
  },
  chevron: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  error: {
    fontSize: fontSize.xs,
    color: colors.destructive,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    padding: spacing.base,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: "70%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeIcon: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.successLight,
  },
  optionText: {
    fontSize: fontSize.base,
    color: colors.text,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  checkmark: {
    fontSize: fontSize.lg,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
});
