"use client";

import { useEffect, useRef } from "react";
import { usePropertyMapStore } from "@/components/store/usePropertyMapStore";
import { ExternalLink, MapPin } from "lucide-react";

export default function PropertyList() {
  const {
    properties,
    selectedId,
    setSelectedId,
    setHoveredId,
  } = usePropertyMapStore();

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedId && itemRefs.current[selectedId]) {
      itemRefs.current[selectedId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedId]);

  return (
    <div className="space-y-4 overflow-y-auto h-full pr-2">
      {properties.map((p) => {
        // Generate Google Maps URL from address
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`;
        
        // Format price per sqft if available
        const pricePerSqft = p.sqft && p.price 
          ? Math.round(p.price / p.sqft)
          : null;

        return (
          <div
            key={p.id}
            ref={(el) => (itemRefs.current[p.id] = el)}
            onClick={() => setSelectedId(p.id)}
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              selectedId === p.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            {/* Price */}
            <div className="font-semibold text-lg text-gray-900">
              ₹{p.price.toLocaleString("en-IN")}
            </div>
            
            {/* SQFT and Price per SQFT */}
            {p.sqft && (
              <div className="text-sm text-blue-600 font-medium mt-1">
                {p.sqft.toLocaleString()} sq.ft.
                {pricePerSqft && (
                  <span className="ml-2 text-gray-500">
                    • ₹{pricePerSqft.toLocaleString()}/sq.ft.
                  </span>
                )}
              </div>
            )}
            
            {/* Full Clickable Address */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors mt-2 flex items-start gap-1 group"
              title="View on Google Maps"
            >
              <MapPin size={14} className="flex-shrink-0 mt-0.5 group-hover:text-blue-600" />
              <span className="underline decoration-dotted line-clamp-2">
                {p.address}
              </span>
              <ExternalLink size={12} className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            
            {/* Coordinates (if available) */}
            {p.latitude && p.longitude && (
              <div className="text-xs text-gray-400 mt-1">
                {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
