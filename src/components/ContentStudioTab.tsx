import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PenTool, Loader2, Copy, Check } from 'lucide-react';

export default function ContentStudioTab() {
  const [topic, setTopic] = useState('Latest API Breaking Changes');
  const [format, setFormat] = useState<'blog' | 'youtube' | 'newsletter'>('blog');
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, format })
      });
      const data = await res.json();
      if (data.markdownOutput) {
        setOutput(data.markdownOutput);
      } else {
        setOutput('Error: ' + JSON.stringify(data));
      }
    } catch (err: any) {
      setOutput('Error: ' + err.message);
    }
    setGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1A0706] flex items-center gap-2">
          <PenTool className="text-[#DD0200]" />
          Content & Script Studio
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate AI media content backed by live scraped web documentation.
        </p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Controls */}
        <div className="w-1/3 bg-white border border-[#EDE6E6] rounded-2xl p-5 flex flex-col space-y-5 shadow-sm">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Topic / Focus Area
            </label>
            <input 
              type="text" 
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full bg-[#FAF8F8] border border-[#E5DFDF] rounded-xl px-3.5 py-2.5 text-sm text-[#1A0706] focus:outline-none focus:ring-2 focus:ring-[#DD0200]/20 focus:border-[#DD0200] transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Output Format
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => setFormat('blog')}
                className={`px-4 py-3 rounded-xl text-left border transition-all ${
                  format === 'blog'
                    ? 'bg-[#55100D] border-[#55100D] text-white shadow-sm'
                    : 'bg-[#FAF8F8] border-[#EDE6E6] text-slate-700 hover:border-[#E5DFDF]'
                }`}
              >
                <div className="font-bold text-sm">Tech Blog Post</div>
                <div className={`text-xs mt-0.5 ${format === 'blog' ? 'text-white/70' : 'text-slate-400'}`}>
                  Deep-dive technical article
                </div>
              </button>

              <button 
                onClick={() => setFormat('youtube')}
                className={`px-4 py-3 rounded-xl text-left border transition-all ${
                  format === 'youtube'
                    ? 'bg-[#55100D] border-[#55100D] text-white shadow-sm'
                    : 'bg-[#FAF8F8] border-[#EDE6E6] text-slate-700 hover:border-[#E5DFDF]'
                }`}
              >
                <div className="font-bold text-sm">YouTube Script</div>
                <div className={`text-xs mt-0.5 ${format === 'youtube' ? 'text-white/70' : 'text-slate-400'}`}>
                  Includes visual cues and timestamps
                </div>
              </button>

              <button 
                onClick={() => setFormat('newsletter')}
                className={`px-4 py-3 rounded-xl text-left border transition-all ${
                  format === 'newsletter'
                    ? 'bg-[#55100D] border-[#55100D] text-white shadow-sm'
                    : 'bg-[#FAF8F8] border-[#EDE6E6] text-slate-700 hover:border-[#E5DFDF]'
                }`}
              >
                <div className="font-bold text-sm">Developer Digest</div>
                <div className={`text-xs mt-0.5 ${format === 'newsletter' ? 'text-white/70' : 'text-slate-400'}`}>
                  Scannable daily newsletter update
                </div>
              </button>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="mt-auto w-full bg-[#DD0200] hover:bg-[#B80200] active:scale-95 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
          >
            {generating ? <Loader2 size={18} className="animate-spin" /> : <PenTool size={18} />}
            <span>{generating ? 'Synthesizing with Gemini...' : 'Generate Content'}</span>
          </button>
        </div>

        {/* Output Preview */}
        <div className="flex-1 bg-white border border-[#EDE6E6] rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="bg-[#FAF8F8] px-5 py-3.5 border-b border-[#F0E8E8] flex justify-between items-center">
            <span className="text-xs font-bold text-[#1A0706] uppercase tracking-wider">
              Output Preview
            </span>
            {output && (
              <button
                onClick={handleCopy}
                className="text-xs font-semibold text-[#55100D] hover:text-[#DD0200] flex items-center space-x-1 transition"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
              </button>
            )}
          </div>
          <div className="p-6 overflow-y-auto flex-1 text-sm text-[#1A0706] leading-relaxed space-y-4">
            {output ? (
              <ReactMarkdown>{output}</ReactMarkdown>
            ) : (
              <div className="text-slate-400 h-full flex items-center justify-center italic text-center text-xs">
                Configure your format and hit generate to create AI-written content <br/>grounded in live scraped documentation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
