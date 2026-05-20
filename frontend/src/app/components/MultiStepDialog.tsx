import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, CheckCircle2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Stepper, Step } from './Stepper';
import { AdresseFields } from './forms/AdresseFields';
import { toast } from 'sonner';
import { authService, candidatureService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { estTunisien, getIndicatifByNationalite } from '@/app/data/nationalites';
import { decomposerTelephone, composerTelephone } from '@/app/data/indicatifs';
import { NationaliteSelect } from './forms/NationaliteSelect';
import { IndicatifTelephone } from './forms/IndicatifTelephone';
import type { Programme, Candidat, Adresse, ParcoursAcademique } from '@/types/api';
import { cn } from './ui/utils';
import i18n from '@/i18n';

interface MultiStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programme: Programme;
  /** Si fourni : reprendre ce brouillon existant (skip create, update only) */
  candidatureId?: string;
  /** Lettre de motivation déjà enregistrée dans le brouillon */
  lettreMotivationInitiale?: string;
  /** Documents déjà déposés côté serveur pour ce brouillon */
  documentsExistants?: import('@/types/api').DocumentSoumis[];
}

// Catalogue des champs Multer valides côté backend (cf. candidatureRoutes.js).
// Tout `documents_requis[*].nom` qui n'est PAS dans cette liste est ignoré
// silencieusement à l'affichage (ne crash pas).
const FICHIERS_AUTORISES: Record<string, string> = {
  diplome_bac:           'candidate.application.documents.types.diplome_bac',
  diplome_licence:       'candidate.application.documents.types.diplome_licence',
  releves_notes:         'candidate.application.documents.types.releves_notes',
  attestation_prepa:     'candidate.application.documents.types.attestation_prepa',
  lettre_recommandation: 'candidate.application.documents.types.lettre_recommandation',
  attestation_stage:     'candidate.application.documents.types.attestation_stage',
};

// ─────────────────────────────────────────────────────────────
// Schémas zod
// ─────────────────────────────────────────────────────────────

const adresseSchema = z.object({
  rue: z.string().optional().or(z.literal('')),
  ville: z.string().min(1, i18n.t('candidate.application.validation.cityRequired', { defaultValue: 'Ville requise' })),
  gouvernorat: z.string().optional().or(z.literal('')),
  code_postal: z.string().optional().or(z.literal('')),
  pays: z.string().optional().or(z.literal('')),
});

const parcoursSchema = z.object({
  diplome: z.string().min(1, i18n.t('candidate.application.validation.degreeRequired', { defaultValue: 'Diplôme requis' })),
  etablissement: z.string().min(1, i18n.t('candidate.application.validation.institutionRequired', { defaultValue: 'Établissement requis' })),
  annee: z
    .number({ error: i18n.t('candidate.application.validation.yearInvalid', { defaultValue: 'Année invalide' }) })
    .int()
    .min(1950, i18n.t('candidate.application.validation.yearTooOld', { defaultValue: 'Année trop ancienne' }))
    .max(new Date().getFullYear() + 1, i18n.t('candidate.application.validation.futureYearInvalid', { defaultValue: 'Année future invalide' })),
  mention: z.string().optional().or(z.literal('')),
});

