import { Router, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';

export const assetPoolRouter = Router();

const handleAssetPool = (_req: Request, res: Response) => {
  const dir = path.join(process.cwd(), 'server', 'public', 'horny_base');

  let files: string[] = [];
  try {
    files = fs
      .readdirSync(dir)
      .filter((file) => /^base-.*\.(png|jpe?g|webp|gif)$/i.test(file))
      .sort((a, b) => a.localeCompare(b))
      .map((file) => `/horny_base/${file}`);
  } catch {
    files = [];
  }

  res.json({ files });
};

assetPoolRouter.get('/meme-pool', handleAssetPool);
assetPoolRouter.get('/asset-pool', handleAssetPool);
