"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, ShieldCheck, Filter } from 'lucide-react';

export interface FunnelStage {
  stage: string;
  detected: boolean;
  pageUrl?: string;
  dropoffRate: string;
}

interface MarketingFunnelVisualizerProps {
  ourCompanyName: string;
  stages: FunnelStage[];
}

export function MarketingFunnelVisualizer({ ourCompanyName, stages }: MarketingFunnelVisualizerProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4 text-accent" /> Conversion Funnel Pipeline Detection
        </CardTitle>
        <CardDescription>
          Automated mapping of user journey stages from ad click to purchase confirmation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 overflow-x-auto p-3 border rounded-xl bg-muted/20">
          {stages.map((st, idx) => (
            <div key={idx} className="flex items-center gap-2 min-w-[130px]">
              <div className="flex flex-col items-center text-center p-3 rounded-lg border bg-card w-full shadow-sm">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Step {idx + 1}</span>
                <span className="font-bold text-xs text-foreground mt-0.5">{st.stage}</span>
                <Badge
                  variant={st.detected ? 'default' : 'outline'}
                  className={st.detected ? 'bg-success/15 text-success text-[9px] mt-1.5' : 'text-[9px] mt-1.5'}
                >
                  {st.detected ? '✓ Detected' : '✕ Missing'}
                </Badge>
                <span className="text-[10px] text-muted-foreground mt-1 font-mono">{st.dropoffRate} Dropoff</span>
              </div>
              {idx < stages.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
