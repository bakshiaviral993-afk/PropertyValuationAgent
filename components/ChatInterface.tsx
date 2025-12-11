import React, { useState, useEffect, useRef } from 'react';
import { ValuationRequest, ChatMessage, StepField } from '../types';
import { WIZARD_STEPS } from '../constants';
import { Send, Bot, MapPin, Move, ExternalLink, LocateFixed, Cpu, Mic, MicOff, XCircle, Pencil, RotateCcw } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { createBlob, decodeAudioData, decode } from '../utils/audioUtils';

declare global {
  interface Window {
    L: any;
  }
}

interface ChatInterfaceProps {
  onComplete: (data: ValuationRequest) => void;
  isLoading: boolean;
}

// --- TOOL DEFINITION FOR LIVE API ---
const SUBMIT_VALUATION_TOOL: FunctionDeclaration = {
  name: 'submit_valuation_data',
  description: 'Submits the collected property details for valuation. Call this when you have gathered sufficient information like location, project, and configuration.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      state: { type: Type.STRING },
      city: { type: Type.STRING },
      pincode: { type: Type.STRING },
      district: { type: Type.STRING },
      area: { type: Type.STRING },
      projectName: { type: Type.STRING },
      builderName: { type: Type.STRING },
      bhk: { type: Type.STRING },
      facing: { type: Type.STRING },
      floor: { type: Type.NUMBER },
      totalFloors: { type: Type.NUMBER },
      constructionYear: { type: Type.NUMBER },
      distanceFromMainRoad: { type: Type.STRING },
      roadType: { type: Type.STRING },
      nearbyLocations: { type: Type.STRING },
      carpetArea: { type: Type.NUMBER },
      builtUpArea: { type: Type.NUMBER },
      superBuiltUpArea: { type: Type.NUMBER },
      hasParking: { type: Type.STRING, enum: ['Yes', 'No'] },
      parkingCharges: { type: Type.NUMBER },
      hasAmenities: { type: Type.STRING, enum: ['Yes', 'No'] },
      amenitiesCharges: { type: Type.NUMBER },
      fsi: { type: Type.NUMBER }
    },
    required: ['city', 'area', 'projectName']
  }
};

