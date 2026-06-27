# AngleScope Submission Copy

## Demo URL

Use the full server Render URL:

```text
https://anglescope-wuov.onrender.com/
```

Static fallback:

```text
https://vadim-koenen.github.io/anglescope/
```

## GitHub Repo URL

```text
https://github.com/vadim-koenen/anglescope
```

## What Does This Tool Do?

AngleScope is a creative intelligence engine for affiliate and performance marketing teams. It helps a media buyer analyze ad examples, identify recurring winning angles, and turn those patterns into new creative concepts for an offer.

The workflow is: enter a vertical, inspect an ad inventory, see ranked angle clusters, choose a winning angle, enter offer details, and generate platform-specific creative concepts with JSON/CSV export. The live Render demo runs the full Next.js server app, including structured API routes, zod validation, OpenAI-backed ad deconstruction/generation, deterministic fallbacks, seeded ad examples, best-effort live TikTok Creative Center ingestion, and manual ad URL input. The GitHub Pages demo remains available as a static fallback.

## Why Did You Build THIS One?

I built this because creative angle discovery is one of the highest-leverage problems in affiliate media buying. A campaign usually does not win because the dashboard is prettier. It wins because the hook, proof pattern, audience framing, offer mechanic, and landing-page promise are sharper than the market's alternatives.

Media buyers already do this manually: scroll ad libraries, save examples, look for ads that keep running, infer what angle is working, and translate that into the next set of tests. AngleScope turns that workflow into software.

I deliberately avoided building a fake cross-platform spend dashboard because I do not have It's Today Media's private ad-account credentials as an outside contestant. That would have forced the demo into mocked metrics and made the product look more complete than it really is. Instead, I chose a problem that can work honestly with public ad data, seeded examples, user-supplied creative, and eventually the company's internal performance data after hire.

This project is meant to demonstrate how I think: start from a real marketing workflow, identify the part AI can accelerate, keep the data boundaries honest, make the tool useful even when APIs fail, and build an architecture another engineer could extend.

## What Would You Build Next If This Became Your Full-Time Job?

I would close the loop between creative intelligence and business outcomes.

First, I would connect AngleScope to It's Today Media's own Meta, Google, TikTok, Taboola, landing-page, and lead-quality data. That would let the system learn from the company's actual winners and losers instead of only public examples. Then I would correlate creative attributes with ROAS, CPL, lead quality, approval risk, and funnel drop-off.

From there, AngleScope becomes a creative operating system for the buying team: find winning public angles, deconstruct internal winners, generate compliant variants, match each angle to a landing-page or advertorial treatment, and recommend the next batch of tests based on actual performance.

Near-term build steps would be:

- Input a vertical, competitor, or keyword, then pull live ads from TikTok Creative Center, with Meta Ad Library as the next adapter.
- Use a vision LLM to deconstruct each ad into hook, emotional angle, format, offer mechanic, CTA, and a longevity signal where ads running for a long time are treated as likely winners.
- Cluster and rank recurring winning angles with evidence from the source ads.
- Generate 5-10 net-new creative concepts and briefs, including copy and image direction, adapting those winners to one of It's Today Media's offers.
- Add production monitoring and caching around the live server deployment.
- Persist analysis runs and generated concepts in Postgres.
- Upgrade manual URL input to stored uploads.
- Add compliance pre-flight checks for risky claims.
- Generate weekly angle-opportunity reports for the media buying team.
- Add landing-page and advertorial variant generation tied to each winning angle.

## Additional Notes

The project is intentionally practical rather than theatrical. It uses Next.js, TypeScript, Tailwind, zod, Prisma scaffolding, source adapters, and OpenAI-backed structured generation/deconstruction paths. The Render demo runs the full server app, can pull public TikTok Creative Center Top Ads examples when the public endpoint returns materials, and uses deterministic fallbacks when a source or model is unavailable.

Reviewer note: the Render demo is hosted on a free instance, so the first load may take up to a minute if the service is asleep. Suggested test query: vertical `weight loss supplement`, keyword `shilajit`, enable `AI vision`, then click Analyze. Static fallback: `https://vadim-koenen.github.io/anglescope/`. I also added `docs/EVALUATION_GUIDE.md` with exact evaluation steps and source-boundary notes.

The main thing I wanted to show is fit for the role: marketing judgment, AI implementation skill, data realism, and the ability to turn an ambiguous business workflow into a usable internal tool.

Rights note: AngleScope is public for evaluation in this hiring challenge, but it is not open source. I retain all rights to the product, source, and concept unless there is a separate written agreement for commercial use, internal deployment, acquisition, or transfer of rights.
