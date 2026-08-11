-- CreateEnum: SystemRole (rôles système au niveau User)
CREATE TYPE "SystemRole" AS ENUM ('USER', 'AGENT', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable User: Ajouter systemRole et hasCompletedOnboarding
ALTER TABLE "User"
  ADD COLUMN "systemRole" "SystemRole" NOT NULL DEFAULT 'USER',
  ADD COLUMN "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false;

-- Migrer les données existantes: détecter les Users avec des Profiles ADMIN/AGENT/SUPER_ADMIN
-- et leur assigner le systemRole correspondant
UPDATE "User" u
SET "systemRole" = 'SUPER_ADMIN'
WHERE EXISTS (
  SELECT 1 FROM "Profile" p
  WHERE p."userId" = u.id AND p.type = 'SUPER_ADMIN'
);

UPDATE "User" u
SET "systemRole" = 'ADMIN'
WHERE EXISTS (
  SELECT 1 FROM "Profile" p
  WHERE p."userId" = u.id AND p.type = 'ADMIN'
) AND u."systemRole" = 'USER';

UPDATE "User" u
SET "systemRole" = 'AGENT'
WHERE EXISTS (
  SELECT 1 FROM "Profile" p
  WHERE p."userId" = u.id AND p.type = 'AGENT'
) AND u."systemRole" = 'USER';

-- Marquer les Users avec au moins un Profile comme onboardés
UPDATE "User" u
SET "hasCompletedOnboarding" = true
WHERE EXISTS (
  SELECT 1 FROM "Profile" p
  WHERE p."userId" = u.id
  AND p.type NOT IN ('ADMIN', 'AGENT', 'SUPER_ADMIN')
);

-- Supprimer les Profiles ADMIN/AGENT/SUPER_ADMIN (maintenant gérés au niveau User)
DELETE FROM "Profile" WHERE type IN ('ADMIN', 'AGENT', 'SUPER_ADMIN');

-- AlterEnum: Retirer ADMIN, AGENT, SUPER_ADMIN de ProfileType
-- Prisma génère automatiquement le code pour modifier l'enum de manière sûre
ALTER TYPE "ProfileType" RENAME TO "ProfileType_old";
CREATE TYPE "ProfileType" AS ENUM ('OWNER', 'PRODUCER', 'BUYER', 'INVESTOR', 'PROVIDER');
ALTER TABLE "Profile" ALTER COLUMN "type" TYPE "ProfileType" USING ("type"::text::"ProfileType");
DROP TYPE "ProfileType_old";

-- DropForeignKey: Supprimer l'ancienne contrainte createdByAgentId → Profile
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_createdByAgentId_fkey";

-- AddForeignKey: Recréer la contrainte createdByAgentId → User
ALTER TABLE "User"
  ADD CONSTRAINT "User_createdByAgentId_fkey"
  FOREIGN KEY ("createdByAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: Index sur systemRole pour les requêtes de permissions
CREATE INDEX "User_systemRole_idx" ON "User"("systemRole");
