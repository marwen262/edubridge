import { useParams } from 'react-router';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { useAuth } from '@/context/AuthContext';
import { OverviewSection } from '../components/admin/OverviewSection';
import { UsersSection } from '../components/admin/UsersSection';
import { InstitutesSection } from '../components/admin/InstitutesSection';
import { ProgramsSection } from '../components/admin/ProgramsSection';
import { CandidaturesSection } from '../components/admin/CandidaturesSection';
import { NotificationsSection } from '../components/admin/NotificationsSection';
import { DemandesSection } from '../components/admin/DemandesSection';
import { ParametresSystemeSection } from '../components/admin/ParametresSystemeSection';
import { PlaceholderSection } from '../components/admin/PlaceholderSection';
import { RapportsSection } from '../components/admin/RapportsSection';

export function AdminDashboard() {
  const { section } = useParams<{ section?: string }>();
  const { user } = useAuth();
  const nomAdmin = user?.prenom ?? user?.email ?? 'Administrateur';

  let content;
  switch (section) {
    case undefined:
      content = <OverviewSection nomAdmin={nomAdmin} />;
      break;
    case 'utilisateurs':
      content = <UsersSection />;
      break;
    case 'instituts':
      content = <InstitutesSection />;
      break;
    case 'programmes':
      content = <ProgramsSection />;
      break;
    case 'candidatures':
      content = <CandidaturesSection />;
      break;
    case 'notifications':
      content = <NotificationsSection />;
      break;
    case 'demandes':
      content = <DemandesSection />;
      break;
    case 'rapports':
      content = <RapportsSection />;
      break;
    case 'journal':
      content = (
        <PlaceholderSection
          title="Journal d'activité"
          subtitle="Audit log de la plateforme"
          description="Suivi en temps réel des actions sensibles : connexions, validations, suspensions, modifications. Disponible prochainement."
        />
      );
      break;
    case 'parametres':
      content = <ParametresSystemeSection />;
      break;
    default:
      content = <OverviewSection nomAdmin={nomAdmin} />;
  }

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar
        role="admin"
        user={{ name: nomAdmin, role: 'Administrateur' }}
      />
      <main className="flex-1 overflow-y-auto">{content}</main>
    </div>
  );
}
