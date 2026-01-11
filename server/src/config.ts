import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  forge: {
    previewTtlSeconds: parseInt(process.env.PREVIEW_TTL_SECONDS || '3600', 10),
    rateLimit: {
      anonymous: parseInt(process.env.FORGE_RATE_LIMIT_ANONYMOUS || '3', 10),
      authenticated: parseInt(process.env.FORGE_RATE_LIMIT_AUTHENTICATED || '12', 10),
      windowMs: parseInt(process.env.FORGE_RATE_LIMIT_WINDOW_MS || '600000', 10), // 10 min
    },
    releaseRateLimitPerDay: parseInt(process.env.RELEASE_RATE_LIMIT_PER_DAY || '20', 10),
    brandSimilarityThreshold: parseFloat(process.env.BRAND_SIMILARITY_THRESHOLD || '0.82'),
  },
  
  baseImages: {
    path: process.env.BASE_IMAGES_PATH || './public/bases',
  },
};

// Validate required config
if (!config.openai.apiKey) {
  console.warn('⚠️  OPENAI_API_KEY not set');
}

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  console.warn('⚠️  Supabase credentials not set');
}
