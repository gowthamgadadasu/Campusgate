import express, { Request, Response } from 'express';
import cors from 'cors';
import { serverDataStore } from './dataStore';
import { EventListing, EventStatus, UserRole } from '../types';

export const app = express();

app.use(cors());
app.use(express.json());

// Helper to extract actor from headers or request body
function getActor(req: Request) {
  const role = (req.headers['x-user-role'] as UserRole) || 'student';
  const id = (req.headers['x-user-id'] as string) || 'ANON';
  const name = (req.headers['x-user-name'] as string) || (role === 'technical_incharge' ? 'Prof. Ananthakrishnan' : role === 'proctor' ? 'Dr. Ramesh Kumar' : 'Student');
  return { role, id, name };
}

// -------------------------------------------------------------
// 1. HEALTH & METRICS
// -------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    service: 'CampusGate Unified Backend & Approval Workflow Engine',
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// 2. AUTHENTICATION CONTEXT
// -------------------------------------------------------------
app.get('/api/auth/me', (req: Request, res: Response) => {
  const actor = getActor(req);
  if (actor.role === 'student') {
    const student = serverDataStore.getStudentById(actor.id) || serverDataStore.getStudents()[0];
    const attendance = serverDataStore.getAttendanceForStudent(student.rollNumber);
    const eligibility = serverDataStore.calculateEligibility(student, attendance);
    res.json({
      user: actor,
      profile: student,
      attendance,
      eligibility,
    });
    return;
  }
  res.json({
    user: actor,
    profile: null,
  });
});

// -------------------------------------------------------------
// 3. EVENTS MANAGEMENT
// -------------------------------------------------------------
app.get('/api/events', (req: Request, res: Response) => {
  const { status, category, search, role } = req.query;
  let events = serverDataStore.getEvents();

  // If queried by student role, restrict strictly to published events unless explicit
  const effectiveRole = role || req.headers['x-user-role'];
  if (effectiveRole === 'student' && !status) {
    events = events.filter(e => e.status === 'Published');
  } else if (status) {
    events = events.filter(e => e.status.toLowerCase() === (status as string).toLowerCase());
  }

  if (category && category !== 'all') {
    events = events.filter(e => e.category === category);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    events = events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q)
    );
  }

  res.json(events);
});

app.get('/api/events/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const event = serverDataStore.getEventById(id);
  if (!event) {
    res.status(404).json({ error: `Event with ID "${id}" not found.` });
    return;
  }
  res.json(event);
});

app.post('/api/events', (req: Request, res: Response) => {
  const actor = getActor(req);
  const data = req.body as Partial<EventListing>;

  if (!data.title || !data.category || !data.startDate || !data.endDate || !data.venue || !data.city || !data.organizer) {
    res.status(400).json({ error: 'Missing mandatory event fields (title, category, dates, venue, city, organizer).' });
    return;
  }

  const eventId = data.id || `EVT-${Date.now().toString().slice(-4)}`;
  const event: EventListing = {
    id: eventId,
    title: data.title,
    category: data.category,
    description: data.description || '',
    organizer: data.organizer,
    venue: data.venue,
    city: data.city,
    startDate: data.startDate,
    endDate: data.endDate,
    registrationDeadline: data.registrationDeadline || data.startDate,
    eligibilityCriteria: data.eligibilityCriteria || '75% Minimum Attendance & Active Academic Standing',
    requiredDocuments: typeof data.requiredDocuments === 'string' ? data.requiredDocuments : 'Institutional Permission Form',
    purposeAndBenefits: data.purposeAndBenefits || 'Skill development and institutional representation',
    externalRegistrationUrl: data.externalRegistrationUrl || (data as any).externalUrl,
    status: data.status || 'Published',
    createdBy: actor.name,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = serverDataStore.saveEvent(event, actor.name, actor.role);
  res.status(201).json(saved);
});

app.patch('/api/events/:id/status', (req: Request, res: Response) => {
  const actor = getActor(req);
  const id = String(req.params.id);
  const { status } = req.body;
  if (!status || !['Draft', 'Published', 'Closed', 'Cancelled'].includes(status)) {
    res.status(400).json({ error: 'Invalid or missing status parameter.' });
    return;
  }

  const success = serverDataStore.updateEventStatus(id, status as EventStatus, actor.name, actor.role);
  if (!success) {
    res.status(404).json({ error: `Event "${id}" not found.` });
    return;
  }

  res.json({ success: true, eventId: id, newStatus: status });
});

app.post('/api/events/:id/publish', (req: Request, res: Response) => {
  const actor = getActor(req);
  const id = String(req.params.id);
  const success = serverDataStore.updateEventStatus(id, 'Published', actor.name, actor.role);
  if (!success) {
    res.status(404).json({ error: `Event "${id}" not found.` });
    return;
  }
  res.json({ success: true, eventId: id, status: 'Published' });
});

// -------------------------------------------------------------
// 4. STUDENT PARTICIPATION REQUESTS
// -------------------------------------------------------------
app.get('/api/requests', (req: Request, res: Response) => {
  const { studentId, rollNumber, status, proctorId } = req.query;
  let requests = serverDataStore.getEventRequests();

  if (studentId) {
    requests = requests.filter(r => r.studentId === studentId);
  }
  if (rollNumber) {
    requests = requests.filter(r => r.rollNumber.toLowerCase() === (rollNumber as string).toLowerCase());
  }
  if (status) {
    requests = requests.filter(r => r.status.toLowerCase() === (status as string).toLowerCase());
  }
  if (proctorId) {
    requests = requests.filter(r => r.assignedProctorId === proctorId);
  }

  res.json(requests);
});

app.get('/api/requests/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const request = serverDataStore.getEventRequestById(id);
  if (!request) {
    res.status(404).json({ error: `Request with ID "${id}" not found.` });
    return;
  }
  res.json(request);
});

