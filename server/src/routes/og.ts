import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config";
import { renderArtifactHtml } from "../utils/og";
import type { Database } from "../types/supabase";

type SupabaseAdmin = ReturnType<typeof createClient<Database>>;

export default function createOgRouter(supabaseAdmin?: SupabaseAdmin) {
  const router = Router();
  const client =
    supabaseAdmin ?? createClient<Database>(config.supabase.url, config.supabase.serviceRoleKey);

  router.get("/artifact/:artifactId", async (req, res) => {
    const { artifactId } = req.params;
    const redirectPath = `/archives/${artifactId}`;

    try {
      const { data } = await client
        .from("artifacts")
        .select("id, caption, author_handle, image_url")
        .eq("id", artifactId)
        .maybeSingle();

      const html = renderArtifactHtml({
        request: req,
        artifact: data
          ? {
              id: data.id,
              caption: data.caption,
              author_handle: data.author_handle,
              image_url: data.image_url,
            }
          : null,
        redirectPath,
      });

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    } catch (error) {
      const html = renderArtifactHtml({
        request: req,
        artifact: null,
        redirectPath,
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    }
  });

  return router;
}
