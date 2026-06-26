import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { AI_MODELS } from "@/lib/ai/config";
import { getOpenAIClient, hasOpenAIKey } from "@/lib/ai/client";
import {
  CreativeConceptSchema,
  type CreativeConcept,
  type GenerateRequest
} from "@/lib/ai/schemas";

const GenerateLLMOutputSchema = z.object({
  concepts: z.array(CreativeConceptSchema).min(1).max(10)
});

type GenerateResult = {
  concepts: CreativeConcept[];
  sourceNotes: string[];
};

type Template = {
  platform: CreativeConcept["platform"];
  format: string;
  hook: (input: GenerateRequest) => string;
  copy: (input: GenerateRequest) => string;
  visual: (input: GenerateRequest) => string;
  cta: (input: GenerateRequest) => string;
};

const templates: Template[] = [
  {
    platform: "tiktok",
    format: "UGC problem reveal",
    hook: ({ offer }) => `I tested ${offer.product} for ${offer.audience} who want to ${offer.keyBenefit}`,
    copy: ({ angle, offer }) =>
      `Most ${offer.audience} do not need another generic pitch. This starts with the same ${angle.name.toLowerCase()} pattern we saw in winning ads, then shows the one simple reason ${offer.product} is worth checking out: ${offer.keyBenefit}.`,
    visual: ({ offer }) =>
      `Creator opens with a direct-to-camera pain point, cuts to a quick product demo, then shows a simple before/after workflow around helping them ${offer.keyBenefit}.`,
    cta: () => "See how it works"
  },
  {
    platform: "meta",
    format: "Quiz lead-gen static",
    hook: ({ offer }) => `Not sure if ${offer.product} fits your situation?`,
    copy: ({ angle, offer }) =>
      `Answer a short check to see how ${offer.product} could help ${offer.audience} move toward one clear outcome: ${offer.keyBenefit}. The angle works because ${angle.whyItWorks}`,
    visual: ({ offer }) =>
      `Clean static image with a three-step checklist, a product cue, and a large quiz-style button tied to ${offer.offerMechanic}.`,
    cta: () => "Take the check"
  },
  {
    platform: "taboola",
    format: "Native advertorial",
    hook: ({ offer }) => `${capitalize(offer.audience)} are checking this before choosing ${offer.product}`,
    copy: ({ angle, offer }) =>
      `This advertorial adapts the proven ${angle.name.toLowerCase()} pattern into an educational opener, then explains the practical path to ${offer.keyBenefit} without making a hard-sell claim.`,
    visual: ({ offer }) =>
      `Editorial-style image with a realistic person reviewing a checklist, a product-adjacent prop, and a small ${offer.offerMechanic} badge.`,
    cta: () => "Read the guide"
  },
  {
    platform: "google",
    format: "Search ad + landing hero",
    hook: ({ offer }) => `${offer.product} for ${offer.audience}`,
    copy: ({ offer }) =>
      `Find out whether ${offer.product} is a fit. Built for ${offer.audience} looking for a practical way to ${offer.keyBenefit}, with a clear next step and no inflated promises.`,
    visual: ({ offer }) =>
      `Landing hero with concise headline, benefit bullets, trust markers, and a form tied to ${offer.offerMechanic}.`,
    cta: () => "Check eligibility"
  },
  {
    platform: "tiktok",
    format: "Side-by-side demo",
    hook: ({ offer }) => `The old way to ${offer.keyBenefit} versus the ${offer.product} way`,
    copy: ({ angle, offer }) =>
      `Open on the frustrating current workflow, then contrast it with ${offer.product}. The concept borrows from ${angle.name.toLowerCase()} by making the reason to act visible instead of abstract.`,
    visual: ({ offer }) =>
      `Split-screen demo: left side shows the messy old process, right side shows the cleaner path using ${offer.product}.`,
    cta: () => "Compare options"
  },
  {
    platform: "meta",
    format: "Founder/expert explainer",
    hook: ({ offer }) => `Why ${offer.audience} keep asking about ${offer.keyBenefit}`,
    copy: ({ offer }) =>
      `A calm expert-style explanation introduces the problem, names the tradeoffs, and positions ${offer.product} as a practical next step for people who want ${offer.keyBenefit}.`,
    visual: ({ offer }) =>
      `Founder or expert on camera with simple captions, two proof points, and a final frame showing ${offer.offerMechanic}.`,
    cta: () => "Learn more"
  },
  {
    platform: "taboola",
    format: "Listicle",
    hook: ({ offer }) => `Five signs ${offer.product} may be worth a closer look`,
    copy: ({ angle, offer }) =>
      `Turn the ${angle.name.toLowerCase()} angle into a scannable listicle. Each sign should connect to ${offer.keyBenefit} while avoiding exaggerated or guaranteed outcomes.`,
    visual: ({ offer }) =>
      `Numbered list graphic with one concrete benefit per row and a final button for ${offer.offerMechanic}.`,
    cta: () => "See the list"
  },
  {
    platform: "google",
    format: "Comparison landing page",
    hook: ({ offer }) => `Compare options for ${offer.keyBenefit}`,
    copy: ({ offer }) =>
      `Build trust by showing where ${offer.product} fits, who it is for, and what ${offer.audience} should check before moving forward.`,
    visual: ({ offer }) =>
      `Comparison table with three criteria, plain-language caveats, and a CTA tied to ${offer.offerMechanic}.`,
    cta: () => "Start comparison"
  },
  {
    platform: "meta",
    format: "Customer objection carousel",
    hook: ({ offer }) => `Three questions ${offer.audience} ask before trying ${offer.product}`,
    copy: ({ offer }) =>
      `Each carousel card answers one objection, then brings the reader back to the core benefit: ${offer.keyBenefit}. Keep the tone ${offer.brandVoice.toLowerCase()} and specific.`,
    visual: ({ offer }) =>
      `Five-card carousel: problem, objection, proof cue, benefit, and ${offer.offerMechanic} CTA frame.`,
    cta: () => "Get the details"
  },
  {
    platform: "tiktok",
    format: "Street-interview hook",
    hook: ({ offer }) => `We asked ${offer.audience} what stops them from getting ${offer.keyBenefit}`,
    copy: ({ offer }) =>
      `Fast-cut answers surface the pain point, then the creator introduces ${offer.product} as a simple path to investigate. End with a low-pressure next step.`,
    visual: ({ offer }) =>
      `Quick interview clips, captioned objections, product reveal, and final screen with ${offer.offerMechanic}.`,
    cta: () => "Try the next step"
  }
];

