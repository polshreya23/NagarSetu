export type CivicCategory =
  | 'Potholes & Roads'
  | 'Garbage & Waste'
  | 'Water Supply Leakage'
  | 'Drainage & Sewage'
  | 'Broken Streetlights'
  | 'Public Infrastructure Damage'
  | 'Other / Miscellaneous';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address: string;
  ward: string;
  pincode?: string;
  landmark?: string;
}

export interface StatusHistoryEntry {
  id: string;
  timestamp: string;
  status: ComplaintStatus;
  updatedBy: string;
  role: 'Citizen' | 'Admin' | 'System';
  remarks?: string;
}

export interface AIAnalysisResult {
  detected: boolean;
  category: CivicCategory;
  severity: SeverityLevel;
  confidence: number;
  description: string;
  isRelevantCivicIssue: boolean;
  suggestedDepartment: string;
  flagForReview: boolean;
  reviewReason?: string;
  urgencyFactors?: string[];
}

export interface Complaint {
  id: string;
  title: string;
  category: CivicCategory;
  description: string;
  imageUrl: string;
  location: LocationCoordinates;
  severity: SeverityLevel;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  submittedBy: {
    userId: string;
    name: string;
    phone?: string;
    email: string;
  };
  aiAnalysis: AIAnalysisResult;
  priorityScore: number; // 0 to 100
  priorityLevel: PriorityLevel;
  priorityOverride?: {
    isOverridden: boolean;
    overriddenScore?: number;
    overriddenLevel?: PriorityLevel;
    reason?: string;
    overriddenBy?: string;
    overriddenAt?: string;
  };
  reportCount: number; // For duplicate accumulation
  linkedUserIds: string[]; // Co-reporters who upvoted/reported duplicate
  assignedDepartment?: string;
  assignedOfficer?: string;
  estimatedResolutionHours?: number;
  resolutionNotes?: string;
  resolutionImageUrl?: string;
  resolvedAt?: string;
  history: StatusHistoryEntry[];
  isDemo?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin';
  phone?: string;
  ward?: string;
  photoUrl?: string;
  titleRole?: string;
  createdAt: string;
}

export interface DuplicateMatch {
  existingComplaint: Complaint;
  distanceMeters: number;
  timeDifferenceDays: number;
  similarityScore: number;
}
