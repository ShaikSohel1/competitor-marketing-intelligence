"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import type { AdCreative, Competitor } from '@/types';

interface CreativeGalleryProps {
  ads: AdCreative[];
  competitorMap: Record<string, Competitor>;
  ourCompanyName: string;
}

export function CreativeGallery({ ads, competitorMap, ourCompanyName }: CreativeGalleryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ad Creative & Copy Gallery</CardTitle>
        <CardDescription>Visual ad creatives, headline messaging, CTAs, and impression estimates</CardDescription>
      </CardHeader>
      <CardContent>
        {ads.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No ad creatives captured yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ads.map((a) => {
              const comp = competitorMap[a.competitor_id];
              const compName = comp?.name || (a.competitor_id.includes('our') ? ourCompanyName : 'Competitor');
              const isOur = a.competitor_id.includes('our');

              const spend = a.metadata && typeof a.metadata === 'object' && 'budget_estimate' in a.metadata
                ? formatCurrency(Number(a.metadata.budget_estimate), 'INR')
                : '₹45,000';
              const activeDays = a.metadata && typeof a.metadata === 'object' && 'active_days' in a.metadata
                ? Number(a.metadata.active_days)
                : 14;

              return (
                <Card key={a.id} className={`flex flex-col justify-between transition-all hover:shadow-md ${isOur ? 'border-accent/40 bg-accent/5' : ''}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={isOur ? 'default' : 'outline'} className={isOur ? 'bg-accent text-accent-foreground font-bold' : ''}>
                          {compName}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">{a.platform}</Badge>
                      </div>
                      <Badge variant={a.status === 'active' ? 'default' : 'secondary'} className={a.status === 'active' ? 'bg-success/15 text-success text-[10px]' : 'text-[10px]'}>
                        {a.status}
                      </Badge>
                    </div>

                    {a.creative_url ? (
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden relative group">
                        <img src={a.creative_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Ad Creative" />
                        {a.cta_text && (
                          <span className="absolute bottom-2 right-2 px-2.5 py-1 text-[11px] font-bold bg-background/90 text-foreground rounded shadow backdrop-blur border">
                            CTA: {a.cta_text}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted/60 rounded-lg flex items-center justify-center border text-xs text-muted-foreground p-4 text-center italic">
                        Visual Ad Display Creative — "{a.headline || 'Product Promotion'}"
                      </div>
                    )}

                    {a.headline && <p className="text-sm font-bold text-foreground">"{a.headline}"</p>}
                    {a.body_text && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{a.body_text}</p>}

                    <div className="pt-2 border-t grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span>Est. Spend: </span>
                        <strong className="text-foreground font-mono">{spend}</strong>
                        <Badge variant="outline" className="ml-1 text-[9px] text-warning border-warning">Est.</Badge>
                      </div>
                      <div>
                        <span>Active Days: </span>
                        <strong className="text-foreground font-mono">{activeDays} days</strong>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>First seen: {formatRelativeTime(a.first_seen_at)}</span>
                      <span>Last seen: {formatRelativeTime(a.last_seen_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
