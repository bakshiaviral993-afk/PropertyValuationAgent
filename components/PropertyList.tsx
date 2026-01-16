"use client";

import { usePropertyMapStore } from "@/stores/usePropertyMapStore";

export default function PropertyList() {
  const properties = usePropertyMapStore((s) => s.visibleProperties);
  const setHovered = usePropertyMapStore((s) => s.setHovered);
  const selectedId = usePropertyMapStore((s) => s.selectedId);

  return (
    <div className="h-full overflow-y-auto space-y-3 pr-2">
      {properties.map((p) => (
        <div
          key={p.id}
          id={`property-${p.id}`}
          onMouseEnter={() => setHovered(p.id)}
          onMouseLeave={() => setHovered(null)}
          className={`p-4 rounded-lg border cursor-pointer transition
            ${
              selectedId === p.id
                ? "border-blue-600 bg-blue-50"
                : "bg-white"
            }`}
        >
          <div className="font-semibold">₹{p.price}</div>
          <div className="text-sm text-gray-600">{p.address}</div>
        </div>
      ))}
    </div>
  );
}
