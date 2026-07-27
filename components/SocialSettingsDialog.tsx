"use client";

import { useState } from 'react';
import { Share2, Globe, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { saveCompanyProfile } from '@/lib/api';
import type { CompanyProfile } from '@/types';

interface SocialSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ourCompany: CompanyProfile;
  onSaved?: () => void;
}

export function SocialSettingsDialog({
  open,
  onOpenChange,
  ourCompany,
  onSaved,
}: SocialSettingsDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const initialLinks = ourCompany.social_links || {};
  const [instagram, setInstagram] = useState(initialLinks.instagram || 'https://instagram.com/titaneyeplus');
  const [linkedin, setLinkedin] = useState(initialLinks.linkedin || 'https://linkedin.com/company/titan-eye-plus');
  const [facebook, setFacebook] = useState(initialLinks.facebook || 'https://facebook.com/titaneyeplus');
  const [twitter, setTwitter] = useState(initialLinks.twitter || 'https://x.com/titaneyeplus');
  const [youtube, setYoutube] = useState(initialLinks.youtube || 'https://youtube.com/@titaneyeplus');
  const [threads, setThreads] = useState(initialLinks.threads || 'https://threads.net/@titaneyeplus');

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedLinks = {
        instagram: instagram.trim(),
        linkedin: linkedin.trim(),
        facebook: facebook.trim(),
        twitter: twitter.trim(),
        youtube: youtube.trim(),
        threads: threads.trim(),
      };

      await saveCompanyProfile({
        ...ourCompany,
        social_links: updatedLinks,
      });

      toast({
        title: 'Social Handles Saved',
        description: 'Updated brand social media profiles for intelligence tracking.',
      });

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Could not save social URLs.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-accent" />
            Configure Brand Social Profiles
          </DialogTitle>
          <DialogDescription>
            Set official social media profile URLs for {ourCompany.company_name} to monitor engagement, reach, and comparative sentiment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="space-y-1">
            <Label className="text-xs">Instagram Profile URL</Label>
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/yourhandle" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">LinkedIn Company Page</Label>
            <Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/yourcompany" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Facebook Page URL</Label>
            <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/yourpage" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">X (Twitter) Profile URL</Label>
            <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/yourhandle" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">YouTube Channel URL</Label>
            <Input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/@yourchannel" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Threads Profile URL</Label>
            <Input value={threads} onChange={(e) => setThreads(e.target.value)} placeholder="https://threads.net/@yourhandle" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
