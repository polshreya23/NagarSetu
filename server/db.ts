import fs from 'fs';
import path from 'path';
import { Complaint, User, StatusHistoryEntry, PriorityLevel } from '../src/types/index.ts';
import { calculatePriorityScore } from '../src/utils/priority.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nagarsetu_db.json');

interface DatabaseSchema {
  users: User[];
  complaints: Complaint[];
  version: number;
  lastUpdated: string;
}

// Initial realistic seed data for Pune, Maharashtra (DEMO DATA)
const INITIAL_USERS: User[] = [
  {
    id: 'user-admin-1',
    name: 'Shri. Rajesh Deshmukh',
    email: 'admin@pune-civic.gov.in',
    role: 'admin',
    phone: '+91 98220 11223',
    ward: 'PMC Central Command',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-citizen-1',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    role: 'citizen',
    phone: '+91 98901 44556',
    ward: 'Shivajinagar',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-citizen-2',
    name: 'Priya Patil',
    email: 'priya.patil@example.com',
    role: 'citizen',
    phone: '+91 94220 77889',
    ward: 'Kothrud',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'PMC-2026-0814',
    title: 'Severe Road Crater & Water-Filled Potholes on FC Road',
    category: 'Potholes & Roads',
    description: 'A cluster of deep potholes right in front of Fergusson College main gate causing hazardous two-wheeler skids during peak evening traffic.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.5284,
      lng: 73.8425,
      address: 'Near FC College Main Gate, Fergusson College Road',
      ward: 'Shivajinagar - Ward 14',
      pincode: '411004',
      landmark: 'Opposite Goodluck Cafe',
    },
    severity: 'High',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 48 hours ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    submittedBy: {
      userId: 'user-citizen-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+91 98901 44556',
    },
    aiAnalysis: {
      detected: true,
      category: 'Potholes & Roads',
      severity: 'High',
      confidence: 0.94,
      description: 'Multiple asphalt cavities with standing rainwater; depth approximately 12-15 cm posing immediate vehicle suspension risk.',
      isRelevantCivicIssue: true,
      suggestedDepartment: 'Road Maintenance & Infrastructure Dept',
      flagForReview: false,
      urgencyFactors: ['High traffic corridor', 'Monsoon water accumulation', 'Two-wheeler risk'],
    },
    priorityScore: 78,
    priorityLevel: 'Critical',
    reportCount: 3,
    linkedUserIds: ['user-citizen-1', 'user-citizen-2'],
    assignedDepartment: 'Road Maintenance & Infrastructure Dept',
    assignedOfficer: 'Er. Nilesh Kadam (Deputy Road Engineer)',
    history: [
      {
        id: 'hist-1',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        status: 'Pending',
        updatedBy: 'Aarav Sharma',
        role: 'Citizen',
        remarks: 'Report registered with geo-tagged photograph.',
      },
      {
        id: 'hist-2',
        timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
        status: 'Pending',
        updatedBy: 'NagarSetu AI Engine',
        role: 'System',
        remarks: 'AI Classified as High Severity (94% confidence). Priority score calculated.',
      },
      {
        id: 'hist-3',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
        updatedBy: 'Shri. Rajesh Deshmukh',
        role: 'Admin',
        remarks: 'Cold-mix asphalt patch team dispatched for evening night-shift repair.',
      },
    ],
    isDemo: true,
  },
  {
    id: 'PMC-2026-0819',
    title: 'Illegal Open Garbage Dumping & Burning Hazard',
    category: 'Garbage & Waste',
    description: 'Over 2 tons of mixed commercial and plastic waste accumulating near Datta Mandir Chowk, attracting stray animals and blocking footpath.',
    imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.5679,
      lng: 73.9143,
      address: 'Datta Mandir Chowk, Viman Nagar',
      ward: 'Viman Nagar - Ward 4',
      pincode: '411014',
      landmark: 'Near Symbiosis Campus Gate 2',
    },
    severity: 'High',
    status: 'Pending',
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    submittedBy: {
      userId: 'user-citizen-2',
      name: 'Priya Patil',
      email: 'priya.patil@example.com',
      phone: '+91 94220 77889',
    },
    aiAnalysis: {
      detected: true,
      category: 'Garbage & Waste',
      severity: 'High',
      confidence: 0.96,
      description: 'Extensive solid waste heap overflowing into pedestrian walkway with signs of decomposing organic and synthetic waste.',
      isRelevantCivicIssue: true,
      suggestedDepartment: 'Solid Waste Management Dept',
      flagForReview: false,
      urgencyFactors: ['Health hazard', 'Obstruction of pedestrian path', 'Odour nuisance'],
    },
    priorityScore: 68,
    priorityLevel: 'High',
    reportCount: 2,
    linkedUserIds: ['user-citizen-2'],
    assignedDepartment: 'Solid Waste Management Dept',
    history: [
      {
        id: 'hist-viman-1',
        timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        status: 'Pending',
        updatedBy: 'Priya Patil',
        role: 'Citizen',
        remarks: 'Civic complaint raised with location details.',
      },
    ],
    isDemo: true,
  },
  {
    id: 'PMC-2026-0803',
    title: 'High-Pressure Drinking Water Pipeline Rupture',
    category: 'Water Supply Leakage',
    description: 'Fresh potable water gushing on the main road for over 18 hours. Thousands of litres lost every hour.',
    imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.5074,
      lng: 73.8077,
      address: 'Karve Road near Karve Statue',
      ward: 'Kothrud - Ward 12',
      pincode: '411038',
      landmark: 'Opposite Dahanukar Colony Flyover',
    },
    severity: 'Critical',
    status: 'Pending',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    submittedBy: {
      userId: 'user-citizen-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      phone: '+91 98901 44556',
    },
    aiAnalysis: {
      detected: true,
      category: 'Water Supply Leakage',
      severity: 'Critical',
      confidence: 0.98,
      description: 'Continuous high-volume clean water discharge from subterranean municipal distribution pipeline with localized road erosion.',
      isRelevantCivicIssue: true,
      suggestedDepartment: 'Water Supply & Pumping Dept',
      flagForReview: false,
      urgencyFactors: ['Resource wastage', 'Subsurface road erosion', 'Water pressure drop in residential sectors'],
    },
    priorityScore: 82,
    priorityLevel: 'Critical',
    reportCount: 4,
    linkedUserIds: ['user-citizen-1'],
    assignedDepartment: 'Water Supply & Pumping Dept',
    history: [
      {
        id: 'hist-water-1',
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        status: 'Pending',
        updatedBy: 'Aarav Sharma',
        role: 'Citizen',
        remarks: 'Emergency water leakage reported.',
      },
    ],
    isDemo: true,
  },
  {
    id: 'PMC-2026-0792',
    title: 'Raw Sewage Overflow & Open Drainage Blockage',
    category: 'Drainage & Sewage',
    description: 'Blackwater sewage backing up onto the commercial street near Hadapsar Gadital market area.',
    imageUrl: 'https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.5022,
      lng: 73.9275,
      address: 'Gadital Market, Pune-Solapur Highway Junction',
      ward: 'Hadapsar - Ward 21',
      pincode: '411028',
      landmark: 'Opposite Hadapsar Bus Depot',
    },
    severity: 'High',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 52 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    submittedBy: {
      userId: 'user-citizen-2',
      name: 'Priya Patil',
      email: 'priya.patil@example.com',
    },
    aiAnalysis: {
      detected: true,
      category: 'Drainage & Sewage',
      severity: 'High',
      confidence: 0.91,
      description: 'Effluent backflow emerging from stormwater drain cover with severe biohazard indicator and foul stench.',
      isRelevantCivicIssue: true,
      suggestedDepartment: 'Drainage & Sewerage Dept',
      flagForReview: false,
      urgencyFactors: ['Bacterial infection risk', 'Commercial zone exposure', 'Monsoon drainage failure'],
    },
    priorityScore: 71,
    priorityLevel: 'High',
    reportCount: 2,
    linkedUserIds: ['user-citizen-2'],
    assignedDepartment: 'Drainage & Sewerage Dept',
    assignedOfficer: 'Er. Sandeep Borde',
    history: [
      {
        id: 'hist-drain-1',
        timestamp: new Date(Date.now() - 52 * 60 * 60 * 1000).toISOString(),
        status: 'Pending',
        updatedBy: 'Priya Patil',
        role: 'Citizen',
        remarks: 'Complaint filed.',
      },
      {
        id: 'hist-drain-2',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
        updatedBy: 'Shri. Rajesh Deshmukh',
        role: 'Admin',
        remarks: 'Suction jetting machine team assigned.',
      },
    ],
    isDemo: true,
  },
  {
    id: 'PMC-2026-0775',
    title: 'Series of 6 Non-Functional Streetlights on Baner Link Road',
    category: 'Broken Streetlights',
    description: 'Stretch of 300 meters completely pitch dark after 7:30 PM, creating major security and pedestrian hazard.',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.5482,
      lng: 73.785,
      address: 'Baner-Pashan Link Road',
      ward: 'Baner - Ward 9',
      pincode: '411045',
      landmark: 'Near Supreme Amadore Society',
    },
    severity: 'Medium',
    status: 'Resolved',
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    submittedBy: {
      userId: 'user-citizen-1',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
    },
    aiAnalysis: {
      detected: true,
      category: 'Broken Streetlights',
      severity: 'Medium',
      confidence: 0.89,
      description: 'Multiple overhead LED lamp fixtures unpowered; potential fuse blowout in distribution box.',
      isRelevantCivicIssue: true,
      suggestedDepartment: 'Electrical & Street Lighting Dept',
      flagForReview: false,
      urgencyFactors: ['Nighttime visibility hazard', 'Pedestrian safety'],
    },
    priorityScore: 54,
    priorityLevel: 'High',
    reportCount: 3,
    linkedUserIds: ['user-citizen-1'],
    assignedDepartment: 'Electrical & Street Lighting Dept',
    assignedOfficer: 'Smt. Kavita Shinde',
    resolutionNotes: 'Phase distribution feeder repaired and replaced 3 faulty LED driver units. All 6 poles verified illuminated.',
    resolutionImageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
    resolvedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    history: [
      {
        id: 'hist-light-1',
        timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
        status: 'Pending',
        updatedBy: 'Aarav Sharma',
        role: 'Citizen',
        remarks: 'Complaint filed.',
      },
      {
        id: 'hist-light-2',
        timestamp: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
        status: 'In Progress',
        updatedBy: 'Shri. Rajesh Deshmukh',
        role: 'Admin',
        remarks: 'Maintenance van scheduled for evening inspection.',
      },
      {
        id: 'hist-light-3',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        status: 'Resolved',
        updatedBy: 'Smt. Kavita Shinde',
        role: 'Admin',
        remarks: 'Repairs completed and lamps tested.',
      },
    ],
    isDemo: true,
  },
  {
    id: 'PMC-2026-0825',
    title: 'Cracked Stormwater Chamber Cover & Exposed Rebar',
    category: 'Public Infrastructure Damage',
    description: 'Heavy concrete cover of the storm drain collapsed partially on MG Road footpath.',
    imageUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80',
    location: {
      lat: 18.5158,
      lng: 73.8784,
      address: 'MG Road, Pune Camp',
      ward: 'Camp / Cantonment - Ward 18',
      pincode: '411001',
      landmark: 'Near Aurora Towers',
    },
    severity: 'High',
    status: 'Pending',
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    submittedBy: {
      userId: 'user-citizen-2',
      name: 'Priya Patil',
      email: 'priya.patil@example.com',
    },
    aiAnalysis: {
      detected: true,
      category: 'Public Infrastructure Damage',
      severity: 'High',
      confidence: 0.93,
      description: 'Fractured precast concrete slab with 2-foot void on public pedestrian walkway.',
      isRelevantCivicIssue: true,
      suggestedDepartment: 'Public Works & Civil Infrastructure Dept',
      flagForReview: false,
      urgencyFactors: ['Tripping danger', 'Heavy shopping foot traffic'],
    },
    priorityScore: 61,
    priorityLevel: 'High',
    reportCount: 1,
    linkedUserIds: ['user-citizen-2'],
    assignedDepartment: 'Public Works & Civil Infrastructure Dept',
    history: [
      {
        id: 'hist-camp-1',
        timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        status: 'Pending',
        updatedBy: 'Priya Patil',
        role: 'Citizen',
        remarks: 'Report registered.',
      },
    ],
    isDemo: true,
  },
];

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
    this.recalculateDynamicPriorities();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    this.ensureDirectory();
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed && Array.isArray(parsed.complaints) && Array.isArray(parsed.users)) {
          return parsed;
        }
      } catch (err) {
        console.error('Failed reading database file, initializing fallback:', err);
      }
    }

    const initialData: DatabaseSchema = {
      users: INITIAL_USERS,
      complaints: INITIAL_COMPLAINTS,
      version: 1,
      lastUpdated: new Date().toISOString(),
    };

    this.saveDatabase(initialData);
    return initialData;
  }

  private saveDatabase(dataToSave?: DatabaseSchema) {
    this.ensureDirectory();
    const data = dataToSave || this.data;
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Recalculates dynamic priority scores based on current elapsed waiting hours
   * unless administrator explicitly overrode priority
   */
  public recalculateDynamicPriorities() {
    let changed = false;
    const now = new Date();

    for (const c of this.data.complaints) {
      if (c.status === 'Resolved') continue;

      if (c.priorityOverride?.isOverridden && c.priorityOverride.overriddenScore !== undefined) {
        c.priorityScore = c.priorityOverride.overriddenScore;
        c.priorityLevel = c.priorityOverride.overriddenLevel || c.priorityLevel;
      } else {
        const calculated = calculatePriorityScore(c.severity, c.reportCount, c.createdAt, now);
        if (c.priorityScore !== calculated.score || c.priorityLevel !== calculated.level) {
          c.priorityScore = calculated.score;
          c.priorityLevel = calculated.level;
          changed = true;
        }
      }
    }

    if (changed) {
      this.saveDatabase();
    }
  }

  // Complaints CRUD & Operations
  public getAllComplaints(): Complaint[] {
    this.recalculateDynamicPriorities();
    return [...this.data.complaints].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getComplaintById(id: string): Complaint | undefined {
    this.recalculateDynamicPriorities();
    return this.data.complaints.find((c) => c.id === id);
  }

  public createComplaint(complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'history' | 'priorityScore' | 'priorityLevel'>): Complaint {
    const nowIso = new Date().toISOString();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const id = `PMC-${new Date().getFullYear()}-${randomSuffix}`;

    const calculated = calculatePriorityScore(
      complaintData.severity,
      complaintData.reportCount || 1,
      nowIso
    );

    const initialHistory: StatusHistoryEntry[] = [
      {
        id: `hist-${Date.now()}-1`,
        timestamp: nowIso,
        status: complaintData.status || 'Pending',
        updatedBy: complaintData.submittedBy.name,
        role: 'Citizen',
        remarks: 'Complaint registered by citizen with AI analysis.',
      },
    ];

    const newComplaint: Complaint = {
      ...complaintData,
      id,
      createdAt: nowIso,
      updatedAt: nowIso,
      priorityScore: calculated.score,
      priorityLevel: calculated.level,
      reportCount: complaintData.reportCount || 1,
      linkedUserIds: complaintData.linkedUserIds || [complaintData.submittedBy.userId],
      history: initialHistory,
      isDemo: false,
    };

    this.data.complaints.unshift(newComplaint);
    this.saveDatabase();
    return newComplaint;
  }

  public updateComplaintStatus(
    id: string,
    status: 'Pending' | 'In Progress' | 'Resolved',
    updatedBy: { name: string; role: 'Admin' | 'Citizen' },
    remarks?: string,
    options?: {
      assignedDepartment?: string;
      assignedOfficer?: string;
      resolutionNotes?: string;
      resolutionImageUrl?: string;
    }
  ): Complaint | null {
    const complaint = this.data.complaints.find((c) => c.id === id);
    if (!complaint) return null;

    const nowIso = new Date().toISOString();
    complaint.status = status;
    complaint.updatedAt = nowIso;

    if (options?.assignedDepartment) complaint.assignedDepartment = options.assignedDepartment;
    if (options?.assignedOfficer) complaint.assignedOfficer = options.assignedOfficer;
    if (options?.resolutionNotes) complaint.resolutionNotes = options.resolutionNotes;
    if (options?.resolutionImageUrl) complaint.resolutionImageUrl = options.resolutionImageUrl;

    if (status === 'Resolved') {
      complaint.resolvedAt = nowIso;
    }

    const historyEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}`,
      timestamp: nowIso,
      status,
      updatedBy: updatedBy.name,
      role: updatedBy.role,
      remarks: remarks || `Status changed to ${status}`,
    };

    complaint.history.push(historyEntry);
    this.saveDatabase();
    return complaint;
  }

  public overridePriority(
    id: string,
    newLevel: PriorityLevel,
    newScore: number,
    adminName: string,
    reason: string
  ): Complaint | null {
    const complaint = this.data.complaints.find((c) => c.id === id);
    if (!complaint) return null;

    complaint.priorityOverride = {
      isOverridden: true,
      overriddenLevel: newLevel,
      overriddenScore: Math.min(100, Math.max(0, newScore)),
      overriddenBy: adminName,
      overriddenAt: new Date().toISOString(),
      reason,
    };

    complaint.priorityLevel = newLevel;
    complaint.priorityScore = Math.min(100, Math.max(0, newScore));
    complaint.updatedAt = new Date().toISOString();

    complaint.history.push({
      id: `hist-override-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: complaint.status,
      updatedBy: adminName,
      role: 'Admin',
      remarks: `Priority overridden to ${newLevel} (${newScore}/100). Reason: ${reason}`,
    });

    this.saveDatabase();
    return complaint;
  }

  public linkDuplicateReport(
    complaintId: string,
    userId: string,
    userName: string,
    citizenNotes?: string
  ): Complaint | null {
    const complaint = this.data.complaints.find((c) => c.id === complaintId);
    if (!complaint) return null;

    if (!complaint.linkedUserIds.includes(userId)) {
      complaint.linkedUserIds.push(userId);
    }
    complaint.reportCount = (complaint.reportCount || 1) + 1;
    complaint.updatedAt = new Date().toISOString();

    // Recalculate priority due to increased report count
    if (!complaint.priorityOverride?.isOverridden) {
      const calculated = calculatePriorityScore(
        complaint.severity,
        complaint.reportCount,
        complaint.createdAt
      );
      complaint.priorityScore = calculated.score;
      complaint.priorityLevel = calculated.level;
    }

    complaint.history.push({
      id: `hist-dup-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: complaint.status,
      updatedBy: userName,
      role: 'Citizen',
      remarks: `Citizen co-reported / affirmed this issue (Total reports: ${complaint.reportCount}). ${
        citizenNotes ? `Note: "${citizenNotes}"` : ''
      }`,
    });

    this.saveDatabase();
    return complaint;
  }

  // Users Management
  public getAllUsers(): User[] {
    return this.data.users;
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveDatabase();
    return newUser;
  }

  public resetDemoData() {
    this.data = {
      users: INITIAL_USERS,
      complaints: INITIAL_COMPLAINTS,
      version: 1,
      lastUpdated: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.data;
  }
}

export const db = new DatabaseManager();
