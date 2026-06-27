# Deploying AngleScope On Vercel

The GitHub Pages demo is the no-login fallback: it keeps the core buyer workflow
clickable from a static seed dataset. For the strongest production-style
submission, deploy the full Next.js app on Vercel so the server can hold
`OPENAI_API_KEY` and run AI deconstruction/generation without asking a judge to
provide any credentials.

## 1. Import The Repo

1. Go to https://vercel.com/new.
2. Import `vadim-koenen/anglescope`.
3. Framework preset: `Next.js`.
4. Root directory: repo root.
5. Build command: `npm run build`.
6. Install command: `npm install`.

## 2. Set Environment Variables

In the Vercel project, open Settings -> Environment Variables and add:

| Variable | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | yes for live AI | Server-side only. Enables model-backed `/api/analyze` and `/api/generate`. |
| `ANGLESCOPE_DECONSTRUCT_MODEL` | optional | Vision model. Defaults to `gpt-4o-mini`. |
| `ANGLESCOPE_REASONING_MODEL` | optional | Generation model. Defaults to `gpt-4o`. |
| `DATABASE_URL` | optional | Reserved for the Prisma persistence milestone. Not required for the current demo. |

If `OPENAI_API_KEY` is absent, the app still works through validated fixture
analysis and deterministic concept generation. The deploy remains demoable; it
just runs without live model calls.

## 3. Deploy

Click Deploy. Vercel builds the app and gives you a `*.vercel.app` URL.

## 4. Optional Custom Domain

Add a domain in Settings -> Domains. A custom domain reads better than a
`*.vercel.app` or `github.io` URL in the final submission, but it is not
required for the tool to work.

## 5. Which URL To Submit

- Submit the Vercel URL when server-side AI is configured and verified.
- Submit the GitHub Pages URL when Vercel auth is blocked and the static
  fallback is the most reliable live artifact.

Either way, keep the GitHub repo URL in the form so the full Next.js source,
API routes, zod schemas, Prisma scaffold, and deployment path are reviewable.
