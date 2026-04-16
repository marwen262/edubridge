import React, { useState } from 'react';
import {
  Users,
  Building2,
  FileText,
  Clock,
  Activity,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Eye,
  MoreVertical,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';

export function AdminDashboard() {
  const [userFilter, setUserFilter] = useState<'All' | 'Candidates' | 'Institutions'>('All');

  const user = {
    name: 'Admin User',
    role: 'Platform Administrator',
  };

  const stats = [
    { label: 'Total Users', value: '2,486', icon: Users, color: 'var(--edu-indigo)' },
    { label: 'Institutions', value: '184', icon: Building2, color: 'var(--edu-blue)' },
    { label: 'Active Programs', value: '1,247', icon: FileText, color: 'var(--edu-info)' },
    { label: 'Pending Decisions', value: '23', icon: Clock, color: 'var(--edu-warning)' },
    { label: 'System Health', value: 'OK', icon: Activity, color: 'var(--edu-success)' },
  ];

  // Decisions to relay
  const pendingDecisions = [
    {
      candidate: 'Sarah Johnson',
      program: 'MSc Computer Science',
      institution: 'MIT',
      decision: 'Accepted' as const,
      receivedAt: '2 hours ago',
    },
    {
      candidate: 'Ahmed Hassan',
      program: 'PhD in AI',
      institution: 'Stanford University',
      decision: 'More info needed' as const,
      receivedAt: '5 hours ago',
    },
    {
      candidate: 'Maria Garcia',
      program: 'MBA Program',
      institution: 'Harvard Business School',
      decision: 'Accepted' as const,
      receivedAt: '1 day ago',
    },
    {
      candidate: 'Yuki Tanaka',
      program: 'MSc Robotics',
      institution: 'ETH Zurich',
      decision: 'Rejected' as const,
      receivedAt: '1 day ago',
    },
  ];

  // Users table
  const allUsers = [
    {
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      role: 'Candidate',
      status: 'Active' as const,
      joined: '2026-01-15',
    },
    {
      name: 'MIT Admissions',
      email: 'admissions@mit.edu',
      role: 'Institution',
      status: 'Active' as const,
      joined: '2025-09-10',
    },
    {
      name: 'Ahmed Hassan',
      email: 'ahmed.h@email.com',
      role: 'Candidate',
      status: 'Active' as const,
      joined: '2026-02-03',
    },
    {
      name: 'Stanford University',
      email: 'admissions@stanford.edu',
      role: 'Institution',
      status: 'Active' as const,
      joined: '2025-08-22',
    },
    {
      name: 'John Smith',
      email: 'john.s@email.com',
      role: 'Candidate',
      status: 'Inactive' as const,
      joined: '2026-03-12',
    },
    {
      name: 'Spam Account',
      email: 'spam@fake.com',
      role: 'Candidate',
      status: 'Banned' as const,
      joined: '2026-04-01',
    },
  ];

  const filteredUsers = allUsers.filter((u) => {
    if (userFilter === 'All') return true;
    if (userFilter === 'Candidates') return u.role === 'Candidate';
    if (userFilter === 'Institutions') return u.role === 'Institution';
    return true;
  });

  // Charts data
  const registrationsData = [
    { month: 'Nov', users: 120 },
    { month: 'Dec', users: 180 },
    { month: 'Jan', users: 240 },
    { month: 'Feb', users: 310 },
    { month: 'Mar', users: 420 },
    { month: 'Apr', users: 580 },
  ];

  const roleDistribution = [
    { name: 'Candidates', value: 2280, color: '#5E5CE6' },
    { name: 'Institutions', value: 184, color: '#0071E3' },
    { name: 'Admins', value: 22, color: '#FF9500' },
  ];

  const applicationsByCountry = [
    { country: 'USA', applications: 420 },
    { country: 'UK', applications: 310 },
    { country: 'Germany', applications: 280 },
    { country: 'France', applications: 240 },
    { country: 'Canada', applications: 195 },
    { country: 'Japan', applications: 130 },
  ];

  // Flagged reports
  const flags = [
    {
      type: 'Suspicious activity',
      description: 'Multiple failed login attempts on institution account',
      severity: 'high',
      time: '15 min ago',
    },
    {
      type: 'Inappropriate content',
      description: 'Program description flagged by 3 users',
      severity: 'medium',
      time: '2 hours ago',
    },
    {
      type: 'Document mismatch',
      description: 'Candidate documents do not match profile',
      severity: 'low',
      time: '1 day ago',
    },
  ];

  const severityColor = {
    high: 'var(--edu-danger)',
    medium: 'var(--edu-warning)',
    low: 'var(--edu-info)',
  };

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar role="admin" user={user} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-1">
                Admin Control Panel
              </h1>
              <p className="text-[var(--edu-text-secondary)]">
                Manage the entire EduBridge platform
              </p>
            </div>

            <Button
              className="rounded-full text-white"
              style={{ backgroundColor: 'var(--edu-indigo)' }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Institution Account
            </Button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Decisions Relay Queue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                  Decisions Relay Queue
                </h2>
                <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
                  Decisions received from institutions awaiting forwarding to candidates
                </p>
              </div>
              <Button variant="ghost" className="text-[var(--edu-indigo)]">
                View all
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="space-y-3">
              {pendingDecisions.map((d, i) => (
                <div
                  key={i}
                  className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--edu-indigo)15' }}
                  >
                    <Send className="w-6 h-6" style={{ color: 'var(--edu-indigo)' }} />
                  </div>

                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-[var(--edu-text-tertiary)] mb-1">Candidate</p>
                      <p className="font-semibold text-[var(--edu-text-primary)] truncate">
                        {d.candidate}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--edu-text-tertiary)] mb-1">Program</p>
                      <p className="font-medium text-[var(--edu-text-primary)] truncate">
                        {d.program}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--edu-text-tertiary)] mb-1">Institution</p>
                      <p className="font-medium text-[var(--edu-text-secondary)] truncate">
                        {d.institution}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--edu-text-tertiary)] mb-1">Decision</p>
                      <StatusBadge status={d.decision} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-[var(--edu-text-tertiary)] mr-2">
                      {d.receivedAt}
                    </span>
                    <Button
                      size="sm"
                      className="rounded-full text-white"
                      style={{ backgroundColor: 'var(--edu-indigo)' }}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Forward
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Users Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                Users Management
              </h2>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-4">
              {(['All', 'Candidates', 'Institutions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setUserFilter(tab)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={
                    userFilter === tab
                      ? { backgroundColor: 'var(--edu-indigo)', color: 'white' }
                      : {
                          backgroundColor: 'var(--edu-surface)',
                          color: 'var(--edu-text-secondary)',
                        }
                  }
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--edu-surface)]">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Name
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Email
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Role
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Joined
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--edu-divider)]">
                    {filteredUsers.map((u, i) => (
                      <tr key={i} className="hover:bg-[var(--edu-surface)] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--edu-blue)] to-[var(--edu-indigo)] flex items-center justify-center text-white text-sm font-semibold">
                              {u.name.charAt(0)}
                            </div>
                            <p className="font-medium text-[var(--edu-text-primary)]">{u.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-[var(--edu-text-secondary)]">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-secondary)]">{u.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-secondary)]">
                            {new Date(u.joined).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Analytics: 3 charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">
              Platform Analytics
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Registrations line chart */}
              <div className="glass-card rounded-2xl p-6 lg:col-span-2">
                <h3 className="font-semibold text-[var(--edu-text-primary)] mb-4">
                  Registrations Over Time
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={registrationsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--edu-divider)" />
                    <XAxis
                      dataKey="month"
                      stroke="var(--edu-text-tertiary)"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="var(--edu-text-tertiary)" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid var(--edu-border)',
                        borderRadius: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="var(--edu-indigo)"
                      strokeWidth={3}
                      dot={{ fill: 'var(--edu-indigo)', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Role donut chart */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-[var(--edu-text-primary)] mb-4">
                  Role Distribution
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid var(--edu-border)',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Applications by country bar */}
              <div className="glass-card rounded-2xl p-6 lg:col-span-3">
                <h3 className="font-semibold text-[var(--edu-text-primary)] mb-4">
                  Applications per Country
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={applicationsByCountry}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--edu-divider)" />
                    <XAxis
                      dataKey="country"
                      stroke="var(--edu-text-tertiary)"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis stroke="var(--edu-text-tertiary)" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid var(--edu-border)',
                        borderRadius: '12px',
                      }}
                    />
                    <Bar dataKey="applications" fill="var(--edu-indigo)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Flags & Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">
              Flags & Reports
            </h2>

            <div className="space-y-3">
              {flags.map((f, i) => (
                <div
                  key={i}
                  className="glass-card rounded-2xl p-5 flex items-center gap-4 border-l-4"
                  style={{ borderLeftColor: severityColor[f.severity as keyof typeof severityColor] }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${severityColor[f.severity as keyof typeof severityColor]}15`,
                    }}
                  >
                    <AlertTriangle
                      className="w-6 h-6"
                      style={{ color: severityColor[f.severity as keyof typeof severityColor] }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-[var(--edu-text-primary)]">{f.type}</p>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase"
                        style={{
                          backgroundColor: `${severityColor[f.severity as keyof typeof severityColor]}15`,
                          color: severityColor[f.severity as keyof typeof severityColor],
                        }}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--edu-text-secondary)]">{f.description}</p>
                    <p className="text-xs text-[var(--edu-text-tertiary)] mt-1">{f.time}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" className="rounded-full">
                      <Eye className="w-4 h-4 mr-1" />
                      Investigate
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <XCircle className="w-4 h-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
