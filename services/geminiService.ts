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
    valuationJustification: { type: Type.STRING, description: "Reason why this valuation is justified based on inputs like floor rise, amenities, location, etc." },
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
      Act as "QuantCasa", an expert Real Estate Quantitative Analyst.
      Perform a highly accurate, data-driven valuation for the following property.

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
      - Floor Number: ${data.floor}
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

      Valuation Algorithm Tasks:
      1. **Base Valuation**: Determine the base rate per sqft for this specific location (${data.area}, ${data.city}) and project quality.
      2. **Floor Rise Logic**: Apply a "Floor Rise" premium. 
         - Typically, for floors above the 4th floor, add a premium (e.g., ₹40 - ₹80 per sqft per floor OR 0.5% - 1% increase per floor).
         - If the floor is high (e.g., > 10), the view and ventilation usually command a significantly higher price.
      3. **Additions**: Add the explicit Parking Charges (${data.parkingCharges}) and Amenities Charges (${data.amenitiesCharges}) to the total.
      4. **Adjustments**: Adjust for Road Type advantage and Age of property.
      5. **Justification**: In the "valuationJustification" field, explicitly state how the Floor Rise (Floor ${data.floor}) and other quantitative factors impacted the final value. Provide a professional, analyst-style summary.
      6. **Scores**: Assign Confidence and Sentiment scores based on data completeness and market trends.
      
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