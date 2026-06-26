import type { AdQuery, AdSourceName, RawAd } from "@/lib/ai/schemas";

export interface AdSource {
  name: AdSourceName;
  fetchAds(query: AdQuery): Promise<RawAd[]>;
}
