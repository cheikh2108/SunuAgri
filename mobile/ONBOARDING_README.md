# Écrans d'Onboarding - Application Mobile SunuAgri

## Vue d'ensemble

Les écrans d'onboarding permettent aux utilisateurs nouvellement inscrits de créer leur profil métier après l'inscription initiale (téléphone + OTP).

## Structure des fichiers

```
mobile/app/(auth)/onboarding/
├── index.tsx           # Écran de choix du type de profil
├── owner.tsx           # Formulaire Propriétaire foncier
├── producer.tsx        # Formulaire Producteur agricole
├── buyer.tsx           # Formulaire Acheteur
├── investor.tsx        # Formulaire Investisseur
└── provider.tsx        # Formulaire Prestataire de services

mobile/src/components/
├── Picker.tsx          # Composant de sélection avec modal
└── ImagePickerField.tsx # Composant de sélection de photo
```

## Flux utilisateur

1. **Inscription** → L'utilisateur s'inscrit avec son téléphone et reçoit un code OTP
2. **Vérification** → L'utilisateur entre le code OTP
3. **Redirection automatique** → L'utilisateur est redirigé vers `/onboarding/` s'il n'a pas complété son profil
4. **Choix du profil** → L'utilisateur sélectionne son type de profil (5 options)
5. **Formulaire spécifique** → L'utilisateur remplit le formulaire correspondant
6. **Création du profil** → Le profil est créé via `POST /api/profiles`
7. **Redirection** → L'utilisateur est redirigé vers l'application principale

## Composants créés

### 1. Picker

Composant de sélection avec une modal pour choisir parmi une liste d'options.

**Props:**
- `label` (string, optional) - Libellé du champ
- `placeholder` (string, optional) - Texte affiché quand aucune valeur n'est sélectionnée
- `value` (string) - Valeur actuellement sélectionnée
- `options` (array) - Liste d'objets `{ label, value }`
- `onValueChange` (function) - Callback appelé quand la valeur change
- `error` (string, optional) - Message d'erreur à afficher
- `disabled` (boolean, optional) - Désactiver le composant

**Exemple d'utilisation:**
```tsx
<Picker
  label="Région *"
  placeholder="Sélectionner une région"
  value={region}
  options={[
    { label: "Dakar", value: "Dakar" },
    { label: "Thiès", value: "Thiès" },
  ]}
  onValueChange={setRegion}
  error={errors.region}
/>
```

### 2. ImagePickerField

Composant pour sélectionner une photo depuis la galerie ou l'appareil photo.

**Props:**
- `label` (string, optional) - Libellé du champ
- `value` (string | null) - URI de l'image sélectionnée
- `onValueChange` (function) - Callback appelé quand l'image change
- `error` (string, optional) - Message d'erreur à afficher

**Permissions requises:**
- `expo-image-picker` gère automatiquement les permissions
- L'utilisateur sera invité à autoriser l'accès à la galerie/caméra

**Exemple d'utilisation:**
```tsx
<ImagePickerField
  label="Photo de profil"
  value={photoUri}
  onValueChange={setPhotoUri}
/>
```

## Formulaires de profil

### Propriétaire (`owner.tsx`)

**Champs:**
- Nom complet ou raison sociale * (requis)
- Photo de profil (optionnel)
- Région * (requis)
- Département (optionnel)
- Commune * (requis)
- Localité (optionnel)

### Producteur (`producer.tsx`)

**Champs:**
- Nom complet * (requis)
- Photo de profil (optionnel)
- Activité principale * (requis)
- Région * (requis)
- Commune * (requis)
- Zones d'intervention (multi-select, optionnel)

### Acheteur (`buyer.tsx`)

**Champs:**
- Nom complet ou entreprise * (requis)
- Photo de profil (optionnel)
- Type d'acheteur (optionnel)
- Région * (requis)
- Produits recherchés (multi-select, optionnel)

### Investisseur (`investor.tsx`)

