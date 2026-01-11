import OpenAI from "openai";
import { getBaseImagePath } from "./promptEngine";
import type { BaseId } from "./promptEngine";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImage(params: {
  prompt: string;
  baseId: BaseId;
}): Promise<{ url: string; revised_prompt?: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const baseImagePath = getBaseImagePath(params.baseId);
  // In production, this should be a full URL to the base image
  // For now, we'll use the prompt with base reference
  const baseImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${baseImagePath}`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: params.prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL returned from OpenAI");
    }

    return {
      url: imageUrl,
      revised_prompt: response.data[0]?.revised_prompt,
    };
  } catch (error: any) {
    console.error("OpenAI image generation error:", error);
    throw new Error(error.message || "Failed to generate image");
  }
}

