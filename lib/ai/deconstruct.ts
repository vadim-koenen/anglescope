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

export async function deconstructAdWithVision(ad: RawAd): Promise<DeconstructResult> {
  if (!hasOpenAIKey()) {
    return {
      analysis: null,
      sourceNotes: ["OPENAI_API_KEY is not configured, so vision deconstruction was skipped."]
    };
  }

  if (!isRemoteMediaUrl(ad.mediaUrl)) {
    return {
      analysis: null,
      sourceNotes: [
        "Vision deconstruction requires a fully qualified media URL or data URL; local seed media kept its fixture analysis."
      ]
    };
  }

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
                sourceId: ad.sourceId,
                platform: ad.platform,
                advertiser: ad.advertiser,
                caption: ad.caption,
                firstSeen: ad.firstSeen,
                lastSeen: ad.lastSeen,
                metrics: ad.metrics,
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

function isRemoteMediaUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:");
}
