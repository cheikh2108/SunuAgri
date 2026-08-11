# ✅ Migration Réussie - Refactorisation des Rôles

**Date** : 2026-08-11 00:20:43  
**Migration** : `20260811002043_refactor_roles_system`  
**Statut** : ✅ Appliquée avec succès

---

## 🎯 Changements Appliqués

### 1. **Nouveau Enum `SystemRole`**
```sql
CREATE TYPE "SystemRole" AS ENUM ('USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN');
```

### 2. **Colonnes Ajoutées à `User`**
```sql
ALTER TABLE "User"
  ADD COLUMN "systemRole" "SystemRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false;
```

### 3. **Migration des Données**
- ✅ Users avec Profile SUPER_ADMIN → `systemRole = 'SUPER_ADMIN'`
- ✅ Users avec Profile ADMIN → `systemRole = 'ADMIN'`
- ✅ Users avec Profile AGENT → `systemRole = 'AGENT'`
- ✅ Users avec au moins 1 Profile métier → `hasCompletedOnboarding = true`
- ✅ Profiles ADMIN/AGENT/SUPER_ADMIN supprimés

### 4. **Enum `ProfileType` Nettoyé**
```sql
-- Avant
ProfileType = 'OWNER' | 'PRODUCER' | 'BUYER' | 'INVESTOR' | 'PROVIDER' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN'

-- Après
ProfileType = 'OWNER' | 'PRODUCER' | 'BUYER' | 'INVESTOR' | 'PROVIDER'
```

### 5. **Relation `createdByAgent` Corrigée**
```sql
-- Avant: User.createdByAgentId → Profile.id (❌ incorrect)
-- Après: User.createdByAgentId → User.id (✅ correct)
```

### 6. **Index Créé**
```sql
CREATE INDEX "User_systemRole_idx" ON "User"("systemRole");
```

---

## 🔍 Vérification

### Types TypeScript Générés

```typescript
// ✅ app/generated/prisma/index.d.ts

export enum SystemRole {
  USER = "USER",
  AGENT = "AGENT",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN"
}

export enum ProfileType {
  OWNER = "OWNER",
  PRODUCER = "PRODUCER",
  BUYER = "BUYER",
  INVESTOR = "INVESTOR",
  PROVIDER = "PROVIDER"
}

export type User = {
  id: string
  phone: string | null
  email: string | null
  passwordHash: string | null
  systemRole: SystemRole          // ✅ Nouveau
  hasCompletedOnboarding: boolean // ✅ Nouveau
  isActive: boolean
  isSuspended: boolean
  suspendedAt: Date | null
  suspendReason: string | null
  createdAt: Date
  updatedAt: Date
  createdByAgentId: string | null
}

export type Profile = {
  id: string
  userId: string
  type: ProfileType // ✅ Plus de ADMIN/AGENT/SUPER_ADMIN
  displayName: string
  photoUrl: string | null
  bio: string | null
  region: string | null
  department: string | null
  commune: string | null
  locality: string | null
  phoneVisible: boolean
  activityArea: string | null
  verificationLevels: VerificationLevel[]
  avgResponseHours: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

---

## 📊 État de la Base de Données

### Avant Migration
```
User {
  profiles: [
    { type: 'ADMIN' },  // ❌ Admin était un profil
    { type: 'OWNER' }   // Impossible d'être admin ET propriétaire
  ]
}
```

### Après Migration
```
User {
  systemRole: 'ADMIN',              // ✅ Rôle système
  hasCompletedOnboarding: true,
  profiles: [
    { type: 'OWNER' },              // ✅ Profil métier
    { type: 'PRODUCER' }            // ✅ Profils multiples
  ]
}
```

---

## 🎨 Impact sur le Code

### Authentification
```typescript
// Avant
const isAdmin = user.profiles.some(p => p.type === 'ADMIN');

// Après
const isAdmin = user.systemRole === 'ADMIN' || user.systemRole === 'SUPER_ADMIN';
```

### Permissions sur Actions Métier
```typescript
// Publier un champ (nécessite profil OWNER)
const ownerProfile = await prisma.profile.findUnique({
  where: {
    userId_type: {
      userId: user.id,
      type: 'OWNER'
    }
  }
});

