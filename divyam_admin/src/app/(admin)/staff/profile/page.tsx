"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Clock, Phone, MapPin, CalendarDays } from "lucide-react";

function ProfileContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [employee, setEmployee] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      const { data: empData } = await supabase
        .from('employees')
        .select('*, departments(name), shifts(name, start_time, end_time)')
        .eq('id', id)
        .single();
      
      if (empData) setEmployee(empData);

      const { data: attData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', id)
        .order('date', { ascending: false })
        .limit(30);
      
      if (attData) setAttendance(attData);
    };

    fetchProfile();
  }, [id]);

  if (!id) return <div className="p-10 text-center text-slate-500">No Employee ID provided.</div>;
  if (!employee) return <div className="p-10 text-center text-slate-500">Loading Profile...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="border-slate-200 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-[#185FA5] to-[#378ADD]" />
        <CardContent className="pt-0 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 pb-4">
            <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
              <User className="w-16 h-16 text-slate-300" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-slate-900">{employee.full_name}</h1>
              <p className="text-slate-500 font-mono mt-1">{employee.employee_code} • {employee.departments?.name}</p>
            </div>
            <div className="flex gap-2 pb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${employee.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {employee.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 mt-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Mobile Number</div>
                <div className="font-semibold">+91 {employee.mobile}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Shift Schedule</div>
                <div className="font-semibold">{employee.shifts?.name} ({employee.shifts?.start_time} - {employee.shifts?.end_time})</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-slate-400" />
              <div>
                <div className="text-xs text-slate-500">Hourly Rate</div>
                <div className="font-semibold text-green-700">₹{employee.hourly_rate}/hr</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="w-5 h-5" /> 30-Day Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-mono text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Work Hrs</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{record.date}</td>
                  <td className="px-6 py-4">{record.check_in ? new Date(record.check_in).toLocaleTimeString() : '—'}</td>
                  <td className="px-6 py-4">{record.check_out ? new Date(record.check_out).toLocaleTimeString() : '—'}</td>
                  <td className="px-6 py-4">{record.total_work_minutes ? `${Math.floor(record.total_work_minutes/60)}h ${record.total_work_minutes%60}m` : '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeeProfilePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading Application...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
