/**
 * Envoie un SMS avec le code OTP
 * En développement : log dans la console
 * En production : intégrer un vrai provider SMS (Twilio, AWS SNS, etc.)
 */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    // TODO: Intégrer un vrai provider SMS
    console.warn(`SMS NOT SENT (no provider configured): ${phone} → ${code}`);
    return;
  }

  // En développement : afficher le code dans la console
  console.log("\n" + "=".repeat(60));
  console.log("📱 OTP SMS (DEV MODE)");
  console.log("=".repeat(60));
  console.log(`📞 Téléphone : ${phone}`);
  console.log(`🔑 Code OTP  : ${code}`);
  console.log(`⏱️  Valide 10 minutes`);
  console.log("=".repeat(60) + "\n");
}
