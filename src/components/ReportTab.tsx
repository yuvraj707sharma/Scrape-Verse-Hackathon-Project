import React, { useState } from 'react';
import { FileText, Loader2, Download, Printer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ReportTab() {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/report', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setReport(data.report);
      } else {
        throw new Error(data.error || 'Failed to generate report');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-900 text-white shrink-0">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mr-4">
            <FileText className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg leading-tight">Executive Report</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Deep Strategic Analysis & Reputational Synthesis
            </p>
          </div>
        </div>
        
        {report && (
          <div className="flex gap-3">
            <button 
              onClick={() => {
                const blob = new Blob([report || ''], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `JU_Social_Analyzer_Report_${new Date().toISOString().split('T')[0]}.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded-lg transition-colors border border-slate-700 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        {!report && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-6">
            <div className="w-20 h-20 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <FileText className="w-10 h-10 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Generate Strategic Analysis</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Click below to synthesize all current database mentions into a highly detailed, professional executive report covering competitive benchmarking, sentiment shifts, and strategic opportunities.
              </p>
            </div>
            <button
              onClick={generateReport}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate Report Now
            </button>
            {error && (
              <p className="text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                {error}
              </p>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-sm font-bold text-slate-600 animate-pulse">
              Synthesizing millions of data points into strategic insights...
            </p>
          </div>
        )}

        {report && !isLoading && (
          <div className="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
            <div className="prose prose-slate prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-indigo-600 max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {report}
              </ReactMarkdown>
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-200 flex justify-center">
               <button
                onClick={generateReport}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                Regenerate Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
