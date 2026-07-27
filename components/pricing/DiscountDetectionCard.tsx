"use client";

import { Tag, Sparkles, AlertCircle, Percent, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';

export interface DiscountOffer {
  id: string;
  companyName: string;
  isOurCompany: boolean;
  title: string;
  code?: string;
  discountValue: string;
  offerType: 'coupon' | 'flash_sale' | 'cashback' | 'bogo' | 'limited';
  expiresAt?: string;
  detectedAt: string;
}

interface DiscountDetectionCardProps {
  discounts: DiscountOffer[];
}

export function DiscountDetectionCard({ discounts }: DiscountDetectionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="h-4 w-4 text-info" /> Active Discounts & Promotional Banner Detection
        </CardTitle>
        <CardDescription>
          Automatically captured coupons, promo codes, flash sales, and special offers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {discounts.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No active promotional discounts detected across monitored brands.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {discounts.map((d) => (
              <div
                key={d.id}
                className={`p-3.5 border rounded-xl space-y-2 ${
                  d.isOurCompany ? 'border-accent/40 bg-accent/5' : 'bg-card'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Badge variant={d.isOurCompany ? 'default' : 'outline'} className={d.isOurCompany ? 'bg-accent text-accent-foreground font-bold' : ''}>
                      {d.companyName}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] bg-info/15 text-info font-bold">
                      {d.discountValue}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDate(d.detectedAt)}</span>
                </div>

                <p className="text-xs font-semibold text-foreground">{d.title}</p>

                {d.code && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="text-muted-foreground">Promo Code:</span>
                    <code className="px-2 py-0.5 rounded bg-muted font-mono font-bold text-accent border">{d.code}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
