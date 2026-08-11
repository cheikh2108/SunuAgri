import { z } from "zod";

// Champs communs à tous les types de profils
const baseProfileSchema = z.object({
  displayName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  photoUrl: z.string().url("URL invalide").optional(),
  bio: z.string().max(500, "La bio ne peut pas dépasser 500 caractères").optional(),
  phoneVisible: z.boolean().default(false),
});

// Schéma pour propriétaire foncier (OWNER)
export const createOwnerProfileSchema = baseProfileSchema.extend({
  type: z.literal("OWNER"),
  region: z.string().min(1, "La région est obligatoire"),
  department: z.string().optional(),
  commune: z.string().min(1, "La commune est obligatoire"),
  locality: z.string().optional(),
});

// Schéma pour producteur agricole (PRODUCER)
export const createProducerProfileSchema = baseProfileSchema.extend({
  type: z.literal("PRODUCER"),
  activityArea: z.string().min(1, "Le domaine d'activité est obligatoire"),
  region: z.string().min(1, "La région est obligatoire"),
  department: z.string().optional(),
  commune: z.string().optional(),
  locality: z.string().optional(),
});

// Schéma pour acheteur (BUYER)
export const createBuyerProfileSchema = baseProfileSchema.extend({
  type: z.literal("BUYER"),
  activityArea: z.string().optional(),
  region: z.string().optional(),
  department: z.string().optional(),
  commune: z.string().optional(),
  locality: z.string().optional(),
});

// Schéma pour investisseur (INVESTOR)
export const createInvestorProfileSchema = baseProfileSchema.extend({
  type: z.literal("INVESTOR"),
  activityArea: z.string().optional(),
  region: z.string().optional(),
  department: z.string().optional(),
  commune: z.string().optional(),
  locality: z.string().optional(),
});

// Schéma pour prestataire agricole (PROVIDER)
export const createProviderProfileSchema = baseProfileSchema.extend({
  type: z.literal("PROVIDER"),
  activityArea: z.string().min(1, "Le type de service est obligatoire"),
  region: z.string().optional(),
  department: z.string().optional(),
  commune: z.string().optional(),
  locality: z.string().optional(),
});

// Schéma unifié pour la création de profils (discriminated union)
export const createProfileSchema = z.discriminatedUnion("type", [
  createOwnerProfileSchema,
  createProducerProfileSchema,
  createBuyerProfileSchema,
  createInvestorProfileSchema,
  createProviderProfileSchema,
]);

// Schéma pour la mise à jour de profils (tous les champs optionnels sauf type)
export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  photoUrl: z.string().url().nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  region: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  commune: z.string().nullable().optional(),
  locality: z.string().nullable().optional(),
  phoneVisible: z.boolean().optional(),
  activityArea: z.string().nullable().optional(),
});

// Types TypeScript dérivés
export type CreateOwnerProfile = z.infer<typeof createOwnerProfileSchema>;
export type CreateProducerProfile = z.infer<typeof createProducerProfileSchema>;
export type CreateBuyerProfile = z.infer<typeof createBuyerProfileSchema>;
export type CreateInvestorProfile = z.infer<typeof createInvestorProfileSchema>;
export type CreateProviderProfile = z.infer<typeof createProviderProfileSchema>;
export type CreateProfile = z.infer<typeof createProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
