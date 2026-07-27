"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import { ChartTooltip } from '@/components/ChartTooltip';

interface BrandPricingData {
  name: string;
  avgPrice: number;
  isOurCompany?: boolean;
}

interface TimelinePoint {
  date: string;
  ourPrice: number;
  compAvgPrice: number;
}

interface PricingChartsProps {
  brandData: BrandPricingData[];
  timelineData: TimelinePoint[];
}

export function PricingCharts({ brandData, timelineData }: PricingChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Brand Average Price Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Average Product Price by Company</CardTitle>
          <CardDescription>Head-to-head brand pricing comparison across portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="avgPrice" name="Avg Price (₹)" radius={[6, 6, 0, 0]} fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Historical Price Trend Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Price Index Timeline Trend</CardTitle>
          <CardDescription>Historical price adjustments over past scans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gOur" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="ourPrice" name="Our Price (₹)" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#gOur)" />
                <Area type="monotone" dataKey="compAvgPrice" name="Competitor Avg (₹)" stroke="hsl(var(--info))" strokeWidth={2} fill="url(#gComp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
