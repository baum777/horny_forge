// Static list of images with transparency
// This list should be updated when new images are added
// To check transparency, use the check-transparency utility

// Load all PNG files (JPG files cannot have transparency)
const modules = import.meta.glob<string>(
  "../assets/horny-meme-pool/*.png",
  { eager: true, import: "default" }
);

export const ALL_PNG_IMAGES: string[] = Object.values(modules);

// This will be populated at runtime with images that actually have transparency
export let TRANSPARENT_IMAGES: string[] = [];

// Function to initialize transparent images list
export async function initializeTransparentImages() {
  const { filterTransparentImages } = await import('./checkTransparencyOnLoad');
  TRANSPARENT_IMAGES = await filterTransparentImages(ALL_PNG_IMAGES);
  return TRANSPARENT_IMAGES;
}

