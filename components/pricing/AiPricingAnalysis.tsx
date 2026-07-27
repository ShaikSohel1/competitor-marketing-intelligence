"use client";

import { Sparkles, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AiPricingAnalysisProps {
  ourCompanyName: string;
  ourAvgPrice: number;
  compAvgPrice: number;
  priceDiffPercent: number;
}

export function AiPricingAnalysis({
  ourCompanyName,
  ourAvgPrice,
  compAvgPrice,
  priceDiffPercent,
}: AiPricingAnalysisProps) {
  const isCheaper = priceDiffPercent < 0;

  const insights = [
    `${ourCompanyName} products are approximately ${Math.abs(priceDiffPercent)}% ${isCheaper ? 'cheaper' : 'more expensive'} than the competitor average.`,
    `Competitor pricing in prescription eyewear has adjusted by +4.2% over the last 30 days.`,
    `Our premium blue-light filter tier appears underpriced relative to market leaders (₹1,499 vs ₹1,890).`,
    `Lenskart launched a 40% OFF flash promotion targeting prescription frames this week.`,
    `Recommendation: Consider adjusting premium tier pricing by +₹150 to improve gross margin without impacting conversion.`,
  ];

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" /> AI Pricing Analysis & Strategic Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground leading-relaxed font-medium">
          Executive Summary: {ourCompanyName} maintains a <strong>{isCheaper ? 'competitive price leadership' : 'premium price position'}</strong> across optical tiers. Price index is currently seated at {Math.round(100 + priceDiffPercent)}% of market average.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3.5 border rounded-xl bg-background/80 space-y-2">
            <h4 className="font-bold text-xs text-accent uppercase flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Market Opportunities & Pricing
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {insights.slice(0, 3).map((ins, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 border rounded-xl bg-background/80 space-y-2">
            <h4 className="font-bold text-xs text-success uppercase flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Recommended Price Adjustments
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {insights.slice(3).map((ins, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
