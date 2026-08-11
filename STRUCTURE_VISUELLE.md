# 📁 Structure Visuelle - SunuAgri

## 🎨 Architecture des Composants

```
┌─────────────────────────────────────────────────────────────┐
│                      SunuAgri Mobile                         │
│                   Design System v1.0                         │
└─────────────────────────────────────────────────────────────┘

📱 ÉCRANS PRINCIPAUX
│
├─ 🏠 Foncier (index.tsx) ✨
│  ├─ SearchBar (recherche + filtres)
│  ├─ ImageCard (cartes avec images)
│  │  ├─ Badge (type d'opération)
│  │  ├─ Location (région + commune)
│  │  └─ Price (prix avec négociable)
│  ├─ SkeletonCard (pendant chargement)
│  └─ EmptyState (si aucun résultat)
│
├─ 🌾 Marché (market.tsx) ✨
│  ├─ SearchBar (recherche + filtres)
│  ├─ ImageCard (cartes avec images)
│  │  ├─ Badge (type d'offre)
│  │  ├─ Subtitle (catégorie)
│  │  └─ Price (prix par unité)
│  ├─ SkeletonCard (pendant chargement)
│  └─ EmptyState (si aucun résultat)
│
├─ 👤 Profil (profile.tsx) ✨
│  ├─ Avatar + Info
│  ├─ Badge[] (niveaux de vérification)
│  ├─ Stats Row (champs + productions)
│  ├─ Menu
│  │  ├─ Paramètres (⚙️)
│  │  ├─ Favoris (❤️)
│  │  └─ Aide & Support (❓)
│  └─ Button (déconnexion rouge)
│
└─ 💬 Messages (messages.tsx) ✨
   ├─ Liste Conversations
   │  ├─ Avatar (icône personne)
   │  ├─ Nom + Preview
   │  └─ Date
   ├─ SkeletonLoader (pendant chargement)
   └─ EmptyState (si aucune conversation)

📄 ÉCRANS DÉTAILS
│
├─ 🏞️ Détail Terrain (field/[id].tsx) ✨
│  ├─ ImageGallery
│  │  ├─ Image principale (swipable)
│  │  ├─ Miniatures (en bas)
│  │  ├─ Compteur (1/5)
│  │  └─ Mode Plein Écran (modal)
│  ├─ Bouton Retour Flottant
│  ├─ Header
│  │  ├─ Badge (type opération)
│  │  ├─ Titre
│  │  └─ Location (icône + texte)
│  ├─ Stats Row (superficie + prix)
│  ├─ GPS Card (masqué/révélé)
│  ├─ Description
│  ├─ Caractéristiques (chips)
│  ├─ Documents (disclaimer)
│  ├─ Propriétaire Card
│  └─ CTA Fixe (demande visite)
│
└─ 🥬 Détail Production (production/[id].tsx) ✨
   ├─ ImageGallery (idem terrain)
   ├─ Bouton Retour Flottant
   ├─ Header
   │  ├─ Badge (type offre)
   │  ├─ Titre
   │  ├─ Subtitle (catégorie + variété)
   │  └─ Location
   ├─ Stats Row (prix + quantité)
   ├─ Détails (rows)
   ├─ Description
   ├─ Producteur Card
   └─ CTA Fixe (demande achat)

🔐 AUTHENTIFICATION
│
└─ 🔐 Login (login.tsx) ✨
   ├─ Logo 🌱 (temporaire)
   ├─ Brand (SunuAgri)
   ├─ Form Card
   │  ├─ TextInput (téléphone)
   │  ├─ TextInput (mot de passe)
   │  ├─ Button (connexion)
   │  └─ Button Outline (OTP)
   └─ Footer (lien inscription)
```

---

## 🧩 Composants Réutilisables

