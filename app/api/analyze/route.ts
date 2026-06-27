import { NextResponse } from "next/server";
import {
  AdAnalysisSchema,
  AnalyzeRequestSchema,
  AnalyzeResponseSchema,
  type AnalyzedAd,
  type AngleCluster,
  type RawAd
} from "@/lib/ai/schemas";
import { getAdSource } from "@/lib/sources";
import { getSeedFixtures } from "@/lib/sources/seeded";
import { daysBetween } from "@/lib/utils";
import { deconstructAdWithVision } from "@/lib/ai/deconstruct";

function strengthScoreFor(ad: { firstSeen?: string; lastSeen?: string; metrics?: Record<string, number> }) {
  const longevityDays = daysBetween(ad.firstSeen, ad.lastSeen);
  const longevityScore = longevityDays === null ? 35 : Math.min(85, 30 + longevityDays / 2);
  const engagementScore = ad.metrics?.engagementIndex ? Math.min(95, ad.metrics.engagementIndex) : 50;

  return Math.round(longevityScore * 0.65 + engagementScore * 0.35);
}

function buildClusters(ads: AnalyzedAd[]): AngleCluster[] {
  const byAngle = new Map<string, AnalyzedAd[]>();

  for (const ad of ads) {
    const key = ad.analysis.primaryAngle.toLowerCase();
    byAngle.set(key, [...(byAngle.get(key) ?? []), ad]);
  }

  return Array.from(byAngle.entries())
    .map(([key, group]) => {
      const averageStrengthScore =
        group.reduce((sum, ad) => sum + ad.strengthScore, 0) / Math.max(1, group.length);

      return {
        id: key.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        name: group[0].analysis.primaryAngle,
        whyItWorks: group[0].analysis.whyItWorks,
        frequency: group.length,
        averageStrengthScore: Math.round(averageStrengthScore),
        representativeAdIds: group.slice(0, 3).map((ad) => ad.sourceId),
        supportingHooks: group.slice(0, 3).map((ad) => ad.analysis.hook)
      };
    })
    .sort((a, b) => b.frequency * b.averageStrengthScore - a.frequency * a.averageStrengthScore);
}

async function safelyDeconstructAd(rawAd: RawAd) {
  try {
    return await deconstructAdWithVision(rawAd);
  } catch (error) {
    return {
      analysis: null,
      sourceNotes: [
        error instanceof Error
          ? `Vision deconstruction failed: ${error.message}`
          : "Vision deconstruction failed with an unknown error."
      ]
    };
  }
}

function scopeSourceNote(sourceId: string, note: string) {
  if (
    note.includes("OPENAI_API_KEY is not configured") ||
    note.includes("Vision deconstruction requires a fully qualified media URL")
  ) {
    return note;
  }

  return `${sourceId}: ${note}`;
}

function buildFallbackAnalysis(rawAd: RawAd) {
  return AdAnalysisSchema.parse({
    hook: rawAd.caption ?? `${rawAd.advertiser ?? "Advertiser"} ${rawAd.platform} creative`,
    primaryAngle: "Unclassified public-ad signal",
    secondaryAngles: [],
    emotion: "other",
    format: rawAd.mediaType === "video" ? "Video creative" : "Static creative",
    offerMechanic: "Unknown",
    targetAudience: "Unknown",
    cta: "Unknown",
    claims: [],
    complianceRisk: "medium",
    whyItWorks:
      "This ad was returned by a live or manual source without saved fixture analysis; enable AI deconstruction to classify it."
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const query = AnalyzeRequestSchema.parse(body);

  const requestedSources: typeof query.sources = query.sources.includes("seeded")
    ? query.sources
    : ["seeded", ...query.sources];
  const sourceNotes = new Set<string>();

  for (const sourceName of requestedSources) {
    if (!getAdSource(sourceName)) {
      sourceNotes.add(`${sourceName} adapter is scaffolded but not implemented in this build.`);
    }
  }

  const rawAdsBySource = await Promise.all(
    requestedSources.map(async (sourceName) => {
      const source = getAdSource(sourceName);

      if (!source) {
        return [];
      }

      try {
        const ads = await source.fetchAds(query);

        if (sourceName !== "seeded" && ads.length === 0) {
          sourceNotes.add(`${sourceName} returned no ads for this query.`);
        }

        return ads;
      } catch (error) {
        sourceNotes.add(
          error instanceof Error
            ? `${sourceName} fetch failed: ${error.message}`
            : `${sourceName} fetch failed with an unknown error.`
        );
        return [];
      }
    })
  );
  const rawAds = rawAdsBySource.flat();
  const fixtures = getSeedFixtures(query);

  const ads = await Promise.all(rawAds.map(async (rawAd) => {
    const fixture = fixtures.find((item) => item.sourceId === rawAd.sourceId);
    const longevityDays = daysBetween(rawAd.firstSeen, rawAd.lastSeen);
    const strengthScore = strengthScoreFor(rawAd);
    const aiResult = query.useAi ? await safelyDeconstructAd(rawAd) : null;

    if (aiResult?.sourceNotes.length) {
      for (const note of aiResult.sourceNotes) {
        sourceNotes.add(scopeSourceNote(rawAd.sourceId, note));
      }
    }

    return {
      ...rawAd,
      verticals: fixture?.verticals,
      sourceDisclosure: fixture?.sourceDisclosure,
      analysis: aiResult?.analysis ?? fixture?.analysis ?? buildFallbackAnalysis(rawAd),
      longevityDays,
      strengthScore
    };
  }));

  const response = AnalyzeResponseSchema.parse({
    analysisId: `seed-${Date.now()}`,
    query,
    ads,
    clusters: buildClusters(ads),
    sourceNotes: [
      query.useAi
        ? "Analyze requested AI deconstruction when remote media was available; fixture analysis was used where AI was skipped."
        : "Analyze used validated fixture analyses. Set useAi=true with remote media to enable vision deconstruction.",
      ...Array.from(sourceNotes)
    ]
  });

  return NextResponse.json(response);
}
