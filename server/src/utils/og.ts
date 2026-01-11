import type { Request } from "express";

type ArtifactMeta = {
  id: string;
  caption: string | null;
  author_handle: string | null;
  image_url: string | null;
};

type RenderOptions = {
  request: Request;
  artifact: ArtifactMeta | null;
  redirectPath: string;
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function resolveSiteUrl(req: Request): string {
  const envUrl = process.env.SITE_URL;
  if (envUrl) return normalizeBaseUrl(envUrl);
  const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = req.headers.host || "localhost";
  return `${protocol}://${host}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildTitle(artifact: ArtifactMeta | null): string {
  if (!artifact) return "HORNY — Artifact";
  const name = artifact.caption?.trim() || "Artifact";
  const creator = artifact.author_handle?.trim() || "Anonymous";
  return `HORNY — ${name} by ${creator}`;
}

function buildDescription(artifact: ArtifactMeta | null): string {
  if (!artifact) return "Explore THE HORNY ARCHIVES.";
  const name = artifact.caption?.trim() || "an artifact";
  const creator = artifact.author_handle?.trim() || "Anonymous";
  const description = `Discover "${name}" by ${creator} in THE HORNY ARCHIVES.`;
  return description.length > 160 ? `${description.slice(0, 157)}...` : description;
}

export function renderArtifactHtml({ request, artifact, redirectPath }: RenderOptions): string {
  const siteUrl = resolveSiteUrl(request);
  const canonicalUrl = `${siteUrl}${redirectPath}`;
  const shareUrl = `${siteUrl}/artifact/${artifact?.id ?? ""}`;
  const title = escapeHtml(buildTitle(artifact));
  const description = escapeHtml(buildDescription(artifact));
  const imageUrl = artifact?.image_url ?? null;

  const metaImage = imageUrl ? `\n    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />` : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${escapeHtml(shareUrl)}" />${metaImage}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />${metaImage}
    <meta http-equiv="refresh" content="0; url=${escapeHtml(canonicalUrl)}" />
  </head>
  <body>
    <noscript>
      <p>Redirecting to <a href="${escapeHtml(canonicalUrl)}">artifact</a>...</p>
    </noscript>
    <script>
      window.location.replace(${JSON.stringify(canonicalUrl)});
    </script>
  </body>
</html>`;
}
