import { ReactNode } from 'react';

export type AppMode = 'valuation' | 'rent';

export interface UserProfile {
  name: string;
  mobile: string;
  email: string;
}

export interface ValuationRequest {
  state: string;
  city: string;
  pincode: string;
  district: string;
  area: string;
  latitude?: number;
  longitude?: number;
  projectName: string;
  builderName: string;
  bhk?: string;
  facing: string;
  floor: number;
  totalFloors: number; 
  constructionYear: number;
  distanceFromMainRoad: string;
  roadType: string;
  nearbyLocations: string;
  carpetArea: number;
  builtUpArea: number;
  superBuiltUpArea: number;
  hasParking: 'Yes' | 'No';
  parkingCharges: number;
  hasAmenities: 'Yes' | 'No';
  amenitiesCharges: number;
  fsi: number;
}

export interface RentRequest {
  state: string;
  city: string;
  area: string;
  bhk: string;
}

export interface RentalListing {
  title: string;
  rent: string;
  address: string;
  sourceUrl: string;
  bhk: string;
  qualityScore: number;
}

export interface RentResult {
  averageRent: string;
  listings: RentalListing[];
  marketSummary: string;
  negotiationStrategy: string;
  depositEstimate: string;
  maintenanceEstimate: string;
  relocationExpenses: string;
  latitude?: number;
  longitude?: number;
  radiusUsed: string;
  scanLogs: string[];
  expertVerdict?: {
    justifiedPrice: string;
    maxThreshold: string;
    whyJustified: string;
    whyNoMoreThan: string;
  };
  premiumDrivers: { feature: string; impact: string }[];
}

export interface ValuationResult {
  estimatedValue: number;
  pricePerSqft: number;
  rangeLow: number;
  rangeHigh: number;
  confidenceScore: number;
  locationScore: number;
  sentimentScore: number;
  sentimentAnalysis: string;
  comparables: Comparable[];
  valuationJustification: string;
  propertyStatus: string;
}

export interface Comparable {
  projectName: string;
  price: number;
  area: number;
  bhk: string;
  pricePerSqft: number;
  latitude?: number;
  longitude?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text?: string;
  component?: ReactNode;
  isTyping?: boolean;
  stepIndex?: number;
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

export interface WizardStep {
  field: string;
  question: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  placeholder?: string;
}