import { prisma } from "../lib/prisma";
import { hash } from "bcryptjs";

// Données géographiques réelles du Sénégal
const LOCATIONS = [
  { region: "Dakar", department: "Dakar", commune: "Pikine", locality: "Thiaroye" },
  { region: "Dakar", department: "Rufisque", commune: "Rufisque", locality: "Sangalkam" },
  { region: "Thiès", department: "Thiès", commune: "Thiès Nord", locality: "Pout" },
  { region: "Thiès", department: "Tivaouane", commune: "Tivaouane", locality: "Méouane" },
  { region: "Diourbel", department: "Diourbel", commune: "Diourbel", locality: "Ndoulo" },
  { region: "Diourbel", department: "Bambey", commune: "Bambey", locality: "Keur Samba Kane" },
  { region: "Fatick", department: "Fatick", commune: "Fatick", locality: "Diakhao" },
  { region: "Kaolack", department: "Kaolack", commune: "Kaolack", locality: "Médina Baye" },
  { region: "Kaolack", department: "Nioro", commune: "Nioro", locality: "Keur Madaro" },
  { region: "Saint-Louis", department: "Saint-Louis", commune: "Saint-Louis", locality: "Sor" },
  { region: "Saint-Louis", department: "Dagana", commune: "Richard Toll", locality: "Ross Béthio" },
  { region: "Louga", department: "Louga", commune: "Louga", locality: "Léona" },
  { region: "Kolda", department: "Kolda", commune: "Kolda", locality: "Saré Yoba" },
  { region: "Ziguinchor", department: "Ziguinchor", commune: "Ziguinchor", locality: "Boudiediette" },
  { region: "Sédhiou", department: "Sédhiou", commune: "Sédhiou", locality: "Diaroumé" },
  { region: "Tambacounda", department: "Tambacounda", commune: "Tambacounda", locality: "Missirah" },
  { region: "Kaffrine", department: "Kaffrine", commune: "Kaffrine", locality: "Nganda" },
  { region: "Matam", department: "Matam", commune: "Matam", locality: "Oréfondé" },
  { region: "Kédougou", department: "Kédougou", commune: "Kédougou", locality: "Bandafassi" },
];

// Noms sénégalais typiques
const FIRST_NAMES = [
  "Abdoulaye", "Moussa", "Mamadou", "Ousmane", "Ibrahima", "Cheikh", "Amadou", "Malick",
  "Fatou", "Aïssatou", "Mariama", "Aminata", "Khady", "Ndeye", "Awa", "Maimouna",
  "Boubacar", "Modou", "Moustapha", "Saliou", "Alioune", "Bassirou", "Demba", "Samba",
  "Rokhaya", "Astou", "Coumba", "Mame", "Bineta", "Seynabou", "Yacine", "Dieynaba"
];

const LAST_NAMES = [
  "Diop", "Ndiaye", "Fall", "Seck", "Diallo", "Gueye", "Ba", "Sy",
  "Sarr", "Mbaye", "Diouf", "Thiam", "Sow", "Cissé", "Faye", "Niang",
  "Kane", "Diene", "Sall", "Badji", "Sambou", "Sonko", "Ndao", "Sané"
];

// Productions typiques du Sénégal
const PRODUCTION_CATEGORIES = [
  { category: "Céréales", varieties: ["Mil", "Maïs", "Riz", "Sorgho", "Fonio"] },
  { category: "Légumineuses", varieties: ["Arachide", "Niébé", "Bissap", "Lentille"] },
  { category: "Légumes", varieties: ["Tomate", "Oignon", "Chou", "Carotte", "Aubergine", "Gombo", "Piment"] },
  { category: "Fruits", varieties: ["Mangue", "Pastèque", "Banane", "Papaye", "Citron", "Orange", "Ditakh"] },
  { category: "Tubercules", varieties: ["Manioc", "Patate douce", "Igname"] },
  { category: "Élevage", varieties: ["Volaille", "Ovins", "Caprins", "Bovins"] },
];

const SOIL_TYPES = ["Argileux", "Sableux", "Limoneux", "Argilo-sableux", "Latérite", "Dior", "Deck"];

