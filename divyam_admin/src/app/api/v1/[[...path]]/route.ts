import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'hams-super-secret-jwt-key-2026';

let serverModelsLoaded = false;
async function loadServerModels() {
  if (serverModelsLoaded) return;
  const tf = await import('@tensorflow/tfjs');
  const faceapi = await import('@vladmandic/face-api');
  const modelsPath = path.join(process.cwd(), 'public', 'models');
  
  await tf.ready();
  
  // faceapi on node can load from filesystem
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
  ]);
  
  serverModelsLoaded = true;
}

// Helper: Parse path segments
function getPath(params: any): string[] {
  return params?.path || [];
}

// Helper: Extract and verify token
async function getAuthUser(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Fetch employee profile
    const { data: employee } = await supabaseAdmin
      .from('employees')
      .select('*, department:departments(name), shift:shifts(name)')
      .eq('id', decoded.id)
      .single();
      
    return employee;
  } catch (e) {
    return null;
  }
}

// Helper: Log audit action
async function logAudit(userId: string | null, action: string, entityType: string, entityId: string | null, oldValue: any = null, newValue: any = null, req?: NextRequest) {
  try {
    const ip = req ? req.headers.get('x-forwarded-for') || '127.0.0.1' : '127.0.0.1';
    const device = req ? req.headers.get('user-agent') || 'Server' : 'Server';
    
    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: oldValue,
      new_value: newValue,
      ip_address: ip,
      device_info: device
    });
  } catch (err) {
    console.error("Audit logging failed:", err);
  }
}

