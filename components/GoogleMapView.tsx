import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/utils/loadGoogleMaps";
import { usePropertyMapStore } from "@/components/store/usePropertyMapStore";


declare global {
  interface Window {
    google: any;
    markerClusterer: any;
  }
}

type Property = {
  id: string;
  lat: number;
  lng: number;
  price: number;
};

export default function GoogleMapView({
  properties = [],
}: {
  properties?: Property[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const cluster = useRef<any>(null);
  const [budget, setBudget] = useState<number | null>(null);

  // ---------- LOAD MAP + CLUSTER ----------
  useEffect(() => {
    async function init() {
      await loadGoogleMaps();
      await loadClusterer();
      initMap();
    }
    init();
  }, []);

  function loadClusterer() {
    if (window.markerClusterer) return Promise.resolve();

    return new Promise<void>((resolve) => {
      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js";
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  // ---------- INIT MAP ----------
  function initMap() {
    if (!mapRef.current || map.current) return;

    map.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 18.5204, lng: 73.8567 },
      zoom: 12,
      mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
      disableDefaultUI: true,
    });
  }

  // ---------- RENDER MARKERS ----------
  function renderMarkers() {
    if (!map.current || properties.length === 0) return;

    markers.current.forEach((m) => (m.map = null));
    markers.current = [];
    cluster.current?.clearMarkers();

    const bounds = new window.google.maps.LatLngBounds();

    properties
      .filter((p) => (budget ? p.price <= budget : true))
      .forEach((p) => {
        const el = document.createElement("div");
        el.className =
          "px-3 py-1 bg-black text-white rounded-xl text-sm font-semibold shadow";
        el.innerText = `₹${(p.price / 100000).toFixed(1)}L`;

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: { lat: p.lat, lng: p.lng },
          content: el,
        });

        markers.current.push(marker);
        bounds.extend(marker.position);
      });

    cluster.current = new window.markerClusterer.MarkerClusterer({
      map: map.current,
      markers: markers.current,
    });

    map.current.fitBounds(bounds);
  }

  // ---------- DATA READY ----------
  useEffect(() => {
    if (!properties.length) return;

    const max = Math.max(...properties.map((p) => p.price));
    setBudget(max);
    renderMarkers();
  }, [properties]);

  useEffect(() => {
    renderMarkers();
  }, [budget]);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-xl shadow w-72">
        {budget && (
          <>
            <label className="text-sm font-semibold">
              Budget: ₹{(budget / 100000).toFixed(1)}L
            </label>
            <input
              type="range"
              min={1000000}
              max={budget}
              step={500000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full"
            />
          </>
        )}
      </div>

      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
