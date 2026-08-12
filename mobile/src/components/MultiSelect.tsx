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

interface MultiSelectOption {
  label: string;
  value: string;
}

interface Props {
  label?: string;
  placeholder?: string;
  values: string[];
  options: MultiSelectOption[];
  onValuesChange: (values: string[]) => void;
  error?: string;
  disabled?: boolean;
}

export function MultiSelect({
  label,
  placeholder = "Sélectionner...",
  values,
  options,
  onValuesChange,
  error,
  disabled,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOptions = options.filter((opt) => values.includes(opt.value));
  const displayText =
    selectedOptions.length > 0
      ? selectedOptions.map((opt) => opt.label).join(", ")
      : placeholder;

  const toggleOption = (value: string) => {
    if (values.includes(value)) {
      onValuesChange(values.filter((v) => v !== value));
    } else {
      onValuesChange([...values, value]);
    }
  };

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
        accessibilityHint="Ouvrir la liste de sélection multiple"
      >
        <Text
          style={[
            styles.triggerText,
            values.length === 0 && styles.triggerTextPlaceholder,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
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
                    values.includes(item.value) && styles.optionSelected,
                  ]}
                  onPress={() => toggleOption(item.value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: values.includes(item.value) }}
                >
                  <View
                    style={[
                      styles.checkbox,
                      values.includes(item.value) && styles.checkboxSelected,
                    ]}
                  >
                    {values.includes(item.value) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      values.includes(item.value) && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
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
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
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
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.successLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.bold,
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
});
