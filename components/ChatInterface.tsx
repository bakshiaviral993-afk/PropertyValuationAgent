import React, { useState, useEffect, useRef } from 'react';
import { ValuationRequest, ChatMessage, StepField } from '../types';
import { WIZARD_STEPS } from '../constants';
import { Send, Bot, AlertCircle, MapPin, Crosshair, Move } from 'lucide-react';

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

// Internal Map Component to handle lifecycle
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
        
        // Cleanup existing map if it exists
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }

        // Initialize Map
        const map = window.L.map(mapRef.current).setView([lat, lng], 15);
        
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const marker = window.L.marker([lat, lng], { draggable: true }).addTo(map);
        marker.bindPopup("<b>Your Location</b><br>Drag me to fine-tune!").openPopup();

        marker.on('dragend', function(e: any) {
             const newPos = e.target.getLatLng();
             onLocationUpdate(newPos.lat, newPos.lng);
             marker.bindPopup("Updating address...").openPopup();
        });

        mapInstance.current = map;
        markerInstance.current = marker;

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []); // Run initialization once

    return (
        <div className="mt-2 w-full rounded-xl overflow-hidden shadow-md border border-gray-200 bg-gray-100">
             <div ref={mapRef} style={{ height: '240px', width: '100%', zIndex: 0 }} />
             <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 flex items-center border-t border-gray-200">
                <Move size={12} className="mr-1" />
                Drag the pin to adjust precise location
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

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: "Hello! I am your Valuation Tech App Assistant. Let's gather the details to value your property.",
        },
        {
          id: 'q1',
          sender: 'bot',
          text: WIZARD_STEPS[0].question,
        }
      ]);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isGettingLocation]);

  // Pre-fill input if data is available
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

  // Robust field extraction
  const extractLocationFields = (addr: any) => {
    const detectedPincode = addr.postcode || '';
    const detectedState = addr.state || '';
    
    // City priority
    const detectedCity = addr.city || addr.town || addr.municipality || addr.village || '';
    
    // District priority
    const detectedDistrict = addr.district || addr.county || addr.state_district || '';
    
    // Area priority
    const detectedArea = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';

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
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`, {
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
              if (fields.detectedArea) setInputValue(fields.detectedArea);
          }
          
          // Note: We don't flood the chat with updates, we just update the form state
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
                  // Update Form Data
                  const updatedData = { ...formData };
                  if (fields.detectedState) updatedData.state = fields.detectedState;
                  if (fields.detectedCity) updatedData.city = fields.detectedCity;
                  if (fields.detectedPincode) updatedData.pincode = fields.detectedPincode;
                  if (fields.detectedDistrict) updatedData.district = fields.detectedDistrict;
                  if (fields.detectedArea) updatedData.area = fields.detectedArea;
                  updatedData.latitude = latitude;
                  updatedData.longitude = longitude;

                  setFormData(updatedData);

                  if (currentStep.field === StepField.Pincode) {
                      setInputValue(fields.detectedPincode);
                  }

                  // Render Map
                  addBotMessage(
                      `I've detected your location: ${fields.detectedArea}, ${fields.detectedCity}.\nYou can drag the pin on the map below to correct it.`, 
                      <LeafletMap 
                        lat={latitude} 
                        lng={longitude} 
                        onLocationUpdate={handleLocationUpdateFromMap} 
                      />
                  );
              } else {
                  addBotMessage("Could not retrieve precise address details. Please enter manually.");
              }
              setIsGettingLocation(false);
          },
          (error) => {
              console.error(error);
              setIsGettingLocation(false);
              addBotMessage("Unable to retrieve your location. Please enter details manually.");
          }
      );
  };

  const handleNext = async (value: string) => {
    if (!value.trim()) return;

    if (currentStep.type === 'number' && isNaN(Number(value))) {
        return;
    }

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

    // 1. Pincode -> Fetch Area/District
    if (currentStep.field === StepField.Pincode) {
        if (!updatedData.latitude) {
            const details = await fetchLocationDetailsByPincode(value);
            if (details) {
                updatedData.district = details.district;
                updatedData.area = details.area;
                
                if (!updatedData.latitude && details.lat) {
                    updatedData.latitude = details.lat;
                    updatedData.longitude = details.lon;
                }

                setTimeout(() => {
                    addBotMessage(`I found details for Pincode ${value}:\nDistrict: ${details.district}\nLocality: ${details.area}`);
                }, 400);
            }
        }
    }

    // 2. Builder Name -> Show Full Address
    if (currentStep.field === StepField.BuilderName) {
        setTimeout(() => {
            const addr = `Property Address:\n${updatedData.projectName}\n${updatedData.area}\n${updatedData.city}, ${updatedData.district || ''}\n${updatedData.state} - ${updatedData.pincode}`;
            addBotMessage(addr);
        }, 300);
    }

    // 3. Construction Year -> New vs Old Logic
    if (currentStep.field === StepField.ConstructionYear) {
        const year = Number(value);
        const currentYear = new Date().getFullYear();
        const age = currentYear - year;
        const status = age <= 5 ? "New Property" : "Old Property";
        setTimeout(() => {
            addBotMessage(`Construction Year is ${year}. This is categorized as a: ${status}`);
        }, 300);
    }

    setFormData(updatedData);
    setInputValue('');

    // Determine Next Step
    let nextIndex = currentStepIndex + 1;

    // Conditional Skipping Logic
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
        addBotMessage("Thank you! I have all the details. Calculating valuation, sentiment, and confidence score...");
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
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-brand-600 p-4 flex items-center shadow-sm z-10">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white mr-3 backdrop-blur-sm">
           <Bot size={24} />
        </div>
        <div>
           <h2 className="text-white font-semibold text-lg">Valuation Tech Agent</h2>
           <p className="text-brand-100 text-xs">Real-time Property Valuation</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-brand-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              {msg.text}
              {msg.component && <div className="mt-3 w-full">{msg.component}</div>}
            </div>
          </div>
        ))}
        {(isLoading || isGettingLocation) && (
          <div className="flex justify-start">
             <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        {!isLoading && currentStepIndex < WIZARD_STEPS.length ? (
          <div className="flex flex-col gap-2">
             {/* Show Geolocation Option only for Pincode step */}
             {currentStep.field === StepField.Pincode && (
                <div className="mb-2">
                    <button 
                        onClick={handleGeoLocation}
                        className="flex items-center text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-lg transition-colors border border-brand-200"
                        disabled={isGettingLocation}
                    >
                        <Crosshair size={14} className="mr-1" />
                        {isGettingLocation ? "Detecting..." : "Use Current Location"}
                    </button>
                </div>
             )}

             {currentStep.type === 'select' ? (
                 <div className="flex flex-wrap gap-2 mb-2">
                    {currentStep.options?.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleNext(opt)}
                          className="px-4 py-2 bg-gray-100 hover:bg-brand-50 text-gray-700 hover:text-brand-600 rounded-full text-sm font-medium transition-colors border border-gray-200 hover:border-brand-200"
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
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
                    autoFocus
                    />
                    <button
                    onClick={() => handleNext(inputValue)}
                    disabled={!inputValue.trim()}
                    className="absolute right-2 p-2 bg-brand-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 transition-colors"
                    >
                    <Send size={18} />
                    </button>
                </div>
             )}
             {currentStep.type === 'number' && (
               <p className="text-xs text-gray-400 ml-1">Please enter a valid number</p>
             )}
          </div>
        ) : isLoading ? (
             <div className="text-center text-gray-500 text-sm py-3 italic flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                <span>Processing Valuation...</span>
             </div>
        ) : (
            <div className="text-center py-3">
                <button 
                    onClick={() => window.location.reload()}
                    className="text-brand-600 text-sm font-medium hover:underline"
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