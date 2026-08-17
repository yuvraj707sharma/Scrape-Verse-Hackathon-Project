import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Users, GitBranch, RefreshCw } from 'lucide-react';

export default function EcosystemRadarTab() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrends = () => {
    setLoading(true);
    fetch('http://localhost:3000/api/v1/trends')
      .then(res => res.json())
      .then(data => {
        setTrends(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const defaultMockTrends = [
    { repo_name: 'next.js', stars: 124500, language: 'TypeScript' },
    { repo_name: 'react', stars: 228900, language: 'JavaScript' },
    { repo_name: 'tailwind', stars: 82100, language: 'CSS' },
    { repo_name: 'vue', stars: 207000, language: 'TypeScript' },
    { repo_name: 'vite', stars: 69400, language: 'TypeScript' }
  ];

  const chartData = trends.length > 0 ? trends : defaultMockTrends;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#1A0706] flex items-center gap-2">
            <TrendingUp className="text-[#DD0200]" />
            Ecosystem Radar
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Live tech adoption & repository statistics from Bright Data Scraper Studio
          </p>
        </div>
        <button
          onClick={fetchTrends}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#EDE6E6] rounded-xl text-xs font-semibold text-[#1A0706] hover:bg-[#FAF8F8] shadow-sm transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#DD0200]' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#EDE6E6] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#55100D]/10 text-[#55100D] flex items-center justify-center">
              <GitBranch size={18} />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Active Repos Tracked
            </h3>
          </div>
          <p className="text-3xl font-extrabold text-[#1A0706]">
            {chartData.length}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EDE6E6] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#DD0200]/10 text-[#DD0200] flex items-center justify-center">
              <Users size={18} />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Tech Adoption Signals
            </h3>
          </div>
          <p className="text-3xl font-extrabold text-[#55100D]">8,432</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EDE6E6] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Top Trending Language
            </h3>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">TypeScript</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#EDE6E6] shadow-sm h-[420px] flex flex-col">
        <h3 className="font-bold text-sm text-[#1A0706] mb-6">
          GitHub Stars Momentum (Top Repositories)
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0E8E8" vertical={false} />
              <XAxis dataKey="repo_name" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #EDE6E6', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                itemStyle={{ color: '#55100D', fontWeight: 600 }}
              />
              <Bar dataKey="stars" fill="#DD0200" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
