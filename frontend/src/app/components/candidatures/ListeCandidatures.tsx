import { useState } from 'react';
import { Link } from 'react-router';
import { Inbox, FileText, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { cn } from '@/app/components/ui/utils';
import { MultiStepDialog } from '@/app/components/MultiStepDialog';
import { useCandidatures } from '@/hooks/useCandidatures';
import { candidatureService } from '@/services/api';
import {
  getStatutColor,
  getStatutLabel,
  getActionLabel,
  getActionColor,
} from '@/app/utils/candidatureUtils';
import type { Candidature } from '@/types/api';

export function ListeCandidatures() {
  const { candidatures, loading, error, refetch } = useCandidatures();
  const [draftToResume, setDraftToResume] = useState<Candidature | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<Candidature | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!draftToDelete) return;
    const c = draftToDelete;
    setDeletingId(c.id);
    try {
      await candidatureService.delete(c.id);
      toast.success('Brouillon supprimé');
      setDraftToDelete(null);
      refetch();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message ?? 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  if (error) {
    return (
      <div className="glass-card rounded-2xl py-10 text-center px-6">
        <p className="text-sm text-[var(--edu-danger)]">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="flex-1 h-4 bg-[var(--edu-surface)] rounded" />
              <div className="w-36 h-4 bg-[var(--edu-surface)] rounded" />
              <div className="w-24 h-4 bg-[var(--edu-surface)] rounded" />
              <div className="w-20 h-4 bg-[var(--edu-surface)] rounded" />
              <div className="w-16 h-4 bg-[var(--edu-surface)] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (candidatures.length === 0) {
    return (
      <div className="glass-card rounded-2xl py-16 flex flex-col items-center gap-4 text-center px-6">
        <Inbox className="w-12 h-12 text-[var(--edu-text-tertiary)]" />
        <div>
          <p className="text-base font-semibold text-[var(--edu-text-primary)]">
            Vous n'avez encore aucune candidature
          </p>
          <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
            Commencez par explorer les programmes disponibles.
          </p>
        </div>
        <Link to="/search">
          <Button className="bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white mt-1">
            Explorer les programmes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--edu-surface)]">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">
                  Programme
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide hidden sm:table-cell">
                  Institut
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide hidden md:table-cell">
                  Date soumission
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">
                  Statut
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--edu-divider)]">
              {candidatures.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--edu-surface)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${getStatutColor(c.statut)}15` }}
                      >
                        <FileText className="w-4 h-4" style={{ color: getStatutColor(c.statut) }} />
                      </div>
                      <p className="text-sm font-medium text-[var(--edu-text-primary)] truncate max-w-[200px]">
                        {c.programme?.titre ?? '—'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <p className="text-sm text-[var(--edu-text-secondary)] truncate max-w-[180px]">
                      {c.programme?.institut?.nom ?? '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-sm text-[var(--edu-text-secondary)]">
                      {c.soumise_le
                        ? new Date(c.soumise_le).toLocaleDateString('fr-FR')
                        : c.cree_le
                        ? new Date(c.cree_le).toLocaleDateString('fr-FR')
                        : '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                      style={{
                        color: getStatutColor(c.statut),
                        backgroundColor: `${getStatutColor(c.statut)}1A`,
                      }}
                    >
                      {getStatutLabel(c.statut)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      {c.statut === 'brouillon' && c.programme ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDraftToResume(c)}
                            className={cn('text-xs flex items-center gap-1', getActionColor(c.statut))}
                          >
                            <Pencil className="w-3 h-3" />
                            {getActionLabel(c.statut)}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDraftToDelete(c)}
                            disabled={deletingId === c.id}
                            className="text-xs flex items-center gap-1 text-[var(--edu-danger)] hover:text-[var(--edu-danger)] hover:bg-[var(--edu-danger)]/10 disabled:opacity-50"
                            aria-label="Supprimer le brouillon"
                          >
                            <Trash2 className="w-3 h-3" />
                            {deletingId === c.id ? '…' : 'Supprimer'}
                          </Button>
                        </>
                      ) : (
                        <Link to={`/program/${c.programme_id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn('text-xs', getActionColor(c.statut))}
                          >
                            {getActionLabel(c.statut)}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogue de reprise de brouillon */}
      {draftToResume && draftToResume.programme && (
        <MultiStepDialog
          open={!!draftToResume}
          onOpenChange={(open) => {
            if (!open) {
              setDraftToResume(null);
              refetch();
            }
          }}
          programme={draftToResume.programme}
          candidatureId={draftToResume.id}
          lettreMotivationInitiale={draftToResume.lettre_motivation}
          documentsExistants={draftToResume.documents_soumis}
        />
      )}

      {/* Confirmation de suppression de brouillon */}
      <AlertDialog
        open={!!draftToDelete}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setDraftToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,59,48,0.12)' }}
              >
                <AlertTriangle className="w-5 h-5 text-[var(--edu-danger)]" />
              </div>
              <AlertDialogTitle className="text-[var(--edu-text-primary)]">
                Supprimer ce brouillon ?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-[var(--edu-text-secondary)] pt-2">
              {draftToDelete?.programme?.titre && (
                <span className="block font-medium text-[var(--edu-text-primary)] mb-1">
                  {draftToDelete.programme.titre}
                </span>
              )}
              Cette action est irréversible vos documents et la lettre de
              motivation associés seront définitivement perdus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null} className="rounded-full">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deletingId !== null}
              className="rounded-full bg-[var(--edu-danger)] hover:bg-[var(--edu-danger)]/90 text-white"
            >
              {deletingId !== null ? 'Suppression…' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
