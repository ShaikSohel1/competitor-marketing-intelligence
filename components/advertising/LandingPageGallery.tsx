"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, ExternalLink, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/format';

export interface LandingPageItem {
  id: string;
  compName: string;
  isOurCompany: boolean;
  url: string;
  headline: string;
  primaryCta: string;
  hasLeadForm: boolean;
  offer: string;
  pixelsDetected: string[];
  conversionScore: number;
  lastScanned: string;
}

interface LandingPageGalleryProps {
  pages: LandingPageItem[];
}

export function LandingPageGallery({ pages }: LandingPageGalleryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4 text-accent" /> Landing Page Intelligence Gallery
        </CardTitle>
        <CardDescription>
          Inspection of competitor campaign landing pages, headlines, CTAs, lead forms, and detected pixels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No landing page intelligence captured yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pages.map((p) => (
              <div
                key={p.id}
                className={`p-4 border rounded-xl space-y-3 flex flex-col justify-between ${
                  p.isOurCompany ? 'border-accent/40 bg-accent/5' : 'bg-card'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant={p.isOurCompany ? 'default' : 'outline'} className={p.isOurCompany ? 'bg-accent text-accent-foreground font-bold' : ''}>
                      {p.compName}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] bg-success/15 text-success font-bold">
                      {p.conversionScore}/100 Conv. Score
                    </Badge>
                  </div>

                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-mono truncate max-w-full"
                  >
                    {p.url.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>

                  <p className="text-sm font-semibold text-foreground leading-snug">"{p.headline}"</p>

                  <div className="space-y-1 pt-1 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Primary CTA:</span>
                      <span className="font-bold text-foreground">{p.primaryCta}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Offer Tag:</span>
                      <span className="font-medium text-info">{p.offer}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Lead Form:</span>
                      <span className="font-medium">{p.hasLeadForm ? '✓ Present' : '✕ None'}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-2 space-y-1 text-[11px]">
                  <p className="text-muted-foreground font-medium">Detected Pixels:</p>
                  <div className="flex flex-wrap gap-1">
                    {p.pixelsDetected.map((px, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] py-0">
                        {px}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
