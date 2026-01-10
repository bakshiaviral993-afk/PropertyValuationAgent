import { mutation, query } from "convex/server";
import { v } from "convex/values";

export const addProperty = mutation({
  args: {
    ownerId: v.id("users"),
    type: v.string(),
    areaSqft: v.number(),
    bhk: v.optional(v.number()),
    age: v.optional(v.number()),
    localityId: v.id("locations")
  },
  handler: async ({ db }, args) => {
    return await db.insert("properties", {
      ...args,
      createdAt: Date.now()
    });
  }
});

export const saveValuation = mutation({
  args: {
    propertyId: v.id("properties"),
    modelType: v.string(),
    buyPrice: v.number(),
    rentPrice: v.optional(v.number()),
    landPrice: v.optional(v.number()),
    confidence: v.number()
  },
  handler: async ({ db }, args) => {
    return await db.insert("valuations", {
      ...args,
      createdAt: Date.now()
    });
  }
});

export const nearestMetro = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    city: v.string()
  },
  handler: async ({ db }, { lat, lng, city }) => {
    const metros = await db
      .query("metroStations")
      .withIndex("byCity", q => q.eq("city", city))
      .collect();

    function hav(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371; // km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a = 
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
          Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    }

    let min = 999;
    metros.forEach(m => {
      min = Math.min(min, hav(lat, lng, m.lat, m.lng));
    });

    return min;
  }
});

export const approveLoan = mutation({
  args: {
    incomeMonthly: v.number(),
    existingEMI: v.number(),
    creditScore: v.number(),
    propertyValue: v.number(),
    requestedAmount: v.number(),
    employmentType: v.optional(v.string())
  },
  handler: async ({ db }, args) => {
    const { incomeMonthly, existingEMI, creditScore, propertyValue, requestedAmount, employmentType = "salaried" } = args;

    // 1) LTV rule based on credit score and property type
    let ltvMultiplier = creditScore > 760 ? 0.8 : creditScore > 700 ? 0.75 : 0.65;
    
    // Risk Multipliers
    if (employmentType === "self-employed") ltvMultiplier -= 0.05;
    
    const maxLoanByProperty = propertyValue * ltvMultiplier;

    // 2) EMI affordability (DTI - Debt to Income)
    const dtiLimit = creditScore > 750 ? 0.50 : 0.45;
    const maxEMI = (incomeMonthly * dtiLimit) - existingEMI;
    
    // Approx EMI for 9% 20 yr (0.009 factor)
    const estimatedEMI = requestedAmount * 0.009; 

    // 3) Base decision logic
    let decision = "Rejected";
    let reasons: string[] = [];

    if (creditScore < 620) reasons.push("Credit score falls below minimum lending threshold (620)");
    if (estimatedEMI > maxEMI) {
        reasons.push(`Estimated EMI (₹${Math.round(estimatedEMI)}) exceeds your safe monthly capacity (₹${Math.round(maxEMI)})`);
        reasons.push("Suggestion: Increase tenure or reduce requested loan amount");
    }
    if (requestedAmount > maxLoanByProperty) {
        reasons.push(`Requested amount exceeds the safe LTV (Loan-to-Value) limit for this asset (₹${Math.round(maxLoanByProperty)})`);
    }

    if (reasons.length === 0) decision = "Approved";
    else if (reasons.length === 1 && creditScore > 680) decision = "Conditional";

    const result = {
      decision,
      maxLoanAmount: Math.floor(maxLoanByProperty),
      safeEMI: Math.floor(maxEMI),
      approvalProbability: decision === "Approved" ? 0.92 : decision === "Conditional" ? 0.55 : 0.12,
      reasons,
      timestamp: Date.now()
    };

    await db.insert("loanApplications", {
      incomeMonthly,
      existingEMI,
      creditScore,
      employmentType,
      requestedAmount,
      status: decision,
      decisionJson: JSON.stringify(result),
      createdAt: Date.now()
    });

    return result;
  }
});