const SUITABLE_CROPS = [
  "Arachide", "Mil", "Maïs", "Niébé", "Manioc", "Bissap",
  "Tomate", "Oignon", "Pastèque", "Mangue", "Riz", "Sorgho"
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min;
  return parseFloat(value.toFixed(decimals));
}

function generatePhoneNumber(): string {
  const prefixes = ["77", "78", "76", "70", "75"];
  const prefix = randomElement(prefixes);
  const number = randomInt(1000000, 9999999);
  return `+221${prefix}${number}`;
}

function generateCoordinates(location: typeof LOCATIONS[0]): { lat: number; lng: number } {
  // Coordonnées approximatives pour chaque région (centre)
  const regionCoords: Record<string, { lat: number; lng: number }> = {
    "Dakar": { lat: 14.7167, lng: -17.4677 },
    "Thiès": { lat: 14.7886, lng: -16.9260 },
    "Diourbel": { lat: 14.6524, lng: -16.2333 },
    "Fatick": { lat: 14.3339, lng: -16.4111 },
    "Kaolack": { lat: 14.1500, lng: -16.0667 },
    "Saint-Louis": { lat: 16.0189, lng: -16.4897 },
    "Louga": { lat: 15.6167, lng: -16.2167 },
    "Kolda": { lat: 12.8833, lng: -14.9500 },
    "Ziguinchor": { lat: 12.5611, lng: -16.2703 },
    "Sédhiou": { lat: 12.7081, lng: -15.5569 },
    "Tambacounda": { lat: 13.7667, lng: -13.6667 },
    "Kaffrine": { lat: 14.1061, lng: -15.5500 },
    "Matam": { lat: 15.6558, lng: -13.2558 },
    "Kédougou": { lat: 12.5558, lng: -12.1744 },
  };

  const baseCoords = regionCoords[location.region] || { lat: 14.5, lng: -14.5 };

  // Ajouter une variance aléatoire pour simuler différentes parcelles
  return {
    lat: baseCoords.lat + randomFloat(-0.5, 0.5, 4),
    lng: baseCoords.lng + randomFloat(-0.5, 0.5, 4),
  };
}

