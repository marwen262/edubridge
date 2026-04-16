import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  FileText,
  Users,
  Clock,
  Send,
  Plus,
  ChevronRight,
  TrendingUp,
  MoreVertical,
  Edit,
  Copy,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';

export function InstitutionDashboard() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const user = {
    name: 'MIT Admissions',
    role: 'Massachusetts Institute of Technology',
  };

  const stats = [
    { label: 'Published Programs', value: '24', icon: FileText, color: 'var(--edu-blue)' },
    { label: 'New Requests', value: '18', icon: Users, color: 'var(--edu-info)' },
    { label: 'Under Review', value: '7', icon: Clock, color: 'var(--edu-warning)' },
    { label: 'Decisions Sent', value: '42', icon: Send, color: 'var(--edu-success)' },
  ];

  // Kanban pipeline
  const pipelineColumns = [
    {
      id: 'new',
      title: 'New',
      color: 'var(--edu-info)',
      cards: [
        { name: 'Sarah Johnson', program: 'MSc Computer Science', date: '2026-04-12' },
        { name: 'Ahmed Hassan', program: 'PhD in AI', date: '2026-04-13' },
        { name: 'Maria Garcia', program: 'MBA Program', date: '2026-04-14' },
      ],
    },
    {
      id: 'review',
      title: 'Under review',
      color: 'var(--edu-warning)',
      cards: [
        { name: 'John Smith', program: 'MSc Data Science', date: '2026-04-08' },
        { name: 'Yuki Tanaka', program: 'MSc Robotics', date: '2026-04-10' },
      ],
    },
    {
      id: 'interview',
      title: 'Interview',
      color: 'var(--edu-blue)',
      cards: [{ name: 'Lisa Chen', program: 'PhD in Bioengineering', date: '2026-04-05' }],
    },
    {
      id: 'sent',
      title: 'Decision sent to admin',
      color: 'var(--edu-success)',
      cards: [
        { name: 'David Kim', program: 'MSc Computer Science', date: '2026-04-02' },
        { name: 'Emma Wilson', program: 'MBA Program', date: '2026-04-01' },
      ],
    },
  ];

  // Programs table
  const programs = [
    {
      title: 'Master of Science in Computer Science',
      level: 'Master',
      status: 'Published' as const,
      applicants: 124,
      deadline: '2026-06-15',
    },
    {
      title: 'Bachelor of Business Administration',
      level: 'Bachelor',
      status: 'Published' as const,
      applicants: 89,
      deadline: '2026-07-01',
    },
    {
      title: 'PhD in Artificial Intelligence',
      level: 'PhD',
      status: 'Published' as const,
      applicants: 47,
      deadline: '2026-05-30',
    },
    {
      title: 'MSc Data Science',
      level: 'Master',
      status: 'Draft' as const,
      applicants: 0,
      deadline: '2026-08-15',
    },
    {
      title: 'MBA Program',
      level: 'Master',
      status: 'Closed' as const,
      applicants: 156,
      deadline: '2026-03-01',
    },
  ];

  // Trend chart data
  const trendData = [
    { day: 'Apr 1', applications: 8 },
    { day: 'Apr 5', applications: 14 },
    { day: 'Apr 9', applications: 11 },
    { day: 'Apr 13', applications: 22 },
    { day: 'Apr 17', applications: 18 },
    { day: 'Apr 21', applications: 27 },
    { day: 'Apr 25', applications: 31 },
    { day: 'Apr 29', applications: 26 },
  ];

  // Activity feed
  const activities = [
    { icon: Users, text: 'New application from Sarah Johnson', time: '2 min ago', color: 'var(--edu-blue)' },
    { icon: Send, text: 'Decision sent to admin for David Kim', time: '1 hour ago', color: 'var(--edu-success)' },
    { icon: MessageSquare, text: 'New message from EduBridge admin', time: '3 hours ago', color: 'var(--edu-info)' },
    { icon: FileText, text: 'Program "MSc Robotics" published', time: '1 day ago', color: 'var(--edu-blue)' },
    { icon: Users, text: '12 new applications received', time: '2 days ago', color: 'var(--edu-blue)' },
  ];

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar role="institution" user={user} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-1">
                {user.role} — Dashboard
              </h1>
              <p className="text-[var(--edu-text-secondary)]">{currentDate}</p>
            </div>

            <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
              <Plus className="w-5 h-5 mr-2" />
              Create new program
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          {/* Admission Requests Pipeline (Kanban) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                Admission Requests Pipeline
              </h2>
              <Link to="/dashboard/institution/requests">
                <Button variant="ghost" className="text-[var(--edu-blue)]">
                  View all
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pipelineColumns.map((col) => (
                <div key={col.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                      <h3 className="font-semibold text-[var(--edu-text-primary)] text-sm">
                        {col.title}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-[var(--edu-text-tertiary)] bg-[var(--edu-surface)] px-2 py-1 rounded-full">
                      {col.cards.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {col.cards.map((card, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-[#1D1D1F] rounded-xl p-3 border border-[var(--edu-border)] hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--edu-blue)] to-[var(--edu-indigo)] flex items-center justify-center text-white text-xs font-semibold">
                            {card.name.charAt(0)}
                          </div>
                          <p className="text-sm font-semibold text-[var(--edu-text-primary)] truncate">
                            {card.name}
                          </p>
                        </div>
                        <p className="text-xs text-[var(--edu-text-secondary)] mb-1 line-clamp-1">
                          {card.program}
                        </p>
                        <p className="text-xs text-[var(--edu-text-tertiary)]">
                          {new Date(card.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Programs Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">My Programs</h2>
              <Link to="/dashboard/institution/programs">
                <Button variant="ghost" className="text-[var(--edu-blue)]">
                  Manage all
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--edu-surface)]">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Title
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Level
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Applicants
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Deadline
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--edu-divider)]">
                    {programs.map((p, i) => (
                      <tr key={i} className="hover:bg-[var(--edu-surface)] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-[var(--edu-text-primary)]">{p.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-secondary)]">{p.level}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-[var(--edu-text-primary)]">
                            {p.applicants}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[var(--edu-text-secondary)]">
                            {new Date(p.deadline).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Two Column: Trend + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Applications trend chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">
                  Applications Trend
                </h2>
                <div className="flex items-center gap-2 text-sm text-[var(--edu-success)] font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  +18% this month
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--edu-divider)" />
                    <XAxis
                      dataKey="day"
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
                      dataKey="applications"
                      stroke="var(--edu-blue)"
                      strokeWidth={3}
                      dot={{ fill: 'var(--edu-blue)', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">
                Recent Activity
              </h2>
              <div className="glass-card rounded-2xl p-6 space-y-4">
                {activities.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${a.color}15` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: a.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--edu-text-primary)] mb-1">
                          {a.text}
                        </p>
                        <p className="text-xs text-[var(--edu-text-tertiary)]">{a.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
