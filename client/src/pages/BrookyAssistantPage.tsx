import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useBrooky } from '../context/BrookyContext';
import { useDashboard } from '../context/DashboardContext';
import { BrookyAvatar } from '../components/brooky/BrookyAvatar';
import { BrookyInlineChart } from '../components/brooky/BrookyInlineChart';
import { formatAverage } from '../utils/formatters';

const EXAMPLE_COMMANDS = [
  'Hey Brooky',
  'How many runs did Harry Brook score?',
  'Show his last five matches.',
  'Which venue has his highest average?',
  'Compare his Test and ODI performance.',
  'Show his performance against Australia.',
  'Which season was his best?',
  'Explain the current dashboard.',
  'Filter the dashboard to ODI.',
];

function renderMarkdownLite(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => (
    <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
      {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={j} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={j}>{part}</span>
        ),
      )}
    </p>
  ));
}

export const BrookyAssistantPage: React.FC = () => {
  const { analytics, aiMode, theme, ttsEnabled, toggleTts, activeFilterCount } = useDashboard();
  const {
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
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
      {/* Left Studio Avatar Stage */}
      <div className="lg:col-span-4 space-y-4">
        <div className="rounded-2xl bg-[#102B50] text-white p-6 relative overflow-hidden border border-[#173F70] shadow-md flex flex-col items-center text-center">
          <span className="absolute top-0 left-0 right-0 h-1 bg-[#D7193F]" />
          <svg
            className="absolute inset-0 w-full h-full opacity-18 pointer-events-none"
            viewBox="0 0 360 360"
            fill="none"
          >
            <circle cx="180" cy="140" r="110" stroke="#D7193F" strokeWidth="1.2" />
            <circle cx="180" cy="140" r="155" stroke="#FFFFFF" strokeWidth="0.7" />
          </svg>

          <div className="relative z-10 flex items-center justify-between w-full mb-4">
            <span className="text-[10.5px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#D7193F] text-white">
              {aiMode === 'gemini' ? 'Gemini 3.8 Flash' : 'England Analyst AI'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTts}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title={ttsEnabled ? 'Mute Brooky Voice' : 'Enable Brooky Voice'}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={clearConversation}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Clear conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative z-10 my-2">
            <BrookyAvatar state={avatarState} size="xl" showBadge />
          </div>

          <h2 className="relative z-10 mt-5 text-xl font-extrabold tracking-tight">
            BROOKY <span className="text-[#D7193F]">AI</span>
          </h2>
          <p className="relative z-10 text-xs text-blue-100/80 mt-1 max-w-xs">
            Interactive Harry Brook cricket intelligence analyst with voice interaction and live filter awareness.
          </p>

          {/* Speaking / Listening Animated Waveform Stage */}
          <div className="relative z-10 mt-5 w-full rounded-xl bg-[#0B1424]/60 border border-white/15 p-3">
            {isListening ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D7193F] animate-ping shrink-0" />
                <div className="flex items-center gap-1 shrink-0">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <motion.span
                      key={n}
                      animate={{ height: ['5px', '18px', '5px'] }}
                      transition={{ duration: 0.42, repeat: Infinity, delay: n * 0.08 }}
                      className="w-1 rounded-full bg-[#D7193F]"
                    />
                  ))}
                </div>
                <p className="text-xs text-white font-semibold truncate">
                  {interimTranscript || 'Recording… Speak your question'}
                </p>
              </div>
            ) : isSpeaking ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <motion.span
                      key={n}
                      animate={{ height: ['6px', '18px', '6px'] }}
                      transition={{ duration: 0.45, repeat: Infinity, delay: n * 0.08 }}
                      className={`w-1 rounded-full ${n % 2 === 0 ? 'bg-white' : 'bg-[#D7193F]'}`}
                    />
                  ))}
                  <span className="text-xs ml-2">Brooky is speaking…</span>
                </div>
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#D7193F] hover:bg-[#b81435] text-white cursor-pointer"
                >
                  Stop
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div>
                  <p className="opacity-65">Innings</p>
                  <p className="font-mono-num font-bold text-sm">{analytics.kpis.totalMatches}</p>
                </div>
                <div>
                  <p className="opacity-65">Runs</p>
                  <p className="font-mono-num font-bold text-sm text-[#D7193F] bg-white px-1.5 rounded">
                    {analytics.kpis.totalRuns.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="opacity-65">Average</p>
                  <p className="font-mono-num font-bold text-sm">
                    {formatAverage(analytics.kpis.battingAverage)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={[
              'relative z-10 mt-4 w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer',
              isListening
                ? 'bg-[#D7193F] text-white shadow-lg ring-2 ring-white/50 animate-pulse'
                : 'bg-white text-[#102B50] hover:bg-blue-50',
            ].join(' ')}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#D7193F]" />}
            <span>{isListening ? 'Stop Recording' : 'Ask Brooky by Voice'}</span>
          </button>
        </div>

        {/* Example Commands */}
        <div
          className={`rounded-2xl p-4 border ${
            isDark ? 'bg-[#111F38] border-[#1E3557]' : 'bg-white border-[#E1E7F0]'
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D7193F]" />
            Try Voice or Chat Commands
          </p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => sendMessage(cmd)}
                className={`text-[11px] font-medium px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#0B1424] border-[#1E3557] hover:border-[#D7193F] text-blue-100'
                    : 'bg-[#F3F5F9] border-[#E1E7F0] hover:bg-[#102B50] hover:text-white'
                }`}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Navy Blue Assistant Chat Stream + White Chat Bubbles */}
      <div className="lg:col-span-8 rounded-2xl border border-[#173F70] bg-[#102B50] flex flex-col h-[640px] overflow-hidden shadow-md">
        <div className="px-5 py-3.5 border-b border-white/12 flex items-center justify-between text-xs text-white">
          <span className="font-bold">Live Cricket Intelligence Session</span>
          <span className="font-mono-num text-blue-200">
            {activeFilterCount > 0 ? `${activeFilterCount} active filter(s) synced` : 'Full 85-innings scope'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-[#102B50] to-[#0B1D36]">
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
                    'max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm',
                    isUser
                      ? 'bg-[#D7193F] text-white rounded-br-sm'
                      : 'bg-white text-[#102B50] border border-white/20 rounded-bl-sm',
                  ].join(' ')}
                >
                  {renderMarkdownLite(msg.text)}

                  {msg.action?.label && (
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D7193F] text-white text-[11px] font-bold">
                      <Sparkles className="w-3 h-3" />
                      {msg.action.label}
                    </div>
                  )}

                  {msg.highlights && msg.highlights.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.highlights.map((h) => (
                        <span
                          key={h}
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#102B50]/10 text-[#102B50]"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}

                  {msg.suggestedChart && <BrookyInlineChart spec={msg.suggestedChart} isDark={false} />}

                  {!isUser && (
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#4B607F]">
                      <span>{msg.timestamp}</span>
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        className="inline-flex items-center gap-1 text-[#102B50] hover:text-[#D7193F] font-semibold cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Speak Reply
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-blue-100">
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-blue-200 animate-bounce [animation-delay:0.15s]" />
              <span className="w-2 h-2 rounded-full bg-[#D7193F] animate-bounce [animation-delay:0.3s]" />
              <span>Brooky is computing from the dataset…</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {micError && (
          <div className="px-4 py-2 text-xs bg-[#D7193F] text-white border-t border-white/15">
            {micError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-3.5 border-t border-white/12 bg-[#102B50] flex items-center gap-2.5"
        >
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            className={[
              'p-2.5 rounded-xl transition-all cursor-pointer',
              isListening
                ? 'bg-[#D7193F] text-white ring-2 ring-white/60 animate-pulse'
                : 'bg-[#173F70] text-white hover:bg-[#D7193F]',
            ].join(' ')}
          >
            {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Brooky about runs, averages, venues, formats, or dashboard filters..."
            className="flex-1 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm outline-none bg-white text-[#102B50] placeholder:text-[#5E7290] border border-transparent focus:border-[#D7193F]"
          />

          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="px-4 py-2.5 rounded-xl bg-[#D7193F] hover:bg-[#b81435] disabled:opacity-45 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
