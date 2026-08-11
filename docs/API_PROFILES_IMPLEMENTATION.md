# Implémentation des Routes API Profils - SunuAgri

## 📦 Résumé

Implémentation complète des routes API pour la gestion des profils utilisateur, avec validation Zod, middleware d'authentification, et respect des règles métier.

## 🎯 Objectifs atteints

### ✅ 1. Routes API créées

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/profiles` | GET | Liste les profils du user connecté |
| `/api/profiles` | POST | Crée un nouveau profil (OWNER, PRODUCER, BUYER, INVESTOR, PROVIDER) |
| `/api/profiles/[id]` | GET | Détails d'un profil spécifique |
| `/api/profiles/[id]` | PATCH | Modifie un profil existant |
| `/api/profiles/[id]` | DELETE | Soft delete (isActive = false) |

### ✅ 2. Schémas de validation Zod

**Fichier** : `web/src/lib/validations/profile.ts`

- `createOwnerProfileSchema` : Propriétaire (displayName, region, commune obligatoires)
- `createProducerProfileSchema` : Producteur (displayName, activityArea, region obligatoires)
- `createBuyerProfileSchema` : Acheteur (displayName obligatoire)
- `createInvestorProfileSchema` : Investisseur (displayName obligatoire)
- `createProviderProfileSchema` : Prestataire (displayName, activityArea obligatoires)
- `createProfileSchema` : Union discriminée sur `type`
- `updateProfileSchema` : Tous champs optionnels

### ✅ 3. Helpers d'authentification

**Fichier** : `web/src/lib/auth/profile.ts`

- `getCurrentUser(req)` : Récupère le User + ses profils actifs
- `getProfileById(req, profileId)` : Récupère un profil et vérifie qu'il appartient au user
- `requireProfile(req, type)` : Vérifie qu'un profil d'un type donné existe
- `getActiveProfile(req)` : Récupère le profil depuis le header `X-Active-Profile`
- `ApiError` : Classe d'erreur personnalisée

### ✅ 4. Middleware réutilisables

**Fichier** : `web/src/lib/auth/middleware.ts`

- `withAuth(handler)` : Wrapper pour routes nécessitant une authentification
- `withProfile(type, handler)` : Wrapper pour routes nécessitant un type de profil spécifique
- `withOptionalAuth(handler)` : Wrapper pour routes publiques avec auth optionnelle
- `validateBody(req, schema)` : Helper pour valider le body avec Zod

### ✅ 5. Règles de gestion respectées

1. ✅ **Un User peut avoir max 1 Profile de chaque type** (contrainte `@@unique([userId, type])`)
2. ✅ **hasCompletedOnboarding = true** lors de la création du premier profil
3. ✅ **Champs obligatoires validés** selon le type de profil
4. ✅ **Soft delete** : isActive = false au lieu de supprimer
5. ✅ **Conservation d'au moins 1 profil actif** (validation lors du DELETE)

## 📁 Fichiers créés

```
web/
├── app/
│   └── api/
│       ├── profiles/
│       │   ├── route.ts                  # GET + POST
│       │   ├── [id]/
│       │   │   └── route.ts              # GET + PATCH + DELETE
│       │   ├── __tests__/
│       │   │   └── profiles.test.ts      # Tests d'intégration
│       │   └── README.md                 # Documentation complète
│       └── fields/
│           └── MIGRATION_EXAMPLE.md      # Guide de migration
├── lib/
│   ├── auth/
│   │   ├── profile.ts                    # Helpers d'authentification
│   │   └── middleware.ts                 # Wrappers réutilisables
│   └── validations/
│       └── profile.ts                    # Schémas Zod
└── docs/
    └── API_PROFILES_IMPLEMENTATION.md    # Ce fichier
```

## 🔧 Utilisation

### Frontend : Créer un profil

```typescript
const response = await fetch('/api/profiles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'OWNER',
    displayName: 'Moussa Diop',
    region: 'Thiès',
    commune: 'Thiès Ouest',
  }),
});

