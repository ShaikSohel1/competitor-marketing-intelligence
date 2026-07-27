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
import { generateComparativeMetrics, generateSwotAnalysis } from './demoData';

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
  const compNorm = competitor.name.toLowerCase();
  const metrics = generateComparativeMetrics(ourCompany, competitor);

  return {
    ourName: ourCompany.company_name,
    compName: competitor.name,
    ourScore: 82,
    compScore: competitor.activity_score || 88,
    ourSeoScore: metrics.seoScoreOur,
    compSeoScore: metrics.seoScoreComp,
    ourTraffic: `${(metrics.trafficOur / 1000).toFixed(0)}K/mo`,
    compTraffic: `${(metrics.trafficComp / 1000).toFixed(0)}K/mo`,
    ourKeywords: metrics.keywordsOur,
    compKeywords: metrics.keywordsComp,
    ourDa: 61,
    compDa: compNorm.includes('lenskart') || compNorm.includes('amazon') ? 74 : 68,
    ourActiveAds: 12,
    compActiveAds: compNorm.includes('lenskart') ? 27 : 18,
    ourFollowers: `${(metrics.followersOur / 1000).toFixed(0)}K`,
    compFollowers: `${(metrics.followersComp / 1000000).toFixed(1)}M`,
    ourPricingPosition: 'Premium Quality',
    compPricingPosition: compNorm.includes('lenskart') ? 'Budget Value' : 'Competitive Tier',
    threatLevel: competitor.threat_level || 'high',
    ourGrowth: '+8.4%',
    compGrowth: '+18.2%',
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

  let baseList: SeoComparisonRow[] = [
    {
      keyword: 'Blue Light Glasses',
      ourRank: 12,
      compRank: 4,
      diff: -8,
      volume: 21000,
      difficulty: 52,
      trafficShare: '18%',
      recommendation: 'Improve landing page content & schema',
      statusBadge: 'Urgent Opportunity',
    },
    {
      keyword: 'Contact Lens Online',
      ourRank: 3,
      compRank: 7,
      diff: +4,
      volume: 14000,
      difficulty: 48,
      trafficShare: '34%',
      recommendation: 'Leading position. Maintain backlink velocity.',
      statusBadge: 'Leading',
    },
    {
      keyword: 'Prescription Glasses India',
      ourRank: 15,
      compRank: 2,
      diff: -13,
      volume: 42000,
      difficulty: 61,
      trafficShare: '8%',
      recommendation: 'Target high-intent search queries',
      statusBadge: 'Urgent Opportunity',
    },
    {
      keyword: 'Zero Power Computer Eyewear',
      ourRank: 5,
      compRank: 8,
      diff: +3,
      volume: 18000,
      difficulty: 44,
      trafficShare: '28%',
      recommendation: 'Add comparison FAQ snippet',
      statusBadge: 'Leading',
    },
    {
      keyword: 'Anti Reflective Glasses',
      ourRank: 9,
      compRank: 3,
      diff: -6,
      volume: 29000,
      difficulty: 55,
      trafficShare: '14%',
      recommendation: 'Publish blog post targeting keyword gap',
      statusBadge: 'Opportunity',
    },
  ];

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
  const compNorm = competitor.name.toLowerCase();

  if (compNorm.includes('lenskart')) {
    return [
      {
        productName: 'Basic Entry Frame',
        ourPrice: 1499,
        compPrice: 999,
        diff: 500,
        cheaperBrand: competitor.name,
        ourTier: 'Classic',
        compTier: 'Starter',
        recommendation: 'Introduce entry-level bundle to capture budget buyers.',
      },
      {
        productName: 'Premium Anti-Glare Frame',
        ourPrice: 2999,
        compPrice: 2499,
        diff: 500,
        cheaperBrand: competitor.name,
        ourTier: 'Premium',
        compTier: 'Pro',
        recommendation: 'Highlight our 2-year warranty and free home try-on service.',
      },
      {
        productName: 'Annual Gold Pass / Membership',
        ourPrice: 799,
        compPrice: 799,
        diff: 0,
        cheaperBrand: 'Matched',
        ourTier: 'VIP Pass',
        compTier: 'Gold Membership',
        recommendation: 'Match membership perks with additional free lens checkups.',
      },
    ];
  }

  return [
    {
      productName: 'Starter Product Tier',
      ourPrice: 1499,
      compPrice: 1199,
      diff: 300,
      cheaperBrand: competitor.name,
      ourTier: 'Starter',
      compTier: 'Basic',
      recommendation: 'Offer 15% first-order coupon code.',
    },
    {
      productName: 'Pro Tier Package',
      ourPrice: 4999,
      compPrice: 4499,
      diff: 500,
      cheaperBrand: competitor.name,
      ourTier: 'Pro',
      compTier: 'Advanced',
      recommendation: 'Promote 24/7 priority support feature.',
    },
  ];
}

/* ─────────────────────────────────────────────────────────────
 * 4. SOCIAL COMPARISON
 * ───────────────────────────────────────────────────────────── */