if (!ownerProfile) {
  throw new Error('Vous devez créer un profil propriétaire');
}

await prisma.field.create({
  data: {
    profileId: ownerProfile.id,
    title: 'Mon champ',
    ...
  }
});
```

### Multi-Profils
```typescript
// Un utilisateur peut maintenant avoir plusieurs profils
const user = await prisma.user.findUnique({
  where: { id },
  include: { profiles: true }
});

// Exemple de résultat :
{
  id: 'cuid123',
  systemRole: 'USER',
  hasCompletedOnboarding: true,
  profiles: [
    { type: 'OWNER', displayName: 'Moussa - Propriétaire' },
    { type: 'PRODUCER', displayName: 'Moussa - Producteur' },
    { type: 'BUYER', displayName: 'Moussa - Acheteur' }
  ]
}
```

---

## 🚀 Prochaines Étapes

### 1. Backend - Routes API à Créer
- [ ] `POST /api/profiles` - Créer un profil
- [ ] `GET /api/profiles` - Liste des profils du user
- [ ] `PATCH /api/profiles/[id]` - Modifier un profil
- [ ] `DELETE /api/profiles/[id]` - Supprimer un profil (soft delete)

### 2. Frontend - Écrans d'Onboarding
- [ ] `/onboarding` - Choix du type de profil
- [ ] `/onboarding/owner` - Formulaire propriétaire
- [ ] `/onboarding/producer` - Formulaire producteur
- [ ] `/onboarding/buyer` - Formulaire acheteur
- [ ] `/onboarding/investor` - Formulaire investisseur
- [ ] `/onboarding/provider` - Formulaire prestataire

### 3. Mobile - Écrans Correspondants
- [ ] `OnboardingChoiceScreen`
- [ ] `OnboardingOwnerScreen`
- [ ] `OnboardingProducerScreen`
- [ ] `OnboardingBuyerScreen`
- [ ] `ProfileSwitchScreen`

### 4. Middleware et Guards
- [ ] `requireProfile(type: ProfileType)` - Vérifier le profil requis
- [ ] `requireSystemRole(role: SystemRole)` - Vérifier le rôle système
- [ ] `requireOnboarding()` - Rediriger si pas onboardé

### 5. Mise à Jour du Code Existant
- [ ] Remplacer toutes les vérifications `profile.type === 'ADMIN'`
- [ ] Mettre à jour les routes d'authentification
- [ ] Ajouter la gestion du profil actif (localStorage)

---

## 📚 Documentation

- [MIGRATION_NOTES.md](./MIGRATION_NOTES.md) - Détails techniques
- [docs/ONBOARDING_FLOW.md](./docs/ONBOARDING_FLOW.md) - Workflow complet avec maquettes
- [SPEC.md](./spec.md) - Spécification fonctionnelle

---

## ✅ Checklist de Vérification

- [x] Migration SQL appliquée sans erreurs
- [x] Client Prisma régénéré
- [x] Types TypeScript à jour
- [x] Enum SystemRole créé
- [x] Enum ProfileType nettoyé (plus de ADMIN/AGENT)
- [x] Colonnes systemRole et hasCompletedOnboarding ajoutées
- [x] Relation createdByAgent corrigée (User → User)
- [x] Index sur systemRole créé
- [ ] Routes API /api/profiles implémentées
- [ ] Écrans d'onboarding créés
- [ ] Middleware de permissions mis à jour
- [ ] Tests unitaires écrits

---

## 🎉 Résultat Final

**Avant** : Confusion entre rôles système et profils métier, impossible de cumuler des activités.

**Après** : Architecture claire et conforme au SPEC.md §2 :
> "un compte peut cumuler plusieurs rôles (ex. propriétaire + producteur)"

✅ **Un utilisateur peut maintenant être simultanément :**
- Propriétaire (publie des champs)
- Producteur (vend sa récolte)
- Acheteur (achète des produits)
- Et avoir systemRole = ADMIN (modère la plateforme)

**Sans aucune limitation !** 🚀
