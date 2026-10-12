import { describe, it, expect } from 'vitest';
import { dataStore } from '../services/dataStore';
import { Student, EventListing } from '../types';

describe('CampusGate End-to-End Workflow & Authority Rules', () => {
  const sampleStudent: Student = {
    id: 'STU-TEST-001',
    rollNumber: '22CS9999',
    name: 'Workflow Tester',
    email: 'tester.22cs@campus.edu',
    department: 'Computer Science & Engineering',
    branch: 'B.Tech CSE',
    academicYear: 3,
    semester: 6,
    section: 'A',
    admissionBatch: '2022-2026',
    graduationYear: 2026,
    assignedProctorId: 'PROC-01',
    assignedProctorName: 'Dr. Ramesh Kumar (CSE)',
    status: 'active',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  it('Step 1: In-Charge creates and publishes an event successfully', () => {
    const newEvent: EventListing = {
      id: 'EVT-TEST-100',
      title: 'Global Autonomous Drone Challenge 2026',
      organizer: 'National Aero Labs',
      category: 'Technical Competition',
      description: 'Autonomous waypoint navigation and computer vision tracking challenge.',
      venue: 'IIT Aero Hangar',
      city: 'Kanpur',
      startDate: '2026-11-25',
      endDate: '2026-11-27',
      registrationDeadline: '2026-11-15',
      eligibilityCriteria: 'Engineering students with minimum 75% attendance.',
      requiredDocuments: 'Drone Blueprint, College Recommendation',
      purposeAndBenefits: 'Opportunity for national championship and research grants.',
      status: 'Published',
      createdBy: 'Prof. Ananthakrishnan (Technical In-Charge)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = dataStore.saveEvent(newEvent, 'Prof. Ananthakrishnan', 'technical_incharge');
    expect(saved.id).toBe('EVT-TEST-100');

    // Confirm it exists in published events
    const retrieved = dataStore.getEventById('EVT-TEST-100');
    expect(retrieved).toBeDefined();
    expect(retrieved?.status).toBe('Published');
  });

  it('Step 2 & 3: Student requests permission and attendance eligibility is computed from mediator', () => {
    // Add student to store
    dataStore.saveStudent(sampleStudent);

    const submission = dataStore.submitEventRequest({
      eventId: 'EVT-TEST-100',
      student: sampleStudent,
      purpose: 'Deploying autonomous obstacle avoidance firmware.',
      expectedBenefits: 'Aeronautical research credits and institutional visibility.',
      externalRegistrationConfirmed: true,
      supportingDocuments: [{ name: 'Drone_Firmware_Specs.pdf', url: '#' }],
    });

    expect(submission.error).toBeUndefined();
    expect(submission.request).toBeDefined();
    expect(submission.request.requestId).toMatch(/^REQ-2026-/);
    expect(submission.request.status).toBe('Under Proctor Review');
    expect(submission.request.assignedProctorId).toBe('PROC-01');
  });

  it('Step 4: Prevents duplicate active requests for the same event by the same student', () => {
    const duplicateSubmission = dataStore.submitEventRequest({
      eventId: 'EVT-TEST-100',
      student: sampleStudent,
      purpose: 'Second attempt should fail duplicate constraint.',
      expectedBenefits: 'None',
      externalRegistrationConfirmed: true,
      supportingDocuments: [],
    });

    expect(duplicateSubmission.error).toBeDefined();
    expect(duplicateSubmission.error).toContain('already exists for this event');
  });

  it('Step 5: Proctor submits recommendation (cannot make final decision)', () => {
    const req = dataStore.getEventRequests().find(r => r.rollNumber === '22CS9999' && r.eventId === 'EVT-TEST-100');
    expect(req).toBeDefined();

    dataStore.updateProctorRecommendation(
      req!.requestId,
      'Recommended',
      'Student exhibits exceptional technical aptitude in drone control. Strongly recommend approval.',
      'Dr. Ramesh Kumar'
    );

    const updated = dataStore.getEventRequestById(req!.requestId);
    expect(updated?.proctorRecommendation).toBe('Recommended');
    // Notice status is Pending Final Decision, NOT Approved! Proctor cannot approve!
    expect(updated?.status).toBe('Pending Final Decision');
  });

  it('Step 6: Technical In-Charge executes final approval and generates clearance pass', () => {
    const req = dataStore.getEventRequests().find(r => r.rollNumber === '22CS9999' && r.eventId === 'EVT-TEST-100');
    expect(req).toBeDefined();

    dataStore.updateTechnicalInchargeDecision(
      req!.requestId,
      'Approved',
      'Official institutional permission sanctioned with college sponsorship.',
      'Prof. Ananthakrishnan'
    );

    const finalReq = dataStore.getEventRequestById(req!.requestId);
    expect(finalReq?.status).toBe('Approved');
    expect(finalReq?.approvalReferenceNumber).toMatch(/^APV-2026-/);
    expect(finalReq?.technicalInchargeDecisionMakerName).toBe('Prof. Ananthakrishnan');
  });

  it('Step 7: Student can withdraw an unapproved or draft request', () => {
    const anotherStudent = { ...sampleStudent, id: 'STU-TEST-002', rollNumber: '22CS8888' };
    dataStore.saveStudent(anotherStudent);

    const submission = dataStore.submitEventRequest({
      eventId: 'EVT-002',
      student: anotherStudent,
      purpose: 'Participating in ACM contest.',
      expectedBenefits: 'Algorithm development.',
      externalRegistrationConfirmed: false,
      supportingDocuments: [],
    });

    expect(submission.request).toBeDefined();
    const withdrawSuccess = dataStore.withdrawEventRequest(submission.request.requestId, anotherStudent.name);
    expect(withdrawSuccess).toBe(true);

    const withdrawn = dataStore.getEventRequestById(submission.request.requestId);
    expect(withdrawn?.status).toBe('Withdrawn');
  });
});