export function compareSocial(
  ourCompany: CompanyProfile,
  competitor: Competitor
): SocialPlatformComparison[] {
  const compNorm = competitor.name.toLowerCase();
  const isLenskart = compNorm.includes('lenskart');

  return [
    {
      platform: 'Instagram',
      ourFollowers: 350000,
      compFollowers: isLenskart ? 1250000 : 450000,
      ourEngagementRate: 4.2,
      compEngagementRate: 2.8,
      ourPostsPerWeek: 5,
      compPostsPerWeek: 12,
      winner: 'our',
    },
    {
      platform: 'LinkedIn',
      ourFollowers: 85000,
      compFollowers: isLenskart ? 140000 : 95000,
      ourEngagementRate: 3.8,
      compEngagementRate: 2.1,
      ourPostsPerWeek: 4,
      compPostsPerWeek: 3,
      winner: 'our',
    },
    {
      platform: 'YouTube',
      ourFollowers: 120000,
      compFollowers: isLenskart ? 480000 : 210000,
      ourEngagementRate: 5.1,
      compEngagementRate: 4.4,
      ourPostsPerWeek: 2,
      compPostsPerWeek: 4,
      winner: 'comp',
    },
    {
      platform: 'X / Twitter',
      ourFollowers: 45000,
      compFollowers: isLenskart ? 180000 : 75000,
      ourEngagementRate: 2.1,
      compEngagementRate: 2.5,
      ourPostsPerWeek: 7,
      compPostsPerWeek: 14,
      winner: 'comp',
    },
  ];
}

/* ─────────────────────────────────────────────────────────────
 * 5. WEBSITE & TECH COMPARISON
 * ───────────────────────────────────────────────────────────── */
export function compareWebsite(
  ourCompany: CompanyProfile,
  competitor: Competitor
) {
  return {
    loadSpeedMs: { our: 280, comp: 420, winner: 'our' },
    performanceScore: { our: 94, comp: 81, winner: 'our' },
    seoScore: { our: 85, comp: 91, winner: 'comp' },
    pageCount: { our: 1420, comp: 3850, winner: 'comp' },
    blogFrequency: { our: '4 posts/week', comp: '9 posts/week', winner: 'comp' },
    coreWebVitals: { our: 'Passed (Good)', comp: 'Needs Improvement', winner: 'our' },
    sslMobileScore: { our: '98/100', comp: '94/100', winner: 'our' },
  };
}

export function compareTechnology(
  ourCompany: CompanyProfile,
  competitor: Competitor
): TechComparisonItem[] {
  return [
    { category: 'Web Framework', name: 'Next.js / React', ourHas: true, compHas: true },
    { category: 'Analytics', name: 'Google Analytics 4', ourHas: true, compHas: true },
    { category: 'Product Analytics', name: 'Mixpanel / Amplitude', ourHas: true, compHas: false },
    { category: 'Ad Pixel Tracking', name: 'Meta & Google Ads Pixel', ourHas: true, compHas: true },
    { category: 'CDN & Protection', name: 'Cloudflare Enterprise', ourHas: true, compHas: true },
    { category: 'Marketing Automation', name: 'Klaviyo / HubSpot', ourHas: true, compHas: false },
    { category: 'Payment Gateway', name: 'Razorpay / Stripe', ourHas: true, compHas: true },
  ];
}

/* ─────────────────────────────────────────────────────────────
 * 6. COMPARATIVE TIMELINE (INTERLEAVED BOTH COMPANIES)
 * ───────────────────────────────────────────────────────────── */
export function compareTimeline(
  ourCompany: CompanyProfile,
  competitor: Competitor,
  rawEvents: ChangeEvent[]
): TimelineCombinedEvent[] {
  const ourName = ourCompany.company_name;
  const compName = competitor.name;

  const now = new Date();

  const combined: TimelineCombinedEvent[] = [
    {
      id: 'evt_1',
      isOurCompany: false,
      companyName: compName,
      category: 'pricing',
      title: `${compName} lowered entry frame prices by 15%`,
      description: `${compName} updated starter plan pricing to ₹999.`,
      severity: 'high',
      detectedAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    },
    {
      id: 'evt_2',
      isOurCompany: true,
      companyName: ourName,
      category: 'website',
      title: `${ourName} updated home page hero & value props`,
      description: `${ourName} optimized free home try-on banner messaging.`,
      severity: 'medium',
      detectedAt: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'evt_3',
      isOurCompany: false,
      companyName: compName,
      category: 'advertising',
      title: `${compName} launched new Meta Video Campaign`,
      description: `${compName} deployed 6 new ad creatives promoting computer blue light lenses.`,
      severity: 'high',
      detectedAt: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
    },
    {
      id: 'evt_4',
      isOurCompany: true,
      companyName: ourName,
      category: 'seo',
      title: `${ourName} gained #1 rank for "Progressive Lenses India"`,
      description: `${ourName} moved up 3 rank positions on Google SERP.`,
      severity: 'info',
      detectedAt: new Date(now.getTime() - 72 * 3600 * 1000).toISOString(),
    },
  ];

  return combined;
}

/* ─────────────────────────────────────────────────────────────
 * 7. EXECUTIVE AI ANALYSIS & RECOMMENDATIONS
 * ───────────────────────────────────────────────────────────── */
export function getExecutiveAnalysis(
  ourCompany: CompanyProfile,
  competitor: Competitor
) {
  const ourName = ourCompany.company_name;
  const compName = competitor.name;

  return {
    summary: `${compName} currently leads ${ourName} in organic search reach and ad spend volume. However, ${ourName} maintains superior Instagram engagement rates (4.2% vs 2.8%) and faster desktop web page load times (280ms).`,
    highlights: [
      `${compName} ranks higher for 14 high-volume keywords like "blue light glasses".`,
      `${compName}'s entry-level pricing is 15% lower than ${ourName}'s classic frame tier.`,
      `${compName} posts 2.4x more frequently on Instagram & YouTube.`,
      `${ourName} leads in LinkedIn engagement and site load performance.`,
    ],
    priorityActions: [
      `Introduce a limited-time starter bundle at ₹999 to capture budget-conscious shoppers.`,
      `Publish comparison content: "${ourName} vs ${compName} - Frame Quality & Free Home Try-On Guide".`,
      `Increase Google Shopping ad budget targeting prescription eyewear terms.`,
      `Target missing SERP keywords with high buyer intent.`,
    ],
  };
}
