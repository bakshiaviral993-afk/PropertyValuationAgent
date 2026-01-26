import React, { useRef, useState, useEffect } from 'react';

interface MapNode {
  title: string;
  price: string | number;
  address: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  isSubject?: boolean;
  isEssential?: boolean;
  essentialType?: string;
  markerColor?: string;
  contact?: string;
  rating?: string;
}

interface GoogleMapViewProps {
  nodes: MapNode[];
  center?: { lat: number; lng: number };
  showEssentials?: boolean;
  enableAllFeatures?: boolean; // NEW: Enable all advanced features
}

interface EnvironmentalData {
  elevation?: number;
  airQuality?: { aqi: number; category: string };
  weather?: { temp: number; condition: string };
  solarPotential?: string;
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps) {
      resolve();
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    // IMPORTANT: Include ALL libraries for full feature support
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,drawing,visualization,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
};

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ 
  nodes = [], 
  center, 
  showEssentials = false,
  enableAllFeatures = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const markersRef = useRef<any[]>([]);
  const gMapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const searchBoxRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const drawingManagerRef = useRef<any>(null);
  const heatmapRef = useRef<any>(null);
  
  // Feature states
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [envData, setEnvData] = useState<EnvironmentalData>({});
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [showDrawing, setShowDrawing] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const trafficLayerRef = useRef<any>(null);

  // Get user location (Geolocation API)
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn("Location permission denied")
    );
  }, []);

  // Fetch environmental data for selected node
  const fetchEnvironmentalData = async (lat: number, lng: number) => {
    const google = (window as any).google;
    if (!google?.maps) return;

    try {
      // 1. Elevation API
      const elevator = new google.maps.ElevationService();
      elevator.getElevationForLocations(
        { locations: [{ lat, lng }] },
        (results: any, status: string) => {
          if (status === 'OK' && results[0]) {
            setEnvData(prev => ({ ...prev, elevation: results[0].elevation }));
          }
        }
      );

      // 2. Air Quality API (simulated - replace with actual API call)
      // In production: fetch('https://airquality.googleapis.com/v1/currentConditions:lookup')
      const airQuality = {
        aqi: Math.floor(Math.random() * 100) + 50,
        category: 'Moderate'
      };
      setEnvData(prev => ({ ...prev, airQuality }));

      // 3. Weather data (simulated - use actual Weather API)
      const weather = {
        temp: 28 + Math.floor(Math.random() * 10),
        condition: 'Partly Cloudy'
      };
      setEnvData(prev => ({ ...prev, weather }));

      // 4. Solar API (simulated)
      setEnvData(prev => ({ ...prev, solarPotential: 'High' }));

    } catch (error) {
      console.error('Error fetching environmental data:', error);
    }
  };

  // Calculate route using Directions API
  const calculateRoute = (destination: { lat: number; lng: number }) => {
    if (!userLoc || !gMapRef.current) return;

    const google = (window as any).google;
    const directionsService = new google.maps.DirectionsService();
    
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: gMapRef.current,
        polylineOptions: {
          strokeColor: '#00F6FF',
          strokeWeight: 4
        }
      });
    }

    directionsService.route(
      {
        origin: userLoc,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result: any, status: string) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result);
          const route = result.routes[0];
          const distance = route.legs[0].distance.text;
          const duration = route.legs[0].duration.text;
          console.log(`Route: ${distance}, ${duration}`);
        }
      }
    );
  };

  // Toggle drawing tools
  const toggleDrawing = () => {
    if (!gMapRef.current) return;
    const google = (window as any).google;

    if (!showDrawing) {
      if (!drawingManagerRef.current) {
        drawingManagerRef.current = new google.maps.drawing.DrawingManager({
          drawingMode: google.maps.drawing.OverlayType.POLYGON,
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
              google.maps.drawing.OverlayType.MARKER,
              google.maps.drawing.OverlayType.CIRCLE,
              google.maps.drawing.OverlayType.POLYGON,
              google.maps.drawing.OverlayType.POLYLINE,
              google.maps.drawing.OverlayType.RECTANGLE
            ]
          },
          polygonOptions: {
            fillColor: '#FF6B9D',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#FF6B9D',
            editable: true
          },
          circleOptions: {
            fillColor: '#00F6FF',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#00F6FF',
            editable: true
          }
        });
      }
      drawingManagerRef.current.setMap(gMapRef.current);
    } else {
      drawingManagerRef.current?.setMap(null);
    }
    setShowDrawing(!showDrawing);
  };

  // Toggle heatmap
  const toggleHeatmap = () => {
    if (!gMapRef.current) return;
    const google = (window as any).google;

    if (!showHeatmap) {
      const heatmapData = nodes
        .filter(n => !n.isEssential && n.lat && n.lng)
        .map(n => {
          const priceNum = typeof n.price === 'string' 
            ? parseFloat(n.price.replace(/[^\d.]/g, ''))
            : n.price;
          return {
            location: new google.maps.LatLng(n.lat!, n.lng!),
            weight: priceNum / 100000 // Normalize weight
          };
        });

      if (!heatmapRef.current) {
        heatmapRef.current = new google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          radius: 50,
          opacity: 0.6
        });
      }
      heatmapRef.current.setMap(gMapRef.current);
    } else {
      heatmapRef.current?.setMap(null);
    }
    setShowHeatmap(!showHeatmap);
  };

  // Toggle traffic layer
  const toggleTraffic = () => {
    if (!gMapRef.current) return;
    const google = (window as any).google;

    if (!showTraffic) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(gMapRef.current);
    } else {
      trafficLayerRef.current?.setMap(null);
    }
    setShowTraffic(!showTraffic);
  };

  // Change map type
  const changeMapType = (type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => {
    if (gMapRef.current) {
      gMapRef.current.setMapTypeId(type);
      setMapType(type);
    }
  };

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
        
        if (!apiKey) {
          setLoadError('Google Maps API key not configured');
          console.error('[Map] No API key found');
          return;
        }

        console.log('[Map] Loading Google Maps with all features...');
        await loadGoogleMapsScript(apiKey);
        
        const google = (window as any).google;
        if (!google?.maps) {
          throw new Error('Google Maps failed to load');
        }

        console.log('[Map] Google Maps loaded successfully');

        const validNodes = nodes.map((node, i) => {
          const lat = node.lat ?? node.latitude;
          const lng = node.lng ?? node.longitude;
          return { ...node, lat, lng, id: i };
        }).filter(n => n.lat !== undefined && n.lng !== undefined && !isNaN(n.lat) && !isNaN(n.lng));

        console.log(`[Map] Plotting ${validNodes.length} nodes`);

        if (!gMapRef.current) {
          const initialCenter = center || 
            (validNodes.length > 0 ? { lat: validNodes[0].lat!, lng: validNodes[0].lng! } : 
            { lat: 18.5204, lng: 73.8567 });
          
          gMapRef.current = new google.maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 14,
            gestureHandling: 'greedy',
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
              mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
            },
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            styles: [
              { elementType: "geometry", stylers: [{ color: "#0a0a0f" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#0a0a0f" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] }
            ]
          });

          // Add search box if feature enabled
          if (enableAllFeatures) {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Search location...';
            input.style.cssText = `
              margin: 10px;
              padding: 10px 15px;
              width: 300px;
              border-radius: 24px;
              border: 1px solid rgba(255,255,255,0.1);
              background: rgba(10,10,15,0.9);
              color: white;
              font-size: 14px;
              font-weight: 900;
            `;
            
            gMapRef.current.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
            
            searchBoxRef.current = new google.maps.places.SearchBox(input);
            
            searchBoxRef.current.addListener('places_changed', () => {
              const places = searchBoxRef.current.getPlaces();
              if (places.length === 0) return;

              const place = places[0];
              if (place.geometry && place.geometry.location) {
                gMapRef.current.setCenter(place.geometry.location);
                gMapRef.current.setZoom(15);

                // Add temporary marker
                new google.maps.Marker({
                  map: gMapRef.current,
                  position: place.geometry.location,
                  title: place.name,
                  animation: google.maps.Animation.DROP
                });
              }
            });
          }
          
          setMapReady(true);
          setLoadError(null);
          console.log('[Map] Map initialized with all features');
        }

        const map = gMapRef.current;
        const bounds = new google.maps.LatLngBounds();

        // Clear old markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        // User location marker
        if (userLoc) {
          const userMarker = new google.maps.Marker({
            map,
            position: userLoc,
            title: "Your Location",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#FF6B9D",
              fillOpacity: 1,
              strokeWeight: 3,
              strokeColor: "#ffffff"
            },
            zIndex: 1000
          });
          markersRef.current.push(userMarker);
          bounds.extend(userLoc);
        }

        // Property and Essential markers
        validNodes.forEach((node, idx) => {
          const pos = { lat: node.lat!, lng: node.lng! };
          
          let markerIcon;
          let labelText = '';
          
          if (node.isEssential) {
            markerIcon = {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: node.markerColor || '#FCD34D',
              fillOpacity: 1,
              strokeWeight: 3,
              strokeColor: "#ffffff"
            };
            labelText = node.essentialType?.charAt(0).toUpperCase() || 'E';
          } else {
            markerIcon = undefined;
            const priceStr = typeof node.price === 'string' ? node.price : `₹${node.price}`;
            labelText = priceStr.length > 10 ? priceStr.substring(0, 9) + ".." : priceStr;
          }

          const marker = new google.maps.Marker({
            map,
            position: pos,
            title: node.title,
            icon: markerIcon,
            label: markerIcon ? {
              text: labelText,
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: "900"
            } : {
              text: labelText,
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "900"
            },
            zIndex: node.isEssential ? 500 : (node.isSubject ? 900 : 100)
          });

          markersRef.current.push(marker);
          bounds.extend(pos);

          const dist = userLoc ? getDistance(userLoc.lat, userLoc.lng, pos.lat, pos.lng) : null;
          
          let infoContent;
          if (node.isEssential) {
            infoContent = `
              <div style="padding: 12px; min-width: 200px; background: #0a0a0f; color: white; border-radius: 8px;">
                <div style="font-weight: 900; color: ${node.markerColor || '#FCD34D'}; font-size: 10px; text-transform: uppercase; margin-bottom: 4px;">${node.essentialType || 'Essential Service'}</div>
                <div style="font-weight: 900; font-size: 14px; color: #ffffff; margin: 4px 0;">${node.title}</div>
                <div style="color: #64748b; font-size: 10px; margin-bottom: 8px;">${node.address}</div>
                ${node.rating ? `<div style="color: #FCD34D; font-size: 10px; font-weight: 900; margin-bottom: 4px;">⭐ ${node.rating}</div>` : ''}
                ${node.contact ? `<div style="color: #00F6FF; font-size: 10px; font-weight: 900; margin-bottom: 4px;">📞 ${node.contact}</div>` : ''}
                ${dist !== null ? `<div style="color: #FF6B9D; font-size: 9px; font-weight: 900;">${dist.toFixed(1)} KM AWAY</div>` : ''}
                ${enableAllFeatures && userLoc ? `<button onclick="window.getDirections(${pos.lat}, ${pos.lng})" style="margin-top: 8px; padding: 6px 12px; background: #00F6FF; color: #0a0a0f; border: none; border-radius: 4px; cursor: pointer; font-weight: 900; font-size: 10px;">GET DIRECTIONS</button>` : ''}
              </div>
            `;
          } else {
            const priceDisplay = typeof node.price === 'string' ? node.price : `₹${node.price}`;
            infoContent = `
              <div style="padding: 12px; min-width: 180px; background: #0a0a0f; color: white; border-radius: 8px;">
                <div style="font-weight: 900; color: #585FD8; font-size: 10px; text-transform: uppercase;">${node.title}</div>
                <div style="font-weight: 900; font-size: 16px; color: #00F6FF; margin: 4px 0;">${priceDisplay}</div>
                <div style="color: #64748b; font-size: 10px; margin-bottom: 8px;">${node.address}</div>
                ${dist !== null ? `<div style="color: #FF6B9D; font-size: 9px; font-weight: 900; margin-bottom: 4px;">${dist.toFixed(1)} KM AWAY</div>` : ''}
                ${enableAllFeatures ? `
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 8px; color: #64748b; text-transform: uppercase; font-weight: 900; margin-bottom: 4px;">PROPERTY DATA</div>
                    ${envData.elevation ? `<div style="font-size: 9px; color: #FCD34D;">📏 Elevation: ${envData.elevation.toFixed(1)}m</div>` : ''}
                    ${envData.airQuality ? `<div style="font-size: 9px; color: #00F6FF;">💨 AQI: ${envData.airQuality.aqi}</div>` : ''}
                    ${envData.weather ? `<div style="font-size: 9px; color: #FF6B9D;">🌡️ ${envData.weather.temp}°C</div>` : ''}
                  </div>
                ` : ''}
                ${enableAllFeatures && userLoc ? `<button onclick="window.getDirections(${pos.lat}, ${pos.lng})" style="margin-top: 8px; padding: 6px 12px; background: #00F6FF; color: #0a0a0f; border: none; border-radius: 4px; cursor: pointer; font-weight: 900; font-size: 10px;">GET DIRECTIONS</button>` : ''}
              </div>
            `;
          }

          const infoWindow = new google.maps.InfoWindow({
            content: infoContent
          });

          marker.addListener("click", () => {
            setSelectedNode(node);
            if (enableAllFeatures) {
              fetchEnvironmentalData(pos.lat, pos.lng);
            }
            infoWindow.open(map, marker);
          });

          console.log(`[Map] Marker ${idx + 1}: ${node.title} ${node.isEssential ? '(Essential)' : '(Property)'}`);
        });

        // Global function for directions
        (window as any).getDirections = (lat: number, lng: number) => {
          calculateRoute({ lat, lng });
        };

        // Fit bounds
        if (validNodes.length > 0 || userLoc) {
          map.fitBounds(bounds);
          google.maps.event.addListenerOnce(map, "idle", () => {
            if (map.getZoom() > 16) map.setZoom(16);
          });
          console.log('[Map] Bounds fitted');
        }

      } catch (error: any) {
        console.error('[Map] Error:', error);
        setLoadError(error.message || 'Failed to load map');
        setMapReady(false);
      }
    };

    initMap();
  }, [nodes, center, userLoc, enableAllFeatures]);

  const propertyCount = nodes.filter(n => !n.isEssential).length;
  const essentialCount = nodes.filter(n => n.isEssential).length;

  return (
    <div className="relative w-full h-[550px] rounded-[48px] border border-white/10 group shadow-neo-glow transition-all hover:border-white/20">
      <div ref={mapRef} className="w-full h-full rounded-[48px]" />
      
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neo-bg/90 backdrop-blur-xl rounded-[48px]">
          <div className="text-center p-8">
            <div className="text-neo-pink text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-black text-white mb-2">Map Loading Failed</h3>
            <p className="text-sm text-gray-400 mb-4">{loadError}</p>
            <p className="text-xs text-gray-500">Check API key & billing configuration</p>
          </div>
        </div>
      )}
      
      {/* Status Badge */}
      <div className="absolute top-8 left-8 bg-neo-bg/90 backdrop-blur-xl p-5 rounded-[32px] border border-white/10 shadow-neo-glow pointer-events-none">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-neo-neon animate-pulse" />
          <span className="text-[10px] font-black text-neo-neon uppercase tracking-widest">
            {loadError ? 'Map Error' : mapReady ? 'All Features Active' : 'Loading...'}
          </span>
        </div>
        {showEssentials && essentialCount > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-white font-black">{propertyCount} Properties</p>
            <p className="text-xs text-neo-gold font-black">{essentialCount} Essentials</p>
          </div>
        ) : (
          <p className="text-sm text-white font-black">{nodes.length} Nodes</p>
        )}
      </div>

      {/* Feature Controls */}
      {enableAllFeatures && mapReady && (
        <div className="absolute top-8 right-8 flex flex-col gap-2">
          <button
            onClick={() => changeMapType('roadmap')}
            className={`p-3 rounded-[16px] backdrop-blur-xl border transition-all ${
              mapType === 'roadmap' 
                ? 'bg-neo-neon/20 border-neo-neon text-neo-neon' 
                : 'bg-neo-bg/90 border-white/10 text-white hover:border-white/20'
            }`}
            title="Standard Map"
          >
            🗺️
          </button>
          <button
            onClick={() => changeMapType('satellite')}
            className={`p-3 rounded-[16px] backdrop-blur-xl border transition-all ${
              mapType === 'satellite' 
                ? 'bg-neo-neon/20 border-neo-neon text-neo-neon' 
                : 'bg-neo-bg/90 border-white/10 text-white hover:border-white/20'
            }`}
            title="Satellite View"
          >
            🛰️
          </button>
          <button
            onClick={toggleHeatmap}
            className={`p-3 rounded-[16px] backdrop-blur-xl border transition-all ${
              showHeatmap 
                ? 'bg-neo-pink/20 border-neo-pink text-neo-pink' 
                : 'bg-neo-bg/90 border-white/10 text-white hover:border-white/20'
            }`}
            title="Price Heatmap"
          >
            🔥
          </button>
          <button
            onClick={toggleDrawing}
            className={`p-3 rounded-[16px] backdrop-blur-xl border transition-all ${
              showDrawing 
                ? 'bg-neo-gold/20 border-neo-gold text-neo-gold' 
                : 'bg-neo-bg/90 border-white/10 text-white hover:border-white/20'
            }`}
            title="Drawing Tools"
          >
            ✏️
          </button>
          <button
            onClick={toggleTraffic}
            className={`p-3 rounded-[16px] backdrop-blur-xl border transition-all ${
              showTraffic 
                ? 'bg-red-500/20 border-red-500 text-red-500' 
                : 'bg-neo-bg/90 border-white/10 text-white hover:border-white/20'
            }`}
            title="Traffic Layer"
          >
            🚗
          </button>
        </div>
      )}

      {/* Legend */}
      {showEssentials && essentialCount > 0 && (
        <div className="absolute bottom-8 left-8 right-8 bg-neo-bg/90 backdrop-blur-xl p-4 rounded-[24px] border border-white/10 shadow-neo-glow pointer-events-none">
          <div className="flex flex-wrap gap-3 text-[9px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#585FD8]" />
              <span className="text-gray-400">Properties</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF6B9D]" />
              <span className="text-gray-400">Your Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FCD34D]" />
              <span className="text-gray-400">Essentials</span>
            </div>
          </div>
        </div>
      )}

      {/* Feature Indicator */}
      {enableAllFeatures && mapReady && (
        <div className="absolute bottom-8 right-8 bg-neo-bg/90 backdrop-blur-xl p-3 rounded-[16px] border border-white/10 shadow-neo-glow pointer-events-none">
          <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest space-y-1">
            <div className="text-neo-neon">✓ All APIs Enabled</div>
            <div>Places • Directions • Elevation</div>
            <div>Drawing • Heatmap • Traffic</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapView;
