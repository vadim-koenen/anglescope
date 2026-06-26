import { manualSource } from "@/lib/sources/manual";
import { seededSource } from "@/lib/sources/seeded";
import type { AdSourceName } from "@/lib/ai/schemas";
import type { AdSource } from "@/lib/sources/types";

const sources: Record<AdSourceName, AdSource | null> = {
  seeded: seededSource,
  tiktok_cc: null,
  meta_ad_library: null,
  manual: manualSource
};

export function getAdSource(name: AdSourceName) {
  return sources[name];
}

export function listImplementedSources() {
  return Object.entries(sources)
    .filter(([, source]) => Boolean(source))
    .map(([name]) => name as AdSourceName);
}
