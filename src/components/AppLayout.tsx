import React, { useState } from 'react';
import {
  Compass,
  FileCheck2,
  Users,
  FileSpreadsheet,
  CheckCircle,
  ClipboardList,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Bell,
  Search,
  UserCheck,
  ShieldAlert,
  Menu,
  X,
  LayoutDashboard,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { dataStore } from '../services/dataStore';

interface AppLayoutProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  setCurrentTab,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { currentUser, setRole, allRoles } = useAuth();

  const notifications = dataStore.getNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Unified Role-Specific Navigation matching all 3 dashboards
  const navItems = [
    // Student Dashboard items
    { id: 'student_dashboard', label: 'Student Portal & Events', icon: Compass, roles: ['student'] },
    
    // Proctor Dashboard items
    { id: 'proctor_dashboard', label: 'Proctor Verification Queue', icon: ClipboardList, roles: ['proctor'] },
    
    // Technical In-Charge Dashboard items
    { id: 'incharge_dashboard', label: 'Technical In-Charge Portal', icon: LayoutDashboard, roles: ['technical_incharge', 'admin'] },
    
    // Shared Supporting Administrative Modules
    { id: 'students', label: 'Student Master Database', icon: Users, roles: ['admin', 'technical_incharge', 'proctor'] },
    { id: 'import', label: 'Excel & CSV Import Center', icon: FileSpreadsheet, roles: ['admin', 'technical_incharge'] },
    { id: 'verification', label: 'Verification Queue', icon: CheckCircle, roles: ['admin', 'verifier', 'technical_incharge'] },
    { id: 'reports', label: 'Reports & Exports', icon: BarChart3, roles: ['admin', 'technical_incharge', 'proctor', 'verifier'] },
    { id: 'audit', label: 'System Audit Trail', icon: History, roles: ['admin', 'technical_incharge'] },
    { id: 'settings', label: 'Configuration & Thresholds', icon: Settings, roles: ['admin', 'technical_incharge'] },
  ];

  const visibleNav = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Top Navigation Bar with CampusGate Logo */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {/* Official CampusGate SVG Branding */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => {
            if (currentUser.role === 'student') setCurrentTab('student_dashboard');
            else if (currentUser.role === 'proctor') setCurrentTab('proctor_dashboard');
            else setCurrentTab('incharge_dashboard');
          }}>
            <svg className="w-10 h-10 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="48" height="48" rx="12" fill="url(#header-logo-bg)"/>
              <path d="M12 36V22C12 18.6863 14.6863 16 18 16H30C33.3137 16 36 18.6863 36 22V36" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M17 36V23C17 21.3431 18.3431 20 20 20H28C29.6569 20 31 21.3431 31 23V36" stroke="#93C5FD" stroke-width="2" stroke-linecap="round"/>
              <path d="M24 10L14 15L24 20L34 15L24 10Z" fill="#38BDF8"/>
              <path d="M34 15V21C34 21 32 23 32 24" stroke="#BAE6FD" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M21 28.5L23.5 31L27.5 26" stroke="#38BDF8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 36H39" stroke="#E2E8F0" stroke-width="2.5" stroke-linecap="round"/>
              <defs>
                <linearGradient id="header-logo-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0F172A"/>
                  <stop offset="1" stopColor="#1E3A8A"/>
                </linearGradient>
              </defs>
            </svg>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[#0F172A] tracking-tight text-lg">
                  Campus<span className="text-[#2563EB]">Gate</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block leading-none">
                Academic Event Permission Portal
              </p>
            </div>
          </div>
        </div>

        {/* Global Search & Active Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="hidden lg:flex items-center bg-slate-100 rounded-lg px-3 py-1.5 w-60 border border-slate-200/80 focus-within:border-indigo-500 focus-within:bg-white transition-all">
            <Search size={15} className="text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search events, requests..."
              className="bg-transparent text-xs w-full focus:outline-hidden text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Active Role Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="hidden sm:inline text-xs font-semibold text-slate-500 px-2 flex items-center gap-1">
              <UserCheck size={14} className="text-indigo-600" />
              Role:
            </span>
            <select
              value={currentUser.role}
              onChange={(e) => {
                const nextRole = e.target.value as UserRole;
                setRole(nextRole);
                if (nextRole === 'student') setCurrentTab('student_dashboard');
                else if (nextRole === 'proctor') setCurrentTab('proctor_dashboard');
                else if (nextRole === 'technical_incharge') setCurrentTab('incharge_dashboard');
                else setCurrentTab('incharge_dashboard');
              }}
              className="bg-white text-xs font-semibold text-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
            >
              {allRoles.map(r => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200/80 transition-colors"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">Notifications</span>
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} new
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      notifications.forEach(n => dataStore.markNotificationAsRead(n.id));
                      setShowNotifications(false);
                    }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 mt-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-sm text-slate-400">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => dataStore.markNotificationAsRead(n.id)}
                        className={`p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors ${!n.isRead ? 'bg-indigo-50/40' : ''}`}
                      >
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Badge */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left text-xs leading-tight hidden xl:block">
              <span className="font-semibold text-slate-900 block truncate max-w-[130px]">{currentUser.name}</span>
              <span className="text-slate-500 capitalize">{currentUser.role.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace with Collapsible Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between z-30
            ${collapsed ? 'w-20' : 'w-64'} 
            hidden md:flex`}
        >
          <div className="p-3">
            <div className="space-y-1">
              {visibleNav.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500'} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Collapse Toggle */}
          <div className="p-3 border-t border-slate-200">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors text-xs font-medium"
            >
              {collapsed ? <ChevronRight size={18} /> : (
                <>
                  <ChevronLeft size={18} />
                  <span>Collapse Menu</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
            <div className="w-72 bg-white h-full shadow-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                  <span className="font-bold text-slate-900">CampusGate Navigation</span>
                  <button onClick={() => setMobileOpen(false)} className="p-1 rounded-md text-slate-500">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-1">
                  {visibleNav.map(item => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setMobileOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                          isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
