"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Building2, UserCircle, Settings2, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Form State
  const [hospitalName, setHospitalName] = useState("Divyam Hospital");
  const [branch, setBranch] = useState("Main Campus");
  const [adminEmail, setAdminEmail] = useState("victorjoshi9@gmail.com");
  const [adminMobile, setAdminMobile] = useState("9999999999");
  const [adminPassword, setAdminPassword] = useState("Madhu97*raja");
  const [error, setError] = useState<string | null>(null);

  // Check if setup already complete on load
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/v1/setup/init");
        const data = await res.json();
        if (data && data.setup_required === false) {
          router.push("/login");
        }
      } catch (e) {
        console.error("Setup status check failed:", e);
      } finally {
        setChecking(false);
      }
    }
    checkStatus();
  }, [router]);

  const handleNext = async () => {
    if (step < 3) {
      setError(null);
      if (step === 2 && (!adminEmail || !adminMobile || !adminPassword)) {
        setError("Admin email, mobile, and password are required.");
        return;
      }
      setStep(step + 1);
    } else {
      try {
        setSubmitting(true);
        setError(null);
        
        const res = await fetch("/api/v1/setup/init", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            hospital_name: hospitalName,
            branch: branch,
            admin_email: adminEmail,
            admin_mobile: adminMobile,
            admin_password: adminPassword
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Setup failed to complete");
        }

        // Redirect to login to authenticate with the new setup
        alert("Setup completed successfully! Please login with your new credentials.");
        router.push("/login");
      } catch (err: any) {
        setError(err.message || "An error occurred during setup.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#e95a1a] animate-spin" />
        <span className="text-sm text-slate-300 font-medium">Verifying system configuration...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-950 via-[#0a0f24] to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#e95a1a] opacity-10 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 opacity-15 blur-[120px] rounded-full" />

      <Card className="w-full max-w-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-white overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-white/5 pb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#e95a1a] animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold font-mono">HAMS Installation Wizard</span>
            </div>
            <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full text-slate-300 font-mono">v1.0.0</span>
          </div>
          
          <div className="flex items-center gap-4 py-4 mb-2">
            <StepIndicator current={step} stepNum={1} icon={Building2} label="Hospital" />
            <div className="h-[2px] flex-1 bg-white/10"><div className={`h-full bg-gradient-to-r from-[#e95a1a] to-indigo-500 transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`} /></div>
            <StepIndicator current={step} stepNum={2} icon={UserCircle} label="Admin" />
            <div className="h-[2px] flex-1 bg-white/10"><div className={`h-full bg-gradient-to-r from-[#e95a1a] to-indigo-500 transition-all duration-300 ${step >= 3 ? 'w-full' : 'w-0'}`} /></div>
            <StepIndicator current={step} stepNum={3} icon={Settings2} label="Config" />
          </div>

          <CardTitle className="text-2xl font-serif mt-2 font-medium tracking-wide">
            {step === 1 && "Hospital Details"}
            {step === 2 && "Super Admin Account"}
            {step === 3 && "Default Configuration"}
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm mt-1">
            {step === 1 && "Enter the primary details for your healthcare facility."}
            {step === 2 && "Create the master administrator account."}
            {step === 3 && "We will pre-load common hospital departments and shifts."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {error && (
            <div className="p-3 text-xs bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg backdrop-blur-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="hospital-name" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Hospital Name</Label>
                <Input 
                  id="hospital-name" 
                  value={hospitalName} 
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. Divyam Multi-Speciality"
                  className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Branch / Location</Label>
                <Input 
                  id="branch" 
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="Main Branch" 
                  className="bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg h-11"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Admin Email</Label>
                <input 
                  id="email" 
                  type="email" 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@hospital.com"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg h-11 px-3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Admin Mobile</Label>
                <input 
                  id="mobile" 
                  type="text" 
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  placeholder="9999999999"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg h-11 px-3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Secure Password</Label>
                <input 
                  id="password" 
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-lg h-11 px-3"
                />
              </div>
              <p className="text-[11px] text-slate-400 italic mt-1">Default credentials provided. You can edit these before submitting.</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-white/5 p-5 rounded-xl border border-white/10 text-sm text-slate-300">
                <p className="mb-3 font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Database Seeding & Setup Config:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs font-mono">
                  <li><strong>Departments:</strong> OPD, ICU, Nursing, Admin, Pharmacy</li>
                  <li><strong>Shifts:</strong> Morning (08:00 - 16:00), General (09:00 - 17:00), Night (20:00 - 08:00)</li>
                  <li><strong>Initial Super Admin:</strong> Assigned role with full write access.</li>
                  <li><strong>App Theme:</strong> Glassmorphism and coral theme config active.</li>
                </ul>
              </div>
              <p className="text-xs text-slate-400 italic">Press Complete Setup to run the migrations and register the administrator account.</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t border-white/5 pt-6 pb-6">
          <Button 
            variant="outline" 
            onClick={() => setStep(step - 1)}
            disabled={step === 1 || submitting}
            className="border-white/10 hover:bg-white/5 text-slate-300 hover:text-white"
          >
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={submitting}
            className="bg-gradient-to-r from-[#e95a1a] to-orange-500 hover:from-orange-600 hover:to-orange-500 text-white font-medium border-0 shadow-lg shadow-orange-500/20 rounded-lg px-6 h-11"
          >
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding Database...</>
            ) : step === 3 ? (
              <>Complete Setup <CheckCircle2 className="ml-2 h-4 w-4" /></>
            ) : "Continue"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function StepIndicator({ current, stepNum, icon: Icon, label }: any) {
  const isActive = current >= stepNum;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-[#e95a1a] text-white shadow-lg shadow-orange-500/20 scale-105' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`text-[10px] font-mono font-medium uppercase tracking-wider ${isActive ? 'text-[#e95a1a]' : 'text-slate-500'}`}>{label}</span>
    </div>
  );
}
