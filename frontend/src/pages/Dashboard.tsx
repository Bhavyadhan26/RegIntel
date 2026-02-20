import {
  Calendar, Bell, ChevronRight,
  AlertCircle, CheckCircle2, TrendingUp, Search
} from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const Dashboard = () => {
  const deadlines = [
    { title: "GST Return Filing", date: "Jan 28, 2026", urgent: true },
    { title: "Annual Compliance Report", date: "Feb 1, 2026", urgent: true },
    { title: "Quarterly Audit Submission", date: "Feb 15, 2026", urgent: false },
  ];

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Sidebar />

      <main className="flex-1 ml-[260px] p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-main">Dashboard</h1>
            <p className="text-sm text-text-muted mt-1">Welcome back, John. Here's what's happening today.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search regulations..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-text-main"
              />
            </div>

            <button className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center text-text-muted hover:text-text-main hover:border-gray-300 transition-colors relative shadow-sm">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
              JD
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">+5 new</span>
              </div>
              <div className="text-3xl font-bold text-text-main">12</div>
              <div className="text-sm text-text-muted mt-1">Unread Alerts</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">Good</span>
              </div>
              <div className="text-3xl font-bold text-text-main">98%</div>
              <div className="text-sm text-text-muted mt-1">Compliance Score</div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary bg-primary/5 border-primary/20">
            <CardContent className="p-6 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="w-8 h-8 bg-white/50 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                  <ChevronRight className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-lg font-bold text-text-main">View Analytics</div>
              <div className="text-sm text-text-muted mt-1">Detailed compliance reports</div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold">Upcoming Deadlines</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary-hover h-auto py-1 px-2">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {deadlines.map((item, idx) => (
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
                  {item.urgent && (
                    <span className="flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100">
                      <AlertCircle className="w-3 h-3" /> URGENT
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
