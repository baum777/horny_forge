// Runtime check for image transparency
// This will be called once on app initialization to filter transparent images

export async function checkImageTransparency(imageSrc: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          resolve(false);
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Sample pixels (check every 100th pixel for performance)
        const sampleRate = 100;
        for (let i = 3; i < data.length; i += 4 * sampleRate) {
          if (data[i] < 255) {
            resolve(true);
            return;
          }
        }
        
        resolve(false);
      } catch (error) {
        // If CORS or other issues, assume no transparency
        resolve(false);
      }
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    img.src = imageSrc;
  });
}

export async function filterTransparentImages(imageSources: string[]): Promise<string[]> {
  const results = await Promise.all(
    imageSources.map(async (src) => {
      const hasTransparency = await checkImageTransparency(src);
      return { src, hasTransparency };
    })
  );
  
  return results
    .filter(({ hasTransparency }) => hasTransparency)
    .map(({ src }) => src);
}