```
📦 src/components/
│
├─ 🎨 UI BASICS
│  ├─ Button.tsx
│  │  └─ Variants: primary, secondary, outline, ghost, destructive
│  ├─ TextInput.tsx
│  │  └─ Label + Input + Error + Hint
│  └─ Badge.tsx ✨
│     └─ Variants: primary, secondary, success, warning, destructive, neutral
│
├─ 🔍 SEARCH & FILTERS
│  └─ SearchBar.tsx ✨
│     ├─ Search Icon
│     ├─ TextInput
│     └─ Filter Button (optionnel)
│
├─ ⭐ RATINGS
│  └─ Rating.tsx ✨
│     ├─ 5 étoiles (filled/half/outline)
│     └─ Count (optionnel)
│
├─ 🖼️ CARDS & IMAGES
│  ├─ ImageCard.tsx ✨
│  │  ├─ Image / Placeholder
│  │  ├─ Badge (overlay)
│  │  ├─ Content
│  │  │  ├─ Title
│  │  │  ├─ Subtitle (optionnel)
│  │  │  ├─ Location (icône)
│  │  │  ├─ Footer (metadata + price)
│  │  │  └─ Owner
│  │  └─ Pressable (navigation)
│  └─ ImageGallery.tsx ✨
│     ├─ Main Image
│     ├─ Counter Badge
│     ├─ Thumbnails (scroll horizontal)
│     └─ Fullscreen Modal
│        ├─ Close Button
│        └─ Swipeable Images
│
├─ ⏳ LOADING STATES
│  └─ SkeletonLoader.tsx ✨
│     ├─ SkeletonLoader (base)
│     └─ SkeletonCard (carte complète)
│
├─ 📭 EMPTY STATES
│  └─ EmptyState.tsx ✨
│     ├─ Icon (Ionicons)
│     ├─ Title
│     ├─ Description (optionnel)
│     └─ Action Button (optionnel)
│
└─ 🔔 NOTIFICATIONS
   └─ Toast.tsx ✨
      ├─ Types: success, error, warning, info
      ├─ Icon + Message
      └─ Animation (slide in/out)
```

---

## 🎨 Design Tokens

```
🎨 COLORS
├─ Primary (Agriculture)
│  ├─ #2D6A35 (dark)
│  └─ #4A9955 (light)
├─ Secondary (Ambre)
│  ├─ #C98A1A (dark)
│  └─ #E8B84B (light)
├─ Neutrals
│  ├─ Background: #F5F7F3
│  ├─ Surface: #FFFFFF
│  └─ Border: #D8E3D4
├─ Text
│  ├─ Primary: #1A2E1D
│  ├─ Secondary: #5A7060
│  └─ Muted: #8FA893
└─ Status
   ├─ Success: #2D6A35
   ├─ Warning: #C98A1A
   └─ Destructive: #C0392B

📏 SPACING
├─ xs:    4px
├─ sm:    8px
├─ md:   12px
├─ base: 16px
├─ lg:   20px
├─ xl:   24px
├─ 2xl:  32px
└─ 3xl:  48px

🔘 RADIUS
├─ sm:   6px
├─ md:  10px
├─ lg:  14px
├─ xl:  20px
└─ full: 9999px

📝 FONT SIZE
├─ xs:    11px
├─ sm:    13px
├─ base:  15px
├─ md:    17px
├─ lg:    20px
├─ xl:    24px
├─ 2xl:   30px
└─ 3xl:   38px

💪 FONT WEIGHT
├─ regular:  400
├─ medium:   500
├─ semibold: 600
├─ bold:     700
└─ black:    900
```

---

## 🔄 Flux de Navigation

