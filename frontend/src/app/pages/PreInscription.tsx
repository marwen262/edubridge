import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import {
  CheckCircle, Download, Upload, X, Loader2, FileText,
} from 'lucide-react';
import { DashboardSidebar } from '../components/DashboardSidebar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useCandidatures } from '@/hooks/useCandidatures';
import { usePreInscription } from '@/hooks/usePreInscription';
import { preInscriptionService } from '@/services/api';
import type { PreInscription as PreInscriptionType } from '@/types/api';

const schema = z.object({
  adresse_complete:      z.string().min(1, 'Adresse requise'),
  ville:                 z.string().min(1, 'Ville requise'),
  pays:                  z.string().min(1, 'Pays requis'),
  code_postal:           z.string().min(1, 'Code postal requis'),
  telephone:             z.string().min(8, 'Téléphone invalide'),
  date_naissance:        z.string().min(1, 'Date de naissance requise'),
  nationalite:           z.string().min(1, 'Nationalité requise'),
  type_piece_identite:   z.enum(['cin', 'passeport']),
  numero_piece_identite: z.string().min(1, 'Numéro de pièce requis'),
});
type FormValues = z.infer<typeof schema>;

export function PreInscription() {
  const { t, i18n } = useTranslation();
  const { candidatureId } = useParams<{ candidatureId: string }>();
  const { user } = useAuth();
  const { candidatures, loading: loadingCandidatures } = useCandidatures();
  const {
    preInscription: pi,
    loading: loadingPi,
    refetch,
  } = usePreInscription(candidatureId ?? '');

  const [submitting, setSubmitting]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [photoFile, setPhotoFile]     = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // Révoquer les blob URLs quand elles sont remplacées ou à l'unmount
  useEffect(() => {
    if (!photoPreview?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      adresse_complete: '', ville: '', pays: '', code_postal: '',
      telephone: '', date_naissance: '', nationalite: '',
      type_piece_identite: 'cin', numero_piece_identite: '',
    },
  });

  const candidature = candidatures.find((c) => c.id === candidatureId);
  const prenom = user?.prenom ?? user?.email?.split('@')[0] ?? '';

  // Pré-remplissage depuis la pré-inscription existante ou le profil candidat
  useEffect(() => {
    if (loadingPi || loadingCandidatures) return;

    if (pi) {
      reset({
        adresse_complete:      pi.adresse_complete      ?? '',
        ville:                 pi.ville                 ?? '',
        pays:                  pi.pays                  ?? '',
        code_postal:           pi.code_postal           ?? '',
        telephone:             pi.telephone             ?? '',
        date_naissance:        pi.date_naissance        ?? '',
        nationalite:           pi.nationalite           ?? '',
        type_piece_identite:   (pi.type_piece_identite as 'cin' | 'passeport') ?? 'cin',
        numero_piece_identite: pi.numero_piece_identite ?? '',
      });
      if (pi.photo_identite_url) setPhotoPreview(pi.photo_identite_url);
    } else if (candidature?.candidat) {
      const c = candidature.candidat;
      reset({
        adresse_complete: c.adresse?.rue ?? '',
        ville:            c.adresse?.ville ?? '',
        pays:             c.adresse?.pays ?? '',
        code_postal:      c.adresse?.code_postal ?? '',
        telephone:        c.telephone ?? '',
        date_naissance:   c.date_naissance ?? '',
        nationalite:      c.nationalite ?? '',
        type_piece_identite:
          (c.type_piece_identite as 'cin' | 'passeport') ?? 'cin',
        numero_piece_identite: c.cin ?? c.numero_passeport ?? '',
      });
    }
  }, [pi, candidature, loadingPi, loadingCandidatures, reset]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('preInscription.toasts.photoTooLarge'));
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoRef.current) photoRef.current.value = '';
  };

  const onSubmit = async (values: FormValues) => {
    if (!candidatureId) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('candidature_id', candidatureId);
      (Object.entries(values) as [string, string][]).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      if (photoFile) fd.append('photo_identite', photoFile);

      const { data } = await preInscriptionService.creerOuCompleter(fd);
      const payload = data as { preInscription: PreInscriptionType };

      if (payload.preInscription.statut === 'completee') {
        toast.success(t('preInscription.toasts.savedAndCompleted'));
      } else {
        toast.success(t('preInscription.toasts.saved'));
      }
      refetch();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr.response?.data?.message ?? t('preInscription.toasts.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!pi) return;
    setDownloading(true);
    try {
      await preInscriptionService.downloadPdf(
        pi.id,
        `attestation-preinscription-${pi.id.substring(0, 8)}.pdf`
      );
    } catch {
      toast.error(t('preInscription.toasts.pdfError'));
    } finally {
      setDownloading(false);
    }
  };

  const isLoading = loadingCandidatures || loadingPi;

  // ── Chargement ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-screen bg-[var(--edu-surface)]">
        <DashboardSidebar
          role="candidate"
          user={{ name: prenom, role: user?.role ?? 'candidat' }}
        />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--edu-blue)]" />
        </main>
      </div>
    );
  }

  // ── Candidature non trouvée ou non acceptée ───────────────────────────
  if (!candidature || candidature.statut !== 'acceptee') {
    return (
      <div className="flex h-screen bg-[var(--edu-surface)]">
        <DashboardSidebar
          role="candidate"
          user={{ name: prenom, role: user?.role ?? 'candidat' }}
        />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center glass-card rounded-2xl p-10 max-w-md">
            <FileText className="w-12 h-12 text-[var(--edu-text-tertiary)] mx-auto mb-3" />
            <p className="text-sm text-[var(--edu-text-secondary)]">
              {!candidature
                ? t('preInscription.notFound')
                : t('preInscription.notAccepted')}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── État complétée : succès + téléchargement PDF ─────────────────────
  if (pi?.statut === 'completee') {
    return (
      <div className="flex h-screen bg-[var(--edu-surface)]">
        <DashboardSidebar
          role="candidate"
          user={{ name: prenom, role: user?.role ?? 'candidat' }}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
            <h1 className="text-2xl font-bold text-[var(--edu-text-primary)]">
              {t('preInscription.title')}
            </h1>
            <p className="text-sm text-[var(--edu-text-secondary)] mt-0.5 truncate">
              {candidature.programme?.titre ?? '—'}
              {candidature.programme?.institut?.nom && (
                <span className="ml-2 text-[var(--edu-text-tertiary)]">
                  · {candidature.programme.institut.nom}
                </span>
              )}
            </p>
          </div>

          <div className="p-8 max-w-xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="glass-card rounded-2xl p-8 border border-[var(--edu-success)]/30 bg-[var(--edu-success)]/5"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'rgba(52,199,89,0.12)' }}
              >
                <CheckCircle className="w-7 h-7 text-[var(--edu-success)]" />
              </div>

              <h2 className="text-xl font-bold text-[var(--edu-text-primary)] text-center mb-1">
                {t('preInscription.completed.title')}
              </h2>
              <p className="text-sm text-[var(--edu-text-secondary)] text-center mb-6">
                {t('preInscription.completed.description', {
                  date: pi.completee_le
                    ? new Date(pi.completee_le).toLocaleDateString(i18n.language)
                    : '—',
                })}
              </p>

              {/* Résumé */}
              <div className="bg-white dark:bg-[#2C2C2E] rounded-xl p-5 mb-6 space-y-2 text-sm">
                {[
                  [t('preInscription.fields.adresse_complete'), pi.adresse_complete],
                  [t('preInscription.fields.ville'), [pi.ville, pi.code_postal].filter(Boolean).join(' ')],
                  [t('preInscription.fields.pays'), pi.pays],
                  [t('preInscription.fields.telephone'), pi.telephone],
                  [t('preInscription.fields.nationalite'), pi.nationalite],
                  [t(`preInscription.pieceIdentite.${pi.type_piece_identite ?? 'cin'}`), pi.numero_piece_identite],
                ].map(([label, val]) =>
                  val ? (
                    <div key={String(label)} className="flex justify-between gap-4">
                      <span className="text-[var(--edu-text-secondary)]">{label}</span>
                      <span className="font-medium text-[var(--edu-text-primary)] text-right">{val}</span>
                    </div>
                  ) : null
                )}
              </div>

              <Button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="w-full bg-[var(--edu-success)] hover:opacity-90 text-white"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {downloading
                  ? t('preInscription.completed.downloading')
                  : t('preInscription.completed.downloadPdf')}
              </Button>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  // ── Formulaire (en_attente ou null) ───────────────────────────────────
  return (
    <div className="flex h-screen bg-[var(--edu-surface)]">
      <DashboardSidebar
        role="candidate"
        user={{ name: prenom, role: user?.role ?? 'candidat' }}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] px-8 py-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--edu-text-primary)]">
              {t('preInscription.title')}
            </h1>
            <Badge
              variant="secondary"
              className="text-[var(--edu-warning)] bg-[var(--edu-warning)]/10 border-0"
            >
              {t('preInscription.status.en_attente')}
            </Badge>
          </div>
          <p className="text-sm text-[var(--edu-text-secondary)] mt-0.5 truncate">
            {candidature.programme?.titre ?? '—'}
            {candidature.programme?.institut?.nom && (
              <span className="ml-2 text-[var(--edu-text-tertiary)]">
                · {candidature.programme.institut.nom}
              </span>
            )}
          </p>
          <p className="text-xs text-[var(--edu-text-secondary)] mt-2">
            {t('preInscription.subtitle')}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-8 max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Section Adresse ─────────────────────────────────────── */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-base font-semibold text-[var(--edu-text-primary)] mb-5">
                {t('preInscription.sections.address')}
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adresse_complete" className="text-sm font-medium text-[var(--edu-text-primary)]">
                    {t('preInscription.fields.adresse_complete')}
                  </Label>
                  <Input
                    id="adresse_complete"
                    {...register('adresse_complete')}
                    placeholder="8 Avenue de la République"
                    className="mt-1"
                  />
                  {errors.adresse_complete && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.adresse_complete.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ville" className="text-sm font-medium text-[var(--edu-text-primary)]">
                      {t('preInscription.fields.ville')}
                    </Label>
                    <Input id="ville" {...register('ville')} placeholder="Sfax" className="mt-1" />
                    {errors.ville && (
                      <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.ville.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="code_postal" className="text-sm font-medium text-[var(--edu-text-primary)]">
                      {t('preInscription.fields.code_postal')}
                    </Label>
                    <Input id="code_postal" {...register('code_postal')} placeholder="3000" className="mt-1" />
                    {errors.code_postal && (
                      <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.code_postal.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="pays" className="text-sm font-medium text-[var(--edu-text-primary)]">
                    {t('preInscription.fields.pays')}
                  </Label>
                  <Input id="pays" {...register('pays')} placeholder="Tunisie" className="mt-1" />
                  {errors.pays && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.pays.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section Identité ─────────────────────────────────────── */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-base font-semibold text-[var(--edu-text-primary)] mb-5">
                {t('preInscription.sections.identity')}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_naissance" className="text-sm font-medium text-[var(--edu-text-primary)]">
                      {t('preInscription.fields.date_naissance')}
                    </Label>
                    <Input
                      id="date_naissance"
                      type="date"
                      {...register('date_naissance')}
                      className="mt-1"
                    />
                    {errors.date_naissance && (
                      <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.date_naissance.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="telephone" className="text-sm font-medium text-[var(--edu-text-primary)]">
                      {t('preInscription.fields.telephone')}
                    </Label>
                    <Input
                      id="telephone"
                      {...register('telephone')}
                      placeholder="+216 25 987 654"
                      className="mt-1"
                    />
                    {errors.telephone && (
                      <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.telephone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="nationalite" className="text-sm font-medium text-[var(--edu-text-primary)]">
                    {t('preInscription.fields.nationalite')}
                  </Label>
                  <Input
                    id="nationalite"
                    {...register('nationalite')}
                    placeholder="tunisienne"
                    className="mt-1"
                  />
                  {errors.nationalite && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.nationalite.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-[var(--edu-text-primary)]">
                    {t('preInscription.fields.type_piece_identite')}
                  </Label>
                  <Controller
                    name="type_piece_identite"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('candidate.application.selectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cin">
                            {t('preInscription.pieceIdentite.cin')}
                          </SelectItem>
                          <SelectItem value="passeport">
                            {t('preInscription.pieceIdentite.passeport')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type_piece_identite && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.type_piece_identite.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="numero_piece_identite" className="text-sm font-medium text-[var(--edu-text-primary)]">
                    {t('preInscription.fields.numero_piece_identite')}
                  </Label>
                  <Input
                    id="numero_piece_identite"
                    {...register('numero_piece_identite')}
                    placeholder="22334455"
                    className="mt-1"
                  />
                  {errors.numero_piece_identite && (
                    <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.numero_piece_identite.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section Photo ─────────────────────────────────────────── */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-base font-semibold text-[var(--edu-text-primary)] mb-2">
                {t('preInscription.sections.photo')}
              </h2>
              <p className="text-xs text-[var(--edu-text-secondary)] mb-5">
                {t('preInscription.photo.hint')}
              </p>

              {photoPreview ? (
                <div className="relative w-24 h-24">
                  <img
                    src={photoPreview}
                    alt={t('preInscription.fields.photo_identite')}
                    className="w-24 h-24 rounded-xl object-cover border border-[var(--edu-border)]"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--edu-danger)] text-white rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                    aria-label={t('preInscription.photo.remove')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="w-full border-2 border-dashed border-[var(--edu-border)] rounded-xl p-6 flex flex-col items-center gap-2 hover:border-[var(--edu-blue)] hover:bg-[var(--edu-blue)]/3 transition-colors group"
                >
                  <Upload className="w-6 h-6 text-[var(--edu-text-tertiary)] group-hover:text-[var(--edu-blue)] transition-colors" />
                  <span className="text-sm text-[var(--edu-text-secondary)] group-hover:text-[var(--edu-blue)] transition-colors">
                    {t('preInscription.photo.upload')}
                  </span>
                </button>
              )}

              <input
                ref={photoRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* ── Bouton soumission ────────────────────────────────────── */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t('preInscription.submitting')}
                </>
              ) : (
                t('preInscription.submit')
              )}
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
