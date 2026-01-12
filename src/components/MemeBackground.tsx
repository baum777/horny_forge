import { useEffect, useState } from "react";
import { FloatingImages } from "./FloatingImages";
import { buildMemePoolUrl } from "@/lib/memePool";

export default function MemeBackground({
  count = 9,
  spawnEveryMs = 850,
}: {
  count?: number;
  spawnEveryMs?: number;
}) {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    fetch("/api/meme-pool")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const files = Array.isArray(data?.files) ? data.files : [];
        setImages(files.map((file: string) => buildMemePoolUrl(file)));
      })
      .catch(() => {
        if (!active) return;
        setImages([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <FloatingImages
      images={images}
      maxOnScreen={count}
      spawnEveryMs={spawnEveryMs}
      minDurationMs={7000}
      maxDurationMs={14000}
      minWidthPx={80}
      maxWidthPx={190}
      edgePaddingPx={24}
    />
  );
}
