export interface VoiceConfig {
  id: string;
  name: string;
  voiceId: string;
  description: string;
  gender: 'female' | 'male';
}

export const VOICES: VoiceConfig[] = [
  {
    id: 'rachel',
    name: 'Rachel',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    description: 'Professional Female',
    gender: 'female',
  },
  {
    id: 'antoni',
    name: 'Antoni',
    voiceId: 'ErXwobaYiN019PkySvjV',
    description: 'Professional Male',
    gender: 'male',
  },
  {
    id: 'bella',
    name: 'Bella',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    description: 'Narrator',
    gender: 'female',
  },
  {
    id: 'elli',
    name: 'Elli',
    voiceId: 'MF3mGyEYCl7XYWbV9V6O',
    description: 'Calm',
    gender: 'female',
  },
  {
    id: 'josh',
    name: 'Josh',
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    description: 'Fast',
    gender: 'male',
  },
];

export const ELEVENLABS_VOICE_PRESETS = VOICES.map(v => ({
  id: v.id,
  name: `${v.name} (${v.description})`,
  voice_id: v.voiceId,
  category: v.description,
  description: `${v.description} voice`,
}));

const STORAGE_KEY = 'radar_selected_voice_id';

export function getSavedVoiceId(): string {
  if (typeof window === 'undefined') return VOICES[0].voiceId;
  const saved = localStorage.getItem(STORAGE_KEY);
  const exists = VOICES.some(v => v.voiceId === saved);
  return exists && saved ? saved : VOICES[0].voiceId;
}

export function saveSelectedVoiceId(voiceId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, voiceId);
  }
}

export function getVoiceByVoiceId(voiceId: string): VoiceConfig {
  return VOICES.find(v => v.voiceId === voiceId) || VOICES[0];
}
