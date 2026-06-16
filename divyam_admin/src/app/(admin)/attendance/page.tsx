"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Search, Edit3, Loader2, Save } from "lucide-react";

export default function AttendanceRecordsPage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters State
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form State for Manual Adjustments
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [formStatus, setFormStatus] = useState("Present");
  const [formReason, setFormReason] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch departments
      const deptRes = await api.get('/departments');
      setDepartments(Array.isArray(deptRes) ? deptRes : (deptRes.items || []));

      // Fetch shifts
      const shiftRes = await api.get('/shifts');
      setShifts(Array.isArray(shiftRes) ? shiftRes : (shiftRes.items || []));

      // Fetch employees
      const empRes = await api.get('/employees', { limit: 1000 });
      setEmployees(Array.isArray(empRes) ? empRes : (empRes.items || []));

      // Fetch attendance records for target date range
      const attRes = await api.get('/attendance/records', {
        from: dateFilter,
        to: dateFilter,
        dept_id: deptFilter !== 'all' ? deptFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 100
      });
      setAttendance(Array.isArray(attRes) ? attRes : (attRes.items || []));
    } catch (err) {
      console.error("Error fetching attendance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter, deptFilter, statusFilter]);

  const resetFormState = () => {
    setFormEmployeeId("");
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCheckIn("");
    setFormCheckOut("");
    setFormStatus("Present");
    setFormReason("");
  };

  const handleEditRecord = (record: any) => {
    setEditingRecord(record);
    const empId = record.employee?.id || record.employee_id;
    setFormEmployeeId(empId);
    setFormDate(record.date || new Date().toISOString().split('T')[0]);
    
    // Convert timestamp to time HH:MM
    const getHM = (isoStr: string | null) => {
      if (!isoStr) return "";
      const d = new Date(isoStr);
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    };
    
    setFormCheckIn(getHM(record.check_in));
    setFormCheckOut(getHM(record.check_out));
    setFormStatus(record.status || "Present");
    setFormReason("");
    setShowForm(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId || !formDate || !formReason) {
      alert("Please fill in all required fields, including the edit reason.");
      return;
    }

    if (formReason.length < 20) {
      alert("Inline edit rule: The reason must be at least 20 characters long.");
      return;
    }

    try {
      setSaving(true);
      
      // Construct timestamps
      const checkInTimestamp = formCheckIn ? new Date(`${formDate}T${formCheckIn}:00`).toISOString() : null;
      const checkOutTimestamp = formCheckOut ? new Date(`${formDate}T${formCheckOut}:00`).toISOString() : null;

      const payload = {
        check_in_time: checkInTimestamp,
        check_out_time: checkOutTimestamp,
        status: formStatus,
        edit_reason: formReason
      };

      if (editingRecord) {
        await api.put(`/attendance/${editingRecord.id}`, payload);
        alert("Attendance record updated successfully.");
      } else {
        alert("Punches can only be edited inline on an existing record. Please select a record to override.");
      }

      setShowForm(false);
      setEditingRecord(null);
      resetFormState();
      fetchData();
    } catch (err: any) {
      alert(err.message || "An error occurred.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = attendance.filter(record => {
    const empName = record.employee?.full_name || record.employees?.full_name || "";
    const empCode = record.employee?.employee_code || record.employees?.employee_code || "";
    const matchesSearch = 
      empName.toLowerCase().includes(search.toLowerCase()) ||
      empCode.toLowerCase().includes(search.toLowerCase());

    const empShiftId = record.employee?.shift_id || record.employee?.shift?.id;
    const matchesShift = shiftFilter === 'all' || empShiftId === shiftFilter;

    return matchesSearch && matchesShift;
  });

  const selectStyle = "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Attendance Records</h1>
          <p className="text-sm text-slate-500">View punches, calculate working hours, and manually adjust records</p>
        </div>
      </div>

      {/* Manual Edit Form */}
      {showForm && (
        <Card className="border-slate-200 shadow-md bg-white">
          <CardHeader className="py-4 border-b bg-slate-50/50">
            <CardTitle className="text-lg">
              {editingRecord ? `Modify Attendance Log` : "Add Manual Attendance Punch"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveRecord} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Employee *</Label>
                  <div className="p-2 border rounded bg-slate-50 text-slate-700 text-sm">
                    {editingRecord?.employee?.full_name || editingRecord?.employees?.full_name} ({editingRecord?.employee?.employee_code || editingRecord?.employees?.employee_code})
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input 
                    type="date" 
                    value={formDate} 
                    onChange={e => setFormDate(e.target.value)} 
                    disabled={true}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-In Time</Label>
                  <Input type="time" value={formCheckIn} onChange={e => setFormCheckIn(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Check-Out Time</Label>
                  <Input type="time" value={formCheckOut} onChange={e => setFormCheckOut(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Attendance Status *</Label>
                  <select 
                    value={formStatus} 
                    onChange={e => setFormStatus(e.target.value)}
                    className={selectStyle}
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Edit / Punch Reason (Audit Mandated, min 20 chars) *</Label>
                  <Input 
                    placeholder="Provide detailed reason for this manual override..." 
                    value={formReason} 
                    onChange={e => setFormReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingRecord(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#c8410a] hover:bg-[#a63306]" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" /> Save Punch
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters & Table */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search and Date Picker */}
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-stretch md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search staff..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <div className="flex items-center gap-2 border rounded-md px-3 py-1 bg-white h-9">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  value={dateFilter} 
                  onChange={e => setDateFilter(e.target.value)} 
                  className="text-sm outline-none text-slate-700 font-medium cursor-pointer"
                />
              </div>
            </div>

            {/* Config Filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="w-[140px]">
                <select 
                  value={deptFilter} 
                  onChange={e => setDeptFilter(e.target.value)}
                  className={selectStyle}
                >
                  <option value="all">All Depts</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-[140px]">
                <select 
                  value={shiftFilter} 
                  onChange={e => setShiftFilter(e.target.value)}
                  className={selectStyle}
                >
                  <option value="all">All Shifts</option>
                  {shifts.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="w-[130px]">
                <select 
                  value={statusFilter} 
                  onChange={e => setStatusFilter(e.target.value)}
                  className={selectStyle}
                >
                  <option value="all">All Statuses</option>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-mono uppercase tracking-wider text-left">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Check-In</th>
                  <th className="px-4 py-3 font-medium">Check-Out</th>
                  <th className="px-4 py-3 font-medium">Work Hours</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">Loading attendance logs...</td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">No records found for this date range.</td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const empName = record.employee?.full_name || record.employees?.full_name || "—";
                    const empCode = record.employee?.employee_code || record.employees?.employee_code || "—";
                    const deptName = record.employee?.departments?.name || record.employees?.departments?.name || record.employee?.dept?.name || record.dept || "—";
                    const checkInTime = record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
                    const checkOutTime = record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
                    
                    const workHours = record.total_work_minutes 
                      ? `${Math.floor(record.total_work_minutes / 60)}h ${record.total_work_minutes % 60}m` 
                      : (record.working_hours ? `${Math.floor(record.working_hours)}h ${Math.round((record.working_hours % 1) * 60)}m` : "—");

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{empName}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{empCode}</td>
                        <td className="px-4 py-3 text-slate-600">{deptName}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{checkInTime}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{checkOutTime}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{workHours}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            record.status === 'Present' || record.status === 'present' ? 'bg-green-50 text-green-700 border-green-200' :
                            record.status === 'Late' || record.status === 'late' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            record.status === 'Half Day' || record.status === 'halfday' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            record.status === 'On Leave' || record.status === 'onleave' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {record.status || 'Present'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditRecord(record)} className="h-8 w-8 text-slate-500 hover:text-slate-900">
                            <Edit3 className="w-4 h-4" />
                          </Button>
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
