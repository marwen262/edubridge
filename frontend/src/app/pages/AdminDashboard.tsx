import { useParams } from 'react-router';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { useAuth } from '@/context/AuthContext';
import { OverviewSection } from '../components/admin/OverviewSection';
import { UsersSection } from '../components/admin/UsersSection';
import { InstitutesSection } from '../components/admin/InstitutesSection';
import { ProgramsSection } from '../components/admin/ProgramsSection';
import { CandidaturesSection } from '../components/admin/CandidaturesSection';
import { NotificationsSection } from '../components/admin/NotificationsSection';
import { PlaceholderSection } from '../components/admin/PlaceholderSection';

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
    case 'rapports':
      content = (
        <PlaceholderSection
          title="Rapports"
          subtitle="Analyses détaillées et exports de données"
          description="Cette section regroupera les rapports périodiques, exports CSV et indicateurs avancés. Disponible prochainement."
        />
      );
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
      content = (
        <PlaceholderSection
          title="Paramètres système"
          subtitle="Configuration globale de la plateforme"
          description="Gestion des rôles, politiques de mot de passe, intégrations externes et autres réglages avancés. Disponible prochainement."
        />
      );
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
