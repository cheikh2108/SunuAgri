# Migration des Rôles - Notes Importantes

## 🚨 Changements Majeurs

### Avant (❌ Incorrect)
```prisma
enum ProfileType {
  OWNER
  PRODUCER
  BUYER
  INVESTOR
  PROVIDER
  AGENT        // ❌ C'était un type de profil métier
  ADMIN        // ❌ C'était un type de profil métier
  SUPER_ADMIN  // ❌ C'était un type de profil métier
}

model User {
  profiles Profile[]
  createdByAgent Profile? // ❌ Un agent était un Profile
}
```

### Après (✅ Correct)
```prisma
// Rôle système = permissions plateforme
enum SystemRole {
  USER          // utilisateur standard
  AGENT         // accompagnement terrain
  ADMIN         // modération/validation
  SUPER_ADMIN   // config/permissions
}

// Type de profil = activité métier
enum ProfileType {
  OWNER        // propriétaire foncier
  PRODUCER     // producteur / exploitant
  BUYER        // acheteur
  INVESTOR     // investisseur
  PROVIDER     // prestataire agricole
}

model User {
  systemRole SystemRole @default(USER)  // ✅ Rôle système au niveau User
  hasCompletedOnboarding Boolean @default(false)
  profiles Profile[]                    // ✅ Profils métier multiples
  createdByAgent User?                  // ✅ Un agent est un User
}
```

## 🎯 Workflow d'Inscription

### 1️⃣ Inscription (Téléphone + OTP)
```
POST /api/auth/register
{ phone: "781234567", code: "123456" }

→ Crée un User avec :
  - systemRole = USER
  - hasCompletedOnboarding = false
  - profiles = []  (vide !)
```

### 2️⃣ Première Connexion (Choix du Profil)
```
GET /api/auth/me
→ Si hasCompletedOnboarding = false
  → Redirection vers /onboarding

L'utilisateur choisit :
- "J'ai une terre à louer" → /onboarding/owner
- "Je veux vendre ma récolte" → /onboarding/producer
- "Je veux acheter des produits" → /onboarding/buyer
- etc.
```

### 3️⃣ Création du Profile
```
POST /api/profiles
{
  type: "OWNER",
  displayName: "Moussa Diop",
  region: "Thiès",
  commune: "Thiès Ouest"
}

→ Crée Profile { userId, type: OWNER, ... }
→ Met à jour User { hasCompletedOnboarding: true }
```

### 4️⃣ Ajout de Profils Supplémentaires
```
Un propriétaire veut aussi vendre sa production :

POST /api/profiles
{
  type: "PRODUCER",
  displayName: "Moussa Diop - Producteur",
  activityArea: "Cultures maraîchères"
}

→ Le même User a maintenant 2 Profiles :
  - Profile { type: OWNER }
  - Profile { type: PRODUCER }
```

## 🔧 Impact sur le Code Backend

### Vérifications de Permissions

**Avant** :
```typescript
// ❌ Confus
if (user.profiles.some(p => p.type === "ADMIN")) {
  // Un admin ne pouvait pas être propriétaire
}
```

**Après** :
```typescript
// ✅ Clair
if (user.systemRole === "ADMIN") {
  // Permissions plateforme
}

const ownerProfile = user.profiles.find(p => p.type === "OWNER");
if (ownerProfile) {
  // Action métier (publier un champ)
}
```

### Exemple : Publier un Champ

```typescript
// api/fields/route.ts
export async function POST(req: Request) {
  const user = await getCurrentUser(req);
  
  // ✅ Vérifier le profil OWNER
  const ownerProfile = await prisma.profile.findUnique({
    where: { userId_type: { userId: user.id, type: "OWNER" } }
  });
  
  if (!ownerProfile) {
    return Response.json(
      { 
        error: "PROFILE_REQUIRED",
        message: "Vous devez créer un profil propriétaire",
        onboardingUrl: "/onboarding/owner"
      },
      { status: 403 }
    );
  }
  
  // Créer le champ avec ce profil
  const field = await prisma.field.create({
    data: {
      profileId: ownerProfile.id,
      title: data.title,
      ...
    }
  });
}
```

## 🗄️ Migration SQL Nécessaire

```sql
-- 1. Créer le nouveau enum SystemRole
CREATE TYPE "SystemRole" AS ENUM ('USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN');

-- 2. Ajouter la colonne systemRole à User
ALTER TABLE "User" 
  ADD COLUMN "systemRole" "SystemRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false;

-- 3. Migrer les données existantes (si des Profiles ADMIN/AGENT existent)
-- Trouver les Users qui ont un Profile ADMIN/AGENT et mettre à jour leur systemRole
UPDATE "User" u
SET "systemRole" = 'ADMIN'
WHERE EXISTS (
  SELECT 1 FROM "Profile" p 
  WHERE p."userId" = u.id AND p.type = 'ADMIN'
);

UPDATE "User" u
SET "systemRole" = 'AGENT'
WHERE EXISTS (
  SELECT 1 FROM "Profile" p 
  WHERE p."userId" = u.id AND p.type = 'AGENT'
);

UPDATE "User" u
SET "systemRole" = 'SUPER_ADMIN'
WHERE EXISTS (
  SELECT 1 FROM "Profile" p 
  WHERE p."userId" = u.id AND p.type = 'SUPER_ADMIN'
);

-- 4. Supprimer les Profiles ADMIN/AGENT/SUPER_ADMIN
DELETE FROM "Profile" WHERE type IN ('ADMIN', 'AGENT', 'SUPER_ADMIN');

-- 5. Retirer ADMIN/AGENT/SUPER_ADMIN de l'enum ProfileType
-- (Prisma le fera automatiquement)

-- 6. Corriger la relation createdByAgent (Profile → User)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_createdByAgentId_fkey";
ALTER TABLE "User" 
  ADD CONSTRAINT "User_createdByAgentId_fkey" 
  FOREIGN KEY ("createdByAgentId") REFERENCES "User"("id");

-- 7. Index sur systemRole
CREATE INDEX "User_systemRole_idx" ON "User"("systemRole");
```

## ✅ Avantages du Nouveau Modèle

1. **Séparation des Responsabilités**
   - SystemRole = permissions plateforme
   - ProfileType = activité métier

2. **Profils Multiples**
   - Un admin peut aussi être propriétaire
   - Un producteur peut aussi être acheteur

3. **Cohérence avec le SPEC**
   > "un compte peut cumuler plusieurs rôles"

4. **Onboarding Flexible**
   - Inscription minimale (juste téléphone)
   - Choix du profil à la première action

5. **Clarté du Code**
   ```typescript
   // ✅ Permissions système
   if (user.systemRole === "ADMIN") { ... }
   
   // ✅ Capacités métier
   if (user.profiles.some(p => p.type === "OWNER")) { ... }
   ```

## 📝 TODO Backend

- [ ] Créer `/api/profiles` (POST pour créer un nouveau profil)
- [ ] Créer `/api/profiles` (GET pour lister les profils de l'utilisateur)
- [ ] Créer `/api/auth/me` (retourne User + profiles[])
- [ ] Mettre à jour toutes les vérifications de permissions
- [ ] Créer les écrans d'onboarding (`/onboarding/owner`, `/onboarding/producer`, etc.)
- [ ] Middleware pour vérifier `hasCompletedOnboarding` sur les routes protégées
- [ ] Tests pour les règles de gestion (§9 du SPEC)