// GET Route Handler
// Removed dynamic export for static export compatibility
// export const dynamic = 'force-static';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  const path = getPath(resolvedParams);
  const authUser = await getAuthUser(req);
  const searchParams = req.nextUrl.searchParams;

  // 1. Setup Status Check
  if (path[0] === 'setup' && path[1] === 'init') {
    const { data: admins, error } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1);
    
    return NextResponse.json({ setup_required: !admins || admins.length === 0 });
  }

  // Require Auth for subsequent endpoints
  if (!authUser && path[0] !== 'settings') {
    return NextResponse.json({ error: { message: 'Unauthorized access', code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const userRole = authUser?.role;
  const userId = authUser?.id;

  // 2. Auth: Get Me
  if (path[0] === 'auth' && path[1] === 'me') {
    return NextResponse.json({
      id: authUser.id,
      name: authUser.full_name,
      role: authUser.role,
      dept: authUser.department?.name,
      shift: authUser.shift?.name,
      photo_url: authUser.profile_image_url
    });
  }

  // 3. Departments
  if (path[0] === 'departments') {
    if (path[1]) { // GET /departments/:id
      const { data, error } = await supabaseAdmin.from('departments').select('*').eq('id', path[1]).single();
      if (error) return NextResponse.json({ message: error.message }, { status: 404 });
      return NextResponse.json(data);
    }
    // GET /departments
    const { data, error } = await supabaseAdmin.from('departments').select('*').order('name');
    return NextResponse.json(data || []);
  }

  // 4. Shifts
  if (path[0] === 'shifts') {
    if (path[1]) { // GET /shifts/:id
      const { data, error } = await supabaseAdmin.from('shifts').select('*').eq('id', path[1]).single();
      if (error) return NextResponse.json({ message: error.message }, { status: 404 });
      return NextResponse.json(data);
    }
    // GET /shifts
    const { data, error } = await supabaseAdmin.from('shifts').select('*').order('name');
    return NextResponse.json(data || []);
  }

  // 5. Employees
  if (path[0] === 'employees') {
    if (path[1] === 'me') {
      return NextResponse.json(authUser);
    }
    if (path[1]) { // GET /employees/:id
      const { data, error } = await supabaseAdmin
        .from('employees')
        .select('*, department:departments(name), shift:shifts(name)')
        .eq('id', path[1])
        .single();
      if (error) return NextResponse.json({ message: error.message }, { status: 404 });
      return NextResponse.json(data);
    }
    // GET /employees
    const search = searchParams.get('search') || '';
    const deptId = searchParams.get('dept_id');
    const shiftId = searchParams.get('shift_id');
    
    let query = supabaseAdmin
      .from('employees')
      .select('*, department:departments(name), shift:shifts(name)');
      
    if (search) query = query.ilike('full_name', `%${search}%`);
    if (deptId) query = query.eq('department_id', deptId);
    if (shiftId) query = query.eq('shift_id', shiftId);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return NextResponse.json(data || []);
  }

  // 6. Settings
  if (path[0] === 'settings') {
    const { data, error } = await supabaseAdmin.from('settings').select('*').single();
    // Return a default mock settings structure if table is empty
    if (error || !data) {
      return NextResponse.json({
        hospital_name: 'Divyam Hospital',
        geo_fence_lat: 28.024511,
        geo_fence_lng: 73.312445,
        geo_fence_radius_m: 200,
        face_match_threshold: 95,
        mock_gps_detection: true,
        late_alert_enabled: true,
        absent_alert_enabled: true,
        app_settings: {
          splash_screens: ["https://cdn3d.iconscout.com/3d/premium/thumb/fingerprint-scan-6831518-5602796.png"],
          app_icon: "https://cdn-icons-png.flaticon.com/512/3004/3004458.png",
          bottom_navigation: [
            {label: "Home", icon: "home", route: "/dashboard", enabled: true},
            {label: "History", icon: "history", route: "/history", enabled: true},
            {label: "Leave", icon: "leave", route: "/leave", enabled: true},
            {label: "Settings", icon: "settings", route: "/settings", enabled: true}
          ],
          new_screens: [],
          sections: { show_attendance: true, show_breaks: true, show_payroll: true }
        }
      });
    }
    return NextResponse.json(data);
  }

  // 7. Attendance Records
  if (path[0] === 'attendance') {
    if (path[1] === 'records') {
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      const empId = searchParams.get('employee_id');
      const deptId = searchParams.get('dept_id');
      
      let query = supabaseAdmin
        .from('attendance')
        .select('*, employee:employees(id, full_name, employee_code, department:departments(name))');
        
      if (from) query = query.gte('date', from);
      if (to) query = query.lte('date', to);
      if (empId) query = query.eq('employee_id', empId);
      
      const { data, error } = await query.order('date', { ascending: false });
      
      // Post-filtering for department since it's nested
      let filtered = data || [];
      if (deptId) {
        filtered = filtered.filter((a: any) => a.employee?.department_id === deptId || a.employee?.department?.id === deptId);
      }
      
      return NextResponse.json(filtered);
    }
    
    if (path[1] === 'live') {
      // Return present employees today
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabaseAdmin
        .from('attendance')
        .select('*, employee:employees(id, full_name, employee_code, department:departments(name))')
        .eq('date', today);
      return NextResponse.json(data || []);
    }

    if (path[1]) { // GET /attendance/:id
      const { data, error } = await supabaseAdmin
        .from('attendance')
        .select('*, employee:employees(id, full_name, employee_code), breaks(*)')
        .eq('id', path[1])
        .single();
      if (error) return NextResponse.json({ message: error.message }, { status: 404 });
      return NextResponse.json(data);
    }
  }

  // 8. Leave Requests
  if (path[0] === 'leave' && path[1] === 'requests') {
    let query = supabaseAdmin
      .from('leave_requests')
      .select('*, employee:employees(id, full_name, employee_code)');
      
    if (userRole === 'staff') {
      query = query.eq('employee_id', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return NextResponse.json(data || []);
  }

  // 9. Corrections Requests
  if (path[0] === 'corrections') {
    let query = supabaseAdmin
      .from('corrections')
      .select('*, employee:employees(id, full_name, employee_code)');
      
    if (userRole === 'staff') {
      query = query.eq('employee_id', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return NextResponse.json(data || []);
  }

  // 10. Audit Logs
  if (path[0] === 'audit-logs') {
    if (userRole !== 'super_admin') {
      return NextResponse.json({ error: { message: 'Forbidden access', code: 'FORBIDDEN' } }, { status: 403 });
    }
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*, employee:employees(id, full_name, role)')
      .order('created_at', { ascending: false })
      .limit(100);
    return NextResponse.json(data || []);
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

// POST Route Handler
export async function POST(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  const path = getPath(resolvedParams);
  const authUser = await getAuthUser(req);
  const body = await req.json().catch(() => ({}));

  // 1. First-Time Setup Init
  if (path[0] === 'setup' && path[1] === 'init') {
    // Check if setup is already complete
    const { data: admins } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1);
      
    if (admins && admins.length > 0) {
      return NextResponse.json({ error: 'System already configured' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.admin_password || 'Madhu97*raja', 10);
    
    // Create/update settings
    const { data: currentSettings } = await supabaseAdmin.from('settings').select('id').limit(1);
    if (currentSettings && currentSettings.length > 0) {
      await supabaseAdmin.from('settings').update({
        hospital_name: body.hospital_name || 'Divyam Hospital',
        updated_at: new Date().toISOString()
      }).eq('id', currentSettings[0].id);
    } else {
      await supabaseAdmin.from('settings').insert({
        hospital_name: body.hospital_name || 'Divyam Hospital'
      });
    }

    // Seed default departments
    const defaultDepts = ['OPD', 'ICU', 'Nursing', 'Admin', 'Pharmacy'];
    const deptMap: Record<string, string> = {};
    for (const name of defaultDepts) {
      const { data: existing } = await supabaseAdmin.from('departments').select('id').eq('code', name.toUpperCase()).maybeSingle();
      if (existing) {
        deptMap[name] = existing.id;
      } else {
        const { data: newDept } = await supabaseAdmin.from('departments').insert({
          name,
          code: name.toUpperCase(),
          geo_fence_override_m: 100
        }).select('id').single();
        if (newDept) deptMap[name] = newDept.id;
      }
    }

    // Seed default shifts
    const defaultShifts = [
      { name: 'Morning', start: '08:00:00', end: '16:00:00' },
      { name: 'General', start: '09:00:00', end: '17:00:00' },
      { name: 'Night', start: '20:00:00', end: '08:00:00' }
    ];
    const shiftMap: Record<string, string> = {};
    for (const s of defaultShifts) {
      const { data: existing } = await supabaseAdmin.from('shifts').select('id').eq('name', s.name).maybeSingle();
      if (existing) {
        shiftMap[s.name] = existing.id;
      } else {
        const { data: newShift } = await supabaseAdmin.from('shifts').insert({
          name: s.name,
          start_time: s.start,
          end_time: s.end,
          grace_minutes: 10,
          total_break_limit_min: 60
        }).select('id').single();
        if (newShift) shiftMap[s.name] = newShift.id;
      }
    }

    // Create Super Admin employee record
    const { data: adminEmployee, error: empError } = await supabaseAdmin.from('employees').insert({
      employee_code: 'DVH-001',
      full_name: 'Super Admin',
      email: body.admin_email || 'victorjoshi9@gmail.com',
      mobile: body.admin_mobile || '9999999999',
      role: 'super_admin',
      password: hashedPassword,
      department_id: deptMap['Admin'] || null,
      shift_id: shiftMap['General'] || null,
      permissions: { read: true, write: true, all: true }
    }).select('id').single();

    if (empError) {
      return NextResponse.json({ error: empError.message }, { status: 500 });
    }

    await logAudit(adminEmployee.id, 'setup_initialization', 'settings', null, null, { hospital_name: body.hospital_name });

    return NextResponse.json({ success: true });
  }

  // 2. Public Login
  if (path[0] === 'auth' && path[1] === 'login') {
    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json({ error: { message: 'Missing credentials' } }, { status: 400 });
    }

    const isEmail = username.includes('@');

    // Find employee
    let query = supabaseAdmin
      .from('employees')
      .select('*, department:departments(name), shift:shifts(name)');
      
    if (isEmail) {
      query = query.eq('email', username);
    } else {
      query = query.eq('employee_code', username);
    }

    const { data: employee, error } = await query.maybeSingle();

    if (error || !employee) {
      return NextResponse.json({ error: { message: 'Invalid employee code or password' } }, { status: 401 });
    }

    if (!employee.is_active) {
      return NextResponse.json({ error: { message: 'Employee account is deactivated' } }, { status: 403 });
    }

    // Validate password
    const valid = await bcrypt.compare(password, employee.password || '');
    if (!valid) {
      return NextResponse.json({ error: { message: 'Invalid employee code or password' } }, { status: 401 });
    }

    // Create Token
    const tokenPayload = { id: employee.id, employee_code: employee.employee_code, role: employee.role };
    const access_token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
    const refresh_token = jwt.sign({ id: employee.id }, JWT_SECRET, { expiresIn: '7d' });

    // Audit Log
    await logAudit(employee.id, 'login', 'auth', employee.id, null, null, req);

    return NextResponse.json({
      access_token,
      refresh_token,
      expires_in: 900,
      employee: {
        id: employee.id,
        name: employee.full_name,
        role: employee.role,
        dept: employee.department?.name,
        shift: employee.shift?.name,
        photo_url: employee.profile_image_url
      },
      requires_face_enrollment: !employee.face_descriptor
    });
  }

  // 2b. Public Face Login
  if (path[0] === 'auth' && path[1] === 'face-login') {
    const { mobile, image, face_descriptor } = body;
    if (!mobile) {
      return NextResponse.json({ error: { message: 'Mobile number is required' } }, { status: 400 });
    }

    // Find employee by mobile
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('*, department:departments(name), shift:shifts(name)')
      .eq('mobile', mobile)
      .maybeSingle();

    if (error || !employee) {
      return NextResponse.json({ error: { message: 'Employee not found' } }, { status: 404 });
    }

    if (!employee.is_active) {
      return NextResponse.json({ error: { message: 'Employee account is deactivated' } }, { status: 403 });
    }

    if (!employee.face_descriptor) {
      return NextResponse.json({ error: { message: 'Face biometric template not enrolled for this employee' } }, { status: 400 });
    }

    let isMatch = false;
    let computedDistance = 1.0;

    // Option A: Client already extracted the descriptor (e.g. Web client login)
    if (face_descriptor && Array.isArray(face_descriptor)) {
      // Compare Euclidean distance
      const stored = employee.face_descriptor as number[];
      let sum = 0;
      for (let i = 0; i < 128; i++) {
        const diff = stored[i] - face_descriptor[i];
        sum += diff * diff;
      }
      computedDistance = Math.sqrt(sum);
      isMatch = computedDistance < 0.6; // 0.6 is the standard threshold
    } 
    // Option B: Client uploaded raw base64 image (e.g. Flutter mobile login)
    else if (image && typeof image === 'string') {
      try {
        // Load face-api and tensorflow server-side dynamically
        const tf = await import('@tensorflow/tfjs');
        const faceapi = await import('@vladmandic/face-api');
        const jpeg = await import('jpeg-js');

        // Load models if not loaded yet
        await loadServerModels();

        // Decode base64 image to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Decode JPEG
        const jpegData = jpeg.decode(imageBuffer, { useTArray: true });
        
        // Convert to RGB Tensor
        const numPixels = jpegData.width * jpegData.height;
        const values = new Int32Array(numPixels * 3);
        for (let i = 0; i < numPixels; i++) {
          values[i * 3] = jpegData.data[i * 4];     // R
          values[i * 3 + 1] = jpegData.data[i * 4 + 1]; // G
          values[i * 3 + 2] = jpegData.data[i * 4 + 2]; // B
        }
        
        const tensor = tf.tensor3d(values, [jpegData.height, jpegData.width, 3], 'int32');

        // Detect Face & Extract Descriptor
        const detection = await faceapi.detectSingleFace(
          tensor as any,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }) as any
        ).withFaceLandmarks().withFaceDescriptor();

        // Dispose tensor to prevent memory leaks
        tensor.dispose();

        if (detection) {
          const inputDescriptor = Array.from(detection.descriptor);
          const stored = employee.face_descriptor as number[];
          let sum = 0;
          for (let i = 0; i < 128; i++) {
            const diff = stored[i] - inputDescriptor[i];
            sum += diff * diff;
          }
          computedDistance = Math.sqrt(sum);
          isMatch = computedDistance < 0.6;
        } else {
          return NextResponse.json({ error: { message: 'No face detected in the uploaded image. Please try again.' } }, { status: 400 });
        }
      } catch (err: any) {
        console.error("Server-side face recognition error:", err);
        return NextResponse.json({ error: { message: 'Server-side face processing failed: ' + err.message } }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: { message: 'Face data (image or descriptor) is required' } }, { status: 400 });
    }

    if (!isMatch) {
      return NextResponse.json({ error: { message: 'Face verification failed. Access denied.', distance: computedDistance } }, { status: 401 });
    }

    // Create Token (Same as standard login)
    const tokenPayload = { id: employee.id, employee_code: employee.employee_code, role: employee.role };
    const access_token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
    const refresh_token = jwt.sign({ id: employee.id }, JWT_SECRET, { expiresIn: '7d' });

    await logAudit(employee.id, 'face_login', 'auth', employee.id, null, { distance: computedDistance }, req);

    return NextResponse.json({
      access_token,
      refresh_token,
      expires_in: 900,
      employee: {
        id: employee.id,
        name: employee.full_name,
        role: employee.role,
        dept: employee.department?.name,
        shift: employee.shift?.name,
        photo_url: employee.profile_image_url
      }
    });
  }

  // 2c. OTP Login (Firebase Token Verification)
  if (path[0] === 'auth' && path[1] === 'otp-login') {
    const { phone, firebase_token } = body;
    if (!phone || !firebase_token) {
      return NextResponse.json({ error: { message: 'Phone and Firebase token are required' } }, { status: 400 });
    }

    // In a real production app, we would use firebase-admin to verify the token
    // const decodedToken = await admin.auth().verifyIdToken(firebase_token);
    // const verifiedPhone = decodedToken.phone_number;
    
    // For now, we find the employee by mobile number
    const { data: employee, error } = await supabaseAdmin
      .from('employees')
      .select('*, department:departments(name), shift:shifts(name)')
      .eq('mobile', phone)
      .maybeSingle();

    if (error || !employee) {
      return NextResponse.json({ error: { message: 'Employee not found for this mobile number' } }, { status: 404 });
    }

    if (!employee.is_active) {
      return NextResponse.json({ error: { message: 'Employee account is deactivated' } }, { status: 403 });
    }

    // Create Token
    const tokenPayload = { id: employee.id, employee_code: employee.employee_code, role: employee.role };
    const access_token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
    const refresh_token = jwt.sign({ id: employee.id }, JWT_SECRET, { expiresIn: '7d' });

    await logAudit(employee.id, 'otp_login', 'auth', employee.id, null, { phone }, req);

    return NextResponse.json({
      access_token,
      refresh_token,
      expires_in: 900,
      employee: {
        id: employee.id,
        name: employee.full_name,
        role: employee.role,
        dept: employee.department?.name,
        shift: employee.shift?.name,
        photo_url: employee.profile_image_url
      }
    });
  }

  // Require Auth for remaining post requests
  if (!authUser) {
    return NextResponse.json({ error: { message: 'Unauthorized access', code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const userRole = authUser.role;
  const userId = authUser.id;

  // 3. Departments Create
  if (path[0] === 'departments') {
    if (userRole !== 'super_admin' && !authUser.permissions?.write) {
      return NextResponse.json({ error: { message: 'Write permission denied', code: 'FORBIDDEN' } }, { status: 403 });
    }
    const { data, error } = await supabaseAdmin.from('departments').insert({
      name: body.name,
      code: body.code.toUpperCase(),
      geo_fence_override_m: body.geo_fence_override_meters || 100
    }).select('*').single();
    
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, 'create_department', 'department', data.id, null, data, req);
    return NextResponse.json(data);
  }

  // 4. Shifts Create
  if (path[0] === 'shifts') {
    if (userRole !== 'super_admin' && !authUser.permissions?.write) {
      return NextResponse.json({ error: { message: 'Write permission denied', code: 'FORBIDDEN' } }, { status: 403 });
    }
    const { data, error } = await supabaseAdmin.from('shifts').insert({
      name: body.name,
      start_time: body.start_time,
      end_time: body.end_time,
      grace_minutes: body.grace_minutes || 10,
      total_break_limit_min: body.total_break_limit_min || 60
    }).select('*').single();
    
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, 'create_shift', 'shift', data.id, null, data, req);
    return NextResponse.json(data);
  }

  // 5. Employees Create & Face Enroll
  if (path[0] === 'employees') {
    // Check if it's Face Enrollment: POST /employees/:id/face/enroll
    if (path[2] === 'face' && path[3] === 'enroll') {
      const employeeId = path[1];
      const { face_descriptor, image } = body;
      
      if (!face_descriptor || !Array.isArray(face_descriptor)) {
        return NextResponse.json({ error: { message: 'Invalid face descriptor data' } }, { status: 400 });
      }

      const updateData: any = { face_descriptor };

      // Handle Image Upload to Supabase Storage if provided
      if (image && typeof image === 'string') {
        try {
          const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${employeeId}_${Date.now()}.jpg`;
          
          const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from('employee-photos')
            .upload(fileName, buffer, {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (uploadData) {
            const { data: { publicUrl } } = supabaseAdmin.storage.from('employee-photos').getPublicUrl(fileName);
            updateData.profile_image_url = publicUrl;
          }
        } catch (storageErr) {
          console.error("Storage upload failed:", storageErr);
        }
      }

      const { data, error } = await supabaseAdmin
        .from('employees')
        .update(updateData)
        .eq('id', employeeId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: { message: error.message } }, { status: 400 });
      }

      // Simulation: Azure Face API enrollment
      console.log(`[Azure Face API] Enrolled person for employee ${employeeId}`);

      await logAudit(userId, 'enroll_face', 'employee', employeeId, null, { face_descriptor_length: face_descriptor.length, has_image: !!image }, req);
      return NextResponse.json({ success: true, employee: { id: data.id, full_name: data.full_name, profile_image_url: data.profile_image_url } });
    }

    // Default: Create Employee (POST /employees)
    if (userRole !== 'super_admin' && userRole !== 'hr' && !authUser.permissions?.write) {
      return NextResponse.json({ error: { message: 'Write permission denied', code: 'FORBIDDEN' } }, { status: 403 });
    }
    const defaultPassword = await bcrypt.hash('password123', 10); // Default password for new employees
    const { data, error } = await supabaseAdmin.from('employees').insert({
      employee_code: body.employee_code || `DVH-${Math.floor(100 + Math.random() * 900)}`,
      full_name: body.full_name,
      mobile: body.mobile,
      email: body.email,
      department_id: body.department_id,
      shift_id: body.shift_id,
      role: body.role || 'staff',
      password: defaultPassword,
      permissions: body.role === 'super_admin' 
        ? { read: true, write: true, all: true }
        : body.role === 'hr'
        ? { read: true, write: true }
        : { read: true, write: false }
    }).select('*').single();
    
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, 'create_employee', 'employee', data.id, null, data, req);
    return NextResponse.json(data);
  }

  // 6. Attendance & Breaks (Mock Check-in and out + breaks implementation)
  if (path[0] === 'attendance' && path[1] === 'check-in') {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Check if already checked in
    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('employee_id', userId)
      .eq('date', today)
      .maybeSingle();
      
    if (existing) {
      return NextResponse.json({ error: { code: 'ALREADY_CHECKED_IN', message: 'You have already checked in today.' } }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from('attendance').insert({
      employee_id: userId,
      date: today,
      check_in: now.toISOString(),
      check_in_lat: body.latitude,
      check_in_lng: body.longitude,
      status: 'Present',
      is_late: false // Calculated based on shift
    }).select('*').single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ attendance_id: data.id, check_in_time: data.check_in, status: 'present' });
  }

  if (path[0] === 'attendance' && path[1] === 'check-out') {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const { data: attendance, error: fError } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('employee_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (!attendance) {
      return NextResponse.json({ error: { message: 'No active check-in today' } }, { status: 400 });
    }

    const checkInTime = new Date(attendance.check_in);
    const workMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / 60000);

    const { data, error } = await supabaseAdmin.from('attendance').update({
      check_out: now.toISOString(),
      check_out_lat: body.latitude,
      check_out_lng: body.longitude,
      total_work_minutes: workMinutes
    }).eq('id', attendance.id).select('*').single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ check_out_time: data.check_out, working_hours: (workMinutes / 60).toFixed(1) });
  }

  // 7. Leave Requests Submission
  if (path[0] === 'leave' && path[1] === 'requests') {
    const { data, error } = await supabaseAdmin.from('leave_requests').insert({
      employee_id: userId,
      leave_type: body.leave_type,
      from_date: body.from_date,
      to_date: body.to_date,
      reason: body.reason,
      document_url: body.document_url,
      status: 'pending'
    }).select('*').single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  // 8. Corrections Submission
  if (path[0] === 'corrections') {
    const { data, error } = await supabaseAdmin.from('corrections').insert({
      employee_id: userId,
      attendance_date: body.attendance_date,
      type: body.type,
      requested_value: body.requested_value,
      reason: body.reason,
      document_url: body.document_url,
      status: 'pending'
    }).select('*').single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  // 9. Leave Request Action: Approve / Reject
  if (path[0] === 'leave' && path[1] === 'requests' && path[2] && (path[3] === 'approve' || path[3] === 'reject')) {
    if (userRole !== 'super_admin' && userRole !== 'hr' && userRole !== 'dept_head') {
      return NextResponse.json({ error: { message: 'Access denied' } }, { status: 403 });
    }
    const newStatus = path[3] === 'approve' ? 'approved' : 'rejected';
    const { data, error } = await supabaseAdmin.from('leave_requests').update({
      status: newStatus,
      approved_by_id: userId,
      notes: body.reason || body.note
    }).eq('id', path[2]).select('*').single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, `leave_${newStatus}`, 'leave_request', data.id, null, data, req);
    return NextResponse.json(data);
  }

  // 10. Corrections Action: Approve / Reject
  if (path[0] === 'corrections' && path[1] && (path[2] === 'approve' || path[2] === 'reject')) {
    if (userRole !== 'super_admin' && userRole !== 'hr' && userRole !== 'dept_head') {
      return NextResponse.json({ error: { message: 'Access denied' } }, { status: 403 });
    }
    const newStatus = path[2] === 'approve' ? 'approved' : 'rejected';
    const { data, error } = await supabaseAdmin.from('corrections').update({
      status: newStatus,
      approved_by_id: userId,
      notes: body.reason || body.note
    }).eq('id', path[1]).select('*').single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    // If approved, update the corresponding attendance record!
    if (newStatus === 'approved') {
      const { data: correction } = await supabaseAdmin.from('corrections').select('*').eq('id', path[1]).single();
      if (correction) {
        // Query attendance record for that date
        const { data: attendance } = await supabaseAdmin
          .from('attendance')
          .select('id')
          .eq('employee_id', correction.employee_id)
          .eq('date', correction.attendance_date)
          .maybeSingle();

        const timeStr = correction.requested_value; // e.g. "09:00"
        const punchDateTime = new Date(`${correction.attendance_date}T${timeStr}:00Z`);

        if (attendance) {
          if (correction.type === 'forgot_check_in') {
            await supabaseAdmin.from('attendance').update({ check_in: punchDateTime.toISOString() }).eq('id', attendance.id);
          } else if (correction.type === 'forgot_check_out') {
            await supabaseAdmin.from('attendance').update({ check_out: punchDateTime.toISOString() }).eq('id', attendance.id);
          }
        } else {
          // Create new present attendance if none existed
          await supabaseAdmin.from('attendance').insert({
            employee_id: correction.employee_id,
            date: correction.attendance_date,
            check_in: correction.type === 'forgot_check_in' ? punchDateTime.toISOString() : null,
            check_out: correction.type === 'forgot_check_out' ? punchDateTime.toISOString() : null,
            status: 'Present'
          });
        }
      }
    }

    await logAudit(userId, `correction_${newStatus}`, 'correction', data.id, null, data, req);
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

// PUT Route Handler
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  const path = getPath(resolvedParams);
  const authUser = await getAuthUser(req);
  const body = await req.json().catch(() => ({}));

  if (!authUser) {
    return NextResponse.json({ error: { message: 'Unauthorized access', code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const userRole = authUser.role;
  const userId = authUser.id;

  // 1. Settings Update
  if (path[0] === 'settings') {
    if (userRole !== 'super_admin') {
      return NextResponse.json({ error: { message: 'Super admin role required', code: 'FORBIDDEN' } }, { status: 403 });
    }
    
    const { data: current } = await supabaseAdmin.from('settings').select('*').limit(1).maybeSingle();
    let data, error;
    
    if (current) {
      const payload: any = {
        hospital_name: body.hospital_name,
        geo_fence_lat: body.geo_fence_lat !== undefined ? Number(body.geo_fence_lat) : undefined,
        geo_fence_lng: body.geo_fence_lng !== undefined ? Number(body.geo_fence_lng) : undefined,
        geo_fence_radius_m: body.geo_fence_radius_m !== undefined ? Number(body.geo_fence_radius_m) : undefined,
        face_match_threshold: body.face_match_threshold !== undefined ? Number(body.face_match_threshold) : undefined,
        mock_gps_detection: body.mock_gps_detection,
        late_alert_enabled: body.late_alert_enabled,
        absent_alert_enabled: body.absent_alert_enabled,
        whatsapp_api_key: body.whatsapp_api_key,
        app_settings: body.app_settings || current.app_settings,
        updated_at: new Date().toISOString()
      };
      
      // Clean undefined
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const res = await supabaseAdmin.from('settings').update(payload).eq('id', current.id).select('*').single();
      data = res.data;
      error = res.error;
    } else {
      const payload: any = {
        hospital_name: body.hospital_name,
        geo_fence_lat: body.geo_fence_lat !== undefined ? Number(body.geo_fence_lat) : undefined,
        geo_fence_lng: body.geo_fence_lng !== undefined ? Number(body.geo_fence_lng) : undefined,
        geo_fence_radius_m: body.geo_fence_radius_m !== undefined ? Number(body.geo_fence_radius_m) : undefined,
        face_match_threshold: body.face_match_threshold !== undefined ? Number(body.face_match_threshold) : undefined,
        mock_gps_detection: body.mock_gps_detection,
        late_alert_enabled: body.late_alert_enabled,
        absent_alert_enabled: body.absent_alert_enabled,
        whatsapp_api_key: body.whatsapp_api_key,
        app_settings: body.app_settings
      };
      
      // Clean undefined
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      const res = await supabaseAdmin.from('settings').insert(payload).select('*').single();
      data = res.data;
      error = res.error;
    }

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, 'update_settings', 'settings', data.id, current, data, req);
    return NextResponse.json(data);
  }

  // 2. Departments Update
  if (path[0] === 'departments' && path[1]) {
    if (userRole !== 'super_admin' && !authUser.permissions?.write) {
      return NextResponse.json({ error: { message: 'Write permission denied', code: 'FORBIDDEN' } }, { status: 403 });
    }
    const { data: original } = await supabaseAdmin.from('departments').select('*').eq('id', path[1]).single();
    const { data, error } = await supabaseAdmin.from('departments').update({
      name: body.name,
      code: body.code.toUpperCase(),
      geo_fence_override_m: body.geo_fence_override_meters
    }).eq('id', path[1]).select('*').single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, 'update_department', 'department', path[1], original, data, req);
    return NextResponse.json(data);
  }

  // 3. Shifts Update
  if (path[0] === 'shifts' && path[1]) {
    if (userRole !== 'super_admin' && !authUser.permissions?.write) {
      return NextResponse.json({ error: { message: 'Write permission denied', code: 'FORBIDDEN' } }, { status: 403 });
    }
    const { data: original } = await supabaseAdmin.from('shifts').select('*').eq('id', path[1]).single();
    const { data, error } = await supabaseAdmin.from('shifts').update({
      name: body.name,
      start_time: body.start_time,
      end_time: body.end_time,
      grace_minutes: body.grace_minutes,
      total_break_limit_min: body.total_break_limit_min
    }).eq('id', path[1]).select('*').single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, 'update_shift', 'shift', path[1], original, data, req);
    return NextResponse.json(data);
  }

  // 4. Employees Update
  if (path[0] === 'employees' && path[1]) {
    if (userRole !== 'super_admin' && userRole !== 'hr' && !authUser.permissions?.write) {
      return NextResponse.json({ error: { message: 'Write permission denied', code: 'FORBIDDEN' } }, { status: 403 });
    }
    const { data: original } = await supabaseAdmin.from('employees').select('*').eq('id', path[1]).single();
    
    // Hash password if updating password
    let updatedPayload: any = {
      full_name: body.full_name,
      mobile: body.mobile,
      email: body.email,
      department_id: body.department_id,
      shift_id: body.shift_id,
      role: body.role,
      permissions: body.permissions
    };
    if (body.password) {
      updatedPayload.password = await bcrypt.hash(body.password, 10);
    }

    const { data, error } = await supabaseAdmin.from('employees').update(updatedPayload).eq('id', path[1]).select('*').single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, 'update_employee', 'employee', path[1], original, data, req);
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

// PATCH Route Handler
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  const path = getPath(resolvedParams);
  const authUser = await getAuthUser(req);
  const body = await req.json().catch(() => ({}));

  if (!authUser) {
    return NextResponse.json({ error: { message: 'Unauthorized access', code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const userRole = authUser.role;
  const userId = authUser.id;

  // 1. Activate / Deactivate Employee
  if (path[0] === 'employees' && path[1] && path[2] === 'status') {
    if (userRole !== 'super_admin' && userRole !== 'hr' && !authUser.permissions?.write) {
      return NextResponse.json({ error: { message: 'Write permission denied', code: 'FORBIDDEN' } }, { status: 403 });
    }
    const { data: original } = await supabaseAdmin.from('employees').select('*').eq('id', path[1]).single();
    const { data, error } = await supabaseAdmin.from('employees').update({
      is_active: body.is_active
    }).eq('id', path[1]).select('*').single();

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, `employee_status_${body.is_active ? 'active' : 'inactive'}`, 'employee', path[1], original, data, req);
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}

// DELETE Route Handler
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const resolvedParams = await params;
  const path = getPath(resolvedParams);
  const authUser = await getAuthUser(req);

  if (!authUser) {
    return NextResponse.json({ error: { message: 'Unauthorized access', code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  const userRole = authUser.role;
  const userId = authUser.id;

  // Verify write permission
  if (userRole !== 'super_admin' && !authUser.permissions?.write) {
    return NextResponse.json({ error: { message: 'Write permission denied', code: 'FORBIDDEN' } }, { status: 403 });
  }

  // 1. Departments Delete
  if (path[0] === 'departments' && path[1]) {
    const { data: original } = await supabaseAdmin.from('departments').select('*').eq('id', path[1]).single();
    const { error } = await supabaseAdmin.from('departments').delete().eq('id', path[1]);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, 'delete_department', 'department', path[1], original, null, req);
    return NextResponse.json({ success: true });
  }

  // 2. Shifts Delete
  if (path[0] === 'shifts' && path[1]) {
    const { data: original } = await supabaseAdmin.from('shifts').select('*').eq('id', path[1]).single();
    const { error } = await supabaseAdmin.from('shifts').delete().eq('id', path[1]);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, 'delete_shift', 'shift', path[1], original, null, req);
    return NextResponse.json({ success: true });
  }

  // 3. Employees Delete
  if (path[0] === 'employees' && path[1]) {
    const { data: original } = await supabaseAdmin.from('employees').select('*').eq('id', path[1]).single();
    const { error } = await supabaseAdmin.from('employees').delete().eq('id', path[1]);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, 'delete_employee', 'employee', path[1], original, null, req);
    return NextResponse.json({ success: true });
  }

  // 4. Reset Device Binding
  if (path[0] === 'employees' && path[1] && path[2] === 'device') {
    const { data: original } = await supabaseAdmin.from('employees').select('*').eq('id', path[1]).single();
    const { data, error } = await supabaseAdmin.from('employees').update({ device_id: null }).eq('id', path[1]).select('*').single();
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    
    await logAudit(userId, 'reset_device_binding', 'employee', path[1], original, data, req);
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
}
