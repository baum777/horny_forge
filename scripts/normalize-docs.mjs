import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "docs");
const replacements = [
  [/\$HORNY/g, "$TOKEN"],
  [/\bHORNY\b/g, "BRAND"],
  [/\bHorny\b/g, "Brand"],
  [/\bhorny\b/g, "brand"],
  [/\bhorny_base\b/g, "base_assets"],
  [/\bHORNY_MINT_ADDRESS\b/g, "TOKEN_MINT_ADDRESS"],
  [/\bHORNY_CORE_SKETCH\b/g, "PRESET_CORE"],
  [/\bHORNY_META_SCENE\b/g, "PRESET_META"],
  [/\bHORNY_CHAOS_VARIATION\b/g, "PRESET_CHAOS"],
  [/\bhorny_coherence_score\b/g, "brand_coherence_score"],
  [/\bhornyMatrix\b/g, "promptMatrix"],
  [/\bHornyMatrix\b/g, "PromptMatrix"],
  [/\bhorny_matrix\b/g, "prompt_matrix"],
  [/\bMemePromptComposer\b/g, "PromptComposer"],
  [/\bMemeTemplateKey\b/g, "TemplateKey"],
  [/\bMemeGenRequest\b/g, "PromptGenRequest"],
  [/\bMemeGenPromptPack\b/g, "PromptGenPack"],
  [/\bmeme_context\b/g, "content_context"],
  [/\bcreate_published_meme\b/g, "create_published_item"],
  [/\bset_meme_hidden\b/g, "set_content_hidden"],
  [/\binvalidate_rewards_linked_to_meme\b/g, "invalidate_rewards_linked_to_content"],
  [/\bupdate_meme_aggregates\b/g, "update_content_aggregates"],
  [/\bpublished_meme_id\b/g, "published_item_id"],
  [/\bfrozen_for_meme\b/g, "frozen_for_content"],
  [/\bhorny_coherence_high\b/g, "brand_coherence_high"],
  [/\bmemePool\b/g, "assetPool"],
  [/\bmeme-pool\b/g, "asset-pool"],
  [/\bpublished_memes\b/g, "published_items"],
  [/\bpublished_meme\b/g, "published_item"],
  [/\bmemeId\b/g, "contentId"],
  [/\bmeme_id\b/g, "content_id"],
  [/\bmeme_ratings\b/g, "content_ratings"],
  [/\bmeme_reports\b/g, "content_reports"],
  [/\bpublish_meme\b/g, "publish_content"],
  [/\brate_meme_first\b/g, "rate_content_first"],
  [/\brate_meme_update\b/g, "rate_content_update"],
  [/\breport_meme\b/g, "report_content"],
  [/\bmeme_create\b/g, "content_create"],
  [/\bmeme_readability\b/g, "content_readability"],
  [/\bchart_meme\b/g, "chart_content"],
  [/\bmemeability\b/gi, "shareability"],
  [/\bmemeable\b/gi, "shareable"],
  [/\bmemetauglich\b/gi, "teilbar"],
  [/\bmemefizieren\b/gi, "variieren"],
  [/\bMEME_/g, "CONTENT_"],
  [/\bMeme_/g, "Content_"],
  [/\bmeme_/g, "content_"],
  [/\bMEMES\b/g, "CONTENT ITEMS"],
  [/\bMemes\b/g, "Content items"],
  [/\bmemes\b/g, "content items"],
  [/\bMEME\b/g, "CONTENT"],
  [/\bMeme\b/g, "Content"],
  [/\bmeme\b/g, "content"],
  [/\bmemecoin\b/gi, "token"],
];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const files = walk(root).filter((file) => file.endsWith(".md"));
for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  let updated = content;
  for (const [pattern, replacement] of replacements) {
    updated = updated.replace(pattern, replacement);
  }
  if (updated !== content) {
    fs.writeFileSync(file, updated, "utf8");
  }
}

