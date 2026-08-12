# ✅ Checklist de Synchronisation SunuAgri

Ce document liste les fichiers qui doivent rester synchronisés. Quand vous modifiez l'un, vérifiez les autres.

## 📦 Catégories de Production

**Sources de vérité :**
1. `web/prisma/seed.ts` → `PRODUCTION_CATEGORIES`
2. `mobile/src/lib/constants.ts` → `PRODUCTION_CATEGORIES`
3. `mobile/app/(app)/(tabs)/market.tsx` → `CATEGORIES`

**Catégories actuelles :**
- Céréales
- Légumineuses
- Légumes
- Fruits
- Tubercules
- Élevage

---

## 🏞️ Types d'Opération Foncière

**Sources de vérité :**
1. `web/prisma/schema.prisma` → `enum FieldOperationType`
2. `mobile/src/lib/constants.ts` → `OPERATION_TYPES`
3. `mobile/app/(app)/(tabs)/index.tsx` → `OP_LABELS`

**Types actuels :**
- SEASONAL_RENT (Location saisonnière)
- ANNUAL_RENT (Location annuelle)
- LONG_TERM_RENT (Location longue durée)
- SALE (Vente)
- SHARECROPPING (Métayage)
- HARVEST_SHARE (Partage de récolte)
- EXPLOITATION_PARTNERSHIP (Partenariat)
- INVESTOR_SEARCH (Recherche investisseur)
- CONVENTIONAL_PROVISION (Mise à disposition)

---

## 📱 Types d'Offre de Production

**Sources de vérité :**
1. `web/prisma/schema.prisma` → `enum ProductionOfferType`
2. `mobile/src/lib/constants.ts` → `OFFER_TYPES`
3. `mobile/app/(app)/(tabs)/market.tsx` → `OFFER_TYPES`

---

## 🌍 Régions du Sénégal

**Sources de vérité :**
1. `web/prisma/seed.ts` → `LOCATIONS` (contient région/département/commune)
2. `mobile/src/lib/constants.ts` → `SENEGAL_REGIONS`
3. `mobile/app/(app)/(tabs)/index.tsx` → `REGIONS`
4. `mobile/app/(app)/(tabs)/market.tsx` → `REGIONS`

---

## 🔄 Procédure d'Ajout

### Ajouter une nouvelle catégorie de production :

1. ✅ Ajouter dans `web/prisma/seed.ts` → `PRODUCTION_CATEGORIES`
2. ✅ Mettre à jour `mobile/src/lib/constants.ts`
3. ✅ Relancer le seed : `npm run db:seed`
4. ✅ Vérifier que les filtres affichent la nouvelle catégorie

### Ajouter un nouveau type d'opération :

1. ✅ Ajouter dans `web/prisma/schema.prisma` → `enum FieldOperationType`
2. ✅ Mettre à jour `mobile/src/lib/constants.ts`
3. ✅ Mettre à jour `mobile/app/(app)/(tabs)/index.tsx` → `OP_LABELS`
4. ✅ Relancer Prisma : `npx prisma generate`
5. ✅ Mettre à jour le seed si nécessaire

---

## ⚠️ Rappels Importants

- **Ne jamais** ajouter de données dans le seed sans mettre à jour les filtres
- **Ne jamais** modifier un enum Prisma sans mettre à jour le mobile
- **Toujours** tester les filtres après modification
- **Toujours** vérifier que les 3 sources sont synchronisées
