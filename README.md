# AngleScope

AngleScope is a creative intelligence engine for affiliate and performance marketing teams. It analyzes public ad examples, deconstructs why each one works, clusters recurring winning angles, and prepares the evidence needed to generate new creative concepts for a buyer's offer.

## Reviewer Fast Path

- Full live demo: `https://anglescope-wuov.onrender.com/`
- Suggested test: vertical `weight loss supplement`, keyword `shilajit`, enable `AI vision`, then click Analyze.
- In-app video: the Watch Demo card includes a 63-second MP4 walkthrough.
- Static fallback: `https://vadim-koenen.github.io/anglescope/`
- Local server app: run `npm install`, `cp .env.example .env.local`, and `npm run dev`.
- Evaluation notes: see [docs/EVALUATION_GUIDE.md](docs/EVALUATION_GUIDE.md).

The Render URL runs the full server-side Next.js app, including TikTok Creative Center ingestion and OpenAI-backed analysis/generation. The GitHub Pages URL remains a static fallback so the buyer workflow is still clickable if a server host is unavailable.

## Why This Is My Submission

I built AngleScope to make the strongest case that I understand the actual work of a performance marketing team, not just how to wrap an LLM in a nice interface.

The marketing thesis is simple: in affiliate media buying, creative angle discovery is often the highest-leverage part of the job. Bids, budgets, and dashboards matter, but a campaign usually lives or dies on whether the hook, offer framing, proof pattern, and landing-page promise are strong enough to earn profitable intent. Media buyers already do this manually by scrolling ad libraries, saving examples, pattern-matching what is running longest, and turning those patterns into new tests. AngleScope turns that workflow into software.

The engineering thesis is equally important: useful internal tools should be honest about their data boundaries. I deliberately avoided building a fake cross-platform spend dashboard because I do not have It's Today Media's private ad-account credentials as an outside contestant. Instead, this project focuses on a workflow that can work with public ad data, user-supplied examples, and eventually the company's own performance data after hire.

## What Does This Tool Do?

The app lets a user enter a vertical, paste a manual ad media URL, run an analysis, inspect an ad inventory, see ranked winning-angle clusters, choose an angle, enter offer details, and generate new creative concepts with JSON/CSV export. `/api/analyze` loads `/data/seed/ads.json`, validates fixtures with zod, pulls best-effort live examples from TikTok Creative Center when the full Next.js app is running server-side, computes strength scores, and returns evidence-backed angle clusters. Manual ads flow through the same `AdSource` interface as seed and TikTok data. When `useAi=true` and `OPENAI_API_KEY` is configured, the route can run OpenAI vision deconstruction for remote images and caption/metadata deconstruction for public TikTok video ads, then falls back to saved or generic analysis when AI is unavailable. `/api/generate` uses OpenAI structured outputs when configured and otherwise returns deterministic, evidence-grounded concepts from the same response contract.

## Why This One?

In affiliate media buying, angle and creative discovery is often the highest-ROI lever. Buyers spend hours scrolling ad libraries to find hooks, formats, and offer mechanics that are already working. AngleScope automates that discovery loop with public data instead of pretending to have private ad-account integrations that an outside contestant cannot access.

This is deliberately not a spend dashboard. A dashboard would only become valuable after connecting It's Today Media's real Meta, Google, TikTok, and Taboola accounts. AngleScope starts with the part of the workflow that can work on public data today: finding winning angles and turning them into new testable creative.

## What This Demonstrates

- Marketing judgment: I chose a workflow tied to creative testing velocity, not a generic chatbot or vanity dashboard.
- Data realism: the demo is explicit about what is seeded, what is manual, and what would require internal credentials.
- AI product sense: model output is constrained behind zod schemas and deterministic fallbacks, so the tool remains usable when an API key or live source is unavailable.
- Extensible architecture: sources are behind an `AdSource` interface, TikTok Creative Center is implemented as a live public-data adapter, AI concerns live under `lib/ai`, and the Prisma schema is ready for persisted analysis runs.
- Operator empathy: the UI supports the actual loop a buyer would run: search a vertical, inspect examples, select an angle, draft concepts, and export.

## Current Live Build Bar

The live Render build now covers the core workflow:

- Input a vertical, competitor, or keyword, then pull best-effort live ads from TikTok Creative Center, with Meta Ad Library as the next source adapter.
- Use OpenAI to deconstruct remote image ads and classify TikTok video ads from public caption/metadata into hook, emotional angle, format, offer mechanic, CTA, claims, and compliance risk.
- Cluster and rank recurring winning angles with evidence from the source ads.
- Generate 5-10 net-new creative concepts and briefs, including copy and image direction, adapting those winners to a buyer's offer.
- Run the full Next.js app from a public server URL so TikTok ingestion and OpenAI calls execute live.

