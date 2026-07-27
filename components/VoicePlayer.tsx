"use client";

import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Loader2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VoiceWaveform } from './VoiceWaveform';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { VOICES, getSavedVoiceId, saveSelectedVoiceId, getVoiceByVoiceId } from '@/lib/voice';
import { cn } from '@/lib/utils';

interface VoicePlayerProps {
  text: string;
  className?: string;
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VoicePlayer({ text, className }: VoicePlayerProps) {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(getSavedVoiceId());
  const {
    isPlaying,
    isPaused,
    isLoading,
    currentTime,
    duration,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
  } = useTextToSpeech();

  // Restore saved voice preference on mount
  useEffect(() => {
    const saved = getSavedVoiceId();
    if (saved && saved !== selectedVoiceId) {
      setSelectedVoiceId(saved);
    }
  }, []);

  const handleVoiceChange = (newVoiceId: string) => {
    setSelectedVoiceId(newVoiceId);
    saveSelectedVoiceId(newVoiceId);
    const vConfig = getVoiceByVoiceId(newVoiceId);
    playAudio(text, newVoiceId, vConfig.name);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      pauseAudio();
    } else if (isPaused) {
      resumeAudio();
    } else {
      const vConfig = getVoiceByVoiceId(selectedVoiceId);
      playAudio(text, selectedVoiceId, vConfig.name);
    }
  };

  const activeVoiceConfig = getVoiceByVoiceId(selectedVoiceId);

  return (
    <div className={cn('flex flex-wrap items-center gap-2 pt-2 border-t text-xs text-muted-foreground', className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleTogglePlay}
        disabled={isLoading}
        className="h-7 px-2.5 text-xs gap-1.5 font-medium hover:text-foreground text-accent"
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Play className="h-3.5 w-3.5 fill-current" />
        )}
        <span>{isLoading ? `Generating ${activeVoiceConfig.name} Voice...` : isPlaying ? 'Pause Voice' : 'Listen to AI'}</span>
      </Button>

      {isPlaying && (
        <div className="flex items-center gap-2 animate-fade-in">
          <VoiceWaveform active={isPlaying} colorClass="bg-accent" className="h-4" />
          <span className="font-mono text-[11px]">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={stopAudio} title="Stop">
            <Square className="h-3 w-3 fill-current" />
          </Button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <Select value={selectedVoiceId} onValueChange={handleVoiceChange}>
          <SelectTrigger className="h-6 text-[11px] px-2 py-0 border-none bg-muted/50 hover:bg-muted font-normal w-auto">
            <Volume2 className="h-3 w-3 mr-1 text-accent" />
            <SelectValue placeholder="Voice" />
          </SelectTrigger>
          <SelectContent align="end">
            {VOICES.map((v) => (
              <SelectItem key={v.voiceId} value={v.voiceId} className="text-xs">
                {v.name} ({v.description})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
