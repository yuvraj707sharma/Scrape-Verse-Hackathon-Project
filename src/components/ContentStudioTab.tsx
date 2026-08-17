import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PenTool, Loader2 } from 'lucide-react';

export default function ContentStudioTab() {
  const [topic, setTopic] = useState('Latest API Breaking Changes');
  const [format, setFormat] = useState<'blog' | 'youtube' | 'newsletter'>('blog');
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/v1/scripts/generate', {
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

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <PenTool className="text-emerald-400" />
          Content & Script Studio
        </h2>
        <p className="text-sm text-slate-400 mt-1">Generate AI media content backed by live scraped web data.</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-1/3 bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Topic / Focus Area</label>
            <input 
              type="text" 
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Output Format</label>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => setFormat('blog')}
                className={`px-4 py-3 rounded-lg text-left border transition-colors ${format === 'blog' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-600 text-slate-300'}`}
              >
                <div className="font-semibold">Tech Blog Post</div>
                <div className="text-xs opacity-70 mt-1">Deep-dive technical article</div>
              </button>
              <button 
                onClick={() => setFormat('youtube')}
                className={`px-4 py-3 rounded-lg text-left border transition-colors ${format === 'youtube' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-600 text-slate-300'}`}
              >
                <div className="font-semibold">YouTube Script</div>
                <div className="text-xs opacity-70 mt-1">Includes visual cues and timestamps</div>
              </button>
              <button 
                onClick={() => setFormat('newsletter')}
                className={`px-4 py-3 rounded-lg text-left border transition-colors ${format === 'newsletter' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-600 text-slate-300'}`}
              >
                <div className="font-semibold">Developer Digest</div>
                <div className="text-xs opacity-70 mt-1">Scannable daily newsletter update</div>
              </button>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="mt-auto w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {generating ? <Loader2 size={18} className="animate-spin" /> : <PenTool size={18} />}
            {generating ? 'Synthesizing Data...' : 'Generate Content'}
          </button>
        </div>

        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Output Preview</span>
          </div>
          <div className="p-6 overflow-y-auto flex-1 prose prose-invert prose-emerald max-w-none">
            {output ? (
              <ReactMarkdown>{output}</ReactMarkdown>
            ) : (
              <div className="text-slate-500 h-full flex items-center justify-center italic text-center">
                Configure your format and hit generate to create AI-written content <br/>grounded in live scraped documentation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
