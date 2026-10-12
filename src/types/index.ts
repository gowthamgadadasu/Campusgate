export type UserRole = 'student' | 'proctor' | 'technical_incharge' | 'verifier' | 'admin';

export type EligibilityStatus = 
  | 'Eligible'
  | 'Below Threshold'
  | 'Attendance Unavailable'
  | 'Verification Required'
  | 'Outdated Data';

export type AccountStatus = 'active' | 'inactive' | 'suspended';

export type VerificationStatus = 
  | 'Open'
  | 'Assigned'
  | 'Under Review'
  | 'Needs Correction'
  | 'Awaiting Reverification'
  | 'Verified'
  | 'Unable to Verify'
  | 'Closed';

export type IssueCategory =
  | 'Missing student record'
  | 'Attendance mismatch'
  | 'Duplicate record'
  | 'Invalid attendance data'
  | 'Outdated attendance'
  | 'Missing supporting document'
  | 'Department or section mismatch'
  | 'Unresolved eligibility issue'
  | 'Manual review requested';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type EventCategory = 
  | 'Hackathon'
  | 'Workshop'
  | 'Conference'
  | 'Technical Competition'
  | 'Competitive Programming'
  | 'Paper Presentation'
  | 'Leadership & Dev Summit'
  | 'Industrial Visit'
  | 'Other';

export type EventStatus = 'Draft' | 'Published' | 'Closed' | 'Cancelled';

export type RequestStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Proctor Review'
  | 'Returned for Correction'
  | 'Recommended for Approval'
  | 'Recommended for Rejection'
  | 'Pending Final Decision'
  | 'Approved'
  | 'Rejected'
  | 'Withdrawn';

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  branch: string;
  academicYear: number; // 1, 2, 3, 4
  semester: number; // 1 to 8
  section: string;
  admissionBatch: string;
  graduationYear: number;
  assignedProctorId: string;
  assignedProctorName: string;
  status: AccountStatus;
  phoneNumber?: string;
  cgpa?: number;
  backlogCount?: number;
  prevSemesterGpa?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  rollNumber: string;
  classesConducted: number;
  classesAttended: number;
  calculatedPercentage: number | null; // null if conducted == 0
  suppliedPercentage?: number | null;
  dataAsOf: string; // ISO date
  importBatchId?: string;
  source: 'import' | 'manual' | 'system';
  isFresh: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceImportRow {
  rowNumber: number;
  rollNumber: string;
  studentName?: string;
  universityEmail?: string;
  department?: string;
  branch?: string;
  academicYear?: number;
  semester?: number;
  section?: string;
  admissionBatch?: string;
  graduationYear?: number;
  classesConducted?: number;
  classesAttended?: number;
  suppliedPercentage?: number;
  dataAsOf?: string;
  cgpa?: number;
  backlogCount?: number;
  status: 'valid' | 'invalid' | 'warning' | 'duplicate';
  errors: string[];
  warnings: string[];
  isEligibleForImport: boolean;
}

export interface AttendanceImportBatch {
  id: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warningRows: number;
  importedRows: number;
  uploadedBy: string;
  status: 'completed' | 'failed' | 'partial';
  createdAt: string;
  notes?: string;
}

export interface EligibilityResult {
  studentId: string;
  rollNumber: string;
  classesConducted: number;
  classesAttended: number;
  calculatedPercentage: number | null;
  configuredThreshold: number;
  differenceFromThreshold: number | null;
  status: EligibilityStatus;
  dataAsOf: string;
  lastImportDate: string;
  dataFreshnessDays: number;
  isOutdated: boolean;
  explanation: string;
  ruleVersion: string;
  calculatedAt: string;
  hasVerificationBlocker: boolean;
}

export interface VerificationComment {
  id: string;
  verificationCaseId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface VerificationCase {
  id: string; // e.g. "VER-2026-001"
  studentId: string;
  rollNumber: string;
  studentName: string;
  department: string;
  branch: string;
  academicYear: number;
  section: string;
  attendancePercentage: number | null;
  attendanceDataDate: string;
  dataSource: string;
  issueCategory: IssueCategory;
  severity: IssueSeverity;
  supportingDocUrl?: string;
  supportingDocName?: string;
  assignedReviewerId: string;
  assignedReviewerName: string;
  status: VerificationStatus;
  reviewerRemarks: string;
  importBatchId?: string;
  comments: VerificationComment[];
  createdAt: string;
  updatedAt: string;
}

export interface EventListing {
  id: string;
  title: string;
  organizer: string;
  category: EventCategory;
  description: string;
  venue: string;
  city: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  registrationDeadline: string; // YYYY-MM-DD
  eligibilityCriteria: string;
  requiredDocuments: string;
  purposeAndBenefits: string;
  externalRegistrationUrl?: string;
  eventWebsiteUrl?: string;
  bannerUrl?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  registrationFee?: string;
  maxParticipants?: number;
  studentInstructions?: string;
  status: EventStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventRequestHandoff {
  requestId: string; // e.g. "REQ-2026-101"
  eventId: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  studentDepartment: string;
  studentYear: number;
  studentSection: string;
  assignedProctorId: string;
  assignedProctorName: string;
  eventName: string;
  eventCategory: EventCategory;
  eventDate: string; // or date range
  startDate: string;
  endDate: string;
  venue: string;
  city: string;
  organizer: string;
  purpose: string;
  expectedBenefits: string;
  externalRegistrationEvidence?: string;
  externalRegistrationConfirmed: boolean;
  supportingDocuments: Array<{ name: string; url: string }>;
  status: RequestStatus;
  eligibility: EligibilityResult;
  verificationStatus: VerificationStatus | 'Not Required';
  hasDateOverlap?: boolean;
  dateOverlapWarning?: string;
  
  // Proctor Stage
  proctorRecommendation?: 'Recommended' | 'Rejected' | 'Needs Clarification';
  proctorRemarks?: string;
  proctorReviewedAt?: string;
  proctorReviewerName?: string;
  
  // In-Charge Final Stage
  technicalInchargeDecision?: 'Approved' | 'Rejected' | 'Pending';
  technicalInchargeRemarks?: string;
  technicalInchargeDecidedAt?: string;
  technicalInchargeDecisionMakerName?: string;
  approvalReferenceNumber?: string;
  authorizedOverride?: boolean;
  overrideReason?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  semester: number;
  sgpa: number;
  totalCredits: number;
  backlogs: number;
  academicYear: string;
  source: 'official' | 'unverified';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: 'student' | 'attendance' | 'verification' | 'config' | 'import' | 'event' | 'request';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface SystemConfig {
  minimumAttendanceThreshold: number; // default 75
  freshnessThresholdDays: number; // default 30 days
  enforceStrictVerification: boolean;
  academicPolicyRequirement: boolean; // false: attendance-only
}

export interface NotificationItem {
  id: string;
  recipientRole?: UserRole;
  recipientStudentRoll?: string;
  recipientProctorId?: string;
  title: string;
  message: string;
  category: 'import' | 'verification' | 'proctor' | 'attendance' | 'event' | 'request';
  timestamp: string;
  isRead: boolean;
  link?: string;
}
