# 📝 Changelog - SunuAgri

## [v1.1.0] - 2026-08-11

### 🎉 Système de Profils Multi-Rôles - IMPLÉMENTATION COMPLÈTE

#### ✨ Added

**1. Migration du Schéma Prisma** (4 fichiers)
- **SystemRole** (User) : USER, AGENT, ADMIN, SUPER_ADMIN (permissions plateforme)
- **ProfileType** (Profile) : OWNER, PRODUCER, BUYER, INVESTOR, PROVIDER (activités métier)
- Un User peut avoir plusieurs Profiles (max 1 de chaque type)
- Contrainte `@@unique([userId, type])` en base de données
- Champ `User.hasCompletedOnboarding` pour forcer l'onboarding
- Migration `20260811002043_refactor_roles_system` appliquée avec succès ✅

**2. Routes API Profils** (16 fichiers)
- `GET /api/profiles` - Liste les profils du user connecté
- `POST /api/profiles` - Crée un nouveau profil (OWNER, PRODUCER, BUYER, INVESTOR, PROVIDER)
- `GET /api/profiles/[id]` - Détails d'un profil
- `PATCH /api/profiles/[id]` - Modifie un profil
- `DELETE /api/profiles/[id]` - Soft delete (isActive = false)
- 5 schémas Zod de validation (un par type de profil)
- 3 middleware réutilisables (`withAuth`, `withProfile`, `withOptionalAuth`)

**3. Système d'Authentification Complet** (17 fichiers)
- 10 guards de permissions réutilisables :
  - `requireAuth()`, `requireSystemRole()`, `requireProfile()`
  - `requireActiveProfile()`, `requireOnboarding()`, `requireOwnership()`
  - `requireVerification()`, `requireNotSuspended()`, `requireFieldAccess()`, `requireAdmin()`
- Gestion JWT complète (génération, vérification, refresh)
- Classes d'erreurs typées (AuthError, ForbiddenError, ValidationError, etc.)
- `getCurrentUser()` avec Profiles inclus
- Middleware Next.js global pour protection des routes
- 13 tests unitaires (vitest)

**4. Écrans Onboarding Web** (9 fichiers)
- Page de choix du profil (`/onboarding`)
- 5 formulaires spécifiques (owner, producer, buyer, investor, provider)
- Données géographiques du Sénégal (14 régions, départements, communes)
- Sélecteurs en cascade (Région → Département → Commune)
- Validation côté client avec messages en français
- Design responsive mobile-first
- Accessibilité complète (ARIA, labels, focus)
- Build Next.js réussi ✅

**5. Écrans Onboarding Mobile** (13 fichiers)
- Écran de choix du profil (`/onboarding/index`)
- 5 formulaires spécifiques (owner, producer, buyer, investor, provider)
- Composants réutilisables :
  - `Picker` : Sélecteur avec modal native
  - `ImagePickerField` : Upload photo (caméra + galerie)
- Hook `useOnboarding` pour gestion d'état
- Upload photo avec `expo-image-picker`
- Multi-sélection via chips cliquables
- Validation en temps réel
- Accessibilité (TalkBack/VoiceOver)

**6. Gestion du Profil Actif** (4 fichiers)
- Web : `lib/profile/active-profile.ts` (localStorage)
- Mobile : `src/lib/active-profile.ts` (AsyncStorage)
- Composant `ProfileSwitcher` pour web et mobile
- Header `X-Active-Profile` automatique dans toutes les requêtes
- Stockage persistant du profil actif
- Interface UI pour switcher entre profils

**7. Documentation Exhaustive** (15 fichiers)
- Guides techniques (MIGRATION_NOTES.md, MIGRATION_SUCCESS.md)
- Documentation API complète (~500 lignes)
- Guide de démarrage rapide (QUICKSTART.md)
- Guide de migration du code existant
- Architecture système (AUTHENTICATION_SYSTEM.md)
- Workflow complet avec maquettes ASCII (ONBOARDING_FLOW.md)
- Guide de test mobile (TESTING_GUIDE.md)
- Récapitulatif complet (IMPLEMENTATION_COMPLETE.md)

#### 🔄 Changed

**Workflow d'Inscription**
1. Inscription → Téléphone + OTP → User créé sans profil
2. Onboarding → Choix du type de profil
3. Formulaire → Création du premier Profile + `hasCompletedOnboarding = true`
4. Dashboard → Accès aux fonctionnalités métier
5. Multi-profils → Ajout de profils supplémentaires via ProfileSwitcher

