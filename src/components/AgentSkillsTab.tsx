import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Terminal, Copy, Check, Play } from 'lucide-react';

export default function AgentSkillsTab() {
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [activeView, setActiveView] = useState<'markdown' | 'api'>('markdown');
  const [copied, setCopied] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/skills')
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        if (data.length > 0) setSelectedSkill(data[0]);
      })
      .catch(console.error);
  }, []);

  const handleCopyCurl = () => {
    const curlCommand = `curl -X GET "http://localhost:3000/api/v1/skills"`;
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTryApi = () => {
    setApiResponse("Fetching...");
    fetch('/api/v1/skills')
      .then(res => res.json())
      .then(data => setApiResponse(JSON.stringify(data, null, 2)))
      .catch(err => setApiResponse("Error: " + err.message));
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Terminal className="text-emerald-400" />
          Agent Skills & API Inspector
        </h2>
        <div className="flex space-x-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
          <button 
            onClick={() => setActiveView('markdown')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'markdown' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Human View (Markdown)
          </button>
          <button 
            onClick={() => setActiveView('api')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'api' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Machine View (API)
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Sidebar: Skill List */}
        <div className="w-64 bg-slate-800 border border-slate-700 rounded-xl overflow-y-auto">
          <div className="p-4 border-b border-slate-700 font-semibold text-slate-200">
            Available Libraries
          </div>
          <div className="p-2 space-y-1">
            {skills.length === 0 ? (
              <div className="p-3 text-sm text-slate-400 text-center">No skills generated yet.</div>
            ) : (
              skills.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedSkill?.id === skill.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  {skill.library_name} (v{skill.version})
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
          {activeView === 'markdown' ? (
            <div className="p-6 overflow-y-auto prose prose-invert prose-emerald max-w-none">
              {selectedSkill ? (
                <ReactMarkdown>{selectedSkill.markdown_content}</ReactMarkdown>
              ) : (
                <div className="text-slate-400 flex items-center justify-center h-full">Select a library to view its agent skill</div>
              )}
            </div>
          ) : (
            <div className="p-6 flex flex-col h-full space-y-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Public REST Endpoint</span>
                  <button onClick={handleCopyCurl} className="text-xs flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy cURL'}
                  </button>
                </div>
                <div className="font-mono text-sm text-emerald-300 bg-black/50 p-3 rounded flex items-center justify-between">
                  <span>curl -X GET "http://localhost:3000/api/v1/skills"</span>
                  <button onClick={handleTryApi} className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-md flex items-center gap-1 transition-colors">
                    <Play size={14} /> <span className="text-xs font-bold">Run</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-hidden flex flex-col">
                <span className="text-xs font-semibold text-slate-400 uppercase mb-2">Live JSON Response (For AI Agents)</span>
                <pre className="flex-1 overflow-auto text-sm text-slate-300 font-mono p-2">
                  {apiResponse ? apiResponse : '// Click Run to fetch live machine-readable skills'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
