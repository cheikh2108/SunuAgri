# Spécification API - Profils Utilisateur

## Endpoint: `POST /api/profiles`

Crée un nouveau profil pour l'utilisateur connecté.

### Authentication

Requiert un token JWT valide dans le header `Authorization: Bearer <token>`.

### Headers

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### Request Body (FormData)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `type` | string | ✅ | Type de profil: `OWNER`, `PRODUCER`, `BUYER`, `INVESTOR`, `PROVIDER` |
| `displayName` | string | ✅ | Nom complet ou raison sociale |
| `region` | string | ✅ | Région (ex: "Dakar", "Thiès") |
| `department` | string | ⬜ | Département (optionnel) |
| `commune` | string | Conditionnel | Requis pour OWNER et PRODUCER |
| `locality` | string | ⬜ | Localité précise (optionnel) |
| `activityArea` | string | Conditionnel | Requis pour PRODUCER (ex: "Cultures maraîchères") |
| `buyerType` | string | ⬜ | Type d'acheteur (optionnel) |
| `investorType` | string | ⬜ | Type d'investisseur (optionnel) |
| `productInterests` | string (JSON array) | ⬜ | Produits recherchés (Acheteur) |
| `investmentInterests` | string (JSON array) | ⬜ | Domaines d'intérêt (Investisseur) |
| `services` | string (JSON array) | Conditionnel | Requis pour PROVIDER |
| `interventionZones` | string (JSON array) | ⬜ | Zones d'intervention (Producteur/Prestataire) |
| `photo` | File | ⬜ | Image de profil (JPEG/PNG, max 5MB) |

### Exemples de requêtes

#### Propriétaire (OWNER)

```typescript
const formData = new FormData();
formData.append("type", "OWNER");
formData.append("displayName", "Moussa Diop");
formData.append("region", "Thiès");
formData.append("department", "Thiès");
formData.append("commune", "Thiès Ouest");
formData.append("locality", "Mbour 2");
formData.append("photo", {
  uri: "file:///...",
  name: "profile.jpg",
  type: "image/jpeg"
});

const response = await fetch(`${API_URL}/api/profiles`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "multipart/form-data"
  },
  body: formData
});
```

#### Producteur (PRODUCER)

```typescript
const formData = new FormData();
formData.append("type", "PRODUCER");
formData.append("displayName", "Awa Sène");
formData.append("activityArea", "Cultures maraîchères");
formData.append("region", "Thiès");
formData.append("commune", "Thiès Nord");
formData.append("interventionZones", JSON.stringify(["Dakar", "Thiès", "Diourbel"]));
```

#### Prestataire (PROVIDER)

```typescript
const formData = new FormData();
formData.append("type", "PROVIDER");
formData.append("displayName", "Ibrahima Fall");
formData.append("region", "Dakar");
formData.append("services", JSON.stringify([
  "Labour et préparation du sol",
  "Irrigation",
  "Location de matériel"
]));
formData.append("interventionZones", JSON.stringify(["Dakar", "Thiès"]));
```

### Response (Success - 201 Created)

```json
{
  "profile": {
    "id": "cljx5y2wz0000le08abcd1234",
    "userId": "cljx5y2wz0000le08user5678",
    "type": "OWNER",
    "displayName": "Moussa Diop",
    "photoUrl": "https://r2.sunuagri.sn/profiles/cljx5y2wz0000le08abcd1234.jpg",
    "region": "Thiès",
    "department": "Thiès",
    "commune": "Thiès Ouest",
    "locality": "Mbour 2",
    "isActive": true,
    "isVerified": false,
    "verificationStatus": "PENDING",
    "createdAt": "2026-08-11T10:30:00.000Z",
    "updatedAt": "2026-08-11T10:30:00.000Z"
  }
}
```

### Erreurs possibles

#### 400 Bad Request - Champs manquants

```json
{
  "error": "Validation échouée",
  "details": {
    "displayName": "Le nom est requis",
    "region": "La région est requise",
    "commune": "La commune est requise pour un profil OWNER"
  }
}
```

#### 400 Bad Request - Type de profil invalide

```json
{
  "error": "Type de profil invalide",
  "message": "Le type doit être OWNER, PRODUCER, BUYER, INVESTOR ou PROVIDER"
}
```

#### 409 Conflict - Profil déjà existant

```json
{
  "error": "Profil déjà existant",
  "message": "Vous avez déjà un profil de type OWNER"
}
```

#### 413 Payload Too Large - Image trop grande

