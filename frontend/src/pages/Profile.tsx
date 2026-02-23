import { useState } from "react";
import { 
  User, Mail, Briefcase, Shield, 
  Settings, Bell, Camera, Menu
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Sidebar from "../components/layout/Sidebar";
import { Footer } from "@/components/Footer";

export const UserProfile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@company.com",
    role: "Legal Professional",
    notifications: true,
  });

  return (
    <div className="min-h-screen bg-background flex font-sans relative overflow-x-hidden">
      <div className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-h-screen">
        <div className="p-8 flex-1">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-white border border-gray-200 rounded-lg text-text-muted hover:text-text-main shadow-sm mb-6"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <header className="mb-10">
            <h1 className="text-3xl font-bold text-text-main">Account Settings</h1>
            <p className="text-text-muted mt-2">Manage your professional profile and platform preferences.</p>
          </header>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />
                <CardContent className="pt-0 -mt-12 text-center">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-primary text-3xl font-bold shadow-sm mx-auto">
                      {profile.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-white border border-border rounded-full shadow-sm hover:bg-slate-50 transition-colors">
                      <Camera size={14} className="text-text-muted" />
                    </button>
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-text-main">{profile.name}</h2>
                  <p className="text-sm text-primary font-medium">{profile.role}</p>
                </CardContent>
                <div className="border-t border-border/50 p-4 bg-slate-50/50">
                  <Button variant="outline" className="w-full text-xs h-9">View Public Profile</Button>
                </div>
              </Card>
            </div>

            {/* Right Column: Settings Sections */}
            <div className="lg:col-span-2 space-y-8">
              {/* Section: Personal Information */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-text-main">
                  <User size={18} className="text-primary" />
                  <h3 className="font-semibold text-lg">Personal Information</h3>
                </div>
                <Card className="border-border/60">
                  <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Full Name</label>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-border/40">
                        <User size={16} className="text-slate-400" />
                        <span className="text-sm text-text-main">{profile.name}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Email Address</label>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-border/40">
                        <Mail size={16} className="text-slate-400" />
                        <span className="text-sm text-text-main">{profile.email}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Section: Professional Profile */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-text-main">
                  <Briefcase size={18} className="text-primary" />
                  <h3 className="font-semibold text-lg">Professional Focus</h3>
                </div>
                <Card className="border-border/60">
                  <CardContent className="p-6">
                    <p className="text-sm text-text-muted mb-6">
                      Your current focus determines the regulatory updates summarized for you.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {["Chartered Accountant", "Legal Professional", "Company Secretary"].map((role) => (
                        <button
                          key={role}
                          onClick={() => setProfile({ ...profile, role })}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                            profile.role === role 
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                            : "bg-white text-text-muted border-border hover:border-primary/40"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Section: Security & Preferences */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-text-main">
                  <Shield size={18} className="text-primary" />
                  <h3 className="font-semibold text-lg">Security & Preferences</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4 border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-slate-400" />
                      <span className="text-sm font-medium">Email Notifications</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={profile.notifications} 
                      onChange={(e) => setProfile({...profile, notifications: e.target.checked})}
                      className="w-5 h-5 accent-primary"
                    />
                  </Card>
                  <Card className="p-4 border-border/60 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Shield size={18} className="text-slate-400" />
                      <span className="text-sm font-medium">Change Password</span>
                    </div>
                    <Settings size={16} className="text-slate-300 group-hover:text-primary" />
                  </Card>
                </div>
              </section>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};