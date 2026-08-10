-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('OWNER', 'PRODUCER', 'BUYER', 'INVESTOR', 'PROVIDER', 'AGENT', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('NONE', 'PHONE_VERIFIED', 'EMAIL_VERIFIED', 'ID_VERIFIED', 'ORG_VERIFIED', 'LOCATION_VERIFIED', 'FIELD_VISITED');

-- CreateEnum
CREATE TYPE "FieldOperationType" AS ENUM ('SEASONAL_RENT', 'ANNUAL_RENT', 'LONG_TERM_RENT', 'SALE', 'SHARECROPPING', 'HARVEST_SHARE', 'EXPLOITATION_PARTNERSHIP', 'INVESTOR_SEARCH', 'CONVENTIONAL_PROVISION');

-- CreateEnum
CREATE TYPE "LandDocumentType" AS ENUM ('TITLE_DEED', 'LEASE', 'DELIBERATION', 'ATTRIBUTION_CERTIFICATE', 'ADMINISTRATIVE_ACT', 'CUSTOMARY_DOCUMENT', 'CONTRACT', 'NO_FORMAL_DOCUMENT');

-- CreateEnum
CREATE TYPE "FieldVerificationLevel" AS ENUM ('UNVERIFIED', 'OWNER_ID_VERIFIED', 'LOCATION_VERIFIED', 'DOCUMENTS_REVIEWED', 'FIELD_VISITED', 'SUNUAGRI_VERIFIED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_VALIDATION', 'PUBLISHED', 'REJECTED', 'EXPIRED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VisitRequestStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'REFUSED', 'RESCHEDULED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'COUNTER_PROPOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartnershipType" AS ENUM ('PROFIT_SHARING', 'HARVEST_SHARING', 'JOINT_EXPLOITATION', 'POST_HARVEST_RENT', 'EQUIPMENT_FINANCING', 'PRODUCTION_CONTRACT');

-- CreateEnum
CREATE TYPE "ProductionOfferType" AS ENUM ('AVAILABLE_NOW', 'HARVEST_IN_PROGRESS', 'AVAILABLE_SOON', 'PRE_ORDER', 'WHOLESALE', 'RETAIL', 'SUPPLY_CONTRACT', 'PROCESSED_PRODUCT', 'ORGANIC_CERTIFIED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('REQUEST_SENT', 'REQUEST_RECEIVED', 'IN_DISCUSSION', 'VISIT_SCHEDULED', 'OFFER_TRANSMITTED', 'COUNTER_PROPOSAL', 'OFFER_ACCEPTED', 'CONTRACT_PREPARATION', 'PAYMENT_PENDING', 'COMPLETED', 'CANCELLED', 'DISPUTE_REPORTED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "ReportMotif" AS ENUM ('FALSE_LISTING', 'FALSE_OWNER', 'SUSPICIOUS_DOCUMENTS', 'SCAM_ATTEMPT', 'NON_COMPLIANT_PRODUCT', 'ABUSIVE_BEHAVIOR', 'SUSPICIOUS_ACCOUNT', 'USER_DISPUTE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" TIMESTAMP(3),
    "suspendReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAgentId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ProfileType" NOT NULL,
    "displayName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "bio" TEXT,
    "region" TEXT,
    "department" TEXT,
    "commune" TEXT,
    "locality" TEXT,
    "phoneVisible" BOOLEAN NOT NULL DEFAULT false,
    "activityArea" TEXT,
    "verificationLevels" "VerificationLevel"[] DEFAULT ARRAY['NONE']::"VerificationLevel"[],
    "avgResponseHours" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceFingerprint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "operationType" "FieldOperationType" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "verificationLevel" "FieldVerificationLevel" NOT NULL DEFAULT 'UNVERIFIED',
    "region" TEXT NOT NULL,
    "department" TEXT,
    "commune" TEXT NOT NULL,
    "locality" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "areaSqm" DOUBLE PRECISION NOT NULL,
    "areaUnit" TEXT NOT NULL DEFAULT 'ha',
    "price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "isPriceNegotiable" BOOLEAN NOT NULL DEFAULT false,
    "paymentConditions" TEXT,
    "rentalDurationDays" INTEGER,
    "availableFrom" TIMESTAMP(3),
    "soilType" TEXT,
    "suitableCrops" TEXT[],
    "waterAvailability" BOOLEAN NOT NULL DEFAULT false,
    "hasIrrigation" BOOLEAN NOT NULL DEFAULT false,
    "hasRoadAccess" BOOLEAN NOT NULL DEFAULT false,
    "hasElectricity" BOOLEAN NOT NULL DEFAULT false,
    "hasFencing" BOOLEAN NOT NULL DEFAULT false,
    "hasBuildings" BOOLEAN NOT NULL DEFAULT false,
    "specialConditions" TEXT,
    "expiresAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldDocument" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "documentType" "LandDocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldMedia" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitRequest" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "visitorProfileId" TEXT NOT NULL,
    "status" "VisitRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "visitorCount" INTEGER NOT NULL DEFAULT 1,
    "message" TEXT,
    "needsAgentHelp" BOOLEAN NOT NULL DEFAULT false,
    "responseMessage" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisitRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "senderProfileId" TEXT NOT NULL,
    "targetProfileId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "durationDays" INTEGER,
    "startDate" TIMESTAMP(3),
    "paymentMode" TEXT,
    "agriculturalProject" TEXT,
    "plannedCrops" TEXT[],
    "specialConditions" TEXT,
    "partnershipType" "PartnershipType",
    "counterAmount" DOUBLE PRECISION,
    "responseMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Production" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "variety" TEXT,
    "offerType" "ProductionOfferType" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "quantityAvailable" DOUBLE PRECISION NOT NULL,
    "quantityUnit" TEXT NOT NULL,
    "minOrderQuantity" DOUBLE PRECISION,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "isPriceNegotiable" BOOLEAN NOT NULL DEFAULT false,
    "quality" TEXT,
    "caliber" TEXT,
    "productionMode" TEXT,
    "harvestDate" TIMESTAMP(3),
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "region" TEXT NOT NULL,
    "department" TEXT,
    "commune" TEXT,
    "storageConditions" TEXT,
    "deliveryModes" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionMedia" (
    "id" TEXT NOT NULL,
    "productionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "productionId" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "quantity" DOUBLE PRECISION NOT NULL,
    "proposedPrice" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "desiredDate" TIMESTAMP(3),
    "deliveryLocation" TEXT,
    "frequency" TEXT,
    "qualityRequirements" TEXT,
    "paymentConditions" TEXT,
    "responseMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyNeed" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "quantityUnit" TEXT NOT NULL,
    "quality" TEXT,
    "frequency" TEXT,
    "budget" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "deadline" TIMESTAMP(3),
    "deliveryLocation" TEXT,
    "paymentConditions" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'PUBLISHED',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'REQUEST_SENT',
    "offerId" TEXT,
    "purchaseRequestId" TEXT,
    "confirmedBySeller" BOOLEAN NOT NULL DEFAULT false,
    "confirmedByBuyer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionEvent" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderProfileId" TEXT NOT NULL,
    "content" TEXT,
    "attachmentUrl" TEXT,
    "attachmentType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "fieldId" TEXT,
    "productionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "authorProfileId" TEXT NOT NULL,
    "targetProfileId" TEXT NOT NULL,
    "transactionId" TEXT,
    "reliability" INTEGER NOT NULL,
    "conformity" INTEGER NOT NULL,
    "punctuality" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "commitment" INTEGER NOT NULL,
    "comment" TEXT,
    "isModerated" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "authorProfileId" TEXT NOT NULL,
    "motif" "ReportMotif" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reportedProfileId" TEXT,
    "reportedFieldId" TEXT,
    "reportedProductionId" TEXT,
    "attachmentUrl" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_type_idx" ON "Profile"("type");

-- CreateIndex
CREATE INDEX "Profile_region_commune_idx" ON "Profile"("region", "commune");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_type_key" ON "Profile"("userId", "type");

-- CreateIndex
CREATE INDEX "OtpCode_userId_idx" ON "OtpCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_hash_idx" ON "DeviceFingerprint"("hash");

-- CreateIndex
CREATE INDEX "DeviceFingerprint_userId_idx" ON "DeviceFingerprint"("userId");

-- CreateIndex
CREATE INDEX "Field_profileId_idx" ON "Field"("profileId");

-- CreateIndex
CREATE INDEX "Field_status_idx" ON "Field"("status");

-- CreateIndex
CREATE INDEX "Field_region_commune_idx" ON "Field"("region", "commune");

-- CreateIndex
CREATE INDEX "Field_operationType_idx" ON "Field"("operationType");

-- CreateIndex
CREATE INDEX "Field_price_idx" ON "Field"("price");

-- CreateIndex
CREATE INDEX "FieldDocument_fieldId_idx" ON "FieldDocument"("fieldId");

-- CreateIndex
CREATE INDEX "FieldMedia_fieldId_idx" ON "FieldMedia"("fieldId");

-- CreateIndex
CREATE INDEX "VisitRequest_fieldId_idx" ON "VisitRequest"("fieldId");

-- CreateIndex
CREATE INDEX "VisitRequest_visitorProfileId_idx" ON "VisitRequest"("visitorProfileId");

-- CreateIndex
CREATE INDEX "VisitRequest_status_idx" ON "VisitRequest"("status");

-- CreateIndex
CREATE INDEX "Offer_fieldId_idx" ON "Offer"("fieldId");

-- CreateIndex
CREATE INDEX "Offer_senderProfileId_idx" ON "Offer"("senderProfileId");

-- CreateIndex
CREATE INDEX "Offer_targetProfileId_idx" ON "Offer"("targetProfileId");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- CreateIndex
CREATE INDEX "Production_profileId_idx" ON "Production"("profileId");

-- CreateIndex
CREATE INDEX "Production_status_idx" ON "Production"("status");

-- CreateIndex
CREATE INDEX "Production_category_idx" ON "Production"("category");

-- CreateIndex
CREATE INDEX "Production_region_idx" ON "Production"("region");

-- CreateIndex
CREATE INDEX "Production_quantityAvailable_idx" ON "Production"("quantityAvailable");

-- CreateIndex
CREATE INDEX "ProductionMedia_productionId_idx" ON "ProductionMedia"("productionId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_productionId_idx" ON "PurchaseRequest"("productionId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_buyerProfileId_idx" ON "PurchaseRequest"("buyerProfileId");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status");

-- CreateIndex
CREATE INDEX "SupplyNeed_profileId_idx" ON "SupplyNeed"("profileId");

-- CreateIndex
CREATE INDEX "SupplyNeed_category_idx" ON "SupplyNeed"("category");

-- CreateIndex
CREATE INDEX "SupplyNeed_status_idx" ON "SupplyNeed"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_offerId_key" ON "Transaction"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_purchaseRequestId_key" ON "Transaction"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "TransactionEvent_transactionId_idx" ON "TransactionEvent"("transactionId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_profileId_idx" ON "ConversationParticipant"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_profileId_key" ON "ConversationParticipant"("conversationId", "profileId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderProfileId_idx" ON "Message"("senderProfileId");

-- CreateIndex
CREATE INDEX "Notification_profileId_idx" ON "Notification"("profileId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Favorite_profileId_idx" ON "Favorite"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_profileId_fieldId_key" ON "Favorite"("profileId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_profileId_productionId_key" ON "Favorite"("profileId", "productionId");

-- CreateIndex
CREATE INDEX "Review_targetProfileId_idx" ON "Review"("targetProfileId");

-- CreateIndex
CREATE INDEX "Review_authorProfileId_idx" ON "Review"("authorProfileId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_authorProfileId_idx" ON "Report"("authorProfileId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdByAgentId_fkey" FOREIGN KEY ("createdByAgentId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpCode" ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceFingerprint" ADD CONSTRAINT "DeviceFingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldDocument" ADD CONSTRAINT "FieldDocument_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldMedia" ADD CONSTRAINT "FieldMedia_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitRequest" ADD CONSTRAINT "VisitRequest_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitRequest" ADD CONSTRAINT "VisitRequest_visitorProfileId_fkey" FOREIGN KEY ("visitorProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_senderProfileId_fkey" FOREIGN KEY ("senderProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_targetProfileId_fkey" FOREIGN KEY ("targetProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Production" ADD CONSTRAINT "Production_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMedia" ADD CONSTRAINT "ProductionMedia_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyNeed" ADD CONSTRAINT "SupplyNeed_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionEvent" ADD CONSTRAINT "TransactionEvent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderProfileId_fkey" FOREIGN KEY ("senderProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorProfileId_fkey" FOREIGN KEY ("authorProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetProfileId_fkey" FOREIGN KEY ("targetProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_authorProfileId_fkey" FOREIGN KEY ("authorProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedProfileId_fkey" FOREIGN KEY ("reportedProfileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedFieldId_fkey" FOREIGN KEY ("reportedFieldId") REFERENCES "Field"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedProductionId_fkey" FOREIGN KEY ("reportedProductionId") REFERENCES "Production"("id") ON DELETE SET NULL ON UPDATE CASCADE;