if (response.ok) {
  const { profile, hasCompletedOnboarding } = await response.json();
  console.log('Profil créé:', profile);
}
```

### Frontend : Lister les profils

```typescript
const response = await fetch('/api/profiles', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const { profiles, hasCompletedOnboarding } = await response.json();
console.log(`${profiles.length} profils trouvés`);
```

### Frontend : Mettre à jour un profil

```typescript
const response = await fetch(`/api/profiles/${profileId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bio: 'Nouvelle bio',
    phoneVisible: true,
  }),
});
```

### Frontend : Désactiver un profil

```typescript
const response = await fetch(`/api/profiles/${profileId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

if (response.status === 400) {
  // C'est le dernier profil actif, on ne peut pas le supprimer
  console.error('Vous devez conserver au moins un profil actif');
}
```

### Backend : Utiliser le middleware dans une route

```typescript
import { withProfile } from "@/lib/auth/middleware";
import { validateBody } from "@/lib/auth/middleware";

// Route protégée : seuls les OWNER peuvent créer des champs
export const POST = withProfile("OWNER", async (req, ctx) => {
  // ctx.profile est garanti être un profil OWNER
  // ctx.user contient le User complet

  const data = await validateBody(req, createFieldSchema);

  const field = await prisma.field.create({
    data: {
      profileId: ctx.profile.id,
      title: data.title,
      description: data.description,
      // ...
    },
  });

  return NextResponse.json(field, { status: 201 });
});
```

## 🧪 Tests

### Tests d'intégration

**Fichier** : `web/app/api/profiles/__tests__/profiles.test.ts`

Tests couverts :
- ✅ Création d'un profil OWNER avec champs obligatoires
- ✅ Vérification que `hasCompletedOnboarding = true` après création
- ✅ Échec si champs obligatoires manquants
- ✅ Création d'un second profil (PRODUCER)
- ✅ Échec si profil du même type existe déjà (409 Conflict)
- ⏳ Listing des profils
- ⏳ Mise à jour d'un profil
- ⏳ Soft delete d'un profil
- ⏳ Échec si dernier profil actif

### Lancer les tests

```bash
cd web
npm test -- profiles.test.ts
```

## 📚 Documentation

### Documentation complète

Voir `web/app/api/profiles/README.md` pour :
- Détails de chaque endpoint (headers, body, réponses)
- Exemples de requêtes
- Codes d'erreur
- Règles de gestion
- Utilisation frontend/backend

### Guide de migration

Voir `web/app/api/fields/MIGRATION_EXAMPLE.md` pour :
- Comparaison ancien vs nouveau code
- Exemples de migration de routes existantes
- Checklist de migration

## 🚀 Prochaines étapes

### Phase 1 : Écrans d'onboarding (Frontend)

- [ ] `/onboarding` - Choix du profil
- [ ] `/onboarding/owner` - Formulaire propriétaire
- [ ] `/onboarding/producer` - Formulaire producteur
- [ ] `/onboarding/buyer` - Formulaire acheteur
- [ ] `/onboarding/investor` - Formulaire investisseur
- [ ] `/onboarding/provider` - Formulaire prestataire
- [ ] `/dashboard` - Dashboard multi-profils
- [ ] `/dashboard/switch-profile` - Changement de profil

### Phase 2 : Migration des routes existantes

- [ ] Migrer `POST /api/fields` vers `withProfile("OWNER")`
- [ ] Migrer `POST /api/productions` vers `withProfile("PRODUCER")`
- [ ] Migrer `POST /api/purchase-requests` vers `withProfile("BUYER")`
- [ ] Migrer toutes les routes PATCH/DELETE

### Phase 3 : Tests complets

- [ ] Tests d'intégration sur toutes les routes
- [ ] Tests E2E du workflow d'onboarding
- [ ] Tests de permissions (bon/mauvais profil)
- [ ] Tests du header `X-Active-Profile`

### Phase 4 : Mobile (React Native)

- [ ] `OnboardingChoiceScreen`
- [ ] `OnboardingOwnerScreen`
- [ ] `OnboardingProducerScreen`
- [ ] `DashboardScreen`
- [ ] `ProfileSwitchScreen`

## 🔐 Sécurité

### Vérifications effectuées

1. ✅ **Authentification obligatoire** : Toutes les routes profiles nécessitent un token JWT valide
2. ✅ **Ownership vérifié** : Un user ne peut modifier/supprimer que ses propres profils
3. ✅ **Validation côté serveur** : Jamais de confiance dans la validation frontend
4. ✅ **Contraintes base de données** : `@@unique([userId, type])` empêche les doublons
5. ✅ **Soft delete** : Les profils ne sont jamais vraiment supprimés (traçabilité)
6. ✅ **Suspension respectée** : Un user suspendu ne peut pas créer/modifier de profils

### Points d'attention

- ⚠️ Le header `X-Active-Profile` doit être envoyé par le frontend pour toutes les actions métier
- ⚠️ Ne jamais exposer les profils d'autres users (sauf dans les annonces publiques)
- ⚠️ Les champs sensibles (téléphone) sont masqués par défaut (`phoneVisible = false`)

## 📊 Matrice de permissions

| Action | Profil requis | SystemRole requis |
|--------|---------------|-------------------|
| Créer un profil | - | - (juste authentifié) |
| Lister ses profils | - | - (juste authentifié) |
| Modifier un profil | - | - (ownership vérifié) |
| Supprimer un profil | - | - (ownership vérifié) |
| Publier un champ | OWNER | - |
| Publier une production | PRODUCER | - |
| Demander un achat | BUYER | - |
| Publier un besoin d'approvisionnement | BUYER | - |
| Valider une annonce | - | ADMIN, SUPER_ADMIN |
| Suspendre un compte | - | ADMIN, SUPER_ADMIN |

## 🎓 Ressources

- [ONBOARDING_FLOW.md](../docs/ONBOARDING_FLOW.md) : Workflow complet d'inscription
- [MIGRATION_NOTES.md](../MIGRATION_NOTES.md) : Notes sur la refonte du système de rôles
- [CLAUDE.md](../CLAUDE.md) : Constitution du projet (stack, conventions, garde-fous)
- [SPEC.md](../SPEC.md) : Spécification complète du projet

## ✅ Checklist de complétion

- [x] Routes `/api/profiles` créées
- [x] Validation Zod des données entrantes
- [x] Vérification de la contrainte `@@unique([userId, type])`
- [x] Mise à jour de `hasCompletedOnboarding` au premier profil
- [x] Soft delete avec conservation d'au moins 1 profil
- [x] Helpers d'authentification (`getCurrentUser`, `getProfileById`, etc.)
- [x] Middleware réutilisables (`withAuth`, `withProfile`, `withOptionalAuth`)
- [x] Gestion d'erreurs centralisée
- [x] Documentation complète (README.md)
- [x] Guide de migration des routes existantes
- [x] Tests d'intégration (structure créée)
- [ ] Tests E2E
- [ ] Écrans d'onboarding (frontend)
- [ ] Migration des routes existantes

## 💡 Notes techniques

### Pourquoi `X-Active-Profile` dans les headers ?

Au lieu de stocker le profil actif côté serveur (session), on le demande explicitement au frontend. Avantages :
- **Stateless** : le serveur n'a pas besoin de stocker l'état "profil actif"
- **Flexibilité** : l'utilisateur peut changer de profil sans nouvelle authentification
- **Clarté** : chaque action indique explicitement quel profil l'effectue
- **API-first** : fonctionne aussi bien pour le web que pour le mobile

### Pourquoi soft delete (isActive = false) ?

- **Traçabilité** : on garde l'historique des actions effectuées par ce profil
- **Relations** : les annonces/messages liés au profil restent accessibles
- **Récupération** : on peut réactiver un profil désactivé par erreur
- **Conformité RGPD** : en cas de demande de suppression, on peut vraiment supprimer plus tard

### Pourquoi discriminated union Zod ?

```typescript
const createProfileSchema = z.discriminatedUnion("type", [
  createOwnerProfileSchema,
  createProducerProfileSchema,
  // ...
]);
```

Avantages :
- **Type-safety** : TypeScript infère automatiquement les champs selon le `type`
- **Validation ciblée** : les champs obligatoires varient selon le type
- **Messages d'erreur clairs** : Zod sait exactement quel schéma a échoué

---

**Implémenté le** : 2026-08-11  
**Par** : Claude Sonnet 4.5 (Agent SunuAgri)  
**Statut** : ✅ Routes API complètes, prêtes pour intégration frontend
