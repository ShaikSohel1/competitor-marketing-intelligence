"use client";

import { Megaphone, DollarSign, Globe, Code2, TrendingUp, Activity, Zap, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';

interface AdKpiCardsProps {
  activeCampaignsCount: number;
  estMonthlySpend: number;
  networksCount: number;
  landingPagesCount: number;
  pixelsCount: number;
  growthRate: number;
  healthScore: number;
}

export function AdKpiCards({
  activeCampaignsCount,
  estMonthlySpend,
  networksCount,
  landingPagesCount,
  pixelsCount,
  growthRate,
  healthScore,
}: AdKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Active Campaigns Card */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-accent uppercase tracking-wider">Active Campaigns</p>
            <Megaphone className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">{activeCampaignsCount}</p>
          <span className="text-xs text-success font-medium">Across Search, Social & Video</span>
        </CardContent>
      </Card>

      {/* Est Monthly Ad Spend Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Est. Monthly Ad Spend</p>
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold tabular-nums text-foreground">{formatCurrency(estMonthlySpend, 'INR')}</p>
            <Badge variant="outline" className="text-[10px] text-warning border-warning bg-warning/10">
              Estimated
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">Inferred from ad impressions & pixels</span>
        </CardContent>
      </Card>

      {/* Ad Networks & Pixels Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Networks & Pixels</p>
            <Code2 className="h-4 w-4 text-info" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold tabular-nums text-info">{networksCount}</p>
              <p className="text-[11px] text-muted-foreground">Ad Networks</p>
            </div>
            <div className="text-right border-l pl-4">
              <p className="text-2xl font-bold tabular-nums text-foreground">{pixelsCount}</p>
              <p className="text-[11px] text-muted-foreground">Tracking Pixels</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Growth & Health Score Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ad Health Score</p>
            <Activity className="h-4 w-4 text-warning" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold tabular-nums text-warning">{healthScore}/100</p>
              <p className="text-[11px] text-success font-medium">+{growthRate}% MoM Growth</p>
            </div>
            <div className="text-right border-l pl-4">
              <p className="text-2xl font-bold tabular-nums text-foreground">{landingPagesCount}</p>
              <p className="text-[11px] text-muted-foreground">Landing Pages</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
