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
  CheckCircle2,
  Compass,
  Tag,
  Palette,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { saveCompanyProfile } from '@/lib/api';
import { DEMO_COMPANY_PRESETS } from '@/lib/demoData';
import { useToast } from '@/hooks/use-toast';
import { normalizeUrl } from '@/lib/format';

export default function CompanyOnboardingPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [companyName, setCompanyName] = useState('Titan Eye+');
  const [website, setWebsite] = useState('titaneyeplus.com');
  const [industry, setIndustry] = useState('Eyewear & Vision Care');
  const [description, setDescription] = useState('India\'s leading omnichannel eyewear brand providing prescription glasses, sunglasses, and contact lenses.');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&auto=format&fit=crop&q=80');
  const [headquarters, setHeadquarters] = useState('Bengaluru, India');
  const [employeeCount, setEmployeeCount] = useState(4500);
  const [foundedYear, setFoundedYear] = useState(2007);
  const [annualRevenue, setAnnualRevenue] = useState('₹1,250 Cr');
  const [primaryProducts, setPrimaryProducts] = useState('Prescription Eyeglasses, Computer Glasses, Contact Lenses, Sunglasses');
  const [targetMarket, setTargetMarket] = useState('India & South Asia Consumer Market');
  const [brandKeywords, setBrandKeywords] = useState('Titan Eye+, Eyeglasses, Prescription Lenses, Computer Glasses');
  const [brandColor, setBrandColor] = useState('#0F52BA');
  const [linkedin, setLinkedin] = useState('https://linkedin.com/company/titan-eyeplus');
  const [instagram, setInstagram] = useState('https://instagram.com/titaneyeplus');
  const [twitter, setTwitter] = useState('https://twitter.com/titaneyeplus');

  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  function loadPresetTemplate(presetKey: string) {
    const preset = DEMO_COMPANY_PRESETS[presetKey];
    if (!preset) return;
    setCompanyName(preset.company_name);
    setWebsite(preset.website.replace(/^https?:\/\//, ''));
    setIndustry(preset.industry || '');
    setDescription(preset.description || '');
    setLogoUrl(preset.logo_url || '');
    setHeadquarters(preset.headquarters || '');
    setEmployeeCount(preset.employee_count || 1000);
    setFoundedYear(preset.founded_year || 2010);
    setAnnualRevenue(preset.annual_revenue || '₹500 Cr');
    setPrimaryProducts((preset.primary_products || []).join(', '));
    setTargetMarket(preset.target_market || '');
    setBrandKeywords((preset.brand_keywords || []).join(', '));
    setBrandColor(preset.brand_color || '#0F52BA');
    if (preset.social_links) {
      setLinkedin(preset.social_links.linkedin || '');
      setInstagram(preset.social_links.instagram || '');
      setTwitter(preset.social_links.twitter || '');
    }
    toast({ title: `${presetKey} Preset Loaded`, description: 'Company details filled automatically.' });
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) {
      toast({ title: 'Company Name required', variant: 'destructive' });
      return;
    }
    if (!website.trim()) {
      toast({ title: 'Website URL required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await saveCompanyProfile({
        company_name: companyName.trim(),
        website: normalizeUrl(website),
        industry: industry.trim() || undefined,
        description: description.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        headquarters: headquarters.trim() || undefined,
        employee_count: Number(employeeCount) || null,
        founded_year: Number(foundedYear) || null,
        annual_revenue: annualRevenue.trim() || undefined,
        primary_products: primaryProducts.split(',').map((p) => p.trim()).filter(Boolean),
        target_market: targetMarket.trim() || undefined,
        brand_keywords: brandKeywords.split(',').map((k) => k.trim()).filter(Boolean),
        brand_color: brandColor.trim() || '#0F52BA',
        social_links: {
          linkedin: linkedin ? normalizeUrl(linkedin) : '',
          instagram: instagram ? normalizeUrl(instagram) : '',
          twitter: twitter ? normalizeUrl(twitter) : '',
        },
      });

      toast({ title: 'Company Onboarding Complete!', description: `${companyName} is now set as Our Company.` });
      router.push('/app/dashboard');
    } catch (err) {
      toast({
        title: 'Onboarding failed',
        description: err instanceof Error ? err.message : 'Error saving company profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-accent/30 shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
            <Building2 className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold">Onboard Your Company</CardTitle>
          <CardDescription>
            Radar compares <strong>OUR COMPANY</strong> against all competitors. Set up your company profile.
          </CardDescription>

          {/* Quick Pick Presets */}
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              ⚡ Quick Load Demo Company Preset
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.keys(DEMO_COMPANY_PRESETS).map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant={companyName === key ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => loadPresetTemplate(key)}
                >
                  <Sparkles className="mr-1 h-3 w-3 text-accent" /> {key}
                </Button>
              ))}
            </div>
          </div>

          {/* Wizard Step Progress */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-accent text-accent-foreground ring-2 ring-accent/30'
                    : step > s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
            ))}
          </div>
        </CardHeader>

        <form onSubmit={step === 4 ? handleFinish : (e) => { e.preventDefault(); setStep((s) => (s + 1) as any); }}>
          <CardContent className="space-y-4 pt-2">
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ob-name">Company Name *</Label>
                    <Input id="ob-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ob-site">Official Website *</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="ob-site" className="pl-9" value={website} onChange={(e) => setWebsite(e.target.value)} required />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ob-ind">Industry *</Label>
                  <Input id="ob-ind" value={industry} onChange={(e) => setIndustry(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ob-desc">Company Overview / Description</Label>
                  <Textarea id="ob-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ob-logo">Logo Image URL</Label>
                    <Input id="ob-logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ob-color">Primary Brand Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input id="ob-color" type="color" className="w-12 h-10 p-1 cursor-pointer" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
                      <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ob-hq">Headquarters Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input id="ob-hq" className="pl-9" value={headquarters} onChange={(e) => setHeadquarters(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ob-emp">Employee Count</Label>
                    <Input id="ob-emp" type="number" value={employeeCount} onChange={(e) => setEmployeeCount(Number(e.target.value))} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ob-year">Founded Year</Label>
                    <Input id="ob-year" type="number" value={foundedYear} onChange={(e) => setFoundedYear(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ob-rev">Annual Revenue Estimate</Label>
                    <Input id="ob-rev" value={annualRevenue} onChange={(e) => setAnnualRevenue(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="ob-prod">Primary Products & Offerings (comma-separated)</Label>
                  <Input id="ob-prod" value={primaryProducts} onChange={(e) => setPrimaryProducts(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ob-target">Target Market & Audience</Label>
                  <Input id="ob-target" value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ob-kw">Core Brand Keywords (comma-separated)</Label>
                  <Input id="ob-kw" value={brandKeywords} onChange={(e) => setBrandKeywords(e.target.value)} />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="ob-li">LinkedIn Profile URL</Label>
                  <Input id="ob-li" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ob-ig">Instagram Handle / URL</Label>
                  <Input id="ob-ig" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ob-tw">X / Twitter Handle / URL</Label>
                  <Input id="ob-tw" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
                </div>

                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 text-xs leading-relaxed space-y-1">
                  <p className="font-semibold text-accent flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Company Setup Summary:
                  </p>
                  <p><strong>Name:</strong> {companyName}</p>
                  <p><strong>Website:</strong> {website}</p>
                  <p><strong>Industry:</strong> {industry}</p>
                  <p><strong>HQ:</strong> {headquarters}</p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-4">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={() => setStep((s) => (s - 1) as any)}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button type="button" onClick={() => setStep((s) => (s + 1) as any)}>
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Complete Onboarding & Go to Dashboard
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
