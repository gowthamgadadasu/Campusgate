import {
  EventListing,
  EventRequestHandoff,
  Student,
  AttendanceRecord,
  EligibilityResult,
  SystemConfig,
  AttendanceImportBatch,
  AuditLogEntry,
  NotificationItem,
  EventStatus,
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        errMessage = errorJson.error;
      }
    } catch {
      // Ignore JSON parse failure on non-JSON error
    }
    throw new Error(errMessage);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  health: () => request<{ status: string; version: string; service: string }>('/health'),

  auth: {
    me: (headers?: Record<string, string>) =>
      request<{ user: any; profile: Student | null; attendance?: AttendanceRecord; eligibility?: EligibilityResult }>('/auth/me', { headers }),
  },

  events: {
    list: (params?: { status?: string; category?: string; search?: string; role?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.category) q.set('category', params.category);
      if (params?.search) q.set('search', params.search);
      if (params?.role) q.set('role', params.role);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return request<EventListing[]>(`/events${queryStr}`);
    },
    get: (id: string) => request<EventListing>(`/events/${encodeURIComponent(id)}`),
    create: (data: Partial<EventListing>, headers?: Record<string, string>) =>
      request<EventListing>('/events', { method: 'POST', body: JSON.stringify(data), headers }),
    updateStatus: (id: string, status: EventStatus, headers?: Record<string, string>) =>
      request<{ success: boolean; eventId: string; newStatus: string }>(`/events/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers,
      }),
    publish: (id: string, headers?: Record<string, string>) =>
      request<{ success: boolean; eventId: string; status: string }>(`/events/${encodeURIComponent(id)}/publish`, {
        method: 'POST',
        headers,
      }),
  },

  requests: {
    list: (params?: { studentId?: string; rollNumber?: string; status?: string; proctorId?: string }) => {
      const q = new URLSearchParams();
      if (params?.studentId) q.set('studentId', params.studentId);
      if (params?.rollNumber) q.set('rollNumber', params.rollNumber);
      if (params?.status) q.set('status', params.status);
      if (params?.proctorId) q.set('proctorId', params.proctorId);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return request<EventRequestHandoff[]>(`/requests${queryStr}`);
    },
    get: (id: string) => request<EventRequestHandoff>(`/requests/${encodeURIComponent(id)}`),
    submit: (data: {
      eventId: string;
      studentId: string;
      purpose: string;
      expectedBenefits: string;
      externalRegistrationEvidence?: string;
      externalRegistrationConfirmed: boolean;
      supportingDocuments?: Array<{ name: string; url: string }>;
    }) => request<EventRequestHandoff>('/requests', { method: 'POST', body: JSON.stringify(data) }),
    withdraw: (id: string, headers?: Record<string, string>) =>
      request<{ success: boolean; message: string }>(`/requests/${encodeURIComponent(id)}/withdraw`, {
        method: 'POST',
        headers,
      }),
  },

  proctor: {
    listRequests: (proctorId?: string) => {
      const queryStr = proctorId ? `?proctorId=${encodeURIComponent(proctorId)}` : '';
      return request<EventRequestHandoff[]>(`/proctor/requests${queryStr}`);
    },
    review: (
      id: string,
      data: {
        recommendation: 'Recommended' | 'Rejected' | 'Needs Clarification';
        remarks: string;
        proctorName?: string;
      },
      headers?: Record<string, string>
    ) =>
      request<{ success: boolean; message: string; request: EventRequestHandoff }>(
        `/proctor/requests/${encodeURIComponent(id)}/review`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers,
        }
      ),
  },

  incharge: {
    listRequests: () => request<EventRequestHandoff[]>('/incharge/requests'),
    listPending: () => request<EventRequestHandoff[]>('/incharge/requests/pending'),
    decision: (
      id: string,
      data: {
        decision: 'Approved' | 'Rejected' | 'Returned for Correction';
        remarks: string;
        inchargeName?: string;
        authorizedOverride?: boolean;
        overrideReason?: string;
      },
      headers?: Record<string, string>
    ) =>
      request<{ success: boolean; message: string; request: EventRequestHandoff }>(
        `/incharge/requests/${encodeURIComponent(id)}/decision`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers,
        }
      ),
  },

  attendance: {
    listStudents: (params?: { department?: string; search?: string; proctorId?: string }) => {
      const q = new URLSearchParams();
      if (params?.department) q.set('department', params.department);
      if (params?.search) q.set('search', params.search);
      if (params?.proctorId) q.set('proctorId', params.proctorId);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return request<Student[]>(`/students${queryStr}`);
    },
    getStudent: (id: string) =>
      request<{ student: Student; attendance?: AttendanceRecord; eligibility: EligibilityResult }>(`/students/${encodeURIComponent(id)}`),
    getRecords: () => request<AttendanceRecord[]>('/attendance'),
    getByRollNumber: (rollNumber: string) =>
      request<AttendanceRecord>(`/attendance/student/${encodeURIComponent(rollNumber)}`),
    getEligibility: (studentId: string) =>
      request<EligibilityResult>(`/attendance/eligibility/${encodeURIComponent(studentId)}`),
    importBatch: (data: { fileName: string; validRows: any[]; uploader?: string; uploaderRole?: string }) =>
      request<{ batchId: string; importedCount: number }>('/attendance/import', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listBatches: () => request<AttendanceImportBatch[]>('/attendance/batches'),
  },

  config: {
    get: () => request<SystemConfig>('/config'),
    update: (config: Partial<SystemConfig>, headers?: Record<string, string>) =>
      request<SystemConfig>('/config', {
        method: 'PUT',
        body: JSON.stringify(config),
        headers,
      }),
  },

  notifications: {
    list: () => request<NotificationItem[]>('/notifications'),
    markAsRead: (id: string) =>
      request<{ success: boolean; id: string }>(`/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH',
      }),
  },

  auditLogs: {
    list: () => request<AuditLogEntry[]>('/audit-logs'),
  },

  reset: () => request<{ success: boolean; message: string }>('/reset', { method: 'POST' }),
};
