import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
  }).index("byEmail", ["email"]),

  locations: defineTable({
    city: v.string(),
    pincode: v.string(),
    locality: v.string(),
    lat: v.optional(v.number()),
    lng: v.optional(v.number())
  }).index("byPincode", ["pincode"]),

  properties: defineTable({
    ownerId: v.id("users"),
    type: v.string(), // apartment / villa / land / commercial
    areaSqft: v.number(),
    bhk: v.optional(v.number()),
    age: v.optional(v.number()),
    localityId: v.id("locations"),
    furnished: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    createdAt: v.number()
  }),

  valuations: defineTable({
    propertyId: v.id("properties"),
    modelType: v.string(), // rules / ML / hybrid
    buyPrice: v.number(),
    rentPrice: v.optional(v.number()),
    landPrice: v.optional(v.number()),
    confidence: v.number(),
    createdAt: v.number()
  }).index("byProperty", ["propertyId"]),

  userFeedback: defineTable({
    valuationId: v.id("valuations"),
    userCorrectionValue: v.number(),
    reason: v.optional(v.string()),
    timestamp: v.number()
  }),

  metroStations: defineTable({
    city: v.string(),
    name: v.string(),
    lat: v.number(),
    lng: v.number()
  }).index("byCity", ["city"]),

  guidelineValues: defineTable({
    state: v.string(),
    district: v.string(),
    locality: v.string(),
    landType: v.string(),
    ratePerSqft: v.number(),
    effectiveYear: v.number()
  }).index("byLocality", ["state", "district", "locality"]),

  nlpParsedDescriptions: defineTable({
    rawText: v.string(),
    extractedJson: v.string(),
    createdAt: v.number()
  }),

  loanApplications: defineTable({
    userId: v.optional(v.id("users")),
    propertyId: v.optional(v.id("properties")),
    incomeMonthly: v.number(),
    existingEMI: v.number(),
    creditScore: v.number(),
    employmentType: v.string(), // salaried / self-employed
    requestedAmount: v.number(),
    status: v.string(), // pending / approved / rejected
    decisionJson: v.string(),
    createdAt: v.number()
  })
});