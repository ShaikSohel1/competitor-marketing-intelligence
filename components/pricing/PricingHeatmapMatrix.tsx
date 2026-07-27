"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface HeatmapItem {
  productName: string;
  category: string;
  ourPrice: number;
  competitors: { companyName: string; price: number }[];
}

interface PricingHeatmapMatrixProps {
  matrix: HeatmapItem[];
  ourCompanyName: string;
}

export function PricingHeatmapMatrix({ matrix, ourCompanyName }: PricingHeatmapMatrixProps) {
  if (!matrix || matrix.length === 0) return null;

  const competitorNames = Array.from(
    new Set(matrix.flatMap((m) => m.competitors.map((c) => c.companyName)))
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Product Pricing Heatmap Matrix</CardTitle>
        <CardDescription>
          Visual color matrix comparing Our Company against competitor prices per product tier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 font-bold text-foreground">Product Tier</th>
                <th className="p-3 font-bold text-accent bg-accent/10">{ourCompanyName} (Us)</th>
                {competitorNames.map((comp) => (
                  <th key={comp} className="p-3 font-bold text-foreground text-center">
                    {comp}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/20">
                  <td className="p-3 font-semibold text-foreground">
                    {row.productName}
                    <span className="block text-[10px] font-normal text-muted-foreground">{row.category}</span>
                  </td>
                  <td className="p-3 font-bold font-mono text-accent bg-accent/5">
                    {formatCurrency(row.ourPrice, 'INR')}
                  </td>
                  {competitorNames.map((compName) => {
                    const compObj = row.competitors.find((c) => c.companyName === compName);
                    if (!compObj) {
                      return <td key={compName} className="p-3 text-center text-muted-foreground">—</td>;
                    }

                    const diff = ((compObj.price - row.ourPrice) / row.ourPrice) * 100;
                    // Green = Competitor is more expensive (We are cheaper)
                    // Yellow = Similar price (within 5%)
                    // Red = Competitor is cheaper than us
                    let colorClass = 'bg-warning/15 text-warning border-warning/30';
                    let label = 'Similar';

                    if (diff > 5) {
                      colorClass = 'bg-success/15 text-success border-success/30';
                      label = `Comp +${diff.toFixed(0)}%`;
                    } else if (diff < -5) {
                      colorClass = 'bg-destructive/15 text-destructive border-destructive/30';
                      label = `Comp ${diff.toFixed(0)}%`;
                    }

                    return (
                      <td key={compName} className="p-3 text-center">
                        <div className={cn('inline-flex flex-col items-center p-1.5 rounded border min-w-[90px]', colorClass)}>
                          <span className="font-bold font-mono text-xs">{formatCurrency(compObj.price, 'INR')}</span>
                          <span className="text-[10px] font-semibold">{label}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-end gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-success/20 border border-success" /> We are Cheaper</div>
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-warning/20 border border-warning" /> Similar Price (±5%)</div>
          <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-destructive/20 border border-destructive" /> Competitor is Cheaper</div>
        </div>
      </CardContent>
    </Card>
  );
}