app.post('/api/requests', (req: Request, res: Response) => {
  const {
    eventId,
    studentId,
    purpose,
    expectedBenefits,
    externalRegistrationEvidence,
    externalRegistrationConfirmed,
    supportingDocuments,
  } = req.body;

  if (!eventId) {
    res.status(400).json({ error: 'Missing mandatory field: eventId.' });
    return;
  }

  // Always resolve student identity from persistent database record, NEVER trust client-forged name/roll
  const student = studentId
    ? serverDataStore.getStudentById(studentId)
    : serverDataStore.getStudents()[0];

  if (!student) {
    res.status(404).json({ error: 'Authenticated student profile could not be verified in the institutional database.' });
    return;
  }

  const result = serverDataStore.submitEventRequest({
    eventId,
    student,
    purpose: purpose || 'Institutional representation and technical skill development.',
    expectedBenefits: expectedBenefits || 'Academic enrichment and peer collaboration.',
    externalRegistrationEvidence,
    externalRegistrationConfirmed: Boolean(externalRegistrationConfirmed),
    supportingDocuments: Array.isArray(supportingDocuments) ? supportingDocuments : [],
  });

  if (result.error) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.status(201).json(result.request);
});

app.post('/api/requests/:id/withdraw', (req: Request, res: Response) => {
  const actor = getActor(req);
  const id = String(req.params.id);
  const success = serverDataStore.withdrawEventRequest(id, actor.name);
  if (!success) {
    res.status(400).json({ error: `Cannot withdraw request "${id}". Either it does not exist or has already passed review.` });
    return;
  }
  res.json({ success: true, message: `Request "${id}" successfully withdrawn.` });
});

// -------------------------------------------------------------
// 5. PROCTOR VERIFICATION & ENDORSEMENT
// -------------------------------------------------------------
app.get('/api/proctor/requests', (req: Request, res: Response) => {
  const actor = getActor(req);
  const proctorId = (req.query.proctorId as string) || actor.id;
  const allRequests = serverDataStore.getEventRequests();

  // Strict institutional partitioning: proctors only see their assigned cohort
  const assigned = allRequests.filter(r => r.assignedProctorId === proctorId);
  res.json(assigned);
});

app.post('/api/proctor/requests/:id/review', (req: Request, res: Response) => {
  const actor = getActor(req);
  const id = String(req.params.id);
  const { recommendation, remarks, proctorName } = req.body;

  if (!recommendation || !['Recommended', 'Rejected', 'Needs Clarification'].includes(recommendation)) {
    res.status(400).json({ error: 'Valid recommendation is required (Recommended, Rejected, Needs Clarification).' });
    return;
  }

  if (recommendation !== 'Recommended' && (!remarks || !remarks.trim())) {
    res.status(400).json({ error: 'Mandatory explanatory remarks required when recommending rejection or requesting clarification.' });
    return;
  }

  const reviewer = proctorName || actor.name || 'Assigned Proctor';
  const success = serverDataStore.updateProctorRecommendation(
    id,
    recommendation,
    remarks || 'Meets institutional criteria based on verified academic standing.',
    reviewer
  );

  if (!success) {
    res.status(404).json({ error: `Request "${id}" not found.` });
    return;
  }

  const updated = serverDataStore.getEventRequestById(id);
  res.json({
    success: true,
    message: `Proctor recommendation "${recommendation}" successfully recorded.`,
    request: updated,
  });
});

// -------------------------------------------------------------
// 6. TECHNICAL IN-CHARGE SANCTION & FINAL DECISION
// -------------------------------------------------------------
app.get('/api/incharge/requests', (_req: Request, res: Response) => {
  const requests = serverDataStore.getEventRequests();
  res.json(requests);
});

app.get('/api/incharge/requests/pending', (_req: Request, res: Response) => {
  const requests = serverDataStore.getEventRequests().filter(
    r => r.status === 'Pending Final Decision' || r.status === 'Under Proctor Review' || r.status === 'Recommended for Rejection'
  );
  res.json(requests);
});

