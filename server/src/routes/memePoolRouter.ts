import { Router } from "express";
import fs from "node:fs";
import path from "node:path";

const memePoolRouter = Router();

memePoolRouter.get("/meme-pool", (_req, res) => {
  const dir = path.join(process.cwd(), "public", "horny-meme-pool");

  try {
    const files = fs
      .readdirSync(dir)
      .filter((file) => /^base-.*\.(png|jpe?g|webp|gif)$/i.test(file))
      .sort((a, b) => a.localeCompare(b))
      .map((file) => `/horny-meme-pool/${file}`);

    return res.json({ files });
  } catch (error) {
    return res.json({ files: [] });
  }
});

export default memePoolRouter;
