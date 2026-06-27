import {
  RawAdSchema,
  type AdQuery,
  type RawAd
} from "@/lib/ai/schemas";
import type { AdSource } from "@/lib/sources/types";

const TOP_ADS_PAGE_URL = "https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en";
const TOP_ADS_LIST_URL = "https://ads.tiktok.com/creative_radar_api/v1/top_ads/v2/list";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

const DEFAULT_PERIOD_DAYS = "30";
const MAX_TIKTOK_ADS = 10;

const INDUSTRY_RULES = [
  { id: "29102000000", terms: ["supplement", "vitamin", "shilajit", "weight loss", "wellness"] },
  { id: "29000000000", terms: ["health", "medical", "clinic"] },
  { id: "20109000000", terms: ["fitness", "workout", "gym"] },
  { id: "13102000000", terms: ["insurance"] },
  { id: "13000000000", terms: ["finance", "financial", "loan", "credit", "debt"] },
  { id: "21000000000", terms: ["solar", "home service", "home improvement", "roof"] },
  { id: "14000000000", terms: ["beauty", "skincare", "personal care"] },
  { id: "27000000000", terms: ["food", "beverage", "drink"] }
];

type TikTokVideoInfo = {
  cover?: unknown;
  duration?: unknown;
  video_url?: Record<string, unknown>;
};

type TikTokMaterial = {
  ad_title?: unknown;
  brand_name?: unknown;
  cost?: unknown;
  ctr?: unknown;
  id?: unknown;
  industry_key?: unknown;
  like?: unknown;
  objective_key?: unknown;
  video_info?: TikTokVideoInfo;
};

type TikTokListResponse = {
  code?: number;
  msg?: string;
  data?: {
    materials?: TikTokMaterial[];
  };
};

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function configuredCountryCode() {
  return (process.env.TIKTOK_CC_COUNTRY ?? "US").trim().toUpperCase();
}

function getSetCookieHeaders(headers: Headers) {
  const headerWithGetSetCookie = headers as Headers & { getSetCookie?: () => string[] };
  const setCookieHeaders = headerWithGetSetCookie.getSetCookie?.() ?? [];
  const fallbackCookie = headers.get("set-cookie");

  return [...setCookieHeaders, fallbackCookie].filter((header): header is string => Boolean(header));
}

