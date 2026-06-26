import seedAds from "@/data/seed/ads.json";
import {
  AdQuerySchema,
  RawAdSchema,
  SeedAdSchema,
  type AdQuery,
  type RawAd,
  type SeedAd
} from "@/lib/ai/schemas";
import type { AdSource } from "@/lib/sources/types";

const parsedSeedAds = SeedAdSchema.array().parse(seedAds);

function matchesQuery(ad: SeedAd, query: AdQuery) {
  const haystack = [
    ad.advertiser,
    ad.caption,
    ad.analysis.primaryAngle,
    ad.analysis.format,
    ad.analysis.offerMechanic,
    ...ad.verticals
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const needles = [query.vertical, query.keywords]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);

  if (needles.length === 0) {
    return true;
  }

  return needles.some((needle) => haystack.includes(needle));
}

export function getSeedFixtures(queryInput: Partial<AdQuery> = {}) {
  const query = AdQuerySchema.parse({
    vertical: queryInput.vertical ?? "health",
    keywords: queryInput.keywords,
    limit: queryInput.limit ?? 20,
    sources: queryInput.sources ?? ["seeded"],
    useAi: queryInput.useAi ?? false,
    manualAds: queryInput.manualAds ?? []
  });

  const matched = parsedSeedAds.filter((ad) => matchesQuery(ad, query));
  const fallback = matched.length > 0 ? matched : parsedSeedAds;

  return fallback.slice(0, query.limit);
}

export const seededSource: AdSource = {
  name: "seeded",
  async fetchAds(query: AdQuery): Promise<RawAd[]> {
    return getSeedFixtures(query).map((ad) =>
      RawAdSchema.parse({
        sourceId: ad.sourceId,
        source: ad.source,
        platform: ad.platform,
        advertiser: ad.advertiser,
        mediaUrl: ad.mediaUrl,
        mediaType: ad.mediaType,
        caption: ad.caption,
        firstSeen: ad.firstSeen,
        lastSeen: ad.lastSeen,
        metrics: ad.metrics,
        landingUrl: ad.landingUrl
      })
    );
  }
};
