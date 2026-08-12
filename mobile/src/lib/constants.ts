/**
 * Constantes partagées dans l'application
 * Doivent correspondre aux données du seed et du backend
 */

/**
 * Catégories de production (marché)
 * Synchronisées avec prisma/seed.ts PRODUCTION_CATEGORIES
 */
export const PRODUCTION_CATEGORIES = [
  { label: "Céréales", value: "Céréales" },
  { label: "Légumineuses", value: "Légumineuses" },
  { label: "Légumes", value: "Légumes" },
  { label: "Fruits", value: "Fruits" },
  { label: "Tubercules", value: "Tubercules" },
  { label: "Élevage", value: "Élevage" },
] as const;

/**
 * Types d'opération foncière
 */
export const OPERATION_TYPES = {
  SEASONAL_RENT: "Location saisonnière",
  ANNUAL_RENT: "Location annuelle",
  LONG_TERM_RENT: "Location longue durée",
  SALE: "Vente",
  SHARECROPPING: "Métayage",
  HARVEST_SHARE: "Partage de récolte",
  EXPLOITATION_PARTNERSHIP: "Partenariat",
  INVESTOR_SEARCH: "Recherche investisseur",
  CONVENTIONAL_PROVISION: "Mise à disposition",
} as const;

/**
 * Types d'offre de production
 */
export const OFFER_TYPES = {
  AVAILABLE_NOW: "Disponible maintenant",
  HARVEST_IN_PROGRESS: "Récolte en cours",
  AVAILABLE_SOON: "Bientôt disponible",
  PRE_ORDER: "Précommande",
  WHOLESALE: "Vente en gros",
  RETAIL: "Vente au détail",
  SUPPLY_CONTRACT: "Contrat d'approvisionnement",
  PROCESSED_PRODUCT: "Produit transformé",
  ORGANIC_CERTIFIED: "Certifié bio",
} as const;

/**
 * Régions du Sénégal
 */
export const SENEGAL_REGIONS = [
  "Dakar",
  "Thiès",
  "Diourbel",
  "Fatick",
  "Kaolack",
  "Kaffrine",
  "Kédougou",
  "Kolda",
  "Louga",
  "Matam",
  "Saint-Louis",
  "Sédhiou",
  "Tambacounda",
  "Ziguinchor",
] as const;
