import { getToken } from "./api";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000";

interface UploadResult {
  mediaId: string;
  url: string;
}

interface UploadProgress {
  total: number;
  uploaded: number;
  percentage: number;
}

/**
 * Upload a single image file to the backend
 */
export async function uploadImage(
  fileUri: string,
  folder = "uploads"
): Promise<{ data: UploadResult | null; error: string | null }> {
  try {
    const token = await getToken();

    // Create FormData
    const formData = new FormData();

    // Extract filename from URI
    const filename = fileUri.split("/").pop() || "photo.jpg";

    // Create file object for upload
    const file = {
      uri: fileUri,
      type: "image/jpeg", // Default to JPEG, could be detected from extension
      name: filename,
    } as any;

    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch(`${BASE_URL}/api/media/upload`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        // Don't set Content-Type - let the browser/native platform set it with boundary
      },
      body: formData,
    });

    const json = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: json?.error || `Erreur ${response.status}`,
      };
    }

    return { data: json, error: null };
  } catch (error) {
    console.error("Upload error:", error);
    return { data: null, error: "Erreur lors du téléchargement" };
  }
}

/**
 * Upload multiple images with progress tracking
 */
export async function uploadImages(
  fileUris: string[],
  folder = "uploads",
  onProgress?: (progress: UploadProgress) => void
): Promise<{ data: UploadResult[] | null; error: string | null }> {
  const results: UploadResult[] = [];
  const total = fileUris.length;

  for (let i = 0; i < fileUris.length; i++) {
    const uri = fileUris[i];

    // Report progress
    if (onProgress) {
      onProgress({
        total,
        uploaded: i,
        percentage: (i / total) * 100,
      });
    }

    const { data, error } = await uploadImage(uri, folder);

    if (error || !data) {
      return {
        data: null,
        error: error || `Erreur lors du téléchargement de l'image ${i + 1}`,
      };
    }

    results.push(data);
  }

  // Report 100% completion
  if (onProgress) {
    onProgress({
      total,
      uploaded: total,
      percentage: 100,
    });
  }

  return { data: results, error: null };
}
