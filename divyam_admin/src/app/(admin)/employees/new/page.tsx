"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, CheckCircle2, UserPlus, AlertTriangle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function NewEmployeeRegistration() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Form selections options
  const [departments, setDepartments] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);

  // AI & Capture State
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [instruction, setInstruction] = useState("Loading AI models...");
  const [capturedFrames, setCapturedFrames] = useState<Blob[]>([]);
  const [capturedDescriptors, setCapturedDescriptors] = useState<any[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [livenessStep, setLivenessStep] = useState<"blink" | "rotate" | "done">("blink");
  const [livenessStatus, setLivenessStatus] = useState({ blink: false, rotate: false });
  const lastEyeRatio = useRef<number>(0);
  const lastFaceYaw = useRef<number>(0);
  
  // Form State
  const [empName, setEmpName] = useState("");
  const [empCode, setEmpCode] = useState("");
  const [mobileNum, setMobileNum] = useState("");
  const [emailAddr, setEmailAddr] = useState("");
  const [designation, setDesignation] = useState("Staff Nurse");
  const [role, setRole] = useState("staff");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [hourlyRate, setHourlyRate] = useState("0");

  const faceapiRef = useRef<any>(null);

  useEffect(() => {
    // Fetch departments and shifts
    const loadDropdownData = async () => {
      try {
        const depts = await api.get('/departments');
        const deptList = Array.isArray(depts) ? depts : depts.items || [];
        setDepartments(deptList);
        if (deptList.length > 0) setSelectedDept(deptList[0].id);

        const sfts = await api.get('/shifts');
        const shiftList = Array.isArray(sfts) ? sfts : sfts.items || [];
        setShifts(shiftList);
        if (shiftList.length > 0) setSelectedShift(shiftList[0].id);
      } catch (e) {
        console.error("Failed to load layout data", e);
      }
    };
    loadDropdownData();

    // Load face-api models dynamically
    const loadModels = async () => {
      try {
        const faceapi = await import("@vladmandic/face-api");
        faceapiRef.current = faceapi;
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
        setInstruction("AI models ready. Complete basic details to continue.");
      } catch (err) {
        console.error("Failed to load face-api models", err);
        setInstruction("Error loading face recognition models.");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    // Start webcam when entering step 2
    if (step === 2 && capturedFrames.length < 5 && modelsLoaded) {
      setInstruction("Position your face. We will capture 5 frames.");
      navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } })
        .then((s) => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn("Webcam access denied", err);
          setInstruction("Camera access denied.");
        });
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, capturedFrames.length, modelsLoaded]);

  // Video Play Event - Run Face Detection Loop
  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current || !faceapiRef.current) return;
    
    const faceapi = faceapiRef.current;
    const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    const detectInterval = setInterval(async () => {
      if (!videoRef.current || step !== 2 || livenessStep === "done") {
        clearInterval(detectInterval);
        return;
      }

      const detection = await faceapi.detectSingleFace(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      ).withFaceLandmarks().withFaceDescriptor();

      if (detection) {
        // Draw landmarks
        const resizedDetection = faceapi.resizeResults(detection, displaySize);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetection);
        }

        const landmarks = detection.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // 1. Blink Detection
        if (livenessStep === "blink") {
          const eyeDist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
          const leftEAR = (eyeDist(leftEye[1], leftEye[5]) + eyeDist(leftEye[2], leftEye[4])) / (2 * eyeDist(leftEye[0], leftEye[3]));
          const rightEAR = (eyeDist(rightEye[1], rightEye[5]) + eyeDist(rightEye[2], rightEye[4])) / (2 * eyeDist(rightEye[0], rightEye[3]));
          const ear = (leftEAR + rightEAR) / 2;

          if (ear < 0.22 && lastEyeRatio.current >= 0.22) {
            setLivenessStatus(prev => ({ ...prev, blink: true }));
            setLivenessStep("rotate");
            setInstruction("Blink detected! Now rotate your face slowly left and right.");
            captureFrame(detection.descriptor);
          }
          lastEyeRatio.current = ear;
          if (!livenessStatus.blink) setInstruction("Blink your eyes to start...");
        }

        // 2. Rotation Detection (Head Pose)
        if (livenessStep === "rotate") {
          const nose = landmarks.getNose()[0];
          const leftEyeCenter = leftEye[3];
          const rightEyeCenter = rightEye[0];
          const eyeDist = Math.abs(rightEyeCenter.x - leftEyeCenter.x);
          const noseOffset = nose.x - (leftEyeCenter.x + rightEyeCenter.x) / 2;
          const yaw = noseOffset / eyeDist; // Simplified yaw

          if (Math.abs(yaw) > 0.4 && !livenessStatus.rotate) {
             setLivenessStatus(prev => ({ ...prev, rotate: true }));
             setInstruction("Face rotation detected! Capturing template...");
             captureFrame(detection.descriptor);
             setTimeout(() => {
                setLivenessStep("done");
                setInstruction("Biometrics verified. Ready to save.");
             }, 1000);
          }
        }

        const box = detection.detection.box;
        const faceArea = box.width * box.height;
        const videoArea = displaySize.width * displaySize.height;
        const faceRatio = faceArea / videoArea;

        if (faceRatio < 0.15) {
          setInstruction("Move closer to the camera...");
          return;
        }
      } else {
        setInstruction("No face detected. Look at the camera.");
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }, 200);
  };

  const captureFrame = (descriptor: any) => {
    if (!videoRef.current || !canvasRef.current) {
      setCapturing(false);
      return;
    }
    
    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = videoRef.current.videoWidth;
    hiddenCanvas.height = videoRef.current.videoHeight;
    const ctx = hiddenCanvas.getContext('2d');
    if (ctx) {
      ctx.translate(hiddenCanvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
      hiddenCanvas.toBlob((blob) => {
        if (blob) {
          setCapturedFrames(prev => {
            const next = [...prev, blob];
            if (next.length >= 5) {
              setInstruction("5 frames captured successfully!");
              if (stream) stream.getTracks().forEach(t => t.stop());
            }
            return next;
          });
          setCapturedDescriptors(prev => [...prev, Array.from(descriptor)]);
        }
        setTimeout(() => setCapturing(false), 800); // 800ms cool down
      }, 'image/jpeg', 0.95);
    } else {
      setCapturing(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [newEmployeeInfo, setNewEmployeeInfo] = useState<{name: string, mobile: string, id: string} | null>(null);

  const handleSaveAndComplete = async () => {
    if (livenessStep !== "done") {
      alert("Please complete the liveness verification (blink and rotate face).");
      return;
    }

    try {
      setIsSaving(true);
      setInstruction("Registering employee record in database...");

      // 1. Create Employee
      const employeePayload = {
        employee_code: empCode || 'DVH-' + Math.floor(1000 + Math.random() * 9000),
        full_name: empName,
        mobile: mobileNum,
        email: emailAddr || null,
        department_id: selectedDept,
        shift_id: selectedShift,
        designation: designation,
        joining_date: new Date().toISOString().split('T')[0],
        role: role,
        hourly_rate: parseFloat(hourlyRate) || 0
      };

      const newEmployee = await api.post('/employees', employeePayload);
      const employeeId = newEmployee.id;

      if (!employeeId) {
        throw new Error("Failed to retrieve new employee ID");
      }

      setNewEmployeeInfo({
        name: newEmployee.full_name,
        mobile: newEmployee.mobile,
        id: newEmployee.employee_code
      });

      setInstruction("Generating and uploading secure biometric face template...");

      // Upload one of the captured frames as profile image
      if (capturedFrames.length > 0) {
        const formData = new FormData();
        formData.append('file', capturedFrames[0]);
        // Note: You might need a specific endpoint for image upload or update employee
        // For now we'll send it as base64 in the enroll endpoint
        const reader = new FileReader();
        reader.readAsDataURL(capturedFrames[0]);
        reader.onloadend = async () => {
          const base64data = reader.result;
          
          // Calculate averaged descriptor
          const averageDescriptor = new Array(128).fill(0);
          for (let i = 0; i < 128; i++) {
            let sum = 0;
            for (let j = 0; j < capturedDescriptors.length; j++) {
              sum += capturedDescriptors[j][i];
            }
            averageDescriptor[i] = sum / capturedDescriptors.length;
          }

          await api.post(`/employees/${employeeId}/face/enroll`, {
            face_descriptor: averageDescriptor,
            image: base64data
          });

          setStep(3);
        };
      } else {
         setStep(3);
      }
    } catch (err: any) {
      console.error(err);
      setInstruction(err.message || "An unexpected error occurred during registration.");
      setIsSaving(false);
    }
  };

  const selectStyle = "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
          <UserPlus className="w-6 h-6 text-[#c8410a]" />
        </div>
        <div>
          <h1 className="text-2xl font-serif text-slate-900">Register Employee (AI Face Scan)</h1>
          <p className="text-slate-500 text-sm">Add a new staff member with Liveness & Face Template Enrollment</p>
        </div>
      </div>

      <Card className="shadow-xl border-slate-200 overflow-hidden bg-white">
        {/* Progress Bar */}
        <div className="flex h-1.5 w-full bg-slate-100">
          <div className={`h-full bg-[#c8410a] transition-all duration-500 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
        </div>

        <CardContent className="p-8">
          {/* STEP 1: Basic Details & Shifts */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Personal & Role Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input placeholder="e.g. Raj Sharma" value={empName} onChange={e => setEmpName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number (For WhatsApp/SMS Alerts) *</Label>
                    <Input placeholder="10 digit mobile" value={mobileNum} onChange={e => setMobileNum(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee Code (Optional)</Label>
                    <Input placeholder="Auto-generated if blank" value={empCode} onChange={e => setEmpCode(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Email (Optional)</Label>
                    <Input placeholder="raj@divyam.in" type="email" value={emailAddr} onChange={e => setEmailAddr(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Designation *</Label>
                    <Input placeholder="e.g. Doctor, Nurse, Lab Tech" value={designation} onChange={e => setDesignation(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Portal Role *</Label>
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className={selectStyle}
                    >
                      <option value="staff">Staff</option>
                      <option value="dept_head">Department Head</option>
                      <option value="hr">HR Manager</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">
                  Shift & Payroll Assignment
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <select
                      value={selectedDept}
                      onChange={e => setSelectedDept(e.target.value)}
                      className={selectStyle}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shift timing *</Label>
                    <select
                      value={selectedShift}
                      onChange={e => setSelectedShift(e.target.value)}
                      className={selectStyle}
                    >
                      {shifts.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hourly Rate (INR) *</Label>
                    <Input type="number" placeholder="250" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Live Face AI Registration */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
              <h2 className="text-xl font-semibold text-slate-900">Capture 5 Face Angles</h2>
              
              <div className={`px-4 py-2 rounded-full inline-flex items-center text-sm font-semibold mx-auto ${livenessStep === "done" ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {livenessStep !== "done" ? <AlertTriangle className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {instruction}
              </div>

              <div className="relative w-80 h-80 mx-auto rounded-full overflow-hidden border-8 border-slate-100 bg-slate-900 shadow-inner">
                {livenessStep !== "done" ? (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      muted
                      playsInline 
                      onPlay={handleVideoPlay}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-auto h-[120%] max-w-none transform scale-x-[-1]"
                    />
                    <canvas 
                      ref={canvasRef} 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform scale-x-[-1]"
                    />
                    <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-[#c8410a] animate-spin pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full bg-[#f0f8f5] flex flex-col items-center justify-center text-[#0a6640]">
                    <CheckCircle2 className="w-24 h-24 mb-2" />
                    <span className="font-bold text-lg">Biometrics Verified</span>
                    <span className="text-sm opacity-80 mt-1">Liveness Approved</span>
                  </div>
                )}
              </div>

              {capturedFrames.length >= 5 && (
                <Button variant="outline" onClick={() => {
                  setCapturedFrames([]);
                  setCapturedDescriptors([]);
                  setInstruction("Webcam restarting. Position your face in the circle.");
                  setStep(1);
                  setTimeout(() => setStep(2), 100);
                }} size="lg">
                  Retake Photos
                </Button>
              )}
            </div>
          )}

          {/* STEP 3: Summary */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 py-8">
              <div className="w-20 h-20 bg-[#f0f8f5] text-[#0a6640] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-serif text-slate-900 text-center">Registration Complete</h2>
              
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-100 rounded-xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-slate-500 text-sm">Employee Name</span>
                  <span className="font-semibold text-slate-900">{newEmployeeInfo?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-slate-500 text-sm">Mobile Number</span>
                  <span className="font-semibold text-slate-900">{newEmployeeInfo?.mobile}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-slate-500 text-sm">Generated ID</span>
                  <span className="font-mono font-bold text-[#c8410a]">{newEmployeeInfo?.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Biometric Status</span>
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Securely Enrolled
                  </span>
                </div>
              </div>

              <p className="text-slate-500 max-w-md mx-auto text-center text-sm">
                Biometric face templates are securely generated and bound. Staff can now check in/out using their mobile device.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-between">
          {step < 3 ? (
            <>
              <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
                Back
              </Button>
              <Button 
                onClick={step === 2 ? handleSaveAndComplete : () => {
                  if (!empName || !mobileNum || !selectedDept || !selectedShift) {
                    alert("Please fill in all required fields marked with *");
                    return;
                  }
                  setStep(s => s + 1);
                }} 
                className="bg-[#c8410a] hover:bg-[#a63306]"
                disabled={(step === 2 && livenessStep !== "done") || isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {step === 2 ? (isSaving ? "Saving Profiles..." : "Upload & Enroll Face") : "Next: Face Capture"}
              </Button>
            </>
          ) : (
            <Button onClick={() => router.push('/dashboard')} className="w-full bg-slate-900 text-white">
              Return to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
