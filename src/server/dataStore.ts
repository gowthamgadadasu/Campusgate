import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Student,
  AttendanceRecord,
  VerificationCase,
  EligibilityResult,
  EligibilityStatus,
  SystemConfig,
  AttendanceImportRow,
  AttendanceImportBatch,
  AuditLogEntry,
  EventRequestHandoff,
  NotificationItem,
  UserRole,
  EventListing,
  EventStatus,
  RequestStatus,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_ATTENDANCE,
  INITIAL_VERIFICATION_CASES,
  INITIAL_EVENT_HANDOFFS,
} from '../data/initialData';
import { INITIAL_EVENTS } from '../data/initialEvents';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'campusgate_db.json');

export interface DatabaseSchema {
  students: Student[];
  attendance: AttendanceRecord[];
  events: EventListing[];
  requests: EventRequestHandoff[];
  verifications: VerificationCase[];
  importBatches: AttendanceImportBatch[];
  auditLogs: AuditLogEntry[];
  notifications: NotificationItem[];
  config: SystemConfig;
}

const DEFAULT_CONFIG: SystemConfig = {
  minimumAttendanceThreshold: 75.0,
  freshnessThresholdDays: 30,
  enforceStrictVerification: true,
  academicPolicyRequirement: false,
};

export class ServerDataStore {
  private static instance: ServerDataStore;
  private db: DatabaseSchema;

  private constructor() {
    this.db = this.loadDatabase();
  }

  public static getInstance(): ServerDataStore {
    if (!ServerDataStore.instance) {
      ServerDataStore.instance = new ServerDataStore();
    }
    return ServerDataStore.instance;
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to read database file, initializing default seed:', err);
    }

    const initialDb: DatabaseSchema = {
      students: INITIAL_STUDENTS,
      attendance: INITIAL_ATTENDANCE,
      events: INITIAL_EVENTS,
      requests: INITIAL_EVENT_HANDOFFS,
      verifications: INITIAL_VERIFICATION_CASES,
      importBatches: [
        {
          id: 'BATCH-INITIAL',
          fileName: 'Master_Attendance_Sem_6_Oct2026.xlsx',
          totalRows: 26,
          validRows: 26,
          invalidRows: 0,
          duplicateRows: 0,
          warningRows: 0,
          importedRows: 26,
          uploadedBy: 'Prof. Ananthakrishnan (Technical In-Charge)',
          status: 'completed',
          createdAt: '2026-10-05T08:00:00Z',
          notes: 'Standard batch import via automated registrar synchronization',
        },
      ],
      auditLogs: [
        {
          id: 'AUD-001',
          actorId: 'TECH-HEAD-01',
          actorName: 'Prof. Ananthakrishnan',
          actorRole: 'technical_incharge',
          action: 'BATCH_IMPORT_COMMITTED',
          entityType: 'import',
          entityId: 'BATCH-INITIAL',
          details: 'Successfully imported 26 student attendance records from Master_Attendance_Sem_6_Oct2026.xlsx',
          timestamp: '2026-10-05T08:00:00Z',
        },
      ],
      notifications: [
        {
          id: 'NOTIF-001',
          title: 'CampusGate Backend Initialized',
          message: 'Persistent server datastore loaded successfully.',
          category: 'event',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ],
      config: DEFAULT_CONFIG,
    };

    this.saveDatabase(initialDb);
    return initialDb;
  }

