import { useEffect, useState } from "react";
import { FloatingImages } from "./FloatingImages";

export default function SurfaceBackground({
  count = 9,
  spawnEveryMs = 850,
}: {
  count?: number;
  spawnEveryMs?: number;
}) {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    fetch("/api/asset-pool")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const files = Array.isArray(data?.files) ? data.files : [];
        setImages(files);
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
