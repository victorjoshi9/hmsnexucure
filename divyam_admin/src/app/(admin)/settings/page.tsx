"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Loader2, Users, Smartphone, Shield, Plus, Trash2, Key, Eye, Check, Edit3 } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"global" | "admins" | "android">("global");

  // --- Global Settings State ---
  const [hospitalName, setHospitalName] = useState("Divyam Hospital");
  const [geoFenceLat, setGeoFenceLat] = useState(28.024511);
  const [geoFenceLng, setGeoFenceLng] = useState(73.312445);
  const [geoFenceRadiusM, setGeoFenceRadiusM] = useState(200);
  const [faceMatchThreshold, setFaceMatchThreshold] = useState(95);
  const [mockGpsDetection, setMockGpsDetection] = useState(true);
  const [lateAlertEnabled, setLateAlertEnabled] = useState(true);
  const [absentAlertEnabled, setAbsentAlertEnabled] = useState(true);
  const [whatsappApiKey, setWhatsappApiKey] = useState("");

  // --- Android Settings State ---
  const [splashScreens, setSplashScreens] = useState<string[]>([]);
  const [appIcon, setAppIcon] = useState("");
  const [bottomNav, setBottomNav] = useState<any[]>([]);
  const [customScreens, setCustomScreens] = useState<any[]>([]);
  const [appSections, setAppSections] = useState({
    show_attendance: true,
    show_breaks: true,
    show_payroll: true,
    show_history: true
  });

  // --- Admins Management State ---
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [adminMobile, setAdminMobile] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminRole, setAdminRole] = useState("hr");
  const [adminPerms, setAdminPerms] = useState({
    read_employees: true,
    read_attendance: true,
    read_shifts: true,
    read_reports: true,
    read_audit_logs: false,
    write_employees: false,
    write_attendance: false,
    write_shifts: false,
    write_reports: false,
    write_settings: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);

  // Load all settings and admins
  const fetchData = async () => {
    try {
      setLoading(true);
      // Load Global Settings
      const settings = await api.get('/settings');
      if (settings) {
        setHospitalName(settings.hospital_name || "Divyam Hospital");
        setGeoFenceLat(settings.geo_fence_lat ?? 28.024511);
        setGeoFenceLng(settings.geo_fence_lng ?? 73.312445);
        setGeoFenceRadiusM(settings.geo_fence_radius_m ?? 200);
        setFaceMatchThreshold(settings.face_match_threshold ?? 95);
        setMockGpsDetection(settings.mock_gps_detection ?? true);
        setLateAlertEnabled(settings.late_alert_enabled ?? true);
        setAbsentAlertEnabled(settings.absent_alert_enabled ?? true);
        setWhatsappApiKey(settings.whatsapp_api_key ?? "");

        // Load Android Settings
        const appSet = settings.app_settings || {};
        setSplashScreens(appSet.splash_screens || []);
        setAppIcon(appSet.app_icon || "");
        setBottomNav(appSet.bottom_navigation || []);
        setCustomScreens(appSet.new_screens || []);
        setAppSections(appSet.sections || {
          show_attendance: true,
          show_breaks: true,
          show_payroll: true,
          show_history: true
        });
      }

      // Load Admins List
      const employees = await api.get('/employees');
      if (Array.isArray(employees)) {
        // Filter out non-staff members
        setAdminsList(employees.filter(e => e.role !== 'staff'));
      }
    } catch (err) {
      console.error("Error loading settings data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Settings
  const handleSaveGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        hospital_name: hospitalName,
        geo_fence_lat: Number(geoFenceLat),
        geo_fence_lng: Number(geoFenceLng),
        geo_fence_radius_m: Number(geoFenceRadiusM),
        face_match_threshold: Number(faceMatchThreshold),
        mock_gps_detection: mockGpsDetection,
        late_alert_enabled: lateAlertEnabled,
        absent_alert_enabled: absentAlertEnabled,
        whatsapp_api_key: whatsappApiKey || undefined,
        app_settings: {
          splash_screens: splashScreens,
          app_icon: appIcon,
          bottom_navigation: bottomNav,
          new_screens: customScreens,
          sections: appSections
        }
      };

      await api.put('/settings', payload);
      alert("Settings saved successfully.");
      fetchData();
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add Splash URL
  const handleAddSplash = () => {
    setSplashScreens([...splashScreens, ""]);
  };

  // Delete Splash URL
  const handleDelSplash = (idx: number) => {
    setSplashScreens(splashScreens.filter((_, i) => i !== idx));
  };

  // Update Splash URL
  const handleUpdateSplash = (val: string, idx: number) => {
    const next = [...splashScreens];
    next[idx] = val;
    setSplashScreens(next);
  };

  // Add Custom Screen
  const handleAddCustomScreen = () => {
    setCustomScreens([...customScreens, { title: "New Info", icon: "info", route: `/custom-${Date.now()}`, content: "" }]);
  };

  // Delete Custom Screen
  const handleDelCustomScreen = (idx: number) => {
    setCustomScreens(customScreens.filter((_, i) => i !== idx));
  };

  // Update Custom Screen fields
  const handleUpdateCustomScreen = (fields: any, idx: number) => {
    const next = [...customScreens];
    next[idx] = { ...next[idx], ...fields };
    setCustomScreens(next);
  };

  // Add/Edit click handlers
  const handleAddAdminClick = () => {
    setEditingAdmin(null);
    setAdminName("");
    setAdminEmail("");
    setAdminCode("");
    setAdminMobile("");
    setAdminPassword("");
    setAdminRole("hr");
    setAdminPerms({
      read_employees: true,
      read_attendance: true,
      read_shifts: true,
      read_reports: true,
      read_audit_logs: false,
      write_employees: false,
      write_attendance: false,
      write_shifts: false,
      write_reports: false,
      write_settings: false
    });
    setShowAdminForm(true);
  };

  const handleEditClick = (admin: any) => {
    setEditingAdmin(admin);
    setAdminName(admin.full_name);
    setAdminEmail(admin.email || "");
    setAdminCode(admin.employee_code || "");
    setAdminMobile(admin.mobile || "");
    setAdminPassword(""); // blank by default when editing
    setAdminRole(admin.role || "hr");
    setAdminPerms(admin.permissions || {
      read_employees: true,
      read_attendance: true,
      read_shifts: true,
      read_reports: true,
      read_audit_logs: false,
      write_employees: false,
      write_attendance: false,
      write_shifts: false,
      write_reports: false,
      write_settings: false
    });
    setShowAdminForm(true);
  };

  const handleCancelAdminForm = () => {
    setShowAdminForm(false);
    setEditingAdmin(null);
    setAdminName("");
    setAdminEmail("");
    setAdminCode("");
    setAdminMobile("");
    setAdminPassword("");
    setAdminRole("hr");
    setAdminPerms({
      read_employees: true,
      read_attendance: true,
      read_shifts: true,
      read_reports: true,
      read_audit_logs: false,
      write_employees: false,
      write_attendance: false,
      write_shifts: false,
      write_reports: false,
      write_settings: false
    });
  };

  // Save admin (create/update)
  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName || !adminEmail) {
      alert("Name and email are required.");
      return;
    }
    if (!editingAdmin && !adminPassword) {
      alert("Password is required for a new administrator.");
      return;
    }
    try {
      setSaving(true);
      const payload: any = {
        full_name: adminName,
        email: adminEmail,
        mobile: adminMobile || '9999999999',
        employee_code: adminCode || `DVH-${Math.floor(1000 + Math.random() * 9000)}`,
        role: adminRole,
        permissions: adminPerms
      };
      if (adminPassword) {
        payload.password = adminPassword;
      }

      if (editingAdmin) {
        await api.put(`/employees/${editingAdmin.id}`, payload);
        alert("Administrator updated successfully!");
      } else {
        await api.post('/employees', payload);
        alert("Administrator added successfully!");
      }
      setShowAdminForm(false);
      setEditingAdmin(null);
      setAdminName("");
      setAdminEmail("");
      setAdminCode("");
      setAdminMobile("");
      setAdminPassword("");
      fetchData();
    } catch (err: any) {
      alert("Failed to save admin: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Are you sure you want to delete this administrator?")) return;
    try {
      await api.del(`/employees/${id}`);
      alert("Administrator deleted successfully.");
      fetchData();
    } catch (err: any) {
      alert("Failed to delete admin: " + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title block with gradient background header */}
      <div className="bg-gradient-to-tr from-slate-950 via-[#131b40] to-indigo-950 text-white p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#c8410a]/15 rounded-full blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/15 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
            <Settings className="w-6 h-6 text-[#c8410a]" />
          </div>
          <div>
            <h1 className="text-2xl font-serif tracking-wide font-medium">System Administration</h1>
            <p className="text-xs text-slate-300">Manage global geofencing, administrator permissions, and Android client configurations</p>
          </div>
        </div>
      </div>

      {/* Tabs list with modern active indicators */}
      <div className="flex bg-slate-200/50 backdrop-blur-sm p-1.5 rounded-xl gap-1.5 border border-slate-300/60 shadow-inner">
        <button
          onClick={() => setActiveTab("global")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeTab === "global" ? "bg-white text-slate-900 shadow-md scale-[1.02]" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Settings className="w-4 h-4" /> Global Settings
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeTab === "admins" ? "bg-white text-slate-900 shadow-md scale-[1.02]" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" /> Administrators
        </button>
        <button
          onClick={() => setActiveTab("android")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
            activeTab === "android" ? "bg-white text-slate-900 shadow-md scale-[1.02]" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Smartphone className="w-4 h-4" /> Android Settings
        </button>
      </div>

      {loading ? (
        <Card className="shadow-lg border-slate-200 bg-white">
          <CardContent className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#c8410a] animate-spin" />
            <span className="text-sm text-slate-400">Loading configurations...</span>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: Global Config */}
          {activeTab === "global" && (
            <Card className="shadow-premium border-slate-200/85 bg-glass rounded-2xl">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-lg">Global Parameters</CardTitle>
                <CardDescription>Adjust coordinates, WhatsApp integrations, and late check-in parameters</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveGlobal} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="hosp-name">Hospital Name</Label>
                    <Input id="hosp-name" value={hospitalName} onChange={e => setHospitalName(e.target.value)} required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hospital Latitude</Label>
                      <Input type="number" step="0.000001" value={geoFenceLat} onChange={e => setGeoFenceLat(Number(e.target.value))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Hospital Longitude</Label>
                      <Input type="number" step="0.000001" value={geoFenceLng} onChange={e => setGeoFenceLng(Number(e.target.value))} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Geofence Radius Limit (meters)</Label>
                      <Input type="number" value={geoFenceRadiusM} onChange={e => setGeoFenceRadiusM(Number(e.target.value))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Face Match Threshold (%)</Label>
                      <Input type="number" min="50" max="100" value={faceMatchThreshold} onChange={e => setFaceMatchThreshold(Number(e.target.value))} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>WhatsApp API Business Key</Label>
                    <Input type="password" value={whatsappApiKey} onChange={e => setWhatsappApiKey(e.target.value)} placeholder="Enter API Token" />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-start space-x-3">
                      <input type="checkbox" id="mock" checked={mockGpsDetection} onChange={e => setMockGpsDetection(e.target.checked)} className="h-4 w-4 rounded mt-1 text-[#c8410a]" />
                      <div>
                        <Label htmlFor="mock" className="cursor-pointer">Block Mock GPS Locations</Label>
                        <p className="text-xs text-slate-400">Rejects attendance logs generated using simulated GPS apps</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input type="checkbox" id="late" checked={lateAlertEnabled} onChange={e => setLateAlertEnabled(e.target.checked)} className="h-4 w-4 rounded mt-1 text-[#c8410a]" />
                      <div>
                        <Label htmlFor="late" className="cursor-pointer">Late Arrivals Alert</Label>
                        <p className="text-xs text-slate-400">Sends instant notifications to HR if employees check in after grace windows</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input type="checkbox" id="absent" checked={absentAlertEnabled} onChange={e => setAbsentAlertEnabled(e.target.checked)} className="h-4 w-4 rounded mt-1 text-[#c8410a]" />
                      <div>
                        <Label htmlFor="absent" className="cursor-pointer">Silence Absence Alert</Label>
                        <p className="text-xs text-slate-400">Sends alerts when a scheduled shift starts without a check-in trigger</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button type="submit" className="bg-[#c8410a] hover:bg-[#a63306]" disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Global Config
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: Administrators Management */}
          {activeTab === "admins" && (
            <div className="space-y-6">
              {showAdminForm && (
                <Card className="shadow-premium border-slate-200/85 bg-glass rounded-2xl">
                  <CardHeader className="border-b border-slate-200/60 pb-4">
                    <CardTitle className="text-lg font-medium">{editingAdmin ? `Edit Administrator: ${editingAdmin.full_name}` : "Register New Administrator"}</CardTitle>
                    <CardDescription>
                      {editingAdmin ? "Modify administrator account credentials and customized permissions" : "Configure credentials and customized read/write permissions for specific modules"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleSaveAdmin} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name *</Label>
                          <Input value={adminName} onChange={e => setAdminName(e.target.value)} required placeholder="Superintendent / HR Name" className="bg-white/60 border-slate-200 focus:bg-white" />
                        </div>
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required placeholder="admin@hospital.com" className="bg-white/60 border-slate-200 focus:bg-white" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>{editingAdmin ? "New Password (leave blank to keep current)" : "Password *"}</Label>
                          <Input 
                            type="password" 
                            value={adminPassword} 
                            onChange={e => setAdminPassword(e.target.value)} 
                            required={!editingAdmin} 
                            placeholder={editingAdmin ? "Leave blank to keep current" : "••••••••"} 
                            className="bg-white/60 border-slate-200 focus:bg-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Employee Code</Label>
                          <Input value={adminCode} onChange={e => setAdminCode(e.target.value)} placeholder="e.g. DVH-010" className="bg-white/60 border-slate-200 focus:bg-white" />
                        </div>
                        <div className="space-y-2">
                          <Label>Mobile Number</Label>
                          <Input value={adminMobile} onChange={e => setAdminMobile(e.target.value)} placeholder="9876543210" className="bg-white/60 border-slate-200 focus:bg-white" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Role</Label>
                        <select 
                          value={adminRole} 
                          onChange={e => setAdminRole(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-sm"
                        >
                          <option value="hr">HR Manager</option>
                          <option value="dept_head">Department Head</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>

                      {/* Customized Permissions */}
                      <div className="space-y-3 pt-4 border-t border-slate-200/60">
                        <Label className="text-xs uppercase tracking-wider font-semibold text-slate-500">Customized Permissions</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 shadow-sm">
                            <p className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Shield className="w-4 h-4 text-[#c8410a]" /> Read Permissions</p>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input type="checkbox" checked={adminPerms.read_employees} onChange={e => setAdminPerms({ ...adminPerms, read_employees: e.target.checked })} />
                              Staff / Employees directory
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer mt-1">
                              <input type="checkbox" checked={adminPerms.read_attendance} onChange={e => setAdminPerms({ ...adminPerms, read_attendance: e.target.checked })} />
                              Attendance records & history
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer mt-1">
                              <input type="checkbox" checked={adminPerms.read_shifts} onChange={e => setAdminPerms({ ...adminPerms, read_shifts: e.target.checked })} />
                              Shifts configuration
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer mt-1">
                              <input type="checkbox" checked={adminPerms.read_reports} onChange={e => setAdminPerms({ ...adminPerms, read_reports: e.target.checked })} />
                              Reports and Export data
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer mt-1">
                              <input type="checkbox" checked={adminPerms.read_audit_logs} onChange={e => setAdminPerms({ ...adminPerms, read_audit_logs: e.target.checked })} />
                              Immutable Audit Logs
                            </label>
                          </div>

                          <div className="space-y-2 bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 shadow-sm">
                            <p className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Shield className="w-4 h-4 text-indigo-600" /> Write / Edit Permissions</p>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input type="checkbox" checked={adminPerms.write_employees} onChange={e => setAdminPerms({ ...adminPerms, write_employees: e.target.checked })} />
                              Add / edit employees profile
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer mt-1">
                              <input type="checkbox" checked={adminPerms.write_attendance} onChange={e => setAdminPerms({ ...adminPerms, write_attendance: e.target.checked })} />
                              Manual correction / edit records
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer mt-1">
                              <input type="checkbox" checked={adminPerms.write_shifts} onChange={e => setAdminPerms({ ...adminPerms, write_shifts: e.target.checked })} />
                              Add / modify shifts & grace time
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer mt-1">
                              <input type="checkbox" checked={adminPerms.write_reports} onChange={e => setAdminPerms({ ...adminPerms, write_reports: e.target.checked })} />
                              Generate payroll adjustments
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer mt-1">
                              <input type="checkbox" checked={adminPerms.write_settings} onChange={e => setAdminPerms({ ...adminPerms, write_settings: e.target.checked })} />
                              Modify Settings & App Config
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/60">
                        <Button type="button" variant="outline" onClick={handleCancelAdminForm} className="border-slate-200 hover:bg-slate-50">Cancel</Button>
                        <Button type="submit" className="bg-[#c8410a] hover:bg-[#a63306] shadow-sm text-white font-medium" disabled={saving}>
                          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} {editingAdmin ? "Update Administrator" : "Save Administrator"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Admins List */}
              <Card className="shadow-premium border-slate-200/85 bg-glass rounded-2xl">
                <CardHeader className="py-4 border-b border-slate-200/60 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium">Registered Administrators</CardTitle>
                    <CardDescription>Manage active HR accounts, department supervisors, and permissions</CardDescription>
                  </div>
                  {!showAdminForm && (
                    <Button onClick={handleAddAdminClick} className="bg-[#c8410a] hover:bg-[#a63306] text-white font-medium shadow-sm">
                      <Plus className="w-4 h-4 mr-2" /> Add Administrator
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-mono uppercase tracking-wider text-left">
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Email</th>
                          <th className="px-4 py-3 font-medium">Role</th>
                          <th className="px-4 py-3 font-medium">Write Status</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adminsList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">No administrators registered yet.</td>
                          </tr>
                        ) : (
                          adminsList.map((admin) => (
                            <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-900">{admin.full_name}</td>
                              <td className="px-4 py-3 text-slate-700">{admin.email}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full ${
                                  admin.role === 'super_admin' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                  admin.role === 'hr' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {admin.role === 'super_admin' ? 'Super Admin' :
                                   admin.role === 'hr' ? 'HR Manager' : 'Dept Head'}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-xs">
                                {admin.permissions?.write === true || admin.permissions?.write_settings === true ? (
                                  <span className="text-emerald-600 font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Read / Write</span>
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Read Only</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleEditClick(admin)}
                                    className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                    title="Edit Administrator"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDeleteAdmin(admin.id)} 
                                    disabled={admin.employee_code === 'DVH-001'} // Can't delete base super admin
                                    className="h-8 w-8 text-red-500 hover:text-red-750"
                                    title="Delete Administrator"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 3: Android App Config */}
          {activeTab === "android" && (
            <Card className="shadow-premium border-slate-200/85 bg-glass rounded-2xl">
              <CardHeader className="border-b border-slate-200/60">
                <CardTitle className="text-lg font-medium">Android App Configuration</CardTitle>
                <CardDescription>Customize app theme assets, bottom navigation items, and active sections dynamically</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveGlobal} className="space-y-6">
                  {/* App Assets */}
                  <div className="space-y-4">
                    <Label className="text-xs uppercase tracking-wider font-semibold text-slate-500">App Assets</Label>
                    <div className="space-y-2">
                      <Label>App Icon URL</Label>
                      <Input value={appIcon} onChange={e => setAppIcon(e.target.value)} placeholder="https://domain.com/icon.png" className="bg-white/60 border-slate-200 focus:bg-white" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Splash Screen URLs (Multiple)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddSplash} className="h-7 border-dashed border-slate-200 hover:bg-slate-50">
                          <Plus className="w-3 h-3 mr-1" /> Add Splash Image
                        </Button>
                      </div>
                      {splashScreens.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No splash screens added. Default logo will be shown.</p>
                      ) : (
                        <div className="space-y-2">
                          {splashScreens.map((url, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <Input value={url} onChange={e => handleUpdateSplash(e.target.value, idx)} placeholder="https://domain.com/splash.png" className="flex-1 bg-white/60 border-slate-200 focus:bg-white" />
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleDelSplash(idx)} className="h-10 w-10 text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* App Sections Visibility */}
                  <div className="space-y-3 pt-6 border-t border-slate-200/60">
                    <Label className="text-xs uppercase tracking-wider font-semibold text-slate-500">Feature Sections Visibility</Label>
                    <div className="grid grid-cols-2 gap-4 bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 shadow-sm">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={appSections.show_attendance ?? true} onChange={e => setAppSections({ ...appSections, show_attendance: e.target.checked })} />
                        Show Attendance check-in / check-out
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={appSections.show_breaks ?? true} onChange={e => setAppSections({ ...appSections, show_breaks: e.target.checked })} />
                        Show Break Timer & details
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={appSections.show_payroll ?? true} onChange={e => setAppSections({ ...appSections, show_payroll: e.target.checked })} />
                        Show Payroll & salary calculations
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={appSections.show_history ?? true} onChange={e => setAppSections({ ...appSections, show_history: e.target.checked })} />
                        Show Month history calendars
                      </label>
                    </div>
                  </div>

                  {/* Custom Navigation Tab Details */}
                  <div className="space-y-4 pt-6 border-t border-slate-200/60">
                    <Label className="text-xs uppercase tracking-wider font-semibold text-slate-500 font-mono">Dynamic Custom Screens</Label>
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" size="sm" onClick={handleAddCustomScreen} className="h-8 border-slate-200 hover:bg-slate-50">
                        <Plus className="w-4 h-4 mr-1" /> Add Custom Page
                      </Button>
                    </div>
                    {customScreens.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4 bg-white/40 backdrop-blur-sm rounded-xl border border-dashed border-slate-200/60">No custom screens registered.</p>
                    ) : (
                      <div className="space-y-4">
                        {customScreens.map((scr, idx) => (
                          <div key={idx} className="bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 space-y-3 relative shadow-sm">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelCustomScreen(idx)} 
                              className="absolute top-2 right-2 text-red-500 hover:text-red-700 h-8 w-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-[10px] uppercase">Screen Title</Label>
                                <Input value={scr.title} onChange={e => handleUpdateCustomScreen({ title: e.target.value }, idx)} className="bg-white/80 border-slate-200 focus:bg-white h-9" />
                              </div>
                              <div>
                                <Label className="text-[10px] uppercase">Menu Icon Name (e.g. info, help, book)</Label>
                                <Input value={scr.icon} onChange={e => handleUpdateCustomScreen({ icon: e.target.value }, idx)} className="bg-white/80 border-slate-200 focus:bg-white h-9" />
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] uppercase">Rich Screen Content / Message</Label>
                              <textarea 
                                value={scr.content} 
                                onChange={e => handleUpdateCustomScreen({ content: e.target.value }, idx)}
                                className="w-full border border-slate-200 rounded-lg p-2 bg-white/80 focus:bg-white text-xs h-20 outline-none"
                                placeholder="Enter info text or announcement to display in the app..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" className="bg-[#c8410a] hover:bg-[#a63306]" disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Android Settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
