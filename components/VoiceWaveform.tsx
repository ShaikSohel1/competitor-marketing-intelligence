"use client";

import { cn } from '@/lib/utils';

interface VoiceWaveformProps {
  levels?: number[];
  active?: boolean;
  colorClass?: string;
  className?: string;
}

export function VoiceWaveform({
  levels = [12, 24, 16, 32, 20, 28, 14, 22],
  active = true,
  colorClass = 'bg-accent',
  className,
}: VoiceWaveformProps) {
  return (
    <div className={cn('flex items-center gap-1 h-6 px-1', className)}>
      {levels.map((height, i) => (
        <span
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-150',
            colorClass,
            active ? 'animate-pulse' : 'opacity-40'
          )}
          style={{
            height: active ? `${Math.max(6, Math.min(36, height))}px` : '6px',
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}
