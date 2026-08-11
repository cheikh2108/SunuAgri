# Implémentation des Écrans d'Onboarding Web - SunuAgri

## Résumé

Les écrans d'onboarding pour le web Next.js ont été créés avec succès. Ces écrans permettent aux utilisateurs de choisir leur type de profil et de remplir les informations nécessaires après l'inscription.

## Fichiers Créés

### 1. Page de Choix du Profil
**Fichier** : `web/app/(auth)/onboarding/page.tsx`

Écran principal affichant 5 cartes cliquables pour choisir le type de profil :
- 📍 Propriétaire foncier (`/onboarding/owner`)
- 🌾 Producteur agricole (`/onboarding/producer`)
- 🛒 Acheteur (`/onboarding/buyer`)
- 💰 Investisseur (`/onboarding/investor`)
- 🚜 Prestataire agricole (`/onboarding/provider`)

**Fonctionnalités** :
- Design responsive et accessible
- Animations au survol (hover effects)
- Lien "Continuer sans profil" pour navigation limitée
- Intégration des couleurs de la charte graphique SunuAgri

### 2. Formulaire Propriétaire
**Fichier** : `web/app/(auth)/onboarding/owner/page.tsx`

**Champs obligatoires** :
- Nom complet ou raison sociale *
- Région *
- Commune *

**Champs optionnels** :
- Photo de profil (URL)
- Département
- Localité / Quartier

**Validation** :
- Validation côté client avec messages d'erreur clairs
- Selects en cascade (Région → Département → Commune)
- Affichage d'un écran de succès avant redirection

### 3. Formulaire Producteur
**Fichier** : `web/app/(auth)/onboarding/producer/page.tsx`

**Champs obligatoires** :
- Nom complet ou raison sociale *
- Activité principale * (liste déroulante)
- Région *

**Champs optionnels** :
- Photo de profil (URL)
- Département
- Commune
- Localité / Quartier

**Activités disponibles** :
- Cultures céréalières (mil, maïs, riz)
- Cultures maraîchères
- Cultures fruitières
- Arachide
- Élevage bovin
- Élevage ovin/caprin
- Aviculture
- Pisciculture
- Arboriculture
- Et plus...

### 4. Formulaire Acheteur
**Fichier** : `web/app/(auth)/onboarding/buyer/page.tsx`

**Champs obligatoires** :
- Nom complet ou raison sociale *

**Champs optionnels** :
- Photo de profil (URL)
- Type d'activité (ex: Restauration, Distribution, Export)
- Région
- Département
- Commune
- Localité / Quartier

### 5. Formulaire Investisseur
**Fichier** : `web/app/(auth)/onboarding/investor/page.tsx`

**Champs obligatoires** :
- Nom complet ou raison sociale *

**Champs optionnels** :
- Photo de profil (URL)
- Domaines d'intérêt (ex: Agrobusiness, Élevage, Transformation)
- Région
- Département
- Commune
- Localité / Quartier

### 6. Formulaire Prestataire
**Fichier** : `web/app/(auth)/onboarding/provider/page.tsx`

**Champs obligatoires** :
- Nom complet ou raison sociale *
- Type de service * (liste déroulante)

**Champs optionnels** :
- Photo de profil (URL)
- Région
- Département
- Commune
- Localité / Quartier

**Services disponibles** :
- Location d'équipement agricole
- Travaux de labour et préparation du sol
- Irrigation et gestion de l'eau
- Récolte et post-récolte
- Transport de produits agricoles
- Stockage et conservation
- Conseil agronomique
- Formation et accompagnement
- Et plus...

### 7. Données de Localisation
**Fichier** : `web/components/onboarding/location-data.ts`

Contient toutes les données géographiques du Sénégal :
- 14 régions
- Départements par région
- Communes principales par département
- Listes d'activités agricoles
- Types de services prestataires

### 8. Layout Auth
**Fichier** : `web/app/(auth)/layout.tsx`

Layout minimal pour le groupe de routes `(auth)`.

## API Utilisée

L'API `/api/profiles` existe déjà et gère :
- `POST /api/profiles` - Création d'un nouveau profil
- `GET /api/profiles` - Liste des profils de l'utilisateur

**Validation backend** : utilise Zod avec des schémas discriminés par type de profil.

**Authentification** : utilise `getCurrentUser()` pour récupérer l'utilisateur connecté depuis la session JWT.

## Workflow Utilisateur

