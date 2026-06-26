# AngleScope

AngleScope is a creative intelligence engine for affiliate and performance marketing teams. It analyzes public ad examples, deconstructs why each one works, clusters recurring winning angles, and prepares the evidence needed to generate new creative concepts for a buyer's offer.

## What Does This Tool Do?

The app lets a user enter a vertical, paste a manual ad media URL, run an analysis, inspect an ad inventory, see ranked winning-angle clusters, choose an angle, enter offer details, and generate new creative concepts with JSON/CSV export. `/api/analyze` loads `/data/seed/ads.json`, validates fixtures with zod, computes longevity and strength scores, and returns evidence-backed angle clusters. Manual ads flow through the same `AdSource` interface as seed data. When `useAi=true` and `OPENAI_API_KEY` is configured, the route can run OpenAI vision deconstruction for fully qualified remote or data-URL media, then falls back to saved or generic analysis when AI is unavailable. `/api/generate` uses OpenAI structured outputs when configured and otherwise returns deterministic, evidence-grounded concepts from the same response contract.

## Why This One?

In affiliate media buying, angle and creative discovery is often the highest-ROI lever. Buyers spend hours scrolling ad libraries to find hooks, formats, and offer mechanics that are already working. AngleScope automates that discovery loop with public data instead of pretending to have private ad-account integrations that an outside contestant cannot access.

This is deliberately not a spend dashboard. A dashboard would only become valuable after connecting It's Today Media's real Meta, Google, TikTok, and Taboola accounts. AngleScope starts with the part of the workflow that can work on public data today: finding winning angles and turning them into new testable creative.

## What's Next?

Next I would persist analyses in Postgres through Prisma, add the TikTok Creative Center live adapter behind the `AdSource` interface, and upgrade manual input from media URLs to stored uploads. If this became a full-time internal tool, I would connect It's Today Media's own performance data so the system could correlate creative attributes with ROAS, flag compliance risk before launch, and generate landing-page variants matched to each winning ad angle.

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

Set `OPENAI_API_KEY` in Vercel to enable model-backed deconstruction and generation. `DATABASE_URL` is reserved for the Prisma persistence milestone; the current demo does not require a database connection to run.

## Environment Variables

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
OPENAI_API_KEY=""
ANGLESCOPE_DECONSTRUCT_MODEL="gpt-4o-mini"
ANGLESCOPE_REASONING_MODEL="gpt-4o"
```

`OPENAI_API_KEY` enables model-backed vision deconstruction and creative generation. Without it, the app stays fully demoable through validated fixture analysis and deterministic concept generation. Keep real secrets in local or Vercel environment variables only.

## Project Structure

```txt
app/api/analyze       Fixture-backed analysis route with optional AI vision deconstruction
app/api/generate      OpenAI-backed creative generation with deterministic fallback
components            Workbench UI and shadcn-style primitives
data/seed             Seed fixture metadata
lib/ai                Schemas, model config, OpenAI client, deconstruction, generation
lib/sources           Source adapter interface plus seeded and manual adapters
prisma                Postgres schema
public/seed-media     Starter fixture visuals
```

## Data Posture

The current seed file is a Day 1 wiring fixture and is labeled that way in the data. Before final submission, replace or augment those starter fixtures with curated screenshots or stills from public ad libraries, keep metrics honest, and mark unavailable metrics as unknown. Live TikTok ingestion should augment the seed set, not become a demo dependency.
