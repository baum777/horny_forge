import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { nanoid } from 'nanoid';

export interface PreviewStorageResult {
  previewUrl: string;
  generationId: string;
}

export interface ReleaseStorageParams {
  generationId: string;
  imageBytes: Buffer;
  userId: string;
}

export interface ReleaseStorageResult {
  artifactId: string;
  imageUrl: string;
}

export class StorageAdapter {
  private supabase;

  constructor() {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('Supabase credentials not configured');
    }
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }

  /**
   * Stores preview image in ephemeral preview bucket.
   */
  async storePreview(imageBytes: Buffer): Promise<PreviewStorageResult> {
    const generationId = `gen_${nanoid()}`;
    const objectName = `previews/${generationId}.png`;

    try {
      const { error } = await this.supabase.storage
        .from('forge_previews')
        .upload(objectName, imageBytes, {
          contentType: 'image/png',
          upsert: false,
        });

      if (error) {
        throw new Error(`Preview storage failed: ${error.message}`);
      }

      const { data } = this.supabase.storage
        .from('forge_previews')
        .getPublicUrl(objectName);

      return {
        previewUrl: data.publicUrl,
        generationId,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Preview storage failed: ${message}`);
    }
  }

  /**
   * Moves preview to permanent artifacts storage and returns artifact info.
   */
  async releaseArtifact(params: ReleaseStorageParams): Promise<ReleaseStorageResult> {
    const { generationId, imageBytes, userId } = params;
    const artifactId = nanoid();
    const objectName = `artifacts/${userId}/${artifactId}.png`;

    try {
      // Upload to permanent storage
      const { error: uploadError } = await this.supabase.storage
        .from('artifacts')
        .upload(objectName, imageBytes, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Artifact storage failed: ${uploadError.message}`);
      }

      const { data } = this.supabase.storage
        .from('artifacts')
        .getPublicUrl(objectName);

      return {
        artifactId,
        imageUrl: data.publicUrl,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Artifact release failed: ${message}`);
    }
  }

  /**
   * Retrieves preview image bytes by generation ID.
   */
  async getPreviewBytes(generationId: string): Promise<Buffer> {
    const objectName = `previews/${generationId}.png`;

    try {
      const { data, error } = await this.supabase.storage
        .from('forge_previews')
        .download(objectName);

      if (error || !data) {
        throw new Error(`Preview not found: ${generationId}`);
      }

      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve preview: ${message}`);
    }
  }
}

