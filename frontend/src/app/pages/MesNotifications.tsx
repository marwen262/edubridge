import { DashboardSidebar } from '../components/DashboardSidebar';
import { CandidateNotificationsSection } from '../components/candidate/CandidateNotificationsSection';
import { useAuth } from '@/context/AuthContext';

export function MesNotifications() {
  const { user } = useAuth();
  const prenom = user?.prenom ?? user?.email?.split('@')[0] ?? 'Candidat';

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar
        role="candidate"
        user={{ name: prenom, role: user?.role ?? 'candidat' }}
      />
      <main className="flex-1 overflow-y-auto">
        <CandidateNotificationsSection />
      </main>
    </div>
  );
}
