# Workflow d'Inscription et Onboarding - SunuAgri

## 🎯 Principe

**Option 1** : Inscription minimale (téléphone + OTP uniquement), puis choix du profil métier à la première action.

**Option 3** : Profils multiples autorisés dès le MVP.

---

## 📱 Flux Complet

### 1️⃣ **Écran d'Accueil (Non Connecté)**

```
┌────────────────────────────────────────┐
│  🌱 SunuAgri                           │
│  Plateforme agricole du Sénégal       │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  🔍 Rechercher une terre...      │ │
│  └──────────────────────────────────┘ │
│                                        │
│  📍 Champs disponibles près de vous   │
│  🌾 Productions du moment             │
│                                        │
│  ─────────────────────────────────────│
│                                        │
│  [Se connecter]   [Créer un compte]   │
│                                        │
└────────────────────────────────────────┘
```

**Actions possibles** :
- Navigation publique (liste champs/productions, carte, recherche)
- Clic sur "Créer un compte" → Écran 2

---

### 2️⃣ **Inscription - Téléphone + OTP**

```
┌────────────────────────────────────────┐
│  ← Retour                              │
│                                        │
│  📱 Créer un compte                    │
│                                        │
│  Numéro de téléphone                  │
│  ┌──────────────────────────────────┐ │
│  │ +221 |                           │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Recevoir le code]                   │
│                                        │
└────────────────────────────────────────┘

↓ Après clic, SMS envoyé

┌────────────────────────────────────────┐
│  ← Retour                              │
│                                        │
│  📱 Vérification                       │
│                                        │
│  Code envoyé au +221 78 123 45 67     │
│                                        │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │ _ │ │ _ │ │ _ │ │ _ │ │ _ │ │ _ │ │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
│                                        │
│  Renvoyer le code (45s)                │
│                                        │
│  [Valider]                             │
│                                        │
└────────────────────────────────────────┘
```

**Backend** :
```typescript
POST /api/auth/register
{
  "phone": "+221781234567"
}

→ Crée User {
  phone: "+221781234567",
  systemRole: "USER",
  hasCompletedOnboarding: false,
  profiles: []
}
→ Envoie OTP par SMS
→ Retourne { success: true, userId: "..." }

POST /api/auth/verify-otp
{
  "phone": "+221781234567",
  "code": "123456"
}

→ Vérifie le code OTP
→ Crée Session + token JWT
→ Retourne { token: "...", user: { id, phone, hasCompletedOnboarding: false } }
```

---

### 3️⃣ **Choix du Profil (Onboarding)**

```
┌────────────────────────────────────────┐
│  🌱 SunuAgri                           │
│                                        │
│  👋 Bienvenue !                        │
│  Que voulez-vous faire sur SunuAgri ? │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 📍 J'ai une terre à louer/vendre│ │
│  │ Propriétaire foncier             │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🌾 Je veux vendre ma production  │ │
│  │ Producteur agricole              │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🛒 Je veux acheter des produits  │ │
│  │ Acheteur                         │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 💰 Je cherche à investir         │ │
│  │ Investisseur                     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🚜 J'offre des services          │ │
│  │ Prestataire agricole             │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Continuer sans profil]              │
│  (navigation limitée)                 │
│                                        │
└────────────────────────────────────────┘
```

**Backend** :
```typescript
GET /api/auth/me

→ Si hasCompletedOnboarding = false
  → Frontend redirige vers /onboarding
```

---

### 4️⃣ **Formulaire Onboarding Propriétaire**

```
┌────────────────────────────────────────┐
│  ← Retour                              │
│                                        │
│  📍 Profil Propriétaire                │
│                                        │
│  Nom complet ou raison sociale *      │
│  ┌──────────────────────────────────┐ │
│  │ Moussa Diop                      │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Photo de profil                      │
│  [📷 Ajouter une photo]               │
│                                        │
│  Région *                             │
│  ┌──────────────────────────────────┐ │
│  │ Thiès                   ▼        │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Département                          │
│  ┌──────────────────────────────────┐ │
│  │ Thiès                   ▼        │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Commune *                            │
│  ┌──────────────────────────────────┐ │
│  │ Thiès Ouest             ▼        │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Localité                             │
│  ┌──────────────────────────────────┐ │
│  │ Mbour 2                          │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [Créer mon profil]                   │
│                                        │
└────────────────────────────────────────┘
```

