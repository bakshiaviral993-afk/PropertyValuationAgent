// src/services/valuationService.ts - Standalone version
import { callLLMWithFallback } from "./llmFallback";

// ============================================================================
// UTILITY FUNCTIONS (Defined locally to avoid import issues)
// ============================================================================

function parsePrice(p: any): number {
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

const formatRentValue = (val: any): string => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return str;
  
  // Rent should NEVER be in crores
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L/month`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(0)}K/month`;
  return `₹${num.toLocaleString('en-IN')}/month`;
};

function formatCompleteAddress(listing: any, area: string, city: string, pincode: string): string {
  const parts = [];
  
  if (listing.project || listing.title) {
    parts.push(listing.project || listing.title);
  }
  
  if (listing.locality && listing.locality !== area) {
    parts.push(listing.locality);
  }
  
  if (listing.subLocality && listing.subLocality !== listing.locality) {
    parts.push(listing.subLocality);
  }
  
  if (area) parts.push(area);
  if (city) parts.push(city);
  if (pincode) parts.push(`PIN: ${pincode}`);
  
  // Remove duplicates and empty values
  const uniqueParts = [...new Set(parts.filter(p => p && p.trim()))];
  return uniqueParts.join(', ');
}

function enrichListing(listing: any, area: string, city: string, pincode: string, userSqft: number): any {
  // Extract actual sqft from various possible fields
  const actualSqft = listing.builtUpArea || 
                     listing.carpetArea || 
                     listing.superArea || 
                     listing.size_sqft ||
                     listing.plotArea ||
                     userSqft;
  
  // Calculate price per sqft
  const priceNum = parsePrice(listing.price);
  const pricePerSqft = actualSqft && priceNum > 0 
    ? Math.round(priceNum / actualSqft)
    : null;
  
  // Determine sqft display string
  let sqftDisplay = '';
  if (listing.builtUpArea) {
    sqftDisplay = `${listing.builtUpArea} sq.ft. (Built-up)`;
  } else if (listing.carpetArea) {
    sqftDisplay = `${listing.carpetArea} sq.ft. (Carpet)`;
  } else if (listing.superArea) {
    sqftDisplay = `${listing.superArea} sq.ft. (Super)`;
  } else if (listing.size_sqft) {
    sqftDisplay = `${listing.size_sqft} sq.ft.`;
  } else {
    sqftDisplay = `~${userSqft} sq.ft.`;
  }
  
  return {
    ...listing,
    fullAddress: formatCompleteAddress(listing, area, city, pincode),
    actualSqft,
    sqftDisplay,
    pricePerSqft: pricePerSqft ? `₹${pricePerSqft.toLocaleString('en-IN')}/sq.ft.` : null,
    latitude: listing.latitude || listing.lat || null,
    longitude: listing.longitude || listing.lng || null,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatCompleteAddress(listing, area, city, pincode))}`
  };
}

function enrichRentListing(listing: any, area: string, city: string, pincode: string, userSqft: number) {
  const actualSqft = listing.builtUpArea || listing.carpetArea || listing.superArea || userSqft;
  const monthlyRent = parseFloat(listing.monthlyRent || 0);
  
  const rentPerSqft = actualSqft && monthlyRent > 0 
    ? Math.round(monthlyRent / actualSqft)
    : null;
  
  return {
    ...listing,
    fullAddress: formatCompleteAddress(listing, area, city, pincode),
    actualSqft,
    sqftDisplay: listing.builtUpArea 
      ? `${listing.builtUpArea} sq.ft. (Built-up)` 
      : listing.carpetArea 
        ? `${listing.carpetArea} sq.ft. (Carpet)` 
        : `~${userSqft} sq.ft.`,
    rentPerSqft: rentPerSqft ? `₹${rentPerSqft}/sq.ft./month` : null,
    monthlyRent: monthlyRent,
    price: formatRentValue(monthlyRent),
    securityDeposit: formatRentValue(monthlyRent * 2),
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatCompleteAddress(listing, area, city, pincode))}`
  };
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ValuationRequestBase {
  city: string;
  area?: string;
  pincode?: string;
  propertyType: string;
  size: number;
  sizeUnit?: 'sqft' | 'sqyd' | 'sqm';
  facing?: string;
  floor?: number;
  constructionYear?: number;
  budget?: number;
}

