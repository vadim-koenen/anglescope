import { NextResponse } from "next/server";
import {
  GenerateRequestSchema,
  GenerateResponseSchema
} from "@/lib/ai/schemas";
import { generateCreativeConcepts } from "@/lib/ai/generate";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = GenerateRequestSchema.parse(body);
  const generation = await generateCreativeConcepts(input);

  const response = GenerateResponseSchema.parse({
    concepts: generation.concepts,
    angleEvidence: {
      angleName: input.angle.name,
      whyItWorks: input.angle.whyItWorks,
      representativeAdIds: input.angle.representativeAdIds,
      supportingHooks: input.angle.supportingHooks
    },
    sourceNotes: generation.sourceNotes
  });

  return NextResponse.json(response);
}
