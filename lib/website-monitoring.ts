import FirecrawlApp from "@mendable/firecrawl-js";
import { diffWords } from 'diff';
import crypto from 'crypto';

export type Pillar = 'website' | 'seo' | 'social' | 'pricing' | 'advertising';

export interface CrawlResult {
  url: string;
  html: string;
  screenshotUrl?: string;
  capturedAt: string;
}

export async function crawlPage(url: string): Promise<CrawlResult> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is not set");
  }

  console.info(`[Crawl Helper] Starting crawl for ${url}`);

  const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  const scrapeResult = await app.scrapeUrl(url, { formats: ['html', 'screenshot'] });
  const capturedAt = new Date().toISOString();

  console.info(
    `[Crawl Helper] Completed crawl for ${url} capturedAt=${capturedAt} screenshot=${Boolean(scrapeResult.screenshot)}`
  );

  return { 
    url, 
    html: scrapeResult.html || '', 
    screenshotUrl: scrapeResult.screenshot, 
    capturedAt, 
  };
}

// Strips elements that change on every page load but aren't real content changes.
// Skipping this step is the #1 cause of false-positive alerts.
export function normalizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\b(csrf[_-]?token|session[_-]?id|nonce)=["'][^"']*["']/gi, '')
    .replace(/\b\d{1,2}:\d{2}(:\d{2})?\s?(AM|PM)?\b/gi, '[TIME]')
    .replace(/\b(20\d{2}-\d{2}-\d{2})\b/g, '[DATE]')
    .replace(/data-(reactid|testid)="[^"]*"/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashContent(normalized: string): string {
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export interface HtmlDiff {
  added: string[];
  removed: string[];
  changedRatio: number; // 0–1, rough magnitude of change
}

export function diffHtml(oldNormalized: string, newNormalized: string): HtmlDiff {
  const parts = diffWords(oldNormalized, newNormalized);
  const added = parts.filter((p) => p.added).map((p) => p.value.trim()).filter(Boolean);
  const removed = parts.filter((p) => p.removed).map((p) => p.value.trim()).filter(Boolean);

  const totalWords = newNormalized.split(/\s+/).length || 1;
  const changedWords = parts
    .filter((p) => p.added || p.removed)
    .reduce((sum, p) => sum + p.value.split(/\s+/).length, 0);

  return { added, removed, changedRatio: Math.min(changedWords / totalWords, 1) };
}

type ChangeType = 'copy_edit' | 'new_page' | 'removed_page' | 'layout_change' | 'metadata_change';

export function classifyChange(diff: HtmlDiff, oldHtml: string | null): ChangeType {
  if (oldHtml === null) return 'new_page';
  if (diff.added.length === 0 && diff.removed.length > 0 && diff.changedRatio > 0.8) return 'removed_page';
  if (diff.changedRatio > 0.5) return 'layout_change'; // large-scale change, likely a redesign
  const touchesTitleOrMeta = [...diff.added, ...diff.removed].some((t) => /title|meta|description/i.test(t));
  if (touchesTitleOrMeta) return 'metadata_change';
  return 'copy_edit';
}

export interface WebsiteChangeEvent {
  competitorId: string;
  pillar: Pillar;
  field: string;
  oldValue: any;
  newValue: any;
  diffSummary: string;
  detectedAt: string;
  rawRefs: any;
}

export function buildChangeEvent(
  competitorId: string,
  url: string,
  diff: HtmlDiff,
  changeType: ChangeType,
  before: CrawlResult | null,
  after: CrawlResult
): WebsiteChangeEvent {
  return {
    competitorId,
    pillar: 'website' as Pillar,
    field: url,
    oldValue: before ? { addedCount: 0 } : null,
    newValue: { changeType, addedCount: diff.added.length, removedCount: diff.removed.length },
    diffSummary: `${changeType.replace('_', ' ')}: ${diff.added.length} additions, ${diff.removed.length} removals`,
    detectedAt: after.capturedAt,
    rawRefs: {
      htmlBefore: before ? `s3://snapshots/${competitorId}/${before.capturedAt}.html` : undefined,
      htmlAfter: `s3://snapshots/${competitorId}/${after.capturedAt}.html`,
    },
  };
}
