# Deploying AngleScope on Vercel (server-side AI)

The GitHub Pages demo (`index.html`) runs the full workflow in the browser and can call
OpenAI directly when you paste your own key. For a polished, no-key-required experience —
where the **server** holds the key and runs vision deconstruction + creative generation —
deploy the Next.js app on Vercel.

## 1. Import the repo
1. Go to https://vercel.com/new and import `vadim-koenen/anglescope`.
2. Framework preset: **Next.js** (auto-detected). No build overrides needed.

## 2. Set environment variables
In the Vercel project → Settings → Environment Variables, add:

| Variable | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | yes (for live AI) | Server-side only. Enables `/api/analyze?useAi=true` and `/api/generate`. |
| `ANGLESCOPE_DECONSTRUCT_MODEL` | optional | Vision model. Defaults to `gpt-4o-mini`. |
| `ANGLESCOPE_REASONING_MODEL` | optional | Generation model. Defaults to `gpt-4o`. |
| `DATABASE_URL` | optional | Only if/when you wire Prisma persistence (not required for the demo). |

If `OPENAI_API_KEY` is absent, the app still works and falls back to deterministic output —
so the deploy is never "broken," it just runs without live AI.

## 3. Deploy
Click **Deploy**. Vercel builds and gives you a `*.vercel.app` URL.

## 4. (Optional) Custom domain
Add a cheap domain in Settings → Domains. A real domain reads better than a `*.vercel.app`
or `github.io` URL on a submission.

## 5. Update the submission demo URL
Once live, swap the demo URL in `SUBMISSION.md` to the Vercel/custom-domain URL.

---

### Which URL should I submit?
- **Want real AI running with zero setup for the judge?** Submit the **Vercel** URL (server holds the key).
- **Fine with the judge pasting their own key, or no key budget?** The **GitHub Pages** URL works and is free.

Either way the workflow is clickable end-to-end; the only difference is where the OpenAI key lives.
