import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { uploadFile, isValidImageType, isValidFileSize } from "@/lib/storage";

/**
 * POST /api/media/upload
 * Upload a single image file
 * Requires authentication
 * Returns: { mediaId: string, url: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const ctx = await getAuthContext(req);
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    // Validate file type
    if (!isValidImageType(file.type)) {
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Formats acceptés : JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (!isValidFileSize(file.size, 10)) {
      return NextResponse.json(
        { error: "Fichier trop volumineux. Taille maximale : 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3/R2
    const { url, key } = await uploadFile(buffer, file.name, file.type, folder);

    // Return response with mediaId (key) and public URL
    return NextResponse.json(
      {
        mediaId: key,
        url: url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors du téléchargement du fichier" },
      { status: 500 }
    );
  }
}
