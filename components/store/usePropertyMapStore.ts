// src/components/store/usePropertyMapStore.ts
// Update your property type to include new fields

import { create } from 'zustand';

export interface Property {
  id: string;
  address: string;
  price: number;
  latitude: number;
  longitude: number;
  
  // NEW: Add these fields for bug fixes
  sqft?: number;              // Actual square footage
  builtUpArea?: number;       // Built-up area
  carpetArea?: number;        // Carpet area
  superArea?: number;         // Super area
  fullAddress?: string;       // Complete formatted address
  locality?: string;          // Locality name
  subLocality?: string;       // Sub-locality
  project?: string;           // Project/property name
  title?: string;             // Property title
  pricePerSqft?: number;      // Calculated price per sqft
  mapsUrl?: string;           // Google Maps URL
  sourceUrl?: string;         // Original listing URL
}

interface PropertyMapStore {
  properties: Property[];
  selectedId: string | null;
  hoveredId: string | null;
  setProperties: (properties: Property[]) => void;
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
}

export const usePropertyMapStore = create<PropertyMapStore>((set) => ({
  properties: [],
  selectedId: null,
  hoveredId: null,
  setProperties: (properties) => set({ properties }),
  setSelectedId: (id) => set({ selectedId: id }),
  setHoveredId: (id) => set({ hoveredId: id }),
}));
