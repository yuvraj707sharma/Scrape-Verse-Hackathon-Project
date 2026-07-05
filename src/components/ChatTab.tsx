import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  references?: { title: string; url: string }[];
}

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'model',
          content: 'Hello! I am your AI Social Listening Assistant. Ask me anything about the university reputation, student sentiment, or competitor comparisons!'
        }
      ]);
    }
  }, [messages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message to UI
    const updatedHistory = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      // Prepare history format for backend
      const backendHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: backendHistory
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, {
          role: 'model',
          content: data.text,
          references: data.references
        }]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'model',
        content: `Error: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center px-6 py-5 border-b border-slate-100 bg-slate-900 text-white shrink-0">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-4">
          <Bot className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="font-extrabold text-lg leading-tight">AI Copilot</h2>
          <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-time Internet Grounded Search
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 max-w-[90%] mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${msg.role === 'user' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
              <div className={`px-6 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed w-full ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'}`}>
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              
              {/* References */}
              {msg.references && msg.references.length > 0 && (
                <div className="mt-3 w-full bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" /> Sources & Grounding:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {msg.references.map((ref, i) => (
                      <a 
                        key={i} 
                        href={ref.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-400 transition-colors shadow-sm"
                        title={ref.title}
                      >
                        <span className="max-w-[200px] truncate">{ref.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 max-w-[90%] mx-auto">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div className="px-6 py-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
              <span className="text-sm font-semibold text-slate-600 tracking-wide">Synthesizing intelligence...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-slate-200 bg-white shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-3 relative max-w-4xl mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about sentiments, compare colleges, or request recent news..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-5 py-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-14 shadow-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-3 font-medium">
          AI generated intelligence can be inaccurate. Always verify critical facts using the provided sources.
        </p>
      </div>
    </div>
  );
}