**Règles de Gestion Respectées**
- ✅ SPEC.md §2 : "un compte peut cumuler plusieurs rôles"
- ✅ CLAUDE.md §5 : Tous les garde-fous métier respectés
- ✅ Masquage GPS conditionnel (visite acceptée)
- ✅ Validation serveur obligatoire (Zod)
- ✅ Onboarding obligatoire avant toute action
- ✅ Téléphone masqué par défaut
- ✅ Comptes suspendus bloqués + sessions révoquées

**Architecture**
- Séparation claire : SystemRole (permissions) vs ProfileType (activités)
- Un admin peut être propriétaire/producteur
- Profils multiples autorisés dès le MVP
- Migration progressive du code existant possible

#### 📦 Statistiques

**Fichiers Créés** : 58 fichiers au total
- Migration : 4 fichiers
- API Backend : 16 fichiers
- Authentification : 17 fichiers
- Onboarding Web : 9 fichiers
- Onboarding Mobile : 13 fichiers
- Profil Actif : 4 fichiers

**Lignes de Code** :
- Code : ~8000 lignes
- Documentation : ~6000 lignes
- Tests : 13 tests unitaires + structures de tests

**Agents en Parallèle** : 4 agents Claude Sonnet 4.5
- Agent 1 : Routes API (16 fichiers)
- Agent 2 : Onboarding Web (9 fichiers)
- Agent 3 : Onboarding Mobile (13 fichiers)
- Agent 4 : Middlewares Auth (17 fichiers)

**Durée Totale** : ~4 heures

#### 🚀 Impact

**Avant** :
- ❌ ADMIN/AGENT étaient des ProfileType → confusion
- ❌ Un admin ne pouvait pas être propriétaire
- ❌ Impossible de cumuler des rôles métier

**Après** :
- ✅ Séparation claire rôles système / profils métier
- ✅ Un utilisateur peut cumuler OWNER + PRODUCER + BUYER
- ✅ Un admin peut avoir des profils métier
- ✅ Workflow d'onboarding complet (web + mobile)
- ✅ Système de permissions robuste (10 guards)
- ✅ Documentation exhaustive

---

## [Design Overhaul] - 2026-08-10

### 🎨 Design Overhaul

#### ✨ Added
- **8 nouveaux composants UI réutilisables**
  - `Badge` : Badges de statut avec 6 variants (primary, secondary, success, warning, destructive, neutral)
  - `SearchBar` : Barre de recherche avec bouton filtres
  - `Rating` : Système d'étoiles de notation (1-5)
  - `ImageCard` : Carte avec image, badge, localisation, prix
  - `ImageGallery` : Galerie photos avec mode plein écran et swipe
  - `SkeletonLoader` : Loading states animés avec pulse
  - `EmptyState` : États vides avec icônes et actions
  - `Toast` : Notifications in-app animées

- **Fonctionnalités principales**
  - Recherche instantanée sur écrans Foncier et Marché
  - Galeries photos avec zoom et navigation
  - States de chargement élégants partout
  - États vides engageants avec icônes
  - Menu profil avec options (Paramètres, Favoris, Aide)

#### 🔄 Changed
- **Écran Foncier (`index.tsx`)**
  - Remplacé cartes textuelles par ImageCard avec photos
  - Ajouté barre de recherche fonctionnelle
  - Filtrage en temps réel (titre, région, commune)
  - SkeletonLoader au lieu d'ActivityIndicator
  - EmptyState pour recherche sans résultat

- **Écran Marché (`market.tsx`)**
  - Remplacé cartes textuelles par ImageCard avec photos
  - Ajouté barre de recherche fonctionnelle
  - Filtrage en temps réel (nom, catégorie, région)
  - SkeletonLoader au lieu d'ActivityIndicator
  - EmptyState pour recherche sans résultat

- **Détail Terrain (`field/[id].tsx`)**
  - Ajouté galerie photos avec miniatures
  - Mode plein écran pour zoom
  - Bouton retour flottant au lieu de header
  - Badge redesigné avec nouveau composant
  - Header repensé (titre + localisation avec icône)
  - SkeletonLoader structuré

- **Détail Production (`production/[id].tsx`)**
  - Ajouté galerie photos avec miniatures
  - Mode plein écran pour zoom
  - Bouton retour flottant
  - Badge redesigné
  - Header repensé
  - SkeletonLoader structuré

