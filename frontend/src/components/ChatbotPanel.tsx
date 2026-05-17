import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, ExternalLink, Send, X } from 'lucide-react';
import { API_URL } from '@/config';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
  link?: { label: string; path: string };
}

interface ChatbotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNewAssistantMessage?: () => void;
}

function nowTime(): string {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function ChatbotPanel({ isOpen, onClose, onNewAssistantMessage }: ChatbotPanelProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_ACTIONS = [
    t('chatbot.quick_apply'),
    t('chatbot.quick_docs'),
    t('chatbot.quick_compare'),
    t('chatbot.quick_track'),
    t('chatbot.quick_life'),
    t('chatbot.quick_fees'),
  ];

  const PLACEHOLDERS = [
    t('chatbot.placeholder_1'),
    t('chatbot.placeholder_2'),
    t('chatbot.placeholder_3'),
    t('chatbot.placeholder_4'),
  ];

  const buildWelcome = (): ChatMessage => ({
    id: 'welcome',
    role: 'assistant',
    text: t('chatbot.welcome'),
    timestamp: nowTime(),
    suggestions: [
      t('chatbot.welcome_s1'),
      t('chatbot.welcome_s2'),
      t('chatbot.welcome_s3'),
      t('chatbot.welcome_s4'),
    ],
  });

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && !hasWelcomed) {
      setMessages([buildWelcome()]);
      setHasWelcomed(true);
    }
  }, [isOpen, hasWelcomed]);

  // Reset welcome when language changes so next open shows correct language
  useEffect(() => {
    setHasWelcomed(false);
    setMessages([]);
  }, [i18n.language]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Rotating placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const addAssistantMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const full: ChatMessage = { ...msg, id: `a-${Date.now()}`, timestamp: nowTime() };
    setMessages(prev => [...prev, full]);
    onNewAssistantMessage?.();
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: nowTime(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const lang = i18n.language === 'en' ? 'en' : 'fr';
      const res = await fetch(`${API_URL}/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, lang }),
      });

      if (!res.ok) throw new Error('Erreur réseau');

      const json = await res.json();
      const response = json?.data?.response;

      addAssistantMessage({
        role: 'assistant',
        text: response?.text ?? t('chatbot.error'),
        suggestions: response?.suggestions,
        link: response?.link,
      });
    } catch {
      addAssistantMessage({
        role: 'assistant',
        text: t('chatbot.error'),
        suggestions: [t('chatbot.error_suggestion')],
        link: { label: t('chatbot.error_link'), path: '/guide' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-4 right-4 sm:right-6 z-50 flex flex-col
                 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)]
                 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700
                 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-t-2xl shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-400/40">
          <Bot size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm leading-tight truncate">{t('chatbot.title')}</p>
          <p className="text-white/70 text-xs leading-tight">{t('chatbot.online')}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer le chatbot"
          className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl rounded-tl-sm'
                }`}
            >
              {msg.text}
            </div>

            {/* Timestamp */}
            <p className={`text-[10px] text-zinc-400 mt-0.5 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              {msg.timestamp}
            </p>

            {/* Suggestions chips */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-w-[85%]">
                {msg.suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700
                               text-blue-700 dark:text-blue-300 text-xs rounded-full px-3 py-1
                               hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Link button */}
            {msg.link && (
              <button
                onClick={() => { window.location.href = msg.link!.path; onClose(); }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white
                           text-xs rounded-lg px-3 py-1.5 transition-colors"
              >
                {msg.link.label}
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions — visibles seulement avec le message de bienvenue */}
      {messages.length <= 1 && (
        <div className="shrink-0 flex flex-wrap gap-2 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1
                         text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
                         hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-3 border-t border-zinc-100 dark:border-zinc-800">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          disabled={isLoading}
          className="flex-1 rounded-full border border-zinc-200 dark:border-zinc-700
                     bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                     placeholder:text-zinc-400 text-sm px-4 py-2
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 transition-all"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          aria-label="Envoyer le message"
          className="shrink-0 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700
                     flex items-center justify-center transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}
