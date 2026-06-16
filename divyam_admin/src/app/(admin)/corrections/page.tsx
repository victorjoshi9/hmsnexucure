"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Check, X, Loader2 } from "lucide-react";

export default function CorrectionsManagementPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formType, setFormType] = useState("FORGOT_IN");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("09:00");
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

  const fetchCorrections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/corrections');
      setRequests(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchCorrections();
  }, []);

  const resetFormState = () => {
    if (employees.length > 0) {
      setFormEmployeeId(employees[0].id);
    } else {
      setFormEmployeeId("");
    }
    setFormType("FORGOT_IN");
    setFormDate("");
    setFormTime("09:00");
    setFormReason("");
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeId || !formDate || !formReason) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      
      // Map formType to API request types
      let apiType = 'forgot_check_in';
      if (formType === 'FORGOT_OUT') apiType = 'forgot_check_out';
      else if (formType === 'LOCATION_ISSUE') apiType = 'location_issue';
      else if (formType === 'WRONG_STATUS') apiType = 'wrong_status';

      await api.post('/corrections', {
        attendance_date: formDate,
        type: apiType,
        requested_value: formTime,
        reason: formReason,
        employee_id: formEmployeeId
      });

      alert("Correction request submitted successfully.");
      setShowForm(false);
      resetFormState();
      fetchCorrections();
    } catch (err: any) {
      alert(err.message || "Failed to submit request.");
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
        await api.post(`/corrections/${req.id}/approve`, {
          note: actionNote || "Approved by HR"
        });
      } else {
        await api.post(`/corrections/${req.id}/reject`, {
          reason: actionNote
        });
      }

      alert(`Correction request has been ${status.toLowerCase()}.`);
      fetchCorrections();
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
          <h1 className="text-2xl font-serif text-slate-900">Attendance Corrections</h1>
          <p className="text-sm text-slate-500">Manage biometric forgot-punch alerts and coordinate location corrections</p>
        </div>
        <Button 
          onClick={() => {
            resetFormState();
            setShowForm(true);
          }} 
          className="bg-[#c8410a] hover:bg-[#a63306]"
        >
          <Plus className="w-4 h-4 mr-2" /> File Correction Request
        </Button>
      </div>

      {/* Add Correction Request Form */}
      {showForm && (
        <Card className="border-slate-200 shadow-md bg-white">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-lg">File Punch Correction</CardTitle>
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
                  <Label>Correction Type *</Label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className={selectStyle}
                  >
                    <option value="FORGOT_IN">Forgot Check-In</option>
                    <option value="FORGOT_OUT">Forgot Check-Out</option>
                    <option value="LOCATION_ISSUE">Location GPS Override</option>
                    <option value="WRONG_STATUS">Wrong Auto Status</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Requested Value (Time/Status) *</Label>
                  <Input type="text" value={formTime} onChange={e => setFormTime(e.target.value)} placeholder="e.g. 09:00 or Present" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason *</Label>
                <Input value={formReason} onChange={e => setFormReason(e.target.value)} placeholder="Provide explanation for punch correction..." />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#c8410a] hover:bg-[#a63306]" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Correction
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Corrections List */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-mono uppercase tracking-wider text-left">
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Requested Value</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Loading correction requests...</td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No correction requests found.</td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const empName = r.employee?.full_name || r.employeeName || "Staff Member";
                    const reqVal = r.requested_value || r.requestedTime || "—";
                    const correctionDate = r.attendance_date || r.date || "—";
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
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            r.type === 'location_issue' || r.type === 'LOCATION_ISSUE' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{correctionDate}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{reqVal}</td>
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
