# AngleScope Evaluation Guide

This guide is written for a reviewer who wants to understand the project quickly, test the working paths, and see where the build is intentionally honest about its data boundaries.

## Fast Review Path

1. Open the public demo:
   `https://anglescope-wuov.onrender.com/`
2. Enter vertical `weight loss supplement` and keyword `shilajit`.
3. Enable `AI vision`, then click Analyze.
4. Inspect the ad inventory, ranked angle clusters, and generated concepts.
5. Review the full Next.js source for the server-side TikTok Creative Center and OpenAI paths.

The Render URL runs the full server app, including TikTok Creative Center ingestion and OpenAI-backed analysis/generation. The GitHub Pages URL is a static fallback so the core buyer workflow is always clickable if a server host is unavailable.

## Full Server Evaluation

Run the Next.js app locally:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Good live-source test query:

```text
Vertical: weight loss supplement
Keyword: shilajit
```

When TikTok Creative Center returns public materials, the analysis includes live TikTok Top Ads examples alongside the seed fixtures. Public TikTok results can be narrow, empty, or blocked for some sensitive keywords, so the adapter tries keyword, industry, and broad Top Ads fallbacks and then explains source limitations in the response notes.

## Optional AI Evaluation

Set `OPENAI_API_KEY` in `.env.local` or in a server deployment environment to enable model-backed paths:

```bash
OPENAI_API_KEY="..."
ANGLESCOPE_DECONSTRUCT_MODEL="gpt-4o-mini"
ANGLESCOPE_REASONING_MODEL="gpt-4o"
```

With an API key, `/api/analyze` can deconstruct remote image ads through a vision model and classify public TikTok video ads from caption/metadata. `/api/generate` can generate structured creative briefs from the selected angle. Without an API key, both routes stay usable through validated seed analysis and deterministic, evidence-grounded fallbacks.

## What To Judge

- Marketing judgment: the product targets creative angle discovery, a high-leverage workflow for affiliate and performance marketing.
- Data honesty: the demo labels seeded data, best-effort public TikTok data, manual inputs, and unavailable private ad-account data separately.
- AI implementation quality: LLM outputs are constrained by schemas, and the app degrades gracefully when a model or live source is unavailable.
- Extensibility: source adapters, AI modules, zod contracts, and Prisma scaffolding are separated so Meta Ad Library, persistence, uploads, and internal performance data can be added cleanly.
- Operator usefulness: the workflow follows how a media buyer actually works: search, inspect, identify angles, adapt winners, and export concepts for testing.

## Known Boundaries

- The GitHub Pages demo is static and does not execute server-side API routes.
- TikTok Creative Center is a public, best-effort source and can return no materials for some searches.
- Meta Ad Library is intentionally scaffolded, not faked.
- Private performance data, spend, ROAS, CPL, and lead-quality feedback require It's Today Media's internal account access after hire.

Those boundaries are deliberate. The goal is to demonstrate a real marketing workflow and a credible architecture instead of presenting mocked private integrations as if they were live.
