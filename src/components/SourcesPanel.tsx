import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Globe, ChevronRight, ShieldCheck, Trash2, CheckCircle2, Loader2, Clock, AlertCircle } from 'lucide-react';

export interface SourceItem {
  id: string;
  url: string;
  title: string;
  description: string;
  icon?: string;
  status: 'Synced' | 'Scraping' | 'Pending' | 'Failed' | string;
  chunks_count: number;
}

interface SourcesPanelProps {
  onSelectSource?: (source: SourceItem) => void;
  onAskAboutSource?: (sourceTitle: string) => void;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({ onAskAboutSource }) => {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (err) {
      console.error('Error fetching sources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
    const interval = setInterval(fetchSources, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setIsAdding(true);
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:3000/api/sources/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim() })
      });

      if (res.ok) {
        setNewUrl('');
        await fetchSources();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to add source');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to server');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteSource = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:3000/api/sources/${id}`, { method: 'DELETE' });
      fetchSources();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const getSourceIcon = (source: SourceItem) => {
    const url = source.url.toLowerCase();
    if (url.includes('nextjs')) {
      return (
        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shadow-sm">
          N
        </div>
      );
    }
    if (url.includes('react')) {
      return (
        <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold text-sm border border-cyan-500/20">
          ⚛
        </div>
      );
    }
    if (url.includes('typescript')) {
      return (
        <div className="w-8 h-8 rounded-md bg-[#3178C6] text-white flex items-center justify-center font-bold text-xs shadow-sm">
          TS
        </div>
      );
    }
    if (url.includes('github')) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
        <Globe size={16} />
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Synced':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 size={11} className="mr-1 text-emerald-500" /> Synced
          </span>
        );
      case 'Scraping':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200 animate-pulse">
            <Loader2 size={11} className="mr-1 animate-spin text-amber-500" /> Scraping
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <Clock size={11} className="mr-1 text-slate-400" /> Pending
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
            <AlertCircle size={11} className="mr-1 text-red-500" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#1A0706] tracking-tight">Sources</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Add URLs to scrape, validate and index for intelligent answers.
        </p>
      </div>

      {/* Add New Source Card */}
      <div className="bg-white rounded-2xl p-4 border border-[#EDE6E6] shadow-sm">
        <h3 className="text-xs font-bold text-[#1A0706] uppercase tracking-wider mb-2.5">
          Add New Source
        </h3>
        <form onSubmit={handleAddSource} className="flex items-center space-x-2">
          <input
            type="url"
            placeholder="https://example.com/docs"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            disabled={isAdding}
            className="flex-1 bg-[#F9F7F7] border border-[#E5DFDF] rounded-xl px-3.5 py-2.5 text-sm text-[#1A0706] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DD0200]/20 focus:border-[#DD0200] transition"
          />
          <button
            type="submit"
            disabled={isAdding || !newUrl.trim()}
            className="bg-[#DD0200] hover:bg-[#B80200] text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            <span>Add</span>
          </button>
        </form>
        {errorMsg && (
          <p className="text-xs text-red-500 mt-2 flex items-center">
            <AlertCircle size={12} className="mr-1" /> {errorMsg}
          </p>
        )}
      </div>

      {/* Indexed Sources Card */}
      <div className="bg-white rounded-2xl p-4 border border-[#EDE6E6] shadow-sm flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[#1A0706] uppercase tracking-wider">
            Indexed Sources ({sources.length})
          </h3>
          <button
            onClick={fetchSources}
            title="Refresh Sources"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
          {sources.map((source) => (
            <div
              key={source.id}
              onClick={() => onAskAboutSource?.(source.title)}
              className="group flex items-center justify-between p-3 rounded-xl border border-[#F2ECEC] hover:border-[#E5DFDF] hover:bg-[#FAF8F8] transition cursor-pointer"
            >
              <div className="flex items-center space-x-3 min-w-0">
                {getSourceIcon(source)}
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <p className="font-semibold text-sm text-[#1A0706] truncate group-hover:text-[#DD0200] transition">
                      {source.title}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-[190px]">
                    {source.description || source.url}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 ml-2 flex-shrink-0">
                <div className="text-right">
                  {getStatusBadge(source.status)}
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    {source.chunks_count > 0 ? `${source.chunks_count} chunks` : '— chunks'}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteSource(source.id, e)}
                  title="Remove Source"
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-1 transition"
                >
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Sentinel Notice Banner */}
      <div className="bg-[#FFF5F5] border border-[#FEE2E2] rounded-2xl p-3.5 flex items-start space-x-3 shadow-sm">
        <div className="bg-[#DD0200]/10 text-[#DD0200] p-1.5 rounded-lg flex-shrink-0 mt-0.5">
          <ShieldCheck size={18} />
        </div>
        <div>
          <p className="text-xs text-[#55100D] font-medium leading-relaxed">
            Our <span className="font-bold">AI Self-Healing Sentinel</span> monitors every scrape. If target data formats drift or selectors break, it heals automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SourcesPanel;
