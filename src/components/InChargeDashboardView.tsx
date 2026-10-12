import React, { useState } from 'react';
import {
  CalendarPlus,
  FileCheck2,
  ListFilter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Upload,
  Sliders,
  Eye,
  FileText,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  X,
  Edit,
  Trash2,
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { EventListing, EventCategory, EventStatus, EventRequestHandoff } from '../types';
import { useAuth } from '../context/AuthContext';

export const InChargeDashboardView: React.FC<{ onNavigateToImport?: () => void; onNavigateToSettings?: () => void }> = ({
  onNavigateToImport,
  onNavigateToSettings,
}) => {
  const { currentUser } = useAuth();
  const config = dataStore.getConfig();

  // Active sub-tab
  const [subTab, setSubTab] = useState<'overview' | 'manage_events' | 'approval_queue' | 'all_requests'>('overview');

  // Event Creation Form State
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [category, setCategory] = useState<EventCategory>('Hackathon');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [eligibilityCriteria, setEligibilityCriteria] = useState('Minimum 75% attendance. Active undergraduate engineering student.');
  const [requiredDocuments, setRequiredDocuments] = useState('Hackathon ID, College Enrollment Slip, Team Shortlist Letter');
  const [purposeAndBenefits, setPurposeAndBenefits] = useState('Direct product mentoring, university representation credits, prize opportunities.');
  const [externalUrl, setExternalUrl] = useState('');
  const [eventStatus, setEventStatus] = useState<EventStatus>('Published');

  // Final Decision Modal State
  const [selectedRequest, setSelectedRequest] = useState<EventRequestHandoff | null>(null);
  const [finalDecision, setFinalDecision] = useState<'Approved' | 'Rejected' | 'Returned for Correction'>('Approved');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [enableOverride, setEnableOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  // Live queries
  const events = dataStore.getEvents();
  const requests = dataStore.getEventRequests();
  const students = dataStore.getStudents();
  const importBatches = dataStore.getImportBatches();

  // Computed metrics
  const totalEventsCount = events.length;
  const publishedEventsCount = events.filter(e => e.status === 'Published').length;
  const draftEventsCount = events.filter(e => e.status === 'Draft').length;

  const totalRequestsCount = requests.length;
  const pendingFinalDecisionsCount = requests.filter(r => r.status === 'Pending Final Decision' || r.status === 'Recommended for Approval' || r.status === 'Recommended for Rejection').length;
  const pendingProctorCount = requests.filter(r => r.status === 'Under Proctor Review' || r.status === 'Submitted').length;
  const approvedRequestsCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedRequestsCount = requests.filter(r => r.status === 'Rejected').length;
  const returnedRequestsCount = requests.filter(r => r.status === 'Returned for Correction').length;

  // Search & Filter for All Requests table
  const [searchRequests, setSearchRequests] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredRequests = requests.filter(req => {
    if (filterDept !== 'all' && req.studentDepartment !== filterDept) return false;
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (searchRequests) {
      const q = searchRequests.toLowerCase();
      const match =
        req.studentName.toLowerCase().includes(q) ||
        req.rollNumber.toLowerCase().includes(q) ||
        req.eventName.toLowerCase().includes(q) ||
        req.requestId.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const uniqueDepts = Array.from(new Set(students.map(s => s.department)));

  // Handle Event Save (Create / Edit)
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      alert('Event End Date cannot be earlier than Start Date.');
      return;
    }

    const eventId = editingEventId || `EVT-${Date.now()}`;
    const newEvent: EventListing = {
      id: eventId,
      title: title.trim(),
      organizer: organizer.trim(),
      category,
      description: description.trim(),
      venue: venue.trim(),
      city: city.trim(),
      startDate,
      endDate,
      registrationDeadline,
      eligibilityCriteria: eligibilityCriteria.trim(),
      requiredDocuments: requiredDocuments.trim(),
      purposeAndBenefits: purposeAndBenefits.trim(),
      externalRegistrationUrl: externalUrl.trim() || undefined,
      bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
      status: eventStatus,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dataStore.saveEvent(newEvent, currentUser.name, currentUser.role);

    alert(`Event "${title}" successfully ${editingEventId ? 'updated' : 'created and ' + eventStatus.toLowerCase()}!`);
    setIsCreatingEvent(false);
    setEditingEventId(null);
    resetEventForm();
  };

  const resetEventForm = () => {
    setTitle('');
    setOrganizer('');
    setCategory('Hackathon');
    setDescription('');
    setVenue('');
    setCity('');
    setStartDate('');
    setEndDate('');
    setRegistrationDeadline('');
    setExternalUrl('');
    setEventStatus('Published');
  };

  // Open Edit Event
  const handleEditEvent = (ev: EventListing) => {
    setEditingEventId(ev.id);
    setTitle(ev.title);
    setOrganizer(ev.organizer);
    setCategory(ev.category);
    setDescription(ev.description);
    setVenue(ev.venue);
    setCity(ev.city);
    setStartDate(ev.startDate);
    setEndDate(ev.endDate);
    setRegistrationDeadline(ev.registrationDeadline);
    setEligibilityCriteria(ev.eligibilityCriteria);
    setRequiredDocuments(ev.requiredDocuments);
    setPurposeAndBenefits(ev.purposeAndBenefits);
    setExternalUrl(ev.externalRegistrationUrl || '');
    setEventStatus(ev.status);
    setIsCreatingEvent(true);
    setSubTab('manage_events');
  };

  // Handle Final Decision
  const handleCommitFinalDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (finalDecision === 'Rejected' && !decisionRemarks.trim()) {
      alert('Mandatory justification remarks required when rejecting an institutional permission request.');
      return;
    }

    if (enableOverride && !overrideReason.trim()) {
      alert('Mandatory justification reason required when executing an authorized administrative override.');
      return;
    }

    dataStore.updateTechnicalInchargeDecision(
      selectedRequest.requestId,
      finalDecision,
      decisionRemarks.trim() || (finalDecision === 'Approved' ? 'Official institutional permission pass sanctioned with on-duty attendance credit.' : 'Action requested.'),
      currentUser.name,
      enableOverride,
      enableOverride ? overrideReason.trim() : undefined
    );

    alert(`Final decision "${finalDecision}" recorded for ${selectedRequest.studentName}! Decision updated in real-time across student & proctor dashboards.`);
    setSelectedRequest(null);
    setDecisionRemarks('');
    setEnableOverride(false);
    setOverrideReason('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-7 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              TI
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold text-purple-300 bg-purple-950/70 px-2.5 py-0.5 rounded-md border border-purple-800/60">
                  Technical-Event In-Charge Clearance Authority
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Role: Final Institutional Decision Maker
                </span>
              </div>
              <h1 className="text-2xl font-extrabold mt-1 tracking-tight text-white">{currentUser.name}</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Technical Affairs & Hackathon Cell · Authority over publishing, attendance thresholds, and final clearances
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                resetEventForm();
                setIsCreatingEvent(true);
                setSubTab('manage_events');
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              + Create & Publish Event
            </button>
            {onNavigateToImport && (
              <button
                onClick={onNavigateToImport}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                Import Attendance
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top-Level Sub-Navigation Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setSubTab('overview')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            subTab === 'overview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overview & KPIs
        </button>
        <button
          onClick={() => setSubTab('approval_queue')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
            subTab === 'approval_queue' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Pending Final Decisions</span>
          {pendingFinalDecisionsCount > 0 && (
            <span className="bg-rose-500 text-white px-2 py-0.2 rounded-full text-[10px]">
              {pendingFinalDecisionsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab('manage_events')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            subTab === 'manage_events' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Manage Events ({totalEventsCount})
        </button>
        <button
          onClick={() => setSubTab('all_requests')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            subTab === 'all_requests' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Institutional Requests ({totalRequestsCount})
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB: OVERVIEW & LIVE METRICS
         ========================================================================= */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Published Events</span>
              <span className="text-2xl font-black text-indigo-600 mt-1 block">{publishedEventsCount}</span>
              <span className="text-[11px] text-slate-500">{draftEventsCount} in draft</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Requests</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{totalRequestsCount}</span>
              <span className="text-[11px] text-slate-500">Student submissions</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Proctor Stage</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">{pendingProctorCount}</span>
              <span className="text-[11px] text-amber-700">Awaiting mentor check</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Decision Queue</span>
              <span className="text-2xl font-black text-purple-600 mt-1 block">{pendingFinalDecisionsCount}</span>
              <span className="text-[11px] text-purple-700">Awaiting your sanction</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Approved</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{approvedRequestsCount}</span>
              <span className="text-[11px] text-emerald-700">Clearance pass issued</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Rejected / Corrections</span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">{rejectedRequestsCount + returnedRequestsCount}</span>
              <span className="text-[11px] text-rose-700">{returnedRequestsCount} returned</span>
            </div>
          </div>

          {/* Quick Action Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setSubTab('approval_queue')}
              className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl cursor-pointer hover:shadow-md transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-purple-700">
                <ShieldCheck size={24} />
                <span className="text-xs font-bold uppercase bg-purple-200/80 px-2 py-0.5 rounded">Action Queue</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Pending Final Sanctions ({pendingFinalDecisionsCount})</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Review proctor recommendations and execute final institutional clearance passes or reject with reasons.
              </p>
            </div>

            <div
              onClick={() => setSubTab('manage_events')}
              className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl cursor-pointer hover:shadow-md transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-indigo-700">
                <CalendarPlus size={24} />
                <span className="text-xs font-bold uppercase bg-indigo-200/80 px-2 py-0.5 rounded">Publishing</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Create & Manage Event Listings</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Publish upcoming hackathons, workshops, and symposiums. Managed events appear in the Student Event Explorer.
              </p>
            </div>

            <div
              onClick={onNavigateToImport}
              className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl cursor-pointer hover:shadow-md transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-emerald-700">
                <Upload size={24} />
                <span className="text-xs font-bold uppercase bg-emerald-200/80 px-2 py-0.5 rounded">Mediator Sync</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Attendance Import & Thresholds</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingest Excel/CSV spreadsheets. Last import: {importBatches[0]?.fileName || 'None'} ({importBatches[0]?.importedRows || 0} records).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB: PENDING FINAL DECISIONS QUEUE
         ========================================================================= */}
      {subTab === 'approval_queue' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Final Clearance & Approval Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Requests verified by mentors awaiting authoritative Institutional In-Charge clearance.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
              {pendingFinalDecisionsCount} Waiting for Final Decision
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Ref Code</th>
                  <th className="p-4">Student & Roll No</th>
                  <th className="p-4">Event Details</th>
                  <th className="p-4">Attendance & Freshness</th>
                  <th className="p-4">Proctor Recommendation</th>
                  <th className="p-4">Mentor Remarks</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.filter(r => r.status === 'Pending Final Decision' || r.status === 'Recommended for Approval' || r.status === 'Recommended for Rejection' || r.status === 'Under Proctor Review').map(req => (
                  <tr key={req.requestId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600">{req.requestId}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{req.studentName}</span>
                      <span className="font-mono text-slate-500 text-[11px]">{req.rollNumber} ({req.studentDepartment})</span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{req.eventName}</span>
                      <span className="text-[11px] text-slate-500">{req.eventCategory} · {req.eventDate}</span>
                    </td>
                    <td className="p-4">
                      <span className={`font-bold ${req.eligibility.calculatedPercentage && req.eligibility.calculatedPercentage >= config.minimumAttendanceThreshold ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {req.eligibility.calculatedPercentage ?? 'Unavailable'}%
                      </span>
                      <span className="text-[11px] text-slate-400 block">{req.eligibility.dataAsOf}</span>
                    </td>
                    <td className="p-4">
                      {req.proctorRecommendation === 'Recommended' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Recommended
                        </span>
                      )}
                      {req.proctorRecommendation === 'Rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Rejected by Proctor
                        </span>
                      )}
                      {!req.proctorRecommendation && (
                        <span className="text-slate-400 italic">Pending Proctor</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs">
                      {req.proctorRemarks ? `"${req.proctorRemarks}"` : 'None'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setFinalDecision('Approved');
                          setDecisionRemarks('');
                          setEnableOverride(false);
                          setOverrideReason('');
                        }}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs transition-colors"
                      >
                        Sanction Decision
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB: MANAGE EVENTS (CREATE, EDIT, PUBLISH)
         ========================================================================= */}
      {subTab === 'manage_events' && (
        <div className="space-y-6">
          {/* Create Event Drawer Form */}
          {isCreatingEvent ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingEventId ? 'Edit Event Listing' : 'Create & Publish New Event'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Events saved as 'Published' immediately appear in the student Explore Events portal.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreatingEvent(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Event Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Smart India Hackathon 2026..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Organizer Name *</label>
                    <input
                      type="text"
                      required
                      value={organizer}
                      onChange={(e) => setOrganizer(e.target.value)}
                      placeholder="e.g. AICTE / Ministry of Education..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-semibold"
                    >
                      <option value="Hackathon">Hackathon</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Conference">Conference</option>
                      <option value="Competitive Programming">Competitive Programming</option>
                      <option value="Industrial Visit">Industrial Visit</option>
                      <option value="Technical Competition">Technical Competition</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Venue / Institution *</label>
                    <input
                      type="text"
                      required
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="e.g. IIT Kharagpur Complex..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru, Hyderabad..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Registration Deadline *</label>
                    <input
                      type="date"
                      required
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide overview, format, problem statements..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">External Registration URL</label>
                    <input
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://organizer-portal.com/register"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Publishing Status *</label>
                    <select
                      value={eventStatus}
                      onChange={(e) => setEventStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-bold"
                    >
                      <option value="Published">Published (Live for Students)</option>
                      <option value="Draft">Draft (Saved only in In-Charge workspace)</option>
                      <option value="Closed">Closed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingEvent(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
                  >
                    Save & Publish Event
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">
                Managing {events.length} institutional listings
              </span>
              <button
                onClick={() => {
                  resetEventForm();
                  setIsCreatingEvent(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                + Add New Event Listing
              </button>
            </div>
          )}

          {/* Events Listings Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Event Code</th>
                    <th className="p-4">Title & Organizer</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Deadline</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map(ev => (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-600">{ev.id}</td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{ev.title}</span>
                        <span className="text-[11px] text-slate-500">{ev.organizer} · {ev.city}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{ev.category}</td>
                      <td className="p-4">{ev.startDate} to {ev.endDate}</td>
                      <td className="p-4 font-bold text-rose-600">{ev.registrationDeadline}</td>
                      <td className="p-4">
                        {ev.status === 'Published' && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            Published
                          </span>
                        )}
                        {ev.status === 'Draft' && (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                            Draft
                          </span>
                        )}
                        {ev.status === 'Closed' && (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                            Closed
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleEditEvent(ev)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB: ALL INSTITUTIONAL REQUESTS
         ========================================================================= */}
      {subTab === 'all_requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students, roll no, event title..."
                  value={searchRequests}
                  onChange={(e) => setSearchRequests(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold"
              >
                <option value="all">All Departments</option>
                {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Pending Final Decision">Pending Final Decision</option>
                <option value="Under Proctor Review">Under Proctor Review</option>
                <option value="Rejected">Rejected</option>
                <option value="Returned for Correction">Returned for Correction</option>
              </select>
            </div>

            <span className="text-slate-500 font-medium">
              {filteredRequests.length} matching requests
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Ref Code</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Event Title</th>
                  <th className="p-3">Attendance %</th>
                  <th className="p-3">Proctor Rec</th>
                  <th className="p-3">Final Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map(r => (
                  <tr key={r.requestId} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-indigo-600">{r.requestId}</td>
                    <td className="p-3 font-bold text-slate-900">{r.studentName} ({r.rollNumber})</td>
                    <td className="p-3 text-slate-600">{r.studentDepartment}</td>
                    <td className="p-3 font-medium text-slate-800">{r.eventName}</td>
                    <td className="p-3 font-bold">
                      {r.eligibility.calculatedPercentage ?? 'Unavailable'}%
                    </td>
                    <td className="p-3 font-semibold text-slate-700">
                      {r.proctorRecommendation || 'Pending'}
                    </td>
                    <td className="p-3">
                      {r.status === 'Approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Approved ({r.approvalReferenceNumber || 'Pass'})
                        </span>
                      )}
                      {r.status === 'Rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          Rejected
                        </span>
                      )}
                      {r.status !== 'Approved' && r.status !== 'Rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {r.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: FINAL DECISION & SANCTION CLEARANCE PASS
         ========================================================================= */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-purple-600">{selectedRequest.requestId}</span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Execute Institutional Decision: {selectedRequest.studentName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Event & Student Dossier */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Student</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedRequest.studentName} ({selectedRequest.rollNumber})</span>
                  <span className="text-slate-500 block text-[11px]">{selectedRequest.studentDepartment}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Event</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedRequest.eventName}</span>
                  <span className="text-slate-500 block text-[11px]">{selectedRequest.eventDate} ({selectedRequest.city})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Live Attendance Ratio</span>
                  <span className={`font-bold text-sm ${selectedRequest.eligibility.calculatedPercentage && selectedRequest.eligibility.calculatedPercentage >= config.minimumAttendanceThreshold ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedRequest.eligibility.calculatedPercentage ?? 'Unavailable'}% ({selectedRequest.eligibility.classesAttended}/{selectedRequest.eligibility.classesConducted} classes)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Proctor Recommendation</span>
                  <span className="font-bold text-sm text-indigo-700">
                    {selectedRequest.proctorRecommendation || 'Awaiting Review'}
                  </span>
                  <span className="text-slate-500 block text-[11px] italic">"{selectedRequest.proctorRemarks || 'No remarks'}"</span>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">Academic / Technical Purpose</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                  {selectedRequest.purpose}
                </p>
              </div>

              {/* Sanction Form */}
              <form onSubmit={handleCommitFinalDecision} className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
                <h3 className="font-bold text-purple-950">Authoritative Institutional Action</h3>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Final Clearance Decision *</label>
                  <select
                    value={finalDecision}
                    onChange={(e) => setFinalDecision(e.target.value as any)}
                    className="w-full bg-white border border-purple-200 rounded-lg p-2.5 text-slate-800 font-bold"
                  >
                    <option value="Approved">Approve (Grant Official Institutional Clearance Pass)</option>
                    <option value="Rejected">Reject (Decline Participation Permission)</option>
                    <option value="Returned for Correction">Return for Correction (Request Student Revision)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Official Clearance Remarks & Justification {finalDecision === 'Rejected' && '*'}
                  </label>
                  <textarea
                    rows={2}
                    value={decisionRemarks}
                    onChange={(e) => setDecisionRemarks(e.target.value)}
                    placeholder="Enter official sanction remarks or rejection reason..."
                    className="w-full bg-white border border-purple-200 rounded-lg p-2.5 text-slate-800"
                  />
                </div>

                {/* Exceptional Override Checkbox */}
                {selectedRequest.eligibility.status !== 'Eligible' && (
                  <div className="pt-2 border-t border-purple-200 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableOverride}
                        onChange={(e) => setEnableOverride(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300"
                      />
                      <span className="font-bold text-purple-900">
                        Execute Authorized Administrative Eligibility Override
                      </span>
                    </label>

                    {enableOverride && (
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Override Justification *</label>
                        <input
                          type="text"
                          required
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="e.g. Approved under Institutional Dean special research representation waiver..."
                          className="w-full bg-white border border-purple-300 rounded-lg p-2 text-slate-800"
                        />
                      </div>
                    )}
                  </div>
                )}

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
                    className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                  >
                    Authorize & Issue Decision
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
