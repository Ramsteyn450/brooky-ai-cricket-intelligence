import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useBrooky } from '../../context/BrookyContext';
import { useDashboard } from '../../context/DashboardContext';
import { BrookyAvatar } from './BrookyAvatar';
import { BrookyInlineChart } from './BrookyInlineChart';

function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-bold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </p>
    );
  });
}

export const BrookyFloatingWidget: React.FC = () => {
  const {
    activePage,
    setActivePage,
    theme,
    aiMode,
    ttsEnabled,
    toggleTts,
  } = useDashboard();
  const {
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
    sendMessage,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
    clearConversation,
  } = useBrooky();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, isFloatingOpen, isMinimized]);

  if (activePage === 'brooky') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      <AnimatePresence>
        {isFloatingOpen && (
          <motion.div
            key="brooky-floating-panel"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className={[
              'mb-3 w-[calc(100vw-2.5rem)] sm:w-[410px] rounded-2xl border shadow-2xl overflow-hidden flex flex-col bg-[#102B50]',
              isMinimized ? 'h-auto' : 'h-[580px] max-h-[calc(100vh-7.5rem)]',
              isDark ? 'border-[#27518B]' : 'border-[#173F70]',
            ].join(' ')}
          >
            {/* Assistant Stage Header */}
            <div className="bg-[#102B50] text-white px-4 py-3.5 relative overflow-hidden shrink-0 border-b border-white/12">
              <svg
                className="absolute inset-0 w-full h-full opacity-18 pointer-events-none"
                viewBox="0 0 400 140"
                fill="none"
              >
                <circle cx="350" cy="20" r="70" stroke="#D7193F" strokeWidth="1.2" />
                <path d="M0 110 Q 150 65 400 115" stroke="#FFFFFF" strokeWidth="0.9" />
              </svg>

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <BrookyAvatar state={avatarState} size="md" showBadge />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold tracking-tight">BROOKY AI</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D7193F] text-white">
                        {aiMode === 'gemini' ? 'Gemini 3.8' : 'England AI'}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-100/85 mt-0.5">
                      {avatarState === 'listening'
                        ? 'Listening to your voice…'
                        : avatarState === 'thinking'
                          ? 'Analyzing match intelligence…'
                          : avatarState === 'speaking'
                            ? 'Speaking response…'
                            : 'Harry Brook Cricket Analyst'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      closeFloating();
                      setActivePage('brooky');
                    }}
                    title="Open full Brooky AI Studio"
                    aria-label="Expand to full screen"
                    className="p-1.5 rounded-lg hover:bg-white/15 text-blue-100 cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleTts}
                    title={ttsEnabled ? 'Disable voice playback' : 'Enable voice playback'}
                    aria-label="Toggle voice playback"
                    className="p-1.5 rounded-lg hover:bg-white/15 text-blue-100 cursor-pointer"
                  >
                    {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={clearConversation}
                    title="Reset chat"
                    aria-label="Reset conversation"
                    className="p-1.5 rounded-lg hover:bg-white/15 text-blue-100 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleMinimized}
                    title={isMinimized ? 'Expand panel' : 'Minimize panel'}
                    aria-label="Minimize assistant"
                    className="p-1.5 rounded-lg hover:bg-white/15 text-blue-100 cursor-pointer"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={closeFloating}
                    title="Close panel"
                    aria-label="Close assistant"
                    className="p-1.5 rounded-lg hover:bg-white/15 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Animated Voice Waveform / Listening Live Transcript */}
              {!isMinimized && (isListening || isSpeaking || isThinking) && (
                <div className="relative z-10 mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between gap-2 text-[11px]">
                  {isListening && (
                    <div className="flex items-center gap-2 w-full">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D7193F] animate-ping shrink-0" />
                      <div className="flex items-center gap-1 shrink-0">
                        {[1, 2, 3, 4].map((bar) => (
                          <motion.span
                            key={bar}
                            animate={{ height: ['5px', '15px', '5px'] }}
                            transition={{ duration: 0.42, repeat: Infinity, delay: bar * 0.09 }}
                            className="w-1 rounded-full bg-[#D7193F]"
                          />
                        ))}
                      </div>
                      <span className="text-white font-medium truncate">
                        {interimTranscript ? `"${interimTranscript}"` : 'Recording — speak now…'}
                      </span>
                    </div>
                  )}
                  {isThinking && (
                    <span className="text-blue-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D7193F] animate-spin" />
                      Querying 85-innings dataset…
                    </span>
                  )}
                  {isSpeaking && !isListening && !isThinking && (
                    <div className="w-full flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5, 6].map((bar) => (
                          <motion.span
                            key={bar}
                            animate={{ height: ['5px', '16px', '5px'] }}
                            transition={{
                              duration: 0.45,
                              repeat: Infinity,
                              delay: bar * 0.07,
                            }}
                            className={`w-1 rounded-full ${bar % 2 === 0 ? 'bg-white' : 'bg-[#D7193F]'}`}
                          />
                        ))}
                        <span className="ml-2 text-blue-100">Speaking…</span>
                      </div>
                      <button
                        type="button"
                        onClick={stopSpeaking}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#D7193F] hover:bg-[#b81435] text-white cursor-pointer"
                      >
                        Stop Voice
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isMinimized && (
              <>
                {/* Navy Blue Assistant Background + Crisp White Chat Bubbles */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#102B50] to-[#0B1D36]"
                >
                  {messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={[
                            'max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm',
                            isUser
                              ? 'bg-[#D7193F] text-white rounded-br-sm'
                              : 'bg-white text-[#102B50] border border-white/20 rounded-bl-sm',
                          ].join(' ')}
                        >
                          {renderFormattedText(msg.text)}

                          {msg.action?.label && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D7193F] text-white text-[10px] font-bold">
                              <Sparkles className="w-3 h-3" />
                              {msg.action.label}
                            </div>
                          )}

                          {msg.highlights && msg.highlights.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {msg.highlights.map((h) => (
                                <span
                                  key={h}
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#102B50]/10 text-[#102B50]"
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}

                          {msg.suggestedChart && (
                            <BrookyInlineChart spec={msg.suggestedChart} isDark={false} />
                          )}

                          {!isUser && (
                            <div className="mt-2 flex items-center justify-between text-[10px] text-[#4B607F]">
                              <span>{msg.timestamp}</span>
                              <button
                                type="button"
                                onClick={() => speakText(msg.text)}
                                className="inline-flex items-center gap-1 text-[#102B50] hover:text-[#D7193F] font-semibold cursor-pointer"
                              >
                                <Volume2 className="w-3 h-3" /> Listen
                              </button>
                            </div>
                          )}
                        </div>

                        {!isUser && msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 max-w-[92%]">
                            {msg.followUpSuggestions.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => sendMessage(s)}
                                className="text-[10.5px] font-medium px-2.5 py-1 rounded-full border border-white/20 bg-[#173F70] text-white hover:bg-[#D7193F] hover:border-[#D7193F] transition-colors cursor-pointer"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {isThinking && (
                    <div className="flex items-center gap-2 text-xs text-blue-100 px-1">
                      <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-blue-200 animate-bounce [animation-delay:0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-[#D7193F] animate-bounce [animation-delay:0.3s]" />
                      <span className="ml-1">Brooky is analyzing…</span>
                    </div>
                  )}
                </div>

                {/* Error Notice */}
                {micError && (
                  <div className="px-4 py-2 text-[11px] bg-[#D7193F] text-white border-t border-white/15">
                    {micError}
                  </div>
                )}

                {/* Input Bar */}
                <form
                  onSubmit={handleSubmit}
                  className="p-3 border-t border-white/12 bg-[#102B50] flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    aria-label={isListening ? 'Stop voice recognition' : 'Start voice recognition'}
                    title={isListening ? 'Stop listening' : 'Ask Brooky with your voice'}
                    className={[
                      'p-2.5 rounded-xl transition-all shrink-0 cursor-pointer',
                      isListening
                        ? 'bg-[#D7193F] text-white shadow-lg ring-2 ring-white/60 animate-pulse'
                        : 'bg-[#173F70] text-white hover:bg-[#D7193F]',
                    ].join(' ')}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Brooky or say 'Filter to ODI'..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs outline-none bg-white text-[#102B50] placeholder:text-[#5E7290] border border-transparent focus:border-[#D7193F]"
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    aria-label="Send message to Brooky"
                    className="p-2.5 rounded-xl bg-[#D7193F] hover:bg-[#b81435] disabled:opacity-45 text-white transition-colors shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom-Right Floating Circular Assistant Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => (isFloatingOpen ? closeFloating() : openFloating())}
        aria-label="Open Brooky AI Cricket Assistant"
        className="group relative flex items-center gap-2.5 rounded-full p-1 bg-white dark:bg-[#102B50] shadow-xl border-2 border-[#102B50] dark:border-[#D7193F] cursor-pointer"
      >
        <BrookyAvatar state={avatarState} size="sm" />
        {!isFloatingOpen && (
          <span className="hidden sm:inline-flex flex-col items-start pr-3 text-left">
            <span className="text-xs font-extrabold text-[#102B50] dark:text-white leading-none flex items-center gap-1.5">
              <span>Ask Brooky</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D7193F]" />
            </span>
            <span className="text-[10px] text-[#4B607F] dark:text-blue-200 mt-0.5">
              Voice & AI Analyst
            </span>
          </span>
        )}
      </motion.button>
    </div>
  );
};