export interface ValuationResultBase {
  estimatedValue: number;
  rangeLow: number;
  rangeHigh: number;
  pricePerUnit: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'live_scrape' | 'deep_web_scraper' | 'radius_expansion' | 'neural_calibration' | 'market_fallback';
  notes: string;
  comparables?: any[];
  groundingSources?: any[];
  isBudgetAlignmentFailure?: boolean;
  suggestedMinimum?: number;
  registrationEstimate?: string;
  appreciationPotential?: string;
  negotiationScript?: string;
  marketSentiment?: string;
  sentimentScore?: number;
  valuationJustification?: string;
  yieldPercentage?: string;
  learningSignals?: number;
  depositCalc?: string;
  tenantDemandScore?: number;
}

// ============================================================================
// CORE SEARCH FUNCTIONS
// ============================================================================

async function performSearchWithRadius(
  req: ValuationRequestBase, 
  radiusDescription: string, 
  bhk?: string
): Promise<any> {
  const prompt = `Valuation Expert: Estimate value for ${bhk || req.propertyType} (${req.size} sqft) in ${req.area}, ${req.city}.
  Strategy: ${radiusDescription}. 
  
  CRITICAL REQUIREMENTS:
  1. Each listing MUST have "latitude" and "longitude" as numbers
  2. Include "builtUpArea" or "carpetArea" or "size_sqft" for actual property size
  3. Include "locality" or "subLocality" for complete address
  4. Include "project" or "title" for property name
  5. Include full address components
  
  Output JSON: {
    "fairValue": number, 
    "rangeLow": number, 
    "rangeHigh": number, 
    "valuationJustification": "detailed explanation",
    "listings": [{
      "title": string,
      "project": string,
      "price": string,
      "address": string,
      "locality": string,
      "subLocality": string,
      "builtUpArea": number,
      "carpetArea": number,
      "size_sqft": number,
      "latitude": number,
      "longitude": number,
      "url": string
    }]
  }`;

  const { text, source } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const data = JSON.parse(jsonMatch[0]);
    data.fairValue = parsePrice(data.fairValue);
    data.llmSource = source;
    
    if (data.listings && Array.isArray(data.listings)) {
      data.listings = data.listings.map((listing: any) => 
        enrichListing(listing, req.area || '', req.city, req.pincode || '', req.size)
      );
    }
    
    return data;
  } catch (e) {
    console.error('JSON parse error:', e);
    return null;
  }
}

async function performRentSearchWithRadius(
  req: ValuationRequestBase, 
  radiusDescription: string, 
  bhk?: string
): Promise<any> {
  const prompt = `Rental Valuation Expert: Estimate MONTHLY RENT for ${bhk || req.propertyType} (${req.size} sqft) in ${req.area}, ${req.city}.
  
  CRITICAL REQUIREMENTS FOR RENT:
  1. Return MONTHLY rent in Rupees (₹10,000 to ₹200,000 range)
  2. DO NOT use Crores or Lakhs in calculations
  3. Each listing MUST have "monthlyRent" as a number (e.g., 25000 for ₹25,000/month)
  4. Include "builtUpArea" or "carpetArea" for actual property size
  5. Include "locality" for complete address
  6. Include "latitude" and "longitude" as numbers
  
  Strategy: ${radiusDescription}
  
  Output JSON: {
    "monthlyRent": number (e.g., 35000 for ₹35K/month),
    "rangeLow": number (e.g., 30000),
    "rangeHigh": number (e.g., 40000),
    "rentPerSqft": number (e.g., 35 for ₹35/sqft),
    "valuationJustification": "detailed explanation",
    "securityDeposit": number (usually 2-3 months rent),
    "yieldPercentage": "3-4%",
    "listings": [{
      "title": string,
      "project": string,
      "monthlyRent": number (e.g., 25000),
      "address": string,
      "locality": string,
      "builtUpArea": number,
      "carpetArea": number,
      "latitude": number,
      "longitude": number,
      "url": string
    }]
  }`;

  const { text, source } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const data = JSON.parse(jsonMatch[0]);
    
    let monthlyRent = parseFloat(data.monthlyRent || data.fairValue || data.rentalValue || 0);
    
    if (monthlyRent > 10000000) {
      monthlyRent = monthlyRent / 200;
    } else if (monthlyRent > 1000000) {
      monthlyRent = monthlyRent / 12;
    }
    
    if (monthlyRent < 5000) monthlyRent = 5000;
    if (monthlyRent > 500000) monthlyRent = 500000;
    
    data.monthlyRent = monthlyRent;
    data.fairValue = monthlyRent;
    data.llmSource = source;
    data.rentPerSqft = Math.round(monthlyRent / (req.size || 1000));
    data.securityDeposit = monthlyRent * 2;
    
    if (data.listings && Array.isArray(data.listings)) {
      data.listings = data.listings.map((listing: any) => {
        let listingRent = parseFloat(listing.monthlyRent || listing.rent || listing.price || 0);
        
        if (listingRent > 10000000) listingRent = listingRent / 200;
        else if (listingRent > 1000000) listingRent = listingRent / 12;
        
        if (listingRent < 5000) listingRent = 15000;
        if (listingRent > 500000) listingRent = 50000;
        
        return enrichRentListing({
          ...listing,
          monthlyRent: listingRent,
          price: formatRentValue(listingRent)
        }, req.area || '', req.city, req.pincode || '', req.size);
      });
    }
    
    return data;
  } catch (e) {
    console.error('Rent JSON parse error:', e);
    return null;
  }
}