**Champs:**
- Nom complet ou entreprise * (requis)
- Photo de profil (optionnel)
- Type d'investisseur (optionnel)
- Région * (requis)
- Domaines d'intérêt (multi-select, optionnel)

### Prestataire (`provider.tsx`)

**Champs:**
- Nom complet ou entreprise * (requis)
- Photo de profil (optionnel)
- Région * (requis)
- Services offerts * (multi-select, requis)
- Zones d'intervention (multi-select, optionnel)

## API attendue

### `POST /api/profiles`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (FormData):**
```javascript
{
  type: "OWNER" | "PRODUCER" | "BUYER" | "INVESTOR" | "PROVIDER",
  displayName: string,
  region: string,
  commune?: string,
  department?: string,
  locality?: string,
  activityArea?: string,           // Producteur
  buyerType?: string,              // Acheteur
  investorType?: string,           // Investisseur
  productInterests?: string,       // JSON array - Acheteur
  investmentInterests?: string,    // JSON array - Investisseur
  services?: string,               // JSON array - Prestataire
  interventionZones?: string,      // JSON array - Producteur/Prestataire
  photo?: File                     // Image file
}
```

**Réponse attendue:**
```json
{
  "profile": {
    "id": "cuid_...",
    "userId": "cuid_...",
    "type": "OWNER",
    "displayName": "Moussa Diop",
    "photoUrl": "https://...",
    "region": "Thiès",
    "commune": "Thiès Ouest",
    "createdAt": "2026-08-11T...",
    "updatedAt": "2026-08-11T..."
  }
}
```

## Validation

Chaque formulaire implémente:
- Validation côté client des champs requis
- Affichage des erreurs en temps réel
- Désactivation du bouton pendant le chargement
- Gestion des erreurs réseau

## AsyncStorage

Les clés utilisées:
- `activeProfileId` - ID du profil actuellement actif
- `hasCompletedOnboarding` - Flag indiquant si l'onboarding est terminé

## Navigation

### Redirection automatique

Le `RootGuard` dans `app/_layout.tsx` vérifie:
1. Si l'utilisateur est authentifié
2. Si `hasCompletedOnboarding` est `true` dans AsyncStorage
3. Sinon, appelle `/api/auth/me` pour vérifier le statut
4. Redirige vers `/onboarding/` si nécessaire

### Option "Continuer sans profil"

L'écran d'onboarding offre un lien "Continuer sans profil" qui permet d'accéder à l'application en mode navigation limitée (lecture seule).

## Design

Les écrans suivent les design tokens de l'application:
- Couleur primaire: `#2D6A35` (vert SunuAgri)
- Couleur secondaire: `#C98A1A` (ambre)
- Typographie cohérente avec le reste de l'app
- Espacement et rayons de bordure standardisés

## Accessibilité

Tous les composants implémentent:
- `accessibilityRole` approprié
- `accessibilityLabel` pour les éléments interactifs
- `accessibilityHint` pour guider l'utilisateur
- `accessibilityState` pour les checkboxes/sélections

## Tests recommandés

1. **Flux complet** : Inscription → OTP → Choix profil → Formulaire → Dashboard
2. **Validation** : Tenter de soumettre avec des champs manquants
3. **Erreur réseau** : Simuler une erreur API
4. **Upload photo** : Tester caméra et galerie
5. **Multi-select** : Vérifier la sélection/désélection des chips
6. **Navigation** : Bouton retour, "Continuer sans profil"

## Dépendances installées

```bash
npx expo install expo-image-picker @react-native-async-storage/async-storage
```

## Prochaines étapes

1. ✅ Écrans d'onboarding créés
2. ⏳ Implémenter l'API `/api/profiles` côté backend
3. ⏳ Tester le flux complet en environnement de dev
4. ⏳ Ajouter des tests unitaires pour les composants
5. ⏳ Ajouter la fonctionnalité "Ajouter un profil supplémentaire"
6. ⏳ Créer l'écran de changement de profil actif
