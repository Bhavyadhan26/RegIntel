import { useEffect, useState } from "react";
import { Filter, ChevronRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import Sidebar from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/Footer";
import { apiGetAlerts } from "@/lib/api";
import { useResponsiveSidebar } from "@/hooks/useResponsiveSidebar";

interface AlertRow {
  id: string;
  title: string;
  authority: string;
  desc: string;
  date: string;
  tag: string;
  type: "critical" | "high" | "medium";
  tagColor: string;
  url: string;
}

const ALERTS_CACHE_TTL_MS = 5 * 60 * 1000;

type AlertsCache = {
  fetchedTabs: { new: boolean; old: boolean };
  alertsByTab: { new: AlertRow[]; old: AlertRow[] };
  cachedAt: number;
};

let alertsPageCache: AlertsCache | null = null;

export const Alerts = () => {
  const [activeTab, setActiveTab] = useState<"new" | "old">("new");
  const { isSidebarOpen, openSidebar, closeSidebar } = useResponsiveSidebar();
  const [filterType, setFilterType] = useState<"all" | "critical" | "high" | "medium">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [alertsByTab, setAlertsByTab] = useState<{ new: AlertRow[]; old: AlertRow[] }>(
    alertsPageCache?.alertsByTab ?? { new: [], old: [] },
  );
  const [fetchedTabs, setFetchedTabs] = useState<{ new: boolean; old: boolean }>(
    alertsPageCache?.fetchedTabs ?? { new: false, old: false },
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const severityFromTitle = (title: string): "critical" | "high" | "medium" => {
    const normalized = title.toLowerCase();
    if (normalized.includes("final result") || normalized.includes("not be available")) return "critical";
    if (normalized.includes("budget") || normalized.includes("exam") || normalized.includes("seeking")) return "high";
    return "medium";
  };

  const tagColorByTag = (tag: string): string => {
    const normalized = (tag || "").toLowerCase();
    if (normalized.includes("update")) return "bg-purple-100 text-purple-700";
    if (normalized.includes("tender")) return "bg-emerald-100 text-emerald-700";
    return "bg-amber-100 text-amber-700";
  };

  const mapAlerts = (results: Awaited<ReturnType<typeof apiGetAlerts>>["results"]): AlertRow[] =>
    results.map((item) => ({
      id: item.id,
      title: item.title,
      authority: item.authority,
      desc: item.summary || "No summary available.",
      date: item.notice_date || "",
      tag: item.tag,
      type: severityFromTitle(item.title),
      tagColor: tagColorByTag(item.tag),
      url: item.url,
    }));

  useEffect(() => {
    let cancelled = false;

    const cached = alertsPageCache;
    const cacheIsFresh = cached && Date.now() - cached.cachedAt < ALERTS_CACHE_TTL_MS;

    if (cacheIsFresh && cached) {
      setAlertsByTab(cached.alertsByTab);
      setFetchedTabs(cached.fetchedTabs);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const loadAlerts = async () => {
      setIsLoading(true);
      setLoadError("");
      try {
        const needsInitialPrefetch = !fetchedTabs.new && !fetchedTabs.old;

        if (needsInitialPrefetch) {
          const [newResponse, oldResponse] = await Promise.all([
            apiGetAlerts({ tab: "new" }),
            apiGetAlerts({ tab: "old" }),
          ]);
          if (cancelled) return;

          const nextAlertsByTab = {
            new: mapAlerts(newResponse.results),
            old: mapAlerts(oldResponse.results),
          };
          const nextFetchedTabs = { new: true, old: true };

          setAlertsByTab(nextAlertsByTab);
          setFetchedTabs(nextFetchedTabs);
          alertsPageCache = {
            alertsByTab: nextAlertsByTab,
            fetchedTabs: nextFetchedTabs,
            cachedAt: Date.now(),
          };
          return;
        }

        if (fetchedTabs[activeTab]) {
          setIsLoading(false);
          return;
        }

        const response = await apiGetAlerts({ tab: activeTab });
        if (cancelled) return;

        const mapped = mapAlerts(response.results);

        setAlertsByTab((prev) => {
          const next = { ...prev, [activeTab]: mapped };
          const nextFetchedTabs = { ...fetchedTabs, [activeTab]: true };
          alertsPageCache = {
            alertsByTab: next,
            fetchedTabs: nextFetchedTabs,
            cachedAt: Date.now(),
          };
          return next;
        });
        setFetchedTabs((prev) => ({ ...prev, [activeTab]: true }));
      } catch {
        if (cancelled) return;
        setLoadError("Unable to load alerts right now.");
        setAlertsByTab((prev) => ({ ...prev, [activeTab]: [] }));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadAlerts();
    return () => {
      cancelled = true;
    };
  }, [activeTab, fetchedTabs]);

  const severityColor = (type: string) =>
    type === "critical" ? "bg-red-500" : type === "high" ? "bg-amber-500" : "bg-blue-500";

  const getFilteredAlerts = () => {
    let filtered = alertsByTab[activeTab];
    if (filterType !== "all") {
      filtered = filtered.filter(a => a.type === filterType);
    }
    return filtered;
  };

  const filteredAlerts = getFilteredAlerts();

  const newCount = alertsByTab.new.length;
  const oldCount = alertsByTab.old.length;

  return (
    <div className="min-h-screen bg-background flex font-sans relative overflow-x-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      </div>

      {/* Sidebar Overlay (Mobile only) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[260px]' : ''}`}>
        <div className="flex-1 w-full max-w-full overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Header title="Alerts" onMenuClick={openSidebar} isSidebarOpen={isSidebarOpen} />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-7">
            <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
              {(["new", "old"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                    ? "bg-white text-text-main shadow-sm"
                    : "text-text-muted hover:text-text-main"
                    }`}
                >
                  {tab === "new" ? "New" : "Old"}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${activeTab === tab ? "bg-primary/10 text-primary" : "bg-gray-200 text-gray-600"
                    }`}>
                    {tab === "new" ? newCount : oldCount}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-text-main text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Filter className="w-4 h-4" /> 
                {filterType === "all" ? "Filter" : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-lg shadow-black/5 z-20 py-1 overflow-hidden">
                  {(["all", "critical", "high", "medium"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilterType(type);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        filterType === type ? "bg-primary/5 text-primary font-medium" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {type === "all" ? "All Severities" : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {isLoading && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 w-36 rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-5/6 rounded bg-gray-200" />
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                </div>
                <div className="mt-4 text-xs text-text-muted">Loading alerts...</div>
              </div>
            )}

            {loadError && !isLoading && (
              <div className="py-8 text-center text-red-600 text-sm">{loadError}</div>
            )}

            {!isLoading && !loadError && filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert, idx) => (
              <FadeIn key={alert.id} delay={idx * 0.05} direction="up" fullWidth>
              <div
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all relative"
              >
                <div className={`absolute left-0 top-5 bottom-5 w-[3px] rounded-full ${severityColor(alert.type)}`} />
                <div className="pl-5">
                  <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-base font-bold text-text-main">{alert.title}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 sm:ml-3 ${alert.tagColor}`}>
                      {alert.tag}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-2 font-medium">{alert.authority}</p>
                  <p className="text-sm text-text-muted leading-relaxed mb-3">{alert.desc}</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-gray-500">{alert.date}</span>
                    <a
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
                    >
                      Read More <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
              </FadeIn>
            ))
            ) : !isLoading && !loadError ? (
              <div className="py-12 text-center text-text-muted text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No new updates Today
              </div>
            ) : null}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};
