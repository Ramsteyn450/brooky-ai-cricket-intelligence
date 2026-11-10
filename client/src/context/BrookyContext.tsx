import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useDashboard } from './DashboardContext';
import { soundEngine } from '../utils/soundEngine';
import type { BrookyChatResponse, ChatMessage } from '../types/cricket';

export type BrookyAvatarState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface BrookyContextValue {
  isFloatingOpen: boolean;
  isMinimized: boolean;
  openFloating: () => void;
  closeFloating: () => void;
  toggleMinimized: () => void;
  messages: ChatMessage[];
  avatarState: BrookyAvatarState;
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  interimTranscript: string;
  micError: string | null;
  speechSupported: boolean;
  ttsSupported: boolean;
  sendMessage: (text: string, options?: { fromVoice?: boolean }) => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
  clearConversation: () => void;
}

const BrookyContext = createContext<BrookyContextValue | null>(null);

function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/•/g, '')
    .replace(/\n+/g, '. ')
    .trim();
}

function cleanVoicePrompt(raw: string): string {
  const trimmed = raw.trim();
  // Keep "Hey Brooky" intact if it's purely a greeting, otherwise strip wake prefix for cleaner parsing
  if (/^hey\s+brooky[,.!\s]*$/i.test(trimmed)) return 'Hey Brooky';
  return trimmed.replace(/^hey\s+brooky[,.!\s]+/i, '').trim() || trimmed;
}

const INITIAL_WELCOME: ChatMessage = {
  id: 'brooky-welcome',
  role: 'assistant',
  text: "Hey! I'm **Brooky**, your Cricket Intelligence Analyst. Ask me anything about Harry Brook's batting numbers, compare formats, inspect venues, or say **\"Filter the dashboard to ODI\"**.",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  followUpSuggestions: [
    'How many runs did Harry Brook score?',
    'Show his last five matches',
    'Which venue has his highest average?',
    'Compare his Test and ODI performance',
  ],
};

export const BrookyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { filters, activePage, applyFilters, clearFilters, setActivePage, ttsEnabled } = useDashboard();
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const speechSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition,
    );

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const avatarState: BrookyAvatarState = isListening
    ? 'listening'
    : isThinking
      ? 'thinking'
      : isSpeaking
        ? 'speaking'
        : 'idle';

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (!ttsSupported) return;
      const clean = stripMarkdownForSpeech(text);
      if (!clean) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang === 'en-GB' && /male|daniel|ryan|george/i.test(v.name)) ||
        voices.find((v) => v.lang === 'en-GB') ||
        voices.find((v) => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
      utterance.rate = 1.03;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [ttsSupported],
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
      }
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const sendMessage = useCallback(
    async (rawText: string, options?: { fromVoice?: boolean }) => {
      const text = rawText.trim();
      if (!text || isThinking) return;

      soundEngine.markUserInteracted();
      soundEngine.play('click');
      setMicError(null);
      stopSpeaking();

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsThinking(true);

      try {
        const res = await fetch('/api/brooky/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
            activeFilters: filters,
            currentPage: activePage,
          }),
        });

        if (!res.ok) {
          throw new Error(`Brooky API returned ${res.status}`);
        }

        const data = (await res.json()) as BrookyChatResponse;

        if (data.action) {
          if (data.action.type === 'clear_filters') {
            clearFilters();
          } else if (data.action.type === 'apply_filters' && data.action.filters) {
            applyFilters(data.action.filters, true);
          }
          if (data.action.page) {
            setActivePage(data.action.page);
          }
        }

        const assistantMsg: ChatMessage = {
          id: `brooky-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mode: data.mode,
          action: data.action,
          suggestedChart: data.suggestedChart,
          highlights: data.highlights,
          followUpSuggestions: data.followUpSuggestions,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        soundEngine.play('assistantNotify');

        if ((ttsEnabled || options?.fromVoice) && ttsSupported) {
          speakText(data.reply);
        }
      } catch (err) {
        const fallbackMsg: ChatMessage = {
          id: `brooky-err-${Date.now()}`,
          role: 'assistant',
          text: `I ran into a connection hiccup (${err instanceof Error ? err.message : 'network error'}). Please make sure the BROOKY AI backend server is running.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      } finally {
        setIsThinking(false);
      }
    },
    [
      activePage,
      applyFilters,
      clearFilters,
      filters,
      isThinking,
      messages,
      setActivePage,
      speakText,
      stopSpeaking,
      ttsEnabled,
      ttsSupported,
    ],
  );

  const stopListening = useCallback(() => {
    soundEngine.markUserInteracted();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
    soundEngine.play('micStop');
  }, []);

  const startListening = useCallback(() => {
    soundEngine.markUserInteracted();
    setMicError(null);

    if (!speechSupported) {
      setMicError('Voice recognition is not supported in this browser. Try Chrome or Edge, or type your question below.');
      return;
    }

    stopSpeaking();

    const SpeechRecognitionCtor = (
      window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      }
    ).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = 'en-GB';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        soundEngine.play('micStart');
      };

      recognition.onresult = (event) => {
        let finalText = '';
        let interim = '';
        for (let i = 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? '';
          if (result.isFinal) {
            finalText += transcript;
          } else {
            interim += transcript;
          }
        }
        setInterimTranscript(interim || finalText);
        if (finalText.trim()) {
          const cleaned = cleanVoicePrompt(finalText);
          setIsListening(false);
          setInterimTranscript('');
          sendMessage(cleaned, { fromVoice: true });
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicError('Microphone permission was denied. Allow mic access in your browser settings to speak to Brooky.');
        } else if (event.error === 'no-speech') {
          setMicError('No speech detected. Tap the microphone and try asking a question.');
        } else {
          setMicError(`Voice input paused (${event.error}). You can type your question anytime.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setMicError(err instanceof Error ? err.message : 'Could not start voice input.');
    }
  }, [sendMessage, speechSupported, stopSpeaking]);

  const openFloating = useCallback(() => {
    soundEngine.markUserInteracted();
    soundEngine.play('assistantOpen');
    setIsFloatingOpen(true);
    setIsMinimized(false);
  }, []);

  const closeFloating = useCallback(() => {
    soundEngine.markUserInteracted();
    soundEngine.play('click');
    setIsFloatingOpen(false);
    setIsMinimized(false);
  }, []);

  const toggleMinimized = useCallback(() => {
    soundEngine.markUserInteracted();
    soundEngine.play('click');
    setIsMinimized((prev) => !prev);
  }, []);

  const clearConversation = useCallback(() => {
    soundEngine.markUserInteracted();
    soundEngine.play('click');
    stopSpeaking();
    setMessages([INITIAL_WELCOME]);
  }, [stopSpeaking]);

  return (
    <BrookyContext.Provider
      value={{
        isFloatingOpen,
        isMinimized,
        openFloating,
        closeFloating,
        toggleMinimized,
        messages,
        avatarState,
        isListening,
        isThinking,
        isSpeaking,
        interimTranscript,
        micError,
        speechSupported,
        ttsSupported,
        sendMessage,
        startListening,
        stopListening,
        speakText,
        stopSpeaking,
        clearConversation,
      }}
    >
      {children}
    </BrookyContext.Provider>
  );
};

export function useBrooky(): BrookyContextValue {
  const ctx = useContext(BrookyContext);
  if (!ctx) throw new Error('useBrooky must be used within BrookyProvider');
  return ctx;
}
