import { zodTextFormat } from "openai/helpers/zod";
import { AI_MODELS } from "@/lib/ai/config";
import { getOpenAIClient, hasOpenAIKey } from "@/lib/ai/client";
import {
  AdAnalysisSchema,
  type AdAnalysis,
  type RawAd
} from "@/lib/ai/schemas";

type DeconstructResult =
  | {
      analysis: AdAnalysis;
      sourceNotes: string[];
    }
  | {
      analysis: null;
      sourceNotes: string[];
    };

export async function deconstructAdWithAI(ad: RawAd): Promise<DeconstructResult> {
  if (!hasOpenAIKey()) {
    return {
      analysis: null,
      sourceNotes: ["OPENAI_API_KEY is not configured, so AI deconstruction was skipped."]
    };
  }

  if (canUseVision(ad)) {
    return deconstructWithVision(ad);
  }

  if (ad.source === "seeded") {
    return {
      analysis: null,
      sourceNotes: ["Seed fixture media kept its saved analysis instead of spending AI calls on demo fixtures."]
    };
  }

  if (hasTextSignals(ad)) {
    return deconstructFromText(ad);
  }

  return {
    analysis: null,
    sourceNotes: [
      "AI deconstruction requires remote image media or caption metadata; local seed media kept its fixture analysis."
    ]
  };
}

async function deconstructWithVision(ad: RawAd): Promise<DeconstructResult> {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: AI_MODELS.deconstruct,
    instructions:
      "You deconstruct performance ads for a media-buying team. Return strict structured analysis. Do not invent metrics. Extract only claims present in the ad or caption.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(
              {
                ...adPayload(ad),
                task: "Analyze the visual ad and caption into the AngleScope ad analysis schema."
              },
              null,
              2
            )
          },
          {
            type: "input_image",
            image_url: ad.mediaUrl,
            detail: "auto"
          }
        ]
      }
    ],
    max_output_tokens: 1_500,
    text: {
      format: zodTextFormat(AdAnalysisSchema, "ad_analysis"),
      verbosity: "medium"
    }
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return {
    analysis: AdAnalysisSchema.parse(JSON.parse(response.output_text)),
    sourceNotes: [`Vision deconstruction completed with OpenAI model ${AI_MODELS.deconstruct}.`]
  };
}

async function deconstructFromText(ad: RawAd): Promise<DeconstructResult> {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: AI_MODELS.deconstruct,
    instructions:
      "You deconstruct performance ads for a media-buying team from public ad metadata when visual media is unavailable or is video. Return strict structured analysis. Do not invent metrics or claims. Infer the hook, angle, format, offer mechanic, and CTA only from the caption, platform, advertiser, landing URL, and metrics provided. Use Unknown when evidence is missing.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(
              {
                ...adPayload(ad),
                task: "Analyze the public ad metadata and caption into the AngleScope ad analysis schema."
              },
              null,
              2
            )
          }
        ]
      }
    ],
    max_output_tokens: 1_200,
    text: {
      format: zodTextFormat(AdAnalysisSchema, "ad_analysis"),
      verbosity: "medium"
    }
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return {
    analysis: AdAnalysisSchema.parse(JSON.parse(response.output_text)),
    sourceNotes: [`Caption/metadata deconstruction completed with OpenAI model ${AI_MODELS.deconstruct}.`]
  };
}

function canUseVision(ad: RawAd) {
  return ad.mediaType === "image" && isRemoteMediaUrl(ad.mediaUrl);
}

function hasTextSignals(ad: RawAd) {
  return Boolean(
    ad.caption?.trim() ||
      ad.advertiser?.trim() ||
      ad.landingUrl?.trim() ||
      (ad.metrics && Object.keys(ad.metrics).length > 0)
  );
}

function adPayload(ad: RawAd) {
  return {
    sourceId: ad.sourceId,
    source: ad.source,
    platform: ad.platform,
    advertiser: ad.advertiser,
    mediaType: ad.mediaType,
    caption: ad.caption,
    firstSeen: ad.firstSeen,
    lastSeen: ad.lastSeen,
    metrics: ad.metrics,
    landingUrl: ad.landingUrl
  };
}

function isRemoteMediaUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:");
}

export async function deconstructAdWithVision(ad: RawAd): Promise<DeconstructResult> {
  if (!hasOpenAIKey()) {
    return {
      analysis: null,
      sourceNotes: ["OPENAI_API_KEY is not configured, so vision deconstruction was skipped."]
    };
  }

  if (!canUseVision(ad)) {
    return {
      analysis: null,
      sourceNotes: [
        "Vision deconstruction requires a fully qualified image URL or data URL; non-image media kept its existing analysis."
      ]
    };
  }

  return deconstructWithVision(ad);
}