const formSchema = z
  .object({
    // Identité
    prenom: z.string().min(1, i18n.t('candidate.application.validation.firstNameRequired', { defaultValue: 'Prénom requis' })),
    nom: z.string().min(1, i18n.t('candidate.application.validation.lastNameRequired', { defaultValue: 'Nom requis' })),
    date_naissance: z.string().optional().or(z.literal('')),
    genre: z.union([z.literal('homme'), z.literal('femme'), z.literal('')]).optional(),
    nationalite: z.string().min(1, i18n.t('candidate.application.validation.nationalityRequired', { defaultValue: 'Nationalité requise' })),
    cin: z.string().optional().or(z.literal('')),
    numero_passeport: z.string().optional().or(z.literal('')),
    telephone: z.string().min(4, i18n.t('candidate.application.validation.phoneRequired', { defaultValue: 'Téléphone requis' })),
    adresse: adresseSchema,
    // Académique
    niveau_actuel: z.string().optional().or(z.literal('')),
    type_bac: z.string().optional().or(z.literal('')),
    moyenne_bac: z.string().optional().or(z.literal('')),
    annee_bac: z.string().optional().or(z.literal('')),
    parcours_academique: z.array(parcoursSchema).min(1, i18n.t('candidate.application.validation.addOneDegree', { defaultValue: 'Ajoutez au moins un diplôme' })),
    // Motivation
    motivation: z.string().min(20, i18n.t('candidate.application.validation.motivationMin', { defaultValue: 'La lettre de motivation doit contenir au moins 20 caractères' })),
    // CGU
    termsAccepted: z.boolean().refine((v) => v === true, {
      message: i18n.t('candidate.application.validation.termsRequired', { defaultValue: 'Vous devez accepter les conditions générales' }),
    }),
  })
  .superRefine((data, ctx) => {
    // Identité conditionnelle (cohérente avec le hook beforeValidate du modèle Candidat)
    if (estTunisien(data.nationalite)) {
      if (!data.cin || !/^[0-9]{8}$/.test(data.cin)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cin'],
          message: i18n.t('candidate.application.validation.cinInvalid', { defaultValue: 'CIN tunisien requis (8 chiffres)' }),
        });
      }
    } else if (data.nationalite) {
      if (!data.numero_passeport || !/^[A-Za-z0-9]{6,20}$/.test(data.numero_passeport)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['numero_passeport'],
          message: i18n.t('candidate.application.validation.passportInvalid', { defaultValue: 'Passeport requis (6 à 20 caractères alphanumériques)' }),
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

// Valeurs par défaut neutres (utilisées avant que /auth/me ne réponde)
const VALEURS_VIDES: FormValues = {
  prenom: '',
  nom: '',
  date_naissance: '',
  genre: '',
  nationalite: '',
  cin: '',
  numero_passeport: '',
  telephone: '',
  adresse: { rue: '', ville: '', gouvernorat: '', code_postal: '', pays: '' },
  niveau_actuel: '',
  type_bac: '',
  moyenne_bac: '',
  annee_bac: '',
  parcours_academique: [],
  motivation: '',
  termsAccepted: false,
};

// Convertit un Candidat backend en valeurs de formulaire
function candidatVersForm(c: Candidat | null | undefined): Partial<FormValues> {
  if (!c) return {};
  return {
    prenom: c.prenom ?? '',
    nom: c.nom ?? '',
    date_naissance: c.date_naissance ? c.date_naissance.slice(0, 10) : '',
    genre: (c.genre as 'homme' | 'femme' | undefined) ?? '',
    nationalite: c.nationalite ?? 'tunisienne',
    cin: c.cin ?? '',
    numero_passeport: c.numero_passeport ?? '',
    telephone: c.telephone ?? '',
    adresse: {
      rue: c.adresse?.rue ?? '',
      ville: c.adresse?.ville ?? '',
      gouvernorat: c.adresse?.gouvernorat ?? '',
      code_postal: c.adresse?.code_postal ?? '',
      pays: c.adresse?.pays ?? '',
    },
    niveau_actuel: c.niveau_actuel ?? '',
    moyenne_bac: c.moyenne_bac != null ? String(c.moyenne_bac) : '',
    annee_bac: c.annee_bac != null ? String(c.annee_bac) : '',
    parcours_academique: Array.isArray(c.parcours_academique)
      ? c.parcours_academique.map((p) => ({
          diplome: p.diplome ?? '',
          etablissement: p.etablissement ?? '',
          annee: p.annee ?? new Date().getFullYear(),
          mention: p.mention ?? '',
        }))
      : [],
  };
}

// ─────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────

export function MultiStepDialog({
  open,
  onOpenChange,
  programme,
  candidatureId: candidatureIdProp,
  lettreMotivationInitiale,
  documentsExistants,
}: MultiStepDialogProps) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [profilLoading, setProfilLoading] = useState(false);
  const [fichiers, setFichiers] = useState<Record<string, File>>({});

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: VALEURS_VIDES,
    mode: 'onBlur',
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = methods;

  const { fields: parcoursFields, append: appendParcours, remove: removeParcours } =
    useFieldArray({ control, name: 'parcours_academique' });

  const nationaliteCourante = watch('nationalite');
  const tunisien = estTunisien(nationaliteCourante);
  const steps: Step[] = [
    { label: t('candidate.application.steps.identity', { defaultValue: 'Identité' }) },
    { label: t('candidate.application.steps.academic', { defaultValue: 'Académique' }) },
    { label: t('candidate.application.steps.documents', { defaultValue: 'Documents' }) },
    { label: t('candidate.application.steps.motivation', { defaultValue: 'Motivation' }) },
    { label: t('candidate.application.steps.verification', { defaultValue: 'Vérification' }) },
  ];

  // ── Auto-link nationalité → indicatif téléphonique ──────────
  // Quand la nationalité change, on pré-remplit l'indicatif sauf si
  // l'utilisateur l'a manuellement modifié.
  const lastAutoIndicatifRef = useRef<string | null>(null);

  useEffect(() => {
    if (!nationaliteCourante) return;

    const newIndicatif = getIndicatifByNationalite(nationaliteCourante);
    const currentTel = getValues('telephone');
    const { indicatif: currentIndicatif, numero } = decomposerTelephone(currentTel);

    // Ne jamais écraser un numéro existant sauf si c'est nous qui avons
    // défini l'indicatif précédent (ref non nulle) OU si le champ est vide.
    const indicatifSetByUs = lastAutoIndicatifRef.current !== null;
    const champVide = !currentTel || (!numero && !currentIndicatif);
    const indicatifEstLeNotre = currentIndicatif === lastAutoIndicatifRef.current;

    if (champVide || (indicatifSetByUs && indicatifEstLeNotre)) {
      const newTel = numero
        ? composerTelephone(newIndicatif, numero)
        : composerTelephone(newIndicatif, '');
      setValue('telephone', newTel);
      lastAutoIndicatifRef.current = newIndicatif;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nationaliteCourante]);

  // Auto-fill : à l'ouverture, on récupère le profil candidat complet
  // En mode reprise (lettreMotivationInitiale), on pré-remplit aussi la motivation.
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    let cancelled = false;
    setProfilLoading(true);
    authService
      .me()
      .then((res) => {
        if (cancelled) return;
        const candidat = (res.data?.utilisateur?.candidat ?? null) as Candidat | null;
        const valeurs = {
          ...VALEURS_VIDES,
          ...candidatVersForm(candidat),
          // Reprise brouillon : pré-remplir la lettre de motivation existante
          ...(lettreMotivationInitiale ? { motivation: lettreMotivationInitiale } : {}),
        };
        reset(valeurs);
      })
      .catch(() => {
        // Profil non récupérable → on laisse les valeurs vides
      })
      .finally(() => {
        if (!cancelled) setProfilLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isAuthenticated, reset, lettreMotivationInitiale]);

  // Reset complet à la fermeture
  const reinitialiser = () => {
    setCurrentStep(0);
    setFichiers({});
    reset(VALEURS_VIDES);
  };

  const sauvegarderBrouillon = async () => {
    if (!isAuthenticated) return;
    setSavingDraft(true);
    try {
      const motivation = watch('motivation');
      if (candidatureIdProp) {
        const fd = new FormData();
        if (motivation) fd.append('lettre_motivation', motivation);
        Object.entries(fichiers).forEach(([cle, file]) => fd.append(cle, file));
        await candidatureService.update(candidatureIdProp, fd);
      } else {
        const fd = new FormData();
        fd.append('programme_id', programme.id);
        if (motivation) fd.append('lettre_motivation', motivation);
        Object.entries(fichiers).forEach(([cle, file]) => fd.append(cle, file));
        await candidatureService.create(fd);
      }
      toast.success(t('candidate.application.toasts.draftSaved', { defaultValue: 'Brouillon sauvegardé.' }));
    } catch {
      // Fermeture non bloquée en cas d'erreur
    } finally {
      setSavingDraft(false);
    }
  };

  const handleClose = async (next: boolean) => {
    if (!next && currentStep > 0 && !submitting && isAuthenticated) {
      await sauvegarderBrouillon();
    }
    onOpenChange(next);
    if (!next) reinitialiser();
  };

  // Documents requis pour CE programme (filtrés pour ne garder que les Multer connus)
  const docsProgramme = (programme.documents_requis ?? []).filter(
    (d) => d?.nom && d.nom in FICHIERS_AUTORISES
  );

  // En mode reprise : un document est «présent» s'il a été re-uploadé OU s'il
  // existe déjà côté serveur dans le brouillon existant.
  const docDejaDepose = (cle: string): boolean =>
    !!documentsExistants?.find((d) => d.nom === cle);

  const handleFichier = (cle: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png'].includes(f.type)) {
      toast.error(t('candidate.application.toasts.fileTypeInvalid', { defaultValue: 'Format non accepté. Utilisez JPG ou PNG uniquement.' }));
      e.target.value = '';
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error(t('candidate.application.toasts.fileTooLarge', { defaultValue: 'Fichier trop volumineux (max 5 Mo)' }));
      return;
    }
    setFichiers((prev) => ({ ...prev, [cle]: f }));
  };

  // Validation par étape avant de passer à la suivante
  const champsParEtape: Array<Array<keyof FormValues | `adresse.${keyof Adresse}`>> = [
    ['prenom', 'nom', 'nationalite', 'cin', 'numero_passeport', 'telephone', 'adresse.ville'],
    ['parcours_academique'],
    [],
    ['motivation'],
    [],
  ];

  const handleNext = async () => {
    const champs = champsParEtape[currentStep];
    if (champs.length > 0) {
      const ok = await trigger(champs as Array<keyof FormValues>);
      if (!ok) {
        toast.error(t('candidate.application.toasts.invalidStep', { defaultValue: 'Certaines informations sont manquantes ou invalides' }));
        return;
      }
    }
    // Étape Documents : vérifier les obligatoires (nouvellement uploadés OU déjà sur serveur)
    if (currentStep === 2) {
      const manquants = docsProgramme
        .filter((d) => d.obligatoire && !fichiers[d.nom] && !docDejaDepose(d.nom))
        .map((d) => t(FICHIERS_AUTORISES[d.nom] ?? d.nom, { defaultValue: d.nom }));
      if (manquants.length > 0) {
        toast.error(t('candidate.application.toasts.missingRequiredDocs', { defaultValue: 'Documents obligatoires manquants : {{docs}}', docs: manquants.join(', ') }));
        return;
      }
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handlePrevious = () => setCurrentStep((s) => Math.max(s - 1, 0));

  // Soumission finale
  // - Mode création  : create brouillon → update motivation → soumettre
  // - Mode reprise   : update brouillon existant (fichiers + motivation) → soumettre
  const onSubmitFinal = async (data: FormValues) => {
    if (!isAuthenticated) {
      toast.error(t('candidate.application.toasts.loginRequired', { defaultValue: 'Connectez-vous pour candidater' }));
      return;
    }
    setSubmitting(true);
    try {
      let candidatureId: string;

      if (candidatureIdProp) {
        // ── Mode reprise : on met à jour le brouillon existant ──
        candidatureId = candidatureIdProp;
        const fdUpdate = new FormData();
        fdUpdate.append('lettre_motivation', data.motivation);
        // Nouveaux fichiers uploadés par l'utilisateur (remplacement)
        Object.entries(fichiers).forEach(([cle, file]) => fdUpdate.append(cle, file));
        await candidatureService.update(candidatureId, fdUpdate);
      } else {
        // ── Mode création : créer un nouveau brouillon ──
        const fd = new FormData();
        fd.append('programme_id', programme.id);
        Object.entries(fichiers).forEach(([cle, file]) => fd.append(cle, file));
        const create = await candidatureService.create(fd);
        const newId = create.data?.candidature?.id as string | undefined;
        if (!newId) throw new Error('Candidature créée sans identifiant');
        candidatureId = newId;

        const fdPut = new FormData();
        fdPut.append('lettre_motivation', data.motivation);
        await candidatureService.update(candidatureId, fdPut);
      }

      // Profil commun aux deux modes
      const profil = {
        prenom: data.prenom,
        nom: data.nom,
        date_naissance: data.date_naissance || undefined,
        genre: data.genre || undefined,
        telephone: data.telephone,
        nationalite: data.nationalite,
        cin: tunisien ? data.cin : undefined,
        numero_passeport: !tunisien ? data.numero_passeport : undefined,
        adresse: data.adresse,
        niveau_actuel: data.niveau_actuel || undefined,
        type_bac: data.type_bac || undefined,
        moyenne_bac: data.moyenne_bac ? Number(data.moyenne_bac) : undefined,
        annee_bac: data.annee_bac ? Number(data.annee_bac) : undefined,
        parcours_academique: data.parcours_academique,
      };

      // POST /candidatures/:id/soumettre avec body.profil
      await candidatureService.soumettreAvecProfil(candidatureId, profil);

      toast.success(t('candidate.application.toasts.submitted', { defaultValue: 'Candidature soumise avec succès !' }));
      onOpenChange(false);
      reinitialiser();
    } catch (err: unknown) {
      const apiErr = err as {
        response?: {
          data?: { message?: string; manquants?: string[]; manquants_profil?: string[] };
        };
      };
      const errData = apiErr.response?.data;
      if (errData?.manquants_profil && errData.manquants_profil.length > 0) {
        toast.error(
          t('candidate.application.toasts.profileIncomplete', { defaultValue: 'Profil incomplet : {{fields}}. Vérifiez l\'étape Identité ou Académique.', fields: errData.manquants_profil.join(', ') }),
        );
      } else if (errData?.manquants && errData.manquants.length > 0) {
        toast.error(t('candidate.application.toasts.missingDocs', { defaultValue: 'Documents manquants : {{docs}}', docs: errData.manquants.join(', ') }));
      } else {
        toast.error(errData?.message ?? t('candidate.application.toasts.submitError', { defaultValue: 'Erreur lors de la soumission' }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Rendu des étapes ────────────────────────────────────────

  const renderStepIdentite = () => (
    <div className="space-y-5">
      {profilLoading && (
        <div className="rounded-xl bg-[var(--edu-blue)]/5 border border-[var(--edu-blue)]/20 px-4 py-2 text-xs text-[var(--edu-blue)]">
          {t('candidate.application.loadingProfile', { defaultValue: 'Chargement de votre profil…' })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prenom">{t('candidate.application.identity.firstName', { defaultValue: 'Prénom' })} <span className="text-[var(--edu-danger)]">*</span></Label>
          <Input id="prenom" {...register('prenom')} aria-invalid={!!errors.prenom || undefined} />
          {errors.prenom && <p className="text-xs text-[var(--edu-danger)]">{errors.prenom.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nom">{t('candidate.application.identity.lastName', { defaultValue: 'Nom' })} <span className="text-[var(--edu-danger)]">*</span></Label>
          <Input id="nom" {...register('nom')} aria-invalid={!!errors.nom || undefined} />
          {errors.nom && <p className="text-xs text-[var(--edu-danger)]">{errors.nom.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_naissance">{t('candidate.application.identity.birthDate', { defaultValue: 'Date de naissance' })}</Label>
          <Input id="date_naissance" type="date" {...register('date_naissance')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="genre">{t('candidate.application.identity.gender', { defaultValue: 'Genre' })}</Label>
          <Controller
            name="genre"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={(v) => field.onChange(v === '_none' ? '' : v)}
              >
                <SelectTrigger id="genre">
                  <SelectValue placeholder={t('candidate.application.selectPlaceholder', { defaultValue: 'Sélectionner' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homme">{t('candidate.application.identity.male', { defaultValue: 'Homme' })}</SelectItem>
                  <SelectItem value="femme">{t('candidate.application.identity.female', { defaultValue: 'Femme' })}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nationalite">{t('candidate.application.identity.nationality', { defaultValue: 'Nationalité' })} <span className="text-[var(--edu-danger)]">*</span></Label>
          <Controller
            name="nationalite"
            control={control}
            render={({ field }) => (
              <NationaliteSelect
                id="nationalite"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.nationalite && <p className="text-xs text-[var(--edu-danger)]">{errors.nationalite.message}</p>}
        </div>

        {tunisien ? (
          <div className="space-y-2">
            <Label htmlFor="cin">{t('candidate.application.identity.cin', { defaultValue: 'CIN' })} <span className="text-[var(--edu-danger)]">*</span></Label>
            <Input
              id="cin"
              inputMode="numeric"
              maxLength={8}
              placeholder={t('candidate.application.identity.cinPlaceholder', { defaultValue: '12345678' })}
              {...register('cin')}
              aria-invalid={!!errors.cin || undefined}
            />
            {errors.cin && <p className="text-xs text-[var(--edu-danger)]">{errors.cin.message}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="numero_passeport">{t('candidate.application.identity.passportNumber', { defaultValue: 'Numéro de passeport' })} <span className="text-[var(--edu-danger)]">*</span></Label>
            <Input
              id="numero_passeport"
              maxLength={20}
              placeholder={t('candidate.application.identity.passportPlaceholder', { defaultValue: 'AB123456' })}
              {...register('numero_passeport')}
              aria-invalid={!!errors.numero_passeport || undefined}
            />
            {errors.numero_passeport && <p className="text-xs text-[var(--edu-danger)]">{errors.numero_passeport.message}</p>}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telephone">{t('candidate.application.identity.phone', { defaultValue: 'Téléphone' })} <span className="text-[var(--edu-danger)]">*</span></Label>
        <Controller
          name="telephone"
          control={control}
          render={({ field }) => (
            <IndicatifTelephone
              id="telephone"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.telephone && <p className="text-xs text-[var(--edu-danger)]">{errors.telephone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>{t('candidate.application.identity.address', { defaultValue: 'Adresse' })} <span className="text-[var(--edu-danger)]">*</span></Label>
        <Controller
          name="adresse"
          control={control}
          render={({ field }) => (
            <AdresseFields
              value={field.value}
              onChange={field.onChange}
              manquants={errors.adresse?.ville ? ['ville'] : []}
            />
          )}
        />
      </div>
    </div>
  );

  const renderStepAcademique = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="niveau_actuel">{t('candidate.application.academic.currentLevel', { defaultValue: 'Niveau actuel' })}</Label>
          <Controller
            name="niveau_actuel"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="niveau_actuel">
                  <SelectValue placeholder={t('candidate.application.selectPlaceholder', { defaultValue: 'Sélectionner' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terminale">{t('candidate.application.academic.level.terminale', { defaultValue: 'Terminale' })}</SelectItem>
                  <SelectItem value="bac">{t('candidate.application.academic.level.bac', { defaultValue: 'Bac obtenu' })}</SelectItem>
                  <SelectItem value="licence">{t('candidate.application.academic.level.licence', { defaultValue: 'Licence' })}</SelectItem>
                  <SelectItem value="master">{t('candidate.application.academic.level.master', { defaultValue: 'Master' })}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type_bac">{t('candidate.application.academic.bacType', { defaultValue: 'Type de bac' })}</Label>
          <Controller
            name="type_bac"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="type_bac">
                  <SelectValue placeholder={t('candidate.application.selectPlaceholder', { defaultValue: 'Sélectionner' })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematiques">{t('candidate.application.academic.bac.mathematiques', { defaultValue: 'Mathématiques' })}</SelectItem>
                  <SelectItem value="sciences">{t('candidate.application.academic.bac.sciences', { defaultValue: 'Sciences' })}</SelectItem>
                  <SelectItem value="technique">{t('candidate.application.academic.bac.technique', { defaultValue: 'Technique' })}</SelectItem>
                  <SelectItem value="economie">{t('candidate.application.academic.bac.economie', { defaultValue: 'Économie' })}</SelectItem>
                  <SelectItem value="lettres">{t('candidate.application.academic.bac.lettres', { defaultValue: 'Lettres' })}</SelectItem>
                  <SelectItem value="sport">{t('candidate.application.academic.bac.sport', { defaultValue: 'Sport' })}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="annee_bac">{t('candidate.application.academic.bacYear', { defaultValue: 'Année du bac' })}</Label>
          <Input
            id="annee_bac"
            type="number"
            min={1980}
            max={new Date().getFullYear()}
            {...register('annee_bac')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="moyenne_bac">{t('candidate.application.academic.bacAverage', { defaultValue: 'Moyenne du bac (sur 20)' })}</Label>
          <Input
            id="moyenne_bac"
            type="number"
            step="0.01"
            min={0}
            max={20}
            placeholder="14.5"
            {...register('moyenne_bac')}
          />
        </div>
      </div>

      {/* Parcours académique (useFieldArray) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t('candidate.application.academic.history', { defaultValue: 'Parcours académique' })} <span className="text-[var(--edu-danger)]">*</span></Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendParcours({
                diplome: '',
                etablissement: '',
                annee: new Date().getFullYear(),
                mention: '',
              })
            }
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-1" /> {t('candidate.application.academic.add', { defaultValue: 'Ajouter' })}
          </Button>
        </div>

        {parcoursFields.length === 0 && (
          <div className="text-center py-6 border border-dashed border-[var(--edu-border)] rounded-xl">
            <p className="text-sm text-[var(--edu-text-secondary)]">
              {t('candidate.application.academic.addOneToProceed', { defaultValue: 'Ajoutez au moins un diplôme pour valider l\'étape.' })}
            </p>
          </div>
        )}

        {parcoursFields.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-[var(--edu-border)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--edu-text-tertiary)]">
                {t('candidate.application.academic.degreeIndex', { defaultValue: 'Diplôme #{{index}}', index: i + 1 })}
              </p>
              <button
                type="button"
                onClick={() => removeParcours(i)}
                className="p-1 rounded hover:bg-[var(--edu-danger)]/10 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-danger)]"
                aria-label={t('common.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`pa-${i}-diplome`} className="text-xs">{t('candidate.application.academic.degree', { defaultValue: 'Diplôme' })}</Label>
                <Input id={`pa-${i}-diplome`} {...register(`parcours_academique.${i}.diplome`)} placeholder={t('candidate.application.academic.degreePlaceholder', { defaultValue: 'Bac S, Licence Info…' })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pa-${i}-etab`} className="text-xs">{t('candidate.application.academic.institution', { defaultValue: 'Établissement' })}</Label>
                <Input id={`pa-${i}-etab`} {...register(`parcours_academique.${i}.etablissement`)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pa-${i}-annee`} className="text-xs">{t('candidate.application.academic.year', { defaultValue: 'Année' })}</Label>
                <Input id={`pa-${i}-annee`} type="number" {...register(`parcours_academique.${i}.annee`, { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pa-${i}-mention`} className="text-xs">{t('candidate.application.academic.mentionOptional', { defaultValue: 'Mention (optionnel)' })}</Label>
                <Input id={`pa-${i}-mention`} {...register(`parcours_academique.${i}.mention`)} placeholder={t('candidate.application.academic.mentionPlaceholder', { defaultValue: 'Bien, Très bien…' })} />
              </div>
            </div>
          </div>
        ))}

        {errors.parcours_academique && (
          <p className="text-xs text-[var(--edu-danger)]">
            {(errors.parcours_academique as { message?: string }).message ??
              t('candidate.application.validation.addOneDegree', { defaultValue: 'Ajoutez au moins un diplôme' })}
          </p>
        )}
      </div>
    </div>
  );

  const renderStepDocuments = () => {
    if (docsProgramme.length === 0) {
      return (
        <div className="text-center py-10 border border-dashed border-[var(--edu-border)] rounded-xl">
          <p className="text-sm text-[var(--edu-text-secondary)]">
            {t('candidate.application.documents.noneRequired', { defaultValue: 'Ce programme ne demande aucun document.' })}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--edu-text-secondary)]">
          {t('candidate.application.documents.help', { defaultValue: 'Téléversez les documents demandés (JPG ou PNG — 5 Mo max).' })}{' '}
          {t('candidate.application.documents.requiredHint', { defaultValue: 'Les pièces marquées' })} <span className="text-[var(--edu-danger)]">*</span> {t('candidate.application.documents.requiredTail', { defaultValue: 'sont obligatoires.' })}
        </p>
        {docsProgramme.map((doc) => {
          const cle = doc.nom;
          const libelle = t(FICHIERS_AUTORISES[cle] ?? doc.nom, { defaultValue: doc.nom });
          const file = fichiers[cle];
          const dejaDepose = docDejaDepose(cle);
          const present = !!file || dejaDepose;
          const inputId = `file-${cle}`;
          return (
            <label
              key={cle}
              htmlFor={inputId}
              className="block border-2 border-dashed border-[var(--edu-border)] rounded-xl p-4 hover:border-[var(--edu-blue)] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--edu-text-primary)] text-sm">
                    {libelle}
                    {doc.obligatoire && <span className="text-[var(--edu-danger)] ml-1">*</span>}
                  </p>
                  {file ? (
                    <p className="text-xs text-[var(--edu-success)] flex items-center gap-1 mt-1 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </p>
                  ) : dejaDepose ? (
                    <p className="text-xs text-[var(--edu-success)] flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{t('candidate.application.documents.alreadyUploadedReplace', { defaultValue: 'Déjà déposé — cliquez pour remplacer' })}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--edu-text-secondary)] mt-1">
                      {t('candidate.application.documents.acceptedFormats', { defaultValue: 'JPG ou PNG — 5 Mo max.' })}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 flex-shrink-0',
                    present
                      ? 'bg-[var(--edu-success)] text-white'
                      : doc.obligatoire
                        ? 'bg-[var(--edu-warning)] text-white'
                        : 'bg-[var(--edu-surface)] text-[var(--edu-text-secondary)]'
                  )}
                >
                  {present ? (
                    <><CheckCircle2 className="w-3 h-3" /> {file ? t('candidate.application.documents.uploaded', { defaultValue: 'Téléversé' }) : t('candidate.application.documents.alreadyUploaded', { defaultValue: 'Déposé' })}</>
                  ) : (
                    <><Upload className="w-3 h-3" /> {doc.obligatoire ? t('candidate.application.documents.missing', { defaultValue: 'Manquant' }) : t('candidate.application.documents.optional', { defaultValue: 'Optionnel' })}</>
                  )}
                </div>
              </div>
              <input
                id={inputId}
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFichier(cle)}
                className="hidden"
              />
            </label>
          );
        })}
      </div>
    );
  };

  const renderStepMotivation = () => (
    <div className="space-y-2">
      <Label htmlFor="motivation">{t('candidate.application.motivation.label', { defaultValue: 'Lettre de motivation' })} <span className="text-[var(--edu-danger)]">*</span></Label>
      <Controller
        name="motivation"
        control={control}
        render={({ field }) => (
          <Textarea
            id="motivation"
            rows={10}
            placeholder={t('candidate.application.motivation.placeholder', { defaultValue: 'Présentez votre projet, vos motivations et ce qui fait de vous un bon candidat pour ce programme…' })}
            value={field.value ?? ''}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            name={field.name}
            aria-invalid={!!errors.motivation || undefined}
          />
        )}
      />
      {errors.motivation && <p className="text-xs text-[var(--edu-danger)]">{errors.motivation.message}</p>}
      <p className="text-xs text-[var(--edu-text-tertiary)]">
        {t('candidate.application.motivation.hint', { defaultValue: 'Ce texte est enregistré directement dans votre candidature (pas de fichier à téléverser).' })}
      </p>
    </div>
  );

  const renderStepVerification = () => {
    const v = watch();
    const docsManquants = docsProgramme
      .filter((d) => d.obligatoire && !fichiers[d.nom])
      .map((d) => FICHIERS_AUTORISES[d.nom] ?? d.nom);

    return (
      <div className="space-y-5">
        {docsManquants.length > 0 && (
          <div className="rounded-xl bg-[var(--edu-warning)]/10 border border-[var(--edu-warning)]/30 px-4 py-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--edu-warning)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--edu-text-primary)]">
              <strong>{t('candidate.application.verification.missingDocsTitle', { defaultValue: 'Documents manquants :' })}</strong> {docsManquants.join(', ')}. {t('candidate.application.verification.missingDocsHelp', { defaultValue: 'Retournez à l\'étape Documents pour compléter.' })}
            </p>
          </div>
        )}

        <section className="rounded-xl border border-[var(--edu-border)] p-4">
          <h4 className="text-sm font-semibold mb-3 text-[var(--edu-text-primary)]">{t('candidate.application.steps.identity', { defaultValue: 'Identité' })}</h4>
          <dl className="text-sm space-y-1.5">
            <RowRecap label={t('candidate.application.verification.fullName', { defaultValue: 'Nom complet' })} value={`${v.prenom} ${v.nom}`} />
            <RowRecap label={t('candidate.application.identity.birthDate', { defaultValue: 'Date de naissance' })} value={v.date_naissance} />
            <RowRecap label={t('candidate.application.identity.nationality', { defaultValue: 'Nationalité' })} value={v.nationalite} />
            <RowRecap
              label={tunisien ? t('candidate.application.identity.cin', { defaultValue: 'CIN' }) : t('candidate.application.identity.passport', { defaultValue: 'Passeport' })}
              value={tunisien ? v.cin : v.numero_passeport}
            />
            <RowRecap label={t('candidate.application.identity.phone', { defaultValue: 'Téléphone' })} value={v.telephone} />
            <RowRecap
              label={t('candidate.application.identity.address', { defaultValue: 'Adresse' })}
              value={[v.adresse?.rue, v.adresse?.ville, v.adresse?.pays].filter(Boolean).join(', ')}
            />
          </dl>
        </section>

        <section className="rounded-xl border border-[var(--edu-border)] p-4">
          <h4 className="text-sm font-semibold mb-3 text-[var(--edu-text-primary)]">{t('candidate.application.steps.academic', { defaultValue: 'Académique' })}</h4>
          <dl className="text-sm space-y-1.5">
            <RowRecap label={t('candidate.application.academic.currentLevel', { defaultValue: 'Niveau actuel' })} value={v.niveau_actuel} />
            <RowRecap label={t('candidate.application.verification.bac', { defaultValue: 'Bac' })} value={[v.type_bac, v.moyenne_bac && `${v.moyenne_bac}/20`, v.annee_bac].filter(Boolean).join(' • ')} />
            <RowRecap label={t('candidate.application.verification.degrees', { defaultValue: 'Diplômes' })} value={t('candidate.application.verification.entriesCount', { defaultValue: '{{count}} entrée(s)', count: v.parcours_academique?.length ?? 0 })} />
          </dl>
        </section>

        <section className="rounded-xl border border-[var(--edu-border)] p-4">
          <h4 className="text-sm font-semibold mb-3 text-[var(--edu-text-primary)]">{t('candidate.application.steps.documents', { defaultValue: 'Documents' })}</h4>
          <dl className="text-sm space-y-1.5">
            {docsProgramme.length === 0 && (
              <p className="text-xs text-[var(--edu-text-secondary)]">{t('candidate.application.documents.noneRequiredShort', { defaultValue: 'Aucun document requis.' })}</p>
            )}
            {docsProgramme.map((d) => {
              const present = !!fichiers[d.nom] || docDejaDepose(d.nom);
              return (
                <div key={d.nom} className="flex justify-between gap-3">
                  <span className="text-[var(--edu-text-secondary)]">
                    {t(FICHIERS_AUTORISES[d.nom] ?? d.nom, { defaultValue: d.nom })}
                    {d.obligatoire && <span className="text-[var(--edu-danger)] ml-1">*</span>}
                  </span>
                  <span className={present ? 'text-[var(--edu-success)]' : 'text-[var(--edu-warning)]'}>
                    {fichiers[d.nom]
                      ? `✓ ${fichiers[d.nom].name}`
                      : present
                      ? t('candidate.application.documents.alreadyUploadedCheck', { defaultValue: '✓ Déjà déposé' })
                      : t('candidate.application.documents.missingCheck', { defaultValue: '✗ Manquant' })}
                  </span>
                </div>
              );
            })}
          </dl>
        </section>

        <section className="rounded-xl border border-[var(--edu-border)] p-4">
          <h4 className="text-sm font-semibold mb-2 text-[var(--edu-text-primary)]">{t('candidate.application.steps.motivation', { defaultValue: 'Motivation' })}</h4>
          <p className="text-sm text-[var(--edu-text-secondary)] line-clamp-4 whitespace-pre-line">
            {v.motivation || '—'}
          </p>
        </section>

        <Controller
          name="termsAccepted"
          control={control}
          render={({ field }) => (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-[var(--edu-text-secondary)]">
                {t('candidate.application.terms', { defaultValue: 'Je certifie que les informations fournies sont exactes et j\'accepte les conditions générales de la plateforme.' })}
              </span>
            </label>
          )}
        />
        {errors.termsAccepted && (
          <p className="text-xs text-[var(--edu-danger)]">{errors.termsAccepted.message}</p>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderStepIdentite();
      case 1: return renderStepAcademique();
      case 2: return renderStepDocuments();
      case 3: return renderStepMotivation();
      case 4: return renderStepVerification();
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmitFinal, (errs) => {
              // Si une erreur porte sur un champ d'une étape précédente, y naviguer
              if (errs.prenom || errs.nom || errs.nationalite || errs.cin || errs.numero_passeport || errs.telephone || errs.adresse) {
                setCurrentStep(0);
              } else if (errs.parcours_academique) {
                setCurrentStep(1);
              } else if (errs.motivation) {
                setCurrentStep(3);
                toast.error(t('candidate.application.validation.motivationMin', { defaultValue: 'La lettre de motivation doit contenir au moins 20 caractères' }));
              }
            })}>
            <div className="sticky top-0 bg-white dark:bg-[#1D1D1F] z-10 p-6 border-b border-[var(--edu-border)]">
              <button
                type="button"
                onClick={() => handleClose(false)}
                disabled={savingDraft}
                className="absolute top-6 right-6 p-2 hover:bg-[var(--edu-surface)] rounded-full transition-colors disabled:opacity-50"
                aria-label={savingDraft ? t('candidate.application.toasts.savingDraft', { defaultValue: 'Sauvegarde...' }) : t('common.close')}
              >
                {savingDraft ? <span className="w-5 h-5 block border-2 border-current border-t-transparent rounded-full animate-spin" /> : <X className="w-5 h-5" />}
              </button>

              <DialogTitle className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">
                {t('candidate.application.title', { defaultValue: 'Candidater au programme' })}
              </DialogTitle>
              <DialogDescription className="text-sm text-[var(--edu-text-secondary)] mb-6">
                {programme.titre}
              </DialogDescription>

              <Stepper steps={steps} currentStep={currentStep} />
            </div>

            <div className="p-6">{renderStepContent()}</div>

            <div className="sticky bottom-0 bg-white dark:bg-[#1D1D1F] p-6 border-t border-[var(--edu-border)] flex items-center justify-between">
              <div className="text-xs text-[var(--edu-text-tertiary)]">
                {t('candidate.application.stepCounter', { defaultValue: 'Étape {{current}} / {{total}}', current: currentStep + 1, total: steps.length })}
              </div>

              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={submitting}
                    className="rounded-full"
                  >
                    {t('candidate.application.previous', { defaultValue: 'Précédent' })}
                  </Button>
                )}

                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white"
                  >
                    {t('candidate.application.next', { defaultValue: 'Suivant' })}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white disabled:opacity-50"
                  >
                    {submitting
                      ? t('candidate.application.submitting', { defaultValue: 'Soumission…' })
                      : t('candidate.application.submit', { defaultValue: 'Soumettre ma candidature' })}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Petit composant ligne de récap (étape Vérification)
// ─────────────────────────────────────────────────────────────

function RowRecap({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--edu-text-secondary)]">{label}</dt>
      <dd className="text-[var(--edu-text-primary)] font-medium text-right">{value || '—'}</dd>
    </div>
  );
}
