export const AI_MODELS = {
  deconstruct: process.env.ANGLESCOPE_DECONSTRUCT_MODEL ?? "gpt-4o-mini",
  reasoning: process.env.ANGLESCOPE_REASONING_MODEL ?? "gpt-4o"
} as const;
