"use client";

import { useEffect, useState, startTransition } from "react";
import dynamic from 'next/dynamic';
import { Activity, MapPin, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { api } from "@/lib/api";
import { haversineDistance } from "@/components/LiveMap";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

type TabType = 'on_duty' | 'not_on_location' | 'all_employees';

// Use dynamic values from database, fallbacks for safety
const DEFAULT_CENTER: [number, number] = [28.024511, 73.312445];
const DEFAULT_RADIUS = 200;

export default function LiveMonitorPage() {
  const [hospitalCenter, setHospitalCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [activeTab, setActiveTab] = useState<TabType>('on_duty');
  const [geofenceRadius, setGeofenceRadius] = useState<number>(DEFAULT_RADIUS);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(16);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const user = api.user;
      
      // Fetch employees
      const empRes = await api.get('/employees', { limit: 1000 }).catch(() => ({}));
      let empList = Array.isArray(empRes) ? empRes : (empRes.items || []);
      
      // Fetch today's live attendance
      const attRes = await api.get('/attendance/live').catch(() => []);
      let attList = Array.isArray(attRes) ? attRes : (attRes.items || []);

      // Fetch settings
      const settings = await api.get('/settings').catch(() => null);
      if (settings) {
        const lat = settings.geo_fence_lat ?? 28.024511;
        const lng = settings.geo_fence_lng ?? 73.312445;
        const radius = settings.geo_fence_radius_m ?? 200;
        setHospitalCenter([lat, lng]);
        setGeofenceRadius(radius);
        setMapCenter(prev => (prev[0] === 28.024511 && prev[1] === 73.312445) ? [lat, lng] : prev);
      }

      // If user is a department head, filter lists to their department only
      if (user && user.role === 'dept_head' && user.dept) {
        empList = empList.filter((e: any) => 
          e.department_id === user.dept || 
          e.dept === user.dept || 
          e.departments?.name === user.dept ||
          e.departments?.id === user.dept
        );
        attList = attList.filter((a: any) => {
          const empDept = a.employee?.departments?.id || a.employee?.department_id || a.employee?.dept;
          return empDept === user.dept || a.employee?.departments?.name === user.dept;
        });
      }

      setEmployees(empList);
      setRecords(attList);
    } catch (err) {
      console.error("Error fetching live monitor data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Polling fallback every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter computations
  const onDutyRecords = records.filter(r => r.check_in_lat && r.check_in_lng);
  
  const notOnLocationRecords = onDutyRecords.filter(r => {
    const dist = haversineDistance(hospitalCenter, [r.check_in_lat, r.check_in_lng]);
    return dist > geofenceRadius;
  });

  const insideGeofenceCount = onDutyRecords.length - notOnLocationRecords.length;

  const handleSelectEmployee = (record: any) => {
    if (record && record.check_in_lat && record.check_in_lng) {
      setSelectedRecordId(record.id);
      setMapCenter([record.check_in_lat, record.check_in_lng]);
      setMapZoom(18);
    } else {
      alert(`${record?.employee?.full_name || record?.employees?.full_name || 'Employee'} has not checked in today.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
            <Activity className="w-6 h-6 text-[#c8410a] animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-slate-900">Live Monitor</h1>
            <p className="text-sm text-slate-500">Real-time GPS Tracking and Geo-Fence Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing} className="h-9">
            Refresh
          </Button>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            <span>Live Sync Active</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-slate-900">{employees.length}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Total Staff</div>
            </div>
            <Users className="w-8 h-8 text-slate-300" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 border-l-4 border-l-[#185fa5]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-[#185fa5]">{onDutyRecords.length}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">On Duty Today</div>
            </div>
            <CheckCircle className="w-8 h-8 text-[#185fa5]/20" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 border-l-4 border-l-[#0a6640]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-[#0a6640]">{insideGeofenceCount}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Inside Geo-Fence</div>
            </div>
            <CircleIndicator className="w-8 h-8 text-[#0a6640]/20" />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 border-l-4 border-l-[#c8410a]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-[#c8410a]">{notOnLocationRecords.length}</div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mt-1">Outside Geo-Fence</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-[#c8410a]/20" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2">
          <LiveMap 
            center={mapCenter} 
            zoom={mapZoom} 
            records={records} 
            selectedRecordId={selectedRecordId}
            hospitalCenter={hospitalCenter}
            geofenceRadius={geofenceRadius}
          />
        </div>

        {/* Tabs & Employee lists */}
        <div className="flex flex-col h-[500px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tab Headers */}
          <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/50 p-1 gap-1 shrink-0">
            <button
              onClick={() => startTransition(() => setActiveTab('on_duty'))}
              className={`py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === 'on_duty' ? 'bg-white text-[#c8410a] shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              On Duty ({onDutyRecords.length})
            </button>
            <button
              onClick={() => startTransition(() => setActiveTab('not_on_location'))}
              className={`py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === 'not_on_location' ? 'bg-white text-[#c8410a] shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Off Location ({notOnLocationRecords.length})
            </button>
            <button
              onClick={() => startTransition(() => setActiveTab('all_employees'))}
              className={`py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === 'all_employees' ? 'bg-white text-[#c8410a] shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Staff ({employees.length})
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-sm">Loading monitor feed...</div>
            ) : (
              <>
                {/* 1. ON DUTY LIST */}
                {activeTab === 'on_duty' && (
                  onDutyRecords.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">No employees on duty today.</div>
                  ) : (
                    onDutyRecords.map((record) => {
                      const dist = haversineDistance(hospitalCenter, [record.check_in_lat, record.check_in_lng]);
                      const isViolation = dist > geofenceRadius;
                      const empName = record.employee?.full_name || record.employees?.full_name || 'Staff';
                      const deptName = record.employee?.departments?.name || record.employees?.departments?.name || record.dept || 'Staff';
                      
                      return (
                        <div 
                          key={record.id}
                          onClick={() => handleSelectEmployee(record)}
                          className={`p-3 rounded-lg hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between text-sm ${selectedRecordId === record.id ? 'bg-slate-50 border border-slate-200' : ''}`}
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-slate-950">{empName}</div>
                            <div className="text-xs text-slate-500">{deptName}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-xs font-mono text-slate-500">In: {record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</div>
                            {isViolation ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                                {Math.round(dist)}m Out
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                                In Location
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )
                )}

                {/* 2. OFF LOCATION LIST */}
                {activeTab === 'not_on_location' && (
                  notOnLocationRecords.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">All on-duty employees are inside location boundary.</div>
                  ) : (
                    notOnLocationRecords.map((record) => {
                      const dist = haversineDistance(hospitalCenter, [record.check_in_lat, record.check_in_lng]);
                      const empName = record.employee?.full_name || record.employees?.full_name || 'Staff';
                      const deptName = record.employee?.departments?.name || record.employees?.departments?.name || record.dept || 'Staff';

                      return (
                        <div 
                          key={record.id}
                          onClick={() => handleSelectEmployee(record)}
                          className={`p-3 rounded-lg hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between text-sm ${selectedRecordId === record.id ? 'bg-slate-50 border border-slate-200' : ''}`}
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-slate-950">{empName}</div>
                            <div className="text-xs text-slate-500">{deptName}</div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-xs font-mono text-slate-500">In: {record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</div>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200">
                              {Math.round(dist)}m Out
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )
                )}

                {/* 3. ALL EMPLOYEES LIST */}
                {activeTab === 'all_employees' && (
                  employees.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">No registered employees found.</div>
                  ) : (
                    employees.map((emp) => {
                      const todayRecord = records.find(r => r.employee_id === emp.id || r.employee?.id === emp.id);
                      const isCheckedIn = todayRecord && todayRecord.check_in_lat && todayRecord.check_in_lng;
                      
                      return (
                        <div 
                          key={emp.id}
                          onClick={() => isCheckedIn ? handleSelectEmployee(todayRecord) : alert(`${emp.full_name} has not checked in today.`)}
                          className={`p-3 rounded-lg hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between text-sm ${isCheckedIn ? 'cursor-pointer hover:bg-slate-50' : 'opacity-70 cursor-not-allowed'}`}
                        >
                          <div className="space-y-1">
                            <div className="font-medium text-slate-950">{emp.full_name}</div>
                            <div className="text-xs text-slate-500">{emp.departments?.name || emp.dept || 'No Dept'} · {emp.employee_code}</div>
                          </div>
                          <div className="text-right space-y-1">
                            {isCheckedIn ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#e6f1fb] text-[#185fa5] border border-[#d2e5f7]">
                                On Duty
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                                Off Duty
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CircleIndicator(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m4.93 4.93 14.14 14.14" />
    </svg>
  );
}
