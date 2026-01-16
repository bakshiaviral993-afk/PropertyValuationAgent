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
  properties = [],
}: {
  properties?: Property[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [budget, setBudget] = useState(10000000);

  // ---------- LOAD MAP ----------
  useEffect(() => {
    loadMap();
  }, []);

  async function loadMap() {
    if (window.google?.maps) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&v=weekly`;
    script.async = true;
    script.onload = initMap;
    document.body.appendChild(script);
  }

  // ---------- INIT MAP ----------
  async function initMap() {
    if (!mapRef.current || map.current) return;

    const { Map } = await window.google.maps.importLibrary("maps");
    await window.google.maps.importLibrary("marker");
    const { PlaceAutocompleteElement } =
      await window.google.maps.importLibrary("places");

    map.current = new Map(mapRef.current, {
      center: { lat: 18.5204, lng: 73.8567 },
      zoom: 13,
      mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
      disableDefaultUI: true,
    });

    initAutocomplete(PlaceAutocompleteElement);
    renderMarkers();
  }

  // ---------- AUTOCOMPLETE (NEW API) ----------
  function initAutocomplete(PlaceAutocompleteElement: any) {
    const container = document.getElementById("autocomplete-container");
    if (!container) return;

    container.innerHTML = "";

    const autocomplete = new PlaceAutocompleteElement({
      types: ["locality", "sublocality", "administrative_area_level_2"],
    });

    autocomplete.addEventListener("gmp-placeselect", async (e: any) => {
      const place = e.place;
      await place.fetchFields({ fields: ["location"] });

      if (place.location) {
        map.current.panTo(place.location);
        map.current.setZoom(14);
      }
    });

    container.appendChild(autocomplete);
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

  useEffect(() => {
    if (map.current) renderMarkers();
  }, [budget, properties]);

  return (
    <div className="w-full h-full relative">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-xl shadow-lg w-72">
        <div id="autocomplete-container" className="mb-3" />

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

      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
