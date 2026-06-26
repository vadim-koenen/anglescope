import {
  RawAdSchema,
  type AdQuery,
  type RawAd
} from "@/lib/ai/schemas";
import type { AdSource } from "@/lib/sources/types";

export const manualSource: AdSource = {
  name: "manual",
  async fetchAds(query: AdQuery): Promise<RawAd[]> {
    return query.manualAds.map((ad) =>
      RawAdSchema.parse({
        ...ad,
        source: "manual"
      })
    );
  }
};
