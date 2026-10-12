// src/services/config-service.js
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase-config.js";

export const DEFAULT_RULES = {
  minAttendanceThreshold: 75.0,
  staleThresholdDays: 30,
  allowedEventCategories: [
    "Hackathon",
    "Workshop",
    "Conference",
    "Technical Competition",
    "Industrial Visit",
    "Other"
  ]
};

/**
 * Fetch current attendance threshold and policy rules
 */
export async function getAttendanceRules() {
  const configRef = doc(db, "system_config", "attendance_rules");
  const snap = await getDoc(configRef);
  if (!snap.exists()) {
    // If not set yet, initialize and return defaults
    await setDoc(configRef, {
      ...DEFAULT_RULES,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: "system"
    });
    return { ...DEFAULT_RULES };
  }
  return snap.data();
}

/**
 * Update attendance eligibility thresholds and approval rules (In-Charge only)
 */
export async function updateAttendanceRules(updates, userContext = {}) {
  const configRef = doc(db, "system_config", "attendance_rules");
  const payload = {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: userContext.name || userContext.uid || "incharge"
  };
  await setDoc(configRef, payload, { merge: true });
  return payload;
}
