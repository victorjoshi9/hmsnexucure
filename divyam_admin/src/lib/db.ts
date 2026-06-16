import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'src', 'lib', 'db.json');

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'SICK' | 'CASUAL' | 'EARNED' | 'UNPAID';
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface CorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'FORGOT_IN' | 'FORGOT_OUT' | 'LOCATION_ISSUE' | 'WRONG_STATUS';
  attendanceId?: string;
  date: string;
  requestedTime: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  operator: string;
  details: string;
  timestamp: string;
}

export interface HospitalSettings {
  hospitalName: string;
  globalGeofenceRadius: number;
  faceMatchThreshold: number;
  notificationsEnabled: boolean;
}

interface LocalDbSchema {
  leaveRequests: LeaveRequest[];
  corrections: CorrectionRequest[];
  auditLogs: AuditLog[];
  settings: HospitalSettings;
}

const DEFAULT_SETTINGS: HospitalSettings = {
  hospitalName: 'Divyam Hospital',
  globalGeofenceRadius: 200,
  faceMatchThreshold: 0.6,
  notificationsEnabled: true
};

const INITIAL_DB: LocalDbSchema = {
  leaveRequests: [
    {
      id: 'l1',
      employeeId: 'temp-emp-1',
      employeeName: 'Neha Singh',
      leaveType: 'CASUAL',
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      reason: 'Personal family event',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ],
  corrections: [
    {
      id: 'c1',
      employeeId: 'temp-emp-2',
      employeeName: 'Amit Gupta',
      type: 'FORGOT_OUT',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      requestedTime: '17:00',
      reason: 'Biometric device not responding at check-out time',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  auditLogs: [
    {
      id: 'a1',
      action: 'System Init',
      operator: 'System',
      details: 'Local database initialized with mock data',
      timestamp: new Date().toISOString()
    }
  ],
  settings: DEFAULT_SETTINGS
};

function readDb(): LocalDbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Create folder if not exists
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
      return INITIAL_DB;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading db.json, returning default:", err);
    return INITIAL_DB;
  }
}

function writeDb(data: LocalDbSchema) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing db.json:", err);
  }
}

// Exportable Database functions
export const localDb = {
  getLeaveRequests(): LeaveRequest[] {
    return readDb().leaveRequests;
  },
  createLeaveRequest(req: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>): LeaveRequest {
    const db = readDb();
    const newReq: LeaveRequest = {
      ...req,
      id: 'lr_' + Math.random().toString(36).substr(2, 9),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    db.leaveRequests.unshift(newReq);
    writeDb(db);
    this.addAuditLog('Create Leave Request', req.employeeName, `Applied for ${req.leaveType} leave from ${req.fromDate} to ${req.toDate}`);
    return newReq;
  },
  updateLeaveRequestStatus(id: string, status: 'APPROVED' | 'REJECTED', operator: string = 'Super Admin'): boolean {
    const db = readDb();
    const index = db.leaveRequests.findIndex(r => r.id === id);
    if (index === -1) return false;
    db.leaveRequests[index].status = status;
    writeDb(db);
    const req = db.leaveRequests[index];
    this.addAuditLog(`Leave Request ${status}`, operator, `${status} leave request for ${req.employeeName}`);
    return true;
  },

  getCorrections(): CorrectionRequest[] {
    return readDb().corrections;
  },
  createCorrection(cor: Omit<CorrectionRequest, 'id' | 'status' | 'createdAt'>): CorrectionRequest {
    const db = readDb();
    const newCor: CorrectionRequest = {
      ...cor,
      id: 'cr_' + Math.random().toString(36).substr(2, 9),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    db.corrections.unshift(newCor);
    writeDb(db);
    this.addAuditLog('Create Correction', cor.employeeName, `Requested punch correction for ${cor.date} (${cor.type})`);
    return newCor;
  },
  updateCorrectionStatus(id: string, status: 'APPROVED' | 'REJECTED', operator: string = 'Super Admin'): boolean {
    const db = readDb();
    const index = db.corrections.findIndex(c => c.id === id);
    if (index === -1) return false;
    db.corrections[index].status = status;
    writeDb(db);
    const cor = db.corrections[index];
    this.addAuditLog(`Correction ${status}`, operator, `${status} punch correction for ${cor.employeeName} on ${cor.date}`);
    return true;
  },

  getAuditLogs(): AuditLog[] {
    return readDb().auditLogs;
  },
  addAuditLog(action: string, operator: string, details: string): AuditLog {
    const db = readDb();
    const log: AuditLog = {
      id: 'al_' + Math.random().toString(36).substr(2, 9),
      action,
      operator,
      details,
      timestamp: new Date().toISOString()
    };
    db.auditLogs.unshift(log);
    writeDb(db);
    return log;
  },

  getSettings(): HospitalSettings {
    return readDb().settings;
  },
  updateSettings(settings: Partial<HospitalSettings>, operator: string = 'Super Admin'): HospitalSettings {
    const db = readDb();
    db.settings = { ...db.settings, ...settings };
    writeDb(db);
    this.addAuditLog('Update Settings', operator, `Updated settings: ${Object.keys(settings).join(', ')}`);
    return db.settings;
  }
};
