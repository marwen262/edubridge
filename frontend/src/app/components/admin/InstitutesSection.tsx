import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Building2, Search, CheckCircle, ShieldOff, ShieldAlert, Clock,
  Globe, Mail, MoreHorizontal, ChevronLeft, ChevronRight,
  RefreshCw, XCircle, Plus, X, Loader2, Send, Trash2,
  Phone, MapPin, Award, FileText, Eye,
} from 'lucide-react';
import { API_URL } from '@/config';

const BASE_URL = API_URL.replace(/\/api\/?$/, '');
function buildAssetSrc(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}
import { Button } from '../ui/button';
import { useInstituts } from '@/hooks/useInstituts';
import { institutService } from '@/services/api';
import i18n from '@/i18n';
import type { Institut, ValidationStatus } from '@/types/api';

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  approved:             { color: 'var(--edu-success)', bg: 'rgba(52,199,89,0.1)' },
  pending_admin_review: { color: 'var(--edu-warning)', bg: 'rgba(255,159,10,0.1)' },
  invited:              { color: 'var(--edu-blue)',    bg: 'rgba(0,113,227,0.1)' },
  rejected:             { color: 'var(--edu-danger)',  bg: 'rgba(255,59,48,0.1)' },
  suspended:            { color: '#9CA3AF',            bg: 'rgba(156,163,175,0.1)' },
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
  const { t } = useTranslation();
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
          <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-2">{t('admin.instituts.motifDialog.motifLabel')} <span className="text-[var(--edu-danger)]">*</span></label>
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
          <Button variant="outline" onClick={onCancel} disabled={submitting} className="rounded-xl">{t('common.cancel')}</Button>
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
  const { t } = useTranslation();
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
          <h2 className="text-lg font-bold text-[var(--edu-text-primary)]">{t('admin.instituts.deleteDialog.title')}</h2>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-[var(--edu-surface)] transition-colors">
            <X className="w-5 h-5 text-[var(--edu-text-tertiary)]" />
          </button>
        </div>
        <div className="px-6 py-6">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-[var(--edu-danger)]" />
          </div>
          <p className="text-center text-sm text-[var(--edu-text-secondary)] leading-relaxed">
            {t('admin.instituts.deleteDialog.about')}
          </p>
          <p className="text-center font-bold text-[var(--edu-text-primary)] mt-1 mb-3">« {nom} »</p>
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-xs text-red-700 dark:text-red-300 text-center">
              {t('admin.instituts.deleteDialog.warning')}
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={submitting} className="rounded-xl">{t('common.cancel')}</Button>
          <Button onClick={handleConfirm} disabled={submitting} className="rounded-xl text-white" style={{ backgroundColor: 'var(--edu-danger)' }}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            {t('admin.instituts.deleteDialog.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dialog invitation ────────────────────────────────────── */
function InviterDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
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
      toast.success(t('admin.instituts.inviteDialog.toastSuccess', { email: email.trim() }));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? t('admin.instituts.inviteDialog.toastError'));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#1D1D1F] rounded-2xl shadow-2xl border border-[var(--edu-border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-[var(--edu-border)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--edu-text-primary)]">{t('admin.instituts.inviteDialog.title')}</h2>
            <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">{t('admin.instituts.inviteDialog.subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--edu-surface)] transition-colors">
            <X className="w-5 h-5 text-[var(--edu-text-tertiary)]" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('admin.instituts.inviteDialog.emailLabel')} <span className="text-[var(--edu-danger)]">*</span></label>
            <input ref={ref} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@institut.tn"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]"
              onKeyDown={(e) => { if (e.key === 'Enter') handleInviter(); }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('admin.instituts.inviteDialog.nomLabel')} <span className="text-[var(--edu-text-tertiary)]">{t('admin.instituts.inviteDialog.nomOptional')}</span></label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Université de Tunis"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="rounded-xl">{t('common.cancel')}</Button>
          <Button onClick={handleInviter} disabled={!email.trim() || submitting} className="rounded-xl text-white" style={{ backgroundColor: 'var(--edu-blue)' }}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {t('admin.instituts.inviteDialog.send')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dialog détails institut ──────────────────────────────── */
function DetailDialog({
  institut, onClose, onApprouver, onDemanderCorrection, onRefuser, processing,
}: {
  institut: Institut | null;
  onClose: () => void;
  onApprouver: (id: string) => void;
  onDemanderCorrection: (id: string) => void;
  onRefuser: (id: string) => void;
  processing: boolean;
}) {
  if (!institut) return null;
  const status = (institut.validation_status ?? 'invited') as ValidationStatus;
  const stCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.invited;
  const logoSrc = buildAssetSrc(institut.logo);
  const coverSrc = buildAssetSrc(institut.image_couverture);
  const adresseLignes = [
    institut.adresse?.rue,
    [institut.adresse?.code_postal, institut.adresse?.ville].filter(Boolean).join(' '),
    institut.adresse?.gouvernorat,
    institut.adresse?.pays,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#1D1D1F] rounded-2xl shadow-2xl border border-[var(--edu-border)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Cover ou bandeau coloré */}
        {coverSrc ? (
          <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: `url(${coverSrc})` }} />
        ) : (
          <div className="h-20 w-full bg-gradient-to-br from-[var(--edu-indigo)] to-[var(--edu-blue)]" />
        )}

        {/* Header */}
        <div className="px-6 pt-4 pb-4 border-b border-[var(--edu-border)] flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#2D2D2F] border border-[var(--edu-border)] flex items-center justify-center -mt-12 shadow-md overflow-hidden shrink-0">
            {logoSrc ? (
              <img src={logoSrc} alt={institut.nom ?? ''} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-[var(--edu-indigo)]">
                {(institut.sigle ?? institut.nom ?? 'I').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[var(--edu-text-primary)] truncate">
              {institut.nom ?? <span className="italic text-[var(--edu-text-tertiary)]">Sans nom</span>}
              {institut.sigle && <span className="text-[var(--edu-text-tertiary)] font-normal ml-2">({institut.sigle})</span>}
            </h2>
            <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: stCfg.bg, color: stCfg.color }}>
              {status}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--edu-surface)] transition-colors shrink-0">
            <X className="w-5 h-5 text-[var(--edu-text-tertiary)]" />
          </button>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Description */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--edu-text-tertiary)] mb-2 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Description
            </p>
            {institut.description ? (
              <p className="text-sm text-[var(--edu-text-primary)] leading-relaxed whitespace-pre-line">{institut.description}</p>
            ) : (
              <p className="text-sm italic text-[var(--edu-text-tertiary)]">Aucune description fournie.</p>
            )}
          </section>

          {/* Contact */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--edu-text-tertiary)] mb-2">Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {institut.contact?.email && (
                <div className="flex items-center gap-2 text-[var(--edu-text-secondary)]">
                  <Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{institut.contact.email}</span>
                </div>
              )}
              {institut.contact?.telephone && (
                <div className="flex items-center gap-2 text-[var(--edu-text-secondary)]">
                  <Phone className="w-3.5 h-3.5 shrink-0" /><span>{institut.contact.telephone}</span>
                </div>
              )}
              {institut.site_web && (
                <div className="flex items-center gap-2 text-[var(--edu-text-secondary)] sm:col-span-2">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <a href={institut.site_web} target="_blank" rel="noopener noreferrer" className="text-[var(--edu-blue)] hover:underline truncate">
                    {institut.site_web}
                  </a>
                </div>
              )}
              {!institut.contact?.email && !institut.contact?.telephone && !institut.site_web && (
                <p className="text-sm italic text-[var(--edu-text-tertiary)] sm:col-span-2">Aucune information de contact.</p>
              )}
            </div>
          </section>

          {/* Adresse */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--edu-text-tertiary)] mb-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Adresse
            </p>
            {adresseLignes.length > 0 ? (
              <p className="text-sm text-[var(--edu-text-secondary)] leading-relaxed">
                {adresseLignes.map((ligne, i) => <span key={i} className="block">{ligne}</span>)}
              </p>
            ) : (
              <p className="text-sm italic text-[var(--edu-text-tertiary)]">Aucune adresse renseignée.</p>
            )}
          </section>

          {/* Accréditations */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--edu-text-tertiary)] mb-2 flex items-center gap-1">
              <Award className="w-3 h-3" /> Accréditations
            </p>
            {institut.accreditations && institut.accreditations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {institut.accreditations.map((a, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--edu-surface)] text-[var(--edu-text-primary)]">
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-[var(--edu-text-tertiary)]">Aucune accréditation déclarée.</p>
            )}
          </section>

          {/* Programmes publiés */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--edu-text-tertiary)] mb-2">
              Programmes publiés ({institut.programmes?.length ?? 0})
            </p>
            {institut.programmes && institut.programmes.length > 0 ? (
              <ul className="space-y-1.5">
                {institut.programmes.map((p) => (
                  <li key={p.id} className="text-sm flex items-center gap-2 text-[var(--edu-text-secondary)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--edu-blue)]" />
                    <span className="text-[var(--edu-text-primary)]">{p.titre}</span>
                    {p.niveau && <span className="text-xs text-[var(--edu-text-tertiary)]">— {p.niveau}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic text-[var(--edu-text-tertiary)]">Aucun programme publié pour le moment.</p>
            )}
          </section>

          {/* Motif rejet précédent */}
          {institut.suspension_reason && (
            <section className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-1">
                Dernier motif de rejet / suspension
              </p>
              <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">{institut.suspension_reason}</p>
            </section>
          )}
        </div>

        {/* Footer actions — uniquement pour les profils en attente de validation */}
        {status === 'pending_admin_review' && (
          <div className="px-6 py-4 border-t border-[var(--edu-border)] flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 bg-[var(--edu-surface)]">
            <Button
              variant="outline"
              onClick={() => onRefuser(institut.id)}
              disabled={processing}
              className="rounded-xl border-[var(--edu-danger)] text-[var(--edu-danger)] hover:bg-[var(--edu-danger)]/10"
            >
              <ShieldOff className="w-4 h-4 mr-2" /> Refuser définitivement
            </Button>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => onDemanderCorrection(institut.id)}
                disabled={processing}
                className="rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Demander une correction
              </Button>
              <Button
                onClick={() => onApprouver(institut.id)}
                disabled={processing}
                className="rounded-xl text-white"
                style={{ backgroundColor: 'var(--edu-success)' }}
              >
                {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Approuver
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Section principale ───────────────────────────────────── */
export function InstitutesSection() {
  const { t } = useTranslation();
  const { instituts: institutsRaw, loading, refetch } = useInstituts({ admin_view: true });
  const instituts = institutsRaw as Institut[];

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('tous');
  const [page, setPage] = React.useState(1);
  const [actionMenu, setActionMenu] = React.useState<string | null>(null);
  const [menuPos, setMenuPos] = React.useState<{ top: number; right: number } | null>(null);
  const [processing, setProcessing] = React.useState<string | null>(null);

  const [motifDialog, setMotifDialog] = React.useState<{ type: 'suspendre' | 'rejeter'; id: string } | null>(null);
  const [showInviter, setShowInviter] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Institut | null>(null);
  const [detailTarget, setDetailTarget] = React.useState<Institut | null>(null);

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
    { labelKey: 'admin.instituts.stats.total', value: instituts.length, color: 'var(--edu-text-primary)' },
    { labelKey: 'admin.instituts.stats.approved', value: instituts.filter((i) => i.validation_status === 'approved').length, color: 'var(--edu-success)' },
    { labelKey: 'admin.instituts.stats.pending', value: instituts.filter((i) => i.validation_status === 'pending_admin_review').length, color: 'var(--edu-warning)' },
    { labelKey: 'admin.instituts.stats.suspended', value: instituts.filter((i) => i.validation_status === 'suspended').length, color: 'var(--edu-danger)' },
  ];

  const handleApprouver = async (id: string) => {
    setProcessing(id);
    try { await institutService.approuver(id); toast.success(t('admin.instituts.toasts.approved')); refetch(); }
    catch (err: unknown) { const a = err as { response?: { data?: { message?: string } } }; toast.error(a?.response?.data?.message ?? t('admin.instituts.toasts.error')); }
    finally { setProcessing(null); setActionMenu(null); setDetailTarget(null); }
  };

  const handleMotifConfirm = async (motif: string) => {
    if (!motifDialog) return;
    const { type, id } = motifDialog;
    setProcessing(id);
    try {
      if (type === 'rejeter') { await institutService.rejeter(id, motif); toast.success(t('admin.instituts.toasts.rejected')); }
      else { await institutService.suspendre(id, motif); toast.success(t('admin.instituts.toasts.suspended')); }
      refetch();
    } catch (err: unknown) {
      const a = err as { response?: { data?: { message?: string } } };
      toast.error(a?.response?.data?.message ?? t('admin.instituts.toasts.error'));
    } finally { setProcessing(null); setActionMenu(null); setMotifDialog(null); setDetailTarget(null); }
  };

  const handleReactiver = async (id: string) => {
    setProcessing(id);
    try { await institutService.reactiver(id); toast.success(t('admin.instituts.toasts.reactivated')); refetch(); }
    catch (err: unknown) { const a = err as { response?: { data?: { message?: string } } }; toast.error(a?.response?.data?.message ?? t('admin.instituts.toasts.error')); }
    finally { setProcessing(null); setActionMenu(null); }
  };

  const handleSupprimer = (inst: Institut) => {
    setDeleteTarget(inst);
    setActionMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setProcessing(deleteTarget.id);
    try { await institutService.delete(deleteTarget.id); toast.success(t('admin.instituts.toasts.deleted')); refetch(); }
    catch (err: unknown) { const a = err as { response?: { data?: { message?: string } } }; toast.error(a?.response?.data?.message ?? t('admin.instituts.toasts.error')); }
    finally { setProcessing(null); setDeleteTarget(null); }
  };

  const getActions = (inst: Institut) => {
    const status = inst.validation_status as ValidationStatus;
    const actions: { label: string; icon: React.ComponentType<{ className?: string }>; color: string; handler: () => void }[] = [];
    if (status === 'pending_admin_review') {
      actions.push({ label: t('admin.instituts.actions.approve'), icon: CheckCircle, color: 'var(--edu-success)', handler: () => handleApprouver(inst.id) });
      actions.push({ label: t('admin.instituts.actions.reject'), icon: XCircle, color: 'var(--edu-danger)', handler: () => { setMotifDialog({ type: 'rejeter', id: inst.id }); setActionMenu(null); } });
    }
    if (status === 'approved') {
      actions.push({ label: t('admin.instituts.actions.suspend'), icon: ShieldOff, color: 'var(--edu-warning)', handler: () => { setMotifDialog({ type: 'suspendre', id: inst.id }); setActionMenu(null); } });
    }
    if (status === 'suspended' || status === 'rejected') {
      actions.push({ label: t('admin.instituts.actions.reactivate'), icon: RefreshCw, color: 'var(--edu-success)', handler: () => handleReactiver(inst.id) });
    }
    actions.push({ label: t('admin.instituts.actions.delete'), icon: Trash2, color: 'var(--edu-danger)', handler: () => handleSupprimer(inst) });
    return actions;
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)] mb-1">{t('admin.instituts.sectionLabel')}</p>
            <h1 className="text-3xl font-bold text-[var(--edu-text-primary)]">{t('admin.instituts.title')}</h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-1">{t('admin.instituts.subtitle')}</p>
          </div>
          <Button onClick={() => setShowInviter(true)} className="rounded-full text-white" style={{ backgroundColor: 'var(--edu-blue)' }}>
            <Plus className="w-4 h-4 mr-2" /> {t('admin.instituts.inviteButton')}
          </Button>
        </div>
      </div>

      <div className="p-8 space-y-6 max-w-[1600px]">
        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.labelKey} className="bg-white dark:bg-[#1D1D1F] rounded-2xl p-5 border border-[var(--edu-border)]">
              <p className="text-3xl font-bold tracking-tight" style={{ color: s.color }}>
                {loading ? <span className="inline-block w-10 h-8 bg-[var(--edu-surface)] rounded animate-pulse" /> : s.value}
              </p>
              <p className="text-xs text-[var(--edu-text-secondary)] mt-1">{t(s.labelKey)}</p>
            </div>
          ))}
        </motion.div>

        {/* Filtres */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--edu-text-tertiary)]" />
            <input type="text" placeholder={t('admin.instituts.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] transition-shadow" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['tous', 'approved', 'pending_admin_review', 'suspended', 'rejected', 'invited'] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-[var(--edu-indigo)] text-white' : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)] hover:bg-[var(--edu-border)]'}`}>
                {s === 'tous' ? t('admin.instituts.allFilter') : t(`admin.instStatus.${s}`)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tableau */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }}
          className="bg-white dark:bg-[#1D1D1F] rounded-2xl border border-[var(--edu-border)]">
          <div>
            <table className="w-full">
              <thead className="bg-[var(--edu-surface)]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.instituts.columns.institut')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.instituts.columns.status')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.instituts.columns.programs')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.instituts.columns.registeredAt')}</th>
                  <th className="sticky right-0 bg-[var(--edu-surface)] text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--edu-text-tertiary)]">{t('admin.instituts.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--edu-divider)]">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--edu-surface)] rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center"><Building2 className="w-8 h-8 mx-auto mb-2 text-[var(--edu-text-tertiary)]" /><p className="text-sm text-[var(--edu-text-secondary)]">{t('admin.instituts.empty')}</p></td></tr>
                ) : paginated.map((inst) => {
                  const stKey = inst.validation_status ?? 'invited';
                  const stCfg = STATUS_CONFIG[stKey] ?? STATUS_CONFIG.invited;
                  const stLabel = t(`admin.instStatus.${stKey}`, { defaultValue: stKey });
                  const actions = getActions(inst);
                  return (
                    <tr
                      key={inst.id}
                      onClick={() => setDetailTarget(inst)}
                      className="hover:bg-[var(--edu-surface)] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--edu-indigo)] to-[var(--edu-blue)] flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {(inst.sigle ?? inst.nom ?? 'I').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 max-w-[220px]">
                            <p className="font-semibold text-sm text-[var(--edu-text-primary)] truncate">
                              {inst.sigle ?? inst.nom ?? <span className="italic text-[var(--edu-text-tertiary)]">{t('admin.instituts.noName')}</span>}
                            </p>
                            {inst.nom && (
                              <p className="text-xs text-[var(--edu-text-tertiary)] truncate">{inst.nom}</p>
                            )}
                            <p className="text-xs text-[var(--edu-text-tertiary)] truncate flex items-center gap-1"><Mail className="w-3 h-3" />{inst.utilisateur?.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: stCfg.bg, color: stCfg.color }}>
                          {inst.est_verifie && <CheckCircle className="w-3 h-3" />}
                          {stLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className="text-sm font-semibold text-[var(--edu-text-primary)]">{inst.programmes?.length ?? 0}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-[var(--edu-text-secondary)]">{inst.cree_le ? new Date(inst.cree_le).toLocaleDateString(i18n.language) : '—'}</span></td>
                      <td className="sticky right-0 bg-white dark:bg-[#1D1D1F] px-4 py-3 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end relative">
                          {actions.length > 0 && (
                            <>
                              <Button variant="ghost" size="sm" disabled={processing === inst.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (actionMenu === inst.id) { setActionMenu(null); setMenuPos(null); return; }
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                  setActionMenu(inst.id);
                                }}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
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
              <p className="text-xs text-[var(--edu-text-tertiary)]">{t('admin.instituts.results', { count: filtered.length })} — {t('common.page')} {page}/{totalPages}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dropdown actions (fixed — échappe overflow table) */}
      {actionMenu !== null && menuPos !== null && (() => {
        const inst = paginated.find((i) => i.id === actionMenu);
        if (!inst) return null;
        const actions = getActions(inst);
        return (
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => { setActionMenu(null); setMenuPos(null); }} />
            <div
              className="fixed z-[100] bg-white dark:bg-[#2D2D2F] rounded-xl shadow-xl border border-[var(--edu-border)] py-1 animate-in fade-in slide-in-from-top-1"
              style={{ top: menuPos.top, right: menuPos.right, minWidth: 180 }}
            >
              {actions.map((a) => { const Icon = a.icon; return (
                <button key={a.label} onClick={(e) => { e.stopPropagation(); a.handler(); setActionMenu(null); setMenuPos(null); }}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 whitespace-nowrap hover:bg-[var(--edu-surface)]" style={{ color: a.color }}>
                  <Icon className="w-4 h-4" />{a.label}
                </button>
              ); })}
            </div>
          </>
        );
      })()}

      {/* Motif Dialog */}
      <MotifDialog
        open={motifDialog !== null}
        title={motifDialog?.type === 'suspendre' ? t('admin.instituts.motifDialog.suspendTitle') : t('admin.instituts.motifDialog.rejectTitle')}
        placeholder={motifDialog?.type === 'suspendre' ? t('admin.instituts.motifDialog.suspendPlaceholder') : t('admin.instituts.motifDialog.rejectPlaceholder')}
        confirmLabel={motifDialog?.type === 'suspendre' ? t('admin.instituts.motifDialog.suspendConfirm') : t('admin.instituts.motifDialog.rejectConfirm')}
        confirmColor={motifDialog?.type === 'suspendre' ? 'var(--edu-warning)' : 'var(--edu-danger)'}
        onConfirm={handleMotifConfirm}
        onCancel={() => setMotifDialog(null)}
      />

      <InviterDialog open={showInviter} onClose={() => setShowInviter(false)} onSuccess={refetch} />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        nom={deleteTarget?.nom ?? deleteTarget?.utilisateur?.email ?? t('admin.instituts.noName')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <DetailDialog
        institut={detailTarget}
        onClose={() => setDetailTarget(null)}
        onApprouver={handleApprouver}
        onDemanderCorrection={(id) => setMotifDialog({ type: 'rejeter', id })}
        onRefuser={(id) => setMotifDialog({ type: 'suspendre', id })}
        processing={processing === detailTarget?.id}
      />
    </div>
  );
}
