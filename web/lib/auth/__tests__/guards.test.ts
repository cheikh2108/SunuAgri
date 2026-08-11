/**
 * Tests unitaires pour les guards d'authentification
 *
 * Pour exécuter ces tests :
 * npm install --save-dev vitest @vitest/ui
 * npx vitest run
 *
 * Ce fichier est un exemple — adapter selon votre setup de tests.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { requireAuth, requireProfile, requireSystemRole, getActiveProfile } from "../guards";
import { AuthError, ForbiddenError } from "@/lib/errors";
import type { User, Profile } from "@/app/generated/prisma/client";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock JWT
vi.mock("../jwt", () => ({
  verifyToken: vi.fn(),
}));

describe("Guards d'authentification", () => {
  describe("requireAuth", () => {
    it("devrait throw AuthError si pas de header Authorization", async () => {
      const req = new Request("http://localhost/api/test");

      await expect(requireAuth(req)).rejects.toThrow(AuthError);
      await expect(requireAuth(req)).rejects.toThrow("Token d'authentification manquant");
    });

    it("devrait throw AuthError si token vide", async () => {
      const req = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer " },
      });

      await expect(requireAuth(req)).rejects.toThrow(AuthError);
    });

    it("devrait throw AuthError si token invalide", async () => {
      const { verifyToken } = await import("../jwt");
      vi.mocked(verifyToken).mockResolvedValue(null);

      const req = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer invalid-token" },
      });

      await expect(requireAuth(req)).rejects.toThrow(AuthError);
      await expect(requireAuth(req)).rejects.toThrow("Token expiré ou invalide");
    });

    it("devrait throw AuthError si la session n'existe pas", async () => {
      const { verifyToken } = await import("../jwt");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(verifyToken).mockResolvedValue({
        userId: "user123",
        sessionId: "session123",
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      const req = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer valid-token" },
      });

      await expect(requireAuth(req)).rejects.toThrow(AuthError);
      await expect(requireAuth(req)).rejects.toThrow("Session invalide");
    });

    it("devrait throw AuthError si la session est révoquée", async () => {
      const { verifyToken } = await import("../jwt");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(verifyToken).mockResolvedValue({
        userId: "user123",
        sessionId: "session123",
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: "session123",
        userId: "user123",
        token: "token",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(), // Révoquée
        createdAt: new Date(),
        user: {
          id: "user123",
          phone: "+221771234567",
          email: null,
          passwordHash: null,
          systemRole: "USER",
          hasCompletedOnboarding: true,
          isActive: true,
          isSuspended: false,
          suspendedAt: null,
          suspendReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByAgentId: null,
          profiles: [],
        },
      } as any);

      const req = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer valid-token" },
      });

      await expect(requireAuth(req)).rejects.toThrow(AuthError);
      await expect(requireAuth(req)).rejects.toThrow("Session révoquée");
    });

    it("devrait throw AuthError si le compte est suspendu", async () => {
      const { verifyToken } = await import("../jwt");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(verifyToken).mockResolvedValue({
        userId: "user123",
        sessionId: "session123",
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: "session123",
        userId: "user123",
        token: "token",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
        user: {
          id: "user123",
          phone: "+221771234567",
          email: null,
          passwordHash: null,
          systemRole: "USER",
          hasCompletedOnboarding: true,
          isActive: true,
          isSuspended: true, // Suspendu
          suspendedAt: new Date(),
          suspendReason: "Violation des conditions d'utilisation",
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByAgentId: null,
          profiles: [],
        },
      } as any);

      const req = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer valid-token" },
      });

      await expect(requireAuth(req)).rejects.toThrow(AuthError);
      await expect(requireAuth(req)).rejects.toThrow("Violation des conditions d'utilisation");
    });

    it("devrait retourner le user si tout est valide", async () => {
      const { verifyToken } = await import("../jwt");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(verifyToken).mockResolvedValue({
        userId: "user123",
        sessionId: "session123",
      });

      const mockUser = {
        id: "user123",
        phone: "+221771234567",
        email: null,
        passwordHash: null,
        systemRole: "USER",
        hasCompletedOnboarding: true,
        isActive: true,
        isSuspended: false,
        suspendedAt: null,
        suspendReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByAgentId: null,
        profiles: [
          {
            id: "profile123",
            userId: "user123",
            type: "OWNER",
            displayName: "Jean Dupont",
            photoUrl: null,
            bio: null,
            region: "Dakar",
            department: null,
            commune: "Dakar",
            locality: null,
            phoneVisible: false,
            activityArea: null,
            verificationLevels: ["PHONE_VERIFIED"],
            avgResponseHours: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: "session123",
        userId: "user123",
        token: "token",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
        user: mockUser,
      } as any);

      const req = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer valid-token" },
      });

      const user = await requireAuth(req);

      expect(user).toBeDefined();
      expect(user.id).toBe("user123");
      expect(user.profiles).toHaveLength(1);
    });
  });

  describe("requireSystemRole", () => {
    it("devrait throw ForbiddenError si le rôle ne correspond pas", async () => {
      // Setup mock user avec systemRole = USER
      const { verifyToken } = await import("../jwt");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(verifyToken).mockResolvedValue({
        userId: "user123",
        sessionId: "session123",
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: "session123",
        userId: "user123",
        token: "token",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
        user: {
          id: "user123",
          systemRole: "USER", // Pas admin
          isActive: true,
          isSuspended: false,
          hasCompletedOnboarding: true,
          profiles: [],
        } as any,
      } as any);

      const req = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer valid-token" },
      });

      await expect(requireSystemRole(req, "ADMIN")).rejects.toThrow(ForbiddenError);
      await expect(requireSystemRole(req, "ADMIN")).rejects.toThrow("Rôle système requis");
    });

    it("devrait accepter plusieurs rôles", async () => {
      const { verifyToken } = await import("../jwt");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(verifyToken).mockResolvedValue({
        userId: "user123",
        sessionId: "session123",
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: "session123",
        userId: "user123",
        token: "token",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
        user: {
          id: "user123",
          systemRole: "ADMIN",
          isActive: true,
          isSuspended: false,
          hasCompletedOnboarding: true,
          profiles: [],
        } as any,
      } as any);

      const req = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer valid-token" },
      });

      const user = await requireSystemRole(req, ["ADMIN", "SUPER_ADMIN"]);
      expect(user.systemRole).toBe("ADMIN");
    });
  });

  describe("requireProfile", () => {
    it("devrait throw ForbiddenError si le profil n'existe pas", async () => {
      const { verifyToken } = await import("../jwt");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(verifyToken).mockResolvedValue({
        userId: "user123",
        sessionId: "session123",
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: "session123",
        userId: "user123",
        token: "token",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
        user: {
          id: "user123",
          systemRole: "USER",
          isActive: true,
          isSuspended: false,
          hasCompletedOnboarding: true,
          profiles: [
            { id: "profile123", type: "BUYER", isActive: true } as Profile,
          ],
        } as any,
      } as any);

      const req = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer valid-token" },
      });

      await expect(requireProfile(req, "OWNER")).rejects.toThrow(ForbiddenError);
      await expect(requireProfile(req, "OWNER")).rejects.toThrow("Profil OWNER requis");
    });

    it("devrait retourner le profil si il existe", async () => {
      const { verifyToken } = await import("../jwt");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(verifyToken).mockResolvedValue({
        userId: "user123",
        sessionId: "session123",
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: "session123",
        userId: "user123",
        token: "token",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
        user: {
          id: "user123",
          systemRole: "USER",
          isActive: true,
          isSuspended: false,
          hasCompletedOnboarding: true,
          profiles: [
            {
              id: "profile123",
              type: "OWNER",
              displayName: "Jean",
              isActive: true,
            } as Profile,
          ],
        } as any,
      } as any);

      const req = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer valid-token" },
      });

      const profile = await requireProfile(req, "OWNER");
      expect(profile.type).toBe("OWNER");
      expect(profile.id).toBe("profile123");
    });
  });

  describe("getActiveProfile", () => {
    it("devrait throw ForbiddenError si X-Active-Profile manquant", async () => {
      const { verifyToken } = await import("../jwt");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(verifyToken).mockResolvedValue({
        userId: "user123",
        sessionId: "session123",
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: "session123",
        userId: "user123",
        token: "token",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
        user: {
          id: "user123",
          systemRole: "USER",
          isActive: true,
          isSuspended: false,
          hasCompletedOnboarding: true,
          profiles: [],
        } as any,
      } as any);

      const req = new Request("http://localhost/api/test", {
        headers: { Authorization: "Bearer valid-token" },
      });

      await expect(getActiveProfile(req)).rejects.toThrow(ForbiddenError);
      await expect(getActiveProfile(req)).rejects.toThrow("Header X-Active-Profile manquant");
    });

    it("devrait throw ForbiddenError si le profil n'appartient pas au user", async () => {
      const { verifyToken } = await import("../jwt");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(verifyToken).mockResolvedValue({
        userId: "user123",
        sessionId: "session123",
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: "session123",
        userId: "user123",
        token: "token",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
        user: {
          id: "user123",
          systemRole: "USER",
          isActive: true,
          isSuspended: false,
          hasCompletedOnboarding: true,
          profiles: [
            { id: "profile123", type: "OWNER" } as Profile,
          ],
        } as any,
      } as any);

      const req = new Request("http://localhost/api/test", {
        headers: {
          Authorization: "Bearer valid-token",
          "X-Active-Profile": "profile999", // N'existe pas
        },
      });

      await expect(getActiveProfile(req)).rejects.toThrow(ForbiddenError);
      await expect(getActiveProfile(req)).rejects.toThrow(
        "Le profil spécifié n'existe pas ou n'appartient pas à cet utilisateur"
      );
    });

    it("devrait retourner le profil actif si valide", async () => {
      const { verifyToken } = await import("../jwt");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(verifyToken).mockResolvedValue({
        userId: "user123",
        sessionId: "session123",
      });

      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: "session123",
        userId: "user123",
        token: "token",
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
        user: {
          id: "user123",
          systemRole: "USER",
          isActive: true,
          isSuspended: false,
          hasCompletedOnboarding: true,
          profiles: [
            {
              id: "profile123",
              type: "OWNER",
              displayName: "Jean",
              isActive: true,
            } as Profile,
          ],
        } as any,
      } as any);

      const req = new Request("http://localhost/api/test", {
        headers: {
          Authorization: "Bearer valid-token",
          "X-Active-Profile": "profile123",
        },
      });

      const profile = await getActiveProfile(req);
      expect(profile.id).toBe("profile123");
      expect(profile.type).toBe("OWNER");
    });
  });
});
