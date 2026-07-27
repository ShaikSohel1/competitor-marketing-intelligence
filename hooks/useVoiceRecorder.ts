import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingStatus = 'idle' | 'listening' | 'processing' | 'completed' | 'error';

interface UseVoiceRecorderOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export function useVoiceRecorder(options?: UseVoiceRecorderOptions) {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [audioLevels, setAudioLevels] = useState<number[]>([10, 15, 8, 20, 12, 18, 9]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const cleanupAudioContext = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    setTranscript('');
    setStatus('listening');
    startTimer();

    try {
      // 1. Setup MediaRecorder for audio level visualization & audio blob capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);

      // 2. Setup AnalyserNode for live waveform frequency levels
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevels = () => {
          if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            const sliced = Array.from(dataArray.slice(0, 8)).map((v) => Math.max(8, Math.round((v / 255) * 45)));
            setAudioLevels(sliced);
          }
          animFrameRef.current = requestAnimationFrame(updateLevels);
        };
        updateLevels();
      } catch (err) {
        console.warn('AnalyserNode waveform setup fallback:', err);
      }

      // 3. Setup Web Speech API for real-time client transcript
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setTranscript(currentTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err) {
      stopTimer();
      cleanupAudioContext();
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Microphone permission denied or unavailable.';
      setErrorMessage(msg);
      options?.onError?.(msg);
    }
  }, [options]);

  const stopRecording = useCallback(async () => {
    stopTimer();
    cleanupAudioContext();
    setStatus('processing');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // Stop all microphone tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    // Process audio blob and send to STT route
    setTimeout(async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      let finalTranscript = transcript.trim();

      if (audioBlob.size > 0) {
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'speech.webm');

          const res = await fetch('/api/speech-to-text', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.transcript) {
              finalTranscript = data.transcript;
            }
          }
        } catch (err) {
          console.warn('Server STT fallback to client transcript:', err);
        }
      }

      setStatus('completed');
      if (finalTranscript) {
        options?.onTranscript?.(finalTranscript);
      }
    }, 500);
  }, [transcript, options]);

  const cancelRecording = useCallback(() => {
    stopTimer();
    cleanupAudioContext();

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    setStatus('idle');
    setTranscript('');
    setRecordingTime(0);
  }, []);

  useEffect(() => {
    return () => {
      stopTimer();
      cleanupAudioContext();
    };
  }, []);

  return {
    status,
    isRecording: status === 'listening',
    isProcessing: status === 'processing',
    recordingTime,
    transcript,
    audioLevels,
    errorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
