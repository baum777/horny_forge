import { createServiceClient } from "@/lib/supabase/server";

export async function uploadPreviewImage(imageUrl: string, generationId: string): Promise<string> {
  // Download image from URL
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error("Failed to download image");
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const supabase = await createServiceClient();
  const fileName = `preview-${generationId}-${Date.now()}.png`;

  const { data, error } = await supabase.storage
    .from("forge_previews")
    .upload(fileName, buffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("forge_previews")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function movePreviewToArtifacts(previewUrl: string, artifactId: string): Promise<string> {
  const supabase = await createServiceClient();
  
  // Extract path from preview URL
  const previewPath = previewUrl.split("/storage/v1/object/public/forge_previews/")[1];
  if (!previewPath) {
    throw new Error("Invalid preview URL");
  }

  // Download from preview bucket
  const { data: downloadData, error: downloadError } = await supabase.storage
    .from("forge_previews")
    .download(previewPath);

  if (downloadError) {
    throw new Error(`Failed to download preview: ${downloadError.message}`);
  }

  const arrayBuffer = await downloadData.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to artifacts bucket
  const fileName = `artifact-${artifactId}-${Date.now()}.png`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("artifacts")
    .upload(fileName, buffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload artifact: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("artifacts")
    .getPublicUrl(uploadData.path);

  return urlData.publicUrl;
}

