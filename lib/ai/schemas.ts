import { z } from "zod";

export const AdSourceNameSchema = z.enum([
  "tiktok_cc",
  "meta_ad_library",
  "seeded",
  "manual"
]);

export const RawAdSchema = z.object({
  sourceId: z.string(),
  source: AdSourceNameSchema.default("seeded"),
  platform: z.string(),
  advertiser: z.string().optional(),
  mediaUrl: z.string(),
  mediaType: z.enum(["image", "video"]),
  caption: z.string().optional(),
  firstSeen: z.string().optional(),
  lastSeen: z.string().optional(),
  metrics: z.record(z.number()).optional(),
  landingUrl: z.string().optional()
});

export const AdQuerySchema = z.object({
  vertical: z.string().min(1),
  keywords: z.string().optional(),
  limit: z.number().int().positive().max(50).default(20),
  sources: z.array(AdSourceNameSchema).default(["seeded"]),
  useAi: z.boolean().default(false),
  manualAds: z.array(RawAdSchema).max(10).default([])
});

export const AdAnalysisSchema = z.object({
  hook: z.string(),
  primaryAngle: z.string(),
  secondaryAngles: z.array(z.string()),
  emotion: z.enum([
    "fear",
    "desire",
    "curiosity",
    "urgency",
    "trust",
    "aspiration",
    "humor",
    "anger",
    "other"
  ]),
  format: z.string(),
  offerMechanic: z.string(),
  targetAudience: z.string(),
  cta: z.string(),
  claims: z.array(z.string()),
  complianceRisk: z.enum(["low", "medium", "high"]),
  whyItWorks: z.string()
});

export const SeedAdSchema = RawAdSchema.extend({
  verticals: z.array(z.string()),
  sourceDisclosure: z.string(),
  analysis: AdAnalysisSchema
});

export const AnalyzedAdSchema = RawAdSchema.extend({
  verticals: z.array(z.string()).optional(),
  sourceDisclosure: z.string().optional(),
  analysis: AdAnalysisSchema,
  longevityDays: z.number().nullable(),
  strengthScore: z.number()
});

export const AngleClusterSchema = z.object({
  id: z.string(),
  name: z.string(),
  whyItWorks: z.string(),
  frequency: z.number().int().nonnegative(),
  averageStrengthScore: z.number(),
  representativeAdIds: z.array(z.string()),
  supportingHooks: z.array(z.string())
});

export const AnalyzeRequestSchema = z.object({
  vertical: z.string().min(1),
  keywords: z.string().optional(),
  sources: z.array(AdSourceNameSchema).default(["seeded"]),
  limit: z.number().int().positive().max(50).default(20),
  useAi: z.boolean().default(false),
  manualAds: z.array(RawAdSchema).max(10).default([])
});

export const AnalyzeResponseSchema = z.object({
  analysisId: z.string(),
  query: AnalyzeRequestSchema,
  ads: z.array(AnalyzedAdSchema),
  clusters: z.array(AngleClusterSchema),
  sourceNotes: z.array(z.string())
});

export const CreativeConceptSchema = z.object({
  angleUsed: z.string(),
  platform: z.enum(["meta", "tiktok", "taboola", "google"]),
  format: z.string(),
  hook: z.string(),
  primaryCopy: z.string(),
  visualDirection: z.string(),
  cta: z.string(),
  rationale: z.string(),
  complianceNotes: z.string()
});

export const OfferDetailsSchema = z.object({
  product: z.string().min(1),
  audience: z.string().min(1),
  keyBenefit: z.string().min(1),
  brandVoice: z.string().min(1),
  offerMechanic: z.string().min(1),
  complianceConstraints: z.string().optional()
});

export const GenerateRequestSchema = z.object({
  angle: AngleClusterSchema,
  offer: OfferDetailsSchema,
  count: z.number().int().min(1).max(10).default(6)
});

export const GenerateResponseSchema = z.object({
  concepts: z.array(CreativeConceptSchema),
  angleEvidence: z.object({
    angleName: z.string(),
    whyItWorks: z.string(),
    representativeAdIds: z.array(z.string()),
    supportingHooks: z.array(z.string())
  }),
  sourceNotes: z.array(z.string())
});

export type AdSourceName = z.infer<typeof AdSourceNameSchema>;
export type AdQuery = z.infer<typeof AdQuerySchema>;
export type RawAd = z.infer<typeof RawAdSchema>;
export type AdAnalysis = z.infer<typeof AdAnalysisSchema>;
export type SeedAd = z.infer<typeof SeedAdSchema>;
export type AnalyzedAd = z.infer<typeof AnalyzedAdSchema>;
export type AngleCluster = z.infer<typeof AngleClusterSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;
export type OfferDetails = z.infer<typeof OfferDetailsSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
export type CreativeConcept = z.infer<typeof CreativeConceptSchema>;
