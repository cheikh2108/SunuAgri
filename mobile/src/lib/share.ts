import { Share, Linking, Platform } from "react-native";

interface ShareAnnonceParams {
  type: "field" | "production";
  id: string;
  title: string;
  price?: number;
  location?: string;
}

/**
 * Partage une annonce via le système de partage natif
 */
export async function shareAnnonce({ type, id, title, price, location }: ShareAnnonceParams) {
  const baseUrl = "https://sunuagri.sn"; // À remplacer par l'URL de production
  const url = `${baseUrl}/${type === "field" ? "terrain" : "production"}/${id}`;

  const priceText = price ? `\n💰 ${price.toLocaleString("fr-SN")} F CFA` : "";
  const locationText = location ? `\n📍 ${location}` : "";

  const message = `🌾 ${title}${priceText}${locationText}\n\n👉 ${url}\n\nvia SunuAgri`;

  try {
    const result = await Share.share({
      message,
      url: Platform.OS === "ios" ? url : undefined,
      title: title,
    });

    if (result.action === Share.sharedAction) {
      return { success: true, activityType: result.activityType };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error("Error sharing:", error);
    return { success: false, error };
  }
}

/**
 * Partage une annonce directement via WhatsApp
 */
export async function shareViaWhatsApp({ type, id, title, price, location }: ShareAnnonceParams) {
  const baseUrl = "https://sunuagri.sn";
  const url = `${baseUrl}/${type === "field" ? "terrain" : "production"}/${id}`;

  const priceText = price ? `\n💰 ${price.toLocaleString("fr-SN")} F CFA` : "";
  const locationText = location ? `\n📍 ${location}` : "";

  const message = `🌾 ${title}${priceText}${locationText}\n\n👉 ${url}\n\nvia SunuAgri`;

  const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return { success: true };
    } else {
      return { success: false, error: "WhatsApp not installed" };
    }
  } catch (error) {
    console.error("Error opening WhatsApp:", error);
    return { success: false, error };
  }
}

/**
 * Partage une annonce via SMS
 */
export async function shareViaSMS({ type, id, title, price, location }: ShareAnnonceParams, phoneNumber?: string) {
  const baseUrl = "https://sunuagri.sn";
  const url = `${baseUrl}/${type === "field" ? "terrain" : "production"}/${id}`;

  const priceText = price ? ` - ${price.toLocaleString("fr-SN")} F CFA` : "";
  const locationText = location ? ` (${location})` : "";

  const message = `${title}${priceText}${locationText}\n\n${url}\n\nvia SunuAgri`;

  const separator = Platform.OS === "ios" ? "&" : "?";
  const smsUrl = `sms:${phoneNumber || ""}${separator}body=${encodeURIComponent(message)}`;

  try {
    const canOpen = await Linking.canOpenURL(smsUrl);
    if (canOpen) {
      await Linking.openURL(smsUrl);
      return { success: true };
    } else {
      return { success: false, error: "Cannot open SMS" };
    }
  } catch (error) {
    console.error("Error opening SMS:", error);
    return { success: false, error };
  }
}
