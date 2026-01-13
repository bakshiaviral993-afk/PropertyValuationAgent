import { SaleListing, RentalListing } from '../types';

/**
 * Robust price parser with range handling and unit detection.
 * Handles: "₹3.5 Cr", "45 - 50 Lakhs", "12,000", "1.2 Crore"
 */
export const parsePrice = (priceStr: any): number => {
  if (priceStr === null || priceStr === undefined || priceStr === '') return 0;
  
  const s = String(priceStr)
    .replace(/[^0-9.\-lLcrkCR]/g, ' ')
    .trim()
    .toLowerCase();

  // Handle ranges: take the median of the range for statistical accuracy
  if (s.includes('-') || s.includes('–')) {
    const parts = s.split(/[-–]/);
    const low = parsePrice(parts[0]);
    const high = parsePrice(parts[1]);
    return low > 0 && high > 0 ? (low + high) / 2 : low || high;
  }

  const numMatch = s.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return 0;
  
  let value = parseFloat(numMatch[1]);
  
  // Unit multipliers
  if (s.includes('cr') || s.includes('crore')) value *= 10000000;
  else if (s.includes('l') || s.includes('lakh')) value *= 100000;
  else if (s.includes('k') || s.includes('thousand')) value *= 1000;
  
  return Math.round(value);
};

export interface PropertyStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  variance: number;
  count: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
}

export const calculateListingStats = (prices: number[]): PropertyStats | null => {
  if (prices.length === 0) return null;
  
  const sorted = [...prices].sort((a, b) => a - b);
  const count = prices.length;
  const sum = prices.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  
  const median = count % 2 === 0 
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 
    : sorted[Math.floor(count / 2)];
    
  const getQuartile = (p: number) => {
    const pos = (count - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sorted[base + 1] !== undefined 
      ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
      : sorted[base];
  };

  const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count;

  return {
    mean,
    median,
    min: sorted[0],
    max: sorted[count - 1],
    stdDev: Math.sqrt(variance),
    variance,
    count,
    quartiles: { 
      q1: getQuartile(0.25), 
      q2: median, 
      q3: getQuartile(0.75) 
    }
  };
};

export const calculateAge = (constructionYear: number): number => {
  return new Date().getFullYear() - constructionYear;
};