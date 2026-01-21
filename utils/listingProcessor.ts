// src/utils/listingProcessor.ts

// Price parsing helper
export function parsePrice(p: any): number {
  if (typeof p === 'number') return p;
  if (!p) return 0;
  const str = String(p);
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 0;
  
  // Handle crores and lakhs
  if (str.toLowerCase().includes('cr')) {
    return num * 10000000;
  }
  if (str.toLowerCase().includes('l') || str.toLowerCase().includes('lakh')) {
    return num * 100000;
  }
  if (str.toLowerCase().includes('k')) {
    return num * 1000;
  }
  
  return num;
}

// Calculate statistics from a list of prices
export function calculateListingStats(prices: number[]) {
  if (!prices || prices.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      count: 0
    };
  }

  const validPrices = prices.filter(p => p > 0);
  if (validPrices.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      count: 0
    };
  }

  const sorted = [...validPrices].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = sorted.reduce((acc, p) => acc + p, 0);
  const avg = sum / sorted.length;
  
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  return {
    min,
    max,
    avg,
    median,
    count: validPrices.length
  };
}

// Format price for display
export function formatPrice(price: number): string {
  if (price >= 10000000) {
    return `₹${(price / 10000000).toFixed(2)} Cr`;
  }
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)} L`;
  }
  if (price >= 1000) {
    return `₹${(price / 1000).toFixed(0)}K`;
  }
  return `₹${price.toLocaleString('en-IN')}`;
}

// Extract BHK from property description
export function extractBHK(text: string): string | null {
  const bhkMatch = text.match(/(\d+)\s*(bhk|bedroom)/i);
  return bhkMatch ? `${bhkMatch[1]} BHK` : null;
}

// Extract square footage from text
export function extractSqft(text: string): number | null {
  const sqftMatch = text.match(/(\d+(?:,\d+)?)\s*(?:sq\.?\s*ft|sqft|square\s*feet)/i);
  if (sqftMatch) {
    return parseInt(sqftMatch[1].replace(/,/g, ''));
  }
  return null;
}