async function main() {
  console.log("🌱 Début du peuplement de la base de données...");

  // Nettoyage (optionnel - à commenter si vous voulez garder les données existantes)
  console.log("🗑️  Nettoyage des données existantes...");
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.visitRequest.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.productionMedia.deleteMany();
  await prisma.fieldMedia.deleteMany();
  await prisma.fieldDocument.deleteMany();
  await prisma.production.deleteMany();
  await prisma.field.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.report.deleteMany();
  await prisma.supplyNeed.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.deviceFingerprint.deleteMany();
  await prisma.user.deleteMany();

  // Créer les utilisateurs
  console.log("👥 Création des utilisateurs...");
  const users = [];
  const hashedPassword = await hash("password123", 10);

  for (let i = 0; i < 50; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const phone = generatePhoneNumber();

    const user = await prisma.user.create({
      data: {
        phone,
        email: i < 20 ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.sn` : undefined,
        passwordHash: hashedPassword,
        systemRole: i === 0 ? "ADMIN" : (i < 3 ? "AGENT" : "USER"),
        hasCompletedOnboarding: true,
        isActive: true,
      },
    });
    users.push(user);
  }

  console.log(`✅ ${users.length} utilisateurs créés`);

  // Créer les profils
  console.log("📋 Création des profils...");
  const profiles = [];
  const ownerProfiles = [];
  const producerProfiles = [];
  const buyerProfiles = [];

  for (const user of users) {
    const numProfiles = randomInt(1, 3);
    const profileTypes = randomElements(["OWNER", "PRODUCER", "BUYER", "INVESTOR"], numProfiles);

    for (const type of profileTypes) {
      const location = randomElement(LOCATIONS);
      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);

      const verificationLevels = ["PHONE_VERIFIED"];
      if (Math.random() > 0.3) verificationLevels.push("EMAIL_VERIFIED");
      if (Math.random() > 0.5) verificationLevels.push("ID_VERIFIED");
      if (Math.random() > 0.7) verificationLevels.push("LOCATION_VERIFIED");

      const profile = await prisma.profile.create({
        data: {
          userId: user.id,
          type: type as any,
          displayName: `${firstName} ${lastName}`,
          photoUrl: Math.random() > 0.5 ? `https://i.pravatar.cc/150?u=${user.id}${type}` : undefined,
          bio: type === "OWNER" ? "Propriétaire foncier, terres disponibles pour exploitation" :
               type === "PRODUCER" ? "Producteur agricole, plusieurs années d'expérience" :
               type === "BUYER" ? "Acheteur en gros, recherche productions de qualité" :
               "Investisseur dans l'agriculture",
          region: location.region,
          department: location.department,
          commune: location.commune,
          locality: location.locality,
          phoneVisible: Math.random() > 0.6,
          verificationLevels: verificationLevels as any,
          avgResponseHours: randomFloat(1, 48, 1),
          isActive: true,
        },
      });

      profiles.push(profile);
      if (type === "OWNER") ownerProfiles.push(profile);
      if (type === "PRODUCER") producerProfiles.push(profile);
      if (type === "BUYER") buyerProfiles.push(profile);
    }
  }

  console.log(`✅ ${profiles.length} profils créés (${ownerProfiles.length} propriétaires, ${producerProfiles.length} producteurs, ${buyerProfiles.length} acheteurs)`);

  // Créer les annonces de terrains
  console.log("🏞️  Création des annonces foncières...");
  const fields = [];

  const operationTypes = [
    "SEASONAL_RENT", "ANNUAL_RENT", "LONG_TERM_RENT", "SALE",
    "SHARECROPPING", "HARVEST_SHARE", "EXPLOITATION_PARTNERSHIP"
  ];

  for (let i = 0; i < 100; i++) {
    const owner = randomElement(ownerProfiles);
    const location = randomElement(LOCATIONS);
    const coords = generateCoordinates(location);
    const operationType = randomElement(operationTypes);
    const areaSqm = randomInt(5000, 500000); // 0.5 à 50 hectares
    const areaHa = (areaSqm / 10000).toFixed(2);

    const statusWeights = [
      { status: "PUBLISHED", weight: 0.7 },
      { status: "PENDING_VALIDATION", weight: 0.15 },
      { status: "DRAFT", weight: 0.1 },
      { status: "SUSPENDED", weight: 0.05 },
    ];
    const rand = Math.random();
    let cumWeight = 0;
    let status = "PUBLISHED";
    for (const sw of statusWeights) {
      cumWeight += sw.weight;
      if (rand <= cumWeight) {
        status = sw.status;
        break;
      }
    }

    const suitableCropsList = randomElements(SUITABLE_CROPS, randomInt(2, 5));

    const field = await prisma.field.create({
      data: {
        profileId: owner.id,
        title: `Terrain agricole ${areaHa} ha - ${location.commune}`,
        description: `Excellent terrain de ${areaHa} hectares situé à ${location.locality}, ${location.commune}. ${
          operationType === "SALE" ? "À vendre" :
          operationType === "SEASONAL_RENT" ? "Location saisonnière disponible" :
          "Disponible pour exploitation"
        }. Sol ${randomElement(SOIL_TYPES).toLowerCase()}, adapté pour ${suitableCropsList.slice(0, 2).join(", ")}.`,
        operationType: operationType as any,
        region: location.region,
        department: location.department,
        commune: location.commune,
        locality: location.locality,
        latitude: coords.lat,
        longitude: coords.lng,
        areaSqm,
        areaUnit: "hectare",
        price: operationType === "SALE" ? randomInt(500000, 50000000) : randomInt(50000, 500000),
        isPriceNegotiable: Math.random() > 0.4,
        paymentConditions: operationType === "SALE" ? "Paiement comptant ou échelonné" : "Paiement par saison",
        rentalDurationDays: operationType.includes("RENT") ? randomInt(90, 365) : undefined,
        availableFrom: new Date(),
        soilType: randomElement(SOIL_TYPES),
        suitableCrops: suitableCropsList,
        waterAvailability: Math.random() > 0.4,
        hasIrrigation: Math.random() > 0.7,
        hasRoadAccess: Math.random() > 0.3,
        hasElectricity: Math.random() > 0.6,
        hasFencing: Math.random() > 0.5,
        hasBuildings: Math.random() > 0.7,
        status: status as any,
        publishedAt: status === "PUBLISHED" ? new Date(Date.now() - randomInt(1, 90) * 86400000) : undefined,
        expiresAt: status === "PUBLISHED" ? new Date(Date.now() + randomInt(30, 180) * 86400000) : undefined,
        verificationLevel: Math.random() > 0.5 ? "DOCUMENTS_REVIEWED" : "UNVERIFIED",
      },
    });

    fields.push(field);

    // Ajouter quelques photos
    const numPhotos = randomInt(1, 5);
    for (let j = 0; j < numPhotos; j++) {
      await prisma.fieldMedia.create({
        data: {
          fieldId: field.id,
          url: `https://picsum.photos/800/600?random=${i * 10 + j}`,
          mediaType: "image",
          orderIndex: j,
        },
      });
    }

    // Ajouter des documents pour certains
    if (Math.random() > 0.5) {
      const docTypes = ["TITLE_DEED", "DELIBERATION", "ATTRIBUTION_CERTIFICATE"];
      const docType = randomElement(docTypes);
      await prisma.fieldDocument.create({
        data: {
          fieldId: field.id,
          documentType: docType as any,
          fileUrl: `https://example.com/docs/${field.id}_${docType}.pdf`,
          fileName: `${docType.toLowerCase()}.pdf`,
        },
      });
    }
  }

  console.log(`✅ ${fields.length} annonces foncières créées`);

  // Créer les productions
  console.log("🌾 Création des productions...");
  const productions = [];

  const offerTypes = [
    "AVAILABLE_NOW", "HARVEST_IN_PROGRESS", "AVAILABLE_SOON",
    "WHOLESALE", "RETAIL", "ORGANIC_CERTIFIED"
  ];

  for (let i = 0; i < 150; i++) {
    const producer = randomElement(producerProfiles);
    const location = randomElement(LOCATIONS);
    const categoryData = randomElement(PRODUCTION_CATEGORIES);
    const variety = randomElement(categoryData.varieties);
    const offerType = randomElement(offerTypes);
    const quantityAvailable = randomInt(50, 10000);
    const unit = ["kg", "tonne", "sac", "unité"][randomInt(0, 3)];

    const statusWeights = [
      { status: "PUBLISHED", weight: 0.75 },
      { status: "PENDING_VALIDATION", weight: 0.15 },
      { status: "DRAFT", weight: 0.1 },
    ];
    const rand = Math.random();
    let cumWeight = 0;
    let status = "PUBLISHED";
    for (const sw of statusWeights) {
      cumWeight += sw.weight;
      if (rand <= cumWeight) {
        status = sw.status;
        break;
      }
    }

    const production = await prisma.production.create({
      data: {
        profileId: producer.id,
        name: variety,
        category: categoryData.category,
        variety,
        offerType: offerType as any,
        quantityAvailable,
        quantityUnit: unit,
        minOrderQuantity: Math.floor(quantityAvailable * 0.1),
        price: randomInt(100, 5000),
        isPriceNegotiable: Math.random() > 0.4,
        quality: randomElement(["Extra", "Première qualité", "Bonne qualité", "Standard"]),
        caliber: Math.random() > 0.5 ? randomElement(["Petit", "Moyen", "Gros", "Mixte"]) : undefined,
        productionMode: randomElement(["Conventionnel", "Bio", "Raisonné", "Traditionnel"]),
        harvestDate: offerType === "AVAILABLE_NOW" ?
          new Date(Date.now() - randomInt(1, 30) * 86400000) :
          new Date(Date.now() - randomInt(30, 90) * 86400000),
        availableFrom: new Date(),
        availableUntil: new Date(Date.now() + randomInt(30, 120) * 86400000),
        region: location.region,
        department: location.department,
        commune: location.commune,
        storageConditions: randomElement([
          "Stockage à température ambiante",
          "Stockage au frais",
          "Entrepôt ventilé",
          "Conservation traditionnelle"
        ]),
        deliveryModes: randomElements(["Sur place", "Livraison possible", "Transport inclus"], randomInt(1, 3)),
        status: status as any,
        publishedAt: status === "PUBLISHED" ? new Date(Date.now() - randomInt(1, 60) * 86400000) : undefined,
        expiresAt: status === "PUBLISHED" ? new Date(Date.now() + randomInt(30, 90) * 86400000) : undefined,
      },
    });

    productions.push(production);

    // Ajouter quelques photos
    const numPhotos = randomInt(1, 4);
    for (let j = 0; j < numPhotos; j++) {
      await prisma.productionMedia.create({
        data: {
          productionId: production.id,
          url: `https://picsum.photos/800/600?random=${i * 20 + j + 1000}`,
          mediaType: "image",
          orderIndex: j,
        },
      });
    }
  }

  console.log(`✅ ${productions.length} productions créées`);

  // Créer des demandes de visite
  console.log("📅 Création des demandes de visite...");
  const publishedFields = fields.filter(f => f.status === "PUBLISHED");
  const visitRequests = [];

  for (let i = 0; i < 80; i++) {
    const field = randomElement(publishedFields);
    const visitor = randomElement([...producerProfiles, ...buyerProfiles].filter(p => p.id !== field.profileId));

    if (!visitor) continue;

    const statuses = ["REQUESTED", "ACCEPTED", "REFUSED", "COMPLETED"];
    const status = randomElement(statuses);

    const visitRequest = await prisma.visitRequest.create({
      data: {
        fieldId: field.id,
        visitorProfileId: visitor.id,
        requestedDate: new Date(Date.now() + randomInt(1, 30) * 86400000),
        message: `Bonjour, je suis intéressé par votre terrain à ${field.commune}. Je souhaiterais le visiter pour discuter des possibilités.`,
        status: status as any,
        responseMessage: status !== "REQUESTED" ?
          (status === "ACCEPTED" ? "D'accord, je suis disponible" : "Désolé, pas disponible pour le moment") :
          undefined,
        scheduledAt: status === "ACCEPTED" ? new Date(Date.now() + randomInt(1, 14) * 86400000) : undefined,
        completedAt: status === "COMPLETED" ? new Date(Date.now() - randomInt(1, 7) * 86400000) : undefined,
      },
    });

    visitRequests.push(visitRequest);
  }

  console.log(`✅ ${visitRequests.length} demandes de visite créées`);

  // Créer des conversations et messages
  console.log("💬 Création des conversations...");

  for (let i = 0; i < 50; i++) {
    const profile1 = randomElement(profiles);
    const profile2 = randomElement(profiles.filter(p => p.id !== profile1.id));

    if (!profile2) continue;

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { profileId: profile1.id },
            { profileId: profile2.id },
          ],
        },
      },
    });

    // Créer quelques messages
    const numMessages = randomInt(2, 10);
    for (let j = 0; j < numMessages; j++) {
      const sender = j % 2 === 0 ? profile1 : profile2;
      const messages = [
        "Bonjour, je suis intéressé par votre annonce.",
        "Le prix est-il négociable ?",
        "Pouvons-nous organiser une visite ?",
        "Merci pour votre réponse rapide.",
        "Quelles sont vos disponibilités ?",
        "Je suis disponible cette semaine.",
        "D'accord, ça me convient parfaitement.",
        "Merci beaucoup pour les informations.",
      ];

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderProfileId: sender.id,
          content: randomElement(messages),
          createdAt: new Date(Date.now() - (numMessages - j) * 3600000),
          isRead: j < numMessages - 2,
        },
      });
    }
  }

  console.log("✅ 50 conversations créées avec messages");

  // Créer des favoris
  console.log("⭐ Création des favoris...");
  for (let i = 0; i < 100; i++) {
    const profile = randomElement(profiles);
    const isField = Math.random() > 0.5;

    try {
      await prisma.favorite.create({
        data: {
          profileId: profile.id,
          fieldId: isField ? randomElement(publishedFields).id : undefined,
          productionId: !isField ? randomElement(productions.filter(p => p.status === "PUBLISHED")).id : undefined,
        },
      });
    } catch (e) {
      // Ignorer les doublons
    }
  }

  console.log("✅ Favoris créés");

  console.log("\n🎉 Peuplement terminé avec succès !");
  console.log(`
📊 Résumé :
  - ${users.length} utilisateurs
  - ${profiles.length} profils (${ownerProfiles.length} propriétaires, ${producerProfiles.length} producteurs, ${buyerProfiles.length} acheteurs)
  - ${fields.length} annonces foncières
  - ${productions.length} productions
  - ${visitRequests.length} demandes de visite
  - 50 conversations avec messages
  - ~100 favoris
  `);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du peuplement :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
