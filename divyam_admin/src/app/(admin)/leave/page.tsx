"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Check, X, Loader2 } from "lucide-react";

export default function LeaveManagementPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formLeaveTypeId, setFormLeaveTypeId] = useState("");
  const [formFromDate, setFormFromDate] = useState("");
  const [formToDate, setFormToDate] = useState("");
  const [formReason, setFormReason] = useState("");

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees', { limit: 1000 });
      const empList = Array.isArray(res) ? res : res.items || [];
      setEmployees(empList);
      if (empList.length > 0) {
        setFormEmployeeId(empList[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await api.get('/leave/types');
      const list = Array.isArray(res) ? res : res.items || [];
      setLeaveTypes(list);
      if (list.length > 0) {
        setFormLeaveTypeId(list[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leave/requests');
      setRequests(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchLeaveTypes();
    fetchLeaveRequests();
  }, []);

  const resetFormState = () => {
    if (employees.length > 0) {
      setFormEmployeeId(employees[0].id);
    } else {
      setFormEmployeeId("");
    }
    if (leaveTypes.length > 0) {
      setFormLeaveTypeId(leaveTypes[0].id);
    }
    setFormFromDate("");
    setFormToDate("");
    setFormReason("");
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId || !formLeaveTypeId || !formFromDate || !formToDate || !formReason) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      await api.post('/leave/requests', {
        employee_id: formEmployeeId,
        leave_type_id: formLeaveTypeId,
        from_date: formFromDate,
        to_date: formToDate,
        reason: formReason
      });

      alert("Leave request filed successfully.");
      setShowForm(false);
      resetFormState();
      fetchLeaveRequests();
    } catch (err: any) {
      alert(err.message || "Failed to file request.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (req: any, status: 'APPROVED' | 'REJECTED') => {
    const actionNote = prompt(status === 'APPROVED' ? "Enter approval note (optional):" : "Enter rejection reason (mandatory):");
    if (status === 'REJECTED' && !actionNote) {
      alert("Rejection reason is mandatory.");
      return;
    }

    try {
      if (status === 'APPROVED') {
        await api.post(`/leave/requests/${req.id}/approve`, {
          note: actionNote || "Approved"
        });
      } else {
        await api.post(`/leave/requests/${req.id}/reject`, {
          reason: actionNote
        });
      }

      alert(`Leave request has been ${status.toLowerCase()}.`);
      fetchLeaveRequests();
    } catch (err: any) {
      alert("Failed: " + err.message);
      console.error(err);
    }
  };

  const selectStyle = "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Leave Management</h1>
          <p className="text-sm text-slate-500">Approve employee leaves and automatically log leave attendance markers</p>
        </div>
        <Button 
          onClick={() => {
            resetFormState();
            setShowForm(true);
          }} 
          className="bg-[#c8410a] hover:bg-[#a63306]"
        >
          <Plus className="w-4 h-4 mr-2" /> File Leave Request
        </Button>
      </div>

      {/* Add Leave Request Form */}
      {showForm && (
        <Card className="border-slate-200 shadow-md bg-white">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-lg">File Employee Leave</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Employee *</Label>
                  <select
                    value={formEmployeeId}
                    onChange={e => setFormEmployeeId(e.target.value)}
                    className={selectStyle}
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Leave Type *</Label>
                  <select
                    value={formLeaveTypeId}
                    onChange={e => setFormLeaveTypeId(e.target.value)}
                    className={selectStyle}
                  >
                    {leaveTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>From Date *</Label>
                  <Input type="date" value={formFromDate} onChange={e => setFormFromDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>To Date *</Label>
                  <Input type="date" value={formToDate} onChange={e => setFormToDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason *</Label>
                <Input value={formReason} onChange={e => setFormReason(e.target.value)} placeholder="Provide explanation for leave..." />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#c8410a] hover:bg-[#a63306]" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Leave Request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests List */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-mono uppercase tracking-wider text-left">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Leave Type</th>
                  <th className="px-4 py-3 font-medium">From Date</th>
                  <th className="px-4 py-3 font-medium">To Date</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Loading leave requests...</td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No leave requests found.</td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const empName = r.employee?.full_name || r.employeeName || "Staff Member";
                    const leaveTypeName = r.leave_type?.name || r.leaveType || "Leave";
                    const fDate = r.from_date || r.fromDate || "—";
                    const tDate = r.to_date || r.toDate || "—";
                    const isPending = r.status === 'PENDING' || r.status === 'pending';
                    const isApproved = r.status === 'APPROVED' || r.status === 'Approved' || r.status === 'Resolved';
                    const isRejected = r.status === 'REJECTED' || r.status === 'Rejected';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                            {empName.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <span>{empName}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{leaveTypeName}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{fDate}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{tDate}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isApproved ? 'bg-green-50 text-green-700 border-green-200' :
                            isRejected ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isPending ? (
                            <div className="flex justify-end gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleUpdateStatus(r, 'APPROVED')}
                                className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 h-8 px-2"
                              >
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleUpdateStatus(r, 'REJECTED')}
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8 px-2"
                              >
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Resolved</span>
                          )}
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