1. **Après inscription** : L'utilisateur est redirigé vers `/onboarding`
2. **Choix du profil** : L'utilisateur clique sur une des 5 cartes
3. **Remplissage du formulaire** : L'utilisateur remplit les champs obligatoires
4. **Validation** : Le formulaire est validé côté client puis envoyé à l'API
5. **Succès** : Un écran de confirmation s'affiche avec animation
6. **Redirection** : Après 1,5 secondes, redirection vers `/dashboard`

## Fonctionnalités Implémentées

### UX/UI
- ✅ Design responsive (mobile-first)
- ✅ Animations fluides (hover, focus, transitions)
- ✅ États de chargement (spinners)
- ✅ Messages d'erreur contextuels
- ✅ Écran de succès avec animation
- ✅ Bouton retour sur tous les formulaires

### Accessibilité
- ✅ Labels associés aux champs (`htmlFor`)
- ✅ `aria-required` sur les champs obligatoires
- ✅ `role="alert"` sur les messages d'erreur
- ✅ Focus visible (outline)
- ✅ Navigation au clavier

### Validation
- ✅ Validation côté client avant soumission
- ✅ Messages d'erreur en français
- ✅ Champs obligatoires marqués d'un astérisque rouge
- ✅ Désactivation du bouton pendant le chargement

### Données Sénégalaises
- ✅ 14 régions du Sénégal
- ✅ Départements par région
- ✅ Communes principales
- ✅ Sélecteurs en cascade (Région → Département → Commune)
- ✅ Fallback input texte si commune non listée

## Points d'Attention

### TODO : Authentification
Les formulaires utilisent actuellement l'API `/api/profiles` qui attend un utilisateur authentifié. Il faut s'assurer que :
- L'utilisateur est bien redirigé vers `/onboarding` après inscription
- Un middleware vérifie la session JWT
- Le header `X-User-Id` ou la session contient l'ID utilisateur

### TODO : Upload d'Images
Actuellement, les formulaires demandent une URL pour la photo de profil. Pour une meilleure UX, il faudrait :
- Implémenter un upload vers un stockage S3-compatible (Cloudflare R2 / Backblaze B2)
- Ajouter un composant d'upload avec preview
- Gérer la compression et le redimensionnement des images

### TODO : Dashboard
La redirection vers `/dashboard` doit être créée pour afficher :
- Le profil actif de l'utilisateur
- Les actions disponibles selon le type de profil
- Les statistiques (champs publiés, demandes de visite, etc.)

## Prochaines Étapes

1. **Middleware d'authentification** : S'assurer que les routes `/onboarding/*` sont protégées et redirigent vers `/login` si l'utilisateur n'est pas connecté

2. **Redirection automatique** : Ajouter une logique dans le layout ou middleware pour rediriger vers `/onboarding` si `hasCompletedOnboarding = false`

3. **Dashboard** : Créer la page `/dashboard` qui affiche le profil de l'utilisateur et les actions disponibles

4. **Upload d'images** : Implémenter un vrai système d'upload au lieu de demander une URL

5. **Tests** : Ajouter des tests pour les formulaires d'onboarding (validation, soumission, erreurs)

6. **Ajout de profils supplémentaires** : Créer une page `/dashboard/add-profile` pour permettre aux utilisateurs d'ajouter un profil supplémentaire (ex: Propriétaire + Producteur)

## Intégration avec le Mobile

Les mêmes données de localisation peuvent être réutilisées dans l'app mobile React Native en créant un fichier partagé ou en exposant une API `/api/locations` qui retourne :
- Les régions
- Les départements par région
- Les communes par département
- Les activités et services

## Conformité CLAUDE.md

✅ Pas de déviation de la stack technique (Next.js, TypeScript, Tailwind)
✅ Utilisation de l'API existante `/api/profiles`
✅ Validation côté serveur avec Zod (déjà implémentée)
✅ Pas de génération de documents juridiques
✅ Données géographiques réelles du Sénégal
✅ Design cohérent avec la charte graphique (vert SunuAgri + ambre)
✅ Pas de paiement en V1 (conformément au garde-fou)

## Screenshots Attendus

Les écrans devraient ressembler à ceux décrits dans `docs/ONBOARDING_FLOW.md` avec :
- Un design moderne et professionnel
- Des couleurs cohérentes (vert, ambre, bleu, violet, orange selon le profil)
- Une typographie claire et lisible
- Des espacements généreux
- Des animations subtiles

## Support

Pour toute question sur l'implémentation, consulter :
- `docs/ONBOARDING_FLOW.md` - Workflow détaillé
- `web/lib/validations/profile.ts` - Schémas de validation
- `web/app/api/profiles/route.ts` - API de création de profils
- `web/prisma/schema.prisma` - Modèles de données
