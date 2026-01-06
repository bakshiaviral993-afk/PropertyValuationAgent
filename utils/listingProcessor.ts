
import { SaleListing, RentalListing } from '../types';

/**
 * Robust price parser using Regex (inspired by Python's 're')
 * Handles formats like: "₹3.5 Cr", "45 Lakhs", "12,000", etc.
 */
export const parsePrice = (priceStr: any): number => {
  if (priceStr === null || priceStr === undefined) return 0;
  
  const s = String(priceStr);
  const cleanStr = s.replace(/,/g, '').trim();
  const regex = /([\d.]+)\s*(Cr|L|Lakh|Crore|k|Thousand)?/i;
  const match = cleanStr.match(regex);
  
  if (!match) return 0;
  
  let value = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase();
  
  if (unit === 'cr' || unit === 'crore') value *= 10000000;
  else if (unit === 'l' || unit === 'lakh') value *= 100000;
  else if (unit === 'k' || unit === 'thousand') value *= 1000;
  
  return value;
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

/**
 * Calculates deep statistical metrics for a collection of prices
 */
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
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  };

  const q1 = getQuartile(0.25);
  const q2 = median;
  const q3 = getQuartile(0.75);

  const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    median,
    min: sorted[0],
    max: sorted[count - 1],
    stdDev,
    variance,
    count,
    quartiles: { q1, q2, q3 }
  };
};

/**
 * Asset vintage calculation
 */
export const calculateAge = (constructionYear: number): number => {
  return new Date().getFullYear() - constructionYear;
};