function toCookieHeader(setCookieHeaders: string[]) {
  return setCookieHeaders
    .flatMap((header) => header.split(/,(?=\s*[^;,]+=)/))
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function fetchTikTokSessionCookie() {
  const response = await fetch(TOP_ADS_PAGE_URL, {
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent": USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`TikTok Creative Center page returned HTTP ${response.status}`);
  }

  return toCookieHeader(getSetCookieHeaders(response.headers));
}

function buildKeywordCandidates(query: AdQuery) {
  const keywords = (query.keywords ?? "")
    .split(/[,;|]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const candidates = [...keywords, query.vertical.trim()].filter(Boolean);

  return Array.from(new Set(candidates.map((candidate) => candidate.toLowerCase()))).slice(0, 3);
}

function inferIndustryId(query: AdQuery) {
  const haystack = `${query.vertical} ${query.keywords ?? ""}`.toLowerCase();
  const match = INDUSTRY_RULES.find((rule) => rule.terms.some((term) => haystack.includes(term)));

  return match?.id;
}

function buildRequestUrl(options: { industryId?: string; keyword?: string; limit: number }) {
  const url = new URL(TOP_ADS_LIST_URL);

  url.searchParams.set("page", "1");
  url.searchParams.set("limit", String(options.limit));
  url.searchParams.set("period", DEFAULT_PERIOD_DAYS);
  url.searchParams.set("country_code", configuredCountryCode());

  if (options.industryId) {
    url.searchParams.set("industry", options.industryId);
  }

  if (options.keyword) {
    url.searchParams.set("keyword", options.keyword);
    url.searchParams.set("search_id", `anglescope-${Date.now()}`);
  }

  return url;
}

async function fetchMaterials(url: URL, cookieHeader: string) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "accept-language": "en-US,en;q=0.9",
      "anonymous-user-id": `fake-user-id-server-${Math.round(1000000 * Math.random())}`,
      cookie: cookieHeader,
      lang: "en",
      referer: TOP_ADS_PAGE_URL,
      "user-agent": USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`TikTok Top Ads endpoint returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as TikTokListResponse;

  if (payload.code !== 0) {
    throw new Error(`TikTok Top Ads endpoint returned ${payload.code}: ${payload.msg ?? "unknown error"}`);
  }

  return payload.data?.materials ?? [];
}

function requestAttempts(query: AdQuery, limit: number) {
  const industryId = inferIndustryId(query);
  const keywordCandidates = buildKeywordCandidates(query);
  const attempts: Array<{ industryId?: string; keyword?: string; limit: number }> = [];

  for (const keyword of keywordCandidates) {
    attempts.push({ industryId, keyword, limit });
  }

  if (industryId) {
    attempts.push({ industryId, limit });
  }

  for (const keyword of keywordCandidates) {
    attempts.push({ keyword, limit });
  }

  attempts.push({ limit });

  return attempts.filter((attempt, index, allAttempts) => {
    const signature = `${attempt.industryId ?? ""}:${attempt.keyword ?? ""}`;
    return allAttempts.findIndex((other) => `${other.industryId ?? ""}:${other.keyword ?? ""}` === signature) === index;
  });
}

function bestVideoUrl(videoInfo?: TikTokVideoInfo) {
  const urls = videoInfo?.video_url;

  if (!urls) {
    return undefined;
  }

  for (const quality of ["720p", "540p", "480p", "360p", "1080p"]) {
    const url = asString(urls[quality]);

    if (url) {
      return url;
    }
  }

  return Object.values(urls).map(asString).find(Boolean);
}

function engagementIndexFor(material: TikTokMaterial) {
  const ctr = asNumber(material.ctr) ?? 0;
  const likes = asNumber(material.like) ?? 0;
  const score = 45 + ctr * 45 + Math.log10(likes + 1) * 9;

  return Math.max(35, Math.min(95, Math.round(score)));
}

function materialToRawAd(material: TikTokMaterial): RawAd | null {
  const id = asString(material.id);
  const videoUrl = bestVideoUrl(material.video_info);
  const coverUrl = asString(material.video_info?.cover);
  const mediaUrl = videoUrl ?? coverUrl;

  if (!id || !mediaUrl) {
    return null;
  }

  const ctr = asNumber(material.ctr);
  const like = asNumber(material.like);
  const cost = asNumber(material.cost);
  const durationSeconds = asNumber(material.video_info?.duration);
  const advertiser = asString(material.brand_name);

  return RawAdSchema.parse({
    sourceId: `tiktok-cc-${id}`,
    source: "tiktok_cc",
    platform: "tiktok",
    advertiser: advertiser && advertiser !== "Not Mention" ? advertiser : undefined,
    mediaUrl,
    mediaType: videoUrl ? "video" : "image",
    caption: asString(material.ad_title) ?? `TikTok Creative Center ad ${id}`,
    metrics: {
      engagementIndex: engagementIndexFor(material),
      ...(ctr === undefined ? {} : { ctr }),
      ...(like === undefined ? {} : { like }),
      ...(cost === undefined ? {} : { cost }),
      ...(durationSeconds === undefined ? {} : { durationSeconds })
    },
    landingUrl: `https://ads.tiktok.com/business/creativecenter/topads/${id}`
  });
}

export const tiktokCreativeCenterSource: AdSource = {
  name: "tiktok_cc",
  async fetchAds(query: AdQuery): Promise<RawAd[]> {
    const cookieHeader = await fetchTikTokSessionCookie();
    const limit = Math.min(MAX_TIKTOK_ADS, Math.max(1, query.limit));

    for (const attempt of requestAttempts(query, limit)) {
      const materials = await fetchMaterials(buildRequestUrl(attempt), cookieHeader);
      const ads = materials
        .map(materialToRawAd)
        .filter((ad): ad is RawAd => Boolean(ad));

      if (ads.length > 0) {
        return ads.slice(0, limit);
      }
    }

    return [];
  }
};
