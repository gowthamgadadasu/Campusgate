// src/services/auth-service.js
import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase-config.js";

/**
 * Roles enum
 */
export const ROLES = {
  STUDENT: "student",
  PROCTOR: "proctor",
  INCHARGE: "incharge"
};

/**
 * Fetch a user profile by UID
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Create or update a user profile
 */
export async function setUserProfile(uid, data) {
  const userRef = doc(db, "users", uid);
  const profile = {
    ...data,
    updatedAt: serverTimestamp()
  };
  await setDoc(userRef, profile, { merge: true });
  return { id: uid, ...profile };
}

/**
 * Fetch all students assigned to a specific proctor
 */
export async function getAssignedStudentsForProctor(proctorId) {
  const q = query(
    collection(db, "users"),
    where("role", "==", ROLES.STUDENT),
    where("proctorId", "==", proctorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Fetch user profile by Roll Number
 */
export async function getUserByRollNumber(rollNumber) {
  if (!rollNumber) return null;
  const q = query(
    collection(db, "users"),
    where("rollNumber", "==", rollNumber.trim().toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/**
 * List all users with a specific role
 */
export async function getUsersByRole(role) {
  const q = query(collection(db, "users"), where("role", "==", role));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
