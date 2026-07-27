"use client";

import { useState, useMemo } from 'react';
import { Search, Download, ArrowUpDown, Tag, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';
import { exportToCsv } from '@/lib/exportUtils';
import { cn } from '@/lib/utils';

export interface PricingTableRow {
  id: string;
  companyName: string;
  isOurCompany: boolean;
  productName: string;
  category: string;
  currentPrice: number;
  previousPrice: number | null;
  currency: string;
  discountTag?: string | null;
  priceIndex: number; // vs market average (100 = average)
  status: 'active' | 'discounted' | 'increased' | 'estimated';
  capturedAt: string;
}

interface PricingComparisonTableProps {
  rows: PricingTableRow[];
}

export function PricingComparisonTable({ rows }: PricingComparisonTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState<'currentPrice' | 'companyName' | 'productName'>('currentPrice');
  const [sortAsc, setSortAsc] = useState(true);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows
      .filter((r) => {
        const matchesSearch =
          r.productName.toLowerCase().includes(search.toLowerCase()) ||
          r.companyName.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [rows, search, categoryFilter, sortField, sortAsc]);

  const handleExportCsv = () => {
    const exportData = filteredRows.map((r) => ({
      Company: r.companyName,
      Product: r.productName,
      Category: r.category,
      CurrentPrice: r.currentPrice,
      PreviousPrice: r.previousPrice ?? 'N/A',
      DiscountTag: r.discountTag ?? 'None',
      PriceIndex: `${r.priceIndex}%`,
      Status: r.status,
      CapturedAt: formatDate(r.capturedAt),
    }));
    exportToCsv('pricing_comparison_report', exportData);
  };

  const toggleSort = (field: 'currentPrice' | 'companyName' | 'productName') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-base">Product Pricing Matrix & Difference</CardTitle>
          <CardDescription>Direct itemized comparison across Our Company and Competitors</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5 text-accent" /> Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Table Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or brands..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 text-xs w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => toggleSort('companyName')} className="cursor-pointer">
                  Company <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead onClick={() => toggleSort('productName')} className="cursor-pointer">
                  Product <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead onClick={() => toggleSort('currentPrice')} className="text-right cursor-pointer">
                  Current Price <ArrowUpDown className="ml-1 inline h-3 w-3" />
                </TableHead>
                <TableHead className="text-right">Prev Price</TableHead>
                <TableHead className="text-center">Price Index</TableHead>
                <TableHead>Discount / Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                    No matching pricing records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => {
                  const priceDiff = r.previousPrice ? r.currentPrice - r.previousPrice : 0;
                  return (
                    <TableRow key={r.id} className={r.isOurCompany ? 'bg-accent/5 font-medium' : ''}>
                      <TableCell className="font-bold">
                        {r.companyName}
                        {r.isOurCompany && (
                          <Badge variant="secondary" className="ml-2 text-[10px] bg-accent/20 text-accent font-bold">
                            OUR BRAND
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">{r.productName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{r.category}</Badge></TableCell>
                      <TableCell className="text-right font-bold font-mono">
                        {formatCurrency(r.currentPrice, r.currency)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {r.previousPrice ? formatCurrency(r.previousPrice, r.currency) : '—'}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            r.priceIndex < 95
                              ? 'border-success text-success bg-success/10'
                              : r.priceIndex > 105
                              ? 'border-destructive text-destructive bg-destructive/10'
                              : 'border-muted-foreground'
                          )}
                        >
                          {r.priceIndex}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.discountTag ? (
                          <Badge variant="secondary" className="bg-info/15 text-info font-bold text-[10px] gap-1">
                            <Tag className="h-3 w-3" /> {r.discountTag}
                          </Badge>
                        ) : r.status === 'estimated' ? (
                          <Badge variant="outline" className="text-[10px] text-warning border-warning">
                            Estimated
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Standard</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
