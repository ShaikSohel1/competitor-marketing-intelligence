import { useState, useRef, useCallback, useEffect } from 'react';
import { getSavedVoiceId, getVoiceByVoiceId } from '@/lib/voice';

export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentText, setCurrentText] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
    setCurrentTime(0);
  }, []);

  const speakWebSpeech = useCallback((text: string, targetVoiceId?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const vConfig = getVoiceByVoiceId(targetVoiceId || getSavedVoiceId());
    const clean = text.replace(/[\#\*\_\`]/g, '').slice(0, 600);
    const utterance = new SpeechSynthesisUtterance(clean);
    utteranceRef.current = utterance;

    // Pick distinct system voices & pitch/rate based on selected voice preset
    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      let matchedVoice = null;
      if (vConfig.gender === 'female') {
        matchedVoice = availableVoices.find(v =>
          /samantha|victoria|karen|fiona|zira|female|google us english/i.test(v.name)
        );
      } else {
        matchedVoice = availableVoices.find(v =>
          /alex|fred|daniel|george|male|google uk english male/i.test(v.name)
        );
      }
      if (matchedVoice) utterance.voice = matchedVoice;
    }

    if (vConfig.id === 'fast' || vConfig.id === 'josh') {
      utterance.rate = 1.25;
      utterance.pitch = 1.1;
    } else if (vConfig.id === 'calm' || vConfig.id === 'elli') {
      utterance.rate = 0.9;
      utterance.pitch = 0.95;
    } else if (vConfig.id === 'narrator' || vConfig.id === 'bella') {
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
    } else if (vConfig.id === 'antoni') {
      utterance.rate = 1.0;
      utterance.pitch = 0.85;
    }

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const playAudio = useCallback(async (text: string, customVoiceId?: string, customVoiceName?: string) => {
    stopAudio();
    if (!text || !text.trim()) return;

    const targetVoiceId = customVoiceId || getSavedVoiceId();
    const voiceConfig = getVoiceByVoiceId(targetVoiceId);
    const voiceName = customVoiceName || voiceConfig.name;

    setCurrentText(text);
    setIsLoading(true);

    const cleanSnippet = text.slice(0, 35).replace(/[\n\r]/g, ' ');
    console.log(`[Voice AI Frontend] Selected Voice: ${voiceName} | Voice ID: ${targetVoiceId} | Text: "${cleanSnippet}..."`);

    try {
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: targetVoiceId,
          voiceName: voiceName,
          timestamp: Date.now(), // Cache buster
        }),
      });

      const contentType = res.headers.get('content-type');

      if (res.ok && contentType && contentType.includes('audio/mpeg')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onloadedmetadata = () => {
          setDuration(audio.duration || 0);
          setIsLoading(false);
          audio.play().then(() => setIsPlaying(true)).catch(() => speakWebSpeech(text, targetVoiceId));
        };

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime || 0);
        };

        audio.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentTime(0);
        };

        audio.onerror = () => {
          speakWebSpeech(text, targetVoiceId);
        };
      } else {
        // Fallback to Web Speech API with voice-specific characteristics
        speakWebSpeech(text, targetVoiceId);
      }
    } catch (err) {
      console.warn('[Voice AI Frontend] ElevenLabs TTS error, using Web Speech fallback:', err);
      speakWebSpeech(text, targetVoiceId);
    }
  }, [stopAudio, speakWebSpeech]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
    } else if (typeof window !== 'undefined' && window.speechSynthesis && isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, [isPlaying]);

  const resumeAudio = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsPaused(false);
      });
    } else if (typeof window !== 'undefined' && window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [isPaused]);

  const seekAudio = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    isPlaying,
    isPaused,
    isLoading,
    currentTime,
    duration,
    currentText,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    seekAudio,
  };
}