**Backend** :
```typescript
POST /api/profiles
{
  "type": "OWNER",
  "displayName": "Moussa Diop",
  "region": "Thiès",
  "department": "Thiès",
  "commune": "Thiès Ouest",
  "locality": "Mbour 2",
  "photoUrl": "https://..."
}

→ Crée Profile {
  userId: currentUser.id,
  type: "OWNER",
  ...
}
→ Met à jour User { hasCompletedOnboarding: true }
→ Retourne { profile: {...} }
```

---

### 5️⃣ **Dashboard Propriétaire**

```
┌────────────────────────────────────────┐
│  🌱 SunuAgri          [👤 Moussa]  [☰] │
│                                        │
│  📊 Tableau de bord                    │
│                                        │
│  Profil actif : 📍 Propriétaire       │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Mes champs             (0)       │ │
│  │ [+ Publier un champ]            │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Demandes de visite     (0)       │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Propositions reçues    (0)       │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ─────────────────────────────────────│
│  Vous voulez aussi :                  │
│                                        │
│  [+ Devenir producteur]               │
│  [+ Devenir acheteur]                 │
│  [+ Devenir investisseur]             │
│                                        │
└────────────────────────────────────────┘
```

**Navigation** :
```
┌─────────────────────────────────────────┐
│  Profils                                │
│  ─────────────────────────────────────  │
│  📍 Propriétaire (actif)                │
│  Mes champs, Demandes de visite         │
│                                         │
│  + Ajouter un profil                    │
└─────────────────────────────────────────┘
```

---

### 6️⃣ **Ajout d'un Profil Supplémentaire**

```
┌────────────────────────────────────────┐
│  ← Retour                              │
│                                        │
│  ➕ Ajouter un profil                  │
│                                        │
│  Vous avez déjà :                     │
│  ✅ Propriétaire                       │
│                                        │
│  Quel profil voulez-vous ajouter ?    │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🌾 Producteur agricole           │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🛒 Acheteur                      │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 💰 Investisseur                  │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘

↓ Après sélection, formulaire spécifique

POST /api/profiles
{
  "type": "PRODUCER",
  "displayName": "Moussa Diop - Producteur",
  "activityArea": "Cultures maraîchères",
  "region": "Thiès",
  "commune": "Thiès Ouest"
}

→ Crée un 2e Profile pour le même User
```

---

### 7️⃣ **Changement de Profil Actif**

```
┌────────────────────────────────────────┐
│  🌱 SunuAgri          [👤 Moussa]  [☰] │
│                                        │
│  Changer de profil                    │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 📍 Propriétaire         [Actif] │ │
│  │ 3 champs publiés                │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🌾 Producteur                   │ │
│  │ 5 productions actives           │ │
│  └──────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

**Backend** :
```typescript
// Frontend stocke le profileId actif dans le localStorage
// ou via un cookie
localStorage.setItem('activeProfileId', '...');

// Les API vérifient quel profil effectue l'action
POST /api/fields
Headers: { 
  Authorization: "Bearer ...",
  X-Active-Profile: "cuid_du_profile_owner"
}
```

---

## 🔐 Permissions et Vérifications

### Matrice de Permissions

| Action | Profil requis | SystemRole requis |
|--------|---------------|-------------------|
| Publier un champ | OWNER | - |
| Demander une visite | OWNER, PRODUCER, INVESTOR, BUYER | - |
| Publier une production | PRODUCER | - |
| Demander un achat | BUYER | - |
| Publier un besoin d'approvisionnement | BUYER | - |
| Valider une annonce | - | ADMIN, SUPER_ADMIN |
| Suspendre un compte | - | ADMIN, SUPER_ADMIN |
| Gérer les permissions | - | SUPER_ADMIN |

### Exemple de Vérification Backend

```typescript
// middleware/requireProfile.ts
export function requireProfile(type: ProfileType) {
  return async (req: Request) => {
    const user = await getCurrentUser(req);
    const activeProfileId = req.headers.get('X-Active-Profile');
    
    if (!activeProfileId) {
      throw new ApiError(403, 'PROFILE_REQUIRED', 
        'Vous devez sélectionner un profil');
    }
    
    const profile = await prisma.profile.findFirst({
      where: {
        id: activeProfileId,
        userId: user.id,
        type,
        isActive: true
      }
    });
    
    if (!profile) {
      throw new ApiError(403, 'INVALID_PROFILE', 
        `Cette action nécessite un profil ${type}`);
    }
    
    return { user, profile };
  };
}

