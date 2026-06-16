"use client";

import { useEffect, useState, startTransition } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, AlertCircle, Bell, Users, CheckCircle, Clock, Coffee, ShieldAlert, Award } from "lucide-react";

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>({
    total_staff: 0,
    present: 0,
    absent: 0,
    late: 0,
    on_break: 0,
    checked_out: 0,
    on_leave: 0,
    pending_corrections: 0
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deptFilter, setDeptFilter] = useState("all");

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [todayData, alertsData, liveData] = await Promise.all([
        api.get('/dashboard/today').catch(() => ({})),
        api.get('/dashboard/alerts').catch(() => ({})),
        api.get('/attendance/live').catch(() => [])
      ]);

      if (todayData) {
        setKpis({
          total_staff: todayData.total_staff || 0,
          present: todayData.present || 0,
          absent: todayData.absent || 0,
          late: todayData.late || 0,
          on_break: todayData.on_break || 0,
          checked_out: todayData.checked_out || 0,
          on_leave: todayData.on_leave || 0,
          pending_corrections: todayData.pending_corrections || 0
        });
      }

      if (alertsData && Array.isArray(alertsData.items)) {
        setAlerts(alertsData.items);
      } else if (Array.isArray(alertsData)) {
        setAlerts(alertsData);
      } else {
        setAlerts([
          { id: 1, type: "system", title: "System Ready", message: "Real-time monitoring active. No anomalies detected.", time: "Live" }
        ]);
      }

      if (Array.isArray(liveData)) {
        setLiveFeed(liveData.slice(0, 10));
      } else if (liveData && Array.isArray(liveData.items)) {
        setLiveFeed(liveData.items.slice(0, 10));
      } else {
        setLiveFeed([]);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleExportCSV = () => {
    const headers = "Employee Name,Employee Code,Department,Check-In Time,Status,Face Score\n";
    const rows = liveFeed.map(r => 
      `"${r.employee?.full_name || r.name || ''}","${r.employee?.employee_code || ''}","${r.employee?.departments?.name || r.dept || ''}","${r.check_in ? new Date(r.check_in).toLocaleTimeString() : '—'}","${r.status || ''}","${r.face_score || r.score || '—'}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `hams_dashboard_live_feed_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  const presentPercentage = kpis.total_staff > 0 ? Math.round((kpis.present / kpis.total_staff) * 100) : 0;

  const filteredFeed = liveFeed.filter(item => {
    if (deptFilter === "all") return true;
    const deptName = item.employee?.departments?.name || item.dept || "";
    return deptName.toLowerCase() === deptFilter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="w-8 h-8 text-[#c8410a] animate-spin" />
        <span className="text-sm text-slate-500 font-medium font-sans">Loading Dashboard Overview...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Dashboard Overview</h1>
          <p className="text-sm text-slate-500">Real-time attendance stats, trends, and system alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9" disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={handleExportCSV} className="bg-[#c8410a] hover:bg-[#a63306] h-9">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-900">{kpis.total_staff}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Total Staff</div>
            </div>
            <Users className="w-8 h-8 text-slate-300" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 border-l-4 border-l-[#0a6640] bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-[#0a6640]">{kpis.present} <span className="text-xs text-slate-500">({presentPercentage}%)</span></div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Present Today</div>
            </div>
            <CheckCircle className="w-8 h-8 text-[#0a6640]/20" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 border-l-4 border-l-[#c8410a] bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-[#c8410a]">{kpis.absent}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Absent</div>
            </div>
            <ShieldAlert className="w-8 h-8 text-[#c8410a]/20" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 border-l-4 border-l-[#1a4a8a] bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-[#1a4a8a]">{kpis.on_break}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">On Break Now</div>
            </div>
            <Coffee className="w-8 h-8 text-[#1a4a8a]/20" />
          </CardContent>
        </Card>
      </div>

      {/* Row 1.5 - Extra KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-slate-800">{kpis.late}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">Late Today</div>
            </div>
            <Clock className="w-6 h-6 text-slate-300" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-slate-800">{kpis.checked_out}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">Checked Out</div>
            </div>
            <CheckCircle className="w-6 h-6 text-slate-300" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-slate-800">{kpis.on_leave}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">On Leave</div>
            </div>
            <Award className="w-6 h-6 text-slate-300" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-slate-800">{kpis.pending_corrections}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">Pending Corrections</div>
            </div>
            <AlertCircle className="w-6 h-6 text-slate-300" />
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Charts, Recent Punches, Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Charts & Trends */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Weekly Attendance Trend */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="py-4 border-b border-slate-100">
                <CardTitle className="text-sm font-medium">Weekly Attendance Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-40 w-full flex items-center justify-center font-mono text-[10px] text-slate-400 italic">
                  No trend data available for the current week yet.
                </div>
              </CardContent>
            </Card>

            {/* Department-wise Attendance */}
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="py-4 border-b border-slate-100">
                <CardTitle className="text-sm font-medium">Department Attendance %</CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex items-center justify-center text-xs text-slate-400 italic min-h-[160px]">
                No departmental data available yet.
              </CardContent>
            </Card>

          </div>

          {/* Live Status Feed Table */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Activity (Last 10 check-ins)</CardTitle>
              <select 
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="text-xs border rounded px-2.5 py-1 text-slate-600 bg-white outline-none"
              >
                <option value="all">All Departments</option>
                <option value="OPD">OPD</option>
                <option value="ICU">ICU</option>
                <option value="Lab">Lab</option>
                <option value="Pharmacy">Pharmacy</option>
              </select>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-mono uppercase tracking-wider text-left">
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Dept</th>
                      <th className="px-4 py-3 font-medium">Check In</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Face Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFeed.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">No recent activity matching filter.</td>
                      </tr>
                    ) : (
                      filteredFeed.map((item, idx) => {
                        const checkInTime = item.check_in ? new Date(item.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
                        return (
                          <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-900">
                              <a href={`/staff?search=${item.employee?.full_name || item.name || ''}`} className="hover:underline text-[#185fa5]">
                                {item.employee?.full_name || item.name}
                              </a>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{item.employee?.departments?.name || item.dept || "—"}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono">{checkInTime}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                                item.status === 'Present' || item.status === 'Working' ? 'bg-[#e6f5ee] text-[#0a6640]' :
                                item.status === 'On Break' || item.status === 'Break' ? 'bg-[#e8f0fa] text-[#1a4a8a]' :
                                'bg-[#fff0ec] text-[#c8410a]'
                              }`}>
                                {item.status || 'Present'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                              {item.face_score || item.score ? `${item.face_score || item.score}%` : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Feed Column */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200 h-full">
            <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center gap-2">
              <Bell className="w-4 h-4 text-[#c8410a]" />
              <CardTitle className="text-sm font-medium">Real-Time Alert Feed</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center text-slate-400 py-8 text-xs">No active alerts at this time.</div>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={alert.id || idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3">
                    <div className={`p-1.5 rounded-md mt-0.5 ${
                      alert.type === 'late' ? 'bg-amber-100 text-amber-700' :
                      alert.type === 'break' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-xs text-slate-900">{alert.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">{alert.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