// Internal Map Component (Dark Mode)
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
            mapInstance.current.setView([lat, lng], 16);
            if (markerInstance.current) {
                markerInstance.current.setLatLng([lat, lng]);
            }
            return;
        }

        const map = window.L.map(mapRef.current, { zoomControl: false }).setView([lat, lng], 16);
        
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        const icon = window.L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#00F6FF; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 15px #00F6FF; border: 2px solid white;'></div>",
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });

        const marker = window.L.marker([lat, lng], { draggable: true, icon }).addTo(map);

        marker.on('dragend', function(e: any) {
             const newPos = e.target.getLatLng();
             onLocationUpdate(newPos.lat, newPos.lng);
             map.panTo(newPos);
        });

        map.on('click', function(e: any) {
            marker.setLatLng(e.latlng);
            onLocationUpdate(e.latlng.lat, e.latlng.lng);
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
        <div className="mt-3 w-full rounded-xl overflow-hidden border border-cyber-border bg-cyber-black relative group shadow-lg">
             <div ref={mapRef} style={{ height: '220px', width: '100%', zIndex: 0 }} />
             <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-[10px] text-cyber-teal font-mono z-[400]">
                COORD: {lat.toFixed(4)}, {lng.toFixed(4)}
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
  
  // Voice Mode State
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null); // Live Session
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const currentStep = WIZARD_STEPS[currentStepIndex];

  // --- STANDARD CHAT EFFECT ---
  useEffect(() => {
    if (messages.length === 0 && !isVoiceMode) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: "QuantCasa Valuation Module initialized. I will guide you through the data acquisition process.",
        },
        {
          id: 'q1',
          sender: 'bot',
          text: WIZARD_STEPS[0].question,
        }
      ]);
    }
  }, [isVoiceMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isGettingLocation, isVoiceConnected]);

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

  // --- LOCATION HELPERS ---
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
          const response = await fetch(url);
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
          console.warn("API Error", e);
      }
      return null;
  };

  const reverseGeocode = async (lat: number, lon: number) => {
      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`);
          if (!response.ok) throw new Error("Network response was not ok");
          const data = await response.json();
          return extractLocationFields(data.address || {});
      } catch (e) {
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
              setInputValue(fields.detectedArea || fields.detectedCity || '');
          }
      }
  };

  const handleGeoLocation = () => {
      if (!navigator.geolocation) {
          addBotMessage("Geolocation sensor unavailable.");
          return;
      }
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
          async (position) => {
              const { latitude, longitude } = position.coords;
              const fields = await reverseGeocode(latitude, longitude);

              if (fields) {
                  const updatedData = { ...formData, ...fields };
                  updatedData.latitude = latitude;
                  updatedData.longitude = longitude;
                  setFormData(updatedData);

                  if (currentStep.field === StepField.Pincode) setInputValue(fields.detectedPincode || '');
                  else if (currentStep.field === StepField.Area) setInputValue(fields.detectedArea || fields.detectedCity || '');

                  const MapComponent = (
                      <div className="flex flex-col gap-2 w-full">
                          <LeafletMap lat={latitude} lng={longitude} onLocationUpdate={handleLocationUpdateFromMap} />
                      </div>
                  );
                  addBotMessage(`Coordinates acquired.`, MapComponent);
              }
              setIsGettingLocation(false);
          },
          () => {
              setIsGettingLocation(false);
              addBotMessage("Signal lost. Manual input required.");
          }
      );
  };

  const handleNext = async (value: string) => {
    if (!value.trim()) return;
    if (currentStep.type === 'number' && isNaN(Number(value))) return;

    // Save current step index to the message for edit functionality
    const stepRecorded = currentStepIndex;

    const newMessages: ChatMessage[] = [...messages, { 
        id: `user-${Date.now()}`, 
        sender: 'user', 
        text: value,
        stepIndex: stepRecorded
    }];
    setMessages(newMessages);

    const updatedData = { ...formData };
    if (currentStep.type === 'number') (updatedData as any)[currentStep.field] = Number(value);
    else (updatedData as any)[currentStep.field] = value;

    if (currentStep.field === StepField.Pincode) {
        const details = await fetchLocationDetailsByPincode(value);
        if (details) {
            updatedData.district = details.district;
            updatedData.area = details.area;
            if (details.lat) {
                updatedData.latitude = details.lat;
                updatedData.longitude = details.lon;
            }
            setTimeout(() => {
                addBotMessage(`Grid location identified: ${details.area}`, 
                    <LeafletMap lat={details.lat} lng={details.lon} onLocationUpdate={handleLocationUpdateFromMap} />
                );
            }, 400);
        }
    }

    setFormData(updatedData);
    setInputValue('');

    let nextIndex = currentStepIndex + 1;
    if (currentStep.field === StepField.HasParking && value === 'No') nextIndex = WIZARD_STEPS.findIndex(s => s.field === StepField.HasAmenities);
    else if (currentStep.field === StepField.HasAmenities && value === 'No') nextIndex = WIZARD_STEPS.findIndex(s => s.field === StepField.FSI);

    if (nextIndex < WIZARD_STEPS.length) {
      setCurrentStepIndex(nextIndex);
      setTimeout(() => addBotMessage(WIZARD_STEPS[nextIndex].question), 600);
    } else {
      setTimeout(() => {
        addBotMessage("Data acquisition complete. Initiating valuation model...");
        onComplete(updatedData as ValuationRequest);
      }, 600);
    }
  };

  const handleEdit = (messageIndex: number) => {
      const targetMessage = messages[messageIndex];
      
      // Safety check
      if (targetMessage.stepIndex === undefined) return;

      // 1. Revert Step Index
      setCurrentStepIndex(targetMessage.stepIndex);

      // 2. Pre-fill input with the previous answer
      setInputValue(targetMessage.text || '');

      // 3. Truncate messages: Keep everything BEFORE the answer we are editing
      setMessages(messages.slice(0, messageIndex));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleNext(inputValue);
    }
  };

  // --- GEMINI LIVE API IMPLEMENTATION ---

  const connectToLiveAPI = async () => {
    try {
      setIsVoiceMode(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected');
            setIsVoiceConnected(true);
            
            // Setup Input Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Visualize Volume
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
              setVoiceVolume(Math.min(100, (sum / inputData.length) * 500));

              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                 session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            
            sourceRef.current = source;
            processorRef.current = scriptProcessor;
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Function Calls
             if (message.toolCall) {
                console.log('Tool Call Received:', message.toolCall);
                for (const fc of message.toolCall.functionCalls) {
                   if (fc.name === 'submit_valuation_data') {
                       // We got the data!
                       const data = fc.args as any;
                       const completeData = {
                           ...INITIAL_VALUATION_REQUEST, // defaults
                           ...data
                       };
                       // Ensure numbers are numbers
                       ['floor','totalFloors','constructionYear','carpetArea','builtUpArea','superBuiltUpArea','parkingCharges','amenitiesCharges','fsi'].forEach(k => {
                           if(completeData[k]) completeData[k] = Number(completeData[k]);
                       });

                       disconnectLiveAPI();
                       onComplete(completeData as ValuationRequest);

                       // Respond to model to close loop (optional since we disconnect)
                       sessionPromise.then(s => s.sendToolResponse({
                           functionResponses: {
                               id: fc.id,
                               name: fc.name,
                               response: { result: "Valuation Submitted" }
                           }
                       }));
                   }
                }
             }

             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio) {
                 if (!outputCtx) return;
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                 
                 const audioBuffer = await decodeAudioData(
                     decode(base64Audio),
                     outputCtx,
                     24000,
                     1
                 );
                 
                 const source = outputCtx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(outputCtx.destination);
                 source.addEventListener('ended', () => {
                     sourcesRef.current.delete(source);
                 });
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += audioBuffer.duration;
                 sourcesRef.current.add(source);
             }

             // Handle Interruptions
             if (message.serverContent?.interrupted) {
                 sourcesRef.current.forEach(s => s.stop());
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
             }
          },
          onclose: () => {
             console.log('Gemini Live Closed');
             setIsVoiceConnected(false);
          },
          onerror: (err) => {
             console.error('Gemini Live Error', err);
             setIsVoiceConnected(false);
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            tools: [{ functionDeclarations: [SUBMIT_VALUATION_TOOL] }],
            systemInstruction: `
              You are QuantCasa, a professional Real Estate Valuation Surveyor. 
              Your goal is to have a natural spoken conversation with the user to collect details about their property to perform a valuation.
              
              Start by briefly welcoming them and asking where the property is located.
              Then, ask for:
              1. Project Name & Builder
              2. Configuration (BHK, Area in sqft)
              3. Floor Number & Total Floors
              4. Any Parking or Amenities?

              Be concise. Do not ask for everything at once. Group questions naturally.
              Once you have the Location, Project, and Size/Config, you can estimate the rest or ask one final check.
              When you have sufficient data, call the "submit_valuation_data" tool immediately.
            `
        }
      });
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error("Failed to connect to Live API", e);
      setIsVoiceMode(false);
    }
  };

  const disconnectLiveAPI = () => {
      // Stop Audio
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (processorRef.current) processorRef.current.disconnect();
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      if (inputContextRef.current) inputContextRef.current.close();
      
      // Close Session
      if (sessionRef.current) {
          sessionRef.current.then((s: any) => s.close());
      }
      
      setIsVoiceMode(false);
      setIsVoiceConnected(false);
  };


  // --- RENDER ---

  if (isVoiceMode) {
      return (
          <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden shadow-glass relative">
              <button 
                  onClick={disconnectLiveAPI}
                  className="absolute top-4 right-4 text-gray-500 hover:text-white z-50"
              >
                  <XCircle size={24} />
              </button>
              
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
                  {/* Background Pulse */}
                  <div className={`absolute w-64 h-64 bg-cyber-teal/20 rounded-full blur-3xl transition-all duration-300 ${isVoiceConnected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                  
                  <div className="relative z-10 mb-8">
                       <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isVoiceConnected ? 'border-cyber-teal shadow-neon-teal' : 'border-gray-600'}`}>
                           <div className={`w-20 h-20 rounded-full bg-cyber-card flex items-center justify-center transition-transform ${isVoiceConnected ? 'animate-pulse' : ''}`}>
                               <Mic size={32} className={isVoiceConnected ? 'text-cyber-teal' : 'text-gray-500'} />
                           </div>
                       </div>
                  </div>

                  <h2 className="text-xl font-mono font-bold text-white mb-2">
                      {isVoiceConnected ? "QUANTCASA LIVE AGENT" : "CONNECTING..."}
                  </h2>
                  <p className="text-sm text-gray-400 max-w-xs mb-8">
                      Speak naturally. Describe your property details (Location, Area, BHK, Floor) to get an instant valuation.
                  </p>

                  {/* Visualizer */}
                  {isVoiceConnected && (
                      <div className="flex items-center justify-center gap-1.5 h-12">
                          {[...Array(5)].map((_, i) => (
                             <div 
                               key={i} 
                               className="bar" 
                               style={{ 
                                   height: `${Math.max(10, Math.random() * voiceVolume + 10)}%`,
                                   animationDuration: `${0.5 + Math.random() * 0.5}s`
                               }} 
                             />
                          ))}
                      </div>
                  )}
                  
                  {!isVoiceConnected && (
                       <div className="mt-4 flex gap-2">
                           <div className="w-2 h-2 bg-cyber-lime rounded-full animate-bounce" />
                           <div className="w-2 h-2 bg-cyber-lime rounded-full animate-bounce delay-100" />
                           <div className="w-2 h-2 bg-cyber-lime rounded-full animate-bounce delay-200" />
                       </div>
                  )}
              </div>
              
              <div className="p-4 border-t border-cyber-border bg-black/40 text-center">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                      POWERED BY GEMINI 2.5 LIVE
                  </p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden shadow-glass">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cyber-border bg-black/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyber-teal/10 flex items-center justify-center border border-cyber-teal/30 text-cyber-teal shadow-neon-teal">
             <Cpu size={16} />
          </div>
          <div>
             <h2 className="text-white font-mono text-sm tracking-widest font-bold">AGENT_INTERFACE</h2>
             <p className="text-cyber-lime text-[10px] tracking-wide animate-pulse">ACTIVE</p>
          </div>
        </div>
        
        {/* Voice Mode Toggle */}
        <button 
           onClick={connectToLiveAPI}
           className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-teal text-cyber-teal hover:bg-cyber-teal/10 transition-all group"
        >
            <Mic size={14} className="group-hover:animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-wider">VOICE MODE</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-cyber-card scrollbar-track-transparent">
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`group relative max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed backdrop-blur-sm shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-cyber-teal/10 border border-cyber-teal/30 text-cyber-teal rounded-br-none shadow-neon-teal'
                  : 'bg-cyber-card/80 border border-cyber-border text-cyber-text rounded-bl-none'
              }`}>
              {msg.text}
              {msg.component && <div className="mt-3 w-full">{msg.component}</div>}
              
              {/* Edit Button for User Messages */}
              {msg.sender === 'user' && msg.stepIndex !== undefined && (
                  <button 
                    onClick={() => handleEdit(idx)}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 bg-cyber-card rounded-full border border-cyber-border text-gray-500 hover:text-cyber-teal hover:border-cyber-teal transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    title="Edit answer"
                  >
                      <Pencil size={12} />
                  </button>
              )}
            </div>
          </div>
        ))}
        {(isLoading || isGettingLocation) && (
          <div className="flex justify-start">
             <div className="bg-cyber-card/50 border border-cyber-border rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 bg-cyber-lime rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-cyber-lime rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-cyber-lime rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/20 border-t border-cyber-border backdrop-blur-md">
        {!isLoading && currentStepIndex < WIZARD_STEPS.length ? (
          <div className="flex flex-col gap-3">
             {(currentStep.field === StepField.Pincode || currentStep.field === StepField.Area) && (
                <div className="flex justify-between items-center px-1">
                    <button 
                        onClick={handleGeoLocation}
                        className="flex items-center text-[10px] font-mono text-cyber-teal hover:text-white transition-colors uppercase tracking-wider"
                        disabled={isGettingLocation}
                    >
                        <LocateFixed size={12} className="mr-1" />
                        {isGettingLocation ? "SCANNING SATELLITES..." : "USE GPS COORDINATES"}
                    </button>
                </div>
             )}

             {currentStep.type === 'select' ? (
                 <div className="flex flex-wrap gap-2">
                    {currentStep.options?.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleNext(opt)}
                          className="px-5 py-2.5 bg-cyber-card border border-cyber-border hover:border-cyber-teal text-cyber-text hover:text-cyber-teal hover:shadow-neon-teal rounded-lg text-xs font-mono transition-all duration-300"
                        >
                            {opt}
                        </button>
                    ))}
                 </div>
             ) : (
                <div className="relative group">
                    <input
                    type={currentStep.type === 'number' ? 'number' : 'text'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={currentStep.placeholder}
                    className="w-full pl-4 pr-12 py-3.5 bg-cyber-black border border-cyber-border rounded-lg text-white font-mono text-sm placeholder:text-gray-700 focus:outline-none focus:border-cyber-teal focus:ring-1 focus:ring-cyber-teal transition-all shadow-inner"
                    autoFocus
                    />
                    <button
                    onClick={() => handleNext(inputValue)}
                    disabled={!inputValue.trim()}
                    className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-cyber-teal text-cyber-black rounded hover:bg-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                    <Send size={16} />
                    </button>
                </div>
             )}
          </div>
        ) : !isLoading && (
            <div className="text-center py-2 text-cyber-text text-xs font-mono opacity-50">SESSION TERMINATED</div>
        )}
      </div>
    </div>
  );
};

// Initial Valuation Request for Type Safety in Voice Mode
const INITIAL_VALUATION_REQUEST: ValuationRequest = {
  state: '',
  city: '',
  pincode: '',
  district: '',
  area: '',
  projectName: '',
  builderName: '',
  bhk: '',
  facing: '',
  floor: 0,
  totalFloors: 0,
  constructionYear: new Date().getFullYear(),
  distanceFromMainRoad: '',
  roadType: '',
  nearbyLocations: '',
  carpetArea: 0,
  builtUpArea: 0,
  superBuiltUpArea: 0,
  hasParking: 'No',
  parkingCharges: 0,
  hasAmenities: 'No',
  amenitiesCharges: 0,
  fsi: 0
};

export default ChatInterface;