  private saveDatabase(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  private persist(): void {
    this.saveDatabase(this.db);
  }

  // --- CONFIGURATION ---
  public getConfig(): SystemConfig {
    return this.db.config;
  }

  public updateConfig(config: Partial<SystemConfig>, actorRole: UserRole = 'admin'): SystemConfig {
    this.db.config = { ...this.db.config, ...config };
    this.persist();
    this.logAudit({
      actorId: 'CURRENT_USER',
      actorName: 'System User',
      actorRole,
      action: 'CONFIG_UPDATED',
      entityType: 'config',
      entityId: 'SYSTEM_SETTINGS',
      details: `Threshold updated to ${this.db.config.minimumAttendanceThreshold}%, freshness to ${this.db.config.freshnessThresholdDays} days.`,
    });
    return this.db.config;
  }

  // --- STUDENTS ---
  public getStudents(): Student[] {
    return this.db.students;
  }

  public getStudentById(id: string): Student | undefined {
    return this.db.students.find(s => s.id === id || s.rollNumber.toLowerCase() === id.toLowerCase());
  }

  // --- ATTENDANCE ---
  public getAttendanceRecords(): AttendanceRecord[] {
    return this.db.attendance;
  }

  public getAttendanceForStudent(rollNumber: string): AttendanceRecord | undefined {
    return this.db.attendance.find(a => a.rollNumber.toLowerCase() === rollNumber.toLowerCase());
  }

  // --- MEDIATOR ELIGIBILITY ENGINE ---
  public calculateEligibility(student: Student, attendance?: AttendanceRecord): EligibilityResult {
    const config = this.getConfig();
    const now = new Date();

    if (!attendance) {
      return {
        studentId: student.id,
        rollNumber: student.rollNumber,
        classesConducted: 0,
        classesAttended: 0,
        calculatedPercentage: null,
        configuredThreshold: config.minimumAttendanceThreshold,
        differenceFromThreshold: null,
        status: 'Attendance Unavailable',
        dataAsOf: 'N/A',
        lastImportDate: 'Never',
        dataFreshnessDays: -1,
        isOutdated: false,
        explanation: 'No official attendance records have been registered or imported for this student.',
        ruleVersion: `v3.0-TH-${config.minimumAttendanceThreshold}`,
        calculatedAt: now.toISOString(),
        hasVerificationBlocker: false,
      };
    }

    if (attendance.classesConducted === 0) {
      return {
        studentId: student.id,
        rollNumber: student.rollNumber,
        classesConducted: 0,
        classesAttended: 0,
        calculatedPercentage: null,
        configuredThreshold: config.minimumAttendanceThreshold,
        differenceFromThreshold: null,
        status: 'Attendance Unavailable',
        dataAsOf: attendance.dataAsOf,
        lastImportDate: attendance.updatedAt,
        dataFreshnessDays: 0,
        isOutdated: false,
        explanation: 'Classes conducted is 0. Cannot compute percentage without completed sessions.',
        ruleVersion: `v3.0-TH-${config.minimumAttendanceThreshold}`,
        calculatedAt: now.toISOString(),
        hasVerificationBlocker: false,
      };
    }

    const calculated = Number(((attendance.classesAttended / attendance.classesConducted) * 100).toFixed(2));
    const recordDate = new Date(attendance.dataAsOf);
    const diffTime = Math.abs(now.getTime() - recordDate.getTime());
    const freshnessDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOutdated = freshnessDays > config.freshnessThresholdDays;

    const activeVerifications = this.db.verifications.filter(
      v => v.rollNumber.toLowerCase() === student.rollNumber.toLowerCase() &&
           ['Open', 'Assigned', 'Under Review', 'Needs Correction', 'Awaiting Reverification'].includes(v.status)
    );
    const hasVerificationBlocker = activeVerifications.length > 0;

    let status: EligibilityStatus = 'Eligible';
    let explanation = '';

    if (hasVerificationBlocker) {
      status = 'Verification Required';
      explanation = `Active verification hold [${activeVerifications[0].id}: ${activeVerifications[0].issueCategory}] requires reviewer clearance before event recommendation.`;
    } else if (isOutdated) {
      status = 'Outdated Data';
      explanation = `Attendance record is ${freshnessDays} days old (threshold: ${config.freshnessThresholdDays} days). Updated attendance import required.`;
    } else if (calculated < config.minimumAttendanceThreshold) {
      status = 'Below Threshold';
      const deficit = (config.minimumAttendanceThreshold - calculated).toFixed(1);
      explanation = `Current attendance (${calculated}%) is below the configured institutional requirement of ${config.minimumAttendanceThreshold}% (${deficit}% deficit).`;
    } else {
      status = 'Eligible';
      const surplus = (calculated - config.minimumAttendanceThreshold).toFixed(1);
      explanation = `Attendance (${calculated}%) meets the ${config.minimumAttendanceThreshold}% requirement (+${surplus}% above threshold).`;
    }

    return {
      studentId: student.id,
      rollNumber: student.rollNumber,
      classesConducted: attendance.classesConducted,
      classesAttended: attendance.classesAttended,
      calculatedPercentage: calculated,
      configuredThreshold: config.minimumAttendanceThreshold,
      differenceFromThreshold: Number((calculated - config.minimumAttendanceThreshold).toFixed(2)),
      status,
      dataAsOf: attendance.dataAsOf,
      lastImportDate: attendance.updatedAt,
      dataFreshnessDays: freshnessDays,
      isOutdated,
      explanation,
      ruleVersion: `v3.0-TH-${config.minimumAttendanceThreshold}`,
      calculatedAt: now.toISOString(),
      hasVerificationBlocker,
    };
  }

  // --- EVENTS ---
  public getEvents(): EventListing[] {
    return this.db.events;
  }

  public getEventById(id: string): EventListing | undefined {
    return this.db.events.find(e => e.id === id);
  }

  public saveEvent(event: EventListing, authorName: string, authorRole: UserRole = 'technical_incharge'): EventListing {
    const existingIndex = this.db.events.findIndex(e => e.id === event.id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      this.db.events[existingIndex] = { ...event, updatedAt: now };
    } else {
      this.db.events.unshift({ ...event, createdAt: now, updatedAt: now });
    }
    this.persist();

    this.logAudit({
      actorId: 'CURRENT_USER',
      actorName: authorName,
      actorRole: authorRole,
      action: existingIndex >= 0 ? 'EVENT_UPDATED' : 'EVENT_CREATED',
      entityType: 'event',
      entityId: event.id,
      details: `${existingIndex >= 0 ? 'Updated' : 'Created'} event listing "${event.title}" [Status: ${event.status}]`,
    });

    if (event.status === 'Published') {
      this.addNotification({
        title: `New Event Published: ${event.title}`,
        message: `${event.organizer} announced ${event.title} (${event.category}). Registration open until ${event.registrationDeadline}.`,
        category: 'event',
        link: 'student',
      });
    }

    return event;
  }

  public updateEventStatus(eventId: string, newStatus: EventStatus, authorName: string, authorRole: UserRole): boolean {
    const event = this.db.events.find(e => e.id === eventId);
    if (!event) return false;

    event.status = newStatus;
    event.updatedAt = new Date().toISOString();
    this.persist();

    this.logAudit({
      actorId: 'CURRENT_USER',
      actorName: authorName,
      actorRole: authorRole,
      action: 'EVENT_STATUS_CHANGED',
      entityType: 'event',
      entityId: eventId,
      details: `Event "${event.title}" status changed to ${newStatus}.`,
    });

    return true;
  }

  // --- EVENT PARTICIPATION REQUESTS ---
  public getEventRequests(): EventRequestHandoff[] {
    return this.db.requests;
  }

  public getEventRequestById(requestId: string): EventRequestHandoff | undefined {
    return this.db.requests.find(r => r.requestId === requestId);
  }

  public submitEventRequest(data: {
    eventId: string;
    student: Student;
    purpose: string;
    expectedBenefits: string;
    externalRegistrationEvidence?: string;
    externalRegistrationConfirmed: boolean;
    supportingDocuments: Array<{ name: string; url: string }>;
  }): { request: EventRequestHandoff; error?: string } {
    const event = this.getEventById(data.eventId);
    if (!event) return { request: null as any, error: 'Event not found.' };

    // Check duplicate active request
    const existingActive = this.db.requests.find(
      r => r.studentId === data.student.id &&
           r.eventId === data.eventId &&
           r.status !== 'Withdrawn' &&
           r.status !== 'Rejected'
    );
    if (existingActive) {
      return {
        request: null as any,
        error: `Active request ${existingActive.requestId} already exists for this event (Status: ${existingActive.status}).`,
      };
    }

    // Check date overlaps
    const now = new Date();
    const eventStart = new Date(event.startDate).getTime();
    const eventEnd = new Date(event.endDate).getTime();

    let hasDateOverlap = false;
    let dateOverlapWarning = '';

    const otherApprovedOrPending = this.db.requests.filter(
      r => r.studentId === data.student.id &&
           r.status !== 'Withdrawn' &&
           r.status !== 'Rejected'
    );

    for (const req of otherApprovedOrPending) {
      const otherStart = new Date(req.startDate).getTime();
      const otherEnd = new Date(req.endDate).getTime();
      if ((eventStart <= otherEnd) && (eventEnd >= otherStart)) {
        hasDateOverlap = true;
        dateOverlapWarning = `Event dates overlap with ${req.eventName} (${req.startDate} to ${req.endDate}). Flagged for mentor review.`;
        break;
      }
    }

    // Retrieve attendance & calculate live eligibility snapshot
    const attendance = this.getAttendanceForStudent(data.student.rollNumber);
    const eligibility = this.calculateEligibility(data.student, attendance);

    const requestId = `REQ-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newRequest: EventRequestHandoff = {
      requestId,
      eventId: event.id,
      studentId: data.student.id,
      rollNumber: data.student.rollNumber,
      studentName: data.student.name,
      studentDepartment: data.student.department,
      studentYear: data.student.academicYear,
      studentSection: data.student.section,
      assignedProctorId: data.student.assignedProctorId,
      assignedProctorName: data.student.assignedProctorName,
      eventName: event.title,
      eventCategory: event.category,
      eventDate: event.startDate === event.endDate ? event.startDate : `${event.startDate} to ${event.endDate}`,
      startDate: event.startDate,
      endDate: event.endDate,
      venue: event.venue,
      city: event.city,
      organizer: event.organizer,
      purpose: data.purpose,
      expectedBenefits: data.expectedBenefits,
      externalRegistrationEvidence: data.externalRegistrationEvidence,
      externalRegistrationConfirmed: data.externalRegistrationConfirmed,
      supportingDocuments: data.supportingDocuments,
      status: 'Under Proctor Review',
      eligibility,
      verificationStatus: eligibility.hasVerificationBlocker ? 'Under Review' : 'Not Required',
      hasDateOverlap,
      dateOverlapWarning,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.db.requests.unshift(newRequest);
    this.persist();

    this.logAudit({
      actorId: data.student.id,
      actorName: data.student.name,
      actorRole: 'student',
      action: 'EVENT_REQUEST_SUBMITTED',
      entityType: 'request',
      entityId: requestId,
      details: `Student ${data.student.name} (${data.student.rollNumber}) submitted institutional request for "${event.title}". Attendance: ${eligibility.calculatedPercentage ?? 'Unavailable'}%.`,
    });

    this.addNotification({
      title: 'New Permission Request Submitted',
      message: `${data.student.name} (${data.student.rollNumber}) requested clearance for ${event.title}. Awaiting mentor verification.`,
      category: 'request',
      recipientProctorId: data.student.assignedProctorId,
    });

    return { request: newRequest };
  }

  public updateProctorRecommendation(
    requestId: string,
    recommendation: 'Recommended' | 'Rejected' | 'Needs Clarification',
    remarks: string,
    proctorName: string
  ): boolean {
    const req = this.db.requests.find(r => r.requestId === requestId);
    if (!req) return false;

    const now = new Date().toISOString();
    req.proctorRecommendation = recommendation;
    req.proctorRemarks = remarks;
    req.proctorReviewedAt = now;
    req.proctorReviewerName = proctorName;

    if (recommendation === 'Recommended') {
      req.status = 'Pending Final Decision';
    } else if (recommendation === 'Rejected') {
      req.status = 'Recommended for Rejection';
    } else {
      req.status = 'Returned for Correction';
    }

    req.updatedAt = now;
    this.persist();

    this.logAudit({
      actorId: req.assignedProctorId,
      actorName: proctorName,
      actorRole: 'proctor',
      action: 'PROCTOR_RECOMMENDATION_SUBMITTED',
      entityType: 'request',
      entityId: requestId,
      details: `Proctor ${proctorName} reviewed request ${requestId}: Recommendation = "${recommendation}". Remarks: "${remarks}".`,
    });

    this.addNotification({
      title: `Proctor Endorsement: ${recommendation}`,
      message: `${proctorName} marked your request for "${req.eventName}" as ${recommendation}. Remarks: ${remarks}`,
      category: 'proctor',
      recipientStudentRoll: req.rollNumber,
    });

    return true;
  }

  public updateTechnicalInchargeDecision(
    requestId: string,
    decision: 'Approved' | 'Rejected' | 'Returned for Correction',
    remarks: string,
    inchargeName: string,
    authorizedOverride: boolean = false,
    overrideReason?: string
  ): boolean {
    const req = this.db.requests.find(r => r.requestId === requestId);
    if (!req) return false;

    const now = new Date().toISOString();
    req.technicalInchargeDecision = (decision === 'Returned for Correction' ? 'Pending' : decision) as any;
    req.technicalInchargeRemarks = remarks;
    req.technicalInchargeDecidedAt = now;
    req.technicalInchargeDecisionMakerName = inchargeName;
    req.authorizedOverride = authorizedOverride;
    req.overrideReason = overrideReason;

    if (decision === 'Approved') {
      req.status = 'Approved';
      req.approvalReferenceNumber = `APV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    } else if (decision === 'Rejected') {
      req.status = 'Rejected';
    } else {
      req.status = 'Returned for Correction';
    }

    req.updatedAt = now;
    this.persist();

    this.logAudit({
      actorId: 'TECH-HEAD-01',
      actorName: inchargeName,
      actorRole: 'technical_incharge',
      action: 'FINAL_EVENT_DECISION',
      entityType: 'request',
      entityId: requestId,
      details: `Technical In-Charge ${inchargeName} executed final decision: ${decision} for ${req.studentName}. Ref: ${req.approvalReferenceNumber || 'N/A'}. ${authorizedOverride ? `[OVERRIDE: ${overrideReason}]` : ''}`,
    });

    this.addNotification({
      title: `Event Sanction: ${decision}`,
      message: `Your participation in "${req.eventName}" has been officially ${decision} by ${inchargeName}.${req.approvalReferenceNumber ? ` Pass Ref: ${req.approvalReferenceNumber}` : ''}`,
      category: 'request',
      recipientStudentRoll: req.rollNumber,
    });

    return true;
  }

