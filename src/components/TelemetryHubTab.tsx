import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function TelemetryHubTab() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchHealth = () => {
      fetch('/api/v1/health')
        .then(res => res.json())
        .then(data => {
          if (data.telemetry) setTelemetry(data.telemetry);
          if (data.logs) setLogs(data.logs);
        })
        .catch(console.error);
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="text-emerald-400" />
          Scraper Telemetry & Self-Healing Hub
        </h2>
        <p className="text-sm text-slate-400 mt-1">Live operational metrics from Bright Data Scraper Studio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full"></div>
          <h3 className="font-semibold text-slate-400 mb-1">Total Collector Runs</h3>
          <p className="text-4xl font-bold text-white">{telemetry?.totalScrapes || 0}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-emerald-500/30 relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/20 rounded-bl-full flex items-center justify-center pb-8 pl-8">
            <ShieldCheck className="text-emerald-400" size={32} />
          </div>
          <h3 className="font-semibold text-emerald-400 mb-1">Auto-Healed Events</h3>
          <p className="text-4xl font-bold text-white">{telemetry?.healEvents || 0}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full"></div>
          <h3 className="font-semibold text-slate-400 mb-1">Pipeline Reliability</h3>
          <p className="text-4xl font-bold text-emerald-400">{telemetry?.successRate || 100}%</p>
        </div>
      </div>

      <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col min-h-[400px]">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-400" />
            Live Self-Healing Event Stream
          </h3>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400">Listening to Webhooks</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase text-slate-400">
                <th className="pb-3 pl-4">Timestamp</th>
                <th className="pb-3">Scraper</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Resolution Details</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500 italic">No health logs recorded yet. Run a scraper to generate data.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 pl-4 text-slate-400 font-mono text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-4 font-medium text-slate-200">
                      {log.scraper_name}
                    </td>
                    <td className="py-4">
                      {log.status === 'SUCCESS' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-semibold">
                          <CheckCircle size={12} /> Success
                        </span>
                      )}
                      {log.status === 'HEALED_BY_AI' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                          <ShieldCheck size={12} /> Auto-Healed
                        </span>
                      )}
                      {log.status === 'FAILED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
                          <AlertTriangle size={12} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-slate-300 text-xs pr-4">
                      {log.status === 'HEALED_BY_AI' ? (
                        <div className="space-y-1">
                          <div className="text-slate-400 line-through">Broken: {log.broken_selector || 'unknown'}</div>
                          <div className="text-emerald-400 font-mono bg-emerald-900/30 p-1 rounded inline-block">Fixed: {log.repaired_selector || 'LLM Structure Extract'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500">{log.log_message || '-'}</span>
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
