import React from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Building2, Search, CheckCircle, ShieldOff, ShieldAlert, Clock,
  Globe, Mail, MoreHorizontal, ChevronLeft, ChevronRight,
  RefreshCw, XCircle, Plus, X, Loader2, Send, Trash2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useInstituts } from '@/hooks/useInstituts';
import { institutService } from '@/services/api';
import type { Institut, ValidationStatus } from '@/types/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: 'Approuvé', color: 'var(--edu-success)', bg: 'rgba(52,199,89,0.1)' },
  pending_admin_review: { label: 'En attente', color: 'var(--edu-warning)', bg: 'rgba(255,159,10,0.1)' },
  invited: { label: 'Invité', color: 'var(--edu-blue)', bg: 'rgba(0,113,227,0.1)' },
  rejected: { label: 'Rejeté', color: 'var(--edu-danger)', bg: 'rgba(255,59,48,0.1)' },
  suspended: { label: 'Suspendu', color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
};

const PAGE_SIZE = 10;

/* ─── Dialog motif (suspend / reject) ──────────────────────── */
function MotifDialog({
  open, title, placeholder, confirmLabel, confirmColor, onConfirm, onCancel,
}: {
  open: boolean; title: string; placeholder: string;
  confirmLabel: string; confirmColor: string;
  onConfirm: (motif: string) => void; onCancel: () => void;
}) {
  const [motif, setMotif] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => { if (open) { setMotif(''); setTimeout(() => ref.current?.focus(), 100); } }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!motif.trim()) return;
    setSubmitting(true);
    try { await onConfirm(motif.trim()); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1D1D1F] rounded-2xl shadow-2xl border border-[var(--edu-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[var(--edu-border)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--edu-text-primary)]">{title}</h2>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-[var(--edu-surface)] transition-colors">
            <X className="w-5 h-5 text-[var(--edu-text-tertiary)]" />
          </button>
        </div>
        <div className="px-6 py-5">
          <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-2">Motif <span className="text-[var(--edu-danger)]">*</span></label>
          <textarea
            ref={ref}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] resize-none"
          />
        </div>
        <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={submitting} className="rounded-xl">Annuler</Button>
          <Button
            onClick={handleConfirm}
            disabled={!motif.trim() || submitting}
            className="rounded-xl text-white"
            style={{ backgroundColor: confirmColor }}
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dialog confirmation suppression ─────────────────────── */
function ConfirmDeleteDialog({
  open, nom, onConfirm, onCancel,
}: { open: boolean; nom: string; onConfirm: () => void; onCancel: () => void }) {
  const [submitting, setSubmitting] = React.useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try { await onConfirm(); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1D1D1F] rounded-2xl shadow-2xl border border-[var(--edu-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[var(--edu-border)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--edu-text-primary)]">Supprimer l'institut</h2>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-[var(--edu-surface)] transition-colors">
            <X className="w-5 h-5 text-[var(--edu-text-tertiary)]" />
          </button>
        </div>
        <div className="px-6 py-6">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-[var(--edu-danger)]" />
          </div>
          <p className="text-center text-sm text-[var(--edu-text-secondary)] leading-relaxed">
            Vous êtes sur le point de supprimer définitivement
          </p>
          <p className="text-center font-bold text-[var(--edu-text-primary)] mt-1 mb-3">« {nom} »</p>
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-xs text-red-700 dark:text-red-300 text-center">
              ⚠️ Cette action est <strong>irréversible</strong>. Toutes les données associées seront perdues.
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={submitting} className="rounded-xl">Annuler</Button>
          <Button onClick={handleConfirm} disabled={submitting} className="rounded-xl text-white" style={{ backgroundColor: 'var(--edu-danger)' }}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Supprimer définitivement
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dialog invitation ────────────────────────────────────── */
function InviterDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = React.useState('');
  const [nom, setNom] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { if (open) { setEmail(''); setNom(''); setTimeout(() => ref.current?.focus(), 100); } }, [open]);

  if (!open) return null;

  const handleInviter = async () => {
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await institutService.inviter({ email: email.trim(), nom: nom.trim() || undefined });
      toast.success(`Invitation envoyée à ${email.trim()}`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? "Erreur lors de l'invitation.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1D1D1F] rounded-2xl shadow-2xl border border-[var(--edu-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[var(--edu-border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--edu-text-primary)]">Inviter un institut</h2>
            <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">Un email d'invitation sera envoyé</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--edu-surface)] transition-colors">
            <X className="w-5 h-5 text-[var(--edu-text-tertiary)]" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Email <span className="text-[var(--edu-danger)]">*</span></label>
            <input ref={ref} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@institut.tn"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]"
              onKeyDown={(e) => { if (e.key === 'Enter') handleInviter(); }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Nom de l'établissement <span className="text-[var(--edu-text-tertiary)]">(optionnel)</span></label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Université de Tunis"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="rounded-xl">Annuler</Button>
          <Button onClick={handleInviter} disabled={!email.trim() || submitting} className="rounded-xl text-white" style={{ backgroundColor: 'var(--edu-blue)' }}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Envoyer l'invitation
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Section principale ───────────────────────────────────── */
export function InstitutesSection() {
  const { instituts: institutsRaw, loading, refetch } = useInstituts({ admin_view: true });
  const instituts = institutsRaw as Institut[];

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('tous');
  const [page, setPage] = React.useState(1);
  const [actionMenu, setActionMenu] = React.useState<string | null>(null);
  const [processing, setProcessing] = React.useState<string | null>(null);

  // Dialog states
  const [motifDialog, setMotifDialog] = React.useState<{ type: 'suspendre' | 'rejeter'; id: string } | null>(null);
  const [showInviter, setShowInviter] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Institut | null>(null);

  const filtered = React.useMemo(() => {
    let list = instituts;
    if (statusFilter !== 'tous') list = list.filter((i) => i.validation_status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => (i.nom ?? '').toLowerCase().includes(q) || (i.sigle ?? '').toLowerCase().includes(q) || (i.utilisateur?.email ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [instituts, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  React.useEffect(() => { setPage(1); }, [search, statusFilter]);

  const stats = [
    { label: 'Total', value: instituts.length, color: 'var(--edu-text-primary)' },
    { label: 'Approuvés', value: instituts.filter((i) => i.validation_status === 'approved').length, color: 'var(--edu-success)' },
    { label: 'En attente', value: instituts.filter((i) => i.validation_status === 'pending_admin_review').length, color: 'var(--edu-warning)' },
    { label: 'Suspendus', value: instituts.filter((i) => i.validation_status === 'suspended').length, color: 'var(--edu-danger)' },
  ];

  const handleApprouver = async (id: string) => {
    setProcessing(id);
    try { await institutService.approuver(id); toast.success('Institut approuvé.'); refetch(); }
    catch (err: unknown) { const a = err as { response?: { data?: { message?: string } } }; toast.error(a?.response?.data?.message ?? 'Erreur'); }
    finally { setProcessing(null); setActionMenu(null); }
  };

  const handleMotifConfirm = async (motif: string) => {
    if (!motifDialog) return;
    const { type, id } = motifDialog;
    setProcessing(id);
    try {
      if (type === 'rejeter') { await institutService.rejeter(id, motif); toast.success('Institut rejeté.'); }
      else { await institutService.suspendre(id, motif); toast.success('Institut suspendu.'); }
      refetch();
    } catch (err: unknown) {
      const a = err as { response?: { data?: { message?: string } } };
      toast.error(a?.response?.data?.message ?? 'Erreur');
    } finally { setProcessing(null); setActionMenu(null); setMotifDialog(null); }
  };

  const handleReactiver = async (id: string) => {
    setProcessing(id);
    try { await institutService.reactiver(id); toast.success('Institut réactivé.'); refetch(); }
    catch (err: unknown) { const a = err as { response?: { data?: { message?: string } } }; toast.error(a?.response?.data?.message ?? 'Erreur'); }
    finally { setProcessing(null); setActionMenu(null); }
  };

  const handleSupprimer = (inst: Institut) => {
    setDeleteTarget(inst);
    setActionMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setProcessing(deleteTarget.id);
    try { await institutService.delete(deleteTarget.id); toast.success('Institut supprimé.'); refetch(); }
    catch (err: unknown) { const a = err as { response?: { data?: { message?: string } } }; toast.error(a?.response?.data?.message ?? 'Erreur'); }
    finally { setProcessing(null); setDeleteTarget(null); }
  };

  const getActions = (inst: Institut) => {
    const status = inst.validation_status as ValidationStatus;
    const actions: { label: string; icon: React.ComponentType<{ className?: string }>; color: string; handler: () => void }[] = [];
    if (status === 'pending_admin_review') {
      actions.push({ label: 'Approuver', icon: CheckCircle, color: 'var(--edu-success)', handler: () => handleApprouver(inst.id) });
      actions.push({ label: 'Rejeter', icon: XCircle, color: 'var(--edu-danger)', handler: () => { setMotifDialog({ type: 'rejeter', id: inst.id }); setActionMenu(null); } });
    }
    if (status === 'approved') {
      actions.push({ label: 'Suspendre', icon: ShieldOff, color: 'var(--edu-warning)', handler: () => { setMotifDialog({ type: 'suspendre', id: inst.id }); setActionMenu(null); } });
    }
    if (status === 'suspended' || status === 'rejected') {
      actions.push({ label: 'Réactiver', icon: RefreshCw, color: 'var(--edu-success)', handler: () => handleReactiver(inst.id) });
    }
    // Supprimer toujours disponible
    actions.push({ label: 'Supprimer', icon: Trash2, color: 'var(--edu-danger)', handler: () => handleSupprimer(inst) });
    return actions;
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">Administration</p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">Instituts</h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-1">Validation, suivi et gestion des établissements partenaires</p>
          </div>
          <Button onClick={() => setShowInviter(true)} className="rounded-full text-white" style={{ backgroundColor: 'var(--edu-blue)' }}>
            <Plus className="w-4 h-4 mr-2" /> Inviter un institut
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-5 border border-[var(--edu-border)]">
              <p className="text-3xl font-bold tracking-tight" style={{ color: s.color }}>
                {loading ? <span className="inline-block w-10 h-8 bg-[var(--edu-surface)] rounded animate-pulse" /> : s.value}
              </p>
              <p className="text-xs text-[var(--edu-text-secondary)] mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Filtres */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)]" />
            <input type="text" placeholder="Rechercher par nom, sigle, email…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] transition-shadow" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['tous', 'approved', 'pending_admin_review', 'suspended', 'rejected', 'invited'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-[var(--edu-indigo)] text-white' : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)] hover:bg-[var(--edu-border)]'}`}>
                {s === 'tous' ? 'Tous' : STATUS_CONFIG[s]?.label ?? s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tableau */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--edu-surface)]">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Institut</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Statut</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Vérification</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Programmes</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Inscription</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center"><Building2 className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" /><p className="text-sm text-[var(--edu-text-secondary)]">Aucun institut trouvé.</p></td></tr>
                ) : paginated.map((inst) => {
                  const stCfg = STATUS_CONFIG[inst.validation_status ?? 'invited'] ?? STATUS_CONFIG.invited;
                  const actions = getActions(inst);
                  return (
                    <tr key={inst.id} className="hover:bg-[var(--edu-surface)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--edu-indigo)] to-[var(--edu-blue)] flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {(inst.sigle ?? inst.nom ?? 'I').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-[var(--edu-text-primary)] truncate">
                              {inst.nom ?? <span className="italic text-[var(--edu-text-tertiary)]">Sans nom</span>}
                              {inst.sigle && <span className="text-[var(--edu-text-tertiary)] ml-1">({inst.sigle})</span>}
                            </p>
                            <p className="text-xs text-[var(--edu-text-tertiary)] truncate flex items-center gap-1"><Mail className="w-3 h-3" />{inst.utilisateur?.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: stCfg.bg, color: stCfg.color }}>{stCfg.label}</span></td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${inst.est_verifie ? 'text-[var(--edu-success)]' : 'text-[var(--edu-text-tertiary)]'}`}>
                          {inst.est_verifie ? <><CheckCircle className="w-3.5 h-3.5" /> Vérifié</> : <><Clock className="w-3.5 h-3.5" /> Non vérifié</>}
                        </span>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm font-semibold text-[var(--edu-text-primary)]">{inst.programmes?.length ?? 0}</span></td>
                      <td className="px-6 py-4"><span className="text-sm text-[var(--edu-text-secondary)]">{inst.cree_le ? new Date(inst.cree_le).toLocaleDateString('fr-FR') : '—'}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end relative">
                          {actions.length > 0 && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setActionMenu(actionMenu === inst.id ? null : inst.id)} disabled={processing === inst.id}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                              {actionMenu === inst.id && (
                                <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-[#2D2D2F] rounded-xl shadow-xl border border-[var(--edu-border)] py-1 animate-in fade-in slide-in-from-top-1">
                                  {actions.map((a) => { const Icon = a.icon; return (
                                    <button key={a.label} onClick={a.handler} className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-[var(--edu-surface)]" style={{ color: a.color }}>
                                      <Icon className="w-4 h-4" />{a.label}
                                    </button>
                                  ); })}
                                </div>
                              )}
                            </>
                          )}
                          {inst.site_web && (
                            <a href={inst.site_web} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm"><Globe className="w-4 h-4" /></Button></a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-between">
              <p className="text-xs text-[var(--edu-text-tertiary)]">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''} — page {page}/{totalPages}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Motif Dialog */}
      <MotifDialog
        open={motifDialog !== null}
        title={motifDialog?.type === 'suspendre' ? 'Suspendre l\'institut' : 'Rejeter l\'institut'}
        placeholder={motifDialog?.type === 'suspendre' ? 'Décrivez la raison de la suspension…' : 'Décrivez la raison du rejet…'}
        confirmLabel={motifDialog?.type === 'suspendre' ? 'Suspendre' : 'Rejeter'}
        confirmColor={motifDialog?.type === 'suspendre' ? 'var(--edu-warning)' : 'var(--edu-danger)'}
        onConfirm={handleMotifConfirm}
        onCancel={() => setMotifDialog(null)}
      />

      {/* Inviter Dialog */}
      <InviterDialog open={showInviter} onClose={() => setShowInviter(false)} onSuccess={refetch} />

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        nom={deleteTarget?.nom ?? deleteTarget?.utilisateur?.email ?? 'cet institut'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
