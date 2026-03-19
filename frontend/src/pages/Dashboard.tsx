import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Calendar, Bell, ChevronRight,
  AlertCircle,
  FileText, Briefcase, Clock, X
} from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import { Button } from "@/components/ui/Button";
import { Footer } from "../components/Footer";
import { useResponsiveSidebar } from "@/hooks/useResponsiveSidebar";
import { useAuth } from "@/context/AuthContext";
import { apiGetDashboardSummary } from "@/lib/api";

const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

type DashboardCache = {
  stats: {
    unreadAlerts: number;
    unreadAlertsTwoDay: number;
    publicationsToday: number;
    publicationsWeek: number;
    deadlinesActive: number;
    deadlinesWeekWithDue: number;
  };
  lastUpdated: string | null;
  deadlines: Array<{ title: string; date: string; urgent: boolean; url: string }>;
  cachedAt: number;
};

let dashboardPageCache: DashboardCache | null = null;


export const Dashboard = () => {
  const DASHBOARD_BACK_WARNING_KEY = "dashboard_back_warning_shown";
  const DASHBOARD_INFO_MODAL_KEY = "dashboard_info_modal_pending";
  const { isSidebarOpen, openSidebar, closeSidebar } = useResponsiveSidebar();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showInfoModal, setShowInfoModal] = useState(
    () => sessionStorage.getItem(DASHBOARD_INFO_MODAL_KEY) === "1"
  );
  const [showBackWarningModal, setShowBackWarningModal] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [stats, setStats] = useState({
    unreadAlerts: 0,
    unreadAlertsTwoDay: 0,
    publicationsToday: 0,
    publicationsWeek: 0,
    deadlinesActive: 0,
    deadlinesWeekWithDue: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [deadlines, setDeadlines] = useState<Array<{ title: string; date: string; urgent: boolean; url: string }>>([]);
  const backWarnedRef = useRef(false);
  const userDisplayName =
    user?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "there";

  const handleCloseInfoModal = () => {
    sessionStorage.removeItem(DASHBOARD_INFO_MODAL_KEY);
    setShowInfoModal(false);
  };

  useEffect(() => {
    const shouldForceShow = Boolean(location.state?.showInfo);
    if (shouldForceShow) {
      sessionStorage.setItem(DASHBOARD_INFO_MODAL_KEY, "1");
      setShowInfoModal(true);
      return;
    }

    const pending = sessionStorage.getItem(DASHBOARD_INFO_MODAL_KEY) === "1";
    if (pending) {
      setShowInfoModal(true);
    }
  }, [location.state]);

  useEffect(() => {
    // Keep one dashboard state in history so first back press can be intercepted.
    window.history.pushState({ dashboardGuard: true }, document.title, window.location.href);
    backWarnedRef.current = sessionStorage.getItem(DASHBOARD_BACK_WARNING_KEY) === "1";

    const onPopState = () => {
      if (!backWarnedRef.current) {
        backWarnedRef.current = true;
        sessionStorage.setItem(DASHBOARD_BACK_WARNING_KEY, "1");
        setShowBackWarningModal(true);
        window.history.pushState({ dashboardGuard: true }, document.title, window.location.href);
        return;
      }

      void (async () => {
        await logout();
        sessionStorage.removeItem(DASHBOARD_BACK_WARNING_KEY);
        window.location.replace("/");
      })();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [logout, navigate]);

  useEffect(() => {
    let cancelled = false;

    const cached = dashboardPageCache;
    const cacheIsFresh = cached && Date.now() - cached.cachedAt < DASHBOARD_CACHE_TTL_MS;
    if (cacheIsFresh && cached) {
      setStats(cached.stats);
      setLastUpdated(cached.lastUpdated);
      setDeadlines(cached.deadlines);
      setSummaryError("");
      setIsLoadingSummary(false);
      return () => {
        cancelled = true;
      };
    }

    const loadDashboardSummary = async () => {
      setIsLoadingSummary(true);
      setSummaryError("");
      try {
        const response = await apiGetDashboardSummary();
        if (cancelled) return;

        const nextStats = {
          unreadAlerts: response.cards.unread_alerts,
          unreadAlertsTwoDay: response.cards.unread_alerts_two_day,
          publicationsToday: response.cards.publications_today,
          publicationsWeek: response.cards.publications_week,
          deadlinesActive: response.cards.deadlines_active,
          deadlinesWeekWithDue: response.cards.deadlines_week_with_due,
        };
        const nextDeadlines = response.upcoming_deadlines.map((item) => ({
          title: item.title,
          date: item.due_date,
          urgent: item.urgent,
          url: item.url,
        }));

        setStats(nextStats);
        setLastUpdated(response.last_updated);
        setDeadlines(nextDeadlines);
        dashboardPageCache = {
          stats: nextStats,
          lastUpdated: response.last_updated,
          deadlines: nextDeadlines,
          cachedAt: Date.now(),
        };
      } catch {
        if (cancelled) return;
        setSummaryError("Unable to load dashboard summary right now.");
      } finally {
        if (!cancelled) setIsLoadingSummary(false);
      }
    };

    void loadDashboardSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDeadlines = deadlines;

  return (
    <div className="min-h-screen bg-background flex font-sans relative overflow-x-hidden">

      {/* Back Warning Modal */}
      {showBackWarningModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 sm:p-7">
            <h2 className="text-lg font-bold text-text-main mb-2">Just a heads-up</h2>
            <p className="text-sm text-text-muted leading-relaxed">
              For your account safety, going back one more time will log you out.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowBackWarningModal(false)}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Stay on Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-8">
            <button
              onClick={handleCloseInfoModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-bold text-text-main text-center mb-6">Important Notice</h2>

            <div className="space-y-4 text-sm text-text-muted leading-relaxed">
              <p>RegIntel is an independent regulatory intelligence platform and is not an official government website, regulator, or statutory authority. We aggregate and summarize publicly available notifications from official regulatory and government sources for informational purposes only.</p>
              <p>While we make reasonable efforts to keep content accurate and up to date, users must verify all information against the original notification published on the respective official website before taking any decision or action.</p>
              <p>RegIntel does not provide legal or compliance advice and shall not be responsible or liable for any loss, error, omission, delay, or consequence arising from reliance on the information presented on this platform.</p>
            </div>

            <button
              onClick={handleCloseInfoModal}
              className="mt-8 w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              I understand, continue to Dashboard
            </button>
          </div>
        </div>
      )}


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
          {/* Header */}
          <Header
            title="Dashboard"
            subtitle={`Welcome back, ${userDisplayName}. Here's what's happening today.`}
            onMenuClick={openSidebar}
            isSidebarOpen={isSidebarOpen}
            rightContent={
              <div className="hidden sm:flex items-center text-xs font-semibold text-text-muted bg-gray-100/80 border border-gray-200 px-3 py-1.5 rounded-full whitespace-nowrap">
                <Clock size={12} className="mr-1.5" />
                Last updated: {lastUpdated
                  ? new Date(lastUpdated).toLocaleString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                  : 'N/A'}
              </div>
            }
          />

          {summaryError && (
            <div className="mb-5 text-sm text-red-600">{summaryError}</div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <FadeIn delay={0.1}>
            <Card className="hover:-translate-y-1 transition-all duration-300 hover:shadow-lg border-t-0 border-r-0 border-b-0 border-l-[6px] border-l-green-500 rounded-xl overflow-hidden bg-white/70 backdrop-blur h-full">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center shadow-sm">
                    <Bell className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="bg-orange-100/80 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">+{stats.unreadAlertsTwoDay} in 2 days</span>
                </div>
                <div className="text-4xl font-black text-text-main tracking-tight">{isLoadingSummary ? '...' : stats.unreadAlerts}</div>
                <div className="text-sm font-medium text-text-muted mt-1 uppercase tracking-wide">Unread Alerts</div>
              </CardContent>
            </Card>
            </FadeIn>

            <FadeIn delay={0.2}>
            <Card className="hover:-translate-y-1 transition-all duration-300 hover:shadow-lg border-t-0 border-r-0 border-b-0 border-l-[6px] border-l-blue-500 rounded-xl overflow-hidden bg-white/70 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shadow-sm">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="bg-blue-100/80 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">+{stats.publicationsWeek} this week</span>
                </div>
                <div className="text-4xl font-black text-text-main tracking-tight">{isLoadingSummary ? '...' : stats.publicationsToday}</div>
                <div className="text-sm font-medium text-text-muted mt-1 uppercase tracking-wide">Number of Publications</div>
              </CardContent>
            </Card>
            </FadeIn>

            <FadeIn delay={0.3}>
            <Card className="hover:-translate-y-1 transition-all duration-300 hover:shadow-lg border-t-0 border-r-0 border-b-0 border-l-[6px] border-l-purple-500 rounded-xl overflow-hidden md:col-span-1 bg-white/70 backdrop-blur h-full">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center shadow-sm">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="bg-purple-100/80 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">+{stats.deadlinesWeekWithDue} this week</span>
                </div>
                <div className="text-4xl font-black text-text-main tracking-tight">{isLoadingSummary ? '...' : stats.deadlinesActive}</div>
                <div className="text-sm font-medium text-text-muted mt-1 uppercase tracking-wide">Deadlines</div>
              </CardContent>
            </Card>
            </FadeIn>
          </div>

          {/* Upcoming Deadlines */}
          <FadeIn delay={0.4} direction="up">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Upcoming Deadlines</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary-hover h-auto py-1 px-2" onClick={() => navigate('/deadlines')}>
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100">
                {filteredDeadlines.length > 0 ? (
                  filteredDeadlines.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 py-4 hover:bg-gray-50/50 transition-colors rounded-lg px-2 -mx-2"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text-main">{item.title}</h3>
                        <p className="text-xs text-text-muted">{item.date}</p>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary hover:text-primary-hover"
                      >
                        View
                      </a>
                      {item.urgent && (
                        <span className="flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100">
                          <AlertCircle className="w-3 h-3" /> URGENT
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-text-muted text-sm">
                    No deadlines found matching your criteria.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </FadeIn>
        </div>
        <Footer />
      </main>
    </div>
  );
};