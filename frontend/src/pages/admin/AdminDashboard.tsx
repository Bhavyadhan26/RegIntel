import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  fetchAdminRunLogs, fetchAdminSources, fetchAdminData, fetchAdminSelectors,
  saveAdminSource, deleteAdminSource, saveAdminSelector, deleteAdminSelector,
  fetchAdminFeedback, fetchAdminProfessions, fetchAdminUsers, saveAdminUser
} from '@/lib/api/admin';
import { SCRAPER_BASE_URL, getAccessToken } from '@/lib/api';
import type { 
  AdminRun, AdminSource, AdminDataRow, AdminSelector, 
  AdminUserFeedback, AdminProfessionalCategory, AdminUser 
} from '@/lib/api/admin';
import { 
  Search, Download, Plus, Trash2, Edit2, PlayCircle, Settings, Users, MessageSquare, Database, 
  Globe, Activity, ChevronDown, ChevronUp, ChevronRight
} from 'lucide-react';

type TabType = 'overview' | 'sources' | 'data' | 'runs' | 'feedback' | 'users';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Data States
  const [runs, setRuns] = useState<AdminRun[]>([]);
  const [sources, setSources] = useState<AdminSource[]>([]);
  const [selectors, setSelectors] = useState<AdminSelector[]>([]);
  const [dataRows, setDataRows] = useState<AdminDataRow[]>([]);
  const [feedback, setFeedback] = useState<AdminUserFeedback[]>([]);
  const [professions, setProfessions] = useState<AdminProfessionalCategory[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview' || activeTab === 'sources') {
        const resSources = await fetchAdminSources();
        setSources(resSources);
        if (activeTab === 'sources') {
          const resSelectors = await fetchAdminSelectors();
          setSelectors(resSelectors);
        }
      }
      if (activeTab === 'runs' || activeTab === 'overview') {
        const res = await fetchAdminRunLogs();
        setRuns(res);
      } 
      if (activeTab === 'data') {
        const res = await fetchAdminData();
        setDataRows(res);
      } 
      if (activeTab === 'feedback') {
        const res = await fetchAdminFeedback();
        setFeedback(res);
      } 
      if (activeTab === 'users') {
        const resP = await fetchAdminProfessions();
        setProfessions(resP);
        const resU = await fetchAdminUsers();
        setUsers(resU);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [activeTab]);

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
      void loadData();
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

  const triggerRun = async (websiteName?: string) => {
    try {
      const url = websiteName ? `${SCRAPER_BASE_URL}/trigger/?website=${websiteName}` : `${SCRAPER_BASE_URL}/trigger/`;
      const token = getAccessToken();
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Failed to trigger");
      alert("Scraping run triggered successfully!");
    } catch (err) {
      alert("Failed to trigger scraper run.");
    }
  };

  // Derived filtered states
  const filteredSources = useMemo(() => sources.filter(s => s.website_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.website_full_name.toLowerCase().includes(searchTerm.toLowerCase())), [sources, searchTerm]);
  const filteredData = useMemo(() => dataRows.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.website_name.toLowerCase().includes(searchTerm.toLowerCase())), [dataRows, searchTerm]);
  const filteredFeedback = useMemo(() => feedback.filter(f => f.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || f.user_email.toLowerCase().includes(searchTerm.toLowerCase()) || f.message.toLowerCase().includes(searchTerm.toLowerCase())), [feedback, searchTerm]);
  const filteredUsers = useMemo(() => users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()) || u.first_name.toLowerCase().includes(searchTerm.toLowerCase())), [users, searchTerm]);
  const filteredRuns = useMemo(() => runs.filter(r => r.status.toLowerCase().includes(searchTerm.toLowerCase())), [runs, searchTerm]);

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
            {/* Contextual Top Actions */}
            {activeTab !== 'overview' && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={`Search ${activeTab}...`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#116d64]/50 focus:border-[#116d64] transition-all w-64"
                />
              </div>
            )}
            
            {activeTab === 'sources' && (
              <>
                <button onClick={() => toggleAllSources(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-800 text-sm font-bold rounded-full shadow-sm transition-colors">
                  Enable All
                </button>
                <button onClick={() => toggleAllSources(false)} className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-red-800 text-sm font-bold rounded-full shadow-sm transition-colors">
                  Disable All
                </button>
                <button onClick={() => setEditingSource({ active: true })} className="flex items-center gap-2 px-4 py-2 bg-[#116d64] hover:bg-[#0d554d] text-white text-sm font-bold rounded-full shadow-sm transition-colors">
                  <Plus className="w-4 h-4" /> Add Source
                </button>
              </>
            )}
            {activeTab === 'feedback' && (
              <button onClick={exportFeedbackCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-full shadow-sm transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
            {activeTab === 'overview' && (
              <button onClick={() => triggerRun()} className="flex items-center gap-2 px-4 py-2 bg-[#116d64] hover:bg-[#0d554d] text-white text-sm font-bold rounded-full shadow-sm transition-colors">
                <PlayCircle className="w-4 h-4" /> Run all Active websites
              </button>
            )}
          </div>
        </header>

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
                        <th className="py-4 px-6 text-right">Manual Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sources.map(s => {
                        const latestRunDetail = runs[0]?.details?.find(d => d.website_name === s.website_name);
                        const stageStatus = latestRunDetail ? latestRunDetail.status : (runs.length > 0 ? 'NOT RUN' : 'PENDING');
                        const statusColor = stageStatus === 'SUCCESS' ? 'text-teal-600 bg-teal-50 ring-teal-600/20' 
                                          : stageStatus === 'ERROR' ? 'text-red-600 bg-red-50 ring-red-600/20'
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
                                {stageStatus}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button onClick={() => triggerRun(s.website_name)} className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 shadow-sm transition-all group-hover:border-teal-500 group-hover:text-teal-700">
                                Trigger Run
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {sources.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-gray-500 font-medium">No sources configured.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              )}

              {/* SOURCES & SELECTORS TAB */}
              {activeTab === 'sources' && (
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
              )}

              {/* DATA TAB */}
              {activeTab === 'data' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6">Source</th>
                        <th className="py-4 px-6">Title</th>
                        <th className="py-4 px-6">Date</th>
                        <th className="py-4 px-6 text-center">AI Processed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredData.map(d => (
                        <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-6">
                            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">{d.website_name}</span>
                          </td>
                          <td className="py-3 px-6">
                            <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium line-clamp-2 pr-4">
                              {d.title}
                            </a>
                          </td>
                          <td className="py-3 px-6 text-gray-500 whitespace-nowrap font-medium">{d.notice_date}</td>
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
                        <tr><td colSpan={4} className="py-8 text-center text-gray-500 font-medium">No records match your search.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RUNS TAB WITH INLINE DETAILS */}
              {activeTab === 'runs' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6">Run ID</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Started At</th>
                        <th className="py-4 px-6">New Rows</th>
                        <th className="py-4 px-6">Errors</th>
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
                              <td className="py-3 px-6 text-gray-600 font-medium">{new Date(r.started_at).toLocaleString()}</td>
                              <td className="py-3 px-6 font-bold text-gray-900">{r.total_new_rows}</td>
                              <td className="py-3 px-6 text-red-500 text-xs max-w-xs truncate" title={r.error_text || ''}>{r.error_text || '-'}</td>
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
                                  <div className="grid grid-cols-2 gap-4">
                                    {/* Stats Table */}
                                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Site Stats (New Rows)</h4>
                                      {r.stats && r.stats.length > 0 ? (
                                        <table className="w-full text-xs text-left">
                                          <thead className="text-gray-400 border-b border-gray-100">
                                            <tr><th>Website</th><th className="text-right">New Rows</th></tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-50">
                                            {r.stats.map(st => (
                                              <tr key={st.id}>
                                                <td className="py-2 font-bold text-gray-700">{st.website_name}</td>
                                                <td className="py-2 text-right font-mono text-teal-600 font-bold">+{st.new_rows}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : <div className="text-xs text-gray-400">No stats recorded.</div>}
                                    </div>

                                    {/* Details Table */}
                                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Site Details (Status)</h4>
                                      {r.details && r.details.length > 0 ? (
                                        <table className="w-full text-xs text-left">
                                          <thead className="text-gray-400 border-b border-gray-100">
                                            <tr><th>Website</th><th>Status</th><th>Error</th></tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-50">
                                            {r.details.map(det => (
                                              <tr key={det.id}>
                                                <td className="py-2 font-bold text-gray-700">{det.website_name}</td>
                                                <td className="py-2">
                                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${det.status === 'SUCCESS' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'}`}>
                                                    {det.status}
                                                  </span>
                                                </td>
                                                <td className="py-2 text-red-500 truncate max-w-[100px]" title={det.error_message || ''}>{det.error_message || '-'}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : <div className="text-xs text-gray-400">No details recorded.</div>}
                                    </div>
                                  </div>
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
                    onChange={e => setEditingUser({...editingUser, profile: { profession_category: null, email_notifications: false, ...editingUser.profile, profession_category: parseInt(e.target.value) || null }})}
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
                    <input type="checkbox" checked={!!editingUser.profile?.email_notifications} onChange={e => setEditingUser({...editingUser, profile: { profession_category: null, email_notifications: false, ...editingUser.profile, email_notifications: e.target.checked }})} id="user-alerts" className="w-5 h-5 text-[#116d64] rounded border-gray-300 focus:ring-[#116d64]" />
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
      </main>
    </div>
  );
}
