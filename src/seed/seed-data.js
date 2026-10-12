// src/seed/seed-data.js
import { doc, setDoc, writeBatch, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase-config.js";
import { DEFAULT_RULES } from "../services/config-service.js";

export const PROCTORS = [
  {
    uid: "proctor_01",
    name: "Dr. Rajesh Kumar",
    email: "rajesh.kumar@campusgate.edu",
    role: "proctor",
    department: "AI & ECE",
    designation: "Associate Professor"
  },
  {
    uid: "proctor_02",
    name: "Dr. Priya Sundaram",
    email: "priya.sundaram@campusgate.edu",
    role: "proctor",
    department: "CSE & MECH",
    designation: "Professor"
  }
];

export const INCHARGE = {
  uid: "incharge_01",
  name: "Prof. Vikram Seth",
  email: "incharge@campusgate.edu",
  role: "incharge",
  department: "Academic Affairs & Technical Events",
  designation: "Technical-Event In-Charge"
};

// 10 Complete Published Technical Events Catalog
export const EVENTS = [
  {
    id: "evt_cat_01",
    eventCode: "EVT-CAT-01",
    title: "Smart India Hackathon 2026 - Regional Finale",
    organizer: "Ministry of Education & AICTE",
    category: "Hackathon",
    description: "Premier national software and hardware hackathon addressing problem statements from government ministries and industries.",
    venue: "IIT Bombay, Powai Campus",
    city: "Mumbai",
    startDate: "2026-11-05",
    endDate: "2026-11-07",
    registrationDeadline: "2026-10-25",
    externalUrl: "https://sih.gov.in",
    eligibilityCriteria: "Enrolled engineering students with minimum 75% verified attendance and approved institutional permission.",
    status: "Published",
    publishedAt: "2026-10-01",
    createdBy: "incharge_01"
  },
  {
    id: "evt_cat_02",
    eventCode: "EVT-CAT-02",
    title: "ACM-ICPC Asia Amritapuri Regional Contest",
    organizer: "ACM & Amrita Vishwa Vidyapeetham",
    category: "Technical Competition",
    description: "The Olympics of competitive programming featuring algorithmic challenges, graph theory, and discrete mathematics problem-solving.",
    venue: "Amrita University Campus",
    city: "Kollam",
    startDate: "2026-12-01",
    endDate: "2026-12-03",
    registrationDeadline: "2026-11-15",
    externalUrl: "https://icpc.global",
    eligibilityCriteria: "Teams of 3; minimum 75% attendance; cleared ICPC preliminary qualifier round.",
    status: "Published",
    publishedAt: "2026-10-02",
    createdBy: "incharge_01"
  },
  {
    id: "evt_cat_03",
    eventCode: "EVT-CAT-03",
    title: "IEEE International Conference on Robotics & Automation (ICRAI 2026)",
    organizer: "IEEE Robotics & Automation Society",
    category: "Conference",
    description: "Premier international research forum for presentations on autonomous systems, computer vision, and robotic kinematics.",
    venue: "IISc Bengaluru Convention Centre",
    city: "Bengaluru",
    startDate: "2026-11-18",
    endDate: "2026-11-20",
    registrationDeadline: "2026-11-01",
    externalUrl: "https://icrai2026.ieee.org",
    eligibilityCriteria: "Peer-reviewed research paper acceptance; minimum 75% attendance clearance.",
    status: "Published",
    publishedAt: "2026-10-03",
    createdBy: "incharge_01"
  },
  {
    id: "evt_cat_04",
    eventCode: "EVT-CAT-04",
    title: "Google Developer Student Clubs (GDSC) India Innovation Summit",
    organizer: "Google for Developers",
    category: "Workshop",
    description: "Intensive 2-day hands-on technical workshop covering Gemini AI APIs, TensorFlow Lite, Cloud Native architectures, and Flutter 4.",
    venue: "Google Signature Towers",
    city: "Gurugram",
    startDate: "2026-11-22",
    endDate: "2026-11-23",
    registrationDeadline: "2026-11-10",
    externalUrl: "https://developers.google.com/community/gdsc",
    eligibilityCriteria: "Active GDSC chapter members; >= 75% attendance; laptop with pre-configured dev environment.",
    status: "Published",
    publishedAt: "2026-10-04",
    createdBy: "incharge_01"
  },
  {
    id: "evt_cat_05",
    eventCode: "EVT-CAT-05",
    title: "DRDO National Aeronautical Systems Industrial Visit",
    organizer: "Defence Research & Development Organisation (DRDO)",
    category: "Industrial Visit",
    description: "Specialized institutional briefing and guided visit exploring avionics, radar simulation systems, and UAV telemetry infrastructure.",
    venue: "DRDO Aeronautical Development Establishment (ADE)",
    city: "Bengaluru",
    startDate: "2026-11-25",
    endDate: "2026-11-26",
    registrationDeadline: "2026-11-08",
    externalUrl: "https://drdo.gov.in",
    eligibilityCriteria: "Indian nationality verification; institutional security pass clearance; minimum 75% attendance.",
    status: "Published",
    publishedAt: "2026-10-05",
    createdBy: "incharge_01"
  },
  {
    id: "evt_cat_06",
    eventCode: "EVT-CAT-06",
    title: "Nullcon International Cyber Security CTF & Summit",
    organizer: "Nullcon Security Community",
    category: "Hackathon",
    description: "High-stakes offensive and defensive cybersecurity Capture-The-Flag challenge focusing on binary exploitation, reverse engineering, and web crypto.",
    venue: "Goa University Auditorium",
    city: "Goa",
    startDate: "2026-12-08",
    endDate: "2026-12-10",
    registrationDeadline: "2026-11-20",
    externalUrl: "https://nullcon.net",
    eligibilityCriteria: "Pre-qualified in online CTF round; minimum 75% attendance; code of ethics clearance.",
    status: "Published",
    publishedAt: "2026-10-06",
    createdBy: "incharge_01"
  },
  {
    id: "evt_cat_07",
    eventCode: "EVT-CAT-07",
    title: "AWS Cloud Builders Hack & GenAI Sprint",
    organizer: "Amazon Web Services (AWS)",
    category: "Hackathon",
    description: "36-hour continuous build challenge leveraging AWS Bedrock, serverless microservices, and vector databases for enterprise workflow automation.",
    venue: "AWS Community Hall, HITEC City",
    city: "Hyderabad",
    startDate: "2026-12-12",
    endDate: "2026-12-14",
    registrationDeadline: "2026-11-28",
    externalUrl: "https://aws.amazon.com/events",
    eligibilityCriteria: "Prototype submission requirement; >=75% attendance; faculty mentor recommendation.",
    status: "Published",
    publishedAt: "2026-10-07",
    createdBy: "incharge_01"
  },
  {
    id: "evt_cat_08",
    eventCode: "EVT-CAT-08",
    title: "ABU Robocon India National Championship",
    organizer: "Doordarshan & ABU Robocon Council",
    category: "Technical Competition",
    description: "Prestigious inter-collegiate robotics championship requiring design, fabrication, and automated navigation of custom field robots.",
    venue: "Balewadi Sports Complex",
    city: "Pune",
    startDate: "2026-12-18",
    endDate: "2026-12-20",
    registrationDeadline: "2026-11-30",
    externalUrl: "https://roboconindia.com",
    eligibilityCriteria: "Verified college robotics team membership; workshop safety clearance; minimum 75% attendance.",
    status: "Published",
    publishedAt: "2026-10-08",
    createdBy: "incharge_01"
  },
  {
    id: "evt_cat_09",
    eventCode: "EVT-CAT-09",
    title: "National Biotechnology & Computational Biology Symposium",
    organizer: "Department of Biotechnology (DBT) & CCMB",
    category: "Conference",
    description: "National symposium focusing on computational genomics, protein folding simulation, molecular docking, and bioinformatics pipelines.",
    venue: "CCMB Main Auditorium",
    city: "Hyderabad",
    startDate: "2026-12-22",
    endDate: "2026-12-23",
    registrationDeadline: "2026-12-05",
    externalUrl: "https://ccmb.res.in",
    eligibilityCriteria: "Research poster or paper submission; minimum 75% attendance; department head endorsement.",
    status: "Published",
    publishedAt: "2026-10-09",
    createdBy: "incharge_01"
  },
  {
    id: "evt_cat_10",
    eventCode: "EVT-CAT-10",
    title: "FinTech Blockchain Innovation Challenge",
    organizer: "National Payments Corporation of India (NPCI)",
    category: "Technical Competition",
    description: "Showcase and competitive hackathon for distributed ledger protocols, zero-knowledge proofs, and secure digital transaction infrastructure.",
    venue: "National Institute of Bank Management (NIBM)",
    city: "Mumbai",
    startDate: "2026-12-27",
    endDate: "2026-12-29",
    registrationDeadline: "2026-12-10",
    externalUrl: "https://npci.org.in",
    eligibilityCriteria: "Minimum 75% attendance; repository architecture review; verified enrolled student team.",
    status: "Published",
    publishedAt: "2026-10-10",
    createdBy: "incharge_01"
  }
];

// Generate 32 students
export const STUDENTS = [
  // Group A -> Assigned to Proctor 1 (AI & ECE)
  { roll: "24AI001", name: "Aarav Sharma", dept: "AI", sec: "II / A", proctorId: "proctor_01", conducted: 100, attended: 88, asOf: "2026-10-10" },
  { roll: "24AI002", name: "Aditi Rao", dept: "AI", sec: "II / A", proctorId: "proctor_01", conducted: 100, attended: 75, asOf: "2026-10-10" }, // Exactly 75%
  { roll: "24AI003", name: "Ananya Iyer", dept: "AI", sec: "II / A", proctorId: "proctor_01", conducted: 100, attended: 62, asOf: "2026-10-10" }, // Below 75%
  { roll: "24AI004", name: "Arjun Patel", dept: "AI", sec: "II / A", proctorId: "proctor_01", conducted: 100, attended: 92, asOf: "2026-10-10" },
  { roll: "24AI005", name: "Ayush Gupta", dept: "AI", sec: "II / A", proctorId: "proctor_01", conducted: 100, attended: 71, asOf: "2026-10-10" }, // Below 75%
  { roll: "24AI006", name: "Bhavna Joshi", dept: "AI", sec: "II / B", proctorId: "proctor_01", conducted: 100, attended: 84, asOf: "2026-10-10" },
  { roll: "24AI007", name: "Chetan Desai", dept: "AI", sec: "II / B", proctorId: "proctor_01", conducted: 100, attended: 78, asOf: "2026-10-10" },
  { roll: "24AI008", name: "Deepika Sen", dept: "AI", sec: "II / B", proctorId: "proctor_01", conducted: 100, attended: 90, asOf: "2026-10-10" },
  { roll: "24EC001", name: "Farhan Khan", dept: "ECE", sec: "II / A", proctorId: "proctor_01", conducted: 120, attended: 96, asOf: "2026-10-10" },
  { roll: "24EC002", name: "Gitanjali Sen", dept: "ECE", sec: "II / A", proctorId: "proctor_01", conducted: 120, attended: 90, asOf: "2026-10-10" }, // Exactly 75%
  { roll: "24EC003", name: "Harsh Verma", dept: "ECE", sec: "II / A", proctorId: "proctor_01", conducted: 120, attended: 72, asOf: "2026-10-10" }, // Below 75% (60%)
  { roll: "24EC004", name: "Indira Reddy", dept: "ECE", sec: "II / B", proctorId: "proctor_01", conducted: 120, attended: 102, asOf: "2026-10-10" },
  { roll: "24EC005", name: "Jatin Malhotra", dept: "ECE", sec: "II / B", proctorId: "proctor_01", conducted: 120, attended: 89, asOf: "2026-10-10" },
  { roll: "24EC006", name: "Kritika Roy", dept: "ECE", sec: "II / B", proctorId: "proctor_01", conducted: 120, attended: 95, asOf: "2026-10-10" },
  { roll: "24AI030", name: "Manish Tiwari", dept: "AI", sec: "II / A", proctorId: "proctor_01", missingAttendance: true }, // MISSING ATTENDANCE
  { roll: "24EC030", name: "Meera Nair", dept: "ECE", sec: "II / A", proctorId: "proctor_01", conducted: 0, attended: 0, asOf: "2026-10-10" }, // ZERO CONDUCTED (Unavailable)

  // Group B -> Assigned to Proctor 2 (CSE & MECH)
  { roll: "24CS001", name: "Bhavya Gupta", dept: "CSE", sec: "III / B", proctorId: "proctor_02", conducted: 110, attended: 93, asOf: "2026-10-10" },
  { roll: "24CS002", name: "Chirag Reddy", dept: "CSE", sec: "III / B", proctorId: "proctor_02", conducted: 120, attended: 90, asOf: "2026-10-10" }, // Exactly 75%
  { roll: "24CS003", name: "Divya Menon", dept: "CSE", sec: "III / B", proctorId: "proctor_02", conducted: 110, attended: 65, asOf: "2026-10-10" }, // Below 75% (59.09%)
  { roll: "24CS004", name: "Eshwar Prasad", dept: "CSE", sec: "III / B", proctorId: "proctor_02", conducted: 110, attended: 88, asOf: "2026-10-10" },
  { roll: "24CS005", name: "Fathima Begum", dept: "CSE", sec: "III / A", proctorId: "proctor_02", conducted: 110, attended: 99, asOf: "2026-10-10" },
  { roll: "24CS006", name: "Gautam Pillai", dept: "CSE", sec: "III / A", proctorId: "proctor_02", conducted: 110, attended: 82, asOf: "2026-10-10" },
  { roll: "24CS007", name: "Hansika Bhat", dept: "CSE", sec: "III / A", proctorId: "proctor_02", conducted: 110, attended: 85, asOf: "2026-10-10" },
  { roll: "24CS008", name: "Ishaan Das", dept: "CSE", sec: "III / A", proctorId: "proctor_02", conducted: 110, attended: 74, asOf: "2026-10-10" }, // Below 75% (67.27%)
  { roll: "24ME001", name: "Kiran Kumar", dept: "MECH", sec: "II / A", proctorId: "proctor_02", conducted: 100, attended: 80, asOf: "2026-10-10" },
  { roll: "24ME002", name: "Lakshmi Narayanan", dept: "MECH", sec: "II / A", proctorId: "proctor_02", conducted: 100, attended: 75, asOf: "2026-10-10" }, // Exactly 75%
  { roll: "24ME003", name: "Mohan Lal", dept: "MECH", sec: "II / A", proctorId: "proctor_02", conducted: 100, attended: 64, asOf: "2026-10-10" }, // Below 75%
  { roll: "24ME004", name: "Nandini Ghosh", dept: "MECH", sec: "II / B", proctorId: "proctor_02", conducted: 100, attended: 86, asOf: "2026-10-10" },
  { roll: "24ME005", name: "Omkar Kulkarni", dept: "MECH", sec: "II / B", proctorId: "proctor_02", conducted: 100, attended: 91, asOf: "2026-10-10" },
  { roll: "24ME006", name: "Pranav Dixit", dept: "MECH", sec: "II / B", proctorId: "proctor_02", conducted: 100, attended: 89, asOf: "2026-10-10" },
  { roll: "24CS030", name: "Rohit Singhania", dept: "CSE", sec: "III / B", proctorId: "proctor_02", conducted: 100, attended: 82, asOf: "2026-08-01", isStale: true }, // OUTDATED / STALE ATTENDANCE (>60 days old)
  { roll: "24ME030", name: "Sanya Mirza", dept: "MECH", sec: "II / A", proctorId: "proctor_02", conducted: 100, attended: 76, asOf: "2026-10-10" }
];

export const REQUESTS_DATA = [
    // 1. Approved request (Above threshold)
    {
      id: "req_01",
      ref: "EVT-2026-00101",
      studentRoll: "24AI001",
      studentName: "Aarav Sharma",
      dept: "AI",
      sec: "II / A",
      proctorId: "proctor_01",
      title: "Smart India Hackathon 2026 - Regional Finale",
      organizer: "Ministry of Education & AICTE",
      category: "Hackathon",
      venue: "IIT Bombay",
      city: "Mumbai",
      startDate: "2026-11-05",
      endDate: "2026-11-07",
      status: "Approved",
      proctorRec: "RECOMMEND_APPROVAL",
      proctorRem: "Excellent academic standing (88%) and genuine national competition. Strongly recommended.",
      inchargeDecision: "APPROVE",
      inchargeRem: "Approved. OD granted for 3 days.",
      override: false
    },
    // 2. Rejected request (Attendance below 75%)
    {
      id: "req_02",
      ref: "EVT-2026-00102",
      studentRoll: "24AI003",
      studentName: "Ananya Iyer",
      dept: "AI",
      sec: "II / A",
      proctorId: "proctor_01",
      title: "Full-Stack Web Dev Workshop",
      organizer: "TechLearn Academy",
      category: "Workshop",
      venue: "TechPark Convention Hall",
      city: "Bengaluru",
      startDate: "2026-11-12",
      endDate: "2026-11-13",
      status: "Rejected",
      proctorRec: "RECOMMEND_REJECTION",
      proctorRem: "Current attendance is 62%, significantly below 75% threshold. Cannot recommend.",
      inchargeDecision: "REJECT",
      inchargeRem: "Request rejected due to low attendance (62%). University policy strictly requires >=75%.",
      override: false
    },
    // 3. Exactly at 75% threshold - Recommended for Approval
    {
      id: "req_03",
      ref: "EVT-2026-00103",
      studentRoll: "24AI002",
      studentName: "Aditi Rao",
      dept: "AI",
      sec: "II / A",
      proctorId: "proctor_01",
      title: "IEEE International Conference on Computer Vision",
      organizer: "IEEE Computer Society",
      category: "Conference",
      venue: "IISc Bengaluru",
      city: "Bengaluru",
      startDate: "2026-11-18",
      endDate: "2026-11-20",
      status: "Recommended for Approval",
      proctorRec: "RECOMMEND_APPROVAL",
      proctorRem: "Student is presenting a peer-reviewed research paper. Attendance is exactly 75%.",
      inchargeDecision: null,
      override: false
    },
    // 4. Submitted (Awaiting Proctor Review)
    {
      id: "req_04",
      ref: "EVT-2026-00104",
      studentRoll: "24AI004",
      studentName: "Arjun Patel",
      dept: "AI",
      sec: "II / A",
      proctorId: "proctor_01",
      title: "ACM-ICPC Asia Amritapuri Regional Contest",
      organizer: "ACM",
      category: "Technical Competition",
      venue: "Amrita University",
      city: "Kollam",
      startDate: "2026-12-01",
      endDate: "2026-12-03",
      status: "Submitted",
      override: false
    },
    // 5. Under Proctor Review
    {
      id: "req_05",
      ref: "EVT-2026-00105",
      studentRoll: "24EC001",
      studentName: "Farhan Khan",
      dept: "ECE",
      sec: "II / A",
      proctorId: "proctor_01",
      title: "Embedded Systems & IoT Industrial Visit",
      organizer: "Texas Instruments",
      category: "Industrial Visit",
      venue: "TI Campus",
      city: "Bengaluru",
      startDate: "2026-11-25",
      endDate: "2026-11-26",
      status: "Under Proctor Review",
      override: false
    },
    // 6. Returned for Correction (by Proctor)
    {
      id: "req_06",
      ref: "EVT-2026-00106",
      studentRoll: "24EC002",
      studentName: "Gitanjali Sen",
      dept: "ECE",
      sec: "II / A",
      proctorId: "proctor_01",
      title: "VLSI Design Sprint",
      organizer: "Cadence Design Systems",
      category: "Technical Competition",
      venue: "Convention Center",
      city: "Hyderabad",
      startDate: "2026-12-10",
      endDate: "2026-12-11",
      status: "Returned for Correction",
      proctorRec: "RETURN_FOR_CORRECTION",
      proctorRem: "Please attach the official registration confirmation receipt from Cadence.",
      override: false
    },
    // 7. Draft Request (saved by student)
    {
      id: "req_07",
      ref: "EVT-2026-00107",
      studentRoll: "24EC004",
      studentName: "Indira Reddy",
      dept: "ECE",
      sec: "II / B",
      proctorId: "proctor_01",
      title: "Robotics Expo 2026",
      organizer: "RoboSub International",
      category: "Other",
      venue: "Pragati Maidan",
      city: "New Delhi",
      startDate: "2026-12-15",
      endDate: "2026-12-17",
      status: "Draft",
      override: false
    },
    // 8. Withdrawn Request
    {
      id: "req_08",
      ref: "EVT-2026-00108",
      studentRoll: "24CS001",
      studentName: "Bhavya Gupta",
      dept: "CSE",
      sec: "III / B",
      proctorId: "proctor_02",
      title: "Google Solution Challenge Workshop",
      organizer: "GDG Campus",
      category: "Workshop",
      venue: "Virtual / Campus Hub",
      city: "Hyderabad",
      startDate: "2026-11-02",
      endDate: "2026-11-03",
      status: "Withdrawn",
      override: false
    },
    // 9. Proctor 2: Recommended for Rejection (Attendance 59%)
    {
      id: "req_09",
      ref: "EVT-2026-00109",
      studentRoll: "24CS003",
      studentName: "Divya Menon",
      dept: "CSE",
      sec: "III / B",
      proctorId: "proctor_02",
      title: "Cyber Security Hackathon",
      organizer: "Nullcon",
      category: "Hackathon",
      venue: "Goa University",
      city: "Goa",
      startDate: "2026-11-14",
      endDate: "2026-11-16",
      status: "Recommended for Rejection",
      proctorRec: "RECOMMEND_REJECTION",
      proctorRem: "Attendance is 59.09%. Clearly fails minimum eligibility.",
      override: false
    },
    // 10. Proctor 2: Pending Final Decision (Attendance 90%)
    {
      id: "req_10",
      ref: "EVT-2026-00110",
      studentRoll: "24CS005",
      studentName: "Fathima Begum",
      dept: "CSE",
      sec: "III / A",
      proctorId: "proctor_02",
      title: "Open Source India Conference",
      organizer: "EFY Group",
      category: "Conference",
      venue: "NIMHANS Convention Centre",
      city: "Bengaluru",
      startDate: "2026-11-20",
      endDate: "2026-11-21",
      status: "Recommended for Approval",
      proctorRec: "RECOMMEND_APPROVAL",
      proctorRem: "Strong 90% attendance record. Keynote student presenter.",
      override: false
    },
    // 11. Overlapping Request (Dates overlap with req_01 for 24AI001)
    {
      id: "req_11",
      ref: "EVT-2026-00111",
      studentRoll: "24AI001",
      studentName: "Aarav Sharma",
      dept: "AI",
      sec: "II / A",
      proctorId: "proctor_01",
      title: "AI & Neural Networks Seminar",
      organizer: "IIT Bombay IEEE Branch",
      category: "Workshop",
      venue: "IIT Bombay",
      city: "Mumbai",
      startDate: "2026-11-06", // Overlaps with 2026-11-05 to 2026-11-07
      endDate: "2026-11-06",
      status: "Submitted",
      hasOverlaps: true,
      overlappingRef: ["EVT-2026-00101"],
      override: false
    },
    // 12. Approved WITH Explicit Recorded Override (Student attendance 71% < 75%)
    {
      id: "req_12",
      ref: "EVT-2026-00112",
      studentRoll: "24AI005",
      studentName: "Ayush Gupta",
      dept: "AI",
      sec: "II / A",
      proctorId: "proctor_01",
      title: "NASA Space Apps Challenge Global Stage",
      organizer: "NASA",
      category: "Hackathon",
      venue: "National Science Centre",
      city: "New Delhi",
      startDate: "2026-11-28",
      endDate: "2026-11-30",
      status: "Approved",
      proctorRec: "RECOMMEND_APPROVAL",
      proctorRem: "Student is a global finalist. Attendance is 71%, requesting discretionary override.",
      inchargeDecision: "APPROVE",
      inchargeRem: "Special approval granted based on Dean of Academic Affairs recommendation for NASA global finalist.",
      override: true,
      overrideReason: "Institutional representation at NASA Global Stage approved by Dean (Order #DEAN/2026/OD-89)"
    }
  ];

export async function seedAll() {
  console.log("--- Starting Database Seeding ---");

  // 1. Seed System Configuration
  console.log("Seeding system configuration...");
  await setDoc(doc(db, "system_config", "attendance_rules"), {
    ...DEFAULT_RULES,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: "seed_script"
  });

  // 2. Seed Proctors & In-Charge Users
  console.log("Seeding staff users...");
  for (const p of PROCTORS) {
    await setDoc(doc(db, "users", p.uid), {
      ...p,
      createdAt: serverTimestamp()
    });
  }
  await setDoc(doc(db, "users", INCHARGE.uid), {
    ...INCHARGE,
    createdAt: serverTimestamp()
  });

  // 3. Seed Students & Attendance Dataset
  console.log("Seeding students and attendance records...");
  const batch = writeBatch(db);
  const importDocRef = doc(collection(db, "attendance_imports"));

  let validAttendanceCount = 0;

  for (const s of STUDENTS) {
    const studentUid = `user_${s.roll.toLowerCase()}`;
    const userRef = doc(db, "users", studentUid);
    batch.set(userRef, {
      uid: studentUid,
      role: "student",
      rollNumber: s.roll,
      name: s.name,
      department: s.dept,
      yearSection: s.sec,
      email: `${s.roll.toLowerCase()}@campusgate.edu`,
      proctorId: s.proctorId,
      createdAt: serverTimestamp()
    });

    if (!s.missingAttendance) {
      validAttendanceCount++;
      const attRef = doc(db, "student_attendance", s.roll);
      let pct = null;
      if (s.conducted > 0) {
        pct = Number(((s.attended / s.conducted) * 100).toFixed(2));
      }

      batch.set(attRef, {
        rollNumber: s.roll,
        studentUid,
        studentName: s.name,
        department: s.dept,
        yearSection: s.sec,
        classesConducted: s.conducted,
        classesAttended: s.attended,
        attendancePercentage: pct,
        dataAsOf: s.asOf,
        importId: importDocRef.id,
        isDataStale: !!s.isStale,
        isUnavailable: s.conducted === 0 || pct === null,
        updatedAt: serverTimestamp()
      });
    }
  }

  // Record initial import record
  batch.set(importDocRef, {
    importId: importDocRef.id,
    fileName: "initial_semester_attendance.xlsx",
    importedBy: INCHARGE.name,
    importedByUid: INCHARGE.uid,
    importedAt: serverTimestamp(),
    dataAsOf: "2026-10-10",
    totalRows: STUDENTS.length,
    validRows: validAttendanceCount,
    invalidRows: 0,
    unmatchedStudents: 0,
    duplicateRecords: 0,
    status: "COMPLETED"
  });

  await batch.commit();

  // 4. Seed 12 Event Requests across multiple workflow states
  console.log("Seeding 12 event requests with full workflow histories...");

  for (const r of REQUESTS_DATA) {
    const student = STUDENTS.find(s => s.roll === r.studentRoll);
    const reqRef = doc(db, "event_requests", r.id);

    let attPct = null;
    let eligStatus = "UNAVAILABLE";
    let eligReason = "Missing data";

    if (student && !student.missingAttendance) {
      if (student.conducted > 0) {
        attPct = Number(((student.attended / student.conducted) * 100).toFixed(2));
        eligStatus = attPct >= 75 ? "ELIGIBLE" : "INELIGIBLE";
        eligReason = attPct >= 75 ? `Attendance (${attPct}%) meets threshold` : `Attendance (${attPct}%) below 75%`;
      } else {
        eligStatus = "UNAVAILABLE";
        eligReason = "Zero classes conducted";
      }
    }

    const docPayload = {
      id: r.id,
      referenceNumber: r.ref,
      studentUid: `user_${r.studentRoll.toLowerCase()}`,
      studentRollNumber: r.studentRoll,
      studentName: r.studentName,
      department: r.dept,
      yearSection: r.sec,
      proctorId: r.proctorId,
      eventTitle: r.title,
      organizer: r.organizer,
      category: r.category,
      venue: r.venue,
      city: r.city,
      startDate: r.startDate,
      endDate: r.endDate,
      eventUrl: "https://events.example.com",
      purpose: "Technical skill enhancement, competition, and representation of university.",
      supportingDocumentUrl: "https://storage.example.com/docs/registration_slip.pdf",

      attendanceSnapshot: {
        classesConducted: student?.conducted ?? null,
        classesAttended: student?.attended ?? null,
        attendancePercentage: attPct,
        requiredThreshold: 75.0,
        eligibilityStatus: eligStatus,
        isDataStale: !!student?.isStale,
        dataAsOf: student?.asOf ?? null,
        reason: eligReason
      },

      hasOverlappingEvents: !!r.hasOverlaps,
      overlappingEventIds: r.overlappingRef || [],

      status: r.status,
      proctorRecommendation: r.proctorRec || null,
      proctorRemarks: r.proctorRem || "",
      proctorReviewedAt: r.proctorRec ? serverTimestamp() : null,
      finalDecision: r.inchargeDecision || null,
      finalDecisionRemarks: r.inchargeRem || "",
      finalDecidedBy: r.inchargeDecision ? INCHARGE.name : null,
      finalDecidedAt: r.inchargeDecision ? serverTimestamp() : null,
      hasAttendanceOverride: !!r.override,
      overrideReason: r.overrideReason || "",

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(reqRef, docPayload);

    // Initial creation history
    await setDoc(doc(collection(reqRef, "history")), {
      action: "SUBMITTED",
      fromStatus: null,
      toStatus: "Submitted",
      performedBy: `user_${r.studentRoll.toLowerCase()}`,
      performedByName: r.studentName,
      performedByRole: "student",
      remarks: "Initial submission",
      timestamp: serverTimestamp()
    });

    // Proctor review history if reviewed
    if (r.proctorRec) {
      await setDoc(doc(collection(reqRef, "history")), {
        action: `PROCTOR_${r.proctorRec}`,
        fromStatus: "Submitted",
        toStatus: r.status === "Approved" || r.status === "Rejected" ? "Recommended for Approval" : r.status,
        performedBy: r.proctorId,
        performedByName: r.proctorId === "proctor_01" ? PROCTORS[0].name : PROCTORS[1].name,
        performedByRole: "proctor",
        remarks: r.proctorRem,
        timestamp: serverTimestamp()
      });
    }

    // Incharge final decision history if finalized
    if (r.inchargeDecision) {
      await setDoc(doc(collection(reqRef, "history")), {
        action: `FINAL_${r.inchargeDecision}`,
        fromStatus: "Recommended for Approval",
        toStatus: r.status,
        performedBy: INCHARGE.uid,
        performedByName: INCHARGE.name,
        performedByRole: "incharge",
        remarks: r.inchargeRem,
        isOverride: !!r.override,
        overrideReason: r.overrideReason || null,
        timestamp: serverTimestamp()
      });
    }
  }

  console.log("--- Seeding Completed Successfully! ---");
  console.log(`Summary:`);
  console.log(`- 2 Proctors seeded (${PROCTORS.map(p => p.name).join(", ")})`);
  console.log(`- 1 Technical In-Charge seeded (${INCHARGE.name})`);
  console.log(`- ${STUDENTS.length} Students seeded`);
  console.log(`- ${validAttendanceCount} Attendance records seeded`);
  console.log(`- Edge cases: 24AI030 (Missing attendance), 24CS030 (Stale attendance), 24EC030 (Zero conducted)`);
  console.log(`- ${REQUESTS_DATA.length} Event Requests seeded with complete audit histories`);
}

// Execute when run directly via node
if (process.argv[1]?.endsWith("seed-data.js")) {
  seedAll().catch(err => {
    console.error("Seeding error:", err);
    process.exit(1);
  });
}
