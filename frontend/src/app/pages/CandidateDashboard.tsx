import React from 'react';
import { Link } from 'react-router';
import { FileText, Clock, CheckCircle, Heart, Upload, MessageSquare, Calendar, ChevronRight, Search } from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { ProgramCard } from '../components/ProgramCard';
import { Button } from '../components/ui/button';
import { mockApplications, mockPrograms } from '../data/mockData';
import { motion } from 'motion/react';

export function CandidateDashboard() {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const user = {
    name: 'Sarah Johnson',
    role: "Bachelor's in Computer Science",
  };

  const stats = [
    { label: 'Applications Submitted', value: '2', icon: FileText },
    { label: 'Under Review', value: '1', icon: Clock },
    { label: 'Decisions Received', value: '0', icon: CheckCircle },
    { label: 'Saved Programs', value: '5', icon: Heart },
  ];

  const upcomingDeadlines = [
    { program: 'Master in Data Science', institution: 'Stanford University', deadline: '2026-05-15', daysLeft: 31 },
    { program: 'MBA Program', institution: 'Harvard Business School', deadline: '2026-06-01', daysLeft: 48 },
    { program: 'PhD in AI', institution: 'MIT', deadline: '2026-06-15', daysLeft: 62 },
  ];

  const recentMessages = [
    {
      from: 'EduBridge Admin',
      subject: 'Application status update',
      preview: 'Your application to MIT has been forwarded to the institution...',
      time: '2 hours ago',
      unread: true,
    },
    {
      from: 'EduBridge Admin',
      subject: 'Document verification complete',
      preview: 'All your uploaded documents have been verified...',
      time: '1 day ago',
      unread: false,
    },
  ];

  const recommendedPrograms = mockPrograms.slice(0, 3);

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar role="candidate" user={user} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-1">
                Good morning, {user.name.split(' ')[0]} 👋
              </h1>
              <p className="text-[var(--edu-text-secondary)]">{currentDate}</p>
            </div>

            <Link to="/search">
              <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                <Search className="w-5 h-5 mr-2" />
                Explore Programs
              </Button>
            </Link>
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

          {/* My Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">My Applications</h2>
              <Link to="/dashboard/candidate/applications">
                <Button variant="ghost" className="text-[var(--edu-blue)]">
                  View all
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
                        Program
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Institution
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Submitted
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Status
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-[var(--edu-text-primary)]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--edu-divider)]">
                    {mockApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-[var(--edu-surface)] transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-[var(--edu-text-primary)]">{app.programTitle}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[var(--edu-text-secondary)]">{app.institutionName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[var(--edu-text-secondary)]">
                            {new Date(app.submittedDate).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="text-[var(--edu-blue)]">
                            View details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Deadlines */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Upcoming Deadlines</h2>
              <div className="glass-card rounded-2xl p-6 space-y-4">
                {upcomingDeadlines.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'var(--edu-warning)15' }}
                    >
                      <Calendar className="w-6 h-6 text-[var(--edu-warning)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--edu-text-primary)] mb-1">{item.program}</p>
                      <p className="text-sm text-[var(--edu-text-secondary)] mb-2">{item.institution}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--edu-warning)] font-semibold">{item.daysLeft} days left</span>
                        <span className="text-[var(--edu-text-tertiary)]">•</span>
                        <span className="text-[var(--edu-text-tertiary)]">
                          {new Date(item.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Messages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">Recent Messages</h2>
                <Link to="/dashboard/candidate/messages">
                  <Button variant="ghost" size="sm" className="text-[var(--edu-blue)]">
                    View all
                  </Button>
                </Link>
              </div>
              <div className="glass-card rounded-2xl p-6 space-y-4">
                {recentMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl cursor-pointer hover:bg-[var(--edu-surface)] transition-colors ${
                      msg.unread ? 'bg-[var(--edu-blue)]/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--edu-blue)] flex items-center justify-center text-white font-semibold flex-shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold text-[var(--edu-text-primary)]">{msg.from}</p>
                          <span className="text-xs text-[var(--edu-text-tertiary)]">{msg.time}</span>
                        </div>
                        <p className="text-sm font-medium text-[var(--edu-text-primary)] mb-1">{msg.subject}</p>
                        <p className="text-sm text-[var(--edu-text-secondary)] line-clamp-1">{msg.preview}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recommended Programs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Recommended for You</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedPrograms.map((program) => (
                <ProgramCard key={program.id} program={program} view="grid" />
              ))}
            </div>
          </motion.div>

          {/* Documents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)]">Documents</h2>
              <Link to="/dashboard/candidate/documents">
                <Button variant="ghost" className="text-[var(--edu-blue)]">
                  Manage
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'CV', status: 'Verified', color: 'var(--edu-success)' },
                { name: 'Transcripts', status: 'Pending', color: 'var(--edu-warning)' },
                { name: 'ID Copy', status: 'Verified', color: 'var(--edu-success)' },
              ].map((doc, i) => (
                <div key={i} className="glass-card rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--edu-surface)] flex items-center justify-center">
                      <Upload className="w-6 h-6 text-[var(--edu-text-secondary)]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--edu-text-primary)] mb-1">{doc.name}</p>
                      <p className="text-sm" style={{ color: doc.color }}>
                        {doc.status}
                      </p>
                    </div>
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