"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, FileText, Download, BarChart2, Calendar, Users, Loader2 } from "lucide-react";

export default function ReportsPage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");

  // Filter State
  const [startDate, setStartDate] = useState(new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]); // last 7 days
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [deptFilter, setDeptFilter] = useState("all");
  const [reportType, setReportType] = useState("daily");

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch departments
      const deptRes = await api.get('/departments');
      setDepartments(Array.isArray(deptRes) ? deptRes : (deptRes.items || []));

      // Fetch attendance in range
      const attRes = await api.get('/attendance/records', {
        from: startDate,
        to: endDate,
        dept_id: deptFilter !== 'all' ? deptFilter : undefined,
        limit: 1000
      });
      setAttendance(Array.isArray(attRes) ? attRes : (attRes.items || []));
    } catch (err) {
      console.error("Error fetching report preview data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, deptFilter]);

  const pollJobStatus = async (jobId: string, format: string) => {
    const maxAttempts = 20;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      setExportProgress(`Processing file (Attempt ${attempts})...`);
      
      try {
        const statusRes = await api.get(`/reports/jobs/${jobId}`);
        if (statusRes.status === 'completed' && statusRes.download_url) {
          clearInterval(interval);
          setExporting(false);
          setExportProgress("");
          
          // Trigger file download
          const link = document.createElement("a");
          link.href = statusRes.download_url;
          link.download = `HAMS_Report_${reportType}_${startDate}_to_${endDate}.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          alert("Report generated successfully!");
        } else if (statusRes.status === 'failed') {
          clearInterval(interval);
          setExporting(false);
          setExportProgress("");
          alert("Report generation failed on server.");
        }
      } catch (err) {
        console.error(err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setExporting(false);
        setExportProgress("");
        alert("Report generation timed out. Please try again.");
      }
    }, 3000);
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      setExporting(true);
      setExportProgress("Queueing report job on server...");
      
      const payload = {
        type: reportType,
        format: format,
        from_date: startDate,
        to_date: endDate,
        dept_id: deptFilter !== 'all' ? deptFilter : null,
        employee_id: null,
        shift_id: null,
        email_to: []
      };

      const jobData = await api.post('/reports/generate', payload);
      const jobId = jobData.job_id;

      if (!jobId) {
        throw new Error("Failed to queue background job.");
      }

      pollJobStatus(jobId, format);
    } catch (err: any) {
      alert(err.message || "Failed to trigger report generation.");
      setExporting(false);
      setExportProgress("");
    }
  };

  // KPI Calculations
  const totalPunches = attendance.length;
  const presentCount = attendance.filter(r => r.status === 'Present' || r.status === 'present').length;
  const lateCount = attendance.filter(r => r.status === 'Late' || r.status === 'late').length;
  const leaveCount = attendance.filter(r => r.status === 'On Leave' || r.status === 'onleave').length;

  const presentPercentage = totalPunches > 0 ? Math.round(((presentCount + lateCount) / totalPunches) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Loading overlay */}
      {exporting && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4 text-white font-sans">
          <Loader2 className="w-10 h-10 text-[#c8410a] animate-spin" />
          <div className="font-semibold text-lg">Generating Report...</div>
          <div className="text-sm opacity-80">{exportProgress}</div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Generate, view, and export custom attendance and break log analytics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('csv')} variant="outline" className="border-slate-200">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Export CSV
          </Button>
          <Button onClick={() => handleExport('excel')} variant="outline" className="border-slate-200">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" /> Export Excel
          </Button>
          <Button onClick={() => handleExport('pdf')} className="bg-[#c8410a] hover:bg-[#a63306]">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Filters Form */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Report Category</Label>
              <select 
                value={reportType} 
                onChange={e => setReportType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="daily">Daily Attendance Summary</option>
                <option value="monthly_staff">Monthly Staff Report</option>
                <option value="dept">Department breakdown</option>
                <option value="late_arrivals">Late Arrivals Alert List</option>
                <option value="overtime">Overtime report</option>
                <option value="break_violations">Break violations</option>
                <option value="leave_summary">Leave summary</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Department Filter</Label>
              <select 
                value={deptFilter} 
                onChange={e => setDeptFilter(e.target.value)}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-slate-900">{totalPunches}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Total Logs</div>
            </div>
            <Users className="w-8 h-8 text-slate-300" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 border-l-4 border-l-[#0a6640]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-[#0a6640]">{presentPercentage}%</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Avg Attendance</div>
            </div>
            <BarChart2 className="w-8 h-8 text-[#0a6640]/20" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 border-l-4 border-l-[#c8410a]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-[#c8410a]">{lateCount}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Late Arrivals</div>
            </div>
            <Calendar className="w-8 h-8 text-[#c8410a]/20" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 border-l-4 border-l-[#185fa5]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-[#185fa5]">{leaveCount}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Leaves Registered</div>
            </div>
            <FileText className="w-8 h-8 text-[#185fa5]/20" />
          </CardContent>
        </Card>
      </div>

      {/* Report Summary Data Table */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-sm font-medium">
            Preview Output ({startDate} to {endDate})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-mono uppercase tracking-wider text-left">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">ID Code</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Punch In</th>
                  <th className="px-4 py-3 font-medium">Punch Out</th>
                  <th className="px-4 py-3 font-medium">Work Hours</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">Querying database...</td>
                  </tr>
                ) : attendance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">No records match parameters in this range.</td>
                  </tr>
                ) : (
                  attendance.map((r) => {
                    const empName = r.employee?.full_name || r.employees?.full_name || "—";
                    const empCode = r.employee?.employee_code || r.employees?.employee_code || "—";
                    const deptName = r.employee?.departments?.name || r.employees?.departments?.name || r.employee?.dept?.name || r.dept || "—";
                    const checkInTime = r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
                    const checkOutTime = r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
                    const workHours = r.total_work_minutes 
                      ? `${Math.floor(r.total_work_minutes / 60)}h ${r.total_work_minutes % 60}m` 
                      : (r.working_hours ? `${Math.floor(r.working_hours)}h ${Math.round((r.working_hours % 1) * 60)}m` : "—");

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{empName}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{empCode}</td>
                        <td className="px-4 py-3 text-slate-600">{deptName}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{r.date || "—"}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{checkInTime}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{checkOutTime}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{workHours}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            r.status === 'Present' || r.status === 'present' ? 'bg-green-50 text-green-700 border-green-200' :
                            r.status === 'Late' || r.status === 'late' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            r.status === 'Half Day' || r.status === 'halfday' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            r.status === 'On Leave' || r.status === 'onleave' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {r.status || 'Present'}
                          </span>
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
  );
}
