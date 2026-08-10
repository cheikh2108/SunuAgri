import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const hash = "$2b$12$3izvZ828/vvGaOdNs03PhuuOl/HfHi.6L3rUAcKDK4R..PaPQl6r.";

async function main() {
  const user = await prisma.user.create({
    data: {
      phone: "+221700000001",
      passwordHash: hash,
      profiles: {
        create: {
          type: "ADMIN",
          displayName: "Super Admin",
          verificationLevels: ["PHONE_VERIFIED"],
        },
      },
    },
    include: { profiles: true },
  });
  console.log("✓ Compte admin créé");
  console.log("  ID :", user.id);
  console.log("  Téléphone : +221700000001");
  console.log("  Mot de passe : Admin@2026");
}

main().catch(console.error).finally(() => prisma.$disconnect());
