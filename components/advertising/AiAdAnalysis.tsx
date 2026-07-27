"use client";

import { Sparkles, Megaphone, Target, Heart, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AiAdAnalysisProps {
  ourCompanyName: string;
}

export function AiAdAnalysis({ ourCompanyName }: AiAdAnalysisProps) {
  const adInsights = [
    `Competitors focus heavily on Meta Instagram Video Reels (42% of budget allocation) for prescription frame sales.`,
    `Lenskart recently launched a 40% OFF Flash Sale promo campaign targeting price-sensitive shoppers.`,
    `Our advertising footprint on Google Search is strong, but competitor video presence on YouTube is 2.5x larger.`,
    `Competitor landing pages contain prominent countdown urgency banners and one-click WhatsApp lead forms.`,
    `Recommendation: Launch targeted video ads showcasing anti-glare screen protection with a clear "Claim 20% Discount" CTA.`,
  ];

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" /> AI Ad Copy & Campaign Strategy Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground leading-relaxed font-medium">
          Executive AI Summary for <strong>{ourCompanyName}</strong>: Competitors are actively spending on high-urgency promotional messaging across Meta and Google Shopping. Primary value propositions center around discount incentives and prescription accuracy guarantees.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3.5 border rounded-xl bg-background/80 space-y-2">
            <h4 className="font-bold text-xs text-accent uppercase flex items-center gap-1.5">
              <Megaphone className="h-3.5 w-3.5" /> Ad Copy & Messaging Patterns
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {adInsights.slice(0, 3).map((ins, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 border rounded-xl bg-background/80 space-y-2">
            <h4 className="font-bold text-xs text-success uppercase flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Tactical Campaign Recommendations
            </h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {adInsights.slice(3).map((ins, i) => (
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
