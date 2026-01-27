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
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  try {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  } catch (error) {
    console.error('Distance calculation error:', error);
    return 0;
  }
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
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for Google Maps'));
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
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
  showEssentials = false 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const markersRef = useRef<any[]>([]);
  const gMapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'billing' | 'api' | 'key' | 'data' | 'other' | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          try {
            setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            console.log('[Location] User location set:', pos.coords.latitude, pos.coords.longitude);
          } catch (error) {
            console.error('[Location] Error setting user location:', error);
          }
        },
        (error) => {
          console.warn('[Location] Permission denied or error:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) {
        console.log('[Map] Map ref not ready');
        return;
      }

      try {
        // Validate nodes data
        if (!Array.isArray(nodes)) {
          throw new Error('Nodes must be an array');
        }

        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
        
        if (!apiKey) {
          setErrorType('key');
          setLoadError('API key not found in environment variables');
          console.error('[Map] No API key found');
          return;
        }

        console.log('[Map] Loading Google Maps...');
        await loadGoogleMapsScript(apiKey);
        
        const google = (window as any).google;
        if (!google?.maps) {
          throw new Error('Google Maps object not available');
        }

        console.log('[Map] Google Maps loaded successfully');

        // Validate and filter nodes with better error handling
        const validNodes = nodes
          .map((node, i) => {
            try {
              if (!node || typeof node !== 'object') {
                console.warn(`[Map] Invalid node at index ${i}:`, node);
                return null;
              }

              const lat = typeof node.lat === 'number' ? node.lat : 
                         typeof node.latitude === 'number' ? node.latitude : null;
              const lng = typeof node.lng === 'number' ? node.lng : 
                         typeof node.longitude === 'number' ? node.longitude : null;
              
              if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
                console.warn(`[Map] Invalid coordinates at index ${i}:`, { lat, lng });
                return null;
              }

              return {
                ...node,
                lat,
                lng,
                id: i,
                title: String(node.title || 'Unknown'),
                price: node.price || '0',
                address: String(node.address || 'No address')
              };
            } catch (error) {
              console.error(`[Map] Error processing node ${i}:`, error);
              return null;
            }
          })
          .filter((n): n is NonNullable<typeof n> => n !== null);

        console.log(`[Map] Valid nodes: ${validNodes.length} out of ${nodes.length}`);

        if (validNodes.length === 0) {
          setErrorType('data');
          setLoadError('No valid location data found in nodes');
          return;
        }

        if (!gMapRef.current) {
          const initialCenter = center || 
            (validNodes.length > 0 ? { lat: validNodes[0].lat, lng: validNodes[0].lng } : 
            { lat: 18.5204, lng: 73.8567 });
          
          console.log('[Map] Creating map with center:', initialCenter);

          gMapRef.current = new google.maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 14,
            gestureHandling: 'greedy',
            disableDefaultUI: false,
            mapTypeControl: true,
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
          
          setMapReady(true);
          setLoadError(null);
          setErrorType(null);
          console.log('[Map] Map initialized successfully');
        }

        const map = gMapRef.current;
        const bounds = new google.maps.LatLngBounds();

        // Clear old markers
        markersRef.current.forEach(m => {
          try {
            m.setMap(null);
          } catch (error) {
            console.error('[Map] Error clearing marker:', error);
          }
        });
        markersRef.current = [];

        // User location marker
        if (userLoc && typeof userLoc.lat === 'number' && typeof userLoc.lng === 'number') {
          try {
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
            console.log('[Map] User location marker added');
          } catch (error) {
            console.error('[Map] Error adding user marker:', error);
          }
        }

        // Property and Essential markers
        validNodes.forEach((node, idx) => {
          try {
            const pos = { lat: node.lat, lng: node.lng };
            
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
              const priceStr = typeof node.price === 'string' ? node.price : `₹${node.price}`;
              labelText = priceStr.length > 10 ? priceStr.substring(0, 9) + ".." : priceStr;
            }

            const marker = new google.maps.Marker({
              map,
              position: pos,
              title: node.title,
              icon: markerIcon,
              label: {
                text: labelText,
                color: "#ffffff",
                fontSize: markerIcon ? "12px" : "10px",
                fontWeight: "900"
              },
              zIndex: node.isEssential ? 500 : (node.isSubject ? 900 : 100)
            });

            markersRef.current.push(marker);
            bounds.extend(pos);

            const dist = userLoc && typeof userLoc.lat === 'number' && typeof userLoc.lng === 'number'
              ? getDistance(userLoc.lat, userLoc.lng, pos.lat, pos.lng)
              : null;
            
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
                </div>
              `;
            } else {
              const priceDisplay = typeof node.price === 'string' ? node.price : `₹${node.price}`;
              infoContent = `
                <div style="padding: 12px; min-width: 180px; background: #0a0a0f; color: white; border-radius: 8px;">
                  <div style="font-weight: 900; color: #585FD8; font-size: 10px; text-transform: uppercase;">${node.title}</div>
                  <div style="font-weight: 900; font-size: 16px; color: #00F6FF; margin: 4px 0;">${priceDisplay}</div>
                  <div style="color: #64748b; font-size: 10px; margin-bottom: 8px;">${node.address}</div>
                  ${dist !== null ? `<div style="color: #FF6B9D; font-size: 9px; font-weight: 900;">${dist.toFixed(1)} KM AWAY</div>` : ''}
                </div>
              `;
            }

            const infoWindow = new google.maps.InfoWindow({
              content: infoContent
            });

            marker.addListener("click", () => {
              infoWindow.open(map, marker);
            });

            console.log(`[Map] Marker ${idx + 1}: ${node.title} added successfully`);
          } catch (error) {
            console.error(`[Map] Error creating marker ${idx}:`, error);
          }
        });

        // Fit bounds
        if (validNodes.length > 0 || userLoc) {
          try {
            map.fitBounds(bounds);
            google.maps.event.addListenerOnce(map, "idle", () => {
              try {
                if (map.getZoom() > 16) map.setZoom(16);
              } catch (error) {
                console.error('[Map] Error setting zoom:', error);
              }
            });
            console.log('[Map] Bounds fitted successfully');
          } catch (error) {
            console.error('[Map] Error fitting bounds:', error);
          }
        }

      } catch (error: any) {
        console.error('[Map] Initialization error:', error);
        
        const errorMsg = error.message || String(error);
        
        if (errorMsg.includes('BillingNotEnabled')) {
          setErrorType('billing');
          setLoadError('Billing not enabled on your Google Cloud project');
        } else if (errorMsg.includes('ApiNotActivated')) {
          setErrorType('api');
          setLoadError('Maps JavaScript API not enabled');
        } else if (errorMsg.includes('Nodes must be an array') || errorMsg.includes('No valid location data')) {
          setErrorType('data');
          setLoadError(errorMsg);
        } else {
          setErrorType('other');
          setLoadError(errorMsg || 'Failed to load map');
        }
        setMapReady(false);
      }
    };

    initMap();
  }, [nodes, center, userLoc]);

  const propertyCount = Array.isArray(nodes) ? nodes.filter(n => n && !n.isEssential).length : 0;
  const essentialCount = Array.isArray(nodes) ? nodes.filter(n => n && n.isEssential).length : 0;

  const renderErrorMessage = () => {
    if (errorType === 'data') {
      return (
        <div className="space-y-4">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-black text-white">Invalid Data</h3>
          <p className="text-sm text-gray-400">{loadError}</p>
          
          <div className="text-left bg-black/60 p-6 rounded-2xl border border-orange-500/30 space-y-3">
            <p className="text-orange-400 font-black text-sm">📋 CHECK YOUR DATA:</p>
            
            <div className="space-y-2 text-xs text-gray-300">
              <p className="font-bold text-white">Required fields for each node:</p>
              <code className="block bg-black/50 p-3 rounded text-green-400 font-mono text-xs">
{`{
  title: string,
  price: string | number,
  address: string,
  lat: number,  // or latitude
  lng: number   // or longitude
}`}
              </code>
              
              <p className="text-gray-400 pt-2">Check that all nodes have valid lat/lng coordinates</p>
            </div>
          </div>
        </div>
      );
    }

    if (errorType === 'billing') {
      return (
        <div className="space-y-4">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-2xl font-black text-white">Billing Not Enabled</h3>
          <p className="text-sm text-gray-400">Enable billing at console.cloud.google.com/billing</p>
        </div>
      );
    }

    if (errorType === 'api') {
      return (
        <div className="space-y-4">
          <div className="text-6xl mb-4">🔌</div>
          <h3 className="text-2xl font-black text-white">API Not Enabled</h3>
          <p className="text-sm text-gray-400">Enable Maps JavaScript API in Google Cloud Console</p>
        </div>
      );
    }

    if (errorType === 'key') {
      return (
        <div className="space-y-4">
          <div className="text-6xl mb-4">🔑</div>
          <h3 className="text-2xl font-black text-white">API Key Missing</h3>
          <p className="text-sm text-gray-400">Add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-2xl font-black text-white">Map Loading Failed</h3>
        <div className="text-left bg-black/60 p-4 rounded-2xl border border-gray-500/30">
          <p className="text-xs text-gray-400 font-mono break-words">{loadError}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-[550px] rounded-[48px] border border-white/10 group shadow-neo-glow transition-all hover:border-white/20">
      <div ref={mapRef} className="w-full h-full rounded-[48px]" />
      
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neo-bg/95 backdrop-blur-xl rounded-[48px] z-50 p-8">
          <div className="text-center max-w-2xl">
            {renderErrorMessage()}
          </div>
        </div>
      )}
      
      <div className="absolute top-8 left-8 bg-neo-bg/90 backdrop-blur-xl p-5 rounded-[32px] border border-white/10 shadow-neo-glow pointer-events-none z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-2 h-2 rounded-full ${mapReady ? 'bg-neo-neon animate-pulse' : loadError ? 'bg-red-500' : 'bg-yellow-500'}`} />
          <span className="text-[10px] font-black text-neo-neon uppercase tracking-widest">
            {loadError ? 'Error' : mapReady ? 'Map Active' : 'Loading...'}
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

      {showEssentials && essentialCount > 0 && !loadError && (
        <div className="absolute bottom-8 left-8 right-8 bg-neo-bg/90 backdrop-blur-xl p-4 rounded-[24px] border border-white/10 shadow-neo-glow pointer-events-none z-10">
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
    </div>
  );
};

export default GoogleMapView;
