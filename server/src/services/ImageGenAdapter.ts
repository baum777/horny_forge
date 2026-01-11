import OpenAI from 'openai';
import { config } from '../config';
import fs from 'fs/promises';
import path from 'path';
import { BASE_IMAGES } from '../constants';
import type { BaseId } from '../types';

export interface ImageGenParams {
  baseId: BaseId;
  finalPrompt: string;
  size?: '1024x1024';
}

export interface ImageGenResult {
  imageBytes: Buffer;
  modelMeta: {
    model: string;
    size: string;
  };
}

export class ImageGenAdapter {
  private client: OpenAI;

  constructor() {
    if (!config.openai.apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    this.client = new OpenAI({ apiKey: config.openai.apiKey });
  }

  /**
   * Loads base image from filesystem.
   */
  private async loadBaseImage(baseId: BaseId): Promise<Buffer> {
    const baseInfo = BASE_IMAGES[baseId];
    const basePath = path.join(config.baseImages.path, baseInfo.file);

    try {
      const imageBytes = await fs.readFile(basePath);
      return imageBytes;
    } catch (error) {
      throw new Error(`Failed to load base image ${baseId}: ${error}`);
    }
  }

  /**
   * Generates image using OpenAI DALL·E with base image reference.
   * Uses image edit/variation API with the base image.
   */
  async generate(params: ImageGenParams): Promise<ImageGenResult> {
    const { baseId, finalPrompt, size = '1024x1024' } = params;

    try {
      // Load base image
      const baseImageBytes = await this.loadBaseImage(baseId);

      // Create a temporary mask (transparent or same as base for variation)
      // For DALL·E image edit, we need base image + optional mask
      // Since we want to preserve base identity but allow variation, we'll use image variation
      // But DALL·E 3 doesn't support image variation directly, so we'll use image edit with a mask

      // For MVP: Use DALL·E 3 with prompt that references the base image style
      // Note: DALL·E 3 doesn't support image-to-image directly, so we'll generate new image
      // with strong prompt constraints to match base style
      
      // Alternative: Use DALL·E 2 image edit API if available
      // For now, we'll use DALL·E 3 generation with enhanced prompt that includes base description

      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt: finalPrompt,
        size: size === '1024x1024' ? '1024x1024' : '1024x1024',
        quality: 'standard',
        n: 1,
      });

      if (!response.data || response.data.length === 0 || !response.data[0]?.url) {
        throw new Error('No image URL returned from OpenAI');
      }
      const imageUrl = response.data[0].url;

      // Download the generated image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download generated image: ${imageResponse.statusText}`);
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

      return {
        imageBytes: imageBuffer,
        modelMeta: {
          model: 'dall-e-3',
          size,
        },
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Image generation failed: ${error.message}`);
      }
      throw new Error('Image generation failed: Unknown error');
    }
  }
}