// ============================================================================
// EXPORTED VALUATION FUNCTIONS
// ============================================================================

export async function getBuyValuation(
  req: ValuationRequestBase & { bhk?: string }
): Promise<ValuationResultBase> {
  let result = await performSearchWithRadius(req, `STRICT Pincode: ${req.pincode}`, req.bhk);

  if (!result || result.fairValue < 100000 || !result.listings || result.listings.length === 0) {
    console.log("Empty listing signal. Expanding crawl radius...");
    result = await performSearchWithRadius(
      req, 
      `Expanded 5KM Radius around ${req.area}, ${req.city}`, 
      req.bhk
    );
    if (result) result.isExpanded = true;
  }

  if (!result || result.fairValue < 100000 || !result.listings || result.listings.length === 0) {
    console.log("Micro-market signal dead. Transitioning to city-wide data nodes.");
    result = await performSearchWithRadius(
      req, 
      `Macro Search for ${req.city} city averages`, 
      req.bhk
    );
    if (result) result.isMacro = true;
  }

  const finalResult = result || { fairValue: 0, listings: [] };

  return {
    estimatedValue: finalResult.fairValue,
    rangeLow: parsePrice(finalResult.rangeLow) || finalResult.fairValue * 0.9,
    rangeHigh: parsePrice(finalResult.rangeHigh) || finalResult.fairValue * 1.1,
    pricePerUnit: finalResult.fairValue / (req.size || 1),
    confidence: finalResult.fairValue > 0 ? 'medium' : 'low',
    source: finalResult.llmSource === 'market_fallback' 
      ? 'market_fallback' 
      : (finalResult.isExpanded || finalResult.isMacro ? 'radius_expansion' : 'live_scrape'),
    notes: finalResult.isExpanded 
      ? "Search expanded to 5km micro-market due to sparse local listings." 
      : (finalResult.isMacro ? "Macro-city indices applied." : "Grounded via local data node."),
    comparables: finalResult.listings || [],
    valuationJustification: finalResult.valuationJustification || "Spatial crawl completed."
  };
}

export async function getRentValuationInternal(
  req: ValuationRequestBase & { bhk?: string }
): Promise<ValuationResultBase> {
  let result = await performRentSearchWithRadius(req, `STRICT Pincode: ${req.pincode}`, req.bhk);

  if (!result || result.monthlyRent < 5000 || !result.listings || result.listings.length === 0) {
    console.log("Empty rental listings. Expanding search radius...");
    result = await performRentSearchWithRadius(
      req, 
      `Expanded 5KM Radius around ${req.area}, ${req.city}`, 
      req.bhk
    );
    if (result) result.isExpanded = true;
  }

  if (!result || result.monthlyRent < 5000 || !result.listings || result.listings.length === 0) {
    console.log("Using city-wide rental market averages.");
    result = await performRentSearchWithRadius(
      req, 
      `City-wide rental market data for ${req.city}`, 
      req.bhk
    );
    if (result) result.isMacro = true;
  }

  if (!result || result.monthlyRent < 5000) {
    const estimatedPropertyValue = req.size * 8000;
    const monthlyRent = estimatedPropertyValue * 0.003;
    
    return {
      estimatedValue: monthlyRent,
      rangeLow: monthlyRent * 0.8,
      rangeHigh: monthlyRent * 1.2,
      pricePerUnit: monthlyRent / (req.size || 1000),
      confidence: 'low',
      source: 'market_fallback',
      notes: "Estimated using market rent-to-value ratios. Limited rental data available.",
      comparables: [],
      yieldPercentage: "3.6%",
      depositCalc: formatRentValue(monthlyRent * 2)
    };
  }

  const finalResult = result;
  const monthlyRent = finalResult.monthlyRent || 0;

  return {
    estimatedValue: monthlyRent,
    rangeLow: finalResult.rangeLow || monthlyRent * 0.85,
    rangeHigh: finalResult.rangeHigh || monthlyRent * 1.15,
    pricePerUnit: finalResult.rentPerSqft || (monthlyRent / (req.size || 1000)),
    confidence: finalResult.monthlyRent > 0 ? 'medium' : 'low',
    source: finalResult.llmSource === 'market_fallback' 
      ? 'market_fallback' 
      : (finalResult.isExpanded || finalResult.isMacro ? 'radius_expansion' : 'live_scrape'),
    notes: finalResult.isExpanded 
      ? "Rental search expanded to 5km radius due to limited local data." 
      : (finalResult.isMacro ? "Using city-wide rental market averages." : "Grounded via local rental listings."),
    comparables: finalResult.listings || [],
    valuationJustification: finalResult.valuationJustification || "Rental analysis completed.",
    yieldPercentage: finalResult.yieldPercentage || "3-4%",
    depositCalc: formatRentValue(monthlyRent * 2),
    tenantDemandScore: 75
  };
}

