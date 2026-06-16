import { ReactNode } from "react";

export default function SetupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-slate-900 mb-2">HAMS Setup</h1>
          <p className="text-slate-500">Divyam Hospital Attendance Management System</p>
        </div>
        {children}
      </div>
    </div>
  );
}
