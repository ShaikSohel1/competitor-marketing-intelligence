"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  DollarSign,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Tag,
  Palette,
  Loader2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { saveCompanyProfile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { normalizeUrl } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

interface FormData {
  companyName: string;
  website: string;
  industry: string;
  description: string;
  logoUrl: string;
  brandColor: string;
  headquarters: string;
  employeeCount: string;
  foundedYear: string;
  annualRevenue: string;
  primaryProducts: string;
  targetMarket: string;
  brandKeywords: string;
  linkedin: string;
  instagram: string;
  twitter: string;
}

const STEPS = [
  { label: 'Identity', icon: Building2 },
  { label: 'Details', icon: DollarSign },
  { label: 'Products', icon: Tag },
  { label: 'Socials', icon: Share2 },
];

export default function CompanyOnboardingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    companyName: '',
    website: '',
    industry: '',
    description: '',
    logoUrl: '',
    brandColor: '#0F52BA',
    headquarters: '',
    employeeCount: '',
    foundedYear: '',
    annualRevenue: '',
    primaryProducts: '',
    targetMarket: '',
    brandKeywords: '',
    linkedin: '',
    instagram: '',
    twitter: '',
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const { refreshProfile } = useAuth();

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setStepError(null);
  }

  // Per-step validation before allowing Next
  function validateStep(): boolean {
    setStepError(null);
    if (step === 1) {
      if (!form.companyName.trim()) {
        setStepError('Company Name is required.');
        return false;
      }
      if (!form.website.trim()) {
        setStepError('Official Website is required.');
        return false;
      }
      if (!form.industry.trim()) {
        setStepError('Industry is required.');
        return false;
      }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, 4));
  }

  function handleBack() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleFinish() {
    setSaveError(null);
    setSaving(true);
    try {
      await saveCompanyProfile({
        company_name: form.companyName.trim(),
        website: normalizeUrl(form.website),
        industry: form.industry.trim() || undefined,
        description: form.description.trim() || undefined,
        logo_url: form.logoUrl.trim() || undefined,
        brand_color: form.brandColor || '#0F52BA',
        headquarters: form.headquarters.trim() || undefined,
        employee_count: form.employeeCount ? parseInt(form.employeeCount, 10) : null,
        founded_year: form.foundedYear ? parseInt(form.foundedYear, 10) : null,
        annual_revenue: form.annualRevenue.trim() || undefined,
        primary_products: form.primaryProducts.split(',').map((p) => p.trim()).filter(Boolean),
        target_market: form.targetMarket.trim() || undefined,
        brand_keywords: form.brandKeywords.split(',').map((k) => k.trim()).filter(Boolean),
        social_links: {
          ...(form.linkedin ? { linkedin: normalizeUrl(form.linkedin) } : {}),
          ...(form.instagram ? { instagram: normalizeUrl(form.instagram) } : {}),
          ...(form.twitter ? { twitter: normalizeUrl(form.twitter) } : {}),
        },
      });

      // Refresh auth context so ProtectedRoute allows through
      await refreshProfile();

      toast({
        title: '🎉 Company profile saved!',
        description: `${form.companyName} is now set as your company.`,
      });
      router.push('/app/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile. Please try again.';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-canvas">
      <Card className="w-full max-w-2xl border-accent/30 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Building2 className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold">Set Up Your Company</CardTitle>
          <CardDescription>
            Radar compares <strong>YOUR COMPANY</strong> against competitors. Complete your profile to get started.
          </CardDescription>

          {/* Step progress */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <div key={s.label} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                      active
                        ? 'bg-accent text-accent-foreground ring-2 ring-accent/30 scale-110'
                        : done
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : n}
                  </div>
                  <span className={`hidden sm:block text-xs font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 w-6 rounded ${step > n ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {/* ── STEP 1: Identity ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ob-name">Company Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="ob-name"
                    value={form.companyName}
                    onChange={(e) => set('companyName', e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-site">Official Website <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ob-site"
                      className="pl-9"
                      value={form.website}
                      onChange={(e) => set('website', e.target.value)}
                      placeholder="acme.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-ind">Industry <span className="text-destructive">*</span></Label>
                <Input
                  id="ob-ind"
                  value={form.industry}
                  onChange={(e) => set('industry', e.target.value)}
                  placeholder="SaaS, E-commerce, FinTech..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-desc">Company Description</Label>
                <Textarea
                  id="ob-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Brief overview of what your company does..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ob-logo">Logo URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="ob-logo"
                    value={form.logoUrl}
                    onChange={(e) => set('logoUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-color">Brand Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="ob-color"
                      type="color"
                      className="w-12 h-10 p-1 cursor-pointer"
                      value={form.brandColor}
                      onChange={(e) => set('brandColor', e.target.value)}
                    />
                    <Input
                      value={form.brandColor}
                      onChange={(e) => set('brandColor', e.target.value)}
                      placeholder="#0F52BA"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Details ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ob-hq">Headquarters</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ob-hq"
                      className="pl-9"
                      value={form.headquarters}
                      onChange={(e) => set('headquarters', e.target.value)}
                      placeholder="Bengaluru, India"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-emp">Employee Count</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ob-emp"
                      type="number"
                      className="pl-9"
                      value={form.employeeCount}
                      onChange={(e) => set('employeeCount', e.target.value)}
                      placeholder="500"
                      min={1}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ob-year">Founded Year</Label>
                  <Input
                    id="ob-year"
                    type="number"
                    value={form.foundedYear}
                    onChange={(e) => set('foundedYear', e.target.value)}
                    placeholder="2015"
                    min={1900}
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-rev">Annual Revenue Estimate</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ob-rev"
                      className="pl-9"
                      value={form.annualRevenue}
                      onChange={(e) => set('annualRevenue', e.target.value)}
                      placeholder="$10M, ₹500 Cr..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Products & Market ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ob-prod">Primary Products & Offerings</Label>
                <Input
                  id="ob-prod"
                  value={form.primaryProducts}
                  onChange={(e) => set('primaryProducts', e.target.value)}
                  placeholder="Product A, Service B, Plan C"
                />
                <p className="text-xs text-muted-foreground">Comma-separated list</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-target">Target Market & Audience</Label>
                <Input
                  id="ob-target"
                  value={form.targetMarket}
                  onChange={(e) => set('targetMarket', e.target.value)}
                  placeholder="Enterprise B2B, SMB, Consumer..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ob-kw">Core Brand Keywords</Label>
                <Input
                  id="ob-kw"
                  value={form.brandKeywords}
                  onChange={(e) => set('brandKeywords', e.target.value)}
                  placeholder="CRM software, project management, SaaS"
                />
                <p className="text-xs text-muted-foreground">Keywords you want to track in search rankings</p>
              </div>
            </div>
          )}

          {/* ── STEP 4: Socials + Review ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ob-li">LinkedIn URL</Label>
                  <Input
                    id="ob-li"
                    value={form.linkedin}
                    onChange={(e) => set('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/acme"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-ig">Instagram URL or @handle</Label>
                  <Input
                    id="ob-ig"
                    value={form.instagram}
                    onChange={(e) => set('instagram', e.target.value)}
                    placeholder="@acmecorp or https://instagram.com/acmecorp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-tw">X / Twitter URL or @handle</Label>
                  <Input
                    id="ob-tw"
                    value={form.twitter}
                    onChange={(e) => set('twitter', e.target.value)}
                    placeholder="@acmecorp or https://x.com/acmecorp"
                  />
                </div>
              </div>

              {/* Review summary */}
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 space-y-2 text-sm">
                <p className="font-semibold text-accent flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Review Before Saving
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Company</span>
                  <span className="font-medium truncate">{form.companyName || '—'}</span>
                  <span className="text-muted-foreground">Website</span>
                  <span className="font-medium truncate">{form.website || '—'}</span>
                  <span className="text-muted-foreground">Industry</span>
                  <span className="font-medium truncate">{form.industry || '—'}</span>
                  <span className="text-muted-foreground">HQ</span>
                  <span className="font-medium truncate">{form.headquarters || '—'}</span>
                  <span className="text-muted-foreground">Employees</span>
                  <span className="font-medium">{form.employeeCount || '—'}</span>
                  <span className="text-muted-foreground">Founded</span>
                  <span className="font-medium">{form.foundedYear || '—'}</span>
                </div>
                {form.primaryProducts && (
                  <div className="pt-1">
                    <p className="text-xs text-muted-foreground mb-1">Products</p>
                    <div className="flex flex-wrap gap-1">
                      {form.primaryProducts.split(',').map((p, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{p.trim()}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Save error banner */}
              {saveError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Failed to save profile</p>
                    <p className="mt-0.5 text-xs">{saveError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Per-step validation error */}
          {stepError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{stepError}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={handleBack} disabled={saving}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button type="button" onClick={handleNext}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Complete Setup'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
