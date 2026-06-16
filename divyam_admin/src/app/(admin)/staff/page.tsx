"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, ToggleLeft, ToggleRight, Loader2, Edit3, Trash2, Smartphone } from "lucide-react";

export default function StaffManagementPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formShift, setFormShift] = useState("");
  const [formDesignation, setFormDesignation] = useState("Staff Nurse");
  const [formRole, setFormRole] = useState("staff");
  const [formHourlyRate, setFormHourlyRate] = useState("0");

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
    } catch (err) {
      console.error("Error fetching staff data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (emp: any) => {
    try {
      const nextStatus = !emp.is_active;
      await api.patch(`/employees/${emp.id}/status`, {
        is_active: nextStatus,
        reason: nextStatus ? "Re-activated" : "Deactivated by admin"
      });

      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, is_active: nextStatus } : e));
    } catch (err: any) {
      alert(err.message || "Failed to update status");
      console.error(err);
    }
  };

  const handleResetDevice = async (emp: any) => {
    if (!confirm(`Are you sure you want to reset device binding for ${emp.full_name}?`)) return;
    try {
      await api.del(`/employees/${emp.id}/device`);
      alert("Device binding reset successfully");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to reset device binding");
      console.error(err);
    }
  };

  const handleDeleteEmployee = async (emp: any) => {
    if (!confirm(`Are you sure you want to delete ${emp.full_name}? This will soft delete their record.`)) return;
    try {
      await api.del(`/employees/${emp.id}`);
      alert("Employee deleted successfully");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete employee");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formMobile || !formDept || !formShift || !formDesignation) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      const employeePayload = {
        employee_code: formCode || 'DVH-' + Math.floor(1000 + Math.random() * 9000),
        full_name: formName,
        mobile: formMobile,
        email: formEmail || null,
        department_id: formDept,
        shift_id: formShift,
        designation: formDesignation,
        joining_date: new Date().toISOString().split('T')[0],
        role: formRole,
        hourly_rate: parseFloat(formHourlyRate) || 0
      };

      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, employeePayload);
        alert("Employee updated successfully.");
      } else {
        await api.post(`/employees`, employeePayload);
        alert("Employee added successfully.");
      }

      // Reset form
      setShowAddForm(false);
      setEditingEmployee(null);
      resetFormState();
      fetchData();
    } catch (err: any) {
      alert(err.message || "An error occurred.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resetFormState = () => {
    setFormName("");
    setFormCode("");
    setFormMobile("");
    setFormEmail("");
    setFormDept("");
    setFormShift("");
    setFormDesignation("Staff Nurse");
    setFormRole("staff");
    setFormHourlyRate("0");
  };

  const openEditModal = (emp: any) => {
    setEditingEmployee(emp);
    setFormName(emp.full_name);
    setFormCode(emp.employee_code);
    setFormMobile(emp.mobile);
    setFormEmail(emp.email || "");
    setFormDept(emp.department_id || emp.department?.id || "");
    setFormShift(emp.shift_id || emp.shift?.id || "");
    setFormDesignation(emp.designation || "Staff Nurse");
    setFormRole(emp.role || "staff");
    setFormHourlyRate(emp.hourly_rate?.toString() || "0");
    setShowAddForm(true);
  };

  // Filter logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.full_name.toLowerCase().includes(search.toLowerCase()) || 
      emp.employee_code.toLowerCase().includes(search.toLowerCase()) ||
      emp.mobile.includes(search);
    
    const empDeptId = emp.department_id || emp.department?.id;
    const matchesDept = deptFilter === 'all' || empDeptId === deptFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && emp.is_active) || 
      (statusFilter === 'inactive' && !emp.is_active);

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500">Manage hospital staff profiles, departments, shifts, rates, and active states</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.href = '/employees/new'} 
            className="bg-[#c8410a] hover:bg-[#a63306]"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Add Staff Profile
          </Button>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {showAddForm && (
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-lg">
              {editingEmployee ? `Edit Employee Profile: ${editingEmployee.full_name}` : "Create Staff Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Employee Code (Optional)</Label>
                  <Input value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="e.g. DVH-042" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number (For Login) *</Label>
                  <Input value={formMobile} onChange={e => setFormMobile(e.target.value)} placeholder="10 digit mobile" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Email (Optional)</Label>
                  <Input value={formEmail} type="email" onChange={e => setFormEmail(e.target.value)} placeholder="john@hospital.com" />
                </div>
                <div className="space-y-2">
                  <Label>Designation *</Label>
                  <Input value={formDesignation} onChange={e => setFormDesignation(e.target.value)} placeholder="e.g. Doctor, Nurse" />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <select 
                    value={formRole} 
                    onChange={e => setFormRole(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  >
                    <option value="staff">Staff</option>
                    <option value="dept_head">Department Head</option>
                    <option value="hr">HR Manager</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Hourly Rate (INR) *</Label>
                  <Input value={formHourlyRate} type="number" onChange={e => setFormHourlyRate(e.target.value)} placeholder="e.g. 250" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <select 
                    value={formDept} 
                    onChange={e => setFormDept(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Shift *</Label>
                  <select 
                    value={formShift} 
                    onChange={e => setFormShift(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  >
                    <option value="">Select Shift</option>
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setShowAddForm(false); setEditingEmployee(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#c8410a] hover:bg-[#a63306]" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingEmployee ? "Update Employee" : "Save Employee"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter and Table Card */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4 space-y-4">
          {/* Filters Row */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by name, ID or mobile..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select 
                value={deptFilter} 
                onChange={e => setDeptFilter(e.target.value)}
                className="w-[160px] h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="w-[130px] h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-mono uppercase tracking-wider text-left">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Dept</th>
                  <th className="px-4 py-3 font-medium">Shift</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                  <th className="px-4 py-3 font-medium">Face Bio</th>
                  <th className="px-4 py-3 font-medium">Device Bound</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">Loading staff records...</td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">No staff members found matching filters.</td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const deptName = emp.departments?.name || emp.department?.name || "—";
                    const shiftName = emp.shifts?.name || emp.shift?.name || "—";
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">{emp.employee_code}</td>
                        <td className="px-4 py-3 font-medium text-slate-950">{emp.full_name}</td>
                        <td className="px-4 py-3 text-slate-600">{emp.mobile}</td>
                        <td className="px-4 py-3 text-slate-600">{deptName}</td>
                        <td className="px-4 py-3 text-slate-600">{shiftName}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">₹{emp.hourly_rate ?? 0}/hr</td>
                        <td className="px-4 py-3">
                          {emp.face_enrolled || emp.face_descriptor ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                              Enrolled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {emp.device_id || emp.device_bound ? (
                            <button 
                              onClick={() => handleResetDevice(emp)}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors gap-1 cursor-pointer"
                            >
                              <Smartphone className="w-3 h-3" /> Bound (Reset)
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
                              Unbound
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggleActive(emp)}>
                            {emp.is_active ? (
                              <ToggleRight className="w-9 h-6 text-[#0a6640] cursor-pointer" />
                            ) : (
                              <ToggleLeft className="w-9 h-6 text-slate-300 cursor-pointer" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(emp)} className="h-8 w-8 text-slate-500 hover:text-slate-900">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteEmployee(emp)} className="h-8 w-8 text-red-500 hover:text-red-750">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
