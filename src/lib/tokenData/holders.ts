// Holders data provider (optional, default OFF)
// Currently returns null as no provider is configured

// Placeholder for future holder provider integrations
// Supported providers: 'none' | 'solscan' | 'helius'

const PROVIDERS = {
  none: null,
  solscan: null, // Would require SOLSCAN_API_KEY
  helius: null,  // Would require HELIUS_API_KEY
};

export type HoldersProvider = keyof typeof PROVIDERS;

// Get current provider from env (defaults to 'none')
export function getHoldersProvider(): HoldersProvider {
  return 'none';
}

// Fetch holders count - returns null if provider is not configured
export async function fetchHolders(): Promise<number | null> {
  const provider = getHoldersProvider();
  
  if (provider === 'none') {
    return null;
  }
  
  // Future implementation for other providers
  // For now, always return null
  return null;
}
