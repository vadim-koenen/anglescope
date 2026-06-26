"use client";

import {
  AlertCircle,
  BarChart3,
  BrainCircuit,
  Check,
  Copy,
  FileJson,
  ImagePlus,
  Loader2,
  Search,
  Sparkles,
  Table2
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AnalyzeResponse, GenerateResponse, OfferDetails, RawAd } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";

const defaultSources = ["seeded", "tiktok_cc"] as const;

const defaultOffer: OfferDetails = {
  product: "LeanLife Metabolic Quiz",
  audience: "adults over 40 comparing weight-management options",
  keyBenefit: "find a realistic routine that fits their body and schedule",
  brandVoice: "clear, direct, performance-marketing friendly",
  offerMechanic: "free quiz",
  complianceConstraints: "Do not promise weight loss results or imply medical endorsement."
};

function csvEscape(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function conceptsToCsv(result: GenerateResponse | null) {
  if (!result) {
    return "";
  }

  const headers = [
    "angle",
    "platform",
    "format",
    "hook",
    "primary_copy",
    "visual_direction",
    "cta",
    "rationale",
    "compliance_notes"
  ];

  const rows = result.concepts.map((concept) => [
    concept.angleUsed,
    concept.platform,
    concept.format,
    concept.hook,
    concept.primaryCopy,
    concept.visualDirection,
    concept.cta,
    concept.rationale,
    concept.complianceNotes
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function AnalysisWorkbench() {
  const [vertical, setVertical] = useState("weight loss supplement");
  const [keywords, setKeywords] = useState("quiz, transformation, doctor");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const [manualMediaUrl, setManualMediaUrl] = useState("");
  const [manualCaption, setManualCaption] = useState("");
  const [manualAdvertiser, setManualAdvertiser] = useState("");
  const [manualPlatform, setManualPlatform] = useState("manual");
  const [manualMediaType, setManualMediaType] = useState<RawAd["mediaType"]>("image");
  const [error, setError] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [selectedAngleId, setSelectedAngleId] = useState<string | null>(null);
  const [offer, setOffer] = useState<OfferDetails>(defaultOffer);
  const [conceptCount, setConceptCount] = useState(6);
  const [generationResult, setGenerationResult] = useState<GenerateResponse | null>(null);

  const selectedCluster = useMemo(() => {
    return result?.clusters.find((cluster) => cluster.id === selectedAngleId) ?? result?.clusters[0] ?? null;
  }, [result, selectedAngleId]);

  const analysisExport = useMemo(() => {
    if (!result) {
      return "";
    }

    return JSON.stringify(
      {
        analysisId: result.analysisId,
        query: result.query,
        clusters: result.clusters
      },
      null,
      2
    );
  }, [result]);

  const conceptJson = useMemo(() => {
    if (!generationResult) {
      return "";
    }

    return JSON.stringify(generationResult, null, 2);
  }, [generationResult]);

  const conceptCsv = useMemo(() => conceptsToCsv(generationResult), [generationResult]);

  function updateOffer(field: keyof OfferDetails, value: string) {
    setOffer((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function copyToClipboard(value: string) {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
  }

  async function runAnalysis() {
    setIsLoading(true);
    setError(null);
    setGenerationError(null);
    setGenerationResult(null);

    try {
      const manualAd = buildManualAd();
      const sources = manualAd ? [...defaultSources, "manual"] : [...defaultSources];
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vertical,
          keywords,
          sources,
          limit: 18,
          useAi,
          manualAds: manualAd ? [manualAd] : []
        })
      });

      if (!response.ok) {
        throw new Error(`Analyze failed with HTTP ${response.status}`);
      }

      const payload = (await response.json()) as AnalyzeResponse;
      setResult(payload);
      setSelectedAngleId(payload.clusters[0]?.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analyze failed");
    } finally {
      setIsLoading(false);
    }
  }

  function buildManualAd(): RawAd | null {
    const mediaUrl = manualMediaUrl.trim();

    if (!mediaUrl) {
      return null;
    }

    const today = new Date().toISOString().slice(0, 10);

    return {
      sourceId: `manual-${Date.now()}`,
      source: "manual",
      platform: manualPlatform.trim() || "manual",
      advertiser: manualAdvertiser.trim() || undefined,
      mediaUrl,
      mediaType: manualMediaType,
      caption: manualCaption.trim() || undefined,
      firstSeen: today,
      lastSeen: today
    };
  }

  async function generateConcepts() {
    if (!selectedCluster) {
      setGenerationError("Run an analysis and select an angle first.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          angle: selectedCluster,
          offer,
          count: conceptCount
        })
      });

      if (!response.ok) {
        throw new Error(`Generate failed with HTTP ${response.status}`);
      }

      setGenerationResult((await response.json()) as GenerateResponse);
    } catch (caught) {
      setGenerationError(caught instanceof Error ? caught.message : "Generate failed");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="min-h-screen">
      <section className="border-b border-border bg-panel">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">AngleScope</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Creative intelligence workspace for ad-angle discovery.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="accent">Analyze wired</Badge>
              <Badge variant="accent">Generate wired</Badge>
              <Badge variant={useAi ? "accent" : "neutral"}>Vision {useAi ? "on" : "ready"}</Badge>
              <Badge variant="neutral">TikTok adapter scaffolded</Badge>
              <Badge variant="neutral">Prisma ready</Badge>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_170px_auto] md:items-end">
            <label className="grid gap-1.5 text-sm font-medium">
              Vertical
              <Input value={vertical} onChange={(event) => setVertical(event.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Keywords
              <Input value={keywords} onChange={(event) => setKeywords(event.target.value)} />
            </label>
            <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium">
              <input
                checked={useAi}
                className="h-4 w-4 accent-primary"
                type="checkbox"
                onChange={(event) => setUseAi(event.target.checked)}
              />
              <BrainCircuit className="h-4 w-4 text-primary" />
              AI vision
            </label>
            <Button onClick={runAnalysis} disabled={isLoading || vertical.trim().length === 0}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Analyze
            </Button>
          </div>

          <div className="grid gap-3 rounded-md border border-border bg-background/70 p-3 md:grid-cols-[minmax(220px,1.2fr)_minmax(180px,0.75fr)_130px_minmax(220px,1fr)] md:items-end">
            <label className="grid gap-1.5 text-sm font-medium">
              Manual media URL
              <Input
                value={manualMediaUrl}
                placeholder="https://..."
                onChange={(event) => setManualMediaUrl(event.target.value)}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Advertiser
              <Input value={manualAdvertiser} onChange={(event) => setManualAdvertiser(event.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Type
              <select
                value={manualMediaType}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                onChange={(event) => setManualMediaType(event.target.value as RawAd["mediaType"])}
              >
                <option value="image">image</option>
                <option value="video">video</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium">
              Caption
              <Input value={manualCaption} onChange={(event) => setManualCaption(event.target.value)} />
            </label>
            <label className="grid gap-1.5 text-sm font-medium md:col-span-2">
              Platform
              <Input value={manualPlatform} onChange={(event) => setManualPlatform(event.target.value)} />
            </label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
              <ImagePlus className="h-4 w-4 text-primary" />
              {manualMediaUrl.trim() ? "Manual source ready" : "Manual source optional"}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(380px,0.82fr)] lg:px-8">
        <div className="grid content-start gap-4">
          {error ? (
            <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/[0.08] px-3 py-2 text-sm text-danger">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ad Inventory</h2>
            <span className="text-sm text-muted-foreground">{result ? `${result.ads.length} ads` : "No run yet"}</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {(result?.ads ?? []).map((ad) => (
              <Card key={ad.sourceId} className="overflow-hidden">
                <div className="flex min-h-40 items-center justify-center border-b border-border bg-muted p-4">
                  {ad.mediaType === "video" ? (
                    <video
                      src={ad.mediaUrl}
                      className="max-h-56 w-full rounded-md object-cover"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ad.mediaUrl} alt="" className="max-h-56 w-full rounded-md object-cover" />
                  )}
                </div>
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{ad.platform}</Badge>
                    <Badge variant={ad.analysis.complianceRisk === "high" ? "danger" : "neutral"}>
                      {ad.analysis.complianceRisk} risk
                    </Badge>
                    <Badge variant="accent">{ad.strengthScore} strength</Badge>
                  </div>
                  <CardTitle>{ad.analysis.hook}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <p className="text-muted-foreground">{ad.caption}</p>
                  <dl className="grid grid-cols-2 gap-2">
                    <div>
                      <dt className="text-xs uppercase text-muted-foreground">Angle</dt>
                      <dd className="font-medium">{ad.analysis.primaryAngle}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-muted-foreground">Longevity</dt>
                      <dd className="font-medium">{ad.longevityDays ?? "unknown"} days</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-muted-foreground">Format</dt>
                      <dd className="font-medium">{ad.analysis.format}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase text-muted-foreground">CTA</dt>
                      <dd className="font-medium">{ad.analysis.cta}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>

          {!result && !isLoading ? (
            <div className="rounded-md border border-dashed border-border bg-panel px-4 py-12 text-center text-sm text-muted-foreground">
              Run an analysis to load the seeded inventory.
            </div>
          ) : null}
        </div>

        <aside className="grid content-start gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Winning Angles</h2>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>

          {(result?.clusters ?? []).map((cluster, index) => {
            const selected = selectedCluster?.id === cluster.id;

            return (
              <button
                key={cluster.id}
                type="button"
                onClick={() => {
                  setSelectedAngleId(cluster.id);
                  setGenerationResult(null);
                }}
                className={cn(
                  "rounded-lg border bg-panel text-left shadow-soft-border transition-colors",
                  selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                )}
              >
                <div className="grid gap-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="accent">#{index + 1}</Badge>
                    <span className="text-sm font-medium">{cluster.averageStrengthScore} avg strength</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold leading-tight">{cluster.name}</h3>
                    {selected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{cluster.whyItWorks}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="neutral">{cluster.frequency} ads</Badge>
                    <Badge variant="neutral">{cluster.representativeAdIds.length} examples</Badge>
                  </div>
                </div>
              </button>
            );
          })}

          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle>Generate Concepts</CardTitle>
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              {selectedCluster ? (
                <p className="text-sm text-muted-foreground">Using angle: {selectedCluster.name}</p>
              ) : null}
            </CardHeader>
            <CardContent className="grid gap-3">
              {generationError ? (
                <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/[0.08] px-3 py-2 text-sm text-danger">
                  <AlertCircle className="h-4 w-4" />
                  {generationError}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium">
                  Product
                  <Input value={offer.product} onChange={(event) => updateOffer("product", event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Audience
                  <Input value={offer.audience} onChange={(event) => updateOffer("audience", event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Key benefit
                  <Input value={offer.keyBenefit} onChange={(event) => updateOffer("keyBenefit", event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Offer mechanic
                  <Input
                    value={offer.offerMechanic}
                    onChange={(event) => updateOffer("offerMechanic", event.target.value)}
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm font-medium">
                Brand voice
                <Input value={offer.brandVoice} onChange={(event) => updateOffer("brandVoice", event.target.value)} />
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Compliance constraints
                <Textarea
                  value={offer.complianceConstraints ?? ""}
                  onChange={(event) => updateOffer("complianceConstraints", event.target.value)}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-[140px_1fr] sm:items-end">
                <label className="grid gap-1.5 text-sm font-medium">
                  Concepts
                  <Input
                    min={1}
                    max={10}
                    type="number"
                    value={conceptCount}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      setConceptCount(Number.isFinite(nextValue) ? Math.min(10, Math.max(1, nextValue)) : 1);
                    }}
                  />
                </label>
                <Button
                  onClick={generateConcepts}
                  disabled={
                    isGenerating ||
                    !selectedCluster ||
                    offer.product.trim().length === 0 ||
                    offer.audience.trim().length === 0 ||
                    offer.keyBenefit.trim().length === 0 ||
                    offer.brandVoice.trim().length === 0 ||
                    offer.offerMechanic.trim().length === 0
                  }
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <Button variant="secondary" disabled={!analysisExport} onClick={() => copyToClipboard(analysisExport)}>
                  <FileJson className="h-4 w-4" />
                  Angles JSON
                </Button>
                <Button variant="secondary" disabled={!conceptJson} onClick={() => copyToClipboard(conceptJson)}>
                  <Copy className="h-4 w-4" />
                  Concepts JSON
                </Button>
                <Button variant="secondary" disabled={!conceptCsv} onClick={() => copyToClipboard(conceptCsv)}>
                  <Table2 className="h-4 w-4" />
                  Concepts CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {generationResult ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Creative Concepts</h2>
                <span className="text-sm text-muted-foreground">{generationResult.concepts.length} generated</span>
              </div>

              {generationResult.concepts.map((concept, index) => (
                <Card key={`${concept.platform}-${concept.format}-${index}`}>
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="accent">#{index + 1}</Badge>
                      <Badge>{concept.platform}</Badge>
                      <Badge variant="neutral">{concept.format}</Badge>
                    </div>
                    <CardTitle>{concept.hook}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <p>{concept.primaryCopy}</p>
                    <dl className="grid gap-2">
                      <div>
                        <dt className="text-xs uppercase text-muted-foreground">Visual direction</dt>
                        <dd className="text-muted-foreground">{concept.visualDirection}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-muted-foreground">CTA</dt>
                        <dd className="font-medium">{concept.cta}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-muted-foreground">Evidence</dt>
                        <dd className="text-muted-foreground">{concept.rationale}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-muted-foreground">Compliance</dt>
                        <dd className="text-muted-foreground">{concept.complianceNotes}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              ))}

              {generationResult.sourceNotes.map((note) => (
                <div key={note} className="rounded-md border border-border bg-panel px-3 py-2 text-xs text-muted-foreground">
                  {note}
                </div>
              ))}
            </div>
          ) : null}

          {result?.sourceNotes.map((note) => (
            <div key={note} className="rounded-md border border-border bg-panel px-3 py-2 text-xs text-muted-foreground">
              {note}
            </div>
          ))}
        </aside>
      </section>
    </main>
  );
}
