import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  FileText,
  AlertTriangle,
  UserCheck,
  Send,
  Calendar,
  MapPin,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { EventRequestHandoff, Student, EligibilityResult } from '../types';
import { useAuth } from '../context/AuthContext';

export const ProctorDashboardView: React.FC = () => {
  const { currentUser } = useAuth();
  const config = dataStore.getConfig();

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterEligibility, setFilterEligibility] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Review Drawer Modal State
  const [selectedRequest, setSelectedRequest] = useState<EventRequestHandoff | null>(null);

  // Verification Checklist State
  const [checkIdentity, setCheckIdentity] = useState(true);
  const [checkAttendance, setCheckAttendance] = useState(true);
  const [checkPurpose, setCheckPurpose] = useState(true);
  const [checkDocuments, setCheckDocuments] = useState(true);

  // Proctor Action Form
  const [recommendation, setRecommendation] = useState<'Recommended' | 'Rejected' | 'Needs Clarification'>('Recommended');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Retrieve assigned students strictly for this proctor
  const allStudents = dataStore.getStudents();
  const assignedStudents = allStudents.filter(s => s.assignedProctorId === currentUser.id);

  // Retrieve event requests belonging ONLY to assigned students
  const allRequests = dataStore.getEventRequests();
  const proctorRequests = allRequests.filter(r => r.assignedProctorId === currentUser.id);

  // Filtered requests
  const filteredRequests = proctorRequests.filter(req => {
    if (filterCategory !== 'all' && req.eventCategory !== filterCategory) return false;
    if (filterEligibility !== 'all' && req.eligibility.status !== filterEligibility) return false;
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        req.studentName.toLowerCase().includes(q) ||
        req.rollNumber.toLowerCase().includes(q) ||
        req.eventName.toLowerCase().includes(q) ||
        req.requestId.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Summary Metrics
  const pendingReviewCount = proctorRequests.filter(r => r.status === 'Under Proctor Review' || r.status === 'Submitted').length;
  const awaitingClarificationCount = proctorRequests.filter(r => r.status === 'Returned for Correction').length;
  const ineligibleRequestsCount = proctorRequests.filter(r => r.eligibility.status === 'Below Threshold' || r.eligibility.status === 'Attendance Unavailable').length;
  const reviewedCount = proctorRequests.filter(r => r.proctorRecommendation !== undefined).length;

  // Submit Proctor Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!remarks.trim() && recommendation !== 'Recommended') {
      alert('Mandatory remarks required when recommending rejection or requesting clarification.');
      return;
    }

    setSubmitting(true);
    dataStore.updateProctorRecommendation(
      selectedRequest.requestId,
      recommendation,
      remarks.trim() || 'Meets institutional criteria based on verified academic standing.',
      currentUser.name
    );
    setSubmitting(false);

    alert(`Proctor recommendation "${recommendation}" successfully recorded! Request dispatched to Technical In-Charge.`);
    setSelectedRequest(null);
    setRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Proctor Profile & Assigned Department Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-7 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              {currentUser.name.charAt(3) || 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold text-blue-400 bg-blue-950/70 px-2.5 py-0.5 rounded-md border border-blue-800/60">
                  Faculty Proctor Portal
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {currentUser.id}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold mt-1 tracking-tight text-white">{currentUser.name}</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentUser.department} · Designated Academic Mentor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Assigned Mentees</span>
              <span className="text-2xl font-black text-blue-300 block mt-0.5">{assignedStudents.length} Students</span>
              <span className="text-[11px] text-slate-400">Strictly filtered access</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Authority Rule Alert */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900 shadow-xs">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Mandatory Institutional Policy:</strong> Proctors conduct first-level verification and submit recommendations (
          <em>Recommend Approval</em>, <em>Recommend Rejection</em>, or <em>Return for Correction</em>).{' '}
          <strong>Proctors do not issue the final institutional clearance.</strong> Final sanctions are made by the Technical-Event In-Charge.
        </div>
      </div>

      {/* 3. Live Proctor Operational KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Pending Reviews</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingReviewCount}</span>
          <span className="text-xs text-slate-500">Requires your action</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Awaiting Student Action</span>
            <HelpCircle size={16} className="text-indigo-500" />
          </div>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">{awaitingClarificationCount}</span>
          <span className="text-xs text-slate-500">Returned for clarification</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Attendance Ineligible</span>
            <XCircle size={16} className="text-rose-500" />
          </div>
          <span className="text-2xl font-black text-rose-600 mt-1 block">{ineligibleRequestsCount}</span>
          <span className="text-xs text-slate-500">&lt;{config.minimumAttendanceThreshold}% or unavailable</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Recommendations Handled</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{reviewedCount}</span>
          <span className="text-xs text-slate-500">Forwarded to In-Charge</span>
        </div>
      </div>

      {/* 4. Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search assigned students, roll no, event title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filterEligibility}
            onChange={(e) => setFilterEligibility(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold"
          >
            <option value="all">All Eligibility</option>
            <option value="Eligible">Eligible (≥{config.minimumAttendanceThreshold}%)</option>
            <option value="Below Threshold">Below Threshold (&lt;{config.minimumAttendanceThreshold}%)</option>
            <option value="Verification Required">Verification Hold</option>
            <option value="Attendance Unavailable">Attendance Unavailable</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold"
          >
            <option value="all">All Workflow Statuses</option>
            <option value="Under Proctor Review">Under Proctor Review</option>
            <option value="Pending Final Decision">Pending Final Decision</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Returned for Correction">Returned for Correction</option>
          </select>
        </div>

        <span className="text-slate-500 font-medium">
          Showing {filteredRequests.length} requests
        </span>
      </div>

      {/* 5. Assigned Student Review Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Ref Code</th>
                <th className="p-4">Assigned Student</th>
                <th className="p-4">Event Details</th>
                <th className="p-4">Event Date</th>
                <th className="p-4">Mediator Attendance & Eligibility</th>
                <th className="p-4">My Recommendation</th>
                <th className="p-4">Final Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No requests found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const elig = req.eligibility;
                  return (
                    <tr key={req.requestId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-600">{req.requestId}</td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{req.studentName}</span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {req.rollNumber} (Yr {req.studentYear} / Sec {req.studentSection})
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{req.eventName}</span>
                        <span className="text-[11px] text-slate-500">{req.eventCategory} · {req.venue}</span>
                        {req.hasDateOverlap && (
                          <span className="inline-block mt-0.5 text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            ⚠ Date Overlap
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-800">{req.eventDate}</td>
                      <td className="p-4">
                        {elig.status === 'Eligible' && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                            Eligible ({elig.calculatedPercentage}%)
                          </span>
                        )}
                        {elig.status === 'Below Threshold' && (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[11px]">
                            Below Threshold ({elig.calculatedPercentage}%)
                          </span>
                        )}
                        {elig.status === 'Verification Required' && (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">
                            Hold ({elig.calculatedPercentage}%)
                          </span>
                        )}
                        {elig.status === 'Attendance Unavailable' && (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-bold text-[11px]">
                            Unavailable
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {req.proctorRecommendation === 'Recommended' && (
                          <span className="text-emerald-700 font-bold">Recommended</span>
                        )}
                        {req.proctorRecommendation === 'Rejected' && (
                          <span className="text-rose-700 font-bold">Rejected</span>
                        )}
                        {req.proctorRecommendation === 'Needs Clarification' && (
                          <span className="text-amber-700 font-bold">Needs Clarification</span>
                        )}
                        {!req.proctorRecommendation && (
                          <span className="text-slate-400 italic">Pending Verification</span>
                        )}
                      </td>
                      <td className="p-4 font-semibold">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px]">
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setRecommendation(req.proctorRecommendation || 'Recommended');
                            setRemarks(req.proctorRemarks || '');
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold transition-colors"
                        >
                          Verify & Recommend
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Comprehensive Verification & Recommendation Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600">{selectedRequest.requestId}</span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Proctor Dossier: {selectedRequest.studentName} — {selectedRequest.eventName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Mediator Attendance Intelligence Card */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                <span className="font-bold text-indigo-950 block">Official Attendance Intelligence (From Mediator)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-slate-400 block text-[10px]">Conducted / Attended</span>
                    <span className="font-bold text-slate-900">
                      {selectedRequest.eligibility.classesAttended} / {selectedRequest.eligibility.classesConducted}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-slate-400 block text-[10px]">Calculated Ratio</span>
                    <span className="font-bold text-indigo-600">
                      {selectedRequest.eligibility.calculatedPercentage ?? 'Unavailable'}%
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-indigo-100">
                    <span className="text-slate-400 block text-[10px]">Benchmark</span>
                    <span className="font-bold text-slate-900">
                      {selectedRequest.eligibility.configuredThreshold}%
                    </span>
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed pt-1">
                  {selectedRequest.eligibility.explanation}
                </p>
              </div>

              {/* Purpose & Benefits */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Purpose Submitted</span>
                  <p className="text-slate-800 mt-0.5">{selectedRequest.purpose}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Expected Benefits</span>
                  <p className="text-slate-800 mt-0.5">{selectedRequest.expectedBenefits}</p>
                </div>
              </div>

              {/* Date Overlap Alert */}
              {selectedRequest.hasDateOverlap && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>{selectedRequest.dateOverlapWarning}</span>
                </div>
              )}

              {/* Supporting Documents */}
              <div>
                <span className="font-bold text-slate-900 block mb-1">Attached Supporting Evidence</span>
                <div className="space-y-1">
                  {selectedRequest.supportingDocuments.map((doc, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-indigo-600" />
                        <span className="font-semibold text-slate-800">{doc.name}</span>
                      </div>
                      <span className="text-indigo-600 font-bold text-[11px] cursor-pointer hover:underline">
                        Verified Proof
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proctor Verification Checklist */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block">Proctor Quality Checks (Verify before submission)</span>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkIdentity}
                      onChange={(e) => setCheckIdentity(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                    />
                    <span className="text-slate-700">Student is authenticated mentee belonging to my assigned cohort.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkAttendance}
                      onChange={(e) => setCheckAttendance(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                    />
                    <span className="text-slate-700">Attendance record evaluated against 75% institutional requirement.</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkPurpose}
                      onChange={(e) => setCheckPurpose(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                    />
                    <span className="text-slate-700">Purpose is academic / technical and non-commercial.</span>
                  </label>
                </div>
              </div>

              {/* Recommendation Form */}
              <form onSubmit={handleSubmitReview} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900">Submit Proctor Recommendation</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Recommendation *</label>
                    <select
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-semibold"
                    >
                      <option value="Recommended">Recommended for Approval</option>
                      <option value="Rejected">Recommended for Rejection</option>
                      <option value="Needs Clarification">Return for Clarification / Correction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Proctor Identity</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.name}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-500 font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">
                    Proctor Recommendation Remarks {recommendation !== 'Recommended' && '*'}
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter academic remarks regarding attendance or competition merit..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Recommendation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
