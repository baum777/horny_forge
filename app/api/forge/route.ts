import { NextResponse } from "next/server";
import { processPrompt, type BaseId, type Preset } from "@/lib/forge/promptEngine";
import { generateImage } from "@/lib/forge/openaiImage";
import { uploadPreviewImage } from "@/lib/forge/storage";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { processEvent } from "@/lib/gamification/eventProcessor";
import { z } from "zod";

const forgeRequestSchema = z.object({
  base_id: z.enum(["base-01", "base-02", "base-03", "base-04"]),
  preset: z.enum(["HORNY_CORE_SKETCH", "HORNY_META_SCENE", "HORNY_CHAOS_VARIATION"]),
  user_input: z.string().min(3).max(240),
});

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    const body = await request.json();
    const validated = forgeRequestSchema.parse(body);

    // Process prompt with guardrails
    const promptResult = processPrompt({
      preset: validated.preset as Preset,
      userInput: validated.user_input,
      baseId: validated.base_id as BaseId,
    });

    // Generate image
    const imageResult = await generateImage({
      prompt: promptResult.final_prompt,
      baseId: validated.base_id as BaseId,
    });

    // Upload preview to Supabase Storage
    const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const previewUrl = await uploadPreviewImage(imageResult.url, generationId);

    // Award XP for forge_generate (if authenticated)
    if (user) {
      try {
        const supabase = await createClient();
        await processEvent(supabase, {
          userId: user.id,
          eventType: "forge_generate",
          meta: {
            base_id: validated.base_id,
            preset: validated.preset,
          },
        });
      } catch (xpError) {
        // Don't fail the request if XP processing fails
        console.error("Failed to process XP event:", xpError);
      }
    }

    return NextResponse.json({
      generation_id: generationId,
      base_id: validated.base_id,
      preset: validated.preset,
      sanitized_input: promptResult.sanitized_input,
      image_url: previewUrl,
      created_at: new Date().toISOString(),
      meta: {
        expires_in_seconds: 3600,
        model: "dall-e-3",
        size: "1024x1024",
      },
      ...(process.env.DEBUG === "true" && {
        debug: {
          final_prompt: promptResult.final_prompt,
        },
      }),
    });
  } catch (error: any) {
    console.error("Forge error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}

