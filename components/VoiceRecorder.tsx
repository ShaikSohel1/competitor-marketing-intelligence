"use client";

import { Mic, MicOff, Square, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceWaveform } from './VoiceWaveform';
import { useVoiceRecorder, RecordingStatus } from '@/hooks/useVoiceRecorder';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscriptReady: (transcript: string) => void;
  className?: string;
  variant?: 'inline' | 'floating' | 'header';
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function VoiceRecorder({ onTranscriptReady, className, variant = 'inline' }: VoiceRecorderProps) {
  const {
    status,
    isRecording,
    isProcessing,
    recordingTime,
    transcript,
    audioLevels,
    errorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder({
    onTranscript: (res) => {
      if (res && res.trim()) {
        onTranscriptReady(res.trim());
      }
    },
  });

  if (variant === 'floating') {
    return (
      <div className={cn('fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2', className)}>
        {isRecording && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border shadow-2xl backdrop-blur animate-fade-in">
            <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-white" /> REC {formatTimer(recordingTime)}
            </Badge>
            <VoiceWaveform levels={audioLevels} active={true} />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={cancelRecording}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="default" className="h-7 px-3 text-xs bg-destructive text-white" onClick={stopRecording}>
              <Square className="h-3 w-3 mr-1 fill-current" /> Done
            </Button>
          </div>
        )}

        <Button
          size="lg"
          onClick={isRecording ? stopRecording : startRecording}
          className={cn(
            'h-14 w-14 rounded-full shadow-2xl transition-all duration-300 relative',
            isRecording
              ? 'bg-destructive text-white ring-4 ring-destructive/30 animate-pulse scale-110'
              : 'bg-accent text-accent-foreground hover:scale-105'
          )}
          title={isRecording ? 'Click to stop recording' : 'Click to speak to Voice AI'}
        >
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isRecording ? (
            <Square className="h-6 w-6 fill-current" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isRecording ? (
        <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-destructive/10 border border-destructive/20 animate-fade-in">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
          </span>
          <span className="text-xs font-mono font-bold text-destructive">{formatTimer(recordingTime)}</span>

          <VoiceWaveform levels={audioLevels} active={true} className="h-4" />

          <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={cancelRecording} title="Cancel">
            <X className="h-3.5 w-3.5" />
          </Button>

          <Button type="button" size="sm" variant="destructive" className="h-6 px-2 text-[11px]" onClick={stopRecording}>
            <Square className="h-2.5 w-2.5 mr-1 fill-current" /> Stop
          </Button>
        </div>
      ) : isProcessing ? (
        <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-3 bg-accent/10 border-accent/30 text-accent">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transcribing speech...
        </Badge>
      ) : (
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={startRecording}
          className={cn(
            'h-9 w-9 rounded-lg transition-all hover:bg-accent/15 hover:text-accent hover:border-accent/40',
            errorMessage ? 'border-destructive text-destructive' : ''
          )}
          title="Click to speak your question"
        >
          <Mic className="h-4 w-4" />
        </Button>
      )}

      {errorMessage && (
        <span className="text-[11px] text-destructive truncate max-w-[200px]">{errorMessage}</span>
      )}
    </div>
  );
}
