import { useParams } from 'react-router';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { useAuth } from '@/context/AuthContext';
import { useInstitut } from '@/hooks/useInstitut';
import { InstitutionOverviewSection } from '../components/institution/InstitutionOverviewSection';
import { InstitutionProgramsSection } from '../components/institution/InstitutionProgramsSection';
import { InstitutionCandidaturesSection } from '../components/institution/InstitutionCandidaturesSection';
import { InstitutionCandidatsSection } from '../components/institution/InstitutionCandidatsSection';
import { InstitutionNotificationsSection } from '../components/institution/InstitutionNotificationsSection';
import { InstitutionProfilSection } from '../components/institution/InstitutionProfilSection';
import { InstitutionParametresSection } from '../components/institution/InstitutionParametresSection';
import { InstitutionPlaceholderSection } from '../components/institution/InstitutionPlaceholderSection';

export function InstitutionDashboard() {
  const { section } = useParams<{ section?: string }>();
  const { user } = useAuth();
  const { institut } = useInstitut(user?.institut_id);
  const nomInstitut = institut?.nom ?? user?.email ?? 'Institution';

  let content;
  switch (section) {
    case undefined:
      content = <InstitutionOverviewSection institut={institut} />;
      break;
    case 'programmes':
      content = <InstitutionProgramsSection />;
      break;
    case 'candidatures':
      content = <InstitutionCandidaturesSection />;
      break;
    case 'candidats':
      content = <InstitutionCandidatsSection />;
      break;
    case 'notifications':
      content = <InstitutionNotificationsSection />;
      break;
    case 'rapports':
      content = (
        <InstitutionPlaceholderSection
          title="Rapports"
          subtitle="Statistiques et exports"
          description="Rapports périodiques, exports CSV et indicateurs de performance de votre établissement. Disponible prochainement."
        />
      );
      break;
    case 'profil':
      content = <InstitutionProfilSection />;
      break;
    case 'parametres':
      content = <InstitutionParametresSection />;
      break;
    default:
      content = <InstitutionOverviewSection institut={institut} />;
  }

  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar
        role="institution"
        user={{ name: nomInstitut, role: user?.email ?? 'institut' }}
      />
      <main className="flex-1 overflow-y-auto">{content}</main>
    </div>
  );
}