  public withdrawEventRequest(requestId: string, studentName: string): boolean {
    const req = this.db.requests.find(r => r.requestId === requestId);
    if (req && (req.status === 'Draft' || req.status === 'Submitted' || req.status === 'Under Proctor Review' || req.status === 'Returned for Correction')) {
      req.status = 'Withdrawn';
      req.updatedAt = new Date().toISOString();
      this.persist();

      this.logAudit({
        actorId: req.studentId,
        actorName: studentName,
        actorRole: 'student',
        action: 'EVENT_REQUEST_WITHDRAWN',
        entityType: 'request',
        entityId: requestId,
        details: `Student ${studentName} withdrew event request ${requestId} for "${req.eventName}".`,
      });
      return true;
    }
    return false;
  }

  // --- IMPORT BATCHES ---
  public getImportBatches(): AttendanceImportBatch[] {
    return this.db.importBatches;
  }

  public commitImportBatch(
    fileName: string,
    validRows: AttendanceImportRow[],
    uploader: string,
    uploaderRole: UserRole = 'technical_incharge'
  ): { batchId: string; importedCount: number } {
    const batchId = `BATCH-${Date.now()}`;
    const nowIso = new Date().toISOString();
    let importedCount = 0;

    for (const row of validRows) {
      if (!row.isEligibleForImport) continue;

      let student = this.db.students.find(s => s.rollNumber.toLowerCase() === row.rollNumber.toLowerCase());

      if (!student && row.studentName) {
        student = {
          id: `STU-GEN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          rollNumber: row.rollNumber,
          name: row.studentName,
          email: row.universityEmail || `${row.rollNumber.toLowerCase()}@campus.edu`,
          department: row.department || 'Engineering',
          branch: row.branch || 'B.Tech General',
          academicYear: row.academicYear || 1,
          semester: row.semester || 1,
          section: row.section || 'A',
          admissionBatch: row.admissionBatch || '2024-2028',
          graduationYear: row.graduationYear || 2028,
          assignedProctorId: 'PROC-01',
          assignedProctorName: 'Dr. Ramesh Kumar (CSE)',
          status: 'active',
          cgpa: row.cgpa,
          backlogCount: row.backlogCount,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        this.db.students.push(student);
      }

      if (row.classesConducted !== undefined && row.classesAttended !== undefined) {
        const calculatedPercentage = row.classesConducted > 0
          ? Number(((row.classesAttended / row.classesConducted) * 100).toFixed(2))
          : null;

        const existingAttIdx = this.db.attendance.findIndex(a => a.rollNumber.toLowerCase() === row.rollNumber.toLowerCase());

        const newRecord: AttendanceRecord = {
          id: existingAttIdx >= 0 ? this.db.attendance[existingAttIdx].id : `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          studentId: student ? student.id : `STU-UNLINKED-${row.rollNumber}`,
          rollNumber: row.rollNumber,
          classesConducted: row.classesConducted,
          classesAttended: row.classesAttended,
          calculatedPercentage,
          suppliedPercentage: row.suppliedPercentage ?? null,
          dataAsOf: row.dataAsOf || nowIso.split('T')[0],
          importBatchId: batchId,
          source: 'import',
          isFresh: true,
          createdAt: existingAttIdx >= 0 ? this.db.attendance[existingAttIdx].createdAt : nowIso,
          updatedAt: nowIso,
        };

        if (existingAttIdx >= 0) {
          this.db.attendance[existingAttIdx] = newRecord;
        } else {
          this.db.attendance.push(newRecord);
        }

        importedCount++;
      }
    }

    // Refresh active requests
    this.db.requests.forEach(req => {
      const matchingStudent = this.db.students.find(s => s.id === req.studentId);
      const matchingAtt = this.db.attendance.find(a => a.rollNumber.toLowerCase() === req.rollNumber.toLowerCase());
      if (matchingStudent) {
        req.eligibility = this.calculateEligibility(matchingStudent, matchingAtt);
      }
    });

    const newBatch: AttendanceImportBatch = {
      id: batchId,
      fileName,
      totalRows: validRows.length,
      validRows: validRows.length,
      invalidRows: 0,
      duplicateRows: 0,
      warningRows: 0,
      importedRows: importedCount,
      uploadedBy: uploader,
      status: 'completed',
      createdAt: nowIso,
      notes: `Imported by ${uploader} (${uploaderRole}) via safe validation pipeline.`,
    };

    this.db.importBatches.unshift(newBatch);
    this.persist();

    this.logAudit({
      actorId: 'CURRENT_USER',
      actorName: uploader,
      actorRole: uploaderRole,
      action: 'ATTENDANCE_IMPORT_COMMITTED',
      entityType: 'import',
      entityId: batchId,
      details: `Committed batch ${batchId} from file "${fileName}". Successfully imported ${importedCount} records into master attendance database.`,
    });

    return { batchId, importedCount };
  }

