import { ReactNode } from 'react';

export interface ValuationRequest {
  state: string;
  city: string;
  pincode: string;
  district: string;
  area: string; // Locality
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
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text?: string;
  component?: ReactNode;
  isTyping?: boolean;
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
  field: StepField;
  question: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  placeholder?: string;
}