export async function getLandValuationInternal(
  req: ValuationRequestBase & { bhk?: string }
): Promise<ValuationResultBase> {
  let result = await performSearchWithRadius(req, `Plot/Land search for ${req.area}, ${req.city}`, req.bhk);

  if (!result || result.fairValue < 100000 || !result.listings || result.listings.length === 0) {
    console.log("Expanding land search radius...");
    result = await performSearchWithRadius(
      req, 
      `Expanded land search around ${req.city}`, 
      req.bhk
    );
    if (result) result.isExpanded = true;
  }

  const finalResult = result || { fairValue: 0, listings: [] };

  return {
    estimatedValue: finalResult.fairValue,
    rangeLow: parsePrice(finalResult.rangeLow) || finalResult.fairValue * 0.85,
    rangeHigh: parsePrice(finalResult.rangeHigh) || finalResult.fairValue * 1.15,
    pricePerUnit: finalResult.fairValue / (req.size || 1),
    confidence: finalResult.fairValue > 0 ? 'medium' : 'low',
    source: finalResult.llmSource === 'market_fallback' 
      ? 'market_fallback' 
      : (finalResult.isExpanded ? 'radius_expansion' : 'live_scrape'),
    notes: finalResult.isExpanded 
      ? "Land search expanded to wider region." 
      : "Plot valuation completed.",
    comparables: finalResult.listings || [],
    valuationJustification: finalResult.valuationJustification || "Land analysis completed."
  };
}

export async function getCommercialValuationInternal(
  req: ValuationRequestBase
): Promise<ValuationResultBase> {
  const result = await performSearchWithRadius(req, `CBD search for ${req.city}`, undefined);
  
  if (!result || result.fairValue < 100000) {
    return { 
      estimatedValue: 0, 
      rangeLow: 0, 
      rangeHigh: 0, 
      pricePerUnit: 0, 
      confidence: 'low', 
      source: 'neural_calibration', 
      notes: "Commercial indices missing.",
      comparables: []
    };
  }
  
  return {
    estimatedValue: result.fairValue,
    rangeLow: result.fairValue * 0.9, 
    rangeHigh: result.fairValue * 1.1,
    pricePerUnit: result.fairValue / (req.size || 1),
    confidence: 'medium', 
    source: 'live_scrape', 
    notes: "Commercial asset pulse active.", 
    comparables: result.listings || []
  };
}

export async function getMoreListings(
  req: ValuationRequestBase & { mode: 'buy' | 'rent' | 'land' | 'commercial' }
): Promise<any[]> {
  const modeKeywords = {
    buy: 'sale purchase',
    rent: 'rental lease',
    land: 'plot land',
    commercial: 'commercial office retail'
  };
  
  const prompt = `EXHAUSTIVE SEARCH: Find 15+ real ${modeKeywords[req.mode]} listings in ${req.city}, ${req.area}. 
  
  MANDATORY FIELDS PER LISTING:
  - "project" or "title": Property name
  - "price": Price as string
  - "size_sqft" or "builtUpArea": Actual area
  - "locality": Specific locality name
  - "latitude": number (required)
  - "longitude": number (required)
  - "url": Source URL
  
  Output JSON: {
    "listings": [{
      "project": string,
      "title": string,
      "price": string,
      "size_sqft": number,
      "builtUpArea": number,
      "carpetArea": number,
      "locality": string,
      "subLocality": string,
      "latitude": number,
      "longitude": number,
      "url": string
    }]
  }`;
  
  const { text } = await callLLMWithFallback(prompt, { temperature: 0.1 });
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    
    const data = JSON.parse(jsonMatch[0]);
    const listings = data.listings || [];
    
    return listings.map((listing: any) => 
      enrichListing(listing, req.area || '', req.city, req.pincode || '', req.size)
    );
  } catch (e) {
    console.error('Failed to parse more listings:', e);
    return [];
  }
}

// Export utility functions for backward compatibility
export { formatCompleteAddress, enrichListing, formatRentValue, enrichRentListing };
