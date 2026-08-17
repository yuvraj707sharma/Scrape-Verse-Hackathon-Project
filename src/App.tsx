import React, { useState } from 'react';
import { Activity, ShieldAlert, Cpu, BookOpen } from 'lucide-react';
import EcosystemRadarTab from './components/EcosystemRadarTab';
import AgentSkillsTab from './components/AgentSkillsTab';
import ContentStudioTab from './components/ContentStudioTab';
import TelemetryHubTab from './components/TelemetryHubTab';

function App() {
  const [activeTab, setActiveTab] = useState('radar');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="bg-slate-800 border-b border-slate-700 py-4 px-8 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Cpu size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              DevVerse Hub
            </h1>
            <p className="text-xs text-slate-400">Autonomous Developer Ecosystem & AI Skill Engine</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-slate-700 px-3 py-1.5 rounded-full border border-slate-600">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-sm font-medium text-emerald-300">Bright Data Scraper Studio: ACTIVE</span>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 min-h-[calc(100vh-80px)] bg-slate-800/50 border-r border-slate-700 p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('radar')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'radar' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
            >
              <Activity size={20} />
              <span className="font-medium">Ecosystem Radar</span>
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'skills' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
            >
              <Cpu size={20} />
              <span className="font-medium">Agent Skills & API</span>
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'studio' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
            >
              <BookOpen size={20} />
              <span className="font-medium">Content Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'telemetry' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
            >
              <ShieldAlert size={20} />
              <span className="font-medium">Telemetry & Health</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto h-[calc(100vh-80px)]">
          {activeTab === 'radar' && <EcosystemRadarTab />}
          {activeTab === 'skills' && <AgentSkillsTab />}
          {activeTab === 'studio' && <ContentStudioTab />}
          {activeTab === 'telemetry' && <TelemetryHubTab />}
        </main>
      </div>
    </div>
  );
}

export default App;
