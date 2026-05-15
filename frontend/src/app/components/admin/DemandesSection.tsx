import React from 'react';
import { Building2, CheckCircle, XCircle, Clock, Loader2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '../ui/dialog';
import { Pagination } from '../Pagination';
import { demandeAccesService } from '@/services/api';
import type { DemandeAcces } from '@/types/api';

type Filtre = 'toutes' | 'en_attente' | 'approuvee' | 'rejetee';

const FILTRES: { key: Filtre; label: string }[] = [
  { key: 'toutes',     label: 'Toutes' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'approuvee',  label: 'Approuvées' },
  { key: 'rejetee',    label: 'Rejetées' },
];

function BadgeStatut({ statut }: { statut: DemandeAcces['statut'] }) {
  if (statut === 'en_attente')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        <Clock className="w-3 h-3" /> En attente
      </span>
    );
  if (statut === 'approuvee')
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--edu-success)]/10 text-[var(--edu-success)]">
        <CheckCircle className="w-3 h-3" /> Approuvée
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--edu-danger)]/10 text-[var(--edu-danger)]">
      <XCircle className="w-3 h-3" /> Rejetée
    </span>
  );
}

type PaginationMeta = { total: number; page: number; limit: number; totalPages: number };

export function DemandesSection() {
  const [demandes, setDemandes]     = React.useState<DemandeAcces[]>([]);
  const [pagination, setPagination] = React.useState<PaginationMeta | null>(null);
  const [loading, setLoading]       = React.useState(false);
  const [error, setError]           = React.useState<string | null>(null);
  const [filtre, setFiltre]         = React.useState<Filtre>('toutes');
  const [page, setPage]             = React.useState(1);

  const [approuverDialog, setApprouverDialog] = React.useState<{
    open: boolean; id: string | null; nom: string; email: string;
  }>({ open: false, id: null, nom: '', email: '' });
  const [approuverLoading, setApprouverLoading] = React.useState(false);

  const [rejetDialog, setRejetDialog] = React.useState<{
    open: boolean; id: string | null;
  }>({ open: false, id: null });
  const [notesAdmin, setNotesAdmin]   = React.useState('');
  const [rejetLoading, setRejetLoading] = React.useState(false);

  const [detailDialog, setDetailDialog] = React.useState<{
    open: boolean; demande: DemandeAcces | null;
  }>({ open: false, demande: null });

  const charger = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        ...(filtre !== 'toutes' ? { statut: filtre } : {}),
      };
      const r = await demandeAccesService.listerToutes(params);
      const payload = r.data as { demandes: DemandeAcces[]; pagination: PaginationMeta };
      setDemandes(payload.demandes ?? []);
      setPagination(payload.pagination ?? null);
    } catch {
      setError('Impossible de charger les demandes.');
    } finally {
      setLoading(false);
    }
  }, [filtre, page]);

  React.useEffect(() => { charger(); }, [charger]);
  React.useEffect(() => { setPage(1); }, [filtre]);

  const handleApprouver = async () => {
    if (!approuverDialog.id) return;
    setApprouverLoading(true);
    try {
      await demandeAccesService.approuver(approuverDialog.id);
      toast.success(`Invitation envoyée à ${approuverDialog.email}`);
      setApprouverDialog({ open: false, id: null, nom: '', email: '' });
      charger();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? "Erreur lors de l'approbation.");
    } finally {
      setApprouverLoading(false);
    }
  };

  const handleRejeter = async () => {
    if (!rejetDialog.id) return;
    setRejetLoading(true);
    try {
      await demandeAccesService.rejeter(rejetDialog.id, notesAdmin || undefined);
      toast.success('Demande rejetée.');
      setRejetDialog({ open: false, id: null });
      setNotesAdmin('');
      charger();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message ?? 'Erreur lors du rejet.');
    } finally {
      setRejetLoading(false);
    }
  };

  const enAttente = demandes.filter((d) => d.statut === 'en_attente').length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--edu-blue)]/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-[var(--edu-blue)]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--edu-text-primary)]">
              Demandes d'accès
            </h1>
            {enAttente > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                {enAttente}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--edu-text-secondary)]">
            Établissements souhaitant rejoindre EduBridge
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {FILTRES.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltre(f.key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={
              filtre === f.key
                ? { background: 'var(--edu-blue)', color: 'white' }
                : { background: 'var(--edu-surface)', color: 'var(--edu-text-secondary)' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-[var(--edu-surface)] rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[var(--edu-surface)] rounded w-1/3" />
                  <div className="h-3 bg-[var(--edu-surface)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="text-[var(--edu-danger)] mb-4">{error}</p>
          <Button onClick={charger} variant="outline" className="rounded-full">Réessayer</Button>
        </div>
      ) : demandes.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 flex flex-col items-center gap-3 text-center px-6">
          <Building2 className="w-10 h-10 text-[var(--edu-text-tertiary)]" />
          <p className="text-base font-semibold text-[var(--edu-text-primary)]">Aucune demande</p>
          <p className="text-sm text-[var(--edu-text-secondary)]">
            {filtre !== 'toutes'
              ? 'Aucune demande pour ce filtre.'
              : "Aucune demande d'accès reçue pour l'instant."}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--edu-surface)]">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">Établissement</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide hidden lg:table-cell">Reçue le</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">Statut</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {demandes.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setDetailDialog({ open: true, demande: d })}
                    className="hover:bg-[var(--edu-surface)] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--edu-blue)]/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-[var(--edu-blue)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--edu-text-primary)] truncate max-w-[200px]">
                            {d.nom}
                          </p>
                          <p className="text-xs text-[var(--edu-text-secondary)] truncate max-w-[200px]">
                            {d.presentation.slice(0, 60)}…
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--edu-text-secondary)]">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[160px]">{d.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--edu-text-secondary)]">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>{d.telephone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-[var(--edu-text-secondary)]">
                        {new Date(d.cree_le).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <BadgeStatut statut={d.statut} />
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {d.statut === 'en_attente' && (
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            className="rounded-full bg-[var(--edu-success)] hover:bg-[var(--edu-success)]/80 text-white h-8 px-3 text-xs"
                            onClick={() =>
                              setApprouverDialog({ open: true, id: d.id, nom: d.nom, email: d.email })
                            }
                          >
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full border-[var(--edu-danger)] text-[var(--edu-danger)] hover:bg-[var(--edu-danger)]/10 h-8 px-3 text-xs"
                            onClick={() => {
                              setRejetDialog({ open: true, id: d.id });
                              setNotesAdmin('');
                            }}
                          >
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--edu-divider)]">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                totalItems={pagination.total}
                itemLabel="demande"
                disabled={loading}
              />
            </div>
          )}
        </div>
      )}

      {/* Dialog : détail présentation */}
      <Dialog
        open={detailDialog.open}
        onOpenChange={(open) => !open && setDetailDialog({ open: false, demande: null })}
      >
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>{detailDialog.demande?.nom}</DialogTitle>
            <DialogDescription className="flex flex-col gap-1 pt-1">
              <span className="flex items-center gap-1.5 text-xs">
                <Mail className="w-3 h-3" /> {detailDialog.demande?.email}
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <Phone className="w-3 h-3" /> {detailDialog.demande?.telephone}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="bg-[var(--edu-surface)] rounded-xl p-4">
            <p className="text-xs font-semibold text-[var(--edu-text-secondary)] uppercase tracking-wide mb-2">
              Présentation
            </p>
            <p className="text-sm text-[var(--edu-text-primary)] leading-relaxed whitespace-pre-line">
              {detailDialog.demande?.presentation}
            </p>
          </div>
          {detailDialog.demande?.statut === 'en_attente' && (
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full border-[var(--edu-danger)] text-[var(--edu-danger)] hover:bg-[var(--edu-danger)]/10"
                onClick={() => {
                  setDetailDialog({ open: false, demande: null });
                  setRejetDialog({ open: true, id: detailDialog.demande!.id });
                  setNotesAdmin('');
                }}
              >
                Rejeter
              </Button>
              <Button
                className="flex-1 rounded-full bg-[var(--edu-success)] hover:bg-[var(--edu-success)]/80 text-white"
                onClick={() => {
                  const d = detailDialog.demande!;
                  setDetailDialog({ open: false, demande: null });
                  setApprouverDialog({ open: true, id: d.id, nom: d.nom, email: d.email });
                }}
              >
                Approuver
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog : confirmer approbation */}
      <Dialog
        open={approuverDialog.open}
        onOpenChange={(open) =>
          !open && setApprouverDialog({ open: false, id: null, nom: '', email: '' })
        }
      >
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Approuver la demande</DialogTitle>
            <DialogDescription>
              Une invitation sera envoyée à{' '}
              <span className="font-semibold text-[var(--edu-text-primary)]">
                {approuverDialog.email}
              </span>{' '}
              pour finaliser la création du compte{' '}
              <span className="font-semibold text-[var(--edu-text-primary)]">
                {approuverDialog.nom}
              </span>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button
              variant="ghost"
              className="flex-1 rounded-full"
              onClick={() => setApprouverDialog({ open: false, id: null, nom: '', email: '' })}
            >
              Annuler
            </Button>
            <Button
              disabled={approuverLoading}
              onClick={handleApprouver}
              className="flex-1 rounded-full bg-[var(--edu-success)] hover:bg-[var(--edu-success)]/80 text-white disabled:opacity-60"
            >
              {approuverLoading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi…</>
                : 'Confirmer et inviter'
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog : rejeter */}
      <Dialog
        open={rejetDialog.open}
        onOpenChange={(open) => !open && setRejetDialog({ open: false, id: null })}
      >
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
            <DialogDescription>
              Cette action est définitive. Vous pouvez laisser un motif optionnel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={notesAdmin}
              onChange={(e) => setNotesAdmin(e.target.value)}
              placeholder="Motif du rejet (optionnel)"
              rows={3}
              className="w-full rounded-xl border border-[var(--edu-border)] bg-[var(--edu-surface)] text-[var(--edu-text-primary)] text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--edu-blue)] resize-none"
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 rounded-full"
                onClick={() => setRejetDialog({ open: false, id: null })}
              >
                Annuler
              </Button>
              <Button
                disabled={rejetLoading}
                onClick={handleRejeter}
                className="flex-1 rounded-full bg-[var(--edu-danger)] hover:bg-[var(--edu-danger)]/80 text-white disabled:opacity-60"
              >
                {rejetLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rejet…</>
                  : 'Confirmer le rejet'
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
