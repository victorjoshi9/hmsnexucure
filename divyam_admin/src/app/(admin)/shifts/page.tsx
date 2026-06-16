"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit3, Trash2, Loader2, Save, Users, Clock, X } from "lucide-react";

export default function ShiftsManagementPage() {
  const [activeTab, setActiveTab] = useState<"definitions" | "assignments">("definitions");
  
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State (Shift Definitions)
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);

  const [formName, setFormName] = useState("");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("17:00");
  const [formGraceMinutes, setFormGraceMinutes] = useState("10");
  const [formBreakLimit, setFormBreakLimit] = useState("60");

  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedShiftId, setSelectedShiftId] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shiftsRes, empRes] = await Promise.all([
        api.get('/shifts'),
        api.get('/employees')
      ]);
      setShifts(Array.isArray(shiftsRes) ? shiftsRes : shiftsRes.items || []);
      setEmployees(Array.isArray(empRes) ? empRes : empRes.items || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetFormState = () => {
    setFormName("");
    setFormStartTime("09:00");
    setFormEndTime("17:00");
    setFormGraceMinutes("10");
    setFormBreakLimit("60");
  };

  const handleEditShift = (shift: any) => {
    setEditingShift(shift);
    setFormName(shift.name);
    setFormStartTime(shift.start_time ? shift.start_time.slice(0, 5) : "09:00");
    setFormEndTime(shift.end_time ? shift.end_time.slice(0, 5) : "17:00");
    setFormGraceMinutes(shift.grace_minutes?.toString() || "10");
    setFormBreakLimit(shift.total_break_limit_min?.toString() || "60");
    setShowForm(true);
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift? Employee assignments might break if this shift is in use.")) return;
    try {
      await api.del(`/shifts/${id}`);
      alert("Shift deleted successfully.");
      fetchData();
    } catch (err: any) {
      alert("Failed to delete shift: " + err.message);
    }
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formStartTime || !formEndTime) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formName,
        start_time: formStartTime.length === 5 ? formStartTime + ":00" : formStartTime,
        end_time: formEndTime.length === 5 ? formEndTime + ":00" : formEndTime,
        grace_minutes: parseInt(formGraceMinutes) || 10,
        total_break_limit_min: parseInt(formBreakLimit) || 60
      };

      if (editingShift) {
        await api.put(`/shifts/${editingShift.id}`, payload);
        alert("Shift updated successfully.");
      } else {
        await api.post(`/shifts`, payload);
        alert("Shift created successfully.");
      }

      setShowForm(false);
      setEditingShift(null);
      resetFormState();
      fetchData();
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const openAssignModal = (emp: any) => {
    setSelectedEmployee(emp);
    setSelectedShiftId(emp.shift_id || "");
    setShowAssignModal(true);
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      setSaving(true);
      await api.put(`/employees/${selectedEmployee.id}`, {
        shift_id: selectedShiftId || null
      });
      alert("Employee shift updated successfully.");
      setShowAssignModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to assign shift.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Shift Configuration</h1>
          <p className="text-sm text-slate-500">Configure shifts and assign them to employees</p>
        </div>
        {activeTab === "definitions" && (
          <Button 
            onClick={() => {
              setEditingShift(null);
              resetFormState();
              setShowForm(true);
            }} 
            className="bg-[#c8410a] hover:bg-[#a63306]"
          >
            <Plus className="w-4 h-4 mr-2" /> Add New Shift
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("definitions")}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "definitions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4 mr-2" /> Shift Definitions
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "assignments" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 mr-2" /> Employee Assignments
        </button>
      </div>

      {activeTab === "definitions" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Add / Edit Form Card */}
          {showForm && (
            <Card className="border-slate-200 shadow-md bg-white">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-lg">
                  {editingShift ? `Modify Shift: ${editingShift.name}` : "Create New Shift"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSaveShift} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Shift Name *</Label>
                      <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Morning Shift" />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time *</Label>
                      <Input type="time" value={formStartTime} onChange={e => setFormStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time *</Label>
                      <Input type="time" value={formEndTime} onChange={e => setFormEndTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Grace Period (mins)</Label>
                      <Input type="number" value={formGraceMinutes} onChange={e => setFormGraceMinutes(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Breaks Limit (mins)</Label>
                      <Input type="number" value={formBreakLimit} onChange={e => setFormBreakLimit(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingShift(null); }}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#c8410a] hover:bg-[#a63306]" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Save className="w-4 h-4 mr-2" /> Save Shift
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Shifts List */}
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-mono uppercase tracking-wider text-left">
                      <th className="px-4 py-3 font-medium">Shift Name</th>
                      <th className="px-4 py-3 font-medium">Start Time</th>
                      <th className="px-4 py-3 font-medium">End Time</th>
                      <th className="px-4 py-3 font-medium">Grace Minutes</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-400">Loading configurations...</td></tr>
                    ) : shifts.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-slate-400">No shifts configured yet.</td></tr>
                    ) : (
                      shifts.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                          <td className="px-4 py-3 font-mono text-slate-700">{s.start_time ? s.start_time.slice(0, 5) : "—"}</td>
                          <td className="px-4 py-3 font-mono text-slate-700">{s.end_time ? s.end_time.slice(0, 5) : "—"}</td>
                          <td className="px-4 py-3 font-mono text-slate-700">{s.grace_minutes || 0} mins</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditShift(s)} className="h-8 w-8 text-slate-500 hover:text-slate-900">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteShift(s.id)} className="h-8 w-8 text-red-500 hover:text-red-750">
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

      {activeTab === "assignments" && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <Card className="shadow-sm border-slate-200 bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-mono uppercase tracking-wider text-left">
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Department</th>
                      <th className="px-4 py-3 font-medium">Current Shift</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-400">Loading employees...</td></tr>
                    ) : employees.length === 0 ? (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-400">No employees found.</td></tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{emp.full_name}</div>
                            <div className="text-xs text-slate-500">{emp.employee_code}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{emp.department?.name || "Unassigned"}</td>
                          <td className="px-4 py-3">
                            {emp.shift ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                {emp.shift.name} ({emp.shift.start_time?.slice(0,5)} - {emp.shift.end_time?.slice(0,5)})
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">No shift assigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openAssignModal(emp)}
                              className="text-[#c8410a] border-[#c8410a] hover:bg-[#c8410a]/10"
                            >
                              <Edit3 className="w-3 h-3 mr-1" /> Edit Shift
                            </Button>
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

      {/* Assign Shift Modal Popup */}
      {showAssignModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-md shadow-xl border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between py-4 border-b">
              <CardTitle className="text-lg">Assign Shift</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAssignModal(false)} className="h-8 w-8 rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAssignShift} className="space-y-6">
                <div>
                  <h3 className="font-medium text-slate-900">{selectedEmployee.full_name}</h3>
                  <p className="text-sm text-slate-500">{selectedEmployee.employee_code} • {selectedEmployee.department?.name || 'No Dept'}</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Select Shift</Label>
                  <select 
                    value={selectedShiftId} 
                    onChange={e => setSelectedShiftId(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">-- No Shift (Unassigned) --</option>
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.start_time?.slice(0,5)} to {s.end_time?.slice(0,5)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#c8410a] hover:bg-[#a63306]" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Assignment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
