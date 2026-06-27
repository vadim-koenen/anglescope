# Deploying AngleScope On Render

Use this path if Vercel login or GitHub import is blocked. Render runs AngleScope as a normal Node web service, so the public URL can execute the Next.js API routes for TikTok Creative Center and optional OpenAI-backed analysis/generation.

## 1. Create The Web Service

1. Go to `https://dashboard.render.com/blueprints`.
2. Connect the GitHub repo `vadim-koenen/anglescope`.
3. Render should detect `render.yaml` in the repository root.
4. Create the Blueprint.

The Blueprint defines:

- Runtime: Node
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Health check path: `/`
- Plan: free

## 2. Add The Secret

Render will prompt for `OPENAI_API_KEY` because `render.yaml` marks it as `sync: false`.

Set it if you want live model-backed deconstruction and generation. Leave it blank only if you want the deployed app to rely on deterministic fallbacks.

Non-secret defaults are already included:

```text
NODE_VERSION=20.11.1
TIKTOK_CC_COUNTRY=US
ANGLESCOPE_DECONSTRUCT_MODEL=gpt-4o-mini
ANGLESCOPE_REASONING_MODEL=gpt-4o
```

## 3. Verify The Deploy

After Render finishes deploying, open the public `.onrender.com` URL.

Recommended test:

```text
Vertical: weight loss supplement
Keyword: shilajit
```

Expected result:

- The page loads the full AngleScope workbench.
- The Analyze flow calls `/api/analyze` on the Render service.
- If TikTok Creative Center returns public materials, live TikTok examples appear alongside the seed fixtures.
- If `OPENAI_API_KEY` is set, model-backed generation is available; otherwise the app uses deterministic fallback generation.

## 4. Submit This URL

If the Render URL verifies, use it as the submission Demo URL instead of GitHub Pages.

Keep the GitHub Pages link in Additional Notes as the static fallback:

```text
Static fallback: https://vadim-koenen.github.io/anglescope/
```