  // --- AUDIT LOGS & NOTIFICATIONS ---
  public getAuditLogs(): AuditLogEntry[] {
    return this.db.auditLogs;
  }

  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.db.auditLogs.unshift(newEntry);
    this.db.auditLogs = this.db.auditLogs.slice(0, 300);
    this.persist();
  }

  public getNotifications(): NotificationItem[] {
    return this.db.notifications;
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>): void {
    this.db.notifications.unshift({
      ...item,
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    });
    this.db.notifications = this.db.notifications.slice(0, 50);
    this.persist();
  }

  public markNotificationAsRead(id: string): void {
    const n = this.db.notifications.find(i => i.id === id);
    if (n) {
      n.isRead = true;
      this.persist();
    }
  }

  public resetToFactoryDemo(): void {
    this.db = {
      students: JSON.parse(JSON.stringify(INITIAL_STUDENTS)),
      attendance: JSON.parse(JSON.stringify(INITIAL_ATTENDANCE)),
      events: JSON.parse(JSON.stringify(INITIAL_EVENTS)),
      requests: JSON.parse(JSON.stringify(INITIAL_EVENT_HANDOFFS)),
      verifications: JSON.parse(JSON.stringify(INITIAL_VERIFICATION_CASES)),
      importBatches: [],
      auditLogs: [],
      notifications: [],
      config: { ...DEFAULT_CONFIG },
    };
    this.persist();
  }
}

export const serverDataStore = ServerDataStore.getInstance();
