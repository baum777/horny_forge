// Mock price feed with random walk simulation

export interface PriceData {
  price: number;
  marketCap: number;
  change24h: number;
  hornyVelocity: number;
  timestamp: number;
}

type Subscriber = (data: PriceData) => void;

class MockFeedService {
  private subscribers: Set<Subscriber> = new Set();
  private intervalId: NodeJS.Timeout | null = null;
  private currentData: PriceData;
  private basePrice: number;
  
  constructor() {
    this.basePrice = 0.00042069;
    this.currentData = {
      price: this.basePrice,
      marketCap: this.basePrice * 1_000_000_000,
      change24h: 0,
      hornyVelocity: 50,
      timestamp: Date.now(),
    };
  }
  
  private generateRandomWalk(): PriceData {
    // Random walk with momentum
    const volatility = 0.02; // 2% max change per tick
    const momentum = (Math.random() - 0.48) * volatility; // Slight upward bias
    
    const newPrice = this.currentData.price * (1 + momentum);
    const priceChange = ((newPrice - this.basePrice) / this.basePrice) * 100;
    
    // Horny velocity based on absolute momentum
    const velocity = Math.min(100, Math.max(0, 50 + Math.abs(momentum) * 2500 * (momentum > 0 ? 1 : -1)));
    
    this.currentData = {
      price: Math.max(0.00000001, newPrice),
      marketCap: newPrice * 1_000_000_000,
      change24h: priceChange,
      hornyVelocity: velocity,
      timestamp: Date.now(),
    };
    
    return this.currentData;
  }
  
  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    
    // Start the feed if this is the first subscriber
    if (this.subscribers.size === 1) {
      this.start();
    }
    
    // Immediately send current data
    callback(this.currentData);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.stop();
      }
    };
  }
  
  private start(): void {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      const data = this.generateRandomWalk();
      this.subscribers.forEach(callback => callback(data));
    }, 5000); // Update every 5 seconds
  }
  
  private stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  getCurrentData(): PriceData {
    return this.currentData;
  }
  
  // Force an update (useful for testing)
  forceUpdate(): void {
    const data = this.generateRandomWalk();
    this.subscribers.forEach(callback => callback(data));
  }
}

// Singleton instance
export const mockFeed = new MockFeedService();

// Format helpers
export function formatPrice(price: number): string {
  if (price < 0.0001) {
    return price.toExponential(4);
  }
  return price.toFixed(8);
}

export function formatMarketCap(cap: number): string {
  if (cap >= 1_000_000_000) {
    return `$${(cap / 1_000_000_000).toFixed(2)}B`;
  }
  if (cap >= 1_000_000) {
    return `$${(cap / 1_000_000).toFixed(2)}M`;
  }
  if (cap >= 1_000) {
    return `$${(cap / 1_000).toFixed(2)}K`;
  }
  return `$${cap.toFixed(2)}`;
}

export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

// Velocity interpretation
export function getVelocityLabel(velocity: number): string {
  if (velocity >= 90) return 'PARABOLIC';
  if (velocity >= 70) return 'UNSTABLE DESIRE';
  if (velocity >= 50) return 'ELEVATED';
  if (velocity >= 30) return 'WARMING UP';
  return 'DORMANT';
}
