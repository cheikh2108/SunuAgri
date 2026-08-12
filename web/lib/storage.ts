import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

// Configure S3-compatible client (supports Cloudflare R2, Backblaze B2, etc.)
const s3Client = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION || "auto",
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },
});

const STORAGE_BUCKET = process.env.STORAGE_BUCKET!;
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL!;

interface UploadResult {
  url: string;
  key: string;
}

/**
 * Upload a file to S3-compatible storage
 * @param file - File buffer
 * @param originalName - Original filename
 * @param contentType - MIME type
 * @param folder - Optional folder prefix (e.g., "fields", "productions", "profiles")
 */
export async function uploadFile(
  file: Buffer,
  originalName: string,
  contentType: string,
  folder = "uploads"
): Promise<UploadResult> {
  // Validate environment variables
  if (!STORAGE_BUCKET || !STORAGE_PUBLIC_URL) {
    throw new Error("Storage configuration missing. Check environment variables.");
  }

  // Generate unique filename
  const ext = originalName.split(".").pop() || "jpg";
  const filename = `${randomBytes(16).toString("hex")}.${ext}`;
  const key = `${folder}/${filename}`;

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: "public-read", // Make files publicly readable
  });

  await s3Client.send(command);

  // Construct public URL
  const url = `${STORAGE_PUBLIC_URL}/${key}`;

  return { url, key };
}

/**
 * Validate file type for image uploads
 */
export function isValidImageType(contentType: string): boolean {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  return validTypes.includes(contentType.toLowerCase());
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(size: number, maxSizeMB = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size <= maxBytes;
}
