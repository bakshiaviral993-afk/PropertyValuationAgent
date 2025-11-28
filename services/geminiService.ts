import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ValuationRequest, ValuationResult } from "../types";

const VALUATION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    estimatedValue: { type: Type.NUMBER, description: "Total estimated value in Indian Rupees (INR)" },
    pricePerSqft: { type: Type.NUMBER, description: "Price per square foot in INR based on Super Built-up or Carpet appropriately" },
    rangeLow: { type: Type.NUMBER, description: "Lower bound of the valuation range" },
    rangeHigh: { type: Type.NUMBER, description: "Upper bound of the valuation range" },
    confidenceScore: { type: Type.NUMBER, description: "Confidence score between 0 and 100" },
    locationScore: { type: Type.NUMBER, description: "Location score between 1 and 10" },
    sentimentScore: { type: Type.NUMBER, description: "Market sentiment score from -1 (Negative) to 1 (Positive)" },
    sentimentAnalysis: { type: Type.STRING, description: "Brief explanation of the market sentiment" },
    comparables: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          projectName: { type: Type.STRING },
          price: { type: Type.NUMBER },
          area: { type: Type.NUMBER },
          bhk: { type: Type.STRING },
          pricePerSqft: { type: Type.NUMBER }
        }
      },
      description: "List of 3 comparable property listings"
    },
    valuationJustification: { type: Type.STRING, description: "Reason why this valuation is justified based on the inputs (amenities, location, FSI, etc.)" },
    propertyStatus: { type: Type.STRING, description: "New Property or Old Property based on construction year" }
  },
  required: [
    "estimatedValue", "pricePerSqft", "rangeLow", "rangeHigh",
    "confidenceScore", "locationScore", "sentimentScore",
    "comparables", "valuationJustification", "propertyStatus"
  ]
};

export const getValuationAnalysis = async (data: ValuationRequest): Promise<ValuationResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Act as an expert Real Estate Valuer for the "Valuation Tech" app.
      Perform a detailed valuation for the following property based on user inputs:
      
      Location:
      - State: ${data.state}
      - City: ${data.city}
      - District: ${data.district}
      - Area/Locality: ${data.area}
      - Pincode: ${data.pincode}
      ${data.latitude ? `- Exact Coordinates: ${data.latitude}, ${data.longitude}` : ''}
      
      Property Details:
      - Project: ${data.projectName}
      - Builder: ${data.builderName}
      ${data.bhk ? `- Configuration: ${data.bhk}` : ''}
      - Facing: ${data.facing}
      - Floor: ${data.floor} (Total Floors logic implies it is a ${data.floor} story building context)
      - Construction Year: ${data.constructionYear}
      - FSI: ${data.fsi}
      
      Connectivity & Surroundings:
      - Distance from Main Road: ${data.distanceFromMainRoad}
      - Type of Road: ${data.roadType}
      - Nearby Positive Locations: ${data.nearbyLocations}
      
      Dimensions:
      - Carpet Area: ${data.carpetArea} sqft
      - Built-up Area: ${data.builtUpArea} sqft
      - Super Built-up Area: ${data.superBuiltUpArea} sqft
      
      Extras:
      - Car Parking: ${data.hasParking} (Charges: ${data.parkingCharges})
      - Amenities: ${data.hasAmenities} (Charges: ${data.amenitiesCharges})

      Task:
      1. Calculate Total Valuation considering the base rate per sqft for this location + Parking Charges + Amenities Charges + Road Advantage + Floor Rise.
      2. Provide a specific "Valuation Justification" explaining how factors like the Road Type (${data.roadType}), Nearby locations (${data.nearbyLocations}), and Amenities influenced the final price.
      3. Assign a Confidence Score and Sentiment Score.
      
      Return the data strictly in JSON format matching the schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: VALUATION_SCHEMA,
        temperature: 0.2,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ValuationResult;
    } else {
      throw new Error("No response text generated");
    }
  } catch (error) {
    console.error("Valuation Error:", error);
    throw error;
  }
};