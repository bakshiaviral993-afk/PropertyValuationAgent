
import { ReactNode } from 'react';

export type AppMode = 'buy' | 'rent' | 'land' | 'expert' | 'harmony';
export type AppLang = 'EN' | 'HI';

export enum StepField {
  State = 'state',
  City = 'city',
  Pincode = 'pincode',
  District = 'district',
  Area = 'area',
  ProjectName = 'projectName',
  BuilderName = 'builderName',
  BHK = 'bhk',
  Facing = 'facing',
  Floor = 'floor',
  ConstructionYear = 'constructionYear',
  DistanceFromMainRoad = 'distanceFromMainRoad',
  RoadType = 'roadType',
  NearbyLocations = 'nearbyLocations',
  CarpetArea = 'carpetArea',
  BuiltUpArea = 'builtUpArea',
  SuperBuiltUpArea = 'superBuiltUpArea',
  HasParking = 'hasParking',
  ParkingCharges = 'parkingCharges',
  HasAmenities = 'hasAmenities',
  AmenitiesCharges = 'amenitiesCharges',
  FSI = 'fsi'
}

export interface UserProfile {
  name: string;
  mobile: string;
  email: string;
}

export interface NeighborhoodInsight {
  title: string;
  description: string;
  type: 'positive' | 'development' | 'trend';
}

export interface NeighborhoodScore {
  overall: number;
  walkability: number;
  grocery: number;
  parks: number;
  safety: number;
  connectivity: number;
}

export interface ValuationBreakdown {
  baseRate: string;
  localityPremium: string;
  amenitiesBoost: string;
  facingAdjustment: string;
  ageFactor: string;
}

export interface SaleListing {
  title: string;
  price: string;
  priceValue: number;
  address: string;
  sourceUrl: string;
  bhk: string;
  image?: string;
  latitude?: number;
  longitude?: number;
  builderName?: string;
  societyName?: string;
}

export interface RentalListing {
  title: string;
  rent: string;
  address: string;
  sourceUrl: string;
  bhk: string;
  qualityScore: number;
  image?: string;
  latitude: number;
  longitude: number;
  facing: string;
}

export interface LandListing {
  title: string;
  price: string;
  size: string;
  address: string;
  sourceUrl: string;
  image?: string;
  latitude: number;
  longitude: number;
  facing: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface BuyResult {
  fairValue: string;
  valuationRange: string;
  recommendation: 'Good Buy' | 'Fair Price' | 'Overpriced';
  negotiationScript: string;
  listings: SaleListing[];
  marketSentiment: string;
  sentimentScore: number; // 0 to 100 (Bearish to Bullish)
  registrationEstimate: string;
  appreciationPotential: string;
  confidenceScore: number;
  valuationJustification: string;
  breakdown?: ValuationBreakdown;
  neighborhoodScore?: NeighborhoodScore;
  insights: NeighborhoodInsight[];
  groundingSources: GroundingSource[];
}

export interface RentResult {
  rentalValue: string;
  yieldPercentage: string;
  rentOutAlert: string;
  depositCalc: string;
  negotiationScript: string;
  listings: RentalListing[];
  marketSummary: string;
  tenantDemandScore: number;
  confidenceScore: number;
  valuationJustification: string;
  propertiesFoundCount: number;
  insights: NeighborhoodInsight[];
  groundingSources: GroundingSource[];
}

export interface LandResult {
  landValue: string;
  perSqmValue: string;
  devROI: string;
  negotiationStrategy: string;
  confidenceScore: number;
  zoningAnalysis: string;
  listings: LandListing[];
  valuationJustification: string;
  insights: NeighborhoodInsight[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export interface WizardStep {
  field: string;
  question: string;
  type: 'text' | 'number' | 'select' | 'city-picker' | 'locality-picker' | 'pincode-picker' | 'price-range';
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface BuyRequest {
  state?: string;
  city: string;
  pincode: string;
  area: string;
  address?: string;
  bhk: string;
  sqft: number;
  facing?: string;
}

export interface RentRequest extends BuyRequest {}

export interface LandRequest {
  city: string;
  address: string;
  plotSize: number;
  unit: string;
  fsi: number;
}

export interface PanchangData {
  tithi: string;
  nakshatra: string;
  yoga: string;
  rahuKaal: string;
  auspiciousTiming: string;
  propertyAdvice: string;
  harmonyScore: number;
}

export interface HarmonyReport {
  vastuScore: number;
  fengShuiScore: number;
  advice: string;
  remedies: string[];
}

/**
 * Added missing types for ValuationReport.tsx and Sidebar.tsx
 */
export interface Comparable {
  projectName: string;
  price: number;
  area: number;
  bhk: string;
  latitude?: number;
  longitude?: number;
}

export interface ValuationResult {
  estimatedValue: number;
  rangeLow: number;
  rangeHigh: number;
  confidenceScore: number;
  comparables: Comparable[];
}

export interface ValuationRequest {
  projectName: string;
  area: string;
  city: string;
  superBuiltUpArea: number;
  constructionYear: number;
  parkingCharges?: number;
  amenitiesCharges?: number;
  latitude?: number;
  longitude?: number;
}

export interface GlobalContext {
  address: string;
  pincode: string;
  photos: string[];
}
