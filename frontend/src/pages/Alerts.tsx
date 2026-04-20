import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
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

const PAGE_SIZE = 20;

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

export const Alerts = () => {
  const [activeTab, setActiveTab] = useState<"new" | "old">("new");
  const { isSidebarOpen, openSidebar, closeSidebar } = useResponsiveSidebar();

  const [alertsByTab, setAlertsByTab] = useState<{ new: AlertRow[]; old: AlertRow[] }>({ new: [], old: [] });
  const [totalByTab, setTotalByTab] = useState<{ new: number; old: number }>({ new: 0, old: 0 });
  const [pageByTab, setPageByTab] = useState<{ new: number; old: number }>({ new: 0, old: 0 });
  const [hasMoreByTab, setHasMoreByTab] = useState<{ new: boolean; old: boolean }>({ new: true, old: true });
  const [loadedTabOnce, setLoadedTabOnce] = useState<{ new: boolean; old: boolean }>({ new: false, old: false });

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");

  const requestIdRef = useRef(0);

  const loadAlerts = useCallback(async (tab: "new" | "old", targetPage: number, replace: boolean) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (replace) {
      setIsInitialLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    setLoadError("");

    try {
      const response = await apiGetAlerts({ tab, page: targetPage, page_size: PAGE_SIZE });
      if (requestIdRef.current !== requestId) return;

      const mapped = mapAlerts(response.results);

      setAlertsByTab((prev) => ({
        ...prev,
        [tab]: replace ? mapped : [...prev[tab], ...mapped],
      }));
      setTotalByTab((prev) => ({
        ...prev,
        [tab]: response.total,
      }));
      setPageByTab((prev) => ({
        ...prev,
        [tab]: targetPage,
      }));
      setHasMoreByTab((prev) => ({
        ...prev,
        [tab]: response.has_more,
      }));
      setLoadedTabOnce((prev) => ({
        ...prev,
        [tab]: true,
      }));
    } catch {
      if (requestIdRef.current !== requestId) return;
      setLoadError("Unable to load alerts right now.");
      if (replace) {
        setAlertsByTab((prev) => ({ ...prev, [tab]: [] }));
        setTotalByTab((prev) => ({ ...prev, [tab]: 0 }));
        setHasMoreByTab((prev) => ({ ...prev, [tab]: false }));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    if (loadedTabOnce[activeTab]) return;
    void loadAlerts(activeTab, 1, true);
  }, [activeTab, loadedTabOnce, loadAlerts]);

  useEffect(() => {
    const handleScroll = () => {
      if (isInitialLoading || isLoadingMore) return;
      if (!loadedTabOnce[activeTab]) return;
      if (!hasMoreByTab[activeTab]) return;

      const threshold = 220;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;
      if (!atBottom) return;

      void loadAlerts(activeTab, pageByTab[activeTab] + 1, false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab, hasMoreByTab, isInitialLoading, isLoadingMore, loadAlerts, loadedTabOnce, pageByTab]);

  const severityColor = (type: string) =>
    type === "critical" ? "bg-red-500" : type === "high" ? "bg-amber-500" : "bg-blue-500";

  const visibleAlerts = alertsByTab[activeTab];

  const newCount = totalByTab.new;
  const oldCount = totalByTab.old;

  return (
    <div className="min-h-screen bg-background flex font-sans relative overflow-x-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <main className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? "lg:ml-[260px]" : ""}`}>
        <div className="flex-1 w-full max-w-full overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Header title="Alerts" onMenuClick={openSidebar} isSidebarOpen={isSidebarOpen} />

          <div className="mb-7 overflow-x-auto">
            <div className="flex min-w-max bg-gray-100 rounded-lg p-1 border border-gray-200">
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
          </div>

          <div className="space-y-3">
            {isInitialLoading && (
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

            {loadError && !isInitialLoading && (
              <div className="py-8 text-center text-red-600 text-sm">{loadError}</div>
            )}

            {!isInitialLoading && !loadError && visibleAlerts.length > 0 ? (
              visibleAlerts.map((alert, idx) => (
                <FadeIn key={`${activeTab}-${alert.id}-${idx}`} delay={idx * 0.03} direction="up" fullWidth>
                  <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all relative">
                    <div className={`absolute left-0 top-5 bottom-5 w-[3px] rounded-full ${severityColor(alert.type)}`} />
                    <div className="pl-5 min-w-0">
                      <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <h3 className="text-base font-bold text-text-main break-words [overflow-wrap:anywhere]">{alert.title}</h3>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 sm:ml-3 ${alert.tagColor}`}>
                          {alert.tag}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted mb-2 font-medium">{alert.authority}</p>
                      <p className="text-sm text-text-muted leading-relaxed mb-3 break-words [overflow-wrap:anywhere]">{alert.desc}</p>
                      <div className="flex justify-end">
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
            ) : !isInitialLoading && !loadError ? (
              <div className="py-12 text-center text-text-muted text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No alerts found for this tab.
              </div>
            ) : null}

            {isLoadingMore && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-text-muted">
                Loading more alerts...
              </div>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};
