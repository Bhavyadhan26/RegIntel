import { useState } from "react";
import { Camera, Shield, User, Briefcase, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Sidebar from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { Footer } from "@/components/Footer";
import { useResponsiveSidebar } from "@/hooks/useResponsiveSidebar";
import { FadeIn } from "@/components/ui/FadeIn";

export const UserProfile = () => {
  const { isSidebarOpen, openSidebar, closeSidebar } = useResponsiveSidebar();
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@company.com",
    roles: ["Legal Professional"],
    notifications: true,
  });

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsChangingPassword(false);
      setPasswords({ current: "", new: "", confirm: "" });
      alert("Settings saved successfully!");
    }, 600);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };

  const selectRole = (role: string) => {
    setProfile({ ...profile, roles: [role] });
  };

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
          <Header 
            title="Profile" 
            subtitle="Manage your personal information, roles, and preferences." 
            onMenuClick={openSidebar}
            isSidebarOpen={isSidebarOpen}
          />

          <div className="w-full max-w-[1400px] mx-auto mb-16">
            
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              
              {/* TOP LEFT: Avatar Section */}
              <section className="h-full w-full">
                <FadeIn delay={0.1}>
                <Card className="border-0 shadow-lg shadow-black/5 bg-white rounded-3xl h-full flex flex-col items-center justify-center py-16 px-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 to-transparent"></div>
                  <label className="relative group cursor-pointer mb-6 block z-10 block">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handlePhotoUpload} 
                    />
                    <div className="w-48 h-48 rounded-full border-[6px] border-white bg-slate-100 flex items-center justify-center text-primary text-5xl font-black shadow-xl overflow-hidden transition-transform duration-300 group-hover:scale-[1.03] relative">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        profile.name.split(' ').map(n => n[0]).join('')
                      )}
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                        <Camera className="text-white w-10 h-10 mb-2" />
                        <span className="text-white text-sm font-bold tracking-wider uppercase">Upload Photo</span>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 p-3.5 bg-primary border-[4px] border-white rounded-full shadow-lg text-white hover:bg-primary/90 transition-colors">
                      <Camera size={20} />
                    </div>
                  </label>
                  <h2 className="text-4xl font-black text-text-main mt-4 z-10 text-center tracking-tight">{profile.name}</h2>
                  <p className="text-primary font-bold mt-4 bg-primary/10 px-6 py-2 rounded-full text-sm z-10 text-center">
                    {profile.roles.join(", ") || "No Focus Selected"}
                  </p>
                </Card>
                </FadeIn>
              </section>

              {/* TOP RIGHT: Personal Information */}
              <section className="h-full space-y-6">
                <h3 className="text-xl font-black text-text-main flex items-center gap-3">
                  <User size={24} className="text-primary" /> Personal Information
                </h3>
                <FadeIn delay={0.2}>
                <Card className="border-0 shadow-lg shadow-black/5 bg-white overflow-hidden rounded-3xl lg:h-[calc(100%-3rem)]">
                  <CardContent className="p-8 lg:p-10 space-y-8 flex flex-col justify-center h-full">
                    <div>
                      <label className="text-sm font-bold uppercase tracking-wider text-text-muted block mb-3">Full Name</label>
                      <input 
                        type="text" 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-5 text-lg text-text-main focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold uppercase tracking-wider text-text-muted block mb-3">Email Address</label>
                      <input 
                        type="email" 
                        value={profile.email}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-5 text-lg text-text-main focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold" 
                      />
                    </div>
                  </CardContent>
                </Card>
                </FadeIn>
              </section>
            </div>

            {/* BOTTOM SECTION: Two Column Split */}
            <div className="mt-8 grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              
              {/* BOTTOM LEFT: Security & Preferences */}
              <section className="space-y-6">
                <h3 className="text-xl font-black text-text-main flex items-center gap-3">
                  <Shield size={24} className="text-primary" /> Security & Preferences
                </h3>
                <FadeIn delay={0.3}>
                <Card className="border-0 shadow-lg shadow-black/5 bg-white rounded-3xl overflow-hidden">
                  <div className="flex flex-col gap-5 border-b border-border/50 p-6 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="bg-orange-50 p-4 rounded-2xl">
                        <Bell size={28} className="text-orange-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-text-main">Email Notifications</h4>
                        <p className="text-sm text-text-muted mt-1">Receive alerts for new regulations.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-125 origin-right">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={profile.notifications} 
                        onChange={(e) => setProfile({...profile, notifications: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div 
                    className={`group flex flex-col gap-5 p-6 transition-colors cursor-pointer hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:p-8 ${isChangingPassword ? 'bg-slate-50 border-b border-border/50' : ''}`}
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="bg-blue-50 p-4 rounded-2xl">
                        <Settings size={28} className="text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-text-main group-hover:text-primary transition-colors">Change Password</h4>
                        <p className="text-sm text-text-muted mt-1">Update your account credentials.</p>
                      </div>
                    </div>
                    <Settings size={28} className={`text-slate-300 group-hover:text-primary transition-transform duration-300 ${isChangingPassword ? 'rotate-90 text-primary' : ''}`} />
                  </div>

                  {/* Password Fields */}
                  {isChangingPassword && (
                    <div className="p-8 bg-slate-50/80 space-y-6 border-t border-border/50">
                      <div>
                        <label className="text-sm font-bold uppercase tracking-wider text-text-muted block mb-3">Current Password</label>
                        <input 
                          type="password" 
                          value={passwords.current}
                          onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                          className="w-full bg-white border-2 border-slate-100 rounded-xl p-4 text-base text-text-main focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-semibold" 
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-bold uppercase tracking-wider text-text-muted block mb-3">New Password</label>
                          <input 
                            type="password" 
                            value={passwords.new}
                            onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                            className="w-full bg-white border-2 border-slate-100 rounded-xl p-4 text-base text-text-main focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-semibold" 
                            placeholder="••••••••"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold uppercase tracking-wider text-text-muted block mb-3">Confirm New Password</label>
                          <input 
                            type="password" 
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            className="w-full bg-white border-2 border-slate-100 rounded-xl p-4 text-base text-text-main focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-semibold" 
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
                </FadeIn>
              </section>

              {/* BOTTOM RIGHT: Professional Focus */}
              <section className="space-y-6">
                <h3 className="text-xl font-black text-text-main flex items-center gap-3">
                  <Briefcase size={24} className="text-primary" /> Professional Focus
                </h3>
                <FadeIn delay={0.4}>
                <Card className="border-0 shadow-lg shadow-black/5 bg-white rounded-3xl p-8 lg:p-10 flex flex-col justify-center lg:h-[calc(100%-3rem)]">
                  <p className="text-base text-text-muted mb-8 leading-relaxed">
                    Select one role to receive tailored regulatory updates and specific compliance alerts.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {["Chartered Accountant", "Legal Professional", "Cost Accountant", "Banking or Finance", "Indirect Taxes"].map((role) => (
                      <button
                        key={role}
                        onClick={() => selectRole(role)}
                        className={`px-6 py-4 rounded-2xl text-sm font-bold border-2 transition-all ${
                          profile.roles.includes(role)
                          ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-slate-50 hover:-translate-y-1"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </Card>
                </FadeIn>
              </section>

            </div>

            {/* Save Button */}
            <div className="flex justify-center pt-16">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full px-8 py-5 text-base rounded-2xl bg-primary hover:bg-primary/95 text-white shadow-2xl shadow-primary/30 font-black transition-all hover:-translate-y-1 active:scale-[0.98] sm:text-lg lg:w-1/3 lg:px-16 lg:py-8 lg:text-xl"
              >
                {isSaving ? "Saving Configuration..." : "Save Profile Changes"}
              </Button>
            </div>

          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};