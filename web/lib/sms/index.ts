export interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

// En dev : affiche l'OTP en console au lieu d'envoyer un vrai SMS
class ConsoleSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<void> {
    console.log(`[SMS DEV] → ${to}: ${message}`);
  }
}

// À remplacer par Africa's Talking ou autre provider en production :
// class AfricasTalkingProvider implements SmsProvider { ... }

function createSmsProvider(): SmsProvider {
  if (process.env.NODE_ENV === "production" && process.env.SMS_PROVIDER) {
    // Brancher le provider réel ici selon process.env.SMS_PROVIDER
    throw new Error(`SMS provider "${process.env.SMS_PROVIDER}" not implemented yet`);
  }
  return new ConsoleSmsProvider();
}

export const sms = createSmsProvider();

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  await sms.send(
    phone,
    `Votre code de vérification SunuAgri est : ${code}. Valable 10 minutes.`
  );
}
