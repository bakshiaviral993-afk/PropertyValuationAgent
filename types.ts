import { ReactNode } from 'react';

export type AppMode = 'buy' | 'rent' | 'land' | 'expert' | 'harmony' | 'essentials' | 'commercial';
export type AppLang = 'EN' | 'HI';

export interface EssentialService {
  name: string;
  contact: string;
  address: string;
  rating: string;
  distance: string;
  isOpen: boolean;
  sourceUrl: string;
}

export interface EssentialResult {
  category: string;
  services: EssentialService[];
  neighborhoodContext: string;
}

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

// Base interface for common fields (to avoid duplicates)
interface BaseListing {
  latitude?: number;
  longitude?: number;
}

export interface CommercialListing extends BaseListing {
  title: string;
  price: string;
  address: string;
  type: 'Shop' | 'Office' | 'Warehouse';
  intent: 'Buy' | 'Rent' | 'Lease';
  sourceUrl: string;
  sqft: number;
}

export interface CommercialResult {
  fairValue: string;
  yieldPotential: string;
  footfallScore: number;
  businessInsights: string;
  negotiationScript: string;
  confidenceScore: number;
  listings: CommercialListing[];
  groundingSources: GroundingSource[];
}

export interface BuyResult {
  fairValue: string;
  valuationRange: string;
  recommendation: 'Good Buy' | 'Fair Price' | 'Overpriced' | 'Check Details';
  negotiationScript: string;
  listings: SaleListing[];
  marketSentiment: string;
  sentimentScore: number;
  registrationEstimate: string;
  appreciationPotential: string;
  confidenceScore: number;
  valuationJustification: string;
  insights: NeighborhoodInsight[];
  groundingSources: GroundingSource[];
  isBudgetAlignmentFailure?: boolean;
  suggestedMinimum?: number;
  learningSignals?: number;
  source?: string;
  notes?: string;
}

export interface RentResult {
  rentalValue: string;
  yieldPercentage: string;
  rentOutAlert: string;
  depositCalc: string;
  negotiationScript: string;
  marketSummary: string;
  tenantDemandScore: number;
  confidenceScore: number;
  valuationJustification: string;
  propertiesFoundCount: number;
  listings: RentalListing[];
  insights: NeighborhoodInsight[];
  groundingSources: GroundingSource[];
  isBudgetAlignmentFailure?: boolean;
  suggestedMinimum?: number;
  notes?: string;
}

export interface SaleListing extends BaseListing {
  title: string;
  price: string;
  address: string;
  sourceUrl: string;
  bhk: string;
  qualityScore: number;
  facing: string;
}

export interface RentalListing extends BaseListing {
  title: string;
  rent: string;
  address: string;
  sourceUrl: string;
  bhk: string;
  qualityScore: number;
  facing: string;
}

export interface LandListing extends BaseListing {
  title: string;
  price: string;
  address: string;
  sourceUrl: string;
  plotSize: string;
}

export interface NeighborhoodInsight {
  title: string;
  description: string;
  type: 'trend' | 'alert' | 'insight';
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  image?: string;
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
  pincode?: string;
  area?: string;
  plotSize: number;
  unit: string;
  fsi: number;
}

export interface CommercialRequest {
  city: string;
  area: string;
  pincode: string;
  type: 'Shop' | 'Office' | 'Warehouse';
  intent: 'Buy' | 'Rent' | 'Lease';
  sqft: number;
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
