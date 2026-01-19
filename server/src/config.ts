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
    path: process.env.BASE_IMAGES_PATH || './server/public/horny_base',
  },
  themes: {
    defaultThemeId: process.env.DEFAULT_THEME_ID || 'default',
    baseUrl: process.env.THEME_BASE_URL || '/themes',
    hostnameMap: parseHostnameMap(process.env.THEME_HOSTNAME_MAP),
  },
};

type RequiredEnvOptions = {
  allowMissingOpenAi?: boolean;
};

function parseHostnameMap(value?: string): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, val]) => {
      if (typeof val === 'string') {
        acc[key] = val;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function resolveTokenIdentifier() {
  return (
    process.env.TOKEN_MINT ||
    process.env.NEXT_PUBLIC_TOKEN_MINT ||
    process.env.VITE_TOKEN_MINT ||
    process.env.TOKEN_PAIR ||
    process.env.DEX_LINK ||
    process.env.NEXT_PUBLIC_DEX_LINK ||
    process.env.VITE_DEX_LINK ||
    ''
  );
}

export function validateRequiredEnv(options: RequiredEnvOptions = {}) {
  const missing: string[] = [];

  if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!process.env.SHARE_TOKEN_SECRET) missing.push('SHARE_TOKEN_SECRET');
  if (!process.env.SITE_URL) missing.push('SITE_URL');

  if (!options.allowMissingOpenAi && !process.env.OPENAI_API_KEY) {
    missing.push('OPENAI_API_KEY');
  }

  if (!resolveTokenIdentifier()) {
    missing.push('TOKEN_MINT or TOKEN_PAIR/DEX_LINK');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
