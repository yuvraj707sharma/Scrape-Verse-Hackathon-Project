import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import SourcesPanel from './components/SourcesPanel';
import ChatPanel from './components/ChatPanel';
import EcosystemRadarTab from './components/EcosystemRadarTab';
import ContentStudioTab from './components/ContentStudioTab';
import TelemetryHubTab from './components/TelemetryHubTab';

function App() {
  const [activeTab, setActiveTab] = useState('workspace'); // workspace | radar | studio | telemetry
  const [activePrompt, setActivePrompt] = useState('');

  const handleAskAboutSource = (sourceTitle: string) => {
    setActivePrompt(`What are the latest API changes and patterns in ${sourceTitle}?`);
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A0706] font-sans antialiased overflow-hidden">
      {/* Left Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-[#EDE6E6] px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-bold text-[#1A0706]">
              {activeTab === 'workspace' && 'Live RAG & Sources'}
              {activeTab === 'radar' && 'Ecosystem Radar'}
              {activeTab === 'studio' && 'Content Studio'}
              {activeTab === 'telemetry' && 'Telemetry & Health'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Live System Badge matching Image 2 */}
            <div className="flex items-center space-x-1.5 bg-[#FFF5F5] border border-[#FEE2E2] px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#DD0200] animate-pulse"></span>
              <span className="text-xs font-bold text-[#55100D]">Live System</span>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-semibold text-emerald-700">Bright Data Scraper Studio: ACTIVE</span>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-6 overflow-hidden min-h-0">
          {activeTab === 'workspace' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
              {/* Left Column: Sources Panel (5 Cols) */}
              <div className="lg:col-span-5 h-full min-h-0 overflow-y-auto pr-1">
                <SourcesPanel onAskAboutSource={handleAskAboutSource} />
              </div>

              {/* Right Column: Notebook-Style Cited Chat Panel (7 Cols) */}
              <div className="lg:col-span-7 h-full min-h-0">
                <ChatPanel initialPrompt={activePrompt} />
              </div>
            </div>
          )}

          {activeTab === 'radar' && (
            <div className="h-full overflow-y-auto pr-1">
              <EcosystemRadarTab />
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="h-full overflow-y-auto pr-1">
              <ContentStudioTab />
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="h-full overflow-y-auto pr-1">
              <TelemetryHubTab />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