```json
{
  "error": "Fichier trop volumineux",
  "message": "La taille maximale autorisée est 5MB"
}
```

#### 401 Unauthorized

```json
{
  "error": "Non authentifié",
  "message": "Token invalide ou expiré"
}
```

---

## Endpoint: `GET /api/auth/me`

Récupère les informations de l'utilisateur connecté, incluant l'état de l'onboarding.

### Response (Success - 200 OK)

```json
{
  "user": {
    "id": "cljx5y2wz0000le08user5678",
    "phone": "+221781234567",
    "email": null,
    "hasCompletedOnboarding": true,
    "systemRole": "USER",
    "profiles": [
      {
        "id": "cljx5y2wz0000le08abcd1234",
        "type": "OWNER",
        "displayName": "Moussa Diop",
        "photoUrl": "https://r2.sunuagri.sn/profiles/cljx5y2wz0000le08abcd1234.jpg",
        "isActive": true
      }
    ],
    "createdAt": "2026-08-10T08:00:00.000Z"
  }
}
```

---

## Endpoint: `GET /api/profiles`

Liste tous les profils de l'utilisateur connecté.

### Response (Success - 200 OK)

```json
{
  "profiles": [
    {
      "id": "cljx5y2wz0000le08abcd1234",
      "type": "OWNER",
      "displayName": "Moussa Diop",
      "photoUrl": "https://...",
      "region": "Thiès",
      "commune": "Thiès Ouest",
      "isActive": true,
      "isVerified": true,
      "createdAt": "2026-08-10T08:00:00.000Z"
    },
    {
      "id": "cljx5y2wz0000le08abcd5678",
      "type": "PRODUCER",
      "displayName": "Moussa Diop - Producteur",
      "photoUrl": "https://...",
      "region": "Thiès",
      "activityArea": "Cultures maraîchères",
      "isActive": true,
      "isVerified": false,
      "createdAt": "2026-08-11T10:00:00.000Z"
    }
  ]
}
```

---

## Modèle Prisma attendu

```prisma
model Profile {
  id                  String   @id @default(cuid())
  userId              String
  type                ProfileType
  displayName         String
  photoUrl            String?
  
  // Localisation
  region              String
  department          String?
  commune             String?
  locality            String?
  
  // Champs spécifiques par type
  activityArea        String?  // PRODUCER
  buyerType           String?  // BUYER
  investorType        String?  // INVESTOR
  productInterests    String[] // BUYER (array)
  investmentInterests String[] // INVESTOR (array)
  services            String[] // PROVIDER (array)
  interventionZones   String[] // PRODUCER, PROVIDER (array)
  
  // Métadonnées
  isActive            Boolean  @default(true)
  isVerified          Boolean  @default(false)
  verificationStatus  VerificationStatus @default(PENDING)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, type])
  @@index([userId])
  @@index([type])
  @@index([region])
}

enum ProfileType {
  OWNER
  PRODUCER
  BUYER
  INVESTOR
  PROVIDER
}

enum VerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}
```

---

## Contraintes de validation

### Côté backend (impératif)

1. **Unicité** : Un utilisateur ne peut avoir qu'un seul profil de chaque type
2. **Champs requis** : 
   - Tous profils : `type`, `displayName`, `region`
   - OWNER : `commune`
   - PRODUCER : `activityArea`, `commune`
   - PROVIDER : `services` (au moins 1)
3. **Upload photo** :
   - Formats acceptés : JPEG, PNG, WebP
   - Taille max : 5MB
   - Redimensionner automatiquement à 512x512px
4. **Stockage** : Uploader la photo vers R2/S3, retourner l'URL publique
5. **Mise à jour User** : Si c'est le premier profil, `hasCompletedOnboarding = true`

### Validation des données

```typescript
import { z } from "zod";

const createProfileSchema = z.object({
  type: z.enum(["OWNER", "PRODUCER", "BUYER", "INVESTOR", "PROVIDER"]),
  displayName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  region: z.string().min(1, "La région est requise"),
  department: z.string().optional(),
  commune: z.string().optional(),
  locality: z.string().optional(),
  activityArea: z.string().optional(),
  buyerType: z.string().optional(),
  investorType: z.string().optional(),
  productInterests: z.array(z.string()).optional(),
  investmentInterests: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
  interventionZones: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if (data.type === "OWNER" || data.type === "PRODUCER") {
      return !!data.commune;
    }
    return true;
  },
  { message: "La commune est requise pour ce type de profil", path: ["commune"] }
).refine(
  (data) => {
    if (data.type === "PRODUCER") {
      return !!data.activityArea;
    }
    return true;
  },
  { message: "L'activité est requise pour un producteur", path: ["activityArea"] }
).refine(
  (data) => {
    if (data.type === "PROVIDER") {
      return data.services && data.services.length > 0;
    }
    return true;
  },
  { message: "Sélectionnez au moins un service", path: ["services"] }
);
```

