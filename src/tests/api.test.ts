import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { serverDataStore } from '../server/dataStore';

describe('CampusGate REST API & Multi-Stage Approval Workflow', () => {
  beforeEach(() => {
    // Reset dataStore to a clean state before each test suite execution
    serverDataStore.resetToFactoryDemo();
  });

  describe('1. Health & Identity Endpoints', () => {
    it('GET /api/health returns 200 and server status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toContain('CampusGate Unified Backend');
    });

    it('GET /api/auth/me returns authenticated student context with live eligibility', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('x-user-role', 'student')
        .set('x-user-id', 'STU-001');

      expect(res.status).toBe(200);
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.rollNumber).toBe('22CS0101');
      expect(res.body.eligibility).toBeDefined();
      expect(res.body.eligibility.calculatedPercentage).toBe(90);
      expect(res.body.eligibility.status).toBe('Eligible');
    });
  });

  describe('2. Event Management (Technical In-Charge Lifecycle)', () => {
    it('GET /api/events returns only Published events for student role', async () => {
      const res = await request(app)
        .get('/api/events')
        .set('x-user-role', 'student');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((e: any) => {
        expect(e.status).toBe('Published');
      });
    });

    it('POST /api/events creates a new event listing', async () => {
      const newEvent = {
        title: 'National AI & Robotics Hackathon 2026',
        category: 'Hackathon',
        organizer: 'IIT Delhi & AICTE',
        venue: 'Technology Exhibition Complex',
        city: 'New Delhi',
        startDate: '2026-11-20',
        endDate: '2026-11-22',
        registrationDeadline: '2026-11-10',
        minimumAttendanceThreshold: 75,
        status: 'Draft',
      };

      const res = await request(app)
        .post('/api/events')
        .set('x-user-role', 'technical_incharge')
        .set('x-user-name', 'Prof. Ananthakrishnan')
        .send(newEvent);

      if (res.status !== 201) {
        console.error('DEBUG POST /api/events:', res.status, res.body);
      }

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe(newEvent.title);
      expect(res.body.status).toBe('Draft');
    });

    it('PATCH /api/events/:id/status updates status and POST /publish publishes the event', async () => {
      // 1. Create a draft event
      const createRes = await request(app)
        .post('/api/events')
        .send({
          title: 'Quantum Coding Contest',
          category: 'Coding Contest',
          organizer: 'IISc Bangalore',
          venue: 'Auditorium A',
          city: 'Bengaluru',
          startDate: '2026-12-01',
          endDate: '2026-12-02',
          status: 'Draft',
        });
      const eventId = createRes.body.id;

      // 2. Publish it
      const pubRes = await request(app).post(`/api/events/${eventId}/publish`);
      expect(pubRes.status).toBe(200);
      expect(pubRes.body.status).toBe('Published');

      // 3. Verify event is now visible to student
      const getRes = await request(app).get(`/api/events/${eventId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.status).toBe('Published');
    });
  });

  describe('3. Student Permission Request Submission & Attendance Evaluation', () => {
    it('POST /api/requests creates request with automatic attendance & eligibility snapshot', async () => {
      const student = serverDataStore.getStudents().find(s => s.rollNumber === '22CS0101')!;

      const reqBody = {
        eventId: 'EVT-005',
        studentId: student.id,
        purpose: 'Institutional representation in AI project competition.',
        expectedBenefits: 'Hands-on practical system architecture experience.',
        externalRegistrationConfirmed: true,
        supportingDocuments: [{ name: 'confirmation_ticket.pdf', url: 'https://storage/ticket.pdf' }],
      };

      const res = await request(app)
        .post('/api/requests')
        .set('x-user-role', 'student')
        .send(reqBody);

      expect(res.status).toBe(201);
      expect(res.body.requestId).toMatch(/^REQ-2026-\d+/);
      expect(res.body.status).toBe('Under Proctor Review');
      expect(res.body.assignedProctorId).toBe(student.assignedProctorId);
      // Attendance snapshot from mediator
      expect(res.body.eligibility).toBeDefined();
      expect(res.body.eligibility.calculatedPercentage).toBe(90);
      expect(res.body.eligibility.status).toBe('Eligible');
    });

    it('POST /api/requests prevents duplicate active requests for the same event', async () => {
      const student = serverDataStore.getStudents().find(s => s.rollNumber === '22CS0101')!;

      const reqBody = {
        eventId: 'EVT-002',
        studentId: student.id,
        purpose: 'First application',
        expectedBenefits: 'Gain experience',
        externalRegistrationConfirmed: true,
      };

      // First submission succeeds
      const firstRes = await request(app).post('/api/requests').send(reqBody);
      expect(firstRes.status).toBe(201);

      // Second submission for the same event is rejected
      const secondRes = await request(app).post('/api/requests').send(reqBody);
      expect(secondRes.status).toBe(400);
      expect(secondRes.body.error).toContain('already exists for this event');
    });

    it('POST /api/requests detects overlapping event dates and sets warning flag', async () => {
      const student = serverDataStore.getStudents().find(s => s.rollNumber === '22CS0101')!;

      // Create two events that share the same dates
      const ev1Res = await request(app).post('/api/events').send({
        title: 'Conflict Event 1',
        category: 'Hackathon',
        organizer: 'Org 1',
        venue: 'Hall 1',
        city: 'Pune',
        startDate: '2026-11-15',
        endDate: '2026-11-17',
        status: 'Published',
      });

      const ev2Res = await request(app).post('/api/events').send({
        title: 'Conflict Event 2',
        category: 'Conference',
        organizer: 'Org 2',
        venue: 'Hall 2',
        city: 'Mumbai',
        startDate: '2026-11-16', // overlaps!
        endDate: '2026-11-18',
        status: 'Published',
      });

      // Submit first event request
      await request(app).post('/api/requests').send({
        eventId: ev1Res.body.id,
        studentId: student.id,
        purpose: 'Event 1 attendance',
        expectedBenefits: 'Learning',
        externalRegistrationConfirmed: true,
      });

      // Submit second event request with overlapping date
      const overlapRes = await request(app).post('/api/requests').send({
        eventId: ev2Res.body.id,
        studentId: student.id,
        purpose: 'Event 2 attendance',
        expectedBenefits: 'Learning',
        externalRegistrationConfirmed: true,
      });

      expect(overlapRes.status).toBe(201);
      expect(overlapRes.body.hasDateOverlap).toBe(true);
      expect(overlapRes.body.dateOverlapWarning).toContain('overlap');
    });

    it('POST /api/requests/:id/withdraw allows student to cancel their request', async () => {
      const student = serverDataStore.getStudents()[0];
      const createRes = await request(app).post('/api/requests').send({
        eventId: 'EVT-003',
        studentId: student.id,
        purpose: 'Will cancel later',
        expectedBenefits: 'None',
        externalRegistrationConfirmed: true,
      });

      const requestId = createRes.body.requestId;
      const withdrawRes = await request(app)
        .post(`/api/requests/${requestId}/withdraw`)
        .set('x-user-name', student.name);

      expect(withdrawRes.status).toBe(200);
      expect(withdrawRes.body.success).toBe(true);

      const checkRes = await request(app).get(`/api/requests/${requestId}`);
      expect(checkRes.body.status).toBe('Withdrawn');
    });
  });

  describe('4. Proctor Verification & Recommendation Review', () => {
    it('GET /api/proctor/requests returns only requests assigned to the proctor', async () => {
      const res = await request(app)
        .get('/api/proctor/requests?proctorId=PROC-01')
        .set('x-user-role', 'proctor');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((r: any) => {
        expect(r.assignedProctorId).toBe('PROC-01');
      });
    });

    it('POST /api/proctor/requests/:id/review advances status to "Pending Final Decision" on "Recommended"', async () => {
      const student = serverDataStore.getStudents().find(s => s.rollNumber === '22CS0101')!;
      const submitRes = await request(app).post('/api/requests').send({
        eventId: 'EVT-005',
        studentId: student.id,
        purpose: 'CTF Challenge representation',
        expectedBenefits: 'Win national trophy',
        externalRegistrationConfirmed: true,
      });
      const reqId = submitRes.body.requestId;

      const reviewRes = await request(app)
        .post(`/api/proctor/requests/${reqId}/review`)
        .set('x-user-role', 'proctor')
        .set('x-user-name', 'Dr. Ramesh Kumar (CSE)')
        .send({
          recommendation: 'Recommended',
          remarks: 'Student has 90% attendance and stellar academic records.',
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.request.status).toBe('Pending Final Decision');
      expect(reviewRes.body.request.proctorRecommendation).toBe('Recommended');
      expect(reviewRes.body.request.proctorReviewerName).toBe('Dr. Ramesh Kumar (CSE)');
    });

    it('POST /api/proctor/requests/:id/review requires explanatory remarks when returning for correction', async () => {
      const student = serverDataStore.getStudents().find(s => s.rollNumber === '22CS0101')!;
      const submitRes = await request(app).post('/api/requests').send({
        eventId: 'EVT-006',
        studentId: student.id,
        purpose: 'DRDO Visit',
        expectedBenefits: 'Research exposure',
        externalRegistrationConfirmed: true,
      });
      const reqId = submitRes.body.requestId;

      // Reject without remarks -> should fail 400
      const failRes = await request(app)
        .post(`/api/proctor/requests/${reqId}/review`)
        .send({
          recommendation: 'Needs Clarification',
          remarks: '',
        });
      expect(failRes.status).toBe(400);

      // Supply remarks -> should succeed and set status "Returned for Correction"
      const okRes = await request(app)
        .post(`/api/proctor/requests/${reqId}/review`)
        .send({
          recommendation: 'Needs Clarification',
          remarks: 'Please attach external registration payment invoice.',
        });
      expect(okRes.status).toBe(200);
      expect(okRes.body.request.status).toBe('Returned for Correction');
    });
  });

  describe('5. Technical Event In-Charge Final Sanction Decision', () => {
    it('POST /api/incharge/requests/:id/decision issues formal APV clearance pass on approval', async () => {
      const student = serverDataStore.getStudents().find(s => s.rollNumber === '22CS0101')!;
      const submitRes = await request(app).post('/api/requests').send({
        eventId: 'EVT-005',
        studentId: student.id,
        purpose: 'CTF Challenge Finalist',
        expectedBenefits: 'Win prize',
        externalRegistrationConfirmed: true,
      });
      const reqId = submitRes.body.requestId;

      // Proctor recommends
      await request(app).post(`/api/proctor/requests/${reqId}/review`).send({
        recommendation: 'Recommended',
        remarks: 'Approved by proctor.',
      });

      // In-Charge sanctions final approval
      const decisionRes = await request(app)
        .post(`/api/incharge/requests/${reqId}/decision`)
        .set('x-user-role', 'technical_incharge')
        .set('x-user-name', 'Prof. Ananthakrishnan')
        .send({
          decision: 'Approved',
          remarks: 'Institutional approval granted. Formal participation sanctioned.',
        });

      expect(decisionRes.status).toBe(200);
      expect(decisionRes.body.request.status).toBe('Approved');
      expect(decisionRes.body.request.approvalReferenceNumber).toMatch(/^APV-2026-\d+/);
      expect(decisionRes.body.request.technicalInchargeDecisionMakerName).toBe('Prof. Ananthakrishnan');
    });

    it('In-Charge can sanction with authorized override for low-attendance student', async () => {
      // Find a student with attendance below 75%
      const student = serverDataStore.getStudents().find(s => s.rollNumber === '22CS0102')!; // Ananya Reddy has 68%
      const submitRes = await request(app).post('/api/requests').send({
        eventId: 'EVT-005',
        studentId: student.id,
        purpose: 'Special Hackathon Invitation',
        expectedBenefits: 'College prestige',
        externalRegistrationConfirmed: true,
      });
      const reqId = submitRes.body.requestId;

      // In-charge approves with override
      const decisionRes = await request(app)
        .post(`/api/incharge/requests/${reqId}/decision`)
        .set('x-user-role', 'technical_incharge')
        .send({
          decision: 'Approved',
          remarks: 'Granted special dispensation by Head of Department.',
          authorizedOverride: true,
          overrideReason: 'Representing institute at national level; 3 attendance recovery assignments assigned.',
        });

      expect(decisionRes.status).toBe(200);
      expect(decisionRes.body.request.status).toBe('Approved');
      expect(decisionRes.body.request.authorizedOverride).toBe(true);
      expect(decisionRes.body.request.overrideReason).toContain('Representing institute');
      expect(decisionRes.body.request.approvalReferenceNumber).toBeDefined();
    });
  });

  describe('6. Attendance Batch Import & Mediator Updates', () => {
    it('POST /api/attendance/import commits valid rows and updates master attendance records', async () => {
      const sampleImportRows = [
        {
          rollNumber: '22CS0101',
          studentName: 'Aarav Sharma',
          classesConducted: 55,
          classesAttended: 52,
          isEligibleForImport: true,
          validationErrors: [],
        },
      ];

      const res = await request(app)
        .post('/api/attendance/import')
        .set('x-user-role', 'technical_incharge')
        .send({
          fileName: 'Midterm_Updated_Attendance.xlsx',
          validRows: sampleImportRows,
          uploader: 'Prof. Ananthakrishnan',
        });

      expect(res.status).toBe(201);
      expect(res.body.importedCount).toBe(1);
      expect(res.body.batchId).toMatch(/^BATCH-/);

      // Verify master attendance updated
      const attRes = await request(app).get('/api/attendance/student/22CS0101');
      expect(attRes.status).toBe(200);
      expect(attRes.body.classesConducted).toBe(55);
      expect(attRes.body.classesAttended).toBe(52);
      expect(attRes.body.calculatedPercentage).toBe(94.55);
    });
  });

  describe('7. System Configuration & Audit Logs', () => {
    it('PUT /api/config modifies institutional threshold and records audit trail', async () => {
      const res = await request(app)
        .put('/api/config')
        .set('x-user-role', 'admin')
        .send({
          minimumAttendanceThreshold: 80.0,
          freshnessThresholdDays: 25,
        });

      expect(res.status).toBe(200);
      expect(res.body.minimumAttendanceThreshold).toBe(80.0);
      expect(res.body.freshnessThresholdDays).toBe(25);

      // Verify audit logs recorded change
      const auditRes = await request(app).get('/api/audit-logs');
      expect(auditRes.status).toBe(200);
      const configLog = auditRes.body.find((l: any) => l.action === 'CONFIG_UPDATED');
      expect(configLog).toBeDefined();
      expect(configLog.details).toContain('80%');
    });
  });
});
