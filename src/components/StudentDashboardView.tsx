import React, { useState } from 'react';
import {
  Compass,
  FileCheck2,
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Upload,
  ArrowRight,
  Info,
  ChevronRight,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { dataStore } from '../services/dataStore';
import { EventListing, EventCategory, EventRequestHandoff } from '../types';
import { useAuth } from '../context/AuthContext';

export const StudentDashboardView: React.FC<{ onNavigateToProfile?: () => void }> = () => {
  const { currentUser, currentStudentProfile } = useAuth();
  const config = dataStore.getConfig();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'explore' | 'my_requests'>('explore');

  // Search & Filter state for Explore Events
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  // Event Details Modal State
  const [selectedEvent, setSelectedEvent] = useState<EventListing | null>(null);

  // Permission Request Form Modal State
  const [requestEvent, setRequestEvent] = useState<EventListing | null>(null);
  const [purpose, setPurpose] = useState('');
  const [expectedBenefits, setExpectedBenefits] = useState('');
  const [externalEvidence, setExternalEvidence] = useState('');
  const [externalConfirmed, setExternalConfirmed] = useState(false);
  const [supportingDocs, setSupportingDocs] = useState<Array<{ name: string; url: string }>>([]);
  const [docNameInput, setDocNameInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<EventRequestHandoff | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // If student profile is missing, fallback cleanly
  const student = currentStudentProfile || (dataStore.getStudents()[0]);
  const attendance = dataStore.getAttendanceForStudent(student.rollNumber);
  const eligibility = dataStore.calculateEligibility(student, attendance);

  // Live queries
  const allEvents = dataStore.getEvents();
  const publishedEvents = allEvents.filter(e => e.status === 'Published');
  const myRequests = dataStore.getEventRequests().filter(r => r.rollNumber === student.rollNumber);

  // Filtered Events
  const filteredEvents = publishedEvents.filter(event => {
    if (selectedCategory !== 'all' && event.category !== selectedCategory) return false;
    if (selectedCity !== 'all' && event.city !== selectedCity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        event.title.toLowerCase().includes(q) ||
        event.organizer.toLowerCase().includes(q) ||
        event.venue.toLowerCase().includes(q) ||
        event.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const uniqueCities = Array.from(new Set(publishedEvents.map(e => e.city)));

  // Status counts for student summary
  const approvedCount = myRequests.filter(r => r.status === 'Approved').length;
  const pendingProctorCount = myRequests.filter(r => r.status === 'Under Proctor Review' || r.status === 'Submitted').length;
  const pendingFinalCount = myRequests.filter(r => r.status === 'Pending Final Decision' || r.status === 'Recommended for Approval').length;
  const returnedCount = myRequests.filter(r => r.status === 'Returned for Correction').length;
  const rejectedCount = myRequests.filter(r => r.status === 'Rejected').length;

  // Add sample document
  const handleAddDocument = () => {
    if (!docNameInput.trim()) return;
    setSupportingDocs([...supportingDocs, { name: docNameInput.trim(), url: '#' }]);
    setDocNameInput('');
  };

  // Submit Institutional Permission Request
  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEvent) return;

    if (!purpose.trim()) {
      setSubmissionError('Please provide the purpose of attending this event.');
      return;
    }
    if (!expectedBenefits.trim()) {
      setSubmissionError('Please outline the expected technical or academic benefits.');
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);

    const result = dataStore.submitEventRequest({
      eventId: requestEvent.id,
      student,
      purpose: purpose.trim(),
      expectedBenefits: expectedBenefits.trim(),
      externalRegistrationEvidence: externalEvidence.trim() || undefined,
      externalRegistrationConfirmed: externalConfirmed,
      supportingDocuments: supportingDocs.length > 0 ? supportingDocs : [{ name: 'Event_Brochure_Details.pdf', url: '#' }],
    });

    setSubmitting(false);

    if (result.error) {
      setSubmissionError(result.error);
    } else {
      setSubmissionSuccess(result.request);
      // Reset form
      setPurpose('');
      setExpectedBenefits('');
      setExternalEvidence('');
      setExternalConfirmed(false);
      setSupportingDocs([]);
    }
  };

  const handleWithdraw = (requestId: string) => {
    if (window.confirm('Are you sure you want to withdraw this permission request?')) {
      dataStore.withdrawEventRequest(requestId, student.name);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Student Hero Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-7 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-800/60">
                  Student Portal
                </span>
                <span className="text-xs text-slate-400 font-mono font-semibold">
                  Roll No: {student.rollNumber}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold mt-1 tracking-tight text-white">{student.name}</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                {student.department} · Year {student.academicYear} · Section {student.section} · Batch {student.admissionBatch}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Assigned Proctor / Mentor</span>
              <span className="text-sm font-bold text-cyan-300 block mt-0.5">{student.assignedProctorName}</span>
              <span className="text-[11px] text-slate-400">{student.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Live Attendance & Eligibility Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Official Institutional Attendance & Eligibility</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritatively calculated by the Mediator from the latest registrar spreadsheet import. Minimum benchmark: <strong>{config.minimumAttendanceThreshold}%</strong>.
            </p>
          </div>

          <div>
            {eligibility.status === 'Eligible' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                <CheckCircle2 size={16} /> Eligible for External Event Permissions
              </span>
            )}
            {eligibility.status === 'Below Threshold' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-xs">
                <XCircle size={16} /> Below Threshold ({eligibility.calculatedPercentage}%)
              </span>
            )}
            {eligibility.status === 'Verification Required' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
                <AlertTriangle size={16} /> Verification Clearance In Progress
              </span>
            )}
            {eligibility.status === 'Attendance Unavailable' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
                <HelpCircle size={16} /> Attendance Unavailable
              </span>
            )}
          </div>
        </div>

        {/* 4 Stats Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Classes Conducted</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{eligibility.classesConducted}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Classes Attended</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{eligibility.classesAttended}</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Calculated Percentage</span>
            <span className={`text-2xl font-black mt-1 block ${eligibility.calculatedPercentage && eligibility.calculatedPercentage >= config.minimumAttendanceThreshold ? 'text-emerald-600' : 'text-rose-600'}`}>
              {eligibility.calculatedPercentage !== null ? `${eligibility.calculatedPercentage}%` : 'Unavailable'}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <span className="text-[11px] font-bold uppercase text-slate-400 block">Required Benchmark</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">{config.minimumAttendanceThreshold}%</span>
          </div>
        </div>

        {/* Explainability Callout */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs flex items-start gap-2.5">
          <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-indigo-950 block">Explainable Eligibility Result:</span>
            <p className="text-slate-700 leading-relaxed mt-0.5">{eligibility.explanation}</p>
            <div className="mt-1.5 flex items-center gap-4 text-[11px] text-slate-400">
              <span>Data As Of: {eligibility.dataAsOf}</span>
              <span>Rule Engine Version: {eligibility.ruleVersion}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Dashboard Metric Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Published Events</span>
          <span className="text-xl font-black text-indigo-600 mt-1 block">{publishedEvents.length}</span>
          <span className="text-[10px] text-slate-500">Available to join</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">My Requests</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{myRequests.length}</span>
          <span className="text-[10px] text-slate-500">Total submitted</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Proctor Review</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{pendingProctorCount}</span>
          <span className="text-[10px] text-amber-700">Under mentor check</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Pending In-Charge</span>
          <span className="text-xl font-black text-purple-600 mt-1 block">{pendingFinalCount}</span>
          <span className="text-[10px] text-purple-700">Awaiting sanction</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Approved</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{approvedCount}</span>
          <span className="text-[10px] text-emerald-700">Official pass issued</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 block">Returned / Rejected</span>
          <span className="text-xl font-black text-rose-600 mt-1 block">{returnedCount + rejectedCount}</span>
          <span className="text-[10px] text-rose-700">{returnedCount} need correction</span>
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('explore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeSubTab === 'explore'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Compass size={16} />
          <span>Explore Published Events ({publishedEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('my_requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeSubTab === 'my_requests'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileCheck2 size={16} />
          <span>My Event Registrations & Requests ({myRequests.length})</span>
          {returnedCount > 0 && (
            <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px]">
              {returnedCount} action
            </span>
          )}
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB 1: EXPLORE EVENTS
         ========================================================================= */}
      {activeSubTab === 'explore' && (
        <div className="space-y-6">
          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
              <div className="relative flex-1 min-w-[220px]">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search events by title, organizer, venue, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold"
              >
                <option value="all">All Categories</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Workshop">Workshop</option>
                <option value="Conference">Conference</option>
                <option value="Competitive Programming">Competitive Programming</option>
                <option value="Industrial Visit">Industrial Visit</option>
                <option value="Technical Competition">Technical Competition</option>
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-semibold"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <span className="text-slate-500 font-medium">
              Showing {filteredEvents.length} events
            </span>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => {
              // Check if student has an existing request for this event
              const existingReq = myRequests.find(r => r.eventId === event.id && r.status !== 'Withdrawn');

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col overflow-hidden group"
                >
                  {/* Event Banner */}
                  <div className="h-40 relative overflow-hidden bg-slate-100">
                    <img
                      src={event.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60'}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-xs shadow-xs">
                        {event.category}
                      </span>
                    </div>
                    {existingReq && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white shadow-xs">
                          {existingReq.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-[11px] text-slate-400 font-semibold mb-1">
                        Organizer: {event.organizer}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                        {event.description}
                      </p>

                      <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar size={13} className="text-slate-400 shrink-0" />
                          <span>{event.startDate} to {event.endDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span>{event.venue}, {event.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-rose-500 shrink-0" />
                          <span className="text-rose-600 font-medium">Apply before: {event.registrationDeadline}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Details
                      </button>

                      {existingReq ? (
                        <button
                          onClick={() => setActiveSubTab('my_requests')}
                          className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          View Request
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setRequestEvent(event);
                            setSubmissionSuccess(null);
                            setSubmissionError(null);
                          }}
                          className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                        >
                          Request Permission
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: MY REGISTRATIONS & REQUESTS
         ========================================================================= */}
      {activeSubTab === 'my_requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">My Institutional Permission Requests</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track status across Assigned Proctor Verification and Technical In-Charge Sanction.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Reference ID</th>
                  <th className="p-4">Event Details</th>
                  <th className="p-4">Dates & Venue</th>
                  <th className="p-4">Attendance Eligibility</th>
                  <th className="p-4">Proctor Review</th>
                  <th className="p-4">Final In-Charge Decision</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      You have not submitted any event permission requests yet. Explore events to apply.
                    </td>
                  </tr>
                ) : (
                  myRequests.map(req => (
                    <tr key={req.requestId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-600">
                        {req.requestId}
                        {req.approvalReferenceNumber && (
                          <span className="block text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
                            Pass: {req.approvalReferenceNumber}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{req.eventName}</span>
                        <span className="text-[11px] text-slate-500">{req.eventCategory} · {req.organizer}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-slate-800 block">{req.eventDate}</span>
                        <span className="text-[11px] text-slate-500">{req.venue}, {req.city}</span>
                        {req.hasDateOverlap && (
                          <span className="inline-block mt-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            ⚠ Date overlap detected
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {req.eligibility.status === 'Eligible' && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                            Eligible ({req.eligibility.calculatedPercentage}%)
                          </span>
                        )}
                        {req.eligibility.status === 'Below Threshold' && (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[11px]">
                            Below Threshold ({req.eligibility.calculatedPercentage}%)
                          </span>
                        )}
                        {req.eligibility.status === 'Verification Required' && (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">
                            In Review ({req.eligibility.calculatedPercentage}%)
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold block text-slate-900">
                          {req.proctorRecommendation || 'Awaiting Review'}
                        </span>
                        {req.proctorRemarks && (
                          <span className="text-[11px] text-slate-500 italic block mt-0.5">
                            "{req.proctorRemarks}"
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {req.status === 'Approved' && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                            Approved
                          </span>
                        )}
                        {req.status === 'Rejected' && (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold text-[11px]">
                            Rejected
                          </span>
                        )}
                        {req.status === 'Returned for Correction' && (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[11px]">
                            Needs Correction
                          </span>
                        )}
                        {req.status === 'Pending Final Decision' && (
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full font-bold text-[11px]">
                            Pending Sanction
                          </span>
                        )}
                        {req.status === 'Under Proctor Review' && (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-[11px]">
                            Proctor Review
                          </span>
                        )}
                        {req.technicalInchargeRemarks && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            In-Charge: "{req.technicalInchargeRemarks}"
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {(req.status === 'Draft' || req.status === 'Submitted' || req.status === 'Under Proctor Review' || req.status === 'Returned for Correction') && (
                          <button
                            onClick={() => handleWithdraw(req.requestId)}
                            className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold"
                          >
                            Withdraw
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: EVENT DETAILS DIALOG
         ========================================================================= */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">{selectedEvent.category}</span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedEvent.title}</h2>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Description</span>
                <p className="text-slate-700 mt-1 leading-relaxed">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Organizer</span>
                  <span className="font-bold text-slate-900">{selectedEvent.organizer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dates</span>
                  <span className="font-bold text-slate-900">{selectedEvent.startDate} to {selectedEvent.endDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Venue & City</span>
                  <span className="font-bold text-slate-900">{selectedEvent.venue}, {selectedEvent.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Registration Deadline</span>
                  <span className="font-bold text-rose-600">{selectedEvent.registrationDeadline}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold">Eligibility Criteria</span>
                <p className="text-slate-700 mt-0.5">{selectedEvent.eligibilityCriteria}</p>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold">Required Supporting Documents</span>
                <p className="text-slate-700 mt-0.5">{selectedEvent.requiredDocuments}</p>
              </div>

              {selectedEvent.externalRegistrationUrl && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-900 block">External Event Registration Link</span>
                    <span className="text-blue-700 text-[11px]">Register directly on organizer portal if required.</span>
                  </div>
                  <a
                    href={selectedEvent.externalRegistrationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                  >
                    <span>External Portal</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const ev = selectedEvent;
                  setSelectedEvent(null);
                  setRequestEvent(ev);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors"
              >
                Proceed to Request Permission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: INSTITUTIONAL PERMISSION REQUEST FORM
         ========================================================================= */}
      {requestEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Institutional Clearance Request</span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">Apply for Permission: {requestEvent.title}</h2>
              </div>
              <button
                onClick={() => {
                  setRequestEvent(null);
                  setSubmissionSuccess(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {submissionSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Request Successfully Submitted!</h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Your institutional permission application has been assigned reference code{' '}
                    <strong className="font-mono text-indigo-600">{submissionSuccess.requestId}</strong>.
                    It is now routed to your assigned mentor, <strong>{student.assignedProctorName}</strong>, for attendance and document verification.
                  </p>
                  <button
                    onClick={() => {
                      setRequestEvent(null);
                      setSubmissionSuccess(null);
                      setActiveSubTab('my_requests');
                    }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-xs"
                  >
                    View in My Registrations
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  {/* Error Notification */}
                  {submissionError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold flex items-center gap-2">
                      <AlertTriangle size={16} />
                      <span>{submissionError}</span>
                    </div>
                  )}

                  {/* Prefilled Profile & Live Attendance Banner */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block">Applicant Verification Snapshot</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Student Name</span>
                        <span className="font-bold text-slate-800">{student.name} ({student.rollNumber})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Cohort / Section</span>
                        <span className="font-bold text-slate-800">Year {student.academicYear} · Sec {student.section}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Live Attendance</span>
                        <span className={`font-bold ${eligibility.calculatedPercentage && eligibility.calculatedPercentage >= config.minimumAttendanceThreshold ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {eligibility.calculatedPercentage ?? 'Unavailable'}% ({eligibility.status})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Field: Purpose */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Purpose of Attending *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g. Presenting paper on Neural Architecture Search / Participating in 36-hr hardware hackathon..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Field: Expected Benefits */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Expected Technical or Academic Benefits *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={expectedBenefits}
                      onChange={(e) => setExpectedBenefits(e.target.value)}
                      placeholder="e.g. National representation credits, interaction with Google engineers, patent prototyping..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* External Registration Link & Confirmation */}
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                    <span className="font-bold text-blue-900 block">External Event Registration Details</span>
                    <p className="text-[11px] text-blue-700">
                      * Distinct action: Registering with the event organizer is separate from college on-duty clearance.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={externalEvidence}
                        onChange={(e) => setExternalEvidence(e.target.value)}
                        placeholder="External registration ID or confirmation number (optional)..."
                        className="flex-1 bg-white border border-blue-200 rounded-lg p-2 text-slate-800 text-xs"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={externalConfirmed}
                        onChange={(e) => setExternalConfirmed(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <span className="text-[11px] text-slate-700 font-medium">
                        I have separately submitted my registration on the official event organizer platform.
                      </span>
                    </label>
                  </div>

                  {/* Supporting Documents */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Attach Supporting Invitation / Document Name
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={docNameInput}
                        onChange={(e) => setDocNameInput(e.target.value)}
                        placeholder="e.g. SIH_Shortlist_Letter.pdf"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={handleAddDocument}
                        className="px-3 py-2 bg-slate-800 text-white rounded-lg font-semibold"
                      >
                        + Add File
                      </button>
                    </div>

                    <div className="mt-2 space-y-1">
                      {supportingDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-100 rounded-lg text-slate-700 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <FileText size={13} className="text-indigo-600" />
                            <span>{doc.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSupportingDocs(supportingDocs.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRequestEvent(null)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                    >
                      {submitting ? 'Submitting...' : 'Submit Institutional Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
