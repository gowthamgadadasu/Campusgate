import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, Student } from '../types';
import { dataStore } from '../services/dataStore';

interface AuthContextType {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department?: string;
    studentRollNumber?: string;
  };
  setRole: (role: UserRole) => void;
  allRoles: { role: UserRole; label: string; desc: string }[];
  currentStudentProfile?: Student;
}

const ROLES: { role: UserRole; label: string; desc: string }[] = [
  { role: 'student', label: 'Student Dashboard (Aarav - 22CS0101)', desc: 'Explore events, check attendance eligibility, apply for institutional permission' },
  { role: 'proctor', label: 'Proctor Dashboard (Dr. Ramesh Kumar)', desc: 'Verify assigned mentee requests, inspect eligibility, submit recommendations' },
  { role: 'technical_incharge', label: 'Technical Event In-Charge Dashboard', desc: 'Create & publish events, import attendance, final approvals & sanctions' },
  { role: 'verifier', label: 'Authorized Verifier (Dr. Suresh Babu)', desc: 'Resolve flagged attendance discrepancies in verification queue' },
  { role: 'admin', label: 'Institutional Admin (Registrar)', desc: 'Master records, audit log inspection, system settings' },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read stored role or default to student
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('cg_active_role');
    return (saved as UserRole) || 'student';
  });

  const getUserForRole = (r: UserRole) => {
    switch (r) {
      case 'student':
        return {
          id: 'STU-001',
          name: 'Aarav Sharma',
          email: 'aarav.22cs@campus.edu',
          role: 'student' as UserRole,
          department: 'Computer Science & Engineering',
          studentRollNumber: '22CS0101',
        };
      case 'proctor':
        return {
          id: 'PROC-01',
          name: 'Dr. Ramesh Kumar',
          email: 'ramesh.kumar@faculty.campus.edu',
          role: 'proctor' as UserRole,
          department: 'Computer Science & Engineering',
        };
      case 'technical_incharge':
        return {
          id: 'TECH-HEAD-01',
          name: 'Prof. Ananthakrishnan',
          email: 'ananth.techhead@campus.edu',
          role: 'technical_incharge' as UserRole,
          department: 'Technical Affairs & Hackathon Cell',
        };
      case 'verifier':
        return {
          id: 'VER-REV-01',
          name: 'Dr. Suresh Babu',
          email: 'suresh.babu@verifier.campus.edu',
          role: 'verifier' as UserRole,
          department: 'Academic Verification Cell',
        };
      case 'admin':
      default:
        return {
          id: 'ADMIN-01',
          name: 'Registrar Controller',
          email: 'registrar@campus.edu',
          role: 'admin' as UserRole,
          department: 'Academic Affairs',
        };
    }
  };

  const [currentUser, setCurrentUser] = useState(getUserForRole(role));

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    setCurrentUser(getUserForRole(newRole));
    localStorage.setItem('cg_active_role', newRole);
  };

  const studentProfile = currentUser.studentRollNumber
    ? dataStore.getStudentById(currentUser.studentRollNumber)
    : undefined;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setRole,
        allRoles: ROLES,
        currentStudentProfile: studentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
