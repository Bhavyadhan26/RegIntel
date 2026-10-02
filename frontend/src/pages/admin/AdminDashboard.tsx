import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  fetchAdminRunLogs, fetchAdminSources, fetchAdminData, fetchAdminSelectors,
  saveAdminSource, deleteAdminSource, saveAdminSelector, deleteAdminSelector,
  fetchAdminFeedback, fetchAdminProfessions, fetchAdminUsers, saveAdminUser
  , fetchPendingSummaryCounts, fetchAdminPipelineStatus, stopAdminScraper
} from '@/lib/api/admin';
import { SCRAPER_BASE_URL, apiFetch } from '@/lib/api';
import type { 
  AdminRun, AdminSource, AdminDataRow, AdminSelector, 
  AdminUserFeedback, AdminProfessionalCategory, AdminUser 
} from '@/lib/api/admin';
import { 
  Search, Download, Plus, Trash2, Edit2, PlayCircle, Settings, Users, MessageSquare, Database, 
  Globe, Activity, RefreshCw, ChevronDown, ChevronUp, ChevronRight
} from 'lucide-react';

type TabType = 'overview' | 'sources' | 'data' | 'runs' | 'feedback' | 'users';
const currentDateFilter = new Date().toISOString().slice(0, 10);

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Data States
  const [runs, setRuns] = useState<AdminRun[]>([]);
  const [sources, setSources] = useState<AdminSource[]>([]);
  const [selectors, setSelectors] = useState<AdminSelector[]>([]);
  const [dataRows, setDataRows] = useState<AdminDataRow[]>([]);
  const [dataSearch, setDataSearch] = useState('');
  const [dataWebsite, setDataWebsite] = useState('');
  const [dataCategory, setDataCategory] = useState('');
  const [dataProcessed, setDataProcessed] = useState('');
  const [dataOrdering, setDataOrdering] = useState('-created_at');
  const [dataPage, setDataPage] = useState(1);
  const [dataHasMore, setDataHasMore] = useState(false);
  const [dataTotal, setDataTotal] = useState(0);
  const [dataLoadingMore, setDataLoadingMore] = useState(false);
  const dataSentinelRef = useRef<HTMLTableRowElement | null>(null);
  const [feedback, setFeedback] = useState<AdminUserFeedback[]>([]);
  const [professions, setProfessions] = useState<AdminProfessionalCategory[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingSummaries, setPendingSummaries] = useState<Record<string, number>>({});
  const [pendingSummaryTotal, setPendingSummaryTotal] = useState(0);
  const [pipelineStatus, setPipelineStatus] = useState<Awaited<ReturnType<typeof fetchAdminPipelineStatus>> | null>(null);
  const [stoppingRun, setStoppingRun] = useState(false);
  const [activityStartedAt, setActivityStartedAt] = useState<number | null>(null);
  const [refreshingTab, setRefreshingTab] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [summaryDialogWebsite, setSummaryDialogWebsite] = useState<string | undefined>();
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [summaryLimitInput, setSummaryLimitInput] = useState('50');
  const [summaryDialogMax, setSummaryDialogMax] = useState(0);
  const loadedTabsRef = useRef<Record<string, boolean>>({});
  const dataLoadedRef = useRef(false);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [runWebsiteFilters, setRunWebsiteFilters] = useState<string[]>([]);
  const [runStartDate, setRunStartDate] = useState(currentDateFilter);
  const [runEndDate, setRunEndDate] = useState(currentDateFilter);
  const [websiteFilterOpen, setWebsiteFilterOpen] = useState(false);
  
  // Modal / Expanded State
  const [editingSource, setEditingSource] = useState<AdminSource | Partial<AdminSource> | null>(null);
  const [editingSelector, setEditingSelector] = useState<AdminSelector | Partial<AdminSelector> | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const [expandedSource, setExpandedSource] = useState<number | null>(null);

  const toggleSourceActive = async (source: AdminSource) => {
    try {
      const updated = await saveAdminSource(source.id, { ...source, active: !source.active });
      setSources(prev => prev.map(s => s.id === source.id ? updated : s));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const toggleAllSources = async (targetActive: boolean) => {
    if (!window.confirm(`Are you sure you want to mark all sources as ${targetActive ? 'active' : 'inactive'}?`)) return;
    try {
      const promises = sources.map(s => {
        if (s.active !== targetActive) {
          return saveAdminSource(s.id, { ...s, active: targetActive });
        }
        return Promise.resolve(s);
      });
      const updatedSources = await Promise.all(promises);
      setSources(updatedSources);
    } catch (err) {
      alert("Failed to update some sources");
      loadData();
    }
  };

  const loadData = useCallback(async (force = false) => {
    setLoading(true);
    try {
      if (activeTab === 'overview' || activeTab === 'sources') {
        if (force || !loadedTabsRef.current.sources) {
          const resSources = await fetchAdminSources();
          setSources(resSources);
          const pending = await fetchPendingSummaryCounts();
          setPendingSummaries(pending.by_website);
          setPendingSummaryTotal(pending.total);
          loadedTabsRef.current.sources = true;
        }
        if (activeTab === 'sources' && (force || !loadedTabsRef.current.selectors)) {
          const resSelectors = await fetchAdminSelectors();
          setSelectors(resSelectors);
          loadedTabsRef.current.selectors = true;
        }
      }
      if (activeTab === 'runs' || activeTab === 'overview') {
        if (force || !loadedTabsRef.current.runs) {
          const res = await fetchAdminRunLogs();
          setRuns(res);
          loadedTabsRef.current.runs = true;
        }
      } 
      if (activeTab === 'feedback') {
        if (force || !loadedTabsRef.current.feedback) {
          const res = await fetchAdminFeedback();
          setFeedback(res);
          loadedTabsRef.current.feedback = true;
        }
      } 
      if (activeTab === 'users') {
        if (force || !loadedTabsRef.current.users) {
          const resP = await fetchAdminProfessions();
          setProfessions(resP);
          const resU = await fetchAdminUsers();
          setUsers(resU);
          loadedTabsRef.current.users = true;
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [activeTab]);

  const loadDataPage = useCallback(async (page: number, append: boolean) => {
    if (append) setDataLoadingMore(true);
    try {
      const response = await fetchAdminData({
        page,
        page_size: 50,
        search: dataSearch,
        website: dataWebsite,
        category: dataCategory,
        processed: dataProcessed,
        ordering: dataOrdering,
      });
      setDataRows(prev => append ? [...prev, ...response.results] : response.results);
      setDataPage(response.page);
      setDataHasMore(response.has_more);
      setDataTotal(response.total);
      if (!append) dataLoadedRef.current = true;
    } catch (err) {
      console.error(err);
    } finally {
      if (append) setDataLoadingMore(false);
    }
  }, [dataSearch, dataWebsite, dataCategory, dataProcessed, dataOrdering]);

  useEffect(() => {
    if (activeTab === 'data' && !dataLoadedRef.current) void loadDataPage(1, false);
  }, [activeTab, loadDataPage]);

  useEffect(() => {
    if (activeTab !== 'runs' && activeTab !== 'overview') return;
    let disposed = false;
    const refreshPipeline = async () => {
      try {
        const [status, pending, logs] = await Promise.all([
          fetchAdminPipelineStatus(),
          fetchPendingSummaryCounts(),
          fetchAdminRunLogs(),
        ]);
        if (disposed) return;
        setPipelineStatus(status);
        setPendingSummaryTotal(pending.total);
        setPendingSummaries(pending.by_website);
        setRuns(logs);
        const completedTriggeredRun = activityStartedAt
          && status.run
          && new Date(status.run.started_at).getTime() >= activityStartedAt
          && !['running', 'queued'].includes(status.run.status);
        if (completedTriggeredRun) {
          setActivityStartedAt(null);
          dataLoadedRef.current = false;
          loadedTabsRef.current.runs = true;
        }
      } catch (error) {
        console.error(error);
      }
    };
    void refreshPipeline();
    const timer = window.setInterval(refreshPipeline, activityStartedAt ? 3000 : 120000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [activeTab, activityStartedAt, loadData, loadDataPage]);

  useEffect(() => {
    if (activeTab !== 'data' || !dataHasMore || dataLoadingMore) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting) void loadDataPage(dataPage + 1, true);
    }, { rootMargin: '320px' });
    const sentinel = dataSentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, dataHasMore, dataLoadingMore, dataPage, loadDataPage]);

  useEffect(() => {
    setSearchTerm(""); // Reset search when switching tabs
    void loadData();
  }, [loadData]);

  // Export Feedback to CSV
  const exportFeedbackCSV = () => {
    if (!feedback.length) return alert("No feedback to export.");
    const headers = ["Full Name", "User Email", "Stars", "Type", "Message", "Created At"];
    const rows = feedback.map(f => [
      `"${f.full_name.replace(/"/g, '""')}"`,
      `"${f.user_email}"`,
      f.star_rating,
      `"${f.type_of_feedback}"`,
      `"${f.message.replace(/"/g, '""')}"`,
      `"${new Date(f.created_at).toLocaleString()}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "user_feedback.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CRUD Handlers
  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource) return;
    try {
      await saveAdminSource(editingSource.id ? editingSource.id : null, editingSource);
      setEditingSource(null);
      void loadData(true);
    } catch {
      alert("Failed to save source");
    }
  };

  const handleDeleteSource = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteAdminSource(id);
      void loadData();
    } catch {
      alert("Failed to delete");
    }
  };

  const handleSaveSelector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSelector) return;
    try {
      await saveAdminSelector(editingSelector.id ? editingSelector.id : null, editingSelector);
      setEditingSelector(null);
      void loadData();
    } catch {
      alert("Failed to save selector");
    }
  };

  const handleDeleteSelector = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteAdminSelector(id);
      void loadData();
    } catch {
      alert("Failed to delete");
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await saveAdminUser(editingUser.id, editingUser);
      setEditingUser(null);
      void loadData();
    } catch (err) {
      alert("Failed to update user");
    }
  };

  const triggerRun = async (websiteName?: string, skipSummary = false, summaryOnly = false, summaryLimit?: number) => {
    try {
      const params = new URLSearchParams();
      if (websiteName) params.set('website', websiteName);
      if (skipSummary) params.set('skip_summary', 'true');
      if (summaryOnly) params.set('summary_only', 'true');
      if (summaryLimit) params.set('summary_limit', String(summaryLimit));
      const query = params.toString();
      const url = `${SCRAPER_BASE_URL}/trigger/${query ? `?${query}` : ''}`;
      const res = await apiFetch(url.replace(SCRAPER_BASE_URL, ''), {
        method: 'POST',
      }, SCRAPER_BASE_URL);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.detail || payload.message || `Trigger failed (${res.status})`);
      }
      setActiveTab('runs');
      setActivityStartedAt(Date.now());
      void loadData(true);
      setActionNotice({
        type: 'success',
        message: summaryOnly
          ? `Summary processing started${summaryLimit ? ` for ${summaryLimit} row${summaryLimit === 1 ? '' : 's'}` : ''}. Live progress is now being tracked.`
          : skipSummary ? 'Scrape-only activity started. Live progress is now being tracked.' : 'Scrape and summary activity started. Live progress is now being tracked.',
      });
    } catch (err) {
      setActionNotice({ type: 'error', message: err instanceof Error ? err.message : 'Failed to trigger scraper run.' });
    }
  };

  const triggerSummaryRetry = (websiteName?: string) => {
    const available = websiteName ? (pendingSummaries[websiteName] || 0) : pendingSummaryTotal;
    setSummaryDialogWebsite(websiteName);
    setSummaryDialogMax(available);
    setSummaryLimitInput(String(Math.min(50, available)));
    setSummaryDialogOpen(true);
  };

  const submitSummaryRetry = async () => {
    const limit = Number.parseInt(summaryLimitInput.trim(), 10);
    if (!Number.isInteger(limit) || limit <= 0 || limit > summaryDialogMax) {
      setActionNotice({ type: 'error', message: `Enter a number between 1 and ${summaryDialogMax}.` });
      return;
    }
    setSummaryDialogOpen(false);
    await triggerRun(summaryDialogWebsite, false, true, limit);
  };

  const stopRun = async () => {
    if (!window.confirm('Stop the active scraper run? It will finish its current safe operation first.')) return;
    setStoppingRun(true);
    try {
      await stopAdminScraper();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to request scraper stop.');
    } finally {
      setStoppingRun(false);
    }
  };

  const refreshCurrentTab = async () => {
    setRefreshingTab(true);
    setActionNotice(null);
    try {
      if (activeTab === 'data') {
        dataLoadedRef.current = false;
        await loadDataPage(1, false);
      } else {
        loadedTabsRef.current[activeTab] = false;
        await loadData(true);
      }
      setActionNotice({ type: 'success', message: `${activeTab === 'data' ? 'Scraped data' : activeTab} refreshed successfully.` });
    } finally {
      setRefreshingTab(false);
    }
  };

  // Derived filtered states
  const filteredSources = useMemo(() => sources.filter(s => s.website_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.website_full_name.toLowerCase().includes(searchTerm.toLowerCase())), [sources, searchTerm]);
  const filteredData = dataRows;
  const filteredFeedback = useMemo(() => feedback.filter(f => f.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || f.user_email.toLowerCase().includes(searchTerm.toLowerCase()) || f.message.toLowerCase().includes(searchTerm.toLowerCase())), [feedback, searchTerm]);
  const filteredUsers = useMemo(() => users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.first_name.toLowerCase().includes(searchTerm.toLowerCase())), [users, searchTerm]);
  const runWebsiteOptions = useMemo(() => Array.from(new Set([
    ...sources.map(source => source.website_name),
    ...(pipelineStatus?.sites || []).map(site => site.website_name),
    ...runs.flatMap(run => run.websites || []),
  ])).sort(), [sources, pipelineStatus, runs]);
  const filteredRuns = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return runs.filter(run => {
      const searchable = [
        run.status,
        run.activity,
        run.action,
        run.error_text,
        ...(run.websites || []),
        ...(run.errors || []),
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesText = !query || searchable.includes(query);
      const matchesWebsite = !runWebsiteFilters.length || runWebsiteFilters.some(website => (run.websites || []).includes(website));
      const runDate = new Date(run.started_at).toISOString().slice(0, 10);
      const matchesDate = (!runStartDate || runDate >= runStartDate) && (!runEndDate || runDate <= runEndDate);
      return matchesText && matchesWebsite && matchesDate;
    });
  }, [runs, searchTerm, runWebsiteFilters, runStartDate, runEndDate]);
  const pipelineSites = pipelineStatus?.sites ?? [];
  const pipelineItems = pipelineStatus?.items ?? [];
  const pipelineFailures = pipelineStatus?.failure_reasons ?? [];

  useEffect(() => {
    if (!actionNotice) return;
    const timer = window.setTimeout(() => setActionNotice(null), 10000);
    return () => window.clearTimeout(timer);
  }, [actionNotice]);

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#116d64] text-white flex flex-col shadow-xl z-10 shrink-0 sticky top-0 h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-6 h-6" />
            RegIntel
          </h1>
          <p className="text-teal-200 text-xs mt-1 font-medium tracking-wider uppercase">Admin Portal</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {[
            { id: 'overview', icon: Activity, label: 'Dashboard' },
            { id: 'sources', icon: Globe, label: 'Sources & Selectors' },
            { id: 'data', icon: Database, label: 'Scraped Data' },
            { id: 'runs', icon: Settings, label: 'Pipeline Logs' },
            { id: 'feedback', icon: MessageSquare, label: 'User Feedback' },
            { id: 'users', icon: Users, label: 'Users & Profiles' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-white text-[#116d64] shadow-md' 
                  : 'text-teal-100 hover:bg-teal-700/50 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-6 border-t border-teal-700/50">
          <a href="/" className="text-teal-200 hover:text-white text-sm font-medium flex items-center gap-2 transition-colors">
            &larr; Back to Main Site
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shrink-0 shadow-sm z-0 relative">
          <h2 className="text-xl font-bold text-gray-800 capitalize tracking-tight">
            {activeTab.replace('-', ' ')}
          </h2>
          
          <div className="flex items-center gap-4">
            <button onClick={refreshCurrentTab} disabled={refreshingTab} className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:border-teal-400 hover:text-teal-700 disabled:cursor-wait disabled:opacity-60" title="Refresh this page's data">
              <RefreshCw className={`h-4 w-4 ${refreshingTab ? 'animate-spin' : ''}`} /> {refreshingTab ? 'Refreshing...' : 'Refresh'}
            </button>
            {/* Contextual Top Actions */}
            {activeTab !== 'overview' && activeTab !== 'sources' && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={activeTab === 'runs' ? 'Search status, activity, website, or error...' : `Search ${activeTab}...`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116d64]/50 focus:border-[#116d64] transition-all w-64"
                />
              </div>
            )}
            
            {activeTab === 'feedback' && (
              <button onClick={exportFeedbackCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-full shadow-sm transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
            {activeTab === 'overview' && (
              <div className="flex items-center gap-2">
                <button onClick={() => triggerRun(undefined, true)} className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-teal-50 border border-teal-200 text-teal-800 text-sm font-bold rounded-full shadow-sm transition-colors">
                  <PlayCircle className="w-4 h-4" /> Scrape only
                </button>
                <button onClick={() => triggerSummaryRetry()} disabled={!pendingSummaryTotal} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-full shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                  <PlayCircle className="w-4 h-4" /> Retry summaries ({pendingSummaryTotal})
                </button>
                <button onClick={() => triggerRun()} className="flex items-center gap-2 px-4 py-2 bg-[#116d64] hover:bg-[#0d554d] text-white text-sm font-bold rounded-full shadow-sm transition-colors">
                  <PlayCircle className="w-4 h-4" /> Scrape + summaries
                </button>
              </div>
            )}
          </div>
        </header>

        {actionNotice && <div className={`fixed right-6 top-6 z-[60] flex w-[min(28rem,calc(100vw-3rem))] items-start gap-4 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-2xl ${actionNotice.type === 'success' ? 'border-teal-200 bg-teal-50 text-teal-800' : 'border-red-200 bg-red-50 text-red-800'}`} role="status">
          <span className="flex-1">{actionNotice.message}</span>
          <button onClick={() => setActionNotice(null)} className="rounded-full p-1 text-lg leading-none opacity-60 transition hover:bg-black/5 hover:opacity-100" aria-label="Close notification">×</button>
        </div>}

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-medium animate-pulse">Syncing with database...</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                      <div className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wider">Total Sources</div>
                      <div className="text-3xl font-black text-gray-800">{sources.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                      <div className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wider">Active Sources</div>
                      <div className="text-3xl font-black text-teal-600">{sources.filter(s => s.active).length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                      <div className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wider">Last Run Timestamp</div>
                      <div className="text-xl font-bold text-gray-800 break-words">
                        {runs.length > 0 ? new Date(runs[0].started_at).toLocaleString() : 'Never'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6">Website</th>
                        <th className="py-4 px-6">Pipeline State</th>
                        <th className="py-4 px-6">Latest Stage</th>
                        <th className="py-4 px-6">Total Notices</th>
                        <th className="py-4 px-6">Last Run New</th>
                        <th className="py-4 px-6 text-right">Manual Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sources.map(s => {
                        const latestRunDetail = runs[0]?.details?.find(d => d.website_name === s.website_name);
                        const liveSite = pipelineStatus?.sites.find(site => site.website_name === s.website_name);
                        const stageStatus = liveSite?.status || latestRunDetail?.status || (runs.length > 0 ? 'NOT RUN' : 'PENDING');
                        const stageLabel = liveSite?.stage || (latestRunDetail ? 'completed' : 'Not run');
                        const statusColor = stageStatus.toLowerCase() === 'success' ? 'text-teal-600 bg-teal-50 ring-teal-600/20'
                                          : stageStatus.toLowerCase() === 'failed' ? 'text-red-600 bg-red-50 ring-red-600/20'
                                          : 'text-gray-500 bg-gray-50 ring-gray-500/20';
                        return (
                          <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="py-4 px-6">
                              <div className="font-bold text-gray-900 text-base">{s.website_name}</div>
                              <div className="text-gray-500 text-xs mt-1">{s.website_full_name}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${s.active ? 'bg-teal-500 shadow-teal-500/30' : 'bg-red-400 shadow-red-400/30'}`}></span>
                                <span className="font-bold text-gray-700">{s.active ? 'Active' : 'Inactive'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-md ring-1 ${statusColor}`}>
                                {stageLabel}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-bold text-gray-900">{pipelineStatus?.website_totals?.[s.website_name] ?? 0}</td>
                            <td className="py-4 px-6 font-bold text-teal-700">{liveSite ? `+${liveSite.latest_new_notices}` : '—'}</td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                {s.active && <>
                                  <button onClick={() => triggerRun(s.website_name, true)} className="px-3 py-2 bg-white hover:bg-teal-50 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 shadow-sm transition-all">
                                    Scrape only
                                  </button>
                                  <button onClick={() => triggerRun(s.website_name)} className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 shadow-sm transition-all group-hover:border-teal-500 group-hover:text-teal-700">
                                    Full run
                                  </button>
                                  <button onClick={() => triggerSummaryRetry(s.website_name)} disabled={!pendingSummaries[s.website_name]} className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 shadow-sm transition-all disabled:opacity-40">
                                    Retry summaries ({pendingSummaries[s.website_name] || 0})
                                  </button>
                                </>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {sources.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-gray-500 font-medium">No sources configured.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              )}

              {/* SOURCES & SELECTORS TAB */}
              {activeTab === 'sources' && (
                <div>
                  <div className="border-b border-gray-200 bg-gradient-to-r from-white via-teal-50/30 to-white px-6 py-5">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div className="min-w-[280px] flex-1">
                        <label htmlFor="source-search" className="mb-2 block text-[11px] font-black uppercase tracking-wider text-gray-500">Search sources</label>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input id="source-search" type="text" placeholder="Search by code or full name..." value={searchTerm} onChange={event => setSearchTerm(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => toggleAllSources(true)} className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-xs font-bold text-teal-800 transition hover:bg-teal-100">Enable all</button>
                        <button onClick={() => toggleAllSources(false)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-800 transition hover:bg-red-100">Disable all</button>
                        <button onClick={() => setEditingSource({ active: true })} className="flex items-center gap-2 rounded-lg bg-[#116d64] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0d554d]"><Plus className="h-4 w-4" /> Add source</button>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6">Code / Selectors</th>
                        <th className="py-4 px-6">Full Name</th>
                        <th className="py-4 px-6">Start URL</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredSources.map(s => {
                        const siteSelectors = selectors.filter(sel => sel.website_name === s.website_name);
                        const isExpanded = expandedSource === s.id;
                        return (
                          <React.Fragment key={s.id}>
                            <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}>
                              <td className="py-4 px-6">
                                <div className="font-bold text-gray-900">{s.website_name}</div>
                                <div className="text-xs text-gray-400 mt-1">{siteSelectors.length} selectors defined</div>
                              </td>
                              <td className="py-4 px-6 text-gray-700 font-medium">{s.website_full_name}</td>
                              <td className="py-4 px-6 text-blue-600 font-medium">
                                <a href={s.start_url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                  Link <ChevronRight className="w-3 h-3" />
                                </a>
                              </td>
                              <td className="py-4 px-6">
                                <button
                                  onClick={() => toggleSourceActive(s)}
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none transition-colors duration-200 ease-in-out ${s.active ? 'bg-teal-500' : 'bg-gray-300'}`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${s.active ? 'translate-x-2.5' : '-translate-x-2.5'}`}
                                  />
                                </button>
                              </td>
                              <td className="py-4 px-6 text-right space-x-3">
                                <button onClick={() => setEditingSelector({ website_name: s.website_name })} className="text-teal-600 hover:text-teal-800 font-bold text-xs">+ Selector</button>
                                <button onClick={() => setEditingSource(s)} className="text-blue-600 hover:text-blue-800 font-bold text-xs"><Edit2 className="w-4 h-4 inline-block" /></button>
                                <button onClick={() => handleDeleteSource(s.id)} className="text-red-500 hover:text-red-700 font-bold text-xs"><Trash2 className="w-4 h-4 inline-block" /></button>
                                {siteSelectors.length > 0 && (
                                  <button onClick={() => setExpandedSource(isExpanded ? null : s.id)} className="text-gray-500 hover:text-gray-800 ml-2 border-l pl-3 border-gray-300">
                                    {isExpanded ? <ChevronUp className="w-4 h-4 inline-block" /> : <ChevronDown className="w-4 h-4 inline-block" />}
                                  </button>
                                )}
                              </td>
                            </tr>
                            {isExpanded && siteSelectors.length > 0 && (
                              <tr className="bg-gray-50/50">
                                <td colSpan={5} className="p-4 px-6 pb-6 border-t-0">
                                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider">
                                        <tr>
                                          <th className="py-3 px-4 font-bold w-1/4">Selector Key</th>
                                          <th className="py-3 px-4 font-bold">CSS / XPath Expression</th>
                                          <th className="py-3 px-4 font-bold text-right w-24">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {siteSelectors.map(sel => (
                                          <tr key={sel.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 font-mono font-bold text-teal-700">{sel.selector_key}</td>
                                            <td className="py-3 px-4 font-mono text-gray-600">{sel.selector_value}</td>
                                            <td className="py-3 px-4 text-right space-x-3">
                                              <button onClick={() => setEditingSelector(sel)} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-3 h-3 inline-block" /></button>
                                              <button onClick={() => handleDeleteSelector(sel.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3 inline-block" /></button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {filteredSources.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-gray-500 font-medium">No sources match your search.</td></tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              {/* DATA TAB */}
              {activeTab === 'data' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 p-5">
                    <input value={dataSearch} onChange={e => setDataSearch(e.target.value)} placeholder="Search title, summary, date..." className="min-w-64 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    <select value={dataWebsite} onChange={e => setDataWebsite(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      <option value="">All websites</option>
                      {sources.map(source => <option key={source.website_name} value={source.website_name}>{source.website_name}</option>)}
                    </select>
                    <select value={dataCategory} onChange={e => setDataCategory(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      <option value="">All categories</option>
                      {Array.from(new Set(dataRows.map(row => row.category).filter(Boolean))).map(category => <option key={category} value={category}>{category}</option>)}
                    </select>
                    <select value={dataProcessed} onChange={e => setDataProcessed(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      <option value="">All processing states</option>
                      <option value="true">Processed</option>
                      <option value="false">Pending</option>
                    </select>
                    <select value={dataOrdering} onChange={e => setDataOrdering(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                      <option value="-created_at">Newest first</option>
                      <option value="created_at">Oldest first</option>
                      <option value="title">Title A-Z</option>
                      <option value="-title">Title Z-A</option>
                      <option value="website_name">Website A-Z</option>
                      <option value="-notice_date">Notice date newest</option>
                      <option value="due_date">Due date</option>
                    </select>
                    <span className="text-xs font-semibold text-gray-500">{dataTotal.toLocaleString()} records</span>
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6">ID</th>
                        <th className="py-4 px-6">Source</th>
                        <th className="py-4 px-6">Category</th>
                        <th className="py-4 px-6">Title</th>
                        <th className="py-4 px-6">Notice date</th>
                        <th className="py-4 px-6">Due date</th>
                        <th className="py-4 px-6">Links</th>
                        <th className="py-4 px-6">Summary</th>
                        <th className="py-4 px-6 text-center">AI Processed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredData.map(d => (
                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-6 font-mono text-xs text-gray-500">{d.id}</td>
                          <td className="py-3 px-6">
                            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">{d.website_name}</span>
                          </td>
                          <td className="py-3 px-6 text-xs text-gray-600">{d.category || '-'}</td>
                          <td className="py-3 px-6">
                            <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium line-clamp-2 pr-4">
                              {d.title}
                            </a>
                          </td>
                          <td className="py-3 px-6 text-gray-500 whitespace-nowrap font-medium">{d.notice_date}</td>
                          <td className="py-3 px-6 text-gray-500 whitespace-nowrap">{d.due_date || '-'}</td>
                          <td className="py-3 px-6 text-xs whitespace-nowrap">
                            {d.pdf_url && <a href={d.pdf_url} target="_blank" rel="noreferrer" className="mr-2 text-blue-600 hover:underline">PDF</a>}
                            {d.detail_url && <a href={d.detail_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Detail</a>}
                          </td>
                          <td className="max-w-sm py-3 px-6 text-xs text-gray-600"><span title={d.summary || ''} className="line-clamp-2">{d.summary || '-'}</span></td>
                          <td className="py-3 px-6 text-center">
                            {d.processed ? (
                              <span className="text-teal-700 text-xs px-2.5 py-1 bg-teal-50 ring-1 ring-teal-600/20 rounded-md font-bold">Yes</span>
                            ) : (
                              <span className="text-yellow-700 text-xs px-2.5 py-1 bg-yellow-50 ring-1 ring-yellow-600/20 rounded-md font-bold">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredData.length === 0 && (
                        <tr><td colSpan={9} className="py-8 text-center text-gray-500 font-medium">No records match your filters.</td></tr>
                      )}
                      <tr ref={dataSentinelRef}><td colSpan={9} className="py-5 text-center text-xs text-gray-400">{dataLoadingMore ? 'Loading more records...' : dataHasMore ? 'Scroll to load more' : 'End of results'}</td></tr>
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              {/* RUNS TAB WITH INLINE DETAILS */}
              {activeTab === 'runs' && (
                <div className="space-y-5 p-5">
                  <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-5">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-start">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-teal-700">Live pipeline tracking</div>
                        <div className="mt-1 text-2xl font-black text-gray-900">
                          {pipelineStatus?.run ? pipelineStatus.run.status.replace('_', ' ') : 'No run recorded'}
                        </div>
                        {pipelineStatus?.run && <div className="mt-1 text-xs text-gray-500">Run #{pipelineStatus.run.id} · Pending PDF summaries: {pipelineStatus.pending_summaries}</div>}
                      </div>
                      {pipelineStatus?.run?.status === 'running' && <div className="justify-self-center rounded-full bg-white px-3 py-1.5 text-xs font-bold text-teal-700 shadow-sm">Live · updates every 3 seconds</div>}
                      {pipelineStatus?.run?.status === 'running' && <button onClick={stopRun} disabled={stoppingRun} className="justify-self-end rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50">{stoppingRun ? 'Stopping...' : 'Stop run'}</button>}
                    </div>
                      {pipelineStatus?.run && (
                      <>
                        <div className="mt-4 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
                          <div><span className="font-bold text-gray-500">Activity</span><div className="mt-1 font-semibold text-gray-900">{pipelineStatus.run.activity || pipelineStatus.run.action || 'full'}</div></div>
                          <div><span className="font-bold text-gray-500">Websites</span><div className="mt-1 font-semibold text-gray-900">{pipelineStatus.run.websites?.join(', ') || '—'}</div></div>
                          <div><span className="font-bold text-gray-500">Time taken</span><div className="mt-1 font-semibold text-gray-900">{pipelineStatus.run.duration_display || '0:00:00'}</div></div>
                        </div>
                      </>
                    )}
                    {pipelineSites.length ? (
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {pipelineSites.map(site => (
                          <div key={site.website_name} className="rounded-lg border border-white bg-white p-3 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-bold text-gray-900">{site.website_name}</span>
                              <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${site.status === 'success' ? 'bg-teal-50 text-teal-700' : site.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{site.status}</span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">{site.stage || 'Waiting'}{site.current_url ? ` · ${site.current_url}` : ''}</div>
                            {site.error_message && <div className="mt-2 truncate text-xs text-red-600" title={site.error_message}>{site.error_message}</div>}
                          </div>
                        ))}
                      </div>
                    ) : <div className="mt-4 text-sm text-gray-500">Start a run from the Dashboard to track each website here.</div>}
                    {pipelineFailures.length ? (
                      <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wider text-red-700">Unique failure reasons</div>
                        <div className="mt-3 space-y-2">
                          {pipelineFailures.map(failure => (
                            <div key={failure.reason} className="rounded border border-red-100 bg-white p-3 text-xs">
                              <div className="font-bold text-red-800">{failure.reason} <span className="font-normal text-red-600">({failure.count})</span></div>
                              <div className="mt-1 text-gray-600">Sites: {failure.sites.join(', ')}</div>
                              <div className="mt-1 text-gray-500">Items: {failure.items.slice(0, 5).map(item => `${item.website_name} #${item.data_id ?? '-'}`).join(', ')}{failure.items.length > 5 ? '…' : ''}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {pipelineItems.length ? (
                      <div className="mt-5 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Live item log</div>
                        <table className="w-full text-left text-xs"><thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-2">Website</th><th className="px-4 py-2">Item</th><th className="px-4 py-2">Stage</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Error</th></tr></thead><tbody className="divide-y divide-gray-100">{pipelineItems.slice(0, 50).map((item, index) => <tr key={`${item.data_id}-${index}`}><td className="px-4 py-2 font-bold">{item.website_name}</td><td className="px-4 py-2">#{item.data_id ?? '-'}</td><td className="px-4 py-2">{item.stage}</td><td className="px-4 py-2">{item.status}</td><td className="max-w-md truncate px-4 py-2 text-red-600" title={item.error_message || ''}>{item.error_message || '-'}</td></tr>)}</tbody></table>
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-white via-teal-50/30 to-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-gray-900">Filter pipeline logs</div>
                        <div className="mt-1 text-xs text-gray-500">Search, choose websites, or select a run date.</div>
                      </div>
                      {(runWebsiteFilters.length > 0 || runStartDate || runEndDate || searchTerm) && <button onClick={() => { setRunWebsiteFilters([]); setRunStartDate(''); setRunEndDate(''); setSearchTerm(''); }} className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm transition hover:border-teal-400 hover:text-teal-700">Clear all</button>}
                    </div>
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
                      <div className="relative min-w-[260px] flex-1">
                        <div className="mb-2 flex items-center justify-between"><div className="text-[11px] font-black uppercase tracking-wider text-gray-500">Website</div><div className="text-[11px] font-bold text-teal-700">{runWebsiteFilters.length ? `${runWebsiteFilters.length} selected` : 'All websites'}</div></div>
                        <button type="button" onClick={() => setWebsiteFilterOpen(open => !open)} className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-sm font-semibold text-gray-700 shadow-sm transition hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100">
                          <span>{runWebsiteFilters.length ? runWebsiteFilters.join(', ') : 'Select websites'}</span>
                          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${websiteFilterOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {websiteFilterOpen && <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-xl">
                          {runWebsiteOptions.map(website => (
                            <label key={website} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-teal-50">
                              <input type="checkbox" checked={runWebsiteFilters.includes(website)} onChange={event => setRunWebsiteFilters(current => event.target.checked ? [...current, website] : current.filter(item => item !== website))} className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                              {website}
                            </label>
                          ))}
                          {!runWebsiteOptions.length && <span className="block px-3 py-2 text-xs text-gray-400">No configured websites found.</span>}
                        </div>}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div><label htmlFor="run-start-date" className="mb-2 block text-[11px] font-black uppercase tracking-wider text-gray-500">Start date</label><input id="run-start-date" type="date" value={runStartDate} onChange={event => setRunStartDate(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></div>
                        <div><label htmlFor="run-end-date" className="mb-2 block text-[11px] font-black uppercase tracking-wider text-gray-500">End date</label><input id="run-end-date" type="date" value={runEndDate} onChange={event => setRunEndDate(event.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100" /></div>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6">Run ID</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Activity / Website</th>
                        <th className="py-4 px-6">Time Taken</th>
                        <th className="py-4 px-6">New / Processed / Failed</th>
                        <th className="py-4 px-6 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRuns.map(r => {
                        const isExpanded = expandedRun === r.id;
                        return (
                          <React.Fragment key={r.id}>
                            <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}>
                              <td className="py-3 px-6 font-mono text-gray-500 font-medium">#{r.id}</td>
                              <td className="py-3 px-6">
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${r.status === 'SUCCESS' ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20' : r.status === 'FAILED' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' : 'bg-gray-100 text-gray-700 ring-1 ring-gray-300'}`}>
                                  {r.status || 'UNKNOWN'}
                                </span>
                              </td>
                              <td className="py-3 px-6 text-gray-600"><div className="font-semibold text-gray-900">{r.activity || r.action || 'full'}</div><div className="text-xs">{r.websites?.join(', ') || '—'}</div></td>
                              <td className="py-3 px-6 text-gray-600"><div className="font-semibold text-gray-900">{r.duration_display || '0:00:00'}</div><div className="text-xs">{new Date(r.started_at).toLocaleString()}</div></td>
                              <td className="py-3 px-6 font-bold text-gray-900">{r.total_new_rows} / {r.metrics?.processed ?? r.summary_success ?? 0} / {r.metrics?.failed ?? r.summary_failed ?? 0}</td>
                              <td className="py-3 px-6 text-right">
                                <button 
                                  onClick={() => setExpandedRun(isExpanded ? null : r.id)}
                                  className="text-gray-500 hover:text-gray-800"
                                >
                                  {isExpanded ? <ChevronUp className="w-5 h-5 inline" /> : <ChevronDown className="w-5 h-5 inline" />}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-gray-50/50 border-t-0">
                                <td colSpan={6} className="p-4 px-6 pb-6">
                                  {r.errors?.length ? <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-xs">
                                    <h4 className="font-black uppercase tracking-wider text-red-700">Run notes</h4>
                                    <ul className="mt-2 list-disc space-y-1 pl-4 text-red-800">
                                      {r.errors.map(error => <li key={error}>{error}</li>)}
                                    </ul>
                                  </div> : <div className="rounded-lg border border-teal-100 bg-teal-50 p-4 text-xs font-bold text-teal-800">
                                    {r.status?.toLowerCase() === 'success' ? 'No errors — successful run.' : 'No errors recorded.'}
                                  </div>}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {filteredRuns.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-gray-500 font-medium">No run logs found.</td></tr>
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              {/* FEEDBACK TAB */}
              {activeTab === 'feedback' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6">User</th>
                        <th className="py-4 px-6">Type & Rating</th>
                        <th className="py-4 px-6">Message</th>
                        <th className="py-4 px-6">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredFeedback.map(f => (
                        <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold text-gray-900">{f.full_name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{f.user_email}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-gray-700">{f.type_of_feedback}</div>
                            <div className="text-yellow-500 font-bold text-xs mt-0.5">{"★".repeat(f.star_rating)}{"☆".repeat(5-f.star_rating)} ({f.star_rating}/5)</div>
                          </td>
                          <td className="py-4 px-6 text-gray-600 text-sm max-w-md">
                            <div className="line-clamp-2">{f.message}</div>
                          </td>
                          <td className="py-4 px-6 text-gray-500 font-medium text-xs whitespace-nowrap">
                            {new Date(f.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {filteredFeedback.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-gray-500 font-medium">No feedback matches your search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6">User Identity</th>
                        <th className="py-4 px-6">Role & Status</th>
                        <th className="py-4 px-6">Profession Category</th>
                        <th className="py-4 px-6">Joined Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map(u => {
                        const profName = u.profile?.profession_category 
                          ? professions.find(p => p.id === u.profile!.profession_category)?.name || `ID #${u.profile.profession_category}`
                          : 'Not Assigned';
                          
                        return (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-gray-900">{u.first_name || u.username} {u.last_name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{u.email}</div>
                            </td>
                            <td className="py-4 px-6 space-y-1">
                              <div>
                                {u.is_superuser ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-bold uppercase tracking-wider">Superuser</span>
                                ) : u.is_staff ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-bold uppercase tracking-wider">Staff</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 font-bold uppercase tracking-wider">Standard</span>
                                )}
                              </div>
                              <div className="text-xs font-semibold">
                                {u.is_active ? <span className="text-teal-600">Active</span> : <span className="text-red-500">Inactive</span>}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-medium text-gray-800">{profName}</div>
                              <div className="text-xs text-gray-500 mt-0.5">Alerts: {u.profile?.email_notifications ? 'Enabled' : 'Disabled'}</div>
                            </td>
                            <td className="py-4 px-6 text-gray-500 font-medium text-xs whitespace-nowrap">
                              {new Date(u.date_joined).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                               <button onClick={() => setEditingUser(u)} className="inline-block px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg shadow-sm transition-all">
                                Manage User
                               </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-gray-500 font-medium">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODALS */}
        
        {/* Source Modal */}
        {editingSource && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 p-8 rounded-2xl w-full max-w-lg shadow-2xl">
              <h3 className="text-xl font-bold mb-6 text-gray-900">{editingSource.id ? 'Edit Scraping Source' : 'New Scraping Source'}</h3>
              <form onSubmit={handleSaveSource} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Website Code Name</label>
                  <input required type="text" value={editingSource.website_name || ''} onChange={e => setEditingSource({...editingSource, website_name: e.target.value})} placeholder="e.g. BCI" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#116d64]/50 focus:border-[#116d64] transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input required type="text" value={editingSource.website_full_name || ''} onChange={e => setEditingSource({...editingSource, website_full_name: e.target.value})} placeholder="e.g. Bar Council of India" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#116d64]/50 focus:border-[#116d64] transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Start URL</label>
                  <input required type="url" value={editingSource.start_url || ''} onChange={e => setEditingSource({...editingSource, start_url: e.target.value})} placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#116d64]/50 focus:border-[#116d64] transition-all" />
                </div>
                <div className="flex items-center gap-3 mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <input type="checkbox" checked={!!editingSource.active} onChange={e => setEditingSource({...editingSource, active: e.target.checked})} id="source-active" className="w-4 h-4 text-[#116d64] rounded border-gray-300 focus:ring-[#116d64]" />
                  <label htmlFor="source-active" className="text-sm font-bold text-gray-800">Pipeline Active</label>
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setEditingSource(null)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 text-sm font-bold bg-[#116d64] hover:bg-[#0d554d] shadow-lg shadow-[#116d64]/30 text-white rounded-xl transition-all">Save Source</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Selector Modal */}
        {editingSelector && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 p-8 rounded-2xl w-full max-w-lg shadow-2xl">
              <h3 className="text-xl font-bold mb-6 text-gray-900">{editingSelector.id ? 'Edit Selector' : 'New Selector'}</h3>
              <form onSubmit={handleSaveSelector} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Target Website</label>
                  <input required type="text" value={editingSelector.website_name || ''} readOnly className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Selector Key</label>
                  <input required type="text" value={editingSelector.selector_key || ''} onChange={e => setEditingSelector({...editingSelector, selector_key: e.target.value})} placeholder="e.g. notices_list" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#116d64]/50 focus:border-[#116d64] transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Selector Value / Expression</label>
                  <textarea required value={editingSelector.selector_value || ''} onChange={e => setEditingSelector({...editingSelector, selector_value: e.target.value})} rows={4} placeholder="//div[@class='notice']..." className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-[#116d64]/50 focus:border-[#116d64] transition-all resize-none" />
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setEditingSelector(null)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 text-sm font-bold bg-[#116d64] hover:bg-[#0d554d] shadow-lg shadow-[#116d64]/30 text-white rounded-xl transition-all">Save Selector</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-200 p-8 rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-bold mb-6 text-gray-900">Manage User: {editingUser.email}</h3>
              <form onSubmit={handleSaveUser} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">First Name</label>
                    <input type="text" value={editingUser.first_name || ''} onChange={e => setEditingUser({...editingUser, first_name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#116d64]/50 focus:border-[#116d64] transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Last Name</label>
                    <input type="text" value={editingUser.last_name || ''} onChange={e => setEditingUser({...editingUser, last_name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#116d64]/50 focus:border-[#116d64] transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Profession Category</label>
                  <select 
                    value={editingUser.profile?.profession_category || ''} 
                    onChange={e => setEditingUser({...editingUser, profile: { email_notifications: editingUser.profile?.email_notifications ?? false, profession_category: parseInt(e.target.value) || null }})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#116d64]/50 focus:border-[#116d64] transition-all bg-white"
                  >
                    <option value="">-- No Category --</option>
                    {professions.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <input type="checkbox" checked={!!editingUser.is_active} onChange={e => setEditingUser({...editingUser, is_active: e.target.checked})} id="user-active" className="w-5 h-5 text-[#116d64] rounded border-gray-300 focus:ring-[#116d64]" />
                    <label htmlFor="user-active" className="text-sm font-bold text-gray-800">Account Active</label>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <input type="checkbox" checked={!!editingUser.profile?.email_notifications} onChange={e => setEditingUser({...editingUser, profile: { profession_category: editingUser.profile?.profession_category ?? null, email_notifications: e.target.checked }})} id="user-alerts" className="w-5 h-5 text-[#116d64] rounded border-gray-300 focus:ring-[#116d64]" />
                    <label htmlFor="user-alerts" className="text-sm font-bold text-gray-800">Email Alerts Enabled</label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <input type="checkbox" checked={!!editingUser.is_superuser} onChange={e => setEditingUser({...editingUser, is_superuser: e.target.checked})} id="user-super" className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-600" />
                    <label htmlFor="user-super" className="text-sm font-bold text-purple-900">Superuser Access</label>
                  </div>
                  <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <input type="checkbox" checked={!!editingUser.is_staff} onChange={e => setEditingUser({...editingUser, is_staff: e.target.checked})} id="user-staff" className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-600" />
                    <label htmlFor="user-staff" className="text-sm font-bold text-blue-900">Staff Access</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 text-sm font-bold bg-[#116d64] hover:bg-[#0d554d] shadow-lg shadow-[#116d64]/30 text-white rounded-xl transition-all">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {summaryDialogOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><div className="text-lg font-black text-gray-900">Retry summaries</div><div className="mt-1 text-sm text-gray-500">Choose how many remaining rows to process in this run.</div></div>
              <button onClick={() => setSummaryDialogOpen(false)} className="text-xl leading-none text-gray-400 hover:text-gray-700" aria-label="Close">×</button>
            </div>
            <label htmlFor="summary-limit" className="mt-5 block text-xs font-black uppercase tracking-wider text-gray-500">Rows to process</label>
            <input id="summary-limit" type="number" min="1" max={summaryDialogMax} step="1" value={summaryLimitInput} onChange={event => { const value = event.target.value; const parsed = Number.parseInt(value, 10); setSummaryLimitInput(parsed > summaryDialogMax ? String(summaryDialogMax) : value); }} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 text-lg font-bold text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100" autoFocus />
            <div className="mt-2 text-xs text-gray-500">Maximum available: <span className="font-bold text-teal-700">{summaryDialogMax}</span> pending PDF summaries.</div>
            <div className="mt-5 flex justify-end gap-3"><button onClick={() => setSummaryDialogOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button><button onClick={() => void submitSummaryRetry()} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700">Start retry</button></div>
          </div>
        </div>}
      </main>
    </div>
  );
}
