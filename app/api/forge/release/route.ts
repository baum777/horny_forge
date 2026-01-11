import { NextResponse } from "next/server";
import { getServerUser, getUserProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { movePreviewToArtifacts } from "@/lib/forge/storage";
import { processEvent } from "@/lib/gamification/eventProcessor";
import { z } from "zod";

const releaseRequestSchema = z.object({
  generation_id: z.string(),
  caption: z.string().max(140).optional(),
  tags: z.array(z.string()).min(1).max(3),
});

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = releaseRequestSchema.parse(body);

    const supabase = await createClient();
    const profile = getUserProfile(user);
    
    // image_url should be passed in the request body from the client
    const imageUrl = body.image_url;
    if (!imageUrl) {
      return NextResponse.json(
        { error: "image_url is required" },
        { status: 400 }
      );
    }
    
    const { data: artifact, error: insertError } = await supabase
      .from("artifacts")
      .insert({
        image_url: imageUrl,
        caption: validated.caption || "Untitled Artifact",
        tags: validated.tags,
        author_id: profile.id,
        author_handle: profile.handle,
        author_avatar: profile.avatar,
        votes_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create artifact: ${insertError.message}`);
    }

    // Award XP for artifact_release
    try {
      await processEvent(supabase, {
        userId: profile.id,
        eventType: "artifact_release",
        artifactId: artifact.id,
        meta: {
          tags: validated.tags,
        },
      });
    } catch (xpError) {
      // Don't fail the request if XP processing fails
      console.error("Failed to process XP event:", xpError);
    }

    return NextResponse.json({
      artifact_id: artifact.id,
      image_url: artifact.image_url,
      redirect_url: `/archives/${artifact.id}`,
    });
  } catch (error: any) {
    console.error("Release error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to release artifact" },
      { status: 500 }
    );
  }
}

