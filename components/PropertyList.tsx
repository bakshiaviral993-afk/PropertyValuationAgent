"use client";

import { useEffect, useRef } from "react";
import { usePropertyMapStore } from "@/components/store/usePropertyMapStore";

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
      {properties.map((p) => (
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
          <div className="font-semibold text-lg">
            ₹{p.price.toLocaleString("en-IN")}
          </div>
          <div className="text-sm text-gray-600">{p.address}</div>
        </div>
      ))}
    </div>
  );
}
