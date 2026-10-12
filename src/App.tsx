import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/AppLayout';
import { StudentDashboardView } from './components/StudentDashboardView';
import { ProctorDashboardView } from './components/ProctorDashboardView';
import { InChargeDashboardView } from './components/InChargeDashboardView';
import { StudentMasterView } from './components/StudentMasterView';
import { ImportCenterView } from './components/ImportCenterView';
import { VerificationQueueView } from './components/VerificationQueueView';
import { ReportsAndExportsView } from './components/ReportsAndExportsView';
import { AuditTrailView } from './components/AuditTrailView';
import { SettingsConfigView } from './components/SettingsConfigView';

function AppContent() {
  const { currentUser } = useAuth();
  
  // Set default tab based on user's active role
  const getDefaultTabForRole = (role: string) => {
    if (role === 'student') return 'student_dashboard';
    if (role === 'proctor') return 'proctor_dashboard';
    return 'incharge_dashboard';
  };

  const [currentTab, setCurrentTab] = useState<string>(() => getDefaultTabForRole(currentUser.role));

  // Sync tab when user changes role from header selector
  useEffect(() => {
    setCurrentTab(getDefaultTabForRole(currentUser.role));
  }, [currentUser.role]);

  return (
    <AppLayout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {/* 1. Student Dashboard (Explore Events, Details, Apply, Attendance & My Requests) */}
      {currentTab === 'student_dashboard' && <StudentDashboardView />}

      {/* 2. Proctor Dashboard (Assigned Mentees, Dossiers, Verification Checks & Recommendations) */}
      {currentTab === 'proctor_dashboard' && <ProctorDashboardView />}

      {/* 3. Technical Event In-Charge Dashboard (Event Management, Final Approval Queue & Overview) */}
      {currentTab === 'incharge_dashboard' && (
        <InChargeDashboardView
          onNavigateToImport={() => setCurrentTab('import')}
          onNavigateToSettings={() => setCurrentTab('settings')}
        />
      )}

      {/* Shared Supporting Modules */}
      {currentTab === 'students' && <StudentMasterView />}
      {currentTab === 'import' && <ImportCenterView onImportSuccess={() => setCurrentTab('incharge_dashboard')} />}
      {currentTab === 'verification' && <VerificationQueueView />}
      {currentTab === 'reports' && <ReportsAndExportsView />}
      {currentTab === 'audit' && <AuditTrailView />}
      {currentTab === 'settings' && <SettingsConfigView />}
    </AppLayout>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
