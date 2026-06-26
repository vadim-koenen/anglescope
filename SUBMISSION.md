# AngleScope Submission Copy

## Demo URL

Use the GitHub Pages URL after publishing:

```text
https://vadim-koenen.github.io/anglescope/
```

## GitHub Repo URL

```text
https://github.com/vadim-koenen/anglescope
```

## What Does This Tool Do?

AngleScope is a creative intelligence engine for affiliate and performance marketing teams. It helps a media buyer analyze ad examples, identify recurring winning angles, and turn those patterns into new creative concepts for an offer.

The workflow is: enter a vertical, inspect an ad inventory, see ranked angle clusters, choose a winning angle, enter offer details, and generate platform-specific creative concepts with JSON/CSV export. The live demo runs the full workflow in the browser: paste an OpenAI API key to generate concepts live with the model, or leave it blank to use deterministic concepts grounded in the same angle evidence. The full Next.js app adds structured API routes, zod validation, server-side OpenAI vision deconstruction and creative generation, seeded ad examples, and manual ad URL input — and is ready to deploy on Vercel for server-side AI (see DEPLOY_VERCEL.md).

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

- Persist analysis runs and generated concepts in Postgres.
- Add a live TikTok Creative Center source adapter.
- Upgrade manual URL input to stored uploads.
- Add compliance pre-flight checks for risky claims.
- Generate weekly angle-opportunity reports for the media buying team.
- Add landing-page and advertorial variant generation tied to each winning angle.

## Additional Notes

The project is intentionally practical rather than theatrical. It uses Next.js, TypeScript, Tailwind, zod, Prisma scaffolding, source adapters, and OpenAI-ready structured generation/deconstruction paths. It remains demoable without API keys through validated seed data and deterministic fallbacks.

The main thing I wanted to show is fit for the role: marketing judgment, AI implementation skill, data realism, and the ability to turn an ambiguous business workflow into a usable internal tool.

Rights note: This repo is shared for you to evaluate as part of the challenge. Per the contest rules, I keep ownership of the code unless I accept the role — at which point it's yours, and I'd be glad to bring it in-house and keep building on it with the team.
