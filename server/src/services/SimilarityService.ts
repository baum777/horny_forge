import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { config } from '../config';

const HASH_SIZE = 8;
const HASH_BITS = HASH_SIZE * HASH_SIZE;

export interface SimilarityResult {
  baseMatchId: string | null;
  similarity: number;
  distance: number;
}

export class SimilarityService {
  private baseHashes = new Map<string, bigint>();
  private ready: Promise<void>;

  constructor() {
    this.ready = this.loadBaseHashes();
  }

  private async loadBaseHashes(): Promise<void> {
    const baseDir = path.resolve(config.baseImages.path);
    let entries: string[] = [];
    try {
      entries = await fs.readdir(baseDir);
    } catch (error) {
      console.warn('Failed to read base images directory:', error);
      return;
    }

    const baseFiles = entries.filter((entry) => entry.toLowerCase().endsWith('.png'));

    await Promise.all(
      baseFiles.map(async (fileName) => {
        const match = fileName.match(/base-\d{2}/i);
        if (!match) return;
        const baseId = match[0].toLowerCase();
        try {
          const buffer = await fs.readFile(path.join(baseDir, fileName));
          const hash = await this.computeHash(buffer);
          this.baseHashes.set(baseId, hash);
        } catch (error) {
          console.warn(`Failed to hash base image ${fileName}:`, error);
        }
      }),
    );
  }

  private async computeHash(imageBytes: Buffer): Promise<bigint> {
    const { data } = await sharp(imageBytes)
      .resize(HASH_SIZE + 1, HASH_SIZE, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let hash = 0n;
    let bitIndex = 0;

    for (let y = 0; y < HASH_SIZE; y += 1) {
      const rowStart = y * (HASH_SIZE + 1);
      for (let x = 0; x < HASH_SIZE; x += 1) {
        const left = data[rowStart + x] ?? 0;
        const right = data[rowStart + x + 1] ?? 0;
        if (left > right) {
          hash |= 1n << BigInt(HASH_BITS - bitIndex - 1);
        }
        bitIndex += 1;
      }
    }

    return hash;
  }

  private hammingDistance(a: bigint, b: bigint): number {
    let value = a ^ b;
    let distance = 0;
    while (value > 0n) {
      distance += Number(value & 1n);
      value >>= 1n;
    }
    return distance;
  }

  async compareToBase(imageBytes: Buffer): Promise<SimilarityResult> {
    await this.ready;

    if (this.baseHashes.size === 0) {
      return {
        baseMatchId: null,
        similarity: 0,
        distance: HASH_BITS,
      };
    }

    const imageHash = await this.computeHash(imageBytes);

    let bestMatchId: string | null = null;
    let bestDistance = HASH_BITS;

    for (const [baseId, baseHash] of this.baseHashes.entries()) {
      const distance = this.hammingDistance(imageHash, baseHash);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatchId = baseId;
      }
    }

    const similarity = 1 - bestDistance / HASH_BITS;

    return {
      baseMatchId: bestMatchId,
      similarity,
      distance: bestDistance,
    };
  }
}
