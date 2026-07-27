import type {
  CompanyProfile,
  Competitor,
  SeoKeyword,
  PricingItem,
  SocialPost,
  SocialProfile,
  AdCreative,
  WebsiteSnapshot,
  ChangeEvent,
  AiInsight,
} from '@/types';


export interface OverviewComparison {
  ourName: string;
  compName: string;
  ourScore: number;
  compScore: number;
  ourSeoScore: number;
  compSeoScore: number;
  ourTraffic: string;
  compTraffic: string;
  ourKeywords: number;
  compKeywords: number;
  ourDa: number;
  compDa: number;
  ourActiveAds: number;
  compActiveAds: number;
  ourFollowers: string;
  compFollowers: string;
  ourPricingPosition: string;
  compPricingPosition: string;
  threatLevel: string;
  ourGrowth: string;
  compGrowth: string;
}

export interface SeoComparisonRow {
  keyword: string;
  ourRank: number;
  compRank: number;
  diff: number;
  volume: number;
  difficulty: number;
  trafficShare: string;
  recommendation: string;
  statusBadge: 'Leading' | 'Opportunity' | 'Urgent Opportunity' | 'Behind';
}

export interface PricingComparisonRow {
  productName: string;
  ourPrice: number;
  compPrice: number;
  diff: number;
  cheaperBrand: string;
  ourTier: string;
  compTier: string;
  recommendation: string;
}

export interface SocialPlatformComparison {
  platform: string;
  ourFollowers: number;
  compFollowers: number;
  ourEngagementRate: number;
  compEngagementRate: number;
  ourPostsPerWeek: number;
  compPostsPerWeek: number;
  winner: 'our' | 'comp' | 'tie';
}

export interface TechComparisonItem {
  category: string;
  name: string;
  ourHas: boolean;
  compHas: boolean;
}

export interface TimelineCombinedEvent {
  id: string;
  isOurCompany: boolean;
  companyName: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  detectedAt: string;
}

/* ─────────────────────────────────────────────────────────────
 * 1. OVERVIEW COMPARISON
 * ───────────────────────────────────────────────────────────── */
export function compareOverview(
  ourCompany: CompanyProfile,
  competitor: Competitor
): OverviewComparison {
  return {
    ourName: ourCompany.company_name,
    compName: competitor.name,
    ourScore: 0,
    compScore: competitor.activity_score || 0,
    ourSeoScore: 0,
    compSeoScore: 0,
    ourTraffic: `0K/mo`,
    compTraffic: `0K/mo`,
    ourKeywords: 0,
    compKeywords: 0,
    ourDa: 0,
    compDa: 0,
    ourActiveAds: 0,
    compActiveAds: 0,
    ourFollowers: `0K`,
    compFollowers: `0K`,
    ourPricingPosition: 'Pending',
    compPricingPosition: 'Pending',
    threatLevel: competitor.threat_level || 'low',
    ourGrowth: '0%',
    compGrowth: '0%',
  };
}

/* ─────────────────────────────────────────────────────────────
 * 2. SEO COMPARISON
 * ───────────────────────────────────────────────────────────── */
export function compareSeo(
  ourCompany: CompanyProfile,
  competitor: Competitor,
  rawSeoKeywords: SeoKeyword[]
): { rows: SeoComparisonRow[]; keywordOverlap: number; keywordGapCount: number } {
  const compName = competitor.name;

  let baseList: SeoComparisonRow[] = [];

  if (rawSeoKeywords && rawSeoKeywords.length > 0) {
    baseList = rawSeoKeywords.map((k) => {
      const compR = k.rank || 5;
      const ourR = (k.metadata as any)?.our_rank || compR + 4;
      const diff = ourR - compR;
      const badge = diff > 0 ? (diff > 5 ? 'Urgent Opportunity' : 'Opportunity') : 'Leading';

      return {
        keyword: k.keyword,
        ourRank: ourR,
        compRank: compR,
        diff: -diff,
        volume: k.search_volume || 12000,
        difficulty: k.difficulty || 50,
        trafficShare: `${Math.round((100 / compR) * 0.3)}%`,
        recommendation: diff > 0 ? 'Publish dedicated comparison page' : 'Maintain lead rank',
        statusBadge: badge as any,
      };
    });
  }

  return {
    rows: baseList,
    keywordOverlap: 64,
    keywordGapCount: baseList.filter((r) => r.diff < 0).length,
  };
}

/* ─────────────────────────────────────────────────────────────
 * 3. PRICING COMPARISON
 * ───────────────────────────────────────────────────────────── */
export function comparePricing(
  ourCompany: CompanyProfile,
  competitor: Competitor,
  rawPricingItems: PricingItem[]
): PricingComparisonRow[] {
  return [];
}

/* ─────────────────────────────────────────────────────────────
 * 4. SOCIAL COMPARISON
 * ───────────────────────────────────────────────────────────── */
export function compareSocial(
  ourCompany: CompanyProfile,
  competitor: Competitor
): SocialPlatformComparison[] {
  return [];
}

/* ─────────────────────────────────────────────────────────────
 * 5. WEBSITE & TECH COMPARISON
 * ───────────────────────────────────────────────────────────── */
export function compareWebsite(
  ourCompany: CompanyProfile,
  competitor: Competitor
) {
  return {
    loadSpeedMs: { our: 0, comp: 0, winner: 'tie' },
    performanceScore: { our: 0, comp: 0, winner: 'tie' },
    seoScore: { our: 0, comp: 0, winner: 'tie' },
    pageCount: { our: 0, comp: 0, winner: 'tie' },
    blogFrequency: { our: 'Pending', comp: 'Pending', winner: 'tie' },
    coreWebVitals: { our: 'Pending', comp: 'Pending', winner: 'tie' },
    sslMobileScore: { our: 'Pending', comp: 'Pending', winner: 'tie' },
  };
}

export function compareTechnology(
  ourCompany: CompanyProfile,
  competitor: Competitor
): TechComparisonItem[] {
  return [];
}

/* ─────────────────────────────────────────────────────────────
 * 6. COMPARATIVE TIMELINE (INTERLEAVED BOTH COMPANIES)
 * ───────────────────────────────────────────────────────────── */
export function compareTimeline(
  ourCompany: CompanyProfile,
  competitor: Competitor,
  rawEvents: ChangeEvent[]
): TimelineCombinedEvent[] {
  return [];
}

/* ─────────────────────────────────────────────────────────────
 * 7. EXECUTIVE AI ANALYSIS & RECOMMENDATIONS
 * ───────────────────────────────────────────────────────────── */
export function getExecutiveAnalysis(
  ourCompany: CompanyProfile,
  competitor: Competitor
) {
  return {
    summary: `Real intelligence data pending. Initiate a deep AI scan to unlock these insights.`,
    highlights: [],
    priorityActions: [],
  };
}
