import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/contexts/ThemeContext";
import { spacing, fontSize, fontWeight, radius } from "../../src/lib/tokens";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "Comment publier une annonce ?",
    answer:
      "Pour publier une annonce, allez sur l'onglet correspondant (Terrains ou Marché), appuyez sur le bouton + en bas à droite, remplissez le formulaire et soumettez. Votre annonce sera validée par notre équipe sous 24-48h.",
  },
  {
    question: "Comment contacter un vendeur/propriétaire ?",
    answer:
      "Sur la page de détail d'une annonce, utilisez le bouton 'Contacter' pour envoyer un message direct. Vous pouvez aussi demander une visite pour les terrains.",
  },
  {
    question: "Mes annonces sont-elles visibles immédiatement ?",
    answer:
      "Non, toutes les annonces passent par une validation de notre équipe pour garantir la qualité et la sécurité. Vous recevrez une notification dès qu'elle sera publiée.",
  },
  {
    question: "Comment gérer mes favoris ?",
    answer:
      "Appuyez sur le cœur sur n'importe quelle annonce pour l'ajouter à vos favoris. Retrouvez-les dans Paramètres > Mes favoris.",
  },
  {
    question: "Que faire en cas de litige ?",
    answer:
      "Contactez notre support via WhatsApp ou email. Nous prendrons en charge votre demande sous 24h. Pour les litiges sérieux, vous pouvez signaler un profil ou une annonce depuis son détail.",
  },
  {
    question: "Comment modifier mon profil ?",
    answer:
      "Allez dans l'onglet Profil, appuyez sur 'Modifier le profil' et mettez à jour vos informations. N'oubliez pas de sauvegarder.",
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleWhatsAppContact = () => {
    Linking.openURL("https://wa.me/221771234567?text=Bonjour%20SunuAgri%2C%20j'ai%20besoin%20d'aide");
  };

  const handleEmailContact = () => {
    Linking.openURL("mailto:support@sunuagri.sn?subject=Demande%20de%20support");
  };

  const handlePhoneContact = () => {
    Linking.openURL("tel:+221771234567");
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Aide & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact rapide */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nous contacter</Text>

          <View style={styles.contactCards}>
            <Pressable
              style={[styles.contactCard, { backgroundColor: "#25D366" }]}
              onPress={handleWhatsAppContact}
            >
              <Ionicons name="logo-whatsapp" size={28} color={colors.white} />
              <Text style={styles.contactLabel}>WhatsApp</Text>
            </Pressable>

            <Pressable
              style={[styles.contactCard, { backgroundColor: colors.primary }]}
              onPress={handleEmailContact}
            >
              <Ionicons name="mail-outline" size={28} color={colors.white} />
              <Text style={styles.contactLabel}>Email</Text>
            </Pressable>

            <Pressable
              style={[styles.contactCard, { backgroundColor: colors.secondary }]}
              onPress={handlePhoneContact}
            >
              <Ionicons name="call-outline" size={28} color={colors.white} />
              <Text style={styles.contactLabel}>Téléphone</Text>
            </Pressable>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Questions fréquentes</Text>

          <View style={styles.faqList}>
            {FAQ_DATA.map((item, index) => (
              <View
                key={index}
                style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Pressable
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(index)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: expandedIndex === index }}
                >
                  <Text style={[styles.faqQuestionText, { color: colors.text }]}>{item.question}</Text>
                  <Ionicons
                    name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textMuted}
                  />
                </Pressable>

                {expandedIndex === index && (
                  <View style={[styles.faqAnswer, { borderTopColor: colors.border }]}>
                    <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>
                      {item.answer}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Infos */}
        <View style={[styles.infoBox, { backgroundColor: colors.successLight, borderColor: colors.primary }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Notre équipe répond sous <Text style={{ fontWeight: fontWeight.bold }}>24h</Text> en moyenne
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 52,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  content: {
    padding: spacing.base,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  contactCards: {
    flexDirection: "row",
    gap: spacing.md,
  },
  contactCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  contactLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  faqList: {
    gap: spacing.sm,
  },
  faqItem: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    gap: spacing.md,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  faqAnswer: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  faqAnswerText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
