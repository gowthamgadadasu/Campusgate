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
  EventCategory,
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

// Local storage persistent keys
const KEYS = {
  STUDENTS: 'cg_students_v3',
  ATTENDANCE: 'cg_attendance_v3',
  VERIFICATIONS: 'cg_verifications_v3',
  CONFIG: 'cg_config_v3',
  BATCHES: 'cg_import_batches_v3',
  AUDIT_LOGS: 'cg_audit_logs_v3',
  EVENTS: 'cg_events_v3',
  EVENT_REQUESTS: 'cg_event_requests_v3',
  NOTIFICATIONS: 'cg_notifications_v3',
};

export const DEFAULT_CONFIG: SystemConfig = {
  minimumAttendanceThreshold: 75.0,
  freshnessThresholdDays: 30,
  enforceStrictVerification: true,
  academicPolicyRequirement: false,
};

class DataStoreService {
  private inMemoryFallback: Record<string, string> = {};

  private hasStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = this.hasStorage()
        ? window.localStorage.getItem(key)
        : this.inMemoryFallback[key];
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      if (this.hasStorage()) {
        window.localStorage.setItem(key, serialized);
      } else {
        this.inMemoryFallback[key] = serialized;
      }
    } catch (e) {
      console.error(`Failed to persist key ${key}:`, e);
    }
  }

  public init() {
    if (!this.get(KEYS.STUDENTS, null)) {
      this.set(KEYS.STUDENTS, INITIAL_STUDENTS);
    }
    if (!this.get(KEYS.ATTENDANCE, null)) {
      this.set(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    }
    if (!this.get(KEYS.EVENTS, null)) {
      this.set(KEYS.EVENTS, INITIAL_EVENTS);
    }
    if (!this.get(KEYS.VERIFICATIONS, null)) {
      this.set(KEYS.VERIFICATIONS, INITIAL_VERIFICATION_CASES);
    }
    if (!this.get(KEYS.EVENT_REQUESTS, null)) {
      // Map initial event handoffs with eventId if missing
      const mappedHandoffs: EventRequestHandoff[] = INITIAL_EVENT_HANDOFFS.map((h, i) => ({
        ...h,
        eventId: h.eventId || (INITIAL_EVENTS[i % INITIAL_EVENTS.length]?.id || 'EVT-001'),
        studentDepartment: h.studentDepartment || 'Computer Science & Engineering',
        studentYear: h.studentYear || 3,
        studentSection: h.studentSection || 'A',
        assignedProctorId: h.assignedProctorId || 'PROC-01',
        assignedProctorName: h.assignedProctorName || 'Dr. Ramesh Kumar (CSE)',
        startDate: h.startDate || h.eventDate,
        endDate: h.endDate || h.eventDate,
        venue: h.venue || 'IIT Technology Complex',
        city: h.city || 'National Host City',
        organizer: h.organizer || 'Academic & Technical Consortium',
        purpose: h.purpose || 'Institutional representation in technical tournament and algorithm development.',
        expectedBenefits: h.expectedBenefits || 'National hackathon placement and accredited project credits.',
        externalRegistrationConfirmed: h.externalRegistrationConfirmed ?? true,
        status: (h.status as RequestStatus) || (h.technicalInchargeDecision === 'Approved' ? 'Approved' : h.proctorRecommendation === 'Recommended' ? 'Pending Final Decision' : 'Under Proctor Review'),
      }));
      this.set(KEYS.EVENT_REQUESTS, mappedHandoffs);
    }
    if (!this.get(KEYS.CONFIG, null)) {
      this.set(KEYS.CONFIG, DEFAULT_CONFIG);
    }
    if (!this.get(KEYS.BATCHES, null)) {
      this.set(KEYS.BATCHES, [
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
      ]);
    }
    if (!this.get(KEYS.AUDIT_LOGS, null)) {
      this.set(KEYS.AUDIT_LOGS, [
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
        {
          id: 'AUD-002',
          actorId: 'TECH-HEAD-01',
          actorName: 'Prof. Ananthakrishnan',
          actorRole: 'technical_incharge',
          action: 'EVENT_PUBLISHED',
          entityType: 'event',
          entityId: 'EVT-001',
          details: 'Published event listing: Smart India Hackathon 2026 Grand Finale',
          timestamp: '2026-10-01T09:00:00Z',
        },
      ]);
    }
    if (!this.get(KEYS.NOTIFICATIONS, null)) {
      this.set(KEYS.NOTIFICATIONS, [
        {
          id: 'NOTIF-001',
          title: 'CampusGate System Active',
          message: 'Student Data Intelligence & Verification Hub loaded successfully.',
          category: 'event',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ]);
    }
  }

  // --- CONFIGURATION ---
  public getConfig(): SystemConfig {
    return this.get<SystemConfig>(KEYS.CONFIG, DEFAULT_CONFIG);
  }

  public updateConfig(config: Partial<SystemConfig>, actorRole: UserRole = 'admin'): SystemConfig {
    const current = this.getConfig();
    const updated = { ...current, ...config };
    this.set(KEYS.CONFIG, updated);
    this.logAudit({
      actorId: 'CURRENT_USER',
      actorName: 'System User',
      actorRole,
      action: 'CONFIG_UPDATED',
      entityType: 'config',
      entityId: 'SYSTEM_SETTINGS',
      details: `Threshold updated to ${updated.minimumAttendanceThreshold}%, freshness to ${updated.freshnessThresholdDays} days.`,
    });
    return updated;
  }

  // --- STUDENTS ---
  public getStudents(): Student[] {
    return this.get<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  public getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.id === id || s.rollNumber.toLowerCase() === id.toLowerCase());
  }

  public saveStudent(student: Student, actorRole: UserRole = 'admin'): Student {
    const list = this.getStudents();
    const existingIndex = list.findIndex(s => s.id === student.id || s.rollNumber.toLowerCase() === student.rollNumber.toLowerCase());
    
    if (existingIndex >= 0) {
      list[existingIndex] = { ...student, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...student, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.set(KEYS.STUDENTS, list);
    
    this.logAudit({
      actorId: 'CURRENT_USER',
      actorName: 'Administrative Coordinator',
      actorRole,
      action: existingIndex >= 0 ? 'STUDENT_UPDATED' : 'STUDENT_CREATED',
      entityType: 'student',
      entityId: student.id,
      details: `Saved student master profile for ${student.name} (${student.rollNumber}).`,
    });
    
    return student;
  }

  // --- ATTENDANCE ---
  public getAttendanceRecords(): AttendanceRecord[] {
    return this.get<AttendanceRecord[]>(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  }

  public getAttendanceForStudent(rollNumber: string): AttendanceRecord | undefined {
    return this.getAttendanceRecords().find(a => a.rollNumber.toLowerCase() === rollNumber.toLowerCase());
  }

  // --- ELIGIBILITY ENGINE ---
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

    const activeVerifications = this.getVerificationCases().filter(
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

  // --- EVENTS MANAGEMENT (TECHNICAL IN-CHARGE) ---
  public getEvents(): EventListing[] {
    return this.get<EventListing[]>(KEYS.EVENTS, INITIAL_EVENTS);
  }

  public getEventById(id: string): EventListing | undefined {
    return this.getEvents().find(e => e.id === id);
  }

  public saveEvent(event: EventListing, authorName: string, authorRole: UserRole = 'technical_incharge'): EventListing {
    const list = this.getEvents();
    const existingIndex = list.findIndex(e => e.id === event.id);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      list[existingIndex] = { ...event, updatedAt: now };
    } else {
      list.unshift({ ...event, createdAt: now, updatedAt: now });
    }
    this.set(KEYS.EVENTS, list);

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

  public updateEventStatus(eventId: string, newStatus: EventStatus, authorName: string, authorRole: UserRole): void {
    const list = this.getEvents();
    const event = list.find(e => e.id === eventId);
    if (event) {
      event.status = newStatus;
      event.updatedAt = new Date().toISOString();
      this.set(KEYS.EVENTS, list);

      this.logAudit({
        actorId: 'CURRENT_USER',
        actorName: authorName,
        actorRole: authorRole,
        action: 'EVENT_STATUS_CHANGED',
        entityType: 'event',
        entityId: eventId,
        details: `Event "${event.title}" status changed to ${newStatus}.`,
      });
    }
  }

  // --- EVENT PARTICIPATION REQUESTS (END-TO-END WORKFLOW) ---
  public getEventRequests(): EventRequestHandoff[] {
    return this.get<EventRequestHandoff[]>(KEYS.EVENT_REQUESTS, INITIAL_EVENT_HANDOFFS);
  }

  public getEventRequestById(requestId: string): EventRequestHandoff | undefined {
    return this.getEventRequests().find(r => r.requestId === requestId);
  }

  public submitEventRequest(
    data: {
      eventId: string;
      student: Student;
      purpose: string;
      expectedBenefits: string;
      externalRegistrationEvidence?: string;
      externalRegistrationConfirmed: boolean;
      supportingDocuments: Array<{ name: string; url: string }>;
    }
  ): { request: EventRequestHandoff; error?: string } {
    const event = this.getEventById(data.eventId);
    if (!event) return { request: null as any, error: 'Event not found.' };

    const existingRequests = this.getEventRequests();
    
    // Check duplicate active request
    const existingActive = existingRequests.find(
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

    // Check date overlaps with other active requests
    const now = new Date();
    const eventStart = new Date(event.startDate).getTime();
    const eventEnd = new Date(event.endDate).getTime();

    let hasDateOverlap = false;
    let dateOverlapWarning = '';

    const otherApprovedOrPending = existingRequests.filter(
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

    // Retrieve attendance & calculate live eligibility
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

    existingRequests.unshift(newRequest);
    this.set(KEYS.EVENT_REQUESTS, existingRequests);

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
  ): void {
    const list = this.getEventRequests();
    const req = list.find(r => r.requestId === requestId);
    if (!req) return;

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
    this.set(KEYS.EVENT_REQUESTS, list);

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
  }

  public updateTechnicalInchargeDecision(
    requestId: string,
    decision: 'Approved' | 'Rejected' | 'Returned for Correction',
    remarks: string,
    inchargeName: string,
    authorizedOverride: boolean = false,
    overrideReason?: string
  ): void {
    const list = this.getEventRequests();
    const req = list.find(r => r.requestId === requestId);
    if (!req) return;

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
    this.set(KEYS.EVENT_REQUESTS, list);

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
  }

  public withdrawEventRequest(requestId: string, studentName: string): boolean {
    const list = this.getEventRequests();
    const req = list.find(r => r.requestId === requestId);
    if (req && (req.status === 'Draft' || req.status === 'Submitted' || req.status === 'Under Proctor Review' || req.status === 'Returned for Correction')) {
      req.status = 'Withdrawn';
      req.updatedAt = new Date().toISOString();
      this.set(KEYS.EVENT_REQUESTS, list);

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

  // --- IMPORT BATCHES & SAFE COMMIT ---
  public getImportBatches(): AttendanceImportBatch[] {
    return this.get<AttendanceImportBatch[]>(KEYS.BATCHES, []);
  }

  public commitImportBatch(
    fileName: string,
    validRows: AttendanceImportRow[],
    uploader: string,
    uploaderRole: UserRole = 'technical_incharge'
  ): { batchId: string; importedCount: number } {
    const batchId = `BATCH-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const students = this.getStudents();
    const attendanceRecords = this.getAttendanceRecords();

    let importedCount = 0;

    for (const row of validRows) {
      if (!row.isEligibleForImport) continue;

      let student = students.find(s => s.rollNumber.toLowerCase() === row.rollNumber.toLowerCase());

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
        students.push(student);
      }

      if (row.classesConducted !== undefined && row.classesAttended !== undefined) {
        const calculatedPercentage = row.classesConducted > 0 
          ? Number(((row.classesAttended / row.classesConducted) * 100).toFixed(2))
          : null;

        const existingAttIdx = attendanceRecords.findIndex(a => a.rollNumber.toLowerCase() === row.rollNumber.toLowerCase());
        
        const newRecord: AttendanceRecord = {
          id: existingAttIdx >= 0 ? attendanceRecords[existingAttIdx].id : `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
          createdAt: existingAttIdx >= 0 ? attendanceRecords[existingAttIdx].createdAt : nowIso,
          updatedAt: nowIso,
        };

        if (existingAttIdx >= 0) {
          attendanceRecords[existingAttIdx] = newRecord;
        } else {
          attendanceRecords.push(newRecord);
        }

        importedCount++;
      }
    }

    this.set(KEYS.STUDENTS, students);
    this.set(KEYS.ATTENDANCE, attendanceRecords);

    // Sync newly imported attendance with any active event requests
    const eventRequests = this.getEventRequests();
    let updatedRequests = false;
    eventRequests.forEach(req => {
      const matchingStudent = students.find(s => s.id === req.studentId);
      const matchingAtt = attendanceRecords.find(a => a.rollNumber.toLowerCase() === req.rollNumber.toLowerCase());
      if (matchingStudent) {
        req.eligibility = this.calculateEligibility(matchingStudent, matchingAtt);
        updatedRequests = true;
      }
    });
    if (updatedRequests) {
      this.set(KEYS.EVENT_REQUESTS, eventRequests);
    }

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

    const batches = this.getImportBatches();
    batches.unshift(newBatch);
    this.set(KEYS.BATCHES, batches);

    this.logAudit({
      actorId: 'CURRENT_USER',
      actorName: uploader,
      actorRole: uploaderRole,
      action: 'ATTENDANCE_IMPORT_COMMITTED',
      entityType: 'import',
      entityId: batchId,
      details: `Committed batch ${batchId} from file "${fileName}". Successfully imported ${importedCount} records into master attendance database.`,
    });

    this.addNotification({
      title: 'Attendance Import Succeeded',
      message: `${importedCount} records successfully imported from ${fileName}.`,
      category: 'import',
      link: 'import',
    });

    return { batchId, importedCount };
  }

  // --- VERIFICATION CASES ---
  public getVerificationCases(): VerificationCase[] {
    return this.get<VerificationCase[]>(KEYS.VERIFICATIONS, INITIAL_VERIFICATION_CASES);
  }

  public saveVerificationCase(item: VerificationCase, actorRole: UserRole = 'verifier'): VerificationCase {
    const list = this.getVerificationCases();
    const idx = list.findIndex(v => v.id === item.id);
    if (idx >= 0) {
      list[idx] = { ...item, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.set(KEYS.VERIFICATIONS, list);

    this.logAudit({
      actorId: 'CURRENT_USER',
      actorName: 'Authorized Verifier',
      actorRole,
      action: idx >= 0 ? 'VERIFICATION_UPDATED' : 'VERIFICATION_CREATED',
      entityType: 'verification',
      entityId: item.id,
      details: `Case ${item.id} status set to "${item.status}" for ${item.studentName} (${item.rollNumber}). Remarks: ${item.reviewerRemarks || 'None'}`,
    });

    return item;
  }

  public addVerificationComment(caseId: string, authorName: string, authorRole: UserRole, text: string): void {
    const list = this.getVerificationCases();
    const c = list.find(v => v.id === caseId);
    if (c) {
      const newComment = {
        id: `COMM-${Date.now()}`,
        verificationCaseId: caseId,
        authorId: 'CURRENT_USER',
        authorName,
        authorRole,
        text,
        createdAt: new Date().toISOString(),
      };
      c.comments = [...(c.comments || []), newComment];
      c.updatedAt = new Date().toISOString();
      this.set(KEYS.VERIFICATIONS, list);

      this.logAudit({
        actorId: 'CURRENT_USER',
        actorName: authorName,
        actorRole: authorRole,
        action: 'VERIFICATION_COMMENT_ADDED',
        entityType: 'verification',
        entityId: caseId,
        details: `Note added to ${caseId}: "${text.slice(0, 50)}..."`,
      });
    }
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLogEntry[] {
    return this.get<AuditLogEntry[]>(KEYS.AUDIT_LOGS, []);
  }

  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const list = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    list.unshift(newEntry);
    this.set(KEYS.AUDIT_LOGS, list.slice(0, 300));
  }

  // --- NOTIFICATIONS ---
  public getNotifications(): NotificationItem[] {
    return this.get<NotificationItem[]>(KEYS.NOTIFICATIONS, []);
  }

  public addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>): void {
    const list = this.getNotifications();
    list.unshift({
      ...item,
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    });
    this.set(KEYS.NOTIFICATIONS, list.slice(0, 50));
  }

  public markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const n = list.find(i => i.id === id);
    if (n) {
      n.isRead = true;
      this.set(KEYS.NOTIFICATIONS, list);
    }
  }

  // --- FACTORY RESET ---
  public resetToFactoryDemo(): void {
    this.set(KEYS.STUDENTS, INITIAL_STUDENTS);
    this.set(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
    this.set(KEYS.EVENTS, INITIAL_EVENTS);
    this.set(KEYS.VERIFICATIONS, INITIAL_VERIFICATION_CASES);
    this.set(KEYS.EVENT_REQUESTS, INITIAL_EVENT_HANDOFFS);
    this.set(KEYS.CONFIG, DEFAULT_CONFIG);
  }
}

export const dataStore = new DataStoreService();
dataStore.init();
