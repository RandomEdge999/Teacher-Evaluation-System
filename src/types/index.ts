import NextAuth from 'next-auth';

export type RatingScale = 0 | 1 | 2 | 3 | 4 | 5;

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  branchId: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Teacher {
  id: string;
  fullName: string;
  employeeId: string;
  branchId: string;
  subjectPrimary: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RubricDomain {
  id: string;
  name: string;
  description: string;
  orderIndex: number;
  items: RubricItem[];
}

export interface RubricItem {
  id: string;
  domainId: string;
  number: number;
  prompt: string;
  orderIndex: number;
  maxScore: number;
  scaleMin: number;
  scaleMax: number;
}

export interface Observation {
  id: string;
  branchId: string;
  teacherId: string;
  observerId: string;
  classSection: string;
  totalStudents: number;
  presentStudents: number;
  subject: string;
  topic: string;
  date: Date;
  time: string;
  lessonPlanAttached: boolean;
  status: ObservationStatus;
  strengths?: string;
  areasToImprove?: string;
  suggestions?: string;
  overallSuggestedRating: number;
  overallOverrideRating?: number;
  overrideReason?: string;
  signatureImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Computed fields
  domainScores: DomainScore[];
  grandTotal: number;
  overallRating: string;
}

export interface ObservationItemScore {
  id: string;
  observationId: string;
  rubricItemId: string;
  rating?: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainScore {
  domainId: string;
  domainName: string;
  total: number;
  percentage: number;
  itemScores: ObservationItemScore[];
}

export interface Attachment {
  id: string;
  observationId: string;
  uploadedBy: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  size: number;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  objectType: string;
  objectId: string;
  action: string;
  userId: string;
  diff: Record<string, any>;
  createdAt: Date;
}

export interface Settings {
  id: string;
  key: string;
  value: any;
  description: string;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  OBSERVER = 'observer',
  REVIEWER = 'reviewer',
  TEACHER = 'teacher',
  GUEST = 'guest'
}

export enum ObservationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  FINALIZED = 'finalized'
}

export const RATING_LABELS: Record<RatingScale, string> = {
  0: 'Not Observed',
  1: 'Unsatisfactory',
  2: 'Needs Improvement',
  3: 'Satisfactory',
  4: 'Good',
  5: 'Excellent'
};

export const RATING_DESCRIPTIONS: Record<RatingScale, string> = {
  0: 'Not applicable or not observed',
  1: 'Does not meet expectations',
  2: 'Below expectations, needs work',
  3: 'Meets basic expectations',
  4: 'Exceeds expectations',
  5: 'Outstanding performance'
};

export function getRatingColor(rating: RatingScale): string {
  const colors = {
    0: 'text-gray-400',
    1: 'text-red-500',
    2: 'text-orange-500',
    3: 'text-yellow-500',
    4: 'text-blue-500',
    5: 'text-green-500'
  };
  return colors[rating] || 'text-gray-400';
}

export interface OverallRatingThreshold {
  minPercentage: number;
  maxPercentage: number;
  rating: string;
  color: string;
}

export const DEFAULT_OVERALL_RATING_THRESHOLDS: OverallRatingThreshold[] = [
  { minPercentage: 90, maxPercentage: 100, rating: 'Excellent', color: 'success' },
  { minPercentage: 75, maxPercentage: 89, rating: 'Good', color: 'primary' },
  { minPercentage: 60, maxPercentage: 74, rating: 'Average', color: 'warning' },
  { minPercentage: 50, maxPercentage: 59, rating: 'Weak', color: 'warning' },
  { minPercentage: 0, maxPercentage: 49, rating: 'Very Poor', color: 'danger' }
];

export interface ObservationFormData {
  teacherId: string;
  branchId: string;
  classSection: string;
  totalStudents: number;
  presentStudents: number;
  subject: string;
  topic: string;
  date: string;
  time: string;
  lessonPlanAttached: boolean;
  strengths: string;
  areasToImprove: string;
  suggestions: string;
  itemScores: Record<string, { rating: RatingScale; comment: string }>;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      branchId?: string;
      branchName?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    branchId?: string;
    branchName?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    branchId?: string;
    branchName?: string;
  }
}
