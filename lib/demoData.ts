import type {
  Competitor,
  CompanyProfile,
  WebsiteSnapshot,
  SeoKeyword,
  SocialPost,
  PricingItem,
  AdCreative,
  Alert,
  ChangeEvent,
  AiInsight,
  SocialProfile,
  PricingSnapshot,
  ComparisonMetrics,
  SwotAnalysis,
} from '@/types';

// Helper for deterministic random numbers based on seed string
function seedRandom(seedStr: string): () => number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return function () {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

function subDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function subHours(hours: number): string {
  const d = new Date();
  d.setTime(d.getTime() - hours * 3600 * 1000);
  return d.toISOString();
}

function getNormalizedName(name: string): string {
  return name.trim().toLowerCase();
}

/* ─────────────────────────────────────────────────────────────
 * DEMO COMPANY PRESETS (Titan Eye+, Flipkart, Spotify, OpenAI, etc.)
 * ───────────────────────────────────────────────────────────── */
export const DEMO_COMPANY_PRESETS: Record<string, Omit<CompanyProfile, 'id' | 'user_id'>> = {
  'Titan Eye+': {
    company_name: 'Titan Eye+',
    website: 'https://titaneyeplus.com',
    industry: 'Eyewear & Vision Care',
    description: 'India\'s leading omnichannel eyewear chain offering prescription glasses, sunglasses, computer glasses, and contact lenses.',
    logo_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&auto=format&fit=crop&q=80',
    headquarters: 'Bengaluru, Karnataka, India',
    employee_count: 4500,
    founded_year: 2007,
    company_size: '1000-5000 employees',
    annual_revenue: '₹1,250 Cr',
    primary_products: ['Prescription Eyeglasses', 'Anti-Glare Computer Glasses', 'Contact Lenses', 'Design Sunglasses'],
    target_market: 'India & South Asia Consumer Market',
    social_links: {
      linkedin: 'https://linkedin.com/company/titan-eyeplus',
      instagram: 'https://instagram.com/titaneyeplus',
      twitter: 'https://twitter.com/titaneyeplus',
      facebook: 'https://facebook.com/titaneyeplus',
      youtube: 'https://youtube.com/titaneyeplus',
    },
    brand_keywords: ['Titan Eye+', 'Prescription Lenses', 'Eye Glasses', 'Computer Glasses', 'Progressive Lenses'],
    brand_color: '#0F52BA',
  },
  'Flipkart': {
    company_name: 'Flipkart',
    website: 'https://flipkart.com',
    industry: 'E-Commerce & Digital Retail',
    description: 'India\'s leading e-commerce marketplace offering electronics, fashion, groceries, and home appliances.',
    logo_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=200&auto=format&fit=crop&q=80',
    headquarters: 'Bengaluru, India',
    employee_count: 35000,
    founded_year: 2007,
    company_size: '10000+ employees',
    annual_revenue: '₹56,000 Cr',
    primary_products: ['Big Billion Days', 'Flipkart Plus Membership', 'Electronics Marketplace', 'Grocery Dash'],
    target_market: 'Pan-India Online Shoppers',
    social_links: {
      linkedin: 'https://linkedin.com/company/flipkart',
      instagram: 'https://instagram.com/flipkart',
      twitter: 'https://twitter.com/flipkart',
    },
    brand_keywords: ['Flipkart', 'Online Shopping', 'Big Billion Days', 'Flipkart Plus', 'Mobile Offers'],
    brand_color: '#2874F0',
  },
  'Spotify': {
    company_name: 'Spotify',
    website: 'https://spotify.com',
    industry: 'Music Streaming & Audio',
    description: 'Global audio streaming service delivering 100M+ tracks, podcasts, and audiobooks to over 600M users.',
    logo_url: 'https://images.unsplash.com/photo-1614680376593-902f749f705c?w=200&auto=format&fit=crop&q=80',
    headquarters: 'Stockholm, Sweden',
    employee_count: 9000,
    founded_year: 2006,
    company_size: '5000-10000 employees',
    annual_revenue: '$13.2B',
    primary_products: ['Spotify Premium', 'Spotify Free', 'Podcasts & Originals', 'Spotify for Artists'],
    target_market: 'Global Music & Audio Listeners',
    social_links: {
      linkedin: 'https://linkedin.com/company/spotify',
      instagram: 'https://instagram.com/spotify',
      twitter: 'https://twitter.com/spotify',
    },
    brand_keywords: ['Spotify', 'Music Streaming', 'Spotify Premium', 'Podcasts', 'Playlists'],
    brand_color: '#1DB954',
  },
  'OpenAI': {
    company_name: 'OpenAI',
    website: 'https://openai.com',
    industry: 'Artificial Intelligence & Machine Learning',
    description: 'AI research and deployment company behind ChatGPT, GPT-4o, DALL-E, and Sora.',
    logo_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=200&auto=format&fit=crop&q=80',
    headquarters: 'San Francisco, CA, USA',
    employee_count: 1200,
    founded_year: 2015,
    company_size: '1000-5000 employees',
    annual_revenue: '$3.4B ARR',
    primary_products: ['ChatGPT Plus', 'GPT-4o API', 'ChatGPT Enterprise', 'Sora Video AI'],
    target_market: 'Global Developers, Enterprises & Consumers',
    social_links: {
      linkedin: 'https://linkedin.com/company/openai',
      twitter: 'https://twitter.com/openai',
      youtube: 'https://youtube.com/openai',
    },
    brand_keywords: ['ChatGPT', 'GPT-4o', 'OpenAI API', 'Generative AI', 'Custom GPTs'],
    brand_color: '#10A37F',
  },
};

export function generateDefaultCompanyProfile(userId: string): CompanyProfile {
  const preset = DEMO_COMPANY_PRESETS['Titan Eye+'];
  return {
    id: `company_${userId.slice(0, 8)}`,
        ...preset,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/* ─────────────────────────────────────────────────────────────
 * 1. WEBSITE SNAPSHOT GENERATOR
 * ───────────────────────────────────────────────────────────── */
export function generateWebsiteSnapshot(company: Competitor | CompanyProfile): Omit<WebsiteSnapshot, 'id' | 'created_at' | 'user_id'> {
  const normName = getNormalizedName('name' in company ? company.name : company.company_name);
  const rand = seedRandom(`${normName}-website`);

  const name = 'name' in company ? company.name : company.company_name;
  const site = company.website;

  return {
    competitor_id: 'id' in company ? company.id : '',
    scan_id: null,
    url: site.startsWith('http') ? site : `https://${site}`,
    status_code: 200,
    title: `${name} - Official Website | ${company.industry || 'Market Leader'}`,
    meta_description: `Discover ${name}'s latest products, solutions, and enterprise pricing. Empowering customers worldwide.`,
    h1_count: Math.floor(rand() * 4) + 1,
    word_count: Math.floor(rand() * 1500) + 850,
    page_load_ms: Math.floor(rand() * 300) + 250,
    content_hash: Math.random().toString(36).substring(2, 15),
    screenshot_url: `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80`,
    changed: rand() > 0.4,
    data_source: 'automated_crawler',
    metadata: {
      performance_score: Math.floor(rand() * 20) + 80,
      seo_score: Math.floor(rand() * 15) + 85,
    },
    captured_at: subHours(1),
  };
}

/* ─────────────────────────────────────────────────────────────
 * 2. SEO KEYWORDS GENERATOR (OUR COMPANY vs COMPETITOR)
 * ───────────────────────────────────────────────────────────── */
export function generateSeoKeywords(
  company: Competitor,
  ourCompany?: CompanyProfile
): Omit<SeoKeyword, 'id' | 'created_at'>[] {
  const normCompName = getNormalizedName(company.name);
  const ourName = ourCompany?.company_name || 'Titan Eye+';
  const rand = seedRandom(`${normCompName}-seo-vs-${getNormalizedName(ourName)}`);

  let keywordList: { keyword: string; volume: number; difficulty: number; compRank: number; ourRank: number }[] = [];

  if (normCompName.includes('lenskart')) {
    keywordList = [
      { keyword: 'Eyeglasses Online', volume: 110000, difficulty: 78, compRank: 1, ourRank: 2 },
      { keyword: 'Contact Lens Delivery', volume: 90000, difficulty: 72, compRank: 2, ourRank: 1 },
      { keyword: 'Blue Light Glasses', volume: 45000, difficulty: 65, compRank: 1, ourRank: 3 },
      { keyword: 'Prescription Glasses India', volume: 60000, difficulty: 70, compRank: 2, ourRank: 1 },
      { keyword: 'Progressive Lenses', volume: 38000, difficulty: 58, compRank: 4, ourRank: 1 },
      { keyword: 'Zero Power Computer Glasses', volume: 28000, difficulty: 54, compRank: 1, ourRank: 2 },
    ];
  } else if (normCompName.includes('amazon')) {
    keywordList = [
      { keyword: 'Online Shopping India', volume: 120000, difficulty: 95, compRank: 1, ourRank: 2 },
      { keyword: 'Mobile Offers & Deals', volume: 110000, difficulty: 90, compRank: 1, ourRank: 1 },
      { keyword: 'Electronics Discount', volume: 115000, difficulty: 94, compRank: 2, ourRank: 1 },
      { keyword: 'Express Delivery Pass', volume: 80000, difficulty: 81, compRank: 1, ourRank: 3 },
    ];
  } else {
    const prefix = company.name;
    const ind = company.industry || 'Products';
    keywordList = [
      { keyword: `${prefix} ${ind} Solutions`, volume: Math.floor(rand() * 40000) + 15000, difficulty: Math.floor(rand() * 30) + 50, compRank: 2, ourRank: 3 },
      { keyword: `Best ${ind} in India`, volume: Math.floor(rand() * 60000) + 20000, difficulty: Math.floor(rand() * 35) + 55, compRank: 3, ourRank: 1 },
      { keyword: `${ourName} vs ${prefix}`, volume: Math.floor(rand() * 25000) + 8000, difficulty: Math.floor(rand() * 25) + 40, compRank: 2, ourRank: 1 },
      { keyword: `Buy ${ind} Online`, volume: Math.floor(rand() * 35000) + 12000, difficulty: Math.floor(rand() * 30) + 60, compRank: 1, ourRank: 2 },
    ];
  }

  return keywordList.map((item, idx) => {
    const prevRank = item.compRank + (rand() > 0.5 ? 1 : -1);
    const trend = item.compRank < prevRank ? 'up' : 'down';

    return {
      competitor_id: company.id,
      keyword: item.keyword,
      rank: item.compRank,
      previous_rank: prevRank,
      search_volume: item.volume,
      difficulty: item.difficulty,
      opportunity: item.difficulty < 65 ? 'High' : 'Medium',
      trend,
      data_source: 'serp_api',
      metadata: {
        our_rank: item.ourRank,
        traffic_share: Math.round((100 / item.compRank) * 0.35),
        our_traffic_share: Math.round((100 / item.ourRank) * 0.35),
      },
      captured_at: subDays(idx * 3),
    };
  });
}

/* ─────────────────────────────────────────────────────────────
 * 3. SOCIAL POSTS & PROFILES GENERATOR (OUR COMPANY vs COMPETITOR)
 * ───────────────────────────────────────────────────────────── */
export function generateSocialPosts(company: Competitor): Omit<SocialPost, 'id' | 'created_at'>[] {
  const normName = getNormalizedName(company.name);
  const rand = seedRandom(`${normName}-social`);

  const platforms = ['LinkedIn', 'Instagram', 'X', 'YouTube', 'Facebook'];
  const hashtagsByComp: Record<string, string[]> = {
    lenskart: ['EyewearStyle', 'BlueLightProtection', 'LenskartLook', 'VisionCare'],
    flipkart: ['BigBillionDays', 'FlipkartDeals', 'IndiaShoots', 'ShopOnline'],
    spotify: ['SpotifyWrapped', 'MusicLovers', 'PodcastsIndia', 'NowPlaying'],
    amazon: ['AWSCloud', 'AmazonPrime', 'InnovateWithAWS', 'ECommerceTech'],
  };

  const compTags = hashtagsByComp[normName] || ['TechTrends', 'ProductUpdate', 'CustomerSuccess', 'GrowthHacking'];

  const postTemplates = [
    `Excited to announce our latest milestone at ${company.name}! Thank you to our community for driving growth. 🚀`,
    `Discover how ${company.name} is rethinking modern user experiences with AI-driven capabilities.`,
    `We just released our quarterly product roadmap update. Highlights include faster performance and new features.`,
    `Customer Spotlight: See how enterprise teams achieve 3x ROI by partnering with ${company.name}.`,
  ];

  return postTemplates.map((content, idx) => {
    const platform = platforms[idx % platforms.length];
    const likes = Math.floor(rand() * 4500) + 520;
    const comments = Math.floor(rand() * 380) + 42;
    const shares = Math.floor(rand() * 210) + 18;

    return {
      competitor_id: company.id,
      platform,
      post_url: `https://${company.website.replace(/^https?:\/\//, '')}/social/post-${idx + 101}`,
      content: `${content} #${compTags[idx % compTags.length]}`,
      engagement: { likes, comments, shares },
      engagement_rate: Number((rand() * 3.5 + 1.5).toFixed(2)),
      theme_tags: [compTags[idx % compTags.length]],
      sentiment: idx === 3 ? 'neutral' : 'positive',
      posted_at: subDays(idx * 2 + 1),
      data_source: 'social_api',
      metadata: {
        impressions: likes * 14 + 1200,
      },
      captured_at: subHours(idx * 6),
    };
  });
}

export function generateSocialProfiles(company: Competitor): Omit<SocialProfile, 'id' | 'created_at'>[] {
  const normName = getNormalizedName(company.name);
  const rand = seedRandom(`${normName}-profiles`);

  const platforms: ('youtube' | 'linkedin' | 'twitter' | 'instagram' | 'facebook')[] = [
    'linkedin',
    'instagram',
    'twitter',
    'youtube',
    'facebook',
  ];

  const followerBase: Record<string, number> = {
    lenskart: 1250000,
    amazon: 34000000,
    netflix: 32000000,
    openai: 4200000,
    google: 28000000,
  };

  const baseFollowers = followerBase[normName] || Math.floor(rand() * 450000) + 35000;

  return platforms.map((platform) => {
    const factor = platform === 'instagram' ? 1.4 : platform === 'linkedin' ? 1.1 : 0.8;
    const followers = Math.round(baseFollowers * factor * (rand() * 0.4 + 0.8));

    return {
      competitor_id: company.id,
      platform,
      handle: `@${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: `${company.name} Official`,
      followers,
      followers_text: followers >= 1000000 ? `${(followers / 1000000).toFixed(1)}M` : `${(followers / 1000).toFixed(0)}K`,
      bio: `Official ${platform} handle of ${company.name}. Innovation, updates, and community stories.`,
      avatar_url: company.logo_url || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80`,
      post_count: Math.floor(rand() * 1800) + 420,
      engagement_rate: Number((rand() * 4.5 + 1.8).toFixed(2)),
      data_source: 'social_profile_scraper',
      metadata: {
        verified: true,
      },
      captured_at: subHours(4),
    };
  });
}

/* ─────────────────────────────────────────────────────────────
 * 4. PRICING GENERATOR (OUR COMPANY vs COMPETITOR)
 * ───────────────────────────────────────────────────────────── */
export function generatePricing(company: Competitor): Omit<PricingItem, 'id' | 'created_at'>[] {
  const normName = getNormalizedName(company.name);

  let items: { name: string; price: number; prevPrice: number | null; currency: string; unit: string; tier: string; changeType: 'none' | 'increase' | 'decrease' | 'new' }[] = [];

  if (normName.includes('lenskart')) {
    items = [
      { name: 'Basic Frame', price: 999, prevPrice: 1199, currency: 'INR', unit: 'piece', tier: 'Starter', changeType: 'decrease' },
      { name: 'Premium Frame', price: 2499, prevPrice: 2499, currency: 'INR', unit: 'piece', tier: 'Pro', changeType: 'none' },
      { name: 'Gold Membership', price: 799, prevPrice: 699, currency: 'INR', unit: 'year', tier: 'VIP', changeType: 'increase' },
    ];
  } else {
    items = [
      { name: 'Starter Plan', price: 1499, prevPrice: 1499, currency: 'INR', unit: 'month', tier: 'Starter', changeType: 'none' },
      { name: 'Growth Plan', price: 4999, prevPrice: 5499, currency: 'INR', unit: 'month', tier: 'Pro', changeType: 'decrease' },
      { name: 'Enterprise Suite', price: 19999, prevPrice: 19999, currency: 'INR', unit: 'month', tier: 'Enterprise', changeType: 'none' },
    ];
  }

  return items.map((item, idx) => ({
    competitor_id: company.id,
    product_name: item.name,
    price: item.price,
    previous_price: item.prevPrice,
    currency: item.currency,
    unit: item.unit,
    tier: item.tier,
    change_type: item.changeType,
    data_source: 'pricing_page_parser',
    metadata: {
      features_included: ['24/7 Support', 'API Access', 'Unlimited Scans'],
    },
    captured_at: subDays(idx * 4),
  }));
}

export function generatePricingSnapshots(company: Competitor): Omit<PricingSnapshot, 'id' | 'created_at'>[] {
  const items = generatePricing(company);

  const plans = items.map((item) => ({
    name: item.product_name,
    price: item.price,
    currency: item.currency,
    billingPeriod: item.unit || 'month',
    features: ['Priority Support', 'Real-time Alerts', 'Export Reports'],
    isPopular: item.tier === 'Pro',
    isEnterprise: item.tier === 'Enterprise',
  }));

  return [
    {
      competitor_id: company.id,
      scan_id: null,
      url: `${company.website.replace(/\/$/, '')}/pricing`,
      plans,
      extraction_method: 'llm_dom_extraction',
      confidence: '0.96',
      data_source: 'web_scraper',
      captured_at: subHours(2),
    },
  ];
}

/* ─────────────────────────────────────────────────────────────
 * 5. ADVERTISEMENTS GENERATOR
 * ───────────────────────────────────────────────────────────── */
export function generateAdCreatives(company: Competitor): Omit<AdCreative, 'id' | 'created_at'>[] {
  const normName = getNormalizedName(company.name);
  const rand = seedRandom(`${normName}-ads`);

  const adHeadlines = [
    `Buy 1 Get 1 Free Offer from ${company.name}`,
    `Experience Premium Comfort & Style with ${company.name}`,
    `Upgrade Your Workflow - Exclusive Discount Today`,
  ];

  return adHeadlines.map((headline, idx) => ({
    competitor_id: company.id,
    platform: idx % 2 === 0 ? 'Meta Ads' : 'Google Ads',
    ad_id: `ad_${idx + 1001}`,
    format: 'Image',
    headline,
    body_text: `Discover top-rated solutions from ${company.name}. Limited time discount available.`,
    creative_url: `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80`,
    landing_url: `${company.website}/offer`,
    cta_text: 'Shop Now',
    status: 'active',
    impressions_estimate: '50K - 100K',
    region: 'IN',
    first_seen_at: subDays(idx * 5 + 10),
    last_seen_at: subDays(idx * 2),
    data_source: 'ad_library_scraper',
    metadata: {
      budget_estimate: Math.floor(rand() * 150000) + 25000,
      active_days: idx * 6 + 10,
    },
  }));
}

/* ─────────────────────────────────────────────────────────────
 * 6. COMPARATIVE AI INSIGHTS GENERATOR (OUR COMPANY vs COMPETITOR)
 * ───────────────────────────────────────────────────────────── */
export function generateComparativeInsights(
  ourCompany: CompanyProfile,
  competitor: Competitor
): Omit<AiInsight, 'id' | 'created_at'>[] {
  const ourName = ourCompany.company_name;
  const compName = competitor.name;
  const rand = seedRandom(`${ourName}-vs-${compName}-insights`);

  return [
    {
      competitor_id: competitor.id,
      user_id: competitor.user_id || '',
      insight_type: 'seo_opportunity',
      title: `${compName} ranks higher than ${ourName} for "blue light glasses"`,
      content: `${compName} currently holds rank #1 for high-volume keywords where ${ourName} ranks #2 or #3. Capturing featured snippets for comparison keywords could shift ~18% organic market traffic to ${ourName}.`,
      recommendations: [
        `Publish a comparative guide: "${ourName} vs ${compName} - Which Eyewear is Better?"`,
        'Optimize meta titles with high-intent buying terms.',
        'Build authoritative backlinks targeting blue light and computer glass categories.',
      ],
      sentiment: 'negative',
      confidence: Math.floor(rand() * 10) + 88,
      metadata: { generatedBy: 'gemini', category: 'seo_comparison' },
    },
    {
      competitor_id: competitor.id,
      user_id: competitor.user_id || '',
      insight_type: 'pricing_analysis',
      title: `${compName} entry-level pricing is ~15% lower than ${ourName}`,
      content: `${compName}'s starter pricing begins at ₹999 whereas ${ourName}'s classic tier starts at ₹1,499. However, ${ourName}'s gold tier offers 2x superior frame warranty and free home try-on service.`,
      recommendations: [
        `Promote ${ourName}'s free home try-on service explicitly on landing pages.`,
        'Introduce a limited-time bundled starter pack to match entry-level price expectation.',
      ],
      sentiment: 'neutral',
      confidence: Math.floor(rand() * 8) + 90,
      metadata: { generatedBy: 'gemini', category: 'pricing_comparison' },
    },
    {
      competitor_id: competitor.id,
      user_id: competitor.user_id || '',
      insight_type: 'social_sentiment',
      title: `${ourName}'s Instagram engagement rate (4.2%) leads ${compName} (2.8%)`,
      content: `Despite ${compName} having a larger follower count, ${ourName}'s community demonstrates significantly higher comment velocity and user-generated story reposts.`,
      recommendations: [
        'Leverage high-engagement UGC posts in Meta ad retargeting campaigns.',
        'Launch a co-branded influencer campaign to scale followers rapidly.',
      ],
      sentiment: 'positive',
      confidence: Math.floor(rand() * 12) + 84,
      metadata: { generatedBy: 'gemini', category: 'social_comparison' },
    },
  ];
}

export function generateInsights(company: Competitor): Omit<AiInsight, 'id' | 'created_at'>[] {
  const defaultProfile = generateDefaultCompanyProfile((company as any).user_id || company.user_id || '');
  return generateComparativeInsights(defaultProfile, company);
}

/* ─────────────────────────────────────────────────────────────
 * 7. COMPARATIVE METRICS & SWOT GENERATOR
 * ───────────────────────────────────────────────────────────── */
export function generateComparativeMetrics(
  ourCompany: CompanyProfile,
  competitor: Competitor
): ComparisonMetrics {
  const compNorm = getNormalizedName(competitor.name);
  const rand = seedRandom(`${ourCompany.company_name}-vs-${compNorm}-metrics`);

  const isEyewear = compNorm.includes('lenskart') || ourCompany.company_name.includes('Titan');

  return {
    seoScoreOur: isEyewear ? 85 : 82,
    seoScoreComp: isEyewear ? 91 : 88,
    avgPriceOur: isEyewear ? 1499 : 2999,
    avgPriceComp: isEyewear ? 999 : 2499,
    followersOur: isEyewear ? 350000 : 120000,
    followersComp: isEyewear ? 1250000 : 450000,
    trafficOur: isEyewear ? 280000 : 180000,
    trafficComp: isEyewear ? 650000 : 390000,
    keywordsOur: isEyewear ? 560 : 420,
    keywordsComp: isEyewear ? 820 : 610,
    backlinksOur: isEyewear ? 1800 : 1200,
    backlinksComp: isEyewear ? 4600 : 2800,
  };
}

export function generateSwotAnalysis(
  ourCompany: CompanyProfile,
  competitor: Competitor
): SwotAnalysis {
  return {
    strengths: [
      `Higher Instagram & Social engagement rate than ${competitor.name}`,
      `Superior physical store footprint & home try-on service coverage`,
      `Strong customer trust and longer product warranty options`,
    ],
    weaknesses: [
      `Lower total social followers compared to ${competitor.name}`,
      `Entry-tier price point is ~15% higher than ${competitor.name}`,
      `Fewer total organic search keywords indexed in top 10 SERP`,
    ],
    opportunities: [
      `Target missing high-intent keywords like "blue light glasses" and "computer lenses"`,
      `Expand Google Shopping & Performance Max ad spend to capture high-intent buyers`,
      `Launch annual subscription membership bundles to increase customer lifetime value`,
    ],
    threats: [
      `${competitor.name} aggressively ramping Meta video ad spend by 2.5x`,
      `Competitor lowering entry frame prices to capture budget-conscious shoppers`,
      `Competitor expanding exclusive 3D virtual try-on features`,
    ],
  };
}

/* ─────────────────────────────────────────────────────────────
 * 8. ALERTS & CHANGE EVENTS
 * ───────────────────────────────────────────────────────────── */
export function generateAlerts(company: Competitor): Omit<Alert, 'id' | 'created_at'>[] {
  return [
    {
      competitor_id: company.id,
      title: `Pricing Dropped: ${company.name}`,
      message: `${company.name} reduced pricing on entry tier plans by up to 15%. Compare against your pricing now.`,
      category: 'pricing',
      priority: 'high',
      read: false,
      metadata: { competitor_name: company.name, impact: 'High market competition' },
    },
    {
      competitor_id: company.id,
      title: `New Campaign Launched: ${company.name}`,
      message: `${company.name} detected running new video ad creatives on Meta and Google Search.`,
      category: 'advertising',
      priority: 'medium',
      read: false,
      metadata: { competitor_name: company.name },
    },
  ];
}

export function generateChangeEvents(company: Competitor): Omit<ChangeEvent, 'id' | 'created_at'>[] {
  return [
    {
      competitor_id: company.id,
      scan_id: null,
      category: 'pricing',
      event_type: 'price_change',
      title: 'Pricing Plan Updated',
      description: `${company.name} updated plan tiers and adjusted monthly billing rates.`,
      severity: 'high',
      metadata: { old_price: 1199, new_price: 999 },
      detected_at: subHours(5),
    },
    {
      competitor_id: company.id,
      scan_id: null,
      category: 'website',
      event_type: 'homepage_update',
      title: 'Homepage Headline Changed',
      description: `${company.name} updated primary value proposition banner.`,
      severity: 'medium',
      metadata: { page: 'https://' + company.website },
      detected_at: subDays(2),
    },
  ];
}

export const generateTimeline = generateChangeEvents;
export const generateKeywords = generateSeoKeywords;

export function generateComparativeSocialProfiles(
  ourCompany: CompanyProfile,
  competitors: Competitor[]
): SocialProfile[] {
  const platforms: ('instagram' | 'linkedin' | 'facebook' | 'twitter' | 'youtube')[] = [
    'instagram',
    'linkedin',
    'facebook',
    'twitter',
    'youtube',
  ];

  const profiles: SocialProfile[] = [];

  // 1. Generate for Our Company
  platforms.forEach((plt, i) => {
    profiles.push({
      id: `sp_our_${plt}`,
      competitor_id: ourCompany.id || 'our_company_id',
            platform: plt,
      handle: `@${ourCompany.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: ourCompany.company_name,
      followers: [320000, 185000, 450000, 110000, 240000][i],
      followers_text: ['320K', '185K', '450K', '110K', '240K'][i],
      bio: `Official ${ourCompany.company_name} account. Premium vision care & eyewear solutions.`,
      avatar_url: null,
      post_count: [1420, 890, 2100, 3400, 420][i],
      engagement_rate: [4.8, 5.2, 3.4, 2.9, 6.1][i],
      data_source: 'live_scan',
      metadata: { reach: 1850000, sentiment_score: 88 },
      captured_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
  });

  // 2. Generate for Competitors
  competitors.forEach((c) => {
    platforms.forEach((plt, i) => {
      const isLenskart = c.name.toLowerCase().includes('lenskart');
      const followerCount = isLenskart
        ? [1200000, 410000, 890000, 280000, 650000][i]
        : [280000, 140000, 390000, 95000, 180000][i];

      profiles.push({
        id: `sp_${c.id}_${plt}`,
        competitor_id: c.id,
        platform: plt,
        handle: `@${c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: c.name,
        followers: followerCount,
        followers_text: `${(followerCount / 1000).toFixed(0)}K`,
        bio: `Official social page of ${c.name}.`,
        avatar_url: null,
        post_count: [1850, 1120, 2900, 4800, 610][i],
        engagement_rate: [3.4, 3.9, 2.8, 2.1, 4.5][i],
        data_source: 'live_scan',
        metadata: { reach: followerCount * 2.5, sentiment_score: 76 },
        captured_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    });
  });

  return profiles;
}

export function generateComparativeSocialPosts(
  ourCompany: CompanyProfile,
  competitors: Competitor[]
): SocialPost[] {
  const posts: SocialPost[] = [];
  const now = new Date();

  // Our Posts
  posts.push(
    {
      id: 'sp_our_post_1',
      competitor_id: ourCompany.id || 'our_company_id',
            platform: 'Instagram',
      post_url: 'https://instagram.com/p/our1',
      content: `Introducing our latest Anti-Glare Blue Light Glasses collection! 🕶️ Protect your eyes with style. #VisionCare #Eyewear #TitanEyePlus`,
      engagement: { likes: 14200, comments: 890, shares: 1240 },
      engagement_rate: 5.8,
      theme_tags: ['Eyewear', 'VisionCare', 'ProductLaunch', 'BlueLight'],
      sentiment: 'positive',
      posted_at: new Date(now.getTime() - 3600000 * 4).toISOString(),
      captured_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'sp_our_post_2',
      competitor_id: ourCompany.id || 'our_company_id',
            platform: 'LinkedIn',
      post_url: 'https://linkedin.com/posts/our2',
      content: `${ourCompany.company_name} expands retail footprint to 500+ flagship stores across India. Celebrating innovation in optical retail! 🚀`,
      engagement: { likes: 8900, comments: 410, shares: 620 },
      engagement_rate: 6.2,
      theme_tags: ['Expansion', 'RetailInnovation', 'Leadership'],
      sentiment: 'positive',
      posted_at: new Date(now.getTime() - 3600000 * 18).toISOString(),
      captured_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
  );

  // Competitor Posts
  competitors.forEach((c, idx) => {
    posts.push(
      {
        id: `sp_${c.id}_post_1`,
        competitor_id: c.id,
        platform: 'Instagram',
        post_url: `https://instagram.com/p/${c.id}_1`,
        content: `Flash Sale Alert! ⚡ Get 40% OFF on all prescription frames today only. Don't miss out! #${c.name.replace(/\s+/g, '')} #EyewearSale`,
        engagement: { likes: 21500, comments: 1420, shares: 1980 },
        engagement_rate: 3.9,
        theme_tags: ['Discount', 'FlashSale', 'EyewearSale'],
        sentiment: 'positive',
        posted_at: new Date(now.getTime() - 3600000 * (6 + idx * 8)).toISOString(),
        captured_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: `sp_${c.id}_post_2`,
        competitor_id: c.id,
        platform: 'LinkedIn',
        post_url: `https://linkedin.com/posts/${c.id}_2`,
        content: `${c.name} announces AI-powered Virtual Try-On feature for mobile app users. #OpticalTech #AI`,
        engagement: { likes: 6400, comments: 280, shares: 390 },
        engagement_rate: 4.1,
        theme_tags: ['AI', 'OpticalTech', 'Innovation'],
        sentiment: 'neutral',
        posted_at: new Date(now.getTime() - 3600000 * (24 + idx * 12)).toISOString(),
        captured_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
    );
  });

  return posts;
}

