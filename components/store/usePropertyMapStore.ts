import { create } from "zustand";

/**
 * Shared state between Map and Property List
 * Single source of truth
 */

export type Property = {
  id: string;
  lat: number;
  lng: number;
  price: number;
  address: string;
};

type PropertyMapState = {
  visibleProperties: Property[];
  hoveredId: string | null;
  selectedId: string | null;

  setVisibleProperties: (properties: Property[]) => void;
  setHoveredId: (id: string | null) => void;
  setSelectedId: (id: string | null) => void;
};

export const usePropertyMapStore = create<PropertyMapState>((set) => ({
  visibleProperties: [],
  hoveredId: null,
  selectedId: null,

  setVisibleProperties: (properties) =>
    set({ visibleProperties: properties }),

  setHoveredId: (id) => set({ hoveredId: id }),

  setSelectedId: (id) => set({ selectedId: id }),
}));
