require("dotenv").config({ path: ".env.local" });

async function checkAdmin() {
  const { prisma } = await import("../lib/prisma");

  const adminUser = await prisma.user.findFirst({
    where: { systemRole: "ADMIN" },
    select: {
      phone: true,
      email: true,
      systemRole: true,
      profiles: {
        select: {
          displayName: true,
          type: true,
        },
      },
    },
  });

  if (adminUser) {
    console.log("\n✅ COMPTE ADMIN TROUVÉ:");
    console.log("📱 Téléphone:", adminUser.phone);
    console.log("📧 Email:", adminUser.email || "Non défini");
    console.log("🔑 Rôle:", adminUser.systemRole);
    console.log("🔐 Mot de passe: password123");
    console.log("\nProfils associés:");
    adminUser.profiles.forEach((p) => {
      console.log(`  - ${p.displayName} (${p.type})`);
    });
  } else {
    console.log("❌ Aucun compte ADMIN trouvé");
  }

  await prisma.$disconnect();
}

checkAdmin();
