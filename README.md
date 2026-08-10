# SunuAgri

Plateforme numérique agricole au Sénégal — connecte propriétaires fonciers, producteurs et acheteurs.

Deux modules :
- **Foncier** : publication et recherche de terres (location, vente, métayage, partenariat)
- **Marché** : publication et achat de productions agricoles

---

## Structure du repo

```
SunuAgri/
├── web/        # Backend Next.js (App Router) + site web + API REST
└── mobile/     # Application Android React Native (Expo)
```

---

## Prérequis

| Outil | Version |
|---|---|
| Node.js | 20+ |
| npm | 10+ |
| Java (JDK) | 17+ — fourni par Android Studio |
| Android Studio | Hedgehog+ (pour le SDK Android) |

---

## Lancement en développement

### 1. Backend (web/)

```bash
cd web
npm install
cp .env.example .env.local   # compléter les valeurs
npx prisma generate           # génère le client Prisma à partir du schéma
npm run dev
```

API disponible sur `http://localhost:3000/api`.

### 2. Application mobile (mobile/)

Configurer `JAVA_HOME` (Android Studio embarque son propre JDK) :

```bash
export JAVA_HOME=/snap/android-studio/236/jbr
export PATH=$JAVA_HOME/bin:$PATH
```

Premier lancement (build natif, ~5 min) :

```bash
cd mobile
npm install
npx expo run:android        # téléphone USB avec débogage USB activé
```

Sessions suivantes :

```bash
cd mobile
npx expo start
```

L'app se reconnecte automatiquement au serveur Metro.

> **Note** : utiliser `expo-dev-client` (déjà configuré), pas Expo Go du Play Store.

---

## Variables d'environnement

### web/.env.local

```env
DATABASE_URL=           # URL PostgreSQL (Neon ou Hostinger)
JWT_SECRET=             # clé secrète pour les tokens JWT
OTP_SMS_PROVIDER=       # provider SMS (à configurer)
STORAGE_URL=            # URL S3-compatible (Cloudflare R2 ou Backblaze B2)
STORAGE_KEY=
STORAGE_SECRET=
STORAGE_BUCKET=
```

### mobile/.env.local

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000   # émulateur Android
# EXPO_PUBLIC_API_URL=http://192.168.x.x:3000  # téléphone USB (IP locale)
```

---

## Stack technique

| Couche | Choix |
|---|---|
| Backend + Web | Next.js 16 (TypeScript, App Router) |
| Base de données | PostgreSQL via Neon (Prisma 7 + adaptateur Neon) |
| Auth | JWT (jose) + OTP SMS, HttpOnly cookie (web) / Bearer token (mobile) |
| Stockage médias | S3-compatible (Cloudflare R2 / Backblaze B2) |
| Mobile | React Native (Expo SDK 53, Expo Router) |

---

## Client

ATAABA Expertise — Zone de lancement : Sénégal
