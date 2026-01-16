import { useEffect, useRef, useState } from "react";

type Property = {
  id: string;
  lat: number;
  lng: number;
  price: number;
  title: string;
};

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleMapView({
  properties,
}: {
  properties: Property[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [budget, setBudget] = useState(10000000);

  // ---------- LOAD GOOGLE MAPS ----------
  useEffect(() => {
    if (window.google) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places,marker&v=weekly`;
    script.async = true;
    script.onload = initMap;
    document.body.appendChild(script);
  }, []);

  // ---------- INIT MAP ----------
  function initMap() {
    if (!mapRef.current || map.current) return;

    map.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 18.5204, lng: 73.8567 }, // Pune default
      zoom: 13,
      mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
      disableDefaultUI: true,
    });

    initAutocomplete();
    renderMarkers();
  }

  // ---------- AUTOCOMPLETE (CITY / AREA) ----------
  function initAutocomplete() {
    const input = document.getElementById(
      "location-input"
    ) as HTMLInputElement;

    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ["(regions)"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      map.current.panTo(place.geometry.location);
      map.current.setZoom(14);
    });
  }

  // ---------- MARKERS ----------
  function clearMarkers() {
    markers.current.forEach((m) => (m.map = null));
    markers.current = [];
  }

  function renderMarkers() {
    if (!map.current) return;

    clearMarkers();

    const AdvancedMarker =
      window.google.maps.marker.AdvancedMarkerElement;

    properties
      .filter((p) => p.price <= budget)
      .forEach((p) => {
        const el = document.createElement("div");
        el.className =
          "px-3 py-1 bg-black text-white rounded-xl text-sm font-semibold shadow";
        el.innerText = `₹${(p.price / 100000).toFixed(1)}L`;

        const marker = new AdvancedMarker({
          map: map.current,
          position: { lat: p.lat, lng: p.lng },
          content: el,
        });

        markers.current.push(marker);
      });
  }

  // ---------- RE-FILTER ON BUDGET ----------
  useEffect(() => {
    if (map.current) renderMarkers();
  }, [budget]);

  return (
    <div className="w-full h-full relative">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-xl shadow-lg w-72">
        <input
          id="location-input"
          placeholder="City / Area"
          className="w-full mb-3 p-2 border rounded"
        />

        <label className="text-sm font-semibold">
          Budget: ₹{(budget / 100000).toFixed(1)}L
        </label>
        <input
          type="range"
          min={1000000}
          max={50000000}
          step={500000}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Map */}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
