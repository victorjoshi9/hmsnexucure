"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit3, Trash2, Loader2, Save } from "lucide-react";

export default function DepartmentsManagementPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);

  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formGeoFence, setFormGeoFence] = useState("100");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      setDepartments(Array.isArray(res) ? res : res.items || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetFormState = () => {
    setFormName("");
    setFormCode("");
    setFormGeoFence("100");
  };

  const handleEditDept = (dept: any) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormCode(dept.code);
    setFormGeoFence((dept.geo_fence_override_meters ?? dept.geo_fence_override_m ?? 100).toString());
    setShowForm(true);
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department? Employee assignments might break if this department is in use.")) return;
    try {
      await api.del(`/departments/${id}`);
      alert("Department deleted successfully.");
      fetchData();
    } catch (err: any) {
      alert("Failed to delete department: " + err.message);
    }
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCode) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        name: formName,
        code: formCode.toUpperCase(),
        geo_fence_override_meters: parseInt(formGeoFence) || 100,
        floor_wing: "Main Building"
      };

      if (editingDept) {
        await api.put(`/departments/${editingDept.id}`, payload);
        alert("Department updated successfully.");
      } else {
        await api.post(`/departments`, payload);
        alert("Department created successfully.");
      }

      setShowForm(false);
      setEditingDept(null);
      resetFormState();
      fetchData();
    } catch (err: any) {
      alert(err.message || "An error occurred.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Department Configuration</h1>
          <p className="text-sm text-slate-500">Configure hospital departments, short codes, and custom geofence radii</p>
        </div>
        <Button 
          onClick={() => {
            setEditingDept(null);
            resetFormState();
            setShowForm(true);
          }} 
          className="bg-[#c8410a] hover:bg-[#a63306]"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Department
        </Button>
      </div>

      {/* Add / Edit Form Card */}
      {showForm && (
        <Card className="border-slate-200 shadow-md bg-white">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-lg">
              {editingDept ? `Modify Department: ${editingDept.name}` : "Create New Department"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveDept} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Department Name *</Label>
                  <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. ICU, OPD, accounts" />
                </div>
                <div className="space-y-2">
                  <Label>Department Code *</Label>
                  <Input value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="e.g. ICU, OPD" />
                </div>
                <div className="space-y-2">
                  <Label>Geo-Fence Override Boundary (meters)</Label>
                  <Input type="number" value={formGeoFence} onChange={e => setFormGeoFence(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingDept(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#c8410a] hover:bg-[#a63306]" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" /> Save Department
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Departments List */}
      <Card className="shadow-sm border-slate-200 bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs font-mono uppercase tracking-wider text-left">
                  <th className="px-4 py-3 font-medium">Department Name</th>
                  <th className="px-4 py-3 font-medium">Short Code</th>
                  <th className="px-4 py-3 font-medium">Geofence Radius Limit</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Loading configurations...</td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">No departments configured yet.</td>
                  </tr>
                ) : (
                  departments.map((d) => {
                    const radius = d.geo_fence_override_meters ?? d.geo_fence_override_m ?? 100;
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-700 font-semibold">{d.code}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{radius} meters</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditDept(d)} className="h-8 w-8 text-slate-500 hover:text-slate-900">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteDept(d.id)} className="h-8 w-8 text-red-500 hover:text-red-700">
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
