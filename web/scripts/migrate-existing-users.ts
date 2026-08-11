/**
 * Script de migration pour les utilisateurs existants
 *
 * Ce script convertit les Users de l'ancien système (avant refactor_roles_system)
 * vers le nouveau système avec Profiles séparés.
 *
 * ATTENTION : Ce script suppose que la migration Prisma a déjà été appliquée.
 *
 * Utilisation :
 *   npx tsx scripts/migrate-existing-users.ts
 */

import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Début de la migration des utilisateurs existants\n");

  try {
    // 1. Compter les users existants
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total d'utilisateurs : ${totalUsers}`);

    // 2. Trouver les users sans profils (anciens comptes)
    const usersWithoutProfiles = await prisma.user.findMany({
      where: {
        profiles: {
          none: {},
        },
      },
      include: {
        profiles: true,
      },
    });

    console.log(
      `👤 Utilisateurs sans profils : ${usersWithoutProfiles.length}\n`
    );

    if (usersWithoutProfiles.length === 0) {
      console.log("✅ Tous les utilisateurs ont déjà des profils. Rien à faire.");
      return;
    }

    // 3. Pour chaque user sans profil, créer un profil par défaut
    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithoutProfiles) {
      try {
        console.log(`\n🔄 Migration de ${user.phone || user.email}...`);

        // Déterminer le type de profil par défaut
        // (Dans l'ancien système, on peut supposer que tous sont PRODUCER)
        const defaultProfileType = "PRODUCER";

        // Créer un profil par défaut
        const profile = await prisma.profile.create({
          data: {
            userId: user.id,
            type: defaultProfileType,
            displayName: user.phone || user.email || "Utilisateur",
            verificationLevels: user.phone ? ["PHONE_VERIFIED"] : ["NONE"],
          },
        });

        // Mettre à jour hasCompletedOnboarding
        await prisma.user.update({
          where: { id: user.id },
          data: { hasCompletedOnboarding: true },
        });

        console.log(
          `  ✅ Profil ${defaultProfileType} créé (${profile.id})`
        );
        migratedCount++;
      } catch (error) {
        console.error(`  ❌ Erreur pour ${user.phone || user.email}:`, error);
        skippedCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Résumé de la migration :");
    console.log(`  ✅ Migrés avec succès : ${migratedCount}`);
    console.log(`  ⚠️  Ignorés (erreur) : ${skippedCount}`);
    console.log("=".repeat(50));

    // 4. Vérification finale
    const usersStillWithoutProfiles = await prisma.user.count({
      where: {
        profiles: {
          none: {},
        },
      },
    });

    if (usersStillWithoutProfiles > 0) {
      console.log(
        `\n⚠️  Attention : ${usersStillWithoutProfiles} utilisateurs n'ont toujours pas de profils`
      );
    } else {
      console.log("\n✅ Migration terminée avec succès !");
    }
  } catch (error) {
    console.error("❌ Erreur fatale lors de la migration :", error);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
