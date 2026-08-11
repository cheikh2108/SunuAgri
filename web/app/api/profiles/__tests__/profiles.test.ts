/**
 * Tests d'intégration pour les routes API /api/profiles
 *
 * Ces tests vérifient les règles de gestion critiques :
 * 1. Un User peut créer plusieurs Profiles (max 1 de chaque type)
 * 2. La création du premier Profile met hasCompletedOnboarding à true
 * 3. Les champs obligatoires varient selon le type de profil
 * 4. Soft delete conserve au moins 1 profil actif
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth/jwt";

describe("POST /api/profiles", () => {
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Créer un user de test
    const user = await prisma.user.create({
      data: {
        phone: "+221781234567",
        hasCompletedOnboarding: false,
      },
    });
    testUserId = user.id;

    // Créer une session de test
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    authToken = await signToken({ userId: user.id, sessionId: session.id });
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await prisma.profile.deleteMany({ where: { userId: testUserId } });
    await prisma.session.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it("devrait créer un profil OWNER avec les champs obligatoires", async () => {
    const response = await fetch("http://localhost:3000/api/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        type: "OWNER",
        displayName: "Moussa Diop",
        region: "Thiès",
        commune: "Thiès Ouest",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.profile.type).toBe("OWNER");
    expect(data.hasCompletedOnboarding).toBe(true);
  });

  it("devrait marquer hasCompletedOnboarding = true au premier profil", async () => {
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user?.hasCompletedOnboarding).toBe(true);
  });

  it("devrait échouer si les champs obligatoires sont manquants (OWNER)", async () => {
    const response = await fetch("http://localhost:3000/api/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        type: "OWNER",
        displayName: "Test",
        // région et commune manquantes
      }),
    });

    expect(response.status).toBe(400);
  });

  it("devrait créer un second profil PRODUCER", async () => {
    const response = await fetch("http://localhost:3000/api/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        type: "PRODUCER",
        displayName: "Moussa Diop - Producteur",
        activityArea: "Cultures maraîchères",
        region: "Thiès",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.profile.type).toBe("PRODUCER");
  });

  it("devrait échouer si un profil du même type existe déjà", async () => {
    const response = await fetch("http://localhost:3000/api/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        type: "OWNER",
        displayName: "Second Owner",
        region: "Dakar",
        commune: "Dakar",
      }),
    });

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toBe("PROFILE_ALREADY_EXISTS");
  });
});

describe("GET /api/profiles", () => {
  it("devrait retourner tous les profils actifs du user", async () => {
    // Test à implémenter avec un user qui a plusieurs profils
  });
});

describe("PATCH /api/profiles/[id]", () => {
  it("devrait mettre à jour un profil existant", async () => {
    // Test à implémenter
  });

  it("devrait échouer si on retire des champs obligatoires", async () => {
    // Exemple : retirer la commune d'un OWNER
  });
});

describe("DELETE /api/profiles/[id]", () => {
  it("devrait soft delete un profil (isActive = false)", async () => {
    // Test à implémenter
  });

  it("devrait échouer si c'est le dernier profil actif", async () => {
    // Test à implémenter
  });
});