app.post('/api/incharge/requests/:id/decision', (req: Request, res: Response) => {
  const actor = getActor(req);
  const id = String(req.params.id);
  const { decision, remarks, inchargeName, authorizedOverride, overrideReason } = req.body;

  if (!decision || !['Approved', 'Rejected', 'Returned for Correction'].includes(decision)) {
    res.status(400).json({ error: 'Valid decision is required (Approved, Rejected, Returned for Correction).' });
    return;
  }

  const decisionMaker = inchargeName || actor.name || 'Prof. Ananthakrishnan (Technical In-Charge)';
  const success = serverDataStore.updateTechnicalInchargeDecision(
    id,
    decision,
    remarks || (decision === 'Approved' ? 'Institutional approval granted. Formal participation pass sanctioned.' : 'Request rejected based on review.'),
    decisionMaker,
    Boolean(authorizedOverride),
    overrideReason
  );

  if (!success) {
    res.status(404).json({ error: `Request "${id}" not found.` });
    return;
  }

  const updated = serverDataStore.getEventRequestById(id);
  res.json({
    success: true,
    message: `Technical In-Charge decision "${decision}" executed. Reference: ${updated?.approvalReferenceNumber || 'N/A'}.`,
    request: updated,
  });
});

// -------------------------------------------------------------
// 7. ATTENDANCE & MEDIATOR INTELLIGENCE
// -------------------------------------------------------------
app.get('/api/students', (req: Request, res: Response) => {
  const { department, search, proctorId } = req.query;
  let students = serverDataStore.getStudents();

  if (department && department !== 'all') {
    students = students.filter(s => s.department === department);
  }
  if (proctorId) {
    students = students.filter(s => s.assignedProctorId === proctorId);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    students = students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }

  res.json(students);
});

app.get('/api/students/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const student = serverDataStore.getStudentById(id);
  if (!student) {
    res.status(404).json({ error: `Student with ID "${id}" not found.` });
    return;
  }
  const attendance = serverDataStore.getAttendanceForStudent(student.rollNumber);
  const eligibility = serverDataStore.calculateEligibility(student, attendance);
  res.json({ student, attendance, eligibility });
});

app.get('/api/attendance', (_req: Request, res: Response) => {
  res.json(serverDataStore.getAttendanceRecords());
});

app.get('/api/attendance/student/:rollNumber', (req: Request, res: Response) => {
  const rollNumber = String(req.params.rollNumber);
  const att = serverDataStore.getAttendanceForStudent(rollNumber);
  if (!att) {
    res.status(404).json({ error: `Attendance record for roll "${rollNumber}" not found.` });
    return;
  }
  res.json(att);
});

app.get('/api/attendance/eligibility/:studentId', (req: Request, res: Response) => {
  const studentId = String(req.params.studentId);
  const student = serverDataStore.getStudentById(studentId);
  if (!student) {
    res.status(404).json({ error: `Student "${studentId}" not found.` });
    return;
  }
  const att = serverDataStore.getAttendanceForStudent(student.rollNumber);
  const eligibility = serverDataStore.calculateEligibility(student, att);
  res.json(eligibility);
});

app.post('/api/attendance/import', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { fileName, validRows, uploader, uploaderRole } = req.body;

  if (!fileName || !Array.isArray(validRows) || validRows.length === 0) {
    res.status(400).json({ error: 'Valid fileName and non-empty validRows array required.' });
    return;
  }

  const result = serverDataStore.commitImportBatch(
    fileName,
    validRows,
    uploader || actor.name,
    uploaderRole || actor.role
  );

  res.status(201).json(result);
});

app.get('/api/attendance/batches', (_req: Request, res: Response) => {
  res.json(serverDataStore.getImportBatches());
});

// -------------------------------------------------------------
// 8. CONFIGURATION
// -------------------------------------------------------------
app.get('/api/config', (_req: Request, res: Response) => {
  res.json(serverDataStore.getConfig());
});

app.put('/api/config', (req: Request, res: Response) => {
  const actor = getActor(req);
  const updated = serverDataStore.updateConfig(req.body, actor.role);
  res.json(updated);
});

// -------------------------------------------------------------
// 9. AUDIT TRAILS & NOTIFICATIONS
// -------------------------------------------------------------
app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json(serverDataStore.getAuditLogs());
});

app.get('/api/notifications', (_req: Request, res: Response) => {
  res.json(serverDataStore.getNotifications());
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const id = String(req.params.id);
  serverDataStore.markNotificationAsRead(id);
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// 10. SYSTEM RESET (DEMO RECOVERY)
// -------------------------------------------------------------
app.post('/api/reset', (_req: Request, res: Response) => {
  serverDataStore.resetToFactoryDemo();
  res.json({ success: true, message: 'CampusGate database reset to factory demo state.' });
});

// Central error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('[CampusGate Server Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start listening if executed directly
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[CampusGate Server] REST API active on http://localhost:${PORT}`);
  });
}