- **Écran Profil (`profile.tsx`)**
  - Badges de vérification avec composant Badge
  - Ajouté menu d'options avec icônes
  - Bouton déconnexion en variant destructive (rouge)
  - SkeletonLoader pour chargement
  - EmptyState si erreur

- **Écran Messages (`messages.tsx`)**
  - SkeletonLoader pour liste de conversations
  - EmptyState avec icône chatbubbles
  - Icônes Ionicons pour avatars

- **Écran Login (`login.tsx`)**
  - Logo emoji 🌱 (temporaire, en attendant logo pro)

#### 🏗️ Infrastructure
- **Composants centralisés**
  - Export via `src/components/index.ts`
  - Import simplifié : `import { Badge } from "@/src/components"`

- **Design tokens**
  - Palette cohérente (vert agriculture + ambre)
  - Spacing, radius, fontSize, fontWeight standardisés
  - Iconographie Ionicons partout

#### 📦 Dependencies
- Aucune nouvelle dépendance
- Utilise @expo/vector-icons (déjà inclus)
- Animations avec Animated API native

#### 🐛 Fixed
- Loading states plus élégants (skeleton au lieu de spinner)
- États vides plus engageants
- Recherche manquante sur listings
- Pas d'images sur cartes

---

## Statistiques

### Fichiers Créés
- 9 nouveaux fichiers composants
- 3 fichiers documentation

### Fichiers Modifiés
- 7 écrans améliorés
- 100% des écrans principaux mis à jour

### Lignes de Code
- **Ajoutées** : ~2000 lignes
- **Modifiées** : ~1500 lignes
- **Composants réutilisables** : 8

### Impact UX
- **Recherche** : 2 écrans avec filtrage instantané
- **Images** : Galeries sur tous les détails
- **Loading** : 7 écrans avec skeleton
- **Empty States** : 5 écrans améliorés

---

## Migration Guide

### Pour Développeurs

#### Avant
```typescript
// Loading
{loading && <ActivityIndicator />}

// Empty
{items.length === 0 && <Text>Aucun item</Text>}

// Carte
<View style={styles.card}>
  <Text>{item.title}</Text>
</View>
```

#### Après
```typescript
import { SkeletonCard, EmptyState, ImageCard } from "@/src/components";

// Loading
{loading && <SkeletonCard />}

// Empty
{items.length === 0 && (
  <EmptyState
    icon="search-outline"
    title="Aucun résultat"
    description="Essayez d'autres mots-clés"
  />
)}

// Carte
<ImageCard
  title={item.title}
  badge="Disponible"
  location={item.region}
  price={`${item.price} F`}
  onPress={() => navigate(item.id)}
/>
```

---

## Roadmap

### v1.1 (Court Terme - 2 semaines)
- [ ] Ajouter photos d'exemple dans BDD
- [ ] Créer logo professionnel
- [ ] Intégrer Toast dans toutes les actions
- [ ] Tests sur vrais devices avec vraies données

### v1.2 (Moyen Terme - 1 mois)
- [ ] Bottom sheet pour filtres avancés
- [ ] Pinch-to-zoom dans galeries
- [ ] Animations de transition entre écrans
- [ ] Favoris fonctionnels avec cœur

### v2.0 (Long Terme - 3 mois)
- [ ] Onboarding au premier lancement
- [ ] Dark mode complet
- [ ] Notifications push natives
- [ ] Mode offline avec cache

---

## Breaking Changes

Aucun ! Tous les changements sont rétrocompatibles.

---

## Known Issues

Aucun bug connu actuellement.

---

## Contributors

- Claude Sonnet 4.5 (AI Assistant)
- Cheikh (Product Owner / Developer)

---

## Notes

### Compatibilité
- ✅ Expo SDK 57
- ✅ React Native 0.86.2
- ✅ Android 5.0+
- ✅ iOS 13+ (non testé)

### Performance
- Aucun impact négatif
- Skeleton loaders plus légers qu'ActivityIndicator
- Images optimisées avec placeholders

### Accessibilité
- Tous les composants ont accessibilityRole
- Boutons avec accessibilityLabel
- Contraste vérifié sur textes

---

**Version actuelle** : 1.0.0 (avec design overhaul)  
**Dernière mise à jour** : 10 août 2026