---

## Workflow d'implémentation backend

### Étape 1 : Créer la route `POST /api/profiles`

```typescript
// web/src/app/api/profiles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { uploadToR2 } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await req.formData();
    
    // Parse et valide les données
    const data = {
      type: formData.get("type") as string,
      displayName: formData.get("displayName") as string,
      region: formData.get("region") as string,
      department: formData.get("department") as string | null,
      commune: formData.get("commune") as string | null,
      locality: formData.get("locality") as string | null,
      activityArea: formData.get("activityArea") as string | null,
      buyerType: formData.get("buyerType") as string | null,
      investorType: formData.get("investorType") as string | null,
      productInterests: formData.get("productInterests") 
        ? JSON.parse(formData.get("productInterests") as string) 
        : [],
      investmentInterests: formData.get("investmentInterests")
        ? JSON.parse(formData.get("investmentInterests") as string)
        : [],
      services: formData.get("services")
        ? JSON.parse(formData.get("services") as string)
        : [],
      interventionZones: formData.get("interventionZones")
        ? JSON.parse(formData.get("interventionZones") as string)
        : [],
    };

    // Validation avec Zod
    const validated = createProfileSchema.parse(data);

    // Vérifier qu'un profil de ce type n'existe pas déjà
    const existing = await prisma.profile.findUnique({
      where: {
        userId_type: {
          userId: user.id,
          type: validated.type as any,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Profil déjà existant", message: `Vous avez déjà un profil de type ${validated.type}` },
        { status: 409 }
      );
    }

    // Upload de la photo si fournie
    let photoUrl: string | null = null;
    const photo = formData.get("photo") as File | null;
    if (photo) {
      photoUrl = await uploadToR2(photo, `profiles/${user.id}`);
    }

    // Créer le profil
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        type: validated.type as any,
        displayName: validated.displayName,
        photoUrl,
        region: validated.region,
        department: validated.department,
        commune: validated.commune,
        locality: validated.locality,
        activityArea: validated.activityArea,
        buyerType: validated.buyerType,
        investorType: validated.investorType,
        productInterests: validated.productInterests ?? [],
        investmentInterests: validated.investmentInterests ?? [],
        services: validated.services ?? [],
        interventionZones: validated.interventionZones ?? [],
      },
    });

    // Mettre à jour hasCompletedOnboarding si c'est le premier profil
    const profileCount = await prisma.profile.count({
      where: { userId: user.id },
    });

    if (profileCount === 1) {
      await prisma.user.update({
        where: { id: user.id },
        data: { hasCompletedOnboarding: true },
      });
    }

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation échouée", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Error creating profile:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
```

### Étape 2 : Mettre à jour `GET /api/auth/me`

```typescript
// Inclure les profils dans la réponse
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    profiles: {
      where: { isActive: true },
      select: {
        id: true,
        type: true,
        displayName: true,
        photoUrl: true,
        isActive: true,
      },
    },
  },
});
```

---

## Tests recommandés

### Tests unitaires

- ✅ Validation des champs requis par type de profil
- ✅ Contrainte d'unicité userId + type
- ✅ Upload et redimensionnement de photo
- ✅ Mise à jour de `hasCompletedOnboarding`

### Tests d'intégration

- ✅ Flux complet : Inscription → OTP → Création profil → Dashboard
- ✅ Création de plusieurs profils pour le même utilisateur
- ✅ Tentative de doublon (même type)
- ✅ Création sans photo
- ✅ Upload photo volumineuse (> 5MB) → rejet

---

## Checklist d'implémentation

- [ ] Créer la migration Prisma pour le modèle Profile
- [ ] Implémenter `POST /api/profiles` avec validation Zod
- [ ] Configurer l'upload vers R2/S3
- [ ] Mettre à jour `GET /api/auth/me` pour inclure les profils
- [ ] Ajouter la contrainte unique `@@unique([userId, type])`
- [ ] Tester tous les types de profils
- [ ] Documenter les erreurs possibles
- [ ] Mettre à jour les tests E2E
