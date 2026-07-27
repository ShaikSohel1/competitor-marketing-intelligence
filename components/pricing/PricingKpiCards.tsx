"use client";

import { DollarSign, TrendingDown, TrendingUp, Tag, AlertTriangle, ShieldCheck, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

interface PricingKpiCardsProps {
  ourAvgPrice: number;
  compAvgPrice: number;
  priceDiffPercent: number;
  premiumBrand: string;
  lowestComp: string;
  activeDiscountsCount: number;
  alertsCount: number;
  productsComparedCount: number;
}

export function PricingKpiCards({
  ourAvgPrice,
  compAvgPrice,
  priceDiffPercent,
  premiumBrand,
  lowestComp,
  activeDiscountsCount,
  alertsCount,
  productsComparedCount,
}: PricingKpiCardsProps) {
  const isCheaper = priceDiffPercent < 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Our Avg Price Card */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-accent uppercase tracking-wider">Our Average Price</p>
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">{formatCurrency(ourAvgPrice, 'INR')}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px] bg-accent/10 border-accent/30 text-accent">OUR BRAND</Badge>
            <span>Based on {productsComparedCount} products</span>
          </div>
        </CardContent>
      </Card>

      {/* Competitor Avg Price & Diff Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Competitor Average</p>
            {isCheaper ? <TrendingDown className="h-4 w-4 text-success" /> : <TrendingUp className="h-4 w-4 text-destructive" />}
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{formatCurrency(compAvgPrice, 'INR')}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
            <span className={cn('font-bold', isCheaper ? 'text-success' : 'text-destructive')}>
              {priceDiffPercent > 0 ? `+${priceDiffPercent}%` : `${priceDiffPercent}%`}
            </span>
            <span className="text-muted-foreground">vs Our Prices</span>
          </div>
        </CardContent>
      </Card>

      {/* Premium & Lowest Competitor Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Market Positioning</p>
            <Award className="h-4 w-4 text-warning" />
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Highest Premium:</span>
              <span className="font-bold text-foreground">{premiumBrand}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Lowest Competitor:</span>
              <span className="font-bold text-success">{lowestComp}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Discounts & Alerts Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Discounts & Alerts</p>
            <Tag className="h-4 w-4 text-info" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold tabular-nums text-info">{activeDiscountsCount}</p>
              <p className="text-[11px] text-muted-foreground">Active Discounts</p>
            </div>
            <div className="text-right border-l pl-4">
              <p className="text-2xl font-bold tabular-nums text-destructive">{alertsCount}</p>
              <p className="text-[11px] text-muted-foreground">Price Change Alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
