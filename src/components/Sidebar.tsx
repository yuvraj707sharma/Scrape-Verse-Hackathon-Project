import React from 'react';
import { Layers, MessageSquare, ShieldAlert, Activity, BookOpen, ChevronDown } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 bg-white border-r border-[#EDE6E6] flex flex-col justify-between p-4 min-h-screen select-none">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3 px-2 py-1">
          {/* Red Diamond Logo */}
          <div className="w-8 h-8 rounded-lg bg-[#DD0200] flex items-center justify-center shadow-sm rotate-45 transform">
            <div className="w-3.5 h-3.5 bg-white rounded-sm"></div>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#1A0706] tracking-tight leading-tight">
              DevVerse Hub
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">AI Developer Intelligence</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'workspace'
                ? 'bg-[#55100D] text-white shadow-sm'
                : 'text-slate-600 hover:bg-[#F9F7F7] hover:text-[#1A0706]'
            }`}
          >
            <Layers size={18} />
            <span>Sources</span>
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'radar'
                ? 'bg-[#55100D] text-white shadow-sm'
                : 'text-slate-600 hover:bg-[#F9F7F7] hover:text-[#1A0706]'
            }`}
          >
            <Activity size={18} />
            <span>Ecosystem Radar</span>
          </button>

          <button
            onClick={() => setActiveTab('studio')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'studio'
                ? 'bg-[#55100D] text-white shadow-sm'
                : 'text-slate-600 hover:bg-[#F9F7F7] hover:text-[#1A0706]'
            }`}
          >
            <BookOpen size={18} />
            <span>Content Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'telemetry'
                ? 'bg-[#55100D] text-white shadow-sm'
                : 'text-slate-600 hover:bg-[#F9F7F7] hover:text-[#1A0706]'
            }`}
          >
            <ShieldAlert size={18} />
            <span>Telemetry</span>
          </button>
        </nav>
      </div>

      {/* User Profile Card */}
      <div className="pt-4 border-t border-[#F0E8E8]">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF8F8] transition cursor-pointer">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#55100D] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              A
            </div>
            <div>
              <p className="text-xs font-bold text-[#1A0706]">Aman Singh</p>
              <p className="text-[11px] text-slate-400">Developer</p>
            </div>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
