
import { ReactNode } from 'react';

export type AppMode = 'buy' | 'sell' | 'rent' | 'land' | 'finance';

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

export interface GlobalContext {
  address: string;
  pincode: string;
  city: string;
  photos: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
  projectName?: string;
  priceRange?: string;
}

export interface BudgetRange {
  min: number;
  max: number;
}

export interface LoanResult {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  stampDuty: number;
  registration: number;
  legalCharges: number;
  totalInitialCash: number;
  loanAmount: number;
}

export interface BuyRequest extends GlobalContext {
  purchaseType: 'New Booking' | 'Resale Purchase';
  possessionStatus: 'Ready to Move' | 'Under Construction' | 'Upcoming Project';
  possessionYear?: string;
  bhk: string;
  sqft: number;
  amenities: string[];
  budgetRange: BudgetRange;
  facing: string;
}

export interface SellRequest extends GlobalContext {
  bhk: string;
  sqft: number;
  age: number;
  floor: number;
  amenities: string[];
  furnishing: string;
  expectedPrice: number;
  facing: string;
}

export interface RentRequest extends GlobalContext {
  bhk: string;
  sqft: number;
  budgetRange: BudgetRange;
  leaseTerm: string;
  securityDepositMonths: number;
  forceExpandRadius?: boolean;
  facing: string;
}

export interface LandRequest extends GlobalContext {
  plotSize: number;
  unit: 'sqft' | 'sqyd' | 'sqmt' | 'acre';
  facing: string;
  fsi: number;
  devPotential: 'residential' | 'commercial';
  approvals: 'NA' | 'RERA' | 'None';
}

export interface SavedSearch {
  id: string;
  timestamp: number;
  mode: AppMode;
  location: string;
  city: string;
  config: string;
  data: BuyRequest | RentRequest | LandRequest | SellRequest;
}

export interface RentalListing {
  title: string;
  rent: string;
  address: string;
  sourceUrl: string;
  bhk: string;
  qualityScore: number;
  latitude: number;
  longitude: number;
  facing: string;
}

export interface SaleListing {
  title: string;
  price: string;
  priceValue: number;
  address: string;
  sourceUrl: string;
  bhk: string;
  emiEstimate: string;
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
  latitude: number;
  longitude: number;
  facing: string;
}

export interface BuyResult {
  fairValue: string;
  valuationRange: string;
  recommendation: 'Good Buy' | 'Fair Price' | 'Overpriced';
  negotiationScript: string;
  listings: SaleListing[];
  marketSentiment: string;
  registrationEstimate: string;
  appreciationPotential: string;
  confidenceScore: number;
  valuationJustification: string;
  groundingSources?: GroundingSource[];
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
  suggestRadiusExpansion: boolean;
  propertiesFoundCount: number;
  valuationJustification: string;
  groundingSources?: GroundingSource[];
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
  groundingSources?: GroundingSource[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text?: string;
  component?: ReactNode;
  isTyping?: boolean;
}

export interface WizardStep {
  field: string;
  question: string;
  type: 'text' | 'number' | 'select' | 'multi-select' | 'city-picker' | 'locality-picker' | 'price-range';
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface Comparable {
  projectName: string;
  price: number;
  pricePerSqft: number;
  area: number;
  bhk: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  propertyType?: 'Apartment' | 'Villa' | 'Penthouse' | 'Plot';
}

export interface ValuationResult {
  estimatedValue: number;
  rangeLow: number;
  rangeHigh: number;
  confidenceScore: number;
  valuationJustification: string;
  comparables: Comparable[];
}

export interface ValuationRequest {
  state: string;
  city: string;
  pincode: string;
  district: string;
  area: string;
  projectName: string;
  builderName: string;
  bhk: string;
  facing: string;
  floor: number;
  constructionYear: number;
  distanceFromMainRoad: string;
  roadType: string;
  nearbyLocations: string;
  carpetArea: number;
  builtUpArea: number;
  superBuiltUpArea: number;
  hasParking: string;
  parkingCharges: number;
  hasAmenities: string;
  amenitiesCharges: number;
  fsi: number;
  latitude?: number;
  longitude?: number;
}