```
┌─────────────────────────────────────────────────────────────┐
│                      APP NAVIGATION                          │
└─────────────────────────────────────────────────────────────┘

🔐 AUTH FLOW
Login
  ├─ Connexion normale → (tabs)
  ├─ Connexion OTP → OTP Screen → (tabs)
  └─ Créer compte → Register → OTP → (tabs)

📱 MAIN TABS
(tabs)/
  ├─ 🏠 Foncier (index)
  │  └─ Tap card → field/[id]
  │     └─ Demande visite → Conversation
  │
  ├─ 🌾 Marché (market)
  │  └─ Tap card → production/[id]
  │     └─ Demande achat → Conversation
  │
  ├─ 💬 Messages (messages)
  │  └─ Tap conversation → conversation/[id]
  │
  └─ 👤 Profil (profile)
     ├─ Paramètres (à implémenter)
     ├─ Favoris (à implémenter)
     ├─ Aide (à implémenter)
     └─ Déconnexion → Login

🔍 SEARCH FLOW
Foncier/Marché
  ├─ Tape dans SearchBar
  │  └─ Filtrage instantané
  │     ├─ Résultats → Affiche cartes
  │     └─ Aucun résultat → EmptyState
  └─ Tap bouton Filtres (à implémenter)
     └─ Bottom Sheet filtres avancés
```

---

## 📸 États des Écrans

```
ÉTATS D'UN ÉCRAN TYPE
│
├─ 🔄 LOADING
│  └─ SkeletonLoader / SkeletonCard
│     ├─ Animation pulse
│     └─ Structure visible
│
├─ ✅ SUCCESS
│  └─ Contenu normal
│     ├─ Liste / Grille
│     ├─ Cartes
│     └─ Détails
│
├─ 📭 EMPTY
│  └─ EmptyState
│     ├─ Icône
│     ├─ Titre
│     ├─ Description
│     └─ Action (optionnel)
│
└─ ❌ ERROR
   └─ EmptyState
      ├─ Icône alert
      ├─ Message d'erreur
      └─ Bouton réessayer (optionnel)
```

---

## 🎯 Composants par Écran

```
FONCIER (index.tsx)
├─ SearchBar           ✅
├─ ImageCard           ✅
├─ SkeletonCard        ✅
└─ EmptyState          ✅

MARCHÉ (market.tsx)
├─ SearchBar           ✅
├─ ImageCard           ✅
├─ SkeletonCard        ✅
└─ EmptyState          ✅

PROFIL (profile.tsx)
├─ Badge               ✅
├─ SkeletonLoader      ✅
├─ EmptyState          ✅
└─ Button              ✅

MESSAGES (messages.tsx)
├─ SkeletonLoader      ✅
└─ EmptyState          ✅

DÉTAIL TERRAIN (field/[id].tsx)
├─ ImageGallery        ✅
├─ Badge               ✅
└─ SkeletonLoader      ✅

DÉTAIL PRODUCTION (production/[id].tsx)
├─ ImageGallery        ✅
├─ Badge               ✅
└─ SkeletonLoader      ✅
```

---

## 📦 Import Pattern

```typescript
// ✅ RECOMMANDÉ - Import groupé
import {
  Badge,
  SearchBar,
  ImageCard,
  ImageGallery,
  SkeletonCard,
  EmptyState,
  Toast,
} from "@/src/components";

// ❌ ÉVITER - Imports individuels
import { Badge } from "@/src/components/Badge";
import { SearchBar } from "@/src/components/SearchBar";
```

---

## 🎨 Usage Examples

```typescript
// BADGE
<Badge label="Disponible" variant="success" size="md" />

// SEARCH BAR
<SearchBar
  value={query}
  onChangeText={setQuery}
  showFilter
  onFilterPress={() => {}}
/>

// IMAGE CARD
<ImageCard
  title="Terrain 5ha"
  badge="Location"
  badgeVariant="primary"
  location="Dakar · Thiès"
  metadata="5 ha"
  price="500 000 F"
  owner="Mamadou Diop"
  onPress={() => navigate(id)}
/>

// IMAGE GALLERY
<ImageGallery
  images={["url1", "url2", "url3"]}
  placeholder="field"
/>

// EMPTY STATE
<EmptyState
  icon="search-outline"
  title="Aucun résultat"
  description="Essayez d'autres mots-clés"
/>

// SKELETON
{loading && <SkeletonCard />}

// TOAST
<Toast
  message="Demande envoyée avec succès"
  type="success"
  visible={showToast}
  onHide={() => setShowToast(false)}
/>
```

---

**Structure complète et cohérente ! 🎨**