That is the practical version: not a fake dashboard, not a generic chatbot, but an end-to-end creative intelligence loop a media buyer could actually use. The repo is still explicit about boundaries: TikTok is best-effort public data, Meta Ad Library is scaffolded rather than faked, and private spend/ROAS/lead-quality data would require It's Today Media's internal access after hire.

## What's Next?

If this became my full-time job, I would close the loop between creative intelligence and performance. First I would connect It's Today Media's own Meta, Google, TikTok, Taboola, landing-page, and lead-quality data so AngleScope could learn from the company's winners and losers instead of only public examples. Then I would correlate creative attributes with ROAS, CPL, lead quality, approval risk, and funnel drop-off. From there, the product becomes a creative operating system: find winning angles, generate compliant variants, match each angle to a landing-page or advertorial treatment, and recommend the next tests based on actual business outcomes.

Near-term build steps would be: persist analyses in Postgres through Prisma, harden the TikTok Creative Center adapter with cached snapshots and monitoring, add the Meta Ad Library source adapter, upgrade manual input from media URLs to stored uploads, add compliance pre-flight checks, and create a weekly "angle opportunities" report for the buying team.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS with small shadcn-style UI primitives
- Zod for API and LLM-output validation
- Prisma + Postgres scaffold for Vercel Postgres or Supabase
- Public-data source adapters under `lib/sources`

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`, enter a vertical, and click Analyze.

## Deployment

The app is ready for Vercel's default Next.js import flow.

```bash
npm run lint
npm run build
```

Set `OPENAI_API_KEY` in Render, Vercel, or local `.env.local` to enable model-backed deconstruction and generation. `TIKTOK_CC_COUNTRY` defaults to `US` and can be set to another TikTok Creative Center country code, such as `GB`, `CA`, or `AU`. `DATABASE_URL` is reserved for the Prisma persistence milestone; the current demo does not require a database connection to run.

If Vercel auth is unavailable, the repository also includes a static `index.html` demo that can be served by GitHub Pages. That static demo runs the same core buyer workflow in-browser from the seed dataset, while the full Next.js source remains available for technical review.

## Environment Variables

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
OPENAI_API_KEY=""
ANGLESCOPE_DECONSTRUCT_MODEL="gpt-4o-mini"
ANGLESCOPE_REASONING_MODEL="gpt-4o"
TIKTOK_CC_COUNTRY="US"
```

`OPENAI_API_KEY` enables model-backed ad deconstruction and creative generation. Without it, the app stays fully demoable through validated fixture analysis and deterministic concept generation. Keep real secrets in local or host environment variables only.

## Project Structure

```txt
app/api/analyze       Fixture-backed analysis route with optional AI vision deconstruction
app/api/generate      OpenAI-backed creative generation with deterministic fallback
components            Workbench UI and shadcn-style primitives
data/seed             Seed fixture metadata
lib/ai                Schemas, model config, OpenAI client, deconstruction, generation
lib/sources           Source adapter interface plus seeded, TikTok Creative Center, and manual adapters
prisma                Postgres schema
public/seed-media     Starter fixture visuals
public/demo           In-app MP4 walkthrough and poster image
scripts               Reproducible demo-video slide renderer and MP4 encoder
DEPLOY_VERCEL.md      Preferred server-side deployment path for the full Next.js app
DEPLOY_RENDER.md      Alternate server deployment path if Vercel authentication is blocked
render.yaml           Render Blueprint for the alternate server deployment
```

## Data Posture

The current seed file is a Day 1 wiring fixture and is labeled that way in the data. The full Next.js build augments those fixtures with a best-effort TikTok Creative Center Top Ads source and OpenAI-backed classification when enabled. TikTok's public endpoint can return no results for narrow or sensitive keywords, so the adapter tries keyword, industry, and broad Top Ads fallbacks while keeping unavailable run-date metrics as unknown. The GitHub Pages fallback remains static by design; server-side TikTok and OpenAI paths require the Next.js deployment.

## Rights And License

Copyright (c) 2026 Vadim Koenen. All rights reserved.

This repository is public for evaluation in the It's Today Media Build Challenge and related hiring review. It is not open source. No permission is granted to copy, modify, distribute, host, deploy, commercialize, create derivative works from, or use AngleScope for internal, commercial, or production purposes without prior written permission and a separate agreement. See [LICENSE](LICENSE).
