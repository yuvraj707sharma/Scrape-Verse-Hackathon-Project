import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Send, Paperclip, Sparkles, ExternalLink, Copy, ThumbsUp, ThumbsDown, Check, Loader2 } from 'lucide-react';

export interface Citation {
  title: string;
  url: string;
  domain?: string;
  heading?: string;
}

export interface AnswerParagraph {
  text: string;
  citation?: Citation;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  paragraphs?: AnswerParagraph[];
  timestamp: string;
}

interface ChatPanelProps {
  initialPrompt?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ initialPrompt }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'user',
      text: 'What changed in params in Next.js 15?',
      timestamp: '11:43 AM'
    },
    {
      id: 'welcome-2',
      sender: 'ai',
      paragraphs: [
        {
          text: 'In Next.js 15, the `params` object in Server Components and Route Handlers became asynchronous.',
          citation: {
            title: 'Async Params in Next.js 15',
            url: 'https://nextjs.org/docs',
            domain: 'nextjs.org/docs'
          }
        },
        {
          text: 'You must now `await params` before accessing route segments or values.',
          citation: {
            title: 'Next.js 15 Migration Guide',
            url: 'https://nextjs.org/docs',
            domain: 'nextjs.org/docs'
          }
        }
      ],
      timestamp: '11:43 AM'
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: userText,
      timestamp: timeStr
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'ai',
          paragraphs: data.paragraphs || [{ text: 'Response received without structured paragraphs.' }],
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errorData = await res.json();
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sender: 'ai',
          paragraphs: [
            {
              text: `⚠️ Error generating answer: ${errorData.error || 'Server error'}. Please verify your Gemini API key.`
            }
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const fallbackMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        paragraphs: [
          {
            text: `Connection error: ${err.message}. Make sure the DevVerse server is running.`
          }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleCopy = (msg: ChatMessage) => {
    let fullText = '';
    if (msg.text) {
      fullText = msg.text;
    } else if (msg.paragraphs) {
      fullText = msg.paragraphs.map(p => p.text).join('\n\n');
    }
    navigator.clipboard.writeText(fullText);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattedText = (text: string) => {
    // Basic markdown inline code highlight
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded-md bg-[#FFF0F0] text-[#DD0200] font-mono text-[13px] border border-[#FEE2E2]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-[#EDE6E6] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0E8E8] bg-white">
        <div>
          <h2 className="text-xl font-bold text-[#1A0706]">Chat</h2>
          <p className="text-xs text-slate-400">Ask anything about your indexed sources.</p>
        </div>
        <button
          onClick={handleClearChat}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 hover:bg-red-50/50 transition"
        >
          <Trash2 size={13} />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5F5] border border-[#FEE2E2] text-[#DD0200] flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A0706]">No messages yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Ask any question about your indexed web documentation. DevVerse will provide paragraph-level cited answers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md pt-2">
              {[
                'What changed with params in Next.js 15?',
                'How do React 19 Server Actions work?',
                'Explain Async Request APIs'
              ].map((query, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(query);
                  }}
                  className="text-xs font-medium bg-[#F9F7F7] hover:bg-[#F2EBEB] text-[#55100D] px-3 py-1.5 rounded-xl border border-[#EDE6E6] transition text-left"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              {/* User Message */}
              {msg.sender === 'user' ? (
                <div className="flex justify-end items-start space-x-2.5">
                  <div className="flex flex-col items-end max-w-[80%]">
                    <div className="bg-[#55100D] text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm">
                      <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 font-medium mr-1">
                      {msg.timestamp}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#DD0200] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                    A
                  </div>
                </div>
              ) : (
                /* AI Message with Inline Citations */
                <div className="flex items-start space-x-3 max-w-[92%]">
                  <div className="w-7 h-7 rounded-full bg-[#FFF5F5] border border-[#FEE2E2] text-[#DD0200] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={14} />
                  </div>

                  <div className="flex-1 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1A0706]">DevVerse AI</span>
                      <span className="text-[10px] text-slate-400 font-medium">{msg.timestamp}</span>
                    </div>

                    {/* Paragraphs and Citations */}
                    {msg.paragraphs?.map((p, pIdx) => (
                      <div key={pIdx} className="space-y-2">
                        {/* Text */}
                        <div className="text-sm text-[#1A0706] leading-relaxed font-normal">
                          {renderFormattedText(p.text)}
                        </div>

                        {/* Inline Citation Card */}
                        {p.citation && (
                          <a
                            href={p.citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-3 rounded-xl bg-[#FAF8F8] border border-[#EDE6E6] hover:border-[#DD0200]/40 hover:bg-white transition shadow-sm"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                {p.citation.domain?.includes('react') ? '⚛' : 'N'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] text-slate-400 font-medium truncate">
                                  {p.citation.domain || 'nextjs.org/docs'}
                                </p>
                                <p className="text-xs font-bold text-[#1A0706] group-hover:text-[#DD0200] transition truncate">
                                  {p.citation.title}
                                </p>
                              </div>
                            </div>
                            <ExternalLink size={14} className="text-slate-300 group-hover:text-[#DD0200] transition flex-shrink-0 ml-2" />
                          </a>
                        )}
                      </div>
                    ))}

                    {/* AI Message Footer Actions */}
                    <div className="flex items-center space-x-3 pt-1 text-slate-400">
                      <button
                        onClick={() => handleCopy(msg)}
                        className="hover:text-slate-700 p-1 rounded transition flex items-center space-x-1 text-xs"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                      <button className="hover:text-slate-700 p-1 rounded transition" title="Good answer">
                        <ThumbsUp size={13} />
                      </button>
                      <button className="hover:text-slate-700 p-1 rounded transition" title="Bad answer">
                        <ThumbsDown size={13} />
                      </button>
                      <span className="text-[10px] text-slate-400/80 font-mono">Gemini 3.6 Flash</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-7 h-7 rounded-full bg-[#FFF5F5] border border-[#FEE2E2] text-[#DD0200] flex items-center justify-center flex-shrink-0 animate-pulse">
              <Sparkles size={14} />
            </div>
            <div className="bg-[#FAF8F8] border border-[#EDE6E6] rounded-2xl px-4 py-3 flex items-center space-x-2 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin text-[#DD0200]" />
              <span>DevVerse AI is searching indexed sources and generating cited answer...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <div className="p-4 border-t border-[#F0E8E8] bg-white">
        <form onSubmit={handleSend} className="relative flex items-center bg-[#F9F7F7] rounded-2xl border border-[#E5DFDF] focus-within:border-[#DD0200] focus-within:ring-2 focus-within:ring-[#DD0200]/10 transition px-3.5 py-2">
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1 mr-1 transition"
            title="Attach resource"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your sources..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-[#1A0706] placeholder-slate-400 focus:outline-none py-1"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="ml-2 w-9 h-9 rounded-xl bg-[#DD0200] hover:bg-[#B80200] active:scale-95 text-white flex items-center justify-center transition disabled:opacity-40 shadow-sm"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-[11px] text-center text-slate-400 mt-2">
          DevVerse uses Gemini AI to provide accurate, cited answers.
        </p>
      </div>
    </div>
  );
};

export default ChatPanel;
