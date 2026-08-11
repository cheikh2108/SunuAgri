# 🚀 Quick Start - SunuAgri Mobile

## 📱 Lancer l'App

### Option 1 : Metro Bundler (Recommandé)
```bash
cd mobile
npx expo start
```
**L'app se rafraîchira automatiquement sur le téléphone.**

### Option 2 : Rebuild Android (Si module natif ajouté)
```bash
cd mobile
npx expo run:android
```

---

## 🔥 Commandes Utiles

### Développement
```bash
# Démarrer Metro
npx expo start

# Démarrer avec cache clear
npx expo start -c

# Build Android
npx expo run:android

# Build iOS
npx expo run:ios
```

### Installation
```bash
# Installer dépendances
npm install --legacy-peer-deps

# Vérifier mises à jour Expo
npx expo install --check
```

### Backend
```bash
cd ../web
npm run dev
```

---

## 🛠️ Environnement

### Variables d'environnement
**Fichier** : `mobile/.env.local`
```env
EXPO_PUBLIC_API_URL=http://192.168.1.16:3000
```

**Pour émulateur Android** :
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

**Pour téléphone USB** : Utilise ton IP locale (192.168.x.x)

---

## 🎨 Structure des Composants

```
mobile/src/components/
├── Badge.tsx           # Badges de statut
├── Button.tsx          # Bouton réutilisable
├── TextInput.tsx       # Input avec label
├── SearchBar.tsx       # Recherche + filtres
├── Rating.tsx          # Étoiles de notation
├── ImageCard.tsx       # Carte avec image
├── ImageGallery.tsx    # Galerie photos
├── SkeletonLoader.tsx  # Loading states
├── EmptyState.tsx      # États vides
├── Toast.tsx           # Notifications
└── index.ts            # Export centralisé
```

**Import** :
```typescript
import { Badge, SearchBar, ImageCard } from "@/src/components";
```

---

## 🐛 Débuggage

### Problème : App ne se rafraîchit pas
```bash
# Option 1 : Shake le téléphone → Reload
# Option 2 : Dans Metro, tape "r"
# Option 3 : Clear cache
npx expo start -c
```

### Problème : Erreur de build Android
```bash
# Clean build
cd android && ./gradlew clean && cd ..
npx expo run:android
```

### Problème : Module non trouvé
```bash
# Réinstaller
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Problème : Pare-feu bloque le backend
```powershell
# Ouvrir PowerShell en admin
New-NetFirewallRule -DisplayName "Next.js Dev" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow
```

---

## 📦 Tester Nouveaux Composants

### Badge
```typescript
import { Badge } from "@/src/components";

<Badge label="Disponible" variant="success" size="md" />
```

### SearchBar
```typescript
import { SearchBar } from "@/src/components";

<SearchBar
  value={query}
  onChangeText={setQuery}
  showFilter
  onFilterPress={() => {}}
/>
```

### ImageCard
```typescript
import { ImageCard } from "@/src/components";

<ImageCard
  title="Terrain 5ha"
  badge="Location"
  badgeVariant="primary"
  location="Dakar · Thiès"
  metadata="5 ha"
  price="500 000 F"
  owner="Mamadou Diop"
  onPress={() => {}}
/>
```

### ImageGallery
```typescript
import { ImageGallery } from "@/src/components";

<ImageGallery
  images={[
    "https://example.com/1.jpg",
    "https://example.com/2.jpg"
  ]}
  placeholder="field" // ou "production"
/>
```

### EmptyState
```typescript
import { EmptyState } from "@/src/components";

<EmptyState
  icon="search-outline"
  title="Aucun résultat"
  description="Essayez d'autres mots-clés"
/>
```

### SkeletonLoader
```typescript
import { SkeletonCard } from "@/src/components";

{loading && (
  <>
    <SkeletonCard />
    <SkeletonCard />
  </>
)}
```

---

## 🎯 Workflow Complet

### 1. Démarrer le Backend
```bash
cd web
npm run dev
# Backend sur http://localhost:3000
```

### 2. Démarrer Metro
```bash
cd mobile
npx expo start
```

### 3. Sur le Téléphone
- L'app est déjà installée
- Elle se connecte automatiquement à Metro
- Refresh automatique à chaque sauvegarde

### 4. Faire des Changements
- Modifie un fichier .tsx
- Sauvegarde (Ctrl+S)
- L'app se refresh automatiquement

### 5. Si Rebuild Nécessaire
**Seulement si** :
- Ajout de dépendance native
- Modification android/ios config
- Problème de cache persistant

```bash
npx expo run:android
```

---

## 📊 Monitoring

### Metro Bundler
```
Metro waiting on exp://192.168.1.16:8081
  › Press r │ reload app
  › Press m │ toggle menu
  › Press d │ show developer menu
```

### Backend Next.js
```
▲ Next.js 16.3.0 (Turbopack)
  - Local:   http://localhost:3000
  - Network: http://192.168.1.16:3000
```

---

## 🔐 Connexion App

### Compte Admin (Déjà Créé)
**Tel** : `781832240`  
**OTP** : Voir console backend  
**Mot de passe** : (Si créé avec mot de passe)

### Test OTP
1. Clique "Connexion par OTP"
2. Entre `781832240`
3. Regarde la console backend :
```
[SMS DEV] → 781832240: Votre code est : 123456
```
4. Entre le code

---

## 🎨 Design Tokens

### Couleurs
```typescript
import { colors } from "@/src/lib/tokens";

colors.primary        // #2D6A35
colors.secondary      // #C98A1A
colors.success        // #2D6A35
colors.warning        // #C98A1A
colors.destructive    // #C0392B
colors.text           // #1A2E1D
colors.textSecondary  // #5A7060
colors.textMuted      // #8FA893
colors.surface        // #FFFFFF
colors.background     // #F5F7F3
```

### Spacing
```typescript
import { spacing } from "@/src/lib/tokens";

spacing.xs    // 4
spacing.sm    // 8
spacing.md    // 12
spacing.base  // 16
spacing.lg    // 20
spacing.xl    // 24
spacing["2xl"] // 32
spacing["3xl"] // 48
```

### Font Sizes
```typescript
import { fontSize } from "@/src/lib/tokens";

fontSize.xs    // 11
fontSize.sm    // 13
fontSize.base  // 15
fontSize.md    // 17
fontSize.lg    // 20
fontSize.xl    // 24
fontSize["2xl"] // 30
fontSize["3xl"] // 38
```

---

## 📝 Notes Importantes

### USB ou Wi-Fi ?
- **USB** : Seulement pour build initial ou native modules
- **Wi-Fi** : Suffisant pour développement quotidien
- **Metro** : Fonctionne en Wi-Fi, rafraîchit automatiquement

### Pare-feu
- Autorise ports **3000** (Backend) et **8081** (Metro)
- Ou change réseau de "Public" à "Privé"

### Performances
- **Premier build** : ~25 minutes (Gradle cache)
- **Builds suivants** : ~2 minutes (cache chaud)
- **Metro refresh** : <1 seconde

---

## 🆘 Support

### Logs Backend
```bash
cd web
npm run dev
# Voir OTP dans console
```

### Logs Metro
```bash
cd mobile
npx expo start
# Voir erreurs JS
```

### Logs Android
```bash
adb logcat | grep ReactNative
```

---

**Prêt à coder ! 🚀**
