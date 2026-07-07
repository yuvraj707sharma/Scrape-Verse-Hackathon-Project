import React, { useState, useEffect } from 'react';
import ChatTab from './components/ChatTab';
import ReportTab from './components/ReportTab';
import {
  Activity,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Trash2,
  RefreshCw,
  SearchCode,
  ShieldAlert,
  Sliders,
  ExternalLink,
  CheckCircle,
  XCircle,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Info,
  Sparkles,
  RotateCcw,
  PlusCircle,
  Settings,
  Briefcase,
  DollarSign,
  GraduationCap,
  Home,
  Check,
  Building,
  Radio,
  FileText,
  Send,
  X,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { Keyword, Competitor, Mention, AnalysisSummary, TopicType, SourceType, SentimentType } from './types.ts';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'mentions' | 'chat' | 'report'>('chat');
  const [selectedProgram, setSelectedProgram] = useState<string>('Computer Science');

  // Core Data States
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);

  // Loading States
  const [loading, setLoading] = useState<boolean>(true);
  const [scanning, setScanning] = useState<boolean>(false);
  const [synthesizing, setSynthesizing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form Inputs
  const [newKeywordText, setNewKeywordText] = useState<string>('');
  const [newKeywordCategory, setNewKeywordCategory] = useState<'brand' | 'competitor' | 'program' | 'general'>('brand');
  
  const [newCompName, setNewCompName] = useState<string>('');
  const [newCompShort, setNewCompShort] = useState<string>('');
  const [newCompWeb, setNewCompWeb] = useState<string>('');

  const [scanQuery, setScanQuery] = useState<string>('');
  
  // Custom Manual Entry state
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualText, setManualText] = useState<string>('');
  const [manualSource, setManualSource] = useState<SourceType>('Reddit');
  const [manualUrl, setManualUrl] = useState<string>('');
  const [manualAuthor, setManualAuthor] = useState<string>('');
  const [manualProgram, setManualProgram] = useState<string>('');
  const [showManualForm, setShowManualForm] = useState<boolean>(false);

  // Filters State for Mentions
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');

  // Interactive recommendations checked items (saved in localStorage for visual persistence)
  const [checkedActionItems, setCheckedActionItems] = useState<Record<string, boolean>>({});

  // AI Chat Panel State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; content: string; references?: { title: string; url: string }[] }[]>([
    {
      role: 'model',
      content: "Hello! I am your JECRC Reputational Intelligence Assistant. I can search the entire web in real-time to answer your questions about college ratings, student complaints, competitor placements, or academic program feedback. What would you like me to research for you today?"
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Error/Success Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch initial data
  const fetchData = async (showToast = false) => {
    try {
      setLoading(true);
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed to fetch intelligence data.');
      const data = await res.json();
      setKeywords(data.keywords || []);
      setCompetitors(data.competitors || []);
      setMentions(data.mentions || []);
      setAnalysisSummary(data.analysisSummary || null);
      setGeminiConfigured(data.geminiConfigured || false);
      if (showToast) {
        showToastMsg('Data synchronized with pulse engine', 'success');
      }
    } catch (error: any) {
      console.error(error);
      showToastMsg(error.message || 'Error syncing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Load check items state from local storage
    const stored = localStorage.getItem('jecrc_action_items');
    if (stored) {
      try {
        setCheckedActionItems(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const uniqueSources = Array.from(new Set(mentions.map(m => m.source))).filter(Boolean).sort();

  const showToastMsg = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleToggleActionItem = (itemId: string) => {
    const updated = { ...checkedActionItems, [itemId]: !checkedActionItems[itemId] };
    setCheckedActionItems(updated);
    localStorage.setItem('jecrc_action_items', JSON.stringify(updated));
    showToastMsg('Strategic action checklist updated', 'info');
  };

  // Add Keyword
  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordText.trim()) return;
    try {
      setActionLoading('add-keyword');
      const res = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newKeywordText, category: newKeywordCategory })
      });
      if (!res.ok) throw new Error('Failed to add listening keyword');
      const kw = await res.json();
      setKeywords([...keywords, kw]);
      setNewKeywordText('');
      showToastMsg(`Listening keyword "${kw.text}" added.`, 'success');
    } catch (error: any) {
      showToastMsg(error.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Keyword
  const handleDeleteKeyword = async (id: string) => {
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete keyword');
      setKeywords(keywords.filter(k => k.id !== id));
      showToastMsg('Keyword removed from listen-list.', 'info');
    } catch (error: any) {
      showToastMsg(error.message, 'error');
    }
  };

  // Add Competitor
  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim() || !newCompShort.trim()) {
      showToastMsg('Please fill out competitor name and short name', 'error');
      return;
    }
    try {
      setActionLoading('add-competitor');
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCompName, shortName: newCompShort, website: newCompWeb })
      });
      if (!res.ok) throw new Error('Failed to add competitor');
      const comp = await res.json();
      setCompetitors([...competitors, comp]);
      setNewCompName('');
      setNewCompShort('');
      setNewCompWeb('');
      showToastMsg(`Competitor "${comp.name}" added to monitoring list.`, 'success');
    } catch (error: any) {
      showToastMsg(error.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Competitor
  const handleDeleteCompetitor = async (id: string) => {
    try {
      const res = await fetch(`/api/competitors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove competitor');
      setCompetitors(competitors.filter(c => c.id !== id));
      showToastMsg('Competitor removed from tracking dashboard.', 'info');
    } catch (error: any) {
      showToastMsg(error.message, 'error');
    }
  };

  // Add Manual Mention & Classify
  const handleAddManualMention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) {
      showToastMsg('Please enter mention text to analyze', 'error');
      return;
    }
    try {
      setActionLoading('analyze-manual');
      const res = await fetch('/api/analyse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: manualText,
          title: manualTitle || 'Manual Insight Log',
          source: manualSource,
          url: manualUrl || undefined,
          author: manualAuthor || 'Staff Analyst',
          program: manualProgram || undefined
        })
      });
      if (!res.ok) throw new Error('Failed to analyze mention text');
      const newMention = await res.json();
      setMentions([newMention, ...mentions]);
      
      // Clear Form
      setManualTitle('');
      setManualText('');
      setManualUrl('');
      setManualAuthor('');
      setManualProgram('');
      setShowManualForm(false);
      
      showToastMsg(`Mention successfully analyzed with ${newMention.sentiment} sentiment and logged.`, 'success');
      
      // Refresh dashboard summary
      handleSynthesize(false);
    } catch (error: any) {
      showToastMsg(error.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Send AI Chat Message with search grounding
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    
    const updatedMessages = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(updatedMessages as any);
    setIsChatLoading(true);

    try {
      const historyPayload = chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await res.json();
      setChatMessages([
        ...updatedMessages,
        {
          role: 'model',
          content: data.text,
          references: data.references
        }
      ] as any);
    } catch (err: any) {
      console.error('Chat error:', err);
      setChatMessages([
        ...updatedMessages,
        {
          role: 'model',
          content: `Failed to search the web: ${err.message || 'Unknown network error'}. Please retry.`
        }
      ] as any);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Helper to parse bold markdown and lists
  const renderMessageContent = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      // Check if bullet point
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().substring(2);
        return (
          <li key={lineIdx} className="ml-4 list-disc text-xs font-semibold text-slate-700 leading-relaxed mb-1">
            {parseBoldAndItalic(content)}
          </li>
        );
      }
      // Check if numbered list item (e.g. 1. Item)
      const numMatch = line.trim().match(/^\d+\.\s(.*)$/);
      if (numMatch) {
        return (
          <li key={lineIdx} className="ml-4 list-decimal text-xs font-semibold text-slate-700 leading-relaxed mb-1">
            {parseBoldAndItalic(numMatch[1])}
          </li>
        );
      }
      // Check if heading (e.g. ### Heading or **Heading**)
      if (line.trim().startsWith('###')) {
        return (
          <h5 key={lineIdx} className="text-xs font-black text-slate-900 tracking-tight mt-3 mb-1.5 uppercase">
            {parseBoldAndItalic(line.trim().replace(/^###\s*/, ''))}
          </h5>
        );
      }
      if (line.trim().startsWith('##')) {
        return (
          <h4 key={lineIdx} className="text-sm font-black text-slate-900 tracking-tight mt-4 mb-2 uppercase border-b border-slate-100 pb-1">
            {parseBoldAndItalic(line.trim().replace(/^##\s*/, ''))}
          </h4>
        );
      }
      // Normal paragraph
      if (line.trim() === '') {
        return <div key={lineIdx} className="h-2"></div>;
      }
      return (
        <p key={lineIdx} className="text-xs font-semibold text-slate-700 leading-relaxed mb-1.5">
          {parseBoldAndItalic(line)}
        </p>
      );
    });
  };

  const parseBoldAndItalic = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-black text-slate-950">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Delete Mention
  const handleDeleteMention = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recorded mention?')) return;
    try {
      const res = await fetch(`/api/mentions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete mention');
      setMentions(mentions.filter(m => m.id !== id));
      showToastMsg('Mention deleted successfully.', 'success');
      handleSynthesize(false);
    } catch (error: any) {
      showToastMsg(error.message, 'error');
    }
  };

  // Flag/Escalate Mention
  const handleFlagMention = async (id: string, isCurrentlyFlagged: boolean) => {
    let reason = '';
    if (!isCurrentlyFlagged) {
      reason = prompt('Enter administrative escalation reason/notes:', 'High priority alert requiring registrar review.') || '';
      if (reason === null) return; // cancel
    }
    try {
      const res = await fetch(`/api/mentions/${id}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlagged: !isCurrentlyFlagged, escalationReason: reason })
      });
      if (!res.ok) throw new Error('Failed to change flag status');
      const updated = await res.json();
      setMentions(mentions.map(m => m.id === id ? updated : m));
      showToastMsg(
        !isCurrentlyFlagged 
          ? 'Mention flagged and escalated to senior administrators.' 
          : 'Risk level reduced. Escalation resolved.', 
        'info'
      );
    } catch (error: any) {
      showToastMsg(error.message, 'error');
    }
  };

  // Trigger Live Internet Scan
  const handleLiveScan = async () => {
    try {
      setScanning(true);
      showToastMsg('Gemini listening engine is searching Reddit, Quora, and news channels...', 'info');
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: scanQuery })
      });
      if (!res.ok) throw new Error('Live search query scanning failed.');
      const data = await res.json();
      
      if (data.mentions && data.mentions.length > 0) {
        setMentions(prev => [...data.mentions, ...prev]);
        showToastMsg(`Scan complete. Discovered ${data.addedCount} new mentions from the open web!`, 'success');
        setScanQuery('');
        // Refresh dashboard summary
        handleSynthesize(false);
      } else {
        showToastMsg('Scan complete. No new mentions found matching query.', 'info');
      }
    } catch (error: any) {
      showToastMsg(error.message || 'Scan error occurred', 'error');
    } finally {
      setScanning(false);
    }
  };

  // Run AI Synthesis / Re-analyze
  const handleSynthesize = async (triggerToast = true) => {
    try {
      setSynthesizing(true);
      if (triggerToast) {
        showToastMsg('Gemini is reading all mentions and synthesizing strategic advice...', 'info');
      }
      const res = await fetch('/api/analyse', { method: 'POST' });
      if (!res.ok) throw new Error('Strategic synthesis failed.');
      const updatedSummary = await res.json();
      setAnalysisSummary(updatedSummary);
      if (triggerToast) {
        showToastMsg('Dashboard metrics synthesized successfully!', 'success');
      }
    } catch (error: any) {
      showToastMsg(error.message || 'Synthesis error', 'error');
    } finally {
      setSynthesizing(false);
    }
  };

  // Reset DB
  const handleResetDB = async () => {
    if (!confirm('This will restore pre-seeded baseline data. Your custom keywords, competitors, and scanned mentions will be reset. Proceed?')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      const data = await res.json();
      setKeywords(data.keywords || []);
      setCompetitors(data.competitors || []);
      setMentions(data.mentions || []);
      setAnalysisSummary(data.analysisSummary || null);
      showToastMsg('System restored to default analytical baseline.', 'success');
    } catch (error: any) {
      showToastMsg(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export intelligence report
  const handleExportReport = () => {
    if (!analysisSummary) return;
    const reportData = {
      reportDate: new Date().toISOString(),
      summary: "JECRC Pulse Intelligence Hub - Automated Competitive & Listening Export",
      totalMentions: mentions.length,
      sentimentDistribution: analysisSummary.sentimentDistribution,
      topComplaints: analysisSummary.topComplaints,
      topPraises: analysisSummary.topPraises,
      recommendations: analysisSummary.strategicRecommendations,
      monitoredKeywords: keywords.map(k => k.text),
      monitoredCompetitors: competitors.map(c => c.name),
      rawMentions: mentions.map(m => ({
        title: m.title,
        text: m.text,
        source: m.source,
        url: m.url,
        sentiment: m.sentiment,
        topic: m.primaryTopic,
        date: m.date
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JECRC_Pulse_Intelligence_Report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToastMsg('Intelligence dataset exported as JSON.', 'success');
  };

  // Mentions Filter Logic
  const filteredMentions = mentions.filter(m => {
    const textMatch = 
      m.text.toLowerCase().includes(filterSearch.toLowerCase()) || 
      (m.title && m.title.toLowerCase().includes(filterSearch.toLowerCase())) ||
      m.author.toLowerCase().includes(filterSearch.toLowerCase());
    
    const sentimentMatch = filterSentiment === 'all' || m.sentiment === filterSentiment;
    const sourceMatch = filterSource === 'all' || m.source === filterSource;
    const topicMatch = filterTopic === 'all' || m.primaryTopic === filterTopic;

    return textMatch && sentimentMatch && sourceMatch && topicMatch;
  });

  // Color mappings for UI components
  const getTopicIcon = (topic: TopicType) => {
    switch (topic) {
      case 'placements': return <Briefcase className="w-4 h-4" />;
      case 'fees': return <DollarSign className="w-4 h-4" />;
      case 'faculty': return <GraduationCap className="w-4 h-4" />;
      case 'hostel life': return <Home className="w-4 h-4" />;
      case 'infrastructure': return <Building className="w-4 h-4" />;
      case 'academic quality': return <Activity className="w-4 h-4" />;
      case 'admission/reputation': return <Radio className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSourceBadgeColor = (source: SourceType) => {
    switch (source) {
      case 'Reddit': return 'bg-orange-50 text-orange-600 border border-orange-200';
      case 'Quora': return 'bg-red-50 text-red-700 border border-red-200';
      case 'YouTube': return 'bg-rose-50 text-rose-600 border border-rose-200';
      case 'CollegeDunia': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      default: return 'bg-blue-50 text-blue-600 border border-blue-200';
    }
  };

  const getSentimentColor = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 font-bold border border-green-200';
      case 'neutral': return 'bg-slate-100 text-slate-800 font-bold border border-slate-200';
      case 'negative': return 'bg-red-100 text-red-800 font-bold border border-red-200';
    }
  };

  // Aggregate numbers safely
  const positiveCount = mentions.filter(m => m.sentiment === 'positive').length;
  const neutralCount = mentions.filter(m => m.sentiment === 'neutral').length;
  const negativeCount = mentions.filter(m => m.sentiment === 'negative').length;
  const totalCount = mentions.length;
  const sentimentScore = totalCount > 0 ? Math.round(((positiveCount + neutralCount * 0.5) / totalCount) * 100) : 74;

  const flaggedMentionsCount = mentions.filter(m => m.isFlagged).length;

  return (
    <div id="pulse-root" className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Toast Notification */}
      {toast && (
        <div 
          id="toast-notification"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 max-w-md ${
            toast.type === 'success' ? 'bg-emerald-900 text-emerald-50 border-emerald-700' :
            toast.type === 'error' ? 'bg-red-950 text-red-50 border-red-800' :
            'bg-slate-900 text-slate-50 border-slate-700'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside id="sidebar-navigation" className="w-72 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-950 rounded-lg flex items-center justify-center font-black text-lg text-white shadow-sm shrink-0">
              J
            </div>
            <div>
              <h1 className="font-extrabold tracking-tight text-base leading-none text-slate-900">JECRC Pulse</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Intelligence Hub</p>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <button
            id="tab-mentions-btn"
            onClick={() => setActiveTab('mentions')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              activeTab === 'mentions' 
                ? 'bg-slate-950 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Mentions Stream
          </button>
 
          <button
            id="tab-chat-btn"
            onClick={() => setActiveTab('chat')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-between ${
              activeTab === 'chat' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <span>AI Copilot</span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            id="tab-report-btn"
            onClick={() => setActiveTab('report')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-between mt-2 ${
              activeTab === 'report' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <span>Executive Report</span>
            <FileText className="w-3.5 h-3.5" />
          </button>
 
          <div className="pt-6 border-t border-slate-100 mt-6 px-1.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Monitoring Scope</p>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] text-slate-500 font-semibold">
                <span>Tracked keywords:</span>
                <span className="font-black text-slate-700">{keywords.length}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 font-semibold">
                <span>Rival colleges:</span>
                <span className="font-black text-slate-700">{competitors.length}</span>
              </div>

            </div>
          </div>
        </nav>
 
        {/* User Info / Foot Section */}
        <div id="sidebar-footer" className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/40">
          <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] border border-slate-200 shadow-sm">
              DIR
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black truncate text-slate-900 leading-tight">JECRC Director</p>
              <p className="text-[10px] text-slate-400 font-semibold truncate leading-none mt-0.5">Intelligence Panel</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button 
              id="reset-db-btn"
              onClick={handleResetDB}
              title="Restore sample baseline database"
              className="flex-1 py-1.5 px-2 text-[10px] text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center gap-1 font-bold shadow-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Baseline
            </button>
          </div>
        </div>
      </aside>
 
      {/* Main Content Area */}
      <main id="main-content" className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header */}
        <header id="main-header" className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">University Listening & Intel</h2>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">Continuous scanning of Reddit, Quora, news and online forums</p>
            </div>

          </div>
 
          <div className="flex gap-2.5 items-center">
            {analysisSummary && (
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide mr-2">
                Last synthesized: {new Date(analysisSummary.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            )}
            
            <button
              id="re-synthesize-btn"
              disabled={synthesizing || loading}
              onClick={() => handleSynthesize(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 text-slate-600 ${synthesizing ? 'animate-spin' : ''}`} />
              {synthesizing ? 'Analyzing...' : 'AI Re-Analyze'}
            </button>
 
            <button 
              id="export-report-btn"
              onClick={handleExportReport}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer border border-slate-950"
            >
              <FileText className="w-3.5 h-3.5" />
              Export Dataset
            </button>
          </div>
        </header>

        {/* Dynamic Workspace (Scrollable Area) */}
        <div id="content-workspace" className="flex-1 overflow-y-auto p-8 bg-slate-50 space-y-8">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <RefreshCw className="w-12 h-12 text-red-600 animate-spin" />
              <p className="text-slate-500 font-semibold text-sm">Aggregating social conversations and compiling matrices...</p>
            </div>
          ) : (
            <>
              {/* ==================== TAB 1: OVERVIEW ==================== */}
              


              {/* ==================== TAB 2: MENTIONS STREAM ==================== */}
              {activeTab === 'mentions' && (
                <div id="view-mentions" className="space-y-8 animate-fade-in">
                  
                  {/* Top Bar: Manual Entry + Live Scan */}
                  <div className="grid grid-cols-12 gap-8 items-start">
                    
                    {/* Live Scan Control Card */}
                    <div className="col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                        <SearchCode className="w-4 h-4 text-red-600" />
                        Trigger Web listening Scan
                      </h4>
                      <p className="text-xs text-slate-500 mb-4">
                        Search student discussion groups, review platforms, and news. Enter custom query to scrape and analyze.
                      </p>
                      
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            id="scan-query-input"
                            type="text"
                            value={scanQuery}
                            onChange={(e) => setScanQuery(e.target.value)}
                            placeholder="e.g. JECRC placements Quora, or JECRC vs Manipal hostel"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <button
                          id="trigger-active-scan-btn"
                          disabled={scanning}
                          onClick={handleLiveScan}
                          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm shadow-red-600/10 disabled:opacity-50"
                        >
                          {scanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                          {scanning ? 'Scanning...' : 'Trigger Scan'}
                        </button>
                      </div>

                      <div className="mt-4 flex gap-2 flex-wrap items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Scopes:</span>
                        {keywords.slice(0, 4).map(kw => (
                          <button
                            key={kw.id}
                            onClick={() => setScanQuery(`${kw.text} reviews 2026`)}
                            className="text-[11px] font-semibold bg-slate-100 text-slate-650 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200/80 transition-colors"
                          >
                            {kw.text}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manual Feed Log Switch Card */}
                    <div className="col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between h-full min-h-[175px]">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                          <PlusCircle className="w-4 h-4 text-red-600" />
                          Log Offline Mentions & Bulletins
                        </h4>
                        <p className="text-xs text-slate-500">
                          Manually copy a screenshot transcript, a complaint letter, or a WhatsApp student group post to classify with Gemini.
                        </p>
                      </div>

                      <button
                        id="toggle-manual-form-btn"
                        onClick={() => setShowManualForm(!showManualForm)}
                        className={`mt-4 w-full py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 ${
                          showManualForm 
                            ? 'bg-slate-100 border-slate-300 text-slate-750' 
                            : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {showManualForm ? 'Hide Entry Form' : 'Open Manual Entry & Classification Form'}
                      </button>
                    </div>

                  </div>

                  {/* Manual Form Slider */}
                  {showManualForm && (
                    <form 
                      id="manual-mention-form"
                      onSubmit={handleAddManualMention} 
                      className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-slide-down"
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div>
                          <h4 className="font-bold text-slate-800 text-base">Classify New Online Mention</h4>
                          <p className="text-xs text-slate-400 mt-0.5">The Gemini AI engine will parse, extract topic tags, evaluate sentiment, and identify rival colleges.</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setShowManualForm(false)} 
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Post Title / Subject Header</label>
                          <input 
                            type="text"
                            value={manualTitle}
                            onChange={(e) => setManualTitle(e.target.value)}
                            placeholder="e.g. Honest review of CSE placement process"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Platform Source Type</label>
                          <select
                            value={manualSource}
                            onChange={(e) => setManualSource(e.target.value as SourceType)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-red-500"
                          >
                            <option value="Reddit">Reddit Forum</option>
                            <option value="Quora">Quora Thread</option>
                            <option value="YouTube">YouTube Comment Section</option>
                            <option value="CollegeDunia">CollegeDunia Verified Review</option>
                            <option value="News & Blogs">News & Blogs Portal</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Source URL / Web Link</label>
                          <input 
                            type="url"
                            value={manualUrl}
                            onChange={(e) => setManualUrl(e.target.value)}
                            placeholder="e.g. https://reddit.com/r/jaipur/comments/..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Author Handle / Username</label>
                          <input 
                            type="text"
                            value={manualAuthor}
                            onChange={(e) => setManualAuthor(e.target.value)}
                            placeholder="e.g. u/btech_student_2026 or Karan J."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Program Tag (Optional)</label>
                          <select
                            value={manualProgram}
                            onChange={(e) => setManualProgram(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-red-500"
                          >
                            <option value="">-- No Specific Program Tag --</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                            <option value="Civil Engineering">Civil Engineering</option>
                            <option value="MBA">MBA</option>
                            <option value="BSc Nursing">BSc Nursing</option>
                            <option value="BPT (Physiotherapy)">BPT (Physiotherapy)</option>
                          </select>
                        </div>

                        <div className="col-span-2 space-y-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Scraped Text Body / Discussion Comment Content</label>
                          <textarea 
                            required
                            rows={4}
                            value={manualText}
                            onChange={(e) => setManualText(e.target.value)}
                            placeholder="Paste the raw text of the post/review here. Include any mentions of placements, fees, food, host, or other universities..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 leading-relaxed focus:outline-none focus:border-red-500"
                          ></textarea>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowManualForm(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={actionLoading === 'analyze-manual'}
                          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shadow-red-600/10 disabled:opacity-50"
                        >
                          {actionLoading === 'analyze-manual' ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Classifying with Gemini AI...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              Analyze & Log Mention
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Filter & Stream Row */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                    
                    {/* Header with quick stats */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="font-bold text-slate-850 text-sm uppercase tracking-wider">Active Stream Filter</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Refine gathered data on placements, fees, and competitors</p>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-full">
                        Showing {filteredMentions.length} of {mentions.length} logged records
                      </span>
                    </div>

                    {/* Filter controls */}
                    <div className="grid grid-cols-5 gap-4">
                      
                      {/* Search */}
                      <div className="col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          placeholder="Search keywords, authors, or text..."
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500"
                        />
                      </div>

                      {/* Sentiment */}
                      <div>
                        <select
                          value={filterSentiment}
                          onChange={(e) => setFilterSentiment(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                        >
                          <option value="all">All Sentiments</option>
                          <option value="positive">Positive Only</option>
                          <option value="neutral">Neutral Only</option>
                          <option value="negative">Negative Only</option>
                        </select>
                      </div>

                      {/* Source */}
                      <div>
                        <select
                          value={filterSource}
                          onChange={(e) => setFilterSource(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                        >
                          <option value="all">All Sources</option>
                          {uniqueSources.map(source => (
                            <option key={source} value={source}>{source}</option>
                          ))}
                        </select>
                      </div>

                      {/* Topic */}
                      <div>
                        <select
                          value={filterTopic}
                          onChange={(e) => setFilterTopic(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                        >
                          <option value="all">All Topics</option>
                          <option value="placements">Briefcase - Placements</option>
                          <option value="fees">Dollar - Tuition/Fees</option>
                          <option value="faculty">Graduation - Faculty</option>
                          <option value="hostel life">Home - Hostel Life</option>
                          <option value="infrastructure">Building - Infrastructure</option>
                          <option value="academic quality">Activity - Academics</option>
                          <option value="admission/reputation">Radio - Reputation</option>
                        </select>
                      </div>

                    </div>

                    {/* Clear filter button if active */}
                    {(filterSearch || filterSentiment !== 'all' || filterSource !== 'all' || filterTopic !== 'all') && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            setFilterSearch('');
                            setFilterSentiment('all');
                            setFilterSource('all');
                            setFilterTopic('all');
                          }}
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reset all filters
                        </button>
                      </div>
                    )}

                    {/* Mention List Grid */}
                    <div className="space-y-5">
                      {filteredMentions.map((m) => (
                        <div 
                          key={m.id} 
                          className={`p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow duration-150 relative ${
                            m.isFlagged ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
                          }`}
                        >
                          {/* Flagged Banner */}
                          {m.isFlagged && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-2xl"></div>
                          )}

                          {/* Mention Header info */}
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg ${getSourceBadgeColor(m.source)}`}>
                                {m.source}
                              </span>
                              <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg flex items-center gap-1 ${getSentimentColor(m.sentiment)}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  m.sentiment === 'positive' ? 'bg-green-600' :
                                  m.sentiment === 'neutral' ? 'bg-slate-500' : 'bg-red-600'
                                }`}></span>
                                {m.sentiment}
                              </span>
                              <span className="text-xs text-slate-400 font-bold">
                                {m.date}
                              </span>
                              <span className="text-xs text-slate-300 font-semibold">•</span>
                              <span className="text-xs text-slate-500 font-semibold">
                                Sourced by: <span className="font-bold text-slate-700">{m.author}</span>
                              </span>
                            </div>

                            {/* Administrative action bar */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleFlagMention(m.id, m.isFlagged)}
                                title={m.isFlagged ? "Resolve flag / Lower priority" : "Escalate issue & flag as severe reputation threat"}
                                className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold ${
                                  m.isFlagged 
                                    ? 'bg-red-600 text-white border-red-700' 
                                    : 'bg-slate-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border-slate-200 text-slate-600'
                                }`}
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                {m.isFlagged ? 'Flagged / Escalated' : 'Flag Risk'}
                              </button>

                              <button
                                onClick={() => handleDeleteMention(m.id)}
                                title="Delete recorded mention"
                                className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 text-slate-450 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Mention Body */}
                          <div className="space-y-3">
                            {m.title && (
                              <h5 className="font-bold text-slate-850 text-base leading-tight">
                                {m.title}
                              </h5>
                            )}
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                              &ldquo;{m.text}&rdquo;
                            </p>
                          </div>

                          {/* Escalate reason */}
                          {m.isFlagged && m.escalationReason && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                              <p className="text-[11px] font-black text-red-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                Escalation Administrative Log:
                              </p>
                              <p className="text-xs text-red-950 font-semibold leading-relaxed">
                                {m.escalationReason}
                              </p>
                            </div>
                          )}

                          {/* Analysis metadata results block */}
                          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                                {getTopicIcon(m.primaryTopic)}
                                Topic: {m.primaryTopic}
                              </span>

                              {m.comparisons && m.comparisons.map((comp, cIdx) => (
                                <span key={cIdx} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  vs {comp}
                                </span>
                              ))}

                              {m.confidence && (
                                <span className="px-2 py-0.5 text-[10px] text-slate-400 font-bold">
                                  Confidence: {Math.round(m.confidence * 100)}%
                                </span>
                              )}
                            </div>

                            {/* View external link */}
                            {m.url && (
                              <a
                                href={m.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 underline transition-colors"
                              >
                                View Original Discussion
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          {/* AI Praises / Complaints bullets */}
                          {((m.positives && m.positives.length > 0) || (m.negatives && m.negatives.length > 0)) && (
                            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                              {m.positives && m.positives.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest flex items-center gap-1">
                                    <ThumbsUp className="w-3 h-3" />
                                    Extracted praises:
                                  </p>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {m.positives.map((p, pIdx) => (
                                      <li key={pIdx} className="text-xs text-slate-600 font-medium">{p}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {m.negatives && m.negatives.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest flex items-center gap-1">
                                    <ThumbsDown className="w-3 h-3" />
                                    Extracted complaints:
                                  </p>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {m.negatives.map((n, nIdx) => (
                                      <li key={nIdx} className="text-xs text-slate-600 font-medium">{n}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      ))}

                      {filteredMentions.length === 0 && (
                        <div className="p-12 text-center text-slate-450 text-sm font-semibold">
                          No logged mentions matched your active filter selections.
                        </div>
                      )}

                    </div>

                  </div>

                </div>
              )}


              {/* ==================== TAB 3: COMPETITIVE INTEL ==================== */}
              


              {/* ==================== TAB 4: RISK ALERTS & SIGNALS ==================== */}
              


              {/* ==================== TAB 5: PROGRAM-SPECIFIC INSIGHTS ==================== */}
              

              {/* ==================== TAB 6: AI CHAT ==================== */}
              {activeTab === 'chat' && (
                <div id="view-chat" className="h-full">
                  <ChatTab />
                </div>
              )}

              {/* ==================== TAB 7: REPORT ==================== */}
              {activeTab === 'report' && (
                <div id="view-report" className="h-full">
                  <ReportTab />
                </div>
              )}



            </>
          )}

        </div>
      </main>

    </div>
  );
}
