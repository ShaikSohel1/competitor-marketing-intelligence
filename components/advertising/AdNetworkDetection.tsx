"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Globe, ShieldCheck } from 'lucide-react';

export interface DetectedAdNetwork {
  platform: string;
  detected: boolean;
  confidence: number;
  compName: string;
  category: 'Search' | 'Social' | 'Video' | 'Display';
}

interface AdNetworkDetectionProps {
  networks: DetectedAdNetwork[];
}

export function AdNetworkDetection({ networks }: AdNetworkDetectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4 text-accent" /> Ad Network & Channel Detection
        </CardTitle>
        <CardDescription>
          Automatically detected advertising networks across monitored domain scripts and tags.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {networks.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No active ad networks detected yet. Run a scan to inspect tracking tags.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {networks.map((net, idx) => (
              <div key={idx} className="p-3 border rounded-xl bg-card space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{net.platform}</span>
                    <Badge variant="secondary" className="text-[10px]">{net.category}</Badge>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> {net.confidence}% Conf.
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Target: <strong className="text-foreground">{net.compName}</strong></span>
                  <Badge variant="outline" className="text-[10px]">Detected</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
