// src/services/dashboard-service.js
import {
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase-config.js";
import { evaluateAttendanceEligibility, getLatestAttendanceImport } from "./attendance-service.js";
import { getAssignedStudentsForProctor } from "./auth-service.js";
import * as XLSXModule from "xlsx";

const XLSX = (typeof window !== "undefined" && window.XLSX) ? window.XLSX : XLSXModule;

/**
 * Student Dashboard Data
 */
export async function getStudentDashboardData(rollNumber, studentUid) {
  // 1. Current attendance metrics
  const attendance = await evaluateAttendanceEligibility(rollNumber);

  // 2. Fetch student requests
  const q = query(
    collection(db, "event_requests"),
    where("studentRollNumber", "==", rollNumber)
  );
  const snap = await getDocs(q);
  const requests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const pendingProctor = requests.filter(r => r.status === "Submitted" || r.status === "Under Proctor Review");
  const pendingFinal = requests.filter(r => r.status === "Recommended for Approval" || r.status === "Recommended for Rejection" || r.status === "Pending Final Decision");
  const approved = requests.filter(r => r.status === "Approved");
  const rejected = requests.filter(r => r.status === "Rejected");
  const returned = requests.filter(r => r.status === "Returned for Correction");

  return {
    rollNumber,
    attendance,
    totalRequests: requests.length,
    requests,
    pendingProctor,
    pendingFinal,
    approved,
    rejected,
    returned
  };
}

/**
 * Proctor Dashboard Data
 */
export async function getProctorDashboardData(proctorId, filters = {}) {
  // 1. Assigned students
  const assignedStudents = await getAssignedStudentsForProctor(proctorId);
  const studentRolls = assignedStudents.map(s => s.rollNumber).filter(Boolean);

  // 2. Event requests for this proctor
  const q = query(
    collection(db, "event_requests"),
    where("proctorId", "==", proctorId)
  );
  const snap = await getDocs(q);
  let requests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Apply filters if provided
  if (filters.department) {
    requests = requests.filter(r => r.department === filters.department);
  }
  if (filters.section) {
    requests = requests.filter(r => r.yearSection === filters.section);
  }
  if (filters.status) {
    requests = requests.filter(r => r.status === filters.status);
  }
  if (filters.studentRollNumber) {
    requests = requests.filter(r => r.studentRollNumber === filters.studentRollNumber);
  }

  const pendingReviews = requests.filter(r => r.status === "Submitted" || r.status === "Under Proctor Review");
  const awaitingClarification = requests.filter(r => r.status === "Returned for Correction");
  const attendanceIneligible = requests.filter(r => r.attendanceSnapshot?.eligibilityStatus !== "ELIGIBLE");
  const recentlyReviewed = requests.filter(r => r.proctorReviewedAt !== null);

  return {
    proctorId,
    totalAssignedStudents: assignedStudents.length,
    assignedStudents,
    totalRequests: requests.length,
    pendingReviews,
    awaitingClarification,
    attendanceIneligible,
    recentlyReviewed,
    allRequests: requests
  };
}

/**
 * Technical-Event In-Charge Dashboard Data
 */
export async function getInchargeDashboardData(filters = {}) {
  // 1. All requests
  const snap = await getDocs(collection(db, "event_requests"));
  let requests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 2. All attendance records
  const attSnap = await getDocs(collection(db, "student_attendance"));
  const attendanceList = attSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // 3. Latest import info
  const latestImport = await getLatestAttendanceImport();

  // Compute eligibility distribution
  const eligibilityCounts = {
    ELIGIBLE: 0,
    INELIGIBLE: 0,
    STALE: 0,
    UNAVAILABLE: 0
  };

  attendanceList.forEach(a => {
    if (a.isUnavailable || a.classesConducted === 0 || a.attendancePercentage === null) {
      eligibilityCounts.UNAVAILABLE++;
    } else if (a.isDataStale) {
      eligibilityCounts.STALE++;
    } else if (a.attendancePercentage >= 75) {
      eligibilityCounts.ELIGIBLE++;
    } else {
      eligibilityCounts.INELIGIBLE++;
    }
  });

  // Department-wise stats
  const departmentStats = {};
  requests.forEach(r => {
    const dept = r.department || "Other";
    if (!departmentStats[dept]) {
      departmentStats[dept] = { total: 0, approved: 0, rejected: 0, pending: 0 };
    }
    departmentStats[dept].total++;
    if (r.status === "Approved") departmentStats[dept].approved++;
    else if (r.status === "Rejected") departmentStats[dept].rejected++;
    else departmentStats[dept].pending++;
  });

  // Apply filters
  let filteredRequests = [...requests];
  if (filters.department) {
    filteredRequests = filteredRequests.filter(r => r.department === filters.department);
  }
  if (filters.yearSection) {
    filteredRequests = filteredRequests.filter(r => r.yearSection === filters.yearSection);
  }
  if (filters.rollNumber) {
    filteredRequests = filteredRequests.filter(r => r.studentRollNumber === filters.rollNumber.toUpperCase());
  }
  if (filters.status) {
    filteredRequests = filteredRequests.filter(r => r.status === filters.status);
  }
  if (filters.category) {
    filteredRequests = filteredRequests.filter(r => r.category === filters.category);
  }
  if (filters.proctorId) {
    filteredRequests = filteredRequests.filter(r => r.proctorId === filters.proctorId);
  }
  if (filters.minAttendance !== undefined && filters.maxAttendance !== undefined) {
    filteredRequests = filteredRequests.filter(r => {
      const pct = r.attendanceSnapshot?.attendancePercentage;
      return pct !== null && pct >= filters.minAttendance && pct <= filters.maxAttendance;
    });
  }

  const pendingProctor = requests.filter(r => r.status === "Submitted" || r.status === "Under Proctor Review");
  const pendingFinal = requests.filter(r => r.status === "Recommended for Approval" || r.status === "Recommended for Rejection" || r.status === "Pending Final Decision");
  const approved = requests.filter(r => r.status === "Approved");
  const rejected = requests.filter(r => r.status === "Rejected");
  const flaggedAttendance = requests.filter(r => r.attendanceSnapshot?.eligibilityStatus !== "ELIGIBLE");

  return {
    totalRequests: requests.length,
    pendingProctorCount: pendingProctor.length,
    pendingFinalCount: pendingFinal.length,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    flaggedAttendanceCount: flaggedAttendance.length,
    latestImport,
    eligibilityDistribution: eligibilityCounts,
    departmentStats,
    filteredRequests,
    requests
  };
}

/**
 * Module 6: Export Attendance Eligibility CSV Report
 */
export async function exportAttendanceReportCSV() {
  const snap = await getDocs(collection(db, "student_attendance"));
  const records = snap.docs.map(d => d.data());

  const headers = ["Roll Number", "Student Name", "Department", "Year / Section", "Conducted", "Attended", "Attendance %", "Eligibility", "Data As Of"];
  const rows = records.map(r => [
    `"${r.rollNumber || ""}"`,
    `"${r.studentName || ""}"`,
    `"${r.department || ""}"`,
    `"${r.yearSection || ""}"`,
    r.classesConducted ?? "N/A",
    r.classesAttended ?? "N/A",
    r.attendancePercentage !== null ? `${r.attendancePercentage}%` : "Unavailable",
    r.attendancePercentage >= 75 ? "ELIGIBLE" : (r.attendancePercentage === null ? "UNAVAILABLE" : "INELIGIBLE"),
    `"${r.dataAsOf || ""}"`
  ]);

  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

/**
 * Module 6: Export Event Approvals CSV Report
 */
export async function exportRequestsReportCSV() {
  const snap = await getDocs(collection(db, "event_requests"));
  const records = snap.docs.map(d => d.data());

  const headers = [
    "Reference Number",
    "Roll Number",
    "Student Name",
    "Department",
    "Event Title",
    "Organizer",
    "Category",
    "Start Date",
    "End Date",
    "Attendance %",
    "Status",
    "Proctor Recommendation",
    "Final Decision",
    "Remarks",
    "Override"
  ];

  const rows = records.map(r => [
    `"${r.referenceNumber || ""}"`,
    `"${r.studentRollNumber || ""}"`,
    `"${r.studentName || ""}"`,
    `"${r.department || ""}"`,
    `"${r.eventTitle || ""}"`,
    `"${r.organizer || ""}"`,
    `"${r.category || ""}"`,
    `"${r.startDate || ""}"`,
    `"${r.endDate || ""}"`,
    r.attendanceSnapshot?.attendancePercentage !== null ? `${r.attendanceSnapshot?.attendancePercentage}%` : "Unavailable",
    `"${r.status || ""}"`,
    `"${r.proctorRecommendation || ""}"`,
    `"${r.finalDecision || ""}"`,
    `"${(r.finalDecisionRemarks || r.proctorRemarks || "").replace(/"/g, '""')}"`,
    r.hasAttendanceOverride ? "YES" : "NO"
  ]);

  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
}

/**
 * =========================================================================
 * SheetJS (.xlsx) Binary Workbook Export Functions
 * =========================================================================
 */

/**
 * Build XLSX workbook for Proctor's assigned students roster
 */
export function buildAssignedStudentsWorkbook(students = []) {
  const data = students.map(s => {
    let pctStr = "Unavailable";
    let elig = "UNAVAILABLE";
    if (s.conducted > 0 && !s.missingAttendance) {
      const pct = Number(((s.attended / s.conducted) * 100).toFixed(2));
      pctStr = `${pct}%`;
      elig = pct >= 75 ? "ELIGIBLE (>=75%)" : "INELIGIBLE (<75%)";
    }
    return {
      "Roll Number": s.roll || s.rollNumber || "",
      "Student Name": s.name || s.studentName || "",
      "Department": s.dept || s.department || "",
      "Year / Section": s.sec || s.yearSection || "",
      "Classes Attended": s.attended ?? s.classesAttended ?? "N/A",
      "Classes Conducted": s.conducted ?? s.classesConducted ?? "N/A",
      "Attendance Percentage": pctStr,
      "Eligibility Status": elig,
      "Data Freshness": s.asOf || s.dataAsOf || "2026-10-10",
      "Proctor Assigned": s.proctorId || "proctor_01"
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Assigned Students");
  return wb;
}

/**
 * Build XLSX workbook for Proctor's request reviews
 */
export function buildRequestReviewsWorkbook(requests = []) {
  const data = requests.map(r => ({
    "Reference #": r.referenceNumber || r.ref || "",
    "Roll Number": r.studentRollNumber || r.studentRoll || "",
    "Student Name": r.studentName || "",
    "Department": r.department || r.dept || "",
    "Event Title": r.eventTitle || r.title || "",
    "Category": r.category || "",
    "Start Date": r.startDate || "",
    "End Date": r.endDate || "",
    "Attendance %": r.attendanceSnapshot?.attendancePercentage !== undefined ? `${r.attendanceSnapshot.attendancePercentage}%` : "Unavailable",
    "Current Status": r.status || "",
    "Proctor Recommendation": r.proctorRecommendation || r.proctorRec || "Pending",
    "Proctor Remarks": r.proctorRemarks || r.proctorRem || "",
    "Final Decision": r.finalDecision || "Pending In-Charge Review"
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Request Reviews");
  return wb;
}

/**
 * Build XLSX workbook for In-Charge complete attendance roster
 */
export function buildAttendanceWorkbook(records = []) {
  const data = records.map(r => ({
    "Roll Number": r.rollNumber || r.roll || "",
    "Student Name": r.studentName || r.name || "",
    "Department": r.department || r.dept || "",
    "Year / Section": r.yearSection || r.sec || "",
    "Classes Conducted": r.classesConducted ?? r.conducted ?? "N/A",
    "Classes Attended": r.classesAttended ?? r.attended ?? "N/A",
    "Attendance %": (r.attendancePercentage !== null && r.attendancePercentage !== undefined) ? `${r.attendancePercentage}%` : "Unavailable",
    "Eligibility Status": r.attendancePercentage >= 75 ? "ELIGIBLE" : (r.attendancePercentage === null ? "UNAVAILABLE" : "INELIGIBLE"),
    "Data As Of": r.dataAsOf || r.asOf || "2026-10-10",
    "Data Status": r.isDataStale || r.isStale ? "STALE (>30 Days)" : "FRESH"
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Roster");
  return wb;
}

/**
 * Build XLSX workbook for In-Charge approvals and event requests
 */
export function buildRequestsWorkbook(records = []) {
  const data = records.map(r => ({
    "Reference Number": r.referenceNumber || r.ref || "",
    "Roll Number": r.studentRollNumber || r.studentRoll || "",
    "Student Name": r.studentName || "",
    "Department": r.department || r.dept || "",
    "Event Title": r.eventTitle || r.title || "",
    "Organizer": r.organizer || "",
    "Category": r.category || "",
    "Venue": r.venue || "",
    "City": r.city || "",
    "Start Date": r.startDate || "",
    "End Date": r.endDate || "",
    "Attendance %": r.attendanceSnapshot?.attendancePercentage !== undefined ? `${r.attendanceSnapshot.attendancePercentage}%` : "Unavailable",
    "Status": r.status || "",
    "Proctor Recommendation": r.proctorRecommendation || r.proctorRec || "Pending",
    "Final Decision": r.finalDecision || "Pending",
    "Official Remarks": r.finalDecisionRemarks || r.finalRemarks || r.proctorRemarks || "",
    "Exceptional Override": r.hasAttendanceOverride || r.override ? "YES" : "NO",
    "Override Reason": r.overrideReason || ""
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Event Approvals");
  return wb;
}

/**
 * Browser download helper: trigger .xlsx download
 */
export function downloadWorkbookXLSX(wb, filename = "export.xlsx") {
  if (typeof XLSX.writeFile === "function") {
    XLSX.writeFile(wb, filename);
  } else if (typeof XLSX.write === "function") {
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export Proctor Assigned Students to XLSX file
 */
export function exportAssignedStudentsXLSX(students, filename = "Proctor_Assigned_Students.xlsx") {
  const wb = buildAssignedStudentsWorkbook(students);
  downloadWorkbookXLSX(wb, filename);
}

/**
 * Export Proctor Request Reviews to XLSX file
 */
export function exportRequestReviewsXLSX(requests, filename = "Proctor_Request_Reviews.xlsx") {
  const wb = buildRequestReviewsWorkbook(requests);
  downloadWorkbookXLSX(wb, filename);
}

/**
 * Export In-Charge Attendance Records to XLSX file
 */
export function exportAttendanceXLSX(records, filename = "CampusGate_Attendance_Roster.xlsx") {
  const wb = buildAttendanceWorkbook(records);
  downloadWorkbookXLSX(wb, filename);
}

/**
 * Export In-Charge Event Approvals to XLSX file
 */
export function exportRequestsXLSX(records, filename = "CampusGate_Event_Approvals.xlsx") {
  const wb = buildRequestsWorkbook(records);
  downloadWorkbookXLSX(wb, filename);
}

/**
 * Sanitize cell value against CSV / Spreadsheet Formula Injection (CSV Injection / DDE attack).
 * Values starting with =, +, -, @, or tab are prepended with a single quote.
 */
export function sanitizeCellValue(val) {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      return `'${trimmed}`;
    }
    return trimmed;
  }
  return val;
}

/**
 * Recursively sanitize all string values in an object before converting to sheet
 */
export function sanitizeRecord(record) {
  const clean = {};
  for (const [key, value] of Object.entries(record)) {
    clean[key] = sanitizeCellValue(value);
  }
  return clean;
}

/**
 * Build multi-sheet XLSX report for In-Charge:
 * - Eligible & Applied
 * - Eligible & Not Applied
 * - Ineligible & Applied
 * - Ineligible & Not Applied
 * - Flagged (Missing / Stale Data)
 */
export function buildInChargeAppliedReport(students = [], requests = [], threshold = 75) {
  const appliedRolls = new Set(requests.map(r => (r.studentRollNumber || r.studentRoll || "").toUpperCase()));

  const studentRows = students.map(s => {
    const roll = (s.roll || s.rollNumber || "").toUpperCase();
    const name = s.name || s.studentName || "";
    const dept = s.dept || s.department || "AI";
    const hasApplied = appliedRolls.has(roll);

    let pct = null;
    let isStale = !!(s.isStale || s.isDataStale || (s.asOf && s.asOf.startsWith("2026-08")));
    let isMissing = !!(s.missingAttendance || s.conducted === undefined || s.conducted === 0);

    if (!isMissing && s.conducted > 0) {
      pct = Number(((s.attended / s.conducted) * 100).toFixed(2));
    }

    const isEligible = !isMissing && !isStale && pct !== null && pct >= threshold;

    return {
      roll,
      name,
      dept,
      pct: pct !== null ? `${pct}%` : "Unavailable",
      pctNum: pct,
      isEligible,
      hasApplied,
      isStale,
      isMissing,
      lastUpdated: s.asOf || s.dataAsOf || "2026-10-10",
      proctorId: s.proctorId || "proctor_01"
    };
  });

  const eligibleApplied = studentRows
    .filter(s => s.isEligible && s.hasApplied)
    .map(s => sanitizeRecord({
      "Roll Number": s.roll,
      "Student Name": s.name,
      "Department": s.dept,
      "Attendance %": s.pct,
      "Eligibility": "ELIGIBLE",
      "Event Application Status": "APPLIED",
      "Proctor Assigned": s.proctorId
    }));

  const eligibleNotApplied = studentRows
    .filter(s => s.isEligible && !s.hasApplied)
    .map(s => sanitizeRecord({
      "Roll Number": s.roll,
      "Student Name": s.name,
      "Department": s.dept,
      "Attendance %": s.pct,
      "Eligibility": "ELIGIBLE",
      "Event Application Status": "NOT APPLIED",
      "Proctor Assigned": s.proctorId
    }));

  const ineligibleApplied = studentRows
    .filter(s => !s.isEligible && s.hasApplied && !s.isMissing && !s.isStale)
    .map(s => sanitizeRecord({
      "Roll Number": s.roll,
      "Student Name": s.name,
      "Department": s.dept,
      "Attendance %": s.pct,
      "Eligibility": "INELIGIBLE (<75%)",
      "Event Application Status": "APPLIED",
      "Proctor Assigned": s.proctorId
    }));

  const ineligibleNotApplied = studentRows
    .filter(s => !s.isEligible && !s.hasApplied && !s.isMissing && !s.isStale)
    .map(s => sanitizeRecord({
      "Roll Number": s.roll,
      "Student Name": s.name,
      "Department": s.dept,
      "Attendance %": s.pct,
      "Eligibility": "INELIGIBLE (<75%)",
      "Event Application Status": "NOT APPLIED",
      "Proctor Assigned": s.proctorId
    }));

  const flagged = studentRows
    .filter(s => s.isMissing || s.isStale)
    .map(s => sanitizeRecord({
      "Roll Number": s.roll,
      "Student Name": s.name,
      "Department": s.dept,
      "Attendance %": s.pct,
      "Flag Reason": s.isMissing ? "MISSING ATTENDANCE DATA" : "OUTDATED RECORD (>30 DAYS)",
      "Event Application Status": s.hasApplied ? "APPLIED" : "NOT APPLIED",
      "Last Updated": s.lastUpdated,
      "Proctor Assigned": s.proctorId
    }));

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eligibleApplied.length ? eligibleApplied : [{ "Notice": "No records in this category" }]), "Eligible & Applied");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eligibleNotApplied.length ? eligibleNotApplied : [{ "Notice": "No records in this category" }]), "Eligible & Not Applied");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ineligibleApplied.length ? ineligibleApplied : [{ "Notice": "No records in this category" }]), "Ineligible & Applied");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ineligibleNotApplied.length ? ineligibleNotApplied : [{ "Notice": "No records in this category" }]), "Ineligible & Not Applied");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flagged.length ? flagged : [{ "Notice": "No records in this category" }]), "Flagged (Missing or Stale)");

  return wb;
}

/**
 * Export In-Charge Multi-Sheet Applied vs Not-Applied Report
 */
export function exportInChargeAppliedReportXLSX(students, requests, threshold = 75, filename = "CampusGate_InCharge_Applied_NotApplied.xlsx") {
  const wb = buildInChargeAppliedReport(students, requests, threshold);
  downloadWorkbookXLSX(wb, filename);
}