// Utilisation
export async function POST(req: Request) {
  const { user, profile } = await requireProfile('OWNER')(req);
  
  // profile.type est garanti être 'OWNER'
  const field = await prisma.field.create({
    data: {
      profileId: profile.id,
      ...
    }
  });
}
```

---

## 📝 États du User

| État | Description | Accès |
|------|-------------|-------|
| **Inscrit non onboardé** | `hasCompletedOnboarding = false`, `profiles = []` | Navigation publique seulement |
| **Onboardé 1 profil** | `hasCompletedOnboarding = true`, 1 Profile créé | Actions de ce profil |
| **Multi-profils** | Plusieurs Profiles actifs | Switch entre profils |
| **Admin standard** | `systemRole = ADMIN` + Profiles métier | Actions admin + actions métier |
| **Super Admin** | `systemRole = SUPER_ADMIN` | Toutes permissions |

---

## ✅ Règles de Gestion

1. **Un User DOIT avoir au moins 1 Profile pour utiliser la plateforme**
   - Exception : navigation publique (liste annonces, carte)

2. **Un User peut avoir PLUSIEURS Profiles**
   - Max 1 Profile de chaque type (contrainte `@@unique([userId, type])`)
   - Exemple : OWNER + PRODUCER + BUYER

3. **Changement de Profil actif**
   - Frontend stocke `activeProfileId` dans localStorage
   - Chaque action envoie `X-Active-Profile` dans les headers

4. **SystemRole est INDÉPENDANT des Profiles**
   - Un ADMIN peut avoir un Profile OWNER
   - Un AGENT peut avoir un Profile PRODUCER

5. **Onboarding forcé au premier login**
   - Si `hasCompletedOnboarding = false`, redirect vers `/onboarding`
   - Une fois 1 Profile créé, `hasCompletedOnboarding = true`

---

## 🎨 Screens à Développer

### Frontend (Next.js Web)
- [x] `/auth/login` - Connexion
- [x] `/auth/register` - Inscription
- [ ] `/onboarding` - Choix du profil
- [ ] `/onboarding/owner` - Formulaire propriétaire
- [ ] `/onboarding/producer` - Formulaire producteur
- [ ] `/onboarding/buyer` - Formulaire acheteur
- [ ] `/onboarding/investor` - Formulaire investisseur
- [ ] `/onboarding/provider` - Formulaire prestataire
- [ ] `/dashboard` - Dashboard multi-profils
- [ ] `/dashboard/switch-profile` - Changement de profil

### Mobile (React Native)
- [x] `LoginScreen`
- [x] `RegisterScreen`
- [ ] `OnboardingChoiceScreen`
- [ ] `OnboardingOwnerScreen`
- [ ] `OnboardingProducerScreen`
- [ ] `DashboardScreen`
- [ ] `ProfileSwitchScreen`

### API (Route Handlers)
- [x] `POST /api/auth/register` - Inscription
- [x] `POST /api/auth/verify-otp` - Vérification OTP
- [x] `GET /api/auth/me` - User actuel
- [ ] `POST /api/profiles` - Créer un profil
- [ ] `GET /api/profiles` - Liste des profils du User
- [ ] `PATCH /api/profiles/[id]` - Modifier un profil
- [ ] `DELETE /api/profiles/[id]` - Supprimer un profil

---

## 🚀 Prochaines Étapes

1. **Appliquer la migration Prisma**
   ```bash
   npx prisma migrate dev --name refactor_roles_system
   ```

2. **Implémenter les routes `/api/profiles`**

3. **Créer les écrans d'onboarding**

4. **Middleware `requireProfile(type)`**

5. **Mettre à jour toutes les vérifications de permissions existantes**

6. **Tests d'intégration du workflow complet**