export async function generateCreativeConcepts(input: GenerateRequest): Promise<GenerateResult> {
  if (!hasOpenAIKey()) {
    return {
      concepts: buildFallbackConcepts(input),
      sourceNotes: [
        "OPENAI_API_KEY is not configured, so generation used the deterministic fallback.",
        "Set OPENAI_API_KEY in local or Vercel env vars to enable model-generated concepts."
      ]
    };
  }

  try {
    const concepts = await generateWithOpenAI(input);

    return {
      concepts,
      sourceNotes: [
        `Generated with OpenAI model ${AI_MODELS.reasoning}.`,
        "Output was constrained with a zod-backed JSON schema and re-validated before returning."
      ]
    };
  } catch (error) {
    return {
      concepts: buildFallbackConcepts(input),
      sourceNotes: [
        "OpenAI generation failed, so the route returned the deterministic fallback instead.",
        error instanceof Error ? `Generation error: ${error.message}` : "Generation error: unknown failure."
      ]
    };
  }
}

async function generateWithOpenAI(input: GenerateRequest) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: AI_MODELS.reasoning,
    instructions:
      "You are AngleScope, an expert performance-marketing creative strategist. Generate only practical, testable ad concepts grounded in the provided winning-angle evidence. Avoid guaranteed outcomes, medical claims, financial guarantees, or claims not supported by the offer details.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(
              {
                task: `Generate ${input.count} net-new creative concepts.`,
                angle: input.angle,
                offer: input.offer,
                requirements: [
                  "Return exactly the requested concept count if possible.",
                  "Use a mix of meta, tiktok, taboola, and google where appropriate.",
                  "Each rationale must cite the winning angle or supporting hooks.",
                  "Compliance notes must mention concrete risk controls for the offer."
                ]
              },
              null,
              2
            )
          }
        ]
      }
    ],
    max_output_tokens: 4_000,
    text: {
      format: zodTextFormat(GenerateLLMOutputSchema, "anglescope_concepts"),
      verbosity: "medium"
    }
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  const parsed = GenerateLLMOutputSchema.parse(JSON.parse(response.output_text));

  return parsed.concepts.slice(0, input.count);
}

function complianceNote(input: GenerateRequest) {
  const base =
    "Keep claims specific to the offer proof, avoid guarantees, and preserve any required disclosures near the CTA.";

  if (!input.offer.complianceConstraints?.trim()) {
    return base;
  }

  return `${base} Additional constraint: ${input.offer.complianceConstraints.trim()}`;
}

function capitalize(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return value;
  }

  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
}

function buildFallbackConcepts(input: GenerateRequest) {
  return templates.slice(0, input.count).map((template) =>
    CreativeConceptSchema.parse({
      angleUsed: input.angle.name,
      platform: template.platform,
      format: template.format,
      hook: template.hook(input),
      primaryCopy: template.copy(input),
      visualDirection: template.visual(input),
      cta: template.cta(input),
      rationale: `Grounded in ${input.angle.name}: ${input.angle.supportingHooks.slice(0, 2).join(" / ")}`,
      complianceNotes: complianceNote(input)
    })
  );
}
