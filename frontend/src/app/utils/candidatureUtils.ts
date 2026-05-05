// Utilitaires partagés pour les statuts de candidature.
// Source unique de vérité — importer depuis ici plutôt que dupliquer.
import type { Candidature } from '@/types/api';

export function getStatutColor(statut: Candidature['statut']): string {
  switch (statut) {
    case 'brouillon':     return 'var(--edu-text-secondary)';
    case 'soumise':       return 'var(--edu-warning)';
    case 'en_examen':     return 'var(--edu-blue)';
    case 'acceptee':      return 'var(--edu-success)';
    case 'refusee':       return 'var(--edu-danger)';
    case 'liste_attente': return 'var(--edu-accent)';
    default:              return 'var(--edu-text-secondary)';
  }
}

export function getStatutLabel(statut: Candidature['statut']): string {
  switch (statut) {
    case 'brouillon':     return 'Brouillon';
    case 'soumise':       return 'Soumise';
    case 'en_examen':     return 'En examen';
    case 'acceptee':      return 'Acceptée';
    case 'refusee':       return 'Refusée';
    case 'liste_attente': return "Liste d'attente";
    default:              return statut;
  }
}

export function getActionLabel(statut: Candidature['statut']): string {
  if (statut === 'brouillon') return 'Continuer';
  if (statut === 'soumise' || statut === 'en_examen') return 'Voir détails';
  return 'Voir résultat';
}

export function getActionColor(statut: Candidature['statut']): string {
  if (statut === 'acceptee') return 'text-[var(--edu-success)]';
  if (statut === 'refusee')  return 'text-[var(--edu-danger)]';
  return 'text-[var(--edu-blue)]';
}
