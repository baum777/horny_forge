import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { processEvent, type ProcessEventParams } from "@/lib/gamification/eventProcessor";
import { z } from "zod";

const eventRequestSchema = z.object({
  type: z.enum([
    "forge_generate",
    "artifact_release",
    "vote_cast",
    "vote_received",
    "share_click",
    "daily_return",
    "streak_bonus",
  ]),
  artifact_id: z.string().uuid().optional(),
  meta: z.record(z.unknown()).optional(),
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
    const validated = eventRequestSchema.parse(body);

    const supabase = await createClient();

    // For vote_received, extract recipientUserId from meta
    const recipientUserId = validated.type === "vote_received" && validated.meta?.author_id
      ? (validated.meta.author_id as string)
      : undefined;

    // Process the event
    const result = await processEvent(supabase, {
      userId: user.id,
      eventType: validated.type,
      artifactId: validated.artifact_id,
      meta: validated.meta,
      recipientUserId,
    } as ProcessEventParams);

    return NextResponse.json({
      xp_added: result.xpAdded,
      new_level: result.newLevel,
      new_badges: result.newBadges,
      daily_xp_used: result.dailyXPUsed,
    });
  } catch (error: any) {
    console.error("Event processing error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to process event" },
      { status: 500 }
    );
  }
}

