import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export default function TelemetryHubTab() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = () => {
    setIsRefreshing(true);
    fetch('http://localhost:3000/api/v1/health')
      .then(res => res.json())
      .then(data => {
        if (data.telemetry) setTelemetry(data.telemetry);
        if (data.logs) setLogs(data.logs);
      })
      .catch(console.error)
      .finally(() => setIsRefreshing(false));
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1A0706] flex items-center gap-2">
            <Activity className="text-[#DD0200]" />
            Scraper Telemetry & Self-Healing Hub
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Live operational metrics and AI healing events from Bright Data Scraper Studio
          </p>
        </div>
        <button
          onClick={fetchHealth}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#EDE6E6] rounded-xl text-xs font-semibold text-[#1A0706] hover:bg-[#FAF8F8] shadow-sm transition"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#DD0200]' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#EDE6E6] shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-[#DD0200]/5 rounded-bl-full"></div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">
            Total Scrapes
          </h3>
          <p className="text-3xl font-extrabold text-[#1A0706]">{telemetry?.totalScrapes || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Collector runs triggered</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#FEE2E2] shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-[#DD0200]/10 rounded-bl-full flex items-center justify-center pb-6 pl-6">
            <ShieldCheck className="text-[#DD0200]" size={24} />
          </div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#DD0200] mb-1">
            Auto-Healed Events
          </h3>
          <p className="text-3xl font-extrabold text-[#55100D]">{telemetry?.healEvents || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Autonomous Gemini repairs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EDE6E6] shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full"></div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-1">
            Pipeline Reliability
          </h3>
          <p className="text-3xl font-extrabold text-emerald-600">{telemetry?.successRate || 100}%</p>
          <p className="text-xs text-slate-400 mt-1">Zero silent failures</p>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 bg-white border border-[#EDE6E6] rounded-2xl overflow-hidden flex flex-col shadow-sm min-h-[400px]">
        <div className="px-6 py-4 border-b border-[#F0E8E8] bg-[#FAF8F8] flex justify-between items-center">
          <h3 className="font-bold text-sm text-[#1A0706] flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#DD0200]" />
            Live Self-Healing Event Stream
          </h3>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DD0200] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#DD0200]"></span>
            </span>
            <span className="text-xs font-semibold text-[#55100D]">Active Sentinel</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F0E8E8] text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="pb-3 pl-4">Timestamp</th>
                <th className="pb-3">Scraper</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Resolution Details</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-[#F5EFEF]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 text-xs italic">
                    No health logs recorded yet. Add a source or trigger a scrape.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF8F8] transition-colors">
                    <td className="py-3.5 pl-4 text-slate-400 font-mono text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 font-bold text-xs text-[#1A0706]">
                      {log.scraper_name}
                    </td>
                    <td className="py-3.5">
                      {log.status === 'SUCCESS' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-semibold">
                          <CheckCircle2 size={12} /> Success
                        </span>
                      )}
                      {log.status === 'HEALED_BY_AI' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF5F5] text-[#DD0200] border border-[#FEE2E2] text-xs font-bold animate-pulse">
                          <ShieldCheck size={12} /> Auto-Healed
                        </span>
                      )}
                      {log.status === 'FAILED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">
                          <AlertTriangle size={12} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-xs pr-4 text-slate-600">
                      {log.status === 'HEALED_BY_AI' ? (
                        <div className="space-y-1">
                          <div className="text-slate-400 line-through text-[11px]">
                            Broken: {log.broken_selector || 'missing fields'}
                          </div>
                          <div className="text-[#55100D] font-mono text-[11px] bg-[#FFF0F0] border border-[#FEE2E2] px-2 py-0.5 rounded inline-block font-semibold">
                            Fixed: {log.repaired_selector || 'LLM Structure Recovery'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">{log.log_message || 'Payload validated cleanly.'}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
