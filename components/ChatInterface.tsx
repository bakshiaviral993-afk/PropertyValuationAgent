import React, { useState, useEffect, useRef } from 'react';
import { ValuationRequest, ChatMessage, StepField } from '../types';
import { WIZARD_STEPS } from '../constants';
import { Send, Bot, AlertCircle, MapPin, Move, ExternalLink, LocateFixed } from 'lucide-react';

// Declare Leaflet on window
declare global {
  interface Window {
    L: any;
  }
}

interface ChatInterfaceProps {
  onComplete: (data: ValuationRequest) => void;
  isLoading: boolean;
}

// Internal Map Component
const LeafletMap = ({ 
  lat, 
  lng, 
  onLocationUpdate 
}: { 
  lat: number, 
  lng: number, 
  onLocationUpdate: (lat: number, lng: number) => void 
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || !window.L) return;
        
        if (mapInstance.current) {
            // Update existing map
            mapInstance.current.setView([lat, lng], 16);
            if (markerInstance.current) {
                markerInstance.current.setLatLng([lat, lng]);
                markerInstance.current.bindPopup("Updated Location").openPopup();
            }
            return;
        }

        const map = window.L.map(mapRef.current).setView([lat, lng], 16);
        
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const marker = window.L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.bindPopup("<b>Selected Location</b><br>Drag marker to refine").openPopup();

        marker.on('dragend', function(e: any) {
             const newPos = e.target.getLatLng();
             onLocationUpdate(newPos.lat, newPos.lng);
             marker.bindPopup("Updating location...").openPopup();
             map.panTo(newPos);
        });

        map.on('click', function(e: any) {
            marker.setLatLng(e.latlng);
            onLocationUpdate(e.latlng.lat, e.latlng.lng);
            marker.bindPopup("Updating location...").openPopup();
            map.panTo(e.latlng);
        });

        mapInstance.current = map;
        markerInstance.current = marker;

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [lat, lng]);

    return (
        <div className="mt-2 w-full rounded-xl overflow-hidden shadow-md border border-slate-200 bg-slate-100 relative group">
             <div ref={mapRef} style={{ height: '280px', width: '100%', zIndex: 0 }} />
             <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-slate-500 z-[400] pointer-events-none border border-slate-200 shadow-sm font-mono">
                Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
             </div>
             <div className="bg-teal-50 px-3 py-2 text-xs text-teal-800 flex items-center border-t border-teal-100 justify-between">
                <div className="flex items-center font-medium">
                    <Move size={12} className="mr-1.5 text-teal-600" />
                    Drag marker to refine
                </div>
             </div>
        </div>
    );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onComplete, isLoading }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Partial<ValuationRequest>>({});
  const [inputValue, setInputValue] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentStep = WIZARD_STEPS[currentStepIndex];

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: "Welcome to QuantCasa. I am your automated valuation agent. Let's gather your property details for a precise estimate.",
        },
        {
          id: 'q1',
          sender: 'bot',
          text: WIZARD_STEPS[0].question,
        }
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isGettingLocation]);

  useEffect(() => {
    if (currentStep.field === StepField.Area && formData.area) {
      setInputValue(formData.area);
    }
  }, [currentStepIndex, currentStep.field, formData.area]);

  const addBotMessage = (text: string, component?: React.ReactNode) => {
    setMessages(prev => [...prev, { 
        id: `bot-${Date.now()}-${Math.random()}`, 
        sender: 'bot', 
        text,
        component
    }]);
  };

  const extractLocationFields = (addr: any) => {
    const safeStr = (val: any) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'object') return ''; 
        return String(val);
    };

    const detectedPincode = safeStr(addr.postcode);
    const detectedState = safeStr(addr.state);
    const detectedCity = safeStr(addr.city || addr.town || addr.municipality || addr.city_district || addr.village);
    const detectedDistrict = safeStr(addr.state_district || addr.district || addr.county);
    const detectedArea = safeStr(addr.neighbourhood || addr.suburb || addr.residential || addr.village || addr.road);

    return { detectedPincode, detectedState, detectedCity, detectedDistrict, detectedArea };
  };

  const fetchLocationDetailsByPincode = async (pincode: string) => {
      try {
          const cleanPincode = encodeURIComponent(pincode.trim());
          const url = `https://nominatim.openstreetmap.org/search?q=${cleanPincode}+India&format=json&addressdetails=1&limit=1`;
          
          const response = await fetch(url, { headers: { 'Accept-Language': 'en-US,en;q=0.9' } });
          if (!response.ok) return null;

          const data = await response.json();
          if (data && data.length > 0) {
              const place = data[0];
              const fields = extractLocationFields(place.address || {});
              return { 
                  district: fields.detectedDistrict, 
                  area: fields.detectedArea, 
                  lat: parseFloat(place.lat), 
                  lon: parseFloat(place.lon) 
              };
          }
      } catch (e) {
          console.warn("Failed to fetch location by pincode", e);
      }
      return null;
  };

  const reverseGeocode = async (lat: number, lon: number) => {
      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`, {
              headers: { 'Accept-Language': 'en-US,en;q=0.9' }
          });
          if (!response.ok) throw new Error("Network response was not ok");
          const data = await response.json();
          return extractLocationFields(data.address || {});
      } catch (e) {
          console.warn("Reverse geocoding failed", e);
          return null;
      }
  };

  const handleLocationUpdateFromMap = async (lat: number, lng: number) => {
      const fields = await reverseGeocode(lat, lng);
      if (fields) {
          setFormData(prev => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              area: fields.detectedArea || prev.area,
              pincode: fields.detectedPincode || prev.pincode,
              district: fields.detectedDistrict || prev.district,
              city: fields.detectedCity || prev.city,
              state: fields.detectedState || prev.state
          }));
          
          if (currentStep.field === StepField.Area || currentStep.field === StepField.Pincode) {
              if (fields.detectedArea) {
                  setInputValue(fields.detectedArea);
              } else if (fields.detectedCity) {
                  setInputValue(fields.detectedCity);
              }
          }
      }
  };

  const handleGeoLocation = () => {
      if (!navigator.geolocation) {
          addBotMessage("Geolocation is not supported by your browser.");
          return;
      }

      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
          async (position) => {
              const { latitude, longitude } = position.coords;
              const fields = await reverseGeocode(latitude, longitude);

              if (fields) {
                  const updatedData = { ...formData };
                  if (fields.detectedState) updatedData.state = fields.detectedState;
                  if (fields.detectedCity) updatedData.city = fields.detectedCity;
                  if (fields.detectedPincode) updatedData.pincode = fields.detectedPincode;
                  if (fields.detectedDistrict) updatedData.district = fields.detectedDistrict;
                  if (fields.detectedArea) updatedData.area = fields.detectedArea;
                  updatedData.latitude = latitude;
                  updatedData.longitude = longitude;

                  setFormData(updatedData);

                  // Smart Autofill: Check which step we are on
                  if (currentStep.field === StepField.Pincode) {
                      setInputValue(fields.detectedPincode || '');
                  } else if (currentStep.field === StepField.Area) {
                      setInputValue(fields.detectedArea || fields.detectedCity || '');
                  }

                  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                  const MapComponent = (
                      <div className="flex flex-col gap-2 w-full">
                          <LeafletMap 
                            lat={latitude} 
                            lng={longitude} 
                            onLocationUpdate={handleLocationUpdateFromMap} 
                          />
                          <a 
                             href={mapUrl} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="text-xs text-teal-600 flex items-center justify-end hover:underline"
                          >
                             <MapPin size={12} className="mr-1"/> Open in Google Maps <ExternalLink size={10} className="ml-1" />
                          </a>
                      </div>
                  );

                  addBotMessage(
                      `Location detected: ${fields.detectedArea || ''} ${fields.detectedCity ? `, ${fields.detectedCity}` : ''}.`, 
                      MapComponent
                  );
              } else {
                  addBotMessage("Could not retrieve precise address. Please enter manually.");
              }
              setIsGettingLocation(false);
          },
          (error) => {
              console.error(error);
              setIsGettingLocation(false);
              addBotMessage("Unable to retrieve location. Please enter manually.");
          }
      );
  };

  const handleNext = async (value: string) => {
    if (!value.trim()) return;
    if (currentStep.type === 'number' && isNaN(Number(value))) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { id: `user-${Date.now()}`, sender: 'user', text: value }
    ];
    setMessages(newMessages);

    const updatedData = { ...formData };
    if (currentStep.type === 'number') {
       (updatedData as any)[currentStep.field] = Number(value);
    } else {
       (updatedData as any)[currentStep.field] = value;
    }

    if (currentStep.field === StepField.Pincode) {
        // ALWAYS try to fetch details if user explicitly entered a pincode.
        // This overrides previous geolocation data if necessary, fixing the bug where the valuation used stale location data.
        const details = await fetchLocationDetailsByPincode(value);
        if (details) {
            updatedData.district = details.district;
            updatedData.area = details.area;
            
            // If pincode yielded coordinates, use them (overwrite previous)
            if (details.lat) {
                updatedData.latitude = details.lat;
                updatedData.longitude = details.lon;
            }
            
            setTimeout(() => {
                const MapComponent = (
                    <div className="flex flex-col gap-2 w-full">
                        <LeafletMap 
                            lat={details.lat} 
                            lng={details.lon} 
                            onLocationUpdate={handleLocationUpdateFromMap} 
                        />
                    </div>
                );
                addBotMessage(
                    `Details found for ${value}:\nDistrict: ${details.district}\nLocality: ${details.area}`, 
                    MapComponent
                );
            }, 400);
        }
    }

    if (currentStep.field === StepField.BuilderName) {
        setTimeout(() => {
            const addr = `Property Address:\n${updatedData.projectName}\n${updatedData.area}\n${updatedData.city}, ${updatedData.district || ''}\n${updatedData.state} - ${updatedData.pincode}`;
            addBotMessage(addr);
        }, 300);
    }

    if (currentStep.field === StepField.ConstructionYear) {
        const year = Number(value);
        const currentYear = new Date().getFullYear();
        const age = currentYear - year;
        const status = age <= 5 ? "New Property" : "Old Property";
        setTimeout(() => {
            addBotMessage(`Construction Year: ${year} (${status})`);
        }, 300);
    }

    setFormData(updatedData);
    setInputValue('');

    let nextIndex = currentStepIndex + 1;
    if (currentStep.field === StepField.HasParking && value === 'No') {
        nextIndex = WIZARD_STEPS.findIndex(s => s.field === StepField.HasAmenities);
    }
    else if (currentStep.field === StepField.HasAmenities && value === 'No') {
        nextIndex = WIZARD_STEPS.findIndex(s => s.field === StepField.FSI);
    }

    if (nextIndex < WIZARD_STEPS.length) {
      setCurrentStepIndex(nextIndex);
      setTimeout(() => {
        addBotMessage(WIZARD_STEPS[nextIndex].question);
      }, 600);
    } else {
      setTimeout(() => {
        addBotMessage("Data collection complete. Running market analysis and valuation models...");
        onComplete(updatedData as ValuationRequest);
      }, 600);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center shadow-sm z-10 border-b border-slate-800">
        <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 mr-3 border border-teal-500/30">
           <Bot size={24} />
        </div>
        <div>
           <h2 className="text-white font-bold text-lg">Valuation Agent</h2>
           <p className="text-slate-400 text-xs font-medium">QuantCasa AI</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-teal-500 text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              {msg.text}
              {msg.component && <div className="mt-3 w-full">{msg.component}</div>}
            </div>
          </div>
        ))}
        {(isLoading || isGettingLocation) && (
          <div className="flex justify-start">
             <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        {!isLoading && currentStepIndex < WIZARD_STEPS.length ? (
          <div className="flex flex-col gap-2">
             {(currentStep.field === StepField.Pincode || currentStep.field === StepField.Area) && (
                <div className="mb-2 flex justify-between items-center">
                    <button 
                        onClick={handleGeoLocation}
                        className="flex items-center text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg transition-colors border border-teal-200"
                        disabled={isGettingLocation}
                    >
                        <LocateFixed size={14} className="mr-1" />
                        {isGettingLocation ? "Detecting..." : "Use Current Location"}
                    </button>
                    <span className="text-[10px] text-slate-400">OpenStreetMap</span>
                </div>
             )}

             {currentStep.type === 'select' ? (
                 <div className="flex flex-wrap gap-2 mb-2">
                    {currentStep.options?.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleNext(opt)}
                          className="px-4 py-2 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-full text-sm font-semibold transition-all border border-slate-200 hover:border-teal-300"
                        >
                            {opt}
                        </button>
                    ))}
                 </div>
             ) : (
                <div className="relative flex items-center">
                    <input
                    type={currentStep.type === 'number' ? 'number' : 'text'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentStep.placeholder}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all placeholder:text-slate-400"
                    autoFocus
                    />
                    <button
                    onClick={() => handleNext(inputValue)}
                    disabled={!inputValue.trim()}
                    className="absolute right-2 p-2 bg-teal-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-600 transition-colors"
                    >
                    <Send size={18} />
                    </button>
                </div>
             )}
          </div>
        ) : isLoading ? (
             <div className="text-center text-slate-500 text-sm py-3 italic flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                <span>Running Valuation Algorithm...</span>
             </div>
        ) : (
            <div className="text-center py-3">
                <button 
                    onClick={() => window.location.reload()}
                    className="text-teal-600 text-sm font-bold hover:underline"
                >
                    Start New Valuation
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;