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
  const [activeTab, setActiveTab] = useState<'overview' | 'mentions' | 'competitors' | 'risks' | 'programs' | 'chat'>('overview');
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
            id="tab-overview-btn"
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              activeTab === 'overview' 
                ? 'bg-slate-950 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Overview Dashboard
          </button>
 
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
            id="tab-competitors-btn"
            onClick={() => setActiveTab('competitors')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              activeTab === 'competitors' 
                ? 'bg-slate-950 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Competitive Intel
          </button>
 
          <button
            id="tab-risks-btn"
            onClick={() => setActiveTab('risks')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              activeTab === 'risks' 
                ? 'bg-slate-950 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Risk Alerts & Flags
          </button>
 
          <button
            id="tab-programs-btn"
            onClick={() => setActiveTab('programs')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-150 ${
              activeTab === 'programs' 
                ? 'bg-slate-950 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Program Insights
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
              {activeTab === 'overview' && (
                <div id="view-overview" className="space-y-8 animate-fade-in">
                  
                  {/* Metric Row */}
                  <div className="grid grid-cols-4 gap-6">
                    <div id="metric-total-mentions" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Web Mentions</p>
                      <div className="flex items-end justify-between">
                        <h3 className="text-4xl font-extrabold text-slate-900 leading-none">{totalCount}</h3>
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200">
                          +15% this week
                        </span>
                      </div>
                    </div>

                    <div id="metric-sentiment-score" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Net Reputation Index</p>
                      {totalCount < 5 ? (
                        <div className="mt-2 text-slate-400 text-xs font-semibold leading-relaxed">
                          <p className="text-sm font-bold text-slate-400">Insufficient data</p>
                          <p className="text-[11px] text-slate-400">Building sample (n={totalCount}/5)</p>
                        </div>
                      ) : (
                        <div className="flex items-end justify-between">
                          <h3 className="text-4xl font-extrabold text-slate-900 leading-none">
                            {sentimentScore}
                            <span className="text-slate-400 text-sm font-medium">/100</span>
                          </h3>
                          <span className={`px-2 py-1 text-xs font-bold rounded-lg border ${
                            sentimentScore >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            sentimentScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {sentimentScore >= 70 ? 'Healthy' : sentimentScore >= 50 ? 'Monitor' : 'Critical Warning'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div id="metric-voice-share" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Regional Share of Voice</p>
                      {totalCount < 5 ? (
                        <div className="mt-2 text-slate-400 text-xs font-semibold leading-relaxed">
                          <p className="text-sm font-bold text-slate-400">Insufficient data</p>
                          <p className="text-[11px] text-slate-400">Building sample (n={totalCount}/5)</p>
                        </div>
                      ) : (
                        <div className="flex items-end justify-between">
                          <h3 className="text-4xl font-extrabold text-slate-900 leading-none">
                            {competitors.length > 0 ? Math.round((totalCount / (totalCount + 15)) * 100) : 22}%
                          </h3>
                          <span className="text-slate-400 text-xs font-bold">vs 4 competitors</span>
                        </div>
                      )}
                    </div>

                    <div id="metric-demand-signals" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Unmet Demand Signals</p>
                      <div className="flex items-end justify-between">
                        <h3 className="text-4xl font-extrabold text-slate-900 leading-none">02</h3>
                        <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
                          BSc Nursing / BPT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Grid: Topics Analysis vs AI Synthesized Feed */}
                  <div className="grid grid-cols-12 gap-8">
                    
                    {/* Left: Discussion Topic Analysis */}
                    <div id="topic-analysis-panel" className="col-span-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h4 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Sentiment Spectrum by Discussion Topic</h4>
                          <p className="text-xs text-slate-400 mt-1">Relative frequency of praise versus pain points</p>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Positive</div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div> Neutral</div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Negative</div>
                        </div>
                      </div>

                      {analysisSummary ? (
                        <div className="flex-1 space-y-6">
                          {Object.entries(analysisSummary.sentimentByTopic || {}).map(([topic, sentimentObj]: [string, any]) => {
                            const topicTotal = sentimentObj.positive + sentimentObj.neutral + sentimentObj.negative;
                            if (topicTotal === 0 && topic !== 'other') {
                              // Render placeholder metrics with a slight default or actual zeros
                              return null;
                            }
                            
                            const posPct = topicTotal > 0 ? Math.round((sentimentObj.positive / topicTotal) * 100) : 0;
                            const neuPct = topicTotal > 0 ? Math.round((sentimentObj.neutral / topicTotal) * 100) : 0;
                            const negPct = topicTotal > 0 ? Math.round((sentimentObj.negative / topicTotal) * 100) : 0;

                            return (
                              <div key={topic} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
                                  <span className="flex items-center gap-2">
                                    {getTopicIcon(topic as TopicType)}
                                    {topic}
                                  </span>
                                  <span>
                                    <span className="text-slate-600 text-xs font-bold">{posPct}% Positive (n={topicTotal})</span>
                                  </span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                                  {posPct > 0 && <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${posPct}%` }} title={`Positive: ${posPct}%`}></div>}
                                  {neuPct > 0 && <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${neuPct}%` }} title={`Neutral: ${neuPct}%`}></div>}
                                  {negPct > 0 && <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${negPct}%` }} title={`Negative: ${negPct}%`}></div>}
                                  {topicTotal === 0 && <div className="h-full bg-slate-200 w-full rounded-full" title="No mentions recorded yet"></div>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-sm">
                          Please click &quot;AI Re-Analyze&quot; above to calculate sentiment spectrums.
                        </div>
                      )}

                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex gap-3 items-start">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-600 leading-relaxed">
                            <span className="font-bold text-red-700">Emerging Risk Indicator:</span> Hostel-related complaints are concentrated in Quora and Reddit, focusing on the laundry/Wi-Fi quality and the mess menu. Conversely, Placements and Tuition ROI maintain an excellent positive feedback gap over competitors.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Synthesized AI Intelligence Feed */}
                    <div id="synthesized-feed-panel" className="col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                      <div className="mb-4">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-sm">Continuous Pulse Feed</h4>
                        <p className="text-xs text-slate-400 mt-1">Significant web alerts curated automatically</p>
                      </div>

                      <div className="space-y-4 overflow-y-auto max-h-[360px] pr-1">
                        {mentions.slice(0, 3).map((m, idx) => {
                          const isWarning = m.sentiment === 'negative' || m.isFlagged;
                          const isWin = m.sentiment === 'positive';
                          
                          return (
                            <div 
                              key={m.id || idx} 
                              className={`p-3.5 rounded-xl border-l-4 transition-transform hover:-translate-x-1 duration-150 cursor-pointer ${
                                isWarning ? 'bg-red-50/70 border-red-600 border' :
                                isWin ? 'bg-green-50/70 border-green-600 border' :
                                'bg-blue-50/70 border-blue-600 border'
                              }`}
                              onClick={() => {
                                setActiveTab('mentions');
                                setFilterSearch(m.author);
                              }}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase text-white ${
                                  isWarning ? 'bg-red-600' :
                                  isWin ? 'bg-green-600' :
                                  'bg-blue-600'
                                }`}>
                                  {isWarning ? 'RISK ALERT' : isWin ? 'BRAND WIN' : 'SIGNAL'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">{m.source} • {m.date}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-850 mb-1 line-clamp-1">{m.title || 'User Discussion Mention'}</p>
                              <p className="text-[11px] text-slate-650 line-clamp-2 leading-normal">{m.text}</p>
                            </div>
                          );
                        })}

                        {mentions.length === 0 && (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            No mentions logged. Try triggering an active internet scan above!
                          </div>
                        )}
                      </div>

                      <button
                        id="view-all-mentions-btn"
                        onClick={() => setActiveTab('mentions')}
                        className="mt-4 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition-colors"
                      >
                        Browse All Scanned Mentions ({mentions.length})
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Strategic Action Recommendations Grid */}
                  <div id="strategic-recommendations-panel" className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="font-extrabold text-slate-800 tracking-tight text-lg flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-red-600" />
                          AI-Generated Strategic Recommendations
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Calculated directly from gathered online conversations and competitors&apos; pricing parameters
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-red-50 text-red-600 font-black text-xs rounded-full border border-red-200">
                        DECISION-READY
                      </span>
                    </div>

                    {analysisSummary?.strategicRecommendations && analysisSummary.strategicRecommendations.length > 0 ? (
                      <div className="grid grid-cols-3 gap-6">
                        {analysisSummary.strategicRecommendations.map((rec) => (
                          <div key={rec.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className={`text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-full uppercase ${
                                  rec.impact === 'high' ? 'bg-red-100 text-red-800 border border-red-200' :
                                  'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {rec.impact} Impact
                                </span>
                                <span className="text-[11px] text-slate-400 font-bold">Pulse Engine • 2026</span>
                              </div>
                              <h5 className="font-bold text-slate-850 text-sm mb-2">{rec.title}</h5>
                              <p className="text-xs text-slate-600 leading-relaxed mb-4">{rec.description}</p>
                            </div>

                            <div className="pt-4 border-t border-slate-200/60">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Action Checklist</p>
                              <div className="space-y-2">
                                {rec.actionableItems.map((item, idx) => {
                                  const itemId = `${rec.id}-${idx}`;
                                  const isChecked = !!checkedActionItems[itemId];
                                  return (
                                    <div 
                                      key={idx} 
                                      onClick={() => handleToggleActionItem(itemId)}
                                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                                        isChecked ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-200/50'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-colors border shrink-0 ${
                                        isChecked ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white border-slate-300'
                                      }`}>
                                        {isChecked && <Check className="w-3 h-3" />}
                                      </div>
                                      <span className={`text-xs ${isChecked ? 'line-through text-slate-500 font-medium' : 'text-slate-700 font-semibold'}`}>
                                        {item}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        No strategic recommendations synthesized. Click &quot;AI Re-Analyze&quot; above to prompt Gemini.
                      </div>
                    )}
                  </div>

                </div>
              )}


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
                          <option value="Reddit">Reddit</option>
                          <option value="Quora">Quora</option>
                          <option value="YouTube">YouTube</option>
                          <option value="CollegeDunia">CollegeDunia</option>
                          <option value="News & Blogs">News & Blogs</option>
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
              {activeTab === 'competitors' && (
                <div id="view-competitors" className="space-y-8 animate-fade-in">
                  
                  {/* Competitor Manager */}
                  <div className="grid grid-cols-12 gap-8 items-start">
                    
                    {/* Add rival college form */}
                    <div className="col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">Track New Competitor</h4>
                      <p className="text-xs text-slate-500 mb-4">
                        Add regional competitor colleges to calculate comparative net-sentiment indexes dynamically.
                      </p>

                      <form onSubmit={handleAddCompetitor} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-650 uppercase">University Full Name</label>
                          <input
                            type="text"
                            required
                            value={newCompName}
                            onChange={(e) => setNewCompName(e.target.value)}
                            placeholder="e.g. NIMS University Jaipur"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-650 uppercase">Acronym / Short Name</label>
                          <input
                            type="text"
                            required
                            value={newCompShort}
                            onChange={(e) => setNewCompShort(e.target.value)}
                            placeholder="e.g. NIMS"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-650 uppercase">Website URL</label>
                          <input
                            type="url"
                            value={newCompWeb}
                            onChange={(e) => setNewCompWeb(e.target.value)}
                            placeholder="e.g. https://nimsuniversity.org"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add to Monitored List
                        </button>
                      </form>
                    </div>

                    {/* Competitor list */}
                    <div className="col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">Monitored Rival Colleges</h4>
                      <p className="text-xs text-slate-500 mb-4">
                        Actively scanned in student placement and pricing discussion loops.
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        {competitors.map((comp) => {
                          // Calculate mention share
                          const mentionCount = mentions.filter(m => m.comparisons && m.comparisons.includes(comp.name)).length;
                          return (
                            <div key={comp.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-start">
                              <div>
                                <h5 className="font-bold text-slate-800 text-sm">{comp.name}</h5>
                                <p className="text-xs text-slate-450 mt-0.5">Short name: <span className="font-bold text-slate-650">{comp.shortName}</span></p>
                                
                                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-slate-500">
                                  <MessageSquare className="w-3.5 h-3.5 text-red-600" />
                                  <span>{mentionCount} co-mentions logged</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-3">
                                <button
                                  onClick={() => handleDeleteCompetitor(comp.id)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50/50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                {comp.website && (
                                  <a
                                    href={comp.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                                  >
                                    Visit
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {competitors.length === 0 && (
                          <div className="col-span-2 p-8 text-center text-slate-400 text-xs font-semibold">
                            No competitors added yet. Use the sidebar or left panel form to add.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Net Sentiment Comparison Matrix */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="mb-6 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-850 text-base">Competitor Net Sentiment Alignment Matrix</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Relative net favorability index (Calculated from: [Positive - Negative] / Total) compared with JECRC baseline
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs font-bold">
                        <span className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded">JECRC Dominating</span>
                        <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded">Rival Dominating</span>
                      </div>
                    </div>

                    {analysisSummary?.competitorComparisonMatrix ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-600 text-xs font-bold uppercase tracking-wider">
                              <th className="p-4">Monitored College Name</th>
                              <th className="p-4">Net Sentiment Index</th>
                              <th className="p-4">Co-Mentions Count</th>
                              <th className="p-4">Confidence Tier</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150">
                            {/* JECRC baseline row */}
                            <tr className="bg-slate-900/5 font-semibold">
                              <td className="p-4 flex items-center gap-2 font-extrabold text-slate-900">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                JECRC University (Baseline)
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-1 rounded font-bold bg-green-50 text-green-700 border border-green-150">
                                  +0.59
                                </span>
                              </td>
                              <td className="p-4 text-slate-600 font-bold">{totalCount} mentions</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                  totalCount >= 5 ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {totalCount >= 5 ? 'High Confidence' : 'Building Sample'}
                                </span>
                              </td>
                            </tr>

                            {/* Competitor rows */}
                            {Object.entries(analysisSummary.competitorComparisonMatrix).map(([compName, metrics]: [string, any]) => {
                              const compObj = competitors.find(c => c.name === compName || c.shortName === compName);
                              const mentionCount = compObj ? mentions.filter(m => 
                                m.text.toLowerCase().includes(compObj.name.toLowerCase()) || 
                                m.text.toLowerCase().includes(compObj.shortName.toLowerCase())
                              ).length : 2;
                              
                              const avgSentiment = (metrics.placements + metrics.fees + metrics.infrastructure + metrics.faculty) / 4;
                              const formatVal = (val: number) => {
                                const sign = val >= 0 ? '+' : '';
                                return `${sign}${val.toFixed(2)}`;
                              };

                              return (
                                <tr key={compName} className="hover:bg-slate-50/50 text-xs text-slate-700 font-semibold">
                                  <td className="p-4 font-bold text-slate-850">{compName}</td>
                                  <td className="p-4">
                                    <span className={`px-2 py-1 rounded font-bold ${
                                      avgSentiment >= 0.2 ? 'bg-green-50 text-green-700 border border-green-150' : 
                                      avgSentiment < -0.1 ? 'bg-red-50 text-red-700 border-red-150' :
                                      'bg-amber-50 text-amber-700 border-amber-150'
                                    }`}>
                                      {formatVal(avgSentiment)}
                                    </span>
                                  </td>
                                  <td className="p-4 text-slate-600 font-bold">{mentionCount} {mentionCount === 1 ? 'mention' : 'mentions'}</td>
                                  <td className="p-4">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                      mentionCount >= 5 ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {mentionCount >= 5 ? 'High Confidence' : 'Building Sample'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        Matrix data not calculated. Use the AI Re-Analyze tool above.
                      </div>
                    )}
                  </div>

                  {/* Listening Keyword Manager */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="font-bold text-slate-850 text-sm uppercase tracking-wider">Listening Keywords listen-list</h4>
                        <p className="text-xs text-slate-500 mt-0.5">These query phrases guide our real-time pulse search parameters</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                      
                      {/* Form */}
                      <form onSubmit={handleAddKeyword} className="col-span-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase">Listen Phrase</label>
                          <input 
                            type="text"
                            required
                            value={newKeywordText}
                            onChange={(e) => setNewKeywordText(e.target.value)}
                            placeholder="e.g. JECRC admission criteria"
                            className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 uppercase">Category Category</label>
                          <select
                            value={newKeywordCategory}
                            onChange={(e) => setNewKeywordCategory(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                          >
                            <option value="brand">Brand Terms</option>
                            <option value="competitor">Competitor Colleges</option>
                            <option value="program">Healthcare/Program Request</option>
                            <option value="general">General Reputation</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Listen Word
                        </button>
                      </form>

                      {/* Keyword tags list */}
                      <div className="col-span-8 flex flex-wrap gap-2.5 content-start">
                        {keywords.map(kw => {
                          const getCatColor = (cat: string) => {
                            switch (cat) {
                              case 'brand': return 'bg-red-50 text-red-700 border-red-200';
                              case 'competitor': return 'bg-blue-50 text-blue-700 border-blue-200';
                              case 'program': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                              default: return 'bg-slate-100 text-slate-700 border-slate-200';
                            }
                          };

                          return (
                            <span 
                              key={kw.id} 
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${getCatColor(kw.category)}`}
                            >
                              <span>{kw.text}</span>
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">({kw.category})</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteKeyword(kw.id)}
                                className="text-slate-400 hover:text-red-600 transition-colors"
                              >
                                &times;
                              </button>
                            </span>
                          );
                        })}
                      </div>

                    </div>
                  </div>

                </div>
              )}


              {/* ==================== TAB 4: RISK ALERTS & SIGNALS ==================== */}
              {activeTab === 'risks' && (
                <div id="view-risks" className="space-y-8 animate-fade-in">
                  
                  {/* Risks Header Alert Stats */}
                  <div className="p-6 bg-red-950 text-red-50 rounded-2xl border border-red-900 shadow-sm flex items-center justify-between gap-6">
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold tracking-tight uppercase text-red-200 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-400" />
                        Crisis Reputation & Flagged alerts Panel
                      </h4>
                      <p className="text-xs text-red-300 leading-relaxed max-w-2xl font-semibold">
                        This view isolates negative online reviews, serious complaints about facilities, and pricing escalations that require immediate university intervention. Address these to prevent wider student represents.
                      </p>
                    </div>

                    <div className="bg-red-900/60 p-4 rounded-xl border border-red-800 text-center shrink-0">
                      <span className="block text-3xl font-black text-red-300 leading-none">{flaggedMentionsCount}</span>
                      <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider mt-1.5 block">Active Alerts</span>
                    </div>
                  </div>

                  {/* Isolated Risk Stream */}
                  <div className="space-y-5">
                    {mentions.filter(m => m.isFlagged).map((m) => (
                      <div key={m.id} className="p-6 rounded-2xl border border-red-200 bg-white shadow-sm hover:shadow-md transition-shadow relative">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-2xl"></div>

                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-200 rounded-lg">
                              {m.source}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">
                              {m.date}
                            </span>
                            <span className="text-xs text-slate-300 font-semibold">•</span>
                            <span className="text-xs text-slate-500 font-semibold">
                              Sourced from: <span className="font-bold text-slate-700">{m.author}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleFlagMention(m.id, m.isFlagged)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm shadow-emerald-600/10"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              De-Escalate / Resolve Risk
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-bold text-slate-850 text-base leading-tight flex items-center gap-2 text-red-900">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            {m.title || 'Escalated Reputational Issue'}
                          </h5>
                          <p className="text-xs text-slate-750 font-semibold leading-relaxed">
                            &ldquo;{m.text}&rdquo;
                          </p>
                        </div>

                        {/* Escalation Administrative Log Box */}
                        {m.escalationReason && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest mb-1">
                              Escalation details:
                            </p>
                            <p className="text-xs text-red-950 font-semibold leading-relaxed">
                              {m.escalationReason}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold uppercase tracking-wide">
                            Topic: {m.primaryTopic}
                          </span>

                          {m.url && (
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-red-600 hover:text-red-700 flex items-center gap-1 underline transition-colors"
                            >
                              Go to original complaint
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}

                    {flaggedMentionsCount === 0 && (
                      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                        <h5 className="font-bold text-slate-800 text-sm">All Clear! No Active Risks Flagged</h5>
                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                          Excellent work. There are no major hostel fee, infrastructure, or student reprisal warnings logged right now.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Paramedical Healthcare Demand Signals section */}
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <h4 className="font-extrabold text-slate-850 tracking-tight text-lg flex items-center gap-2">
                          <Sliders className="w-5 h-5 text-red-600" />
                          Unmet Program Demand Signals
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Synthesized from internet search trends and repetitive queries (e.g. Paramedical, Physiotherapy, BSc Nursing)
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-200">
                        NEW REVENUE GENERATION
                      </span>
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-4 items-start">
                      <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-blue-900 leading-normal">
                          Opportunities Identified: BSc Nursing & BPT (Physiotherapy)
                        </p>
                        <p className="text-xs text-blue-800 leading-relaxed font-semibold">
                          Multiple forum posts and chat queries reflect regional demand. JECRC has the medical labs and brand presence to capture these segments easily, bypassing the need for students to choose regional competitors like Jaipur National University or NIMS.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}


              {/* ==================== TAB 5: PROGRAM-SPECIFIC INSIGHTS ==================== */}
              {activeTab === 'programs' && (
                <div id="view-programs" className="space-y-8 animate-fade-in">
                  
                  {/* Programs Header Banner */}
                  <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700/50 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    
                    <div className="relative z-10 space-y-2 max-w-3xl">
                      <span className="px-3 py-1 bg-red-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/30">
                        Academic Analytics
                      </span>
                      <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-red-500" />
                        Program-Specific Reputational Insights
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        Analyze student sentiment, discussion volume, and competitive positioning isolated by academic departments. Tagging mentions helps you monitor how your computer science placements or physiotherapy OPD compare against major regional competitors.
                      </p>
                    </div>
                  </div>

                  {/* Program Selector Pills */}
                  <div className="flex flex-wrap gap-2.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                    {["Computer Science", "Mechanical Engineering", "Civil Engineering", "MBA", "BSc Nursing", "BPT (Physiotherapy)"].map((prog) => {
                      const isSelected = selectedProgram === prog;
                      return (
                        <button
                          key={prog}
                          onClick={() => setSelectedProgram(prog)}
                          className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'bg-red-600 text-white shadow-md shadow-red-600/15'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                        >
                          {prog}
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Department Stats Cards */}
                  {(() => {
                    const progSentiment = analysisSummary?.sentimentByProgram?.[selectedProgram] || { positive: 0, neutral: 0, negative: 0 };
                    const progTopics = analysisSummary?.topicDistributionByProgram?.[selectedProgram] || { placements: 0, fees: 0, faculty: 0, 'hostel life': 0, infrastructure: 0, 'academic quality': 0, 'admission/reputation': 0, other: 0 };
                    const progMatrix = analysisSummary?.competitorComparisonMatrixByProgram?.[selectedProgram] || {};
                    const progMentions = mentions.filter(m => m.program === selectedProgram);
                    const progTotalMentions = progMentions.length;

                    // Calculate positive sentiment rate
                    const totalSents = progSentiment.positive + progSentiment.neutral + progSentiment.negative;
                    const posRate = totalSents > 0 ? Math.round((progSentiment.positive / totalSents) * 100) : 0;
                    const negRate = totalSents > 0 ? Math.round((progSentiment.negative / totalSents) * 100) : 0;

                    // Find most discussed topic for this program
                    let maxTopic: TopicType = 'placements';
                    let maxVal = -1;
                    (Object.keys(progTopics) as TopicType[]).forEach((t) => {
                      if (progTopics[t] > maxVal) {
                        maxVal = progTopics[t];
                        maxTopic = t;
                      }
                    });

                    return (
                      <div className="space-y-8">
                        
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                            <div className="p-4 bg-slate-50 text-slate-700 border border-slate-100 rounded-2xl">
                              <MessageSquare className="w-6 h-6" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-2xl font-black text-slate-800">{progTotalMentions}</span>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Department Mentions</span>
                            </div>
                          </div>

                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                            <div className={`p-4 rounded-2xl border ${posRate >= 60 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                              <Sparkles className="w-6 h-6" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-2xl font-black text-slate-800">{posRate}%</span>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Positive Sentiment Index</span>
                            </div>
                          </div>

                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                            <div className="p-4 bg-slate-50 text-slate-700 border border-slate-100 rounded-2xl">
                              <Sliders className="w-6 h-6" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-base font-black text-slate-800 uppercase tracking-tight truncate max-w-[200px] block">{maxTopic}</span>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Primary Topic of Discussion</span>
                            </div>
                          </div>

                        </div>

                        {/* Sentiment and Topic Distribution Dual Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          
                          {/* Left: Sentiment Analysis Spectrum */}
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <div>
                              <h4 className="font-extrabold text-slate-850 tracking-tight text-sm">Department Sentiment Spectrum</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Detailed breakdown of emotional stance specific to {selectedProgram}</p>
                            </div>

                            {totalSents > 0 ? (
                              <div className="space-y-6">
                                {/* Tri-color continuous progress bar */}
                                <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100">
                                  <div style={{ width: `${posRate}%` }} className="bg-emerald-500 h-full transition-all" title={`Positive: ${posRate}%`}></div>
                                  <div style={{ width: `${100 - posRate - negRate}%` }} className="bg-slate-300 h-full transition-all" title={`Neutral: ${100 - posRate - negRate}%`}></div>
                                  <div style={{ width: `${negRate}%` }} className="bg-red-500 h-full transition-all" title={`Negative: ${negRate}%`}></div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <span className="block text-lg font-black text-emerald-700">{progSentiment.positive}</span>
                                    <span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Positive ({posRate}%)</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="block text-lg font-black text-slate-600">{progSentiment.neutral}</span>
                                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Neutral ({100 - posRate - negRate}%)</span>
                                  </div>
                                  <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                    <span className="block text-lg font-black text-red-700">{progSentiment.negative}</span>
                                    <span className="text-[9px] uppercase font-bold text-red-600 tracking-wider">Negative ({negRate}%)</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="py-8 text-center text-xs text-slate-400 font-semibold italic">
                                No sentiment metrics recorded yet. Synthesize or log a mention to populate.
                              </div>
                            )}
                          </div>

                          {/* Right: Topic Distribution Progress List */}
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <div>
                              <h4 className="font-extrabold text-slate-850 tracking-tight text-sm">Discussion Topic Concentration</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Where the conversation centers most for {selectedProgram}</p>
                            </div>

                            <div className="space-y-4">
                              {(Object.keys(progTopics) as TopicType[]).map((topic) => {
                                const count = progTopics[topic] || 0;
                                // Find highest program topic count for scaling
                                const maxProgTopicVal = Math.max(...(Object.values(progTopics) as number[])) || 1;
                                const barPercent = Math.min(Math.round((count / maxProgTopicVal) * 100), 100);

                                return (
                                  <div key={topic} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold">
                                      <span className="text-slate-700 uppercase tracking-wide text-[10px]">{topic}</span>
                                      <span className="text-slate-500">{count} {count === 1 ? 'mention' : 'mentions'}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        style={{ width: `${barPercent}%` }} 
                                        className="h-full bg-slate-800 rounded-full transition-all duration-300"
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>

                        {/* Program-Specific Competitor Comparison Matrix */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-extrabold text-slate-850 tracking-tight text-sm">Department Competitive positioning matrix</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">JECRC advantage vs. rival institutions for the {selectedProgram} program</p>
                            </div>
                            <span className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-black rounded-lg border border-red-100 uppercase tracking-wider">
                              Department Specific
                            </span>
                          </div>

                          <div className="overflow-x-auto border border-slate-100 rounded-xl">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 text-slate-400 font-extrabold border-b border-slate-100 uppercase text-[9px] tracking-wider">
                                  <th className="py-4 px-6 font-black">Competitor University</th>
                                  <th className="py-4 px-6 text-center">Placements ROI</th>
                                  <th className="py-4 px-6 text-center">Fee Pricing</th>
                                  <th className="py-4 px-6 text-center">Infrastructure</th>
                                  <th className="py-4 px-6 text-center">Faculty Quality</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {competitors.map((comp) => {
                                  const compScores = progMatrix[comp.name] || { placements: 0.5, fees: 0.5, infrastructure: -0.2, faculty: 0.2 };
                                  
                                  const renderMatrixCell = (val: number) => {
                                    const percent = Math.round(((val + 1) / 2) * 100);
                                    let badgeColor = "text-slate-600 bg-slate-50 border-slate-200";
                                    let textLabel = "Neutral";
                                    if (val > 0.3) {
                                      badgeColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
                                      textLabel = "JECRC Advantaged";
                                    } else if (val < -0.3) {
                                      badgeColor = "text-red-700 bg-red-50 border-red-100";
                                      textLabel = "Competitor Advantaged";
                                    }
                                    return (
                                      <div className="flex flex-col items-center gap-1 py-1">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}>
                                          {textLabel}
                                        </span>
                                        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                                          <div style={{ width: `${percent}%` }} className={`h-full ${val > 0.3 ? 'bg-emerald-500' : val < -0.3 ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                        </div>
                                      </div>
                                    );
                                  };

                                  return (
                                    <tr key={comp.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="py-4 px-6 font-bold text-slate-800">
                                        <div>{comp.name}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">Short: {comp.shortName}</div>
                                      </td>
                                      <td className="py-4 px-6">{renderMatrixCell(compScores.placements)}</td>
                                      <td className="py-4 px-6">{renderMatrixCell(compScores.fees)}</td>
                                      <td className="py-4 px-6">{renderMatrixCell(compScores.infrastructure)}</td>
                                      <td className="py-4 px-6">{renderMatrixCell(compScores.faculty)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Program Specific Mentions stream */}
                        <div className="space-y-5">
                          <div className="flex justify-between items-center">
                            <h4 className="font-extrabold text-slate-850 tracking-tight text-sm">Isolated Reputational Mentions Stream for {selectedProgram}</h4>
                            <span className="text-xs text-slate-400 font-bold">{progTotalMentions} Records Found</span>
                          </div>

                          <div className="space-y-4">
                            {progMentions.map((m) => {
                              const isPos = m.sentiment === 'positive';
                              const isNeg = m.sentiment === 'negative';
                              const sentimentBadge = isPos
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                : isNeg
                                ? 'bg-red-50 text-red-800 border-red-100'
                                : 'bg-slate-50 text-slate-800 border-slate-150';

                              return (
                                <div key={m.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative">
                                  {m.isFlagged && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 rounded-t-2xl"></div>}
                                  
                                  <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-1 text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
                                        {m.source}
                                      </span>
                                      <span className="text-xs text-slate-400 font-bold">
                                        {m.date}
                                      </span>
                                      <span className="text-xs text-slate-300 font-semibold">•</span>
                                      <span className="text-xs text-slate-500 font-semibold">
                                        User: <span className="font-bold text-slate-700">{m.author}</span>
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${sentimentBadge}`}>
                                        {m.sentiment}
                                      </span>
                                      {m.isFlagged && (
                                        <span className="px-2.5 py-1 text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-200 rounded-lg animate-pulse">
                                          Escalated Alert
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h5 className="font-bold text-slate-850 text-sm leading-tight">
                                      {m.title || 'Discussion Post'}
                                    </h5>
                                    <p className="text-xs text-slate-650 font-medium leading-relaxed italic">
                                      &ldquo;{m.text}&rdquo;
                                    </p>
                                  </div>

                                  {m.summary && (
                                    <div className="mt-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                        AI Summary translation:
                                      </p>
                                      <p className="text-xs text-slate-700 font-semibold">
                                        {m.summary}
                                      </p>
                                    </div>
                                  )}

                                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wide">
                                      Topic: {m.primaryTopic}
                                    </span>

                                    {m.url && (
                                      <a
                                        href={m.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                                      >
                                        Go to original source
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {progTotalMentions === 0 && (
                              <div className="bg-slate-50 p-12 rounded-2xl border border-dashed border-slate-350 text-center space-y-2">
                                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                                <h5 className="font-bold text-slate-700 text-xs">No Direct Mentions for {selectedProgram} Yet</h5>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                  There are no specific student complaints or praises logged for this department yet. Run an internet scan or log a manual post above to track.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })()}

                </div>
              )}

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
