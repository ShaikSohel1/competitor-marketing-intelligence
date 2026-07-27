"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Code2, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/format';

export interface PixelItem {
  id: string;
  compName: string;
  isOurCompany: boolean;
  pixelName: string;
  status: 'active' | 'inactive';
  version: string;
  confidence: number;
  detectedAt: string;
}

interface PixelMatrixProps {
  pixels: PixelItem[];
}

export function PixelMatrix({ pixels }: PixelMatrixProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Code2 className="h-4 w-4 text-info" /> Tracking Pixels & Analytics Tags Matrix
        </CardTitle>
        <CardDescription>
          Inspection of conversion pixels, tag managers, and behavioral analytics scripts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Pixel / Tag Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SDK Version</TableHead>
                <TableHead className="text-center">Confidence</TableHead>
                <TableHead className="text-right">Detection Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pixels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                    No tracking pixels detected across monitored websites.
                  </TableCell>
                </TableRow>
              ) : (
                pixels.map((p) => (
                  <TableRow key={p.id} className={p.isOurCompany ? 'bg-accent/5 font-medium' : ''}>
                    <TableCell className="font-bold">
                      {p.compName}
                      {p.isOurCompany && (
                        <Badge variant="secondary" className="ml-2 text-[10px] bg-accent/20 text-accent font-bold">
                          OUR BRAND
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">{p.pixelName}</TableCell>
                    <TableCell>
                      {p.status === 'active' ? (
                        <Badge variant="default" className="bg-success/15 text-success gap-1 text-[10px]">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[10px]">
                          <XCircle className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.version}</TableCell>
                    <TableCell className="text-center font-mono">
                      <Badge variant="outline" className="text-[10px] bg-accent/10 text-accent border-accent/30">
                        {p.confidence}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDate(p.detectedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
