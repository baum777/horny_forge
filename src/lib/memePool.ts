// src/lib/memePool.ts
const modules = import.meta.glob<string>(
  "../assets/horny-meme-pool/*.{png,jpg,jpeg,webp,gif}",
  { eager: true, import: "default" }
);

export const HORNY_MEME_POOL: string[] = Object.values(modules);

