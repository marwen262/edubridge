import { useEffect, useRef, useState } from 'react';
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
  diplome_bac:           'Diplôme du baccalauréat',
  diplome_licence:       'Diplôme de licence',
  releves_notes:         'Relevés de notes',
  attestation_prepa:     'Attestation de cycle préparatoire',
  lettre_recommandation: 'Lettre de recommandation',
  attestation_stage:     'Attestation de stage',
};

const steps: Step[] = [
  { label: 'Identité' },
  { label: 'Académique' },
  { label: 'Documents' },
  { label: 'Motivation' },
  { label: 'Vérification' },
];

// ─────────────────────────────────────────────────────────────
// Schémas zod
// ─────────────────────────────────────────────────────────────

const adresseSchema = z.object({
  rue: z.string().optional().or(z.literal('')),
  ville: z.string().min(1, 'Ville requise'),
  gouvernorat: z.string().optional().or(z.literal('')),
  code_postal: z.string().optional().or(z.literal('')),
  pays: z.string().optional().or(z.literal('')),
});

const parcoursSchema = z.object({
  diplome: z.string().min(1, 'Diplôme requis'),
  etablissement: z.string().min(1, 'Établissement requis'),
  annee: z
    .number({ error: 'Année invalide' })
    .int()
    .min(1950, 'Année trop ancienne')
    .max(new Date().getFullYear() + 1, 'Année future invalide'),
  mention: z.string().optional().or(z.literal('')),
});

const formSchema = z
  .object({
    // Identité
    prenom: z.string().min(1, 'Prénom requis'),
    nom: z.string().min(1, 'Nom requis'),
    date_naissance: z.string().optional().or(z.literal('')),
    genre: z.union([z.literal('homme'), z.literal('femme'), z.literal('')]).optional(),
    nationalite: z.string().min(1, 'Nationalité requise'),
    cin: z.string().optional().or(z.literal('')),
    numero_passeport: z.string().optional().or(z.literal('')),
    telephone: z.string().min(4, 'Téléphone requis'),
    adresse: adresseSchema,
    // Académique
    niveau_actuel: z.string().optional().or(z.literal('')),
    type_bac: z.string().optional().or(z.literal('')),
    moyenne_bac: z.string().optional().or(z.literal('')),
    annee_bac: z.string().optional().or(z.literal('')),
    parcours_academique: z.array(parcoursSchema).min(1, 'Ajoutez au moins un diplôme'),
    // Motivation
    motivation: z.string().min(20, 'La lettre de motivation doit contenir au moins 20 caractères'),
    // CGU
    termsAccepted: z.literal(true, {
      error: 'Vous devez accepter les conditions',
    }),
  })
  .superRefine((data, ctx) => {
    // Identité conditionnelle (cohérente avec le hook beforeValidate du modèle Candidat)
    if (estTunisien(data.nationalite)) {
      if (!data.cin || !/^[0-9]{8}$/.test(data.cin)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cin'],
          message: 'CIN tunisien requis (8 chiffres)',
        });
      }
    } else if (data.nationalite) {
      if (!data.numero_passeport || !/^[A-Za-z0-9]{6,20}$/.test(data.numero_passeport)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['numero_passeport'],
          message: 'Passeport requis (6 à 20 caractères alphanumériques)',
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
  termsAccepted: false as unknown as true, // résolu à true via le checkbox au runtime
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
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
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

  const handleClose = (next: boolean) => {
    if (!next && currentStep > 0 && !submitting) {
      const ok = confirm('Vos modifications ne seront pas conservées. Fermer ?');
      if (!ok) return;
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
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5 Mo)');
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
        toast.error('Certaines informations sont manquantes ou invalides');
        return;
      }
    }
    // Étape Documents : vérifier les obligatoires (nouvellement uploadés OU déjà sur serveur)
    if (currentStep === 2) {
      const manquants = docsProgramme
        .filter((d) => d.obligatoire && !fichiers[d.nom] && !docDejaDepose(d.nom))
        .map((d) => FICHIERS_AUTORISES[d.nom] ?? d.nom);
      if (manquants.length > 0) {
        toast.error(`Documents obligatoires manquants : ${manquants.join(', ')}`);
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
      toast.error('Connectez-vous pour candidater');
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

      toast.success('Candidature soumise avec succès !');
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
          `Profil incomplet : ${errData.manquants_profil.join(', ')}. Vérifiez l'étape Identité ou Académique.`,
        );
      } else if (errData?.manquants && errData.manquants.length > 0) {
        toast.error(`Documents manquants : ${errData.manquants.join(', ')}`);
      } else {
        toast.error(errData?.message ?? 'Erreur lors de la soumission');
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
          Chargement de votre profil…
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom <span className="text-[var(--edu-danger)]">*</span></Label>
          <Input id="prenom" {...register('prenom')} aria-invalid={!!errors.prenom || undefined} />
          {errors.prenom && <p className="text-xs text-[var(--edu-danger)]">{errors.prenom.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nom">Nom <span className="text-[var(--edu-danger)]">*</span></Label>
          <Input id="nom" {...register('nom')} aria-invalid={!!errors.nom || undefined} />
          {errors.nom && <p className="text-xs text-[var(--edu-danger)]">{errors.nom.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_naissance">Date de naissance</Label>
          <Input id="date_naissance" type="date" {...register('date_naissance')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="genre">Genre</Label>
          <Controller
            name="genre"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={(v) => field.onChange(v === '_none' ? '' : v)}
              >
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homme">Homme</SelectItem>
                  <SelectItem value="femme">Femme</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nationalite">Nationalité <span className="text-[var(--edu-danger)]">*</span></Label>
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
            <Label htmlFor="cin">CIN <span className="text-[var(--edu-danger)]">*</span></Label>
            <Input
              id="cin"
              inputMode="numeric"
              maxLength={8}
              placeholder="12345678"
              {...register('cin')}
              aria-invalid={!!errors.cin || undefined}
            />
            {errors.cin && <p className="text-xs text-[var(--edu-danger)]">{errors.cin.message}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="numero_passeport">Numéro de passeport <span className="text-[var(--edu-danger)]">*</span></Label>
            <Input
              id="numero_passeport"
              maxLength={20}
              placeholder="AB123456"
              {...register('numero_passeport')}
              aria-invalid={!!errors.numero_passeport || undefined}
            />
            {errors.numero_passeport && <p className="text-xs text-[var(--edu-danger)]">{errors.numero_passeport.message}</p>}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="telephone">Téléphone <span className="text-[var(--edu-danger)]">*</span></Label>
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
        <Label>Adresse <span className="text-[var(--edu-danger)]">*</span></Label>
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
          <Label htmlFor="niveau_actuel">Niveau actuel</Label>
          <Controller
            name="niveau_actuel"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="niveau_actuel">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terminale">Terminale</SelectItem>
                  <SelectItem value="bac">Bac obtenu</SelectItem>
                  <SelectItem value="licence">Licence</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type_bac">Type de bac</Label>
          <Controller
            name="type_bac"
            control={control}
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger id="type_bac">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematiques">Mathématiques</SelectItem>
                  <SelectItem value="sciences">Sciences</SelectItem>
                  <SelectItem value="technique">Technique</SelectItem>
                  <SelectItem value="economie">Économie</SelectItem>
                  <SelectItem value="lettres">Lettres</SelectItem>
                  <SelectItem value="sport">Sport</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="annee_bac">Année du bac</Label>
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
          <Label htmlFor="moyenne_bac">Moyenne du bac (sur 20)</Label>
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
          <Label>Parcours académique <span className="text-[var(--edu-danger)]">*</span></Label>
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
            <Plus className="w-4 h-4 mr-1" /> Ajouter
          </Button>
        </div>

        {parcoursFields.length === 0 && (
          <div className="text-center py-6 border border-dashed border-[var(--edu-border)] rounded-xl">
            <p className="text-sm text-[var(--edu-text-secondary)]">
              Ajoutez au moins un diplôme pour valider l'étape.
            </p>
          </div>
        )}

        {parcoursFields.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-[var(--edu-border)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--edu-text-tertiary)]">
                Diplôme #{i + 1}
              </p>
              <button
                type="button"
                onClick={() => removeParcours(i)}
                className="p-1 rounded hover:bg-[var(--edu-danger)]/10 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-danger)]"
                aria-label="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`pa-${i}-diplome`} className="text-xs">Diplôme</Label>
                <Input id={`pa-${i}-diplome`} {...register(`parcours_academique.${i}.diplome`)} placeholder="Bac S, Licence Info…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pa-${i}-etab`} className="text-xs">Établissement</Label>
                <Input id={`pa-${i}-etab`} {...register(`parcours_academique.${i}.etablissement`)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pa-${i}-annee`} className="text-xs">Année</Label>
                <Input id={`pa-${i}-annee`} type="number" {...register(`parcours_academique.${i}.annee`, { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pa-${i}-mention`} className="text-xs">Mention (optionnel)</Label>
                <Input id={`pa-${i}-mention`} {...register(`parcours_academique.${i}.mention`)} placeholder="Bien, Très bien…" />
              </div>
            </div>
          </div>
        ))}

        {errors.parcours_academique && (
          <p className="text-xs text-[var(--edu-danger)]">
            {(errors.parcours_academique as { message?: string }).message ??
              'Ajoutez au moins un diplôme'}
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
            Ce programme ne demande aucun document.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--edu-text-secondary)]">
          Téléversez les documents demandés (PDF, JPG ou PNG — 5 Mo max).
          Les pièces marquées <span className="text-[var(--edu-danger)]">*</span> sont obligatoires.
        </p>
        {docsProgramme.map((doc) => {
          const cle = doc.nom;
          const libelle = FICHIERS_AUTORISES[cle] ?? doc.nom;
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
                      <span>Déjà déposé — cliquez pour remplacer</span>
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--edu-text-secondary)] mt-1">
                      PDF, JPG ou PNG — 5 Mo max.
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
                    <><CheckCircle2 className="w-3 h-3" /> {file ? 'Téléversé' : 'Déposé'}</>
                  ) : (
                    <><Upload className="w-3 h-3" /> {doc.obligatoire ? 'Manquant' : 'Optionnel'}</>
                  )}
                </div>
              </div>
              <input
                id={inputId}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
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
      <Label htmlFor="motivation">Lettre de motivation <span className="text-[var(--edu-danger)]">*</span></Label>
      <Textarea
        id="motivation"
        rows={10}
        placeholder="Présentez votre projet, vos motivations et ce qui fait de vous un bon candidat pour ce programme…"
        {...register('motivation')}
        aria-invalid={!!errors.motivation || undefined}
      />
      {errors.motivation && <p className="text-xs text-[var(--edu-danger)]">{errors.motivation.message}</p>}
      <p className="text-xs text-[var(--edu-text-tertiary)]">
        Ce texte est enregistré directement dans votre candidature (pas de fichier à téléverser).
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
              <strong>Documents manquants :</strong> {docsManquants.join(', ')}.
              Retournez à l'étape Documents pour compléter.
            </p>
          </div>
        )}

        <section className="rounded-xl border border-[var(--edu-border)] p-4">
          <h4 className="text-sm font-semibold mb-3 text-[var(--edu-text-primary)]">Identité</h4>
          <dl className="text-sm space-y-1.5">
            <RowRecap label="Nom complet" value={`${v.prenom} ${v.nom}`} />
            <RowRecap label="Date de naissance" value={v.date_naissance} />
            <RowRecap label="Nationalité" value={v.nationalite} />
            <RowRecap
              label={tunisien ? 'CIN' : 'Passeport'}
              value={tunisien ? v.cin : v.numero_passeport}
            />
            <RowRecap label="Téléphone" value={v.telephone} />
            <RowRecap
              label="Adresse"
              value={[v.adresse?.rue, v.adresse?.ville, v.adresse?.pays].filter(Boolean).join(', ')}
            />
          </dl>
        </section>

        <section className="rounded-xl border border-[var(--edu-border)] p-4">
          <h4 className="text-sm font-semibold mb-3 text-[var(--edu-text-primary)]">Académique</h4>
          <dl className="text-sm space-y-1.5">
            <RowRecap label="Niveau actuel" value={v.niveau_actuel} />
            <RowRecap label="Bac" value={[v.type_bac, v.moyenne_bac && `${v.moyenne_bac}/20`, v.annee_bac].filter(Boolean).join(' • ')} />
            <RowRecap label="Diplômes" value={`${v.parcours_academique?.length ?? 0} entrée(s)`} />
          </dl>
        </section>

        <section className="rounded-xl border border-[var(--edu-border)] p-4">
          <h4 className="text-sm font-semibold mb-3 text-[var(--edu-text-primary)]">Documents</h4>
          <dl className="text-sm space-y-1.5">
            {docsProgramme.length === 0 && (
              <p className="text-xs text-[var(--edu-text-secondary)]">Aucun document requis.</p>
            )}
            {docsProgramme.map((d) => {
              const present = !!fichiers[d.nom] || docDejaDepose(d.nom);
              return (
                <div key={d.nom} className="flex justify-between gap-3">
                  <span className="text-[var(--edu-text-secondary)]">
                    {FICHIERS_AUTORISES[d.nom] ?? d.nom}
                    {d.obligatoire && <span className="text-[var(--edu-danger)] ml-1">*</span>}
                  </span>
                  <span className={present ? 'text-[var(--edu-success)]' : 'text-[var(--edu-warning)]'}>
                    {fichiers[d.nom]
                      ? `✓ ${fichiers[d.nom].name}`
                      : present
                      ? '✓ Déjà déposé'
                      : '✗ Manquant'}
                  </span>
                </div>
              );
            })}
          </dl>
        </section>

        <section className="rounded-xl border border-[var(--edu-border)] p-4">
          <h4 className="text-sm font-semibold mb-2 text-[var(--edu-text-primary)]">Motivation</h4>
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
                Je certifie que les informations fournies sont exactes et j'accepte les conditions générales de la plateforme.
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
          <form onSubmit={handleSubmit(onSubmitFinal)}>
            <div className="sticky top-0 bg-white dark:bg-[#1D1D1F] z-10 p-6 border-b border-[var(--edu-border)]">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="absolute top-6 right-6 p-2 hover:bg-[var(--edu-surface)] rounded-full transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <DialogTitle className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">
                Candidater au programme
              </DialogTitle>
              <DialogDescription className="text-sm text-[var(--edu-text-secondary)] mb-6">
                {programme.titre}
              </DialogDescription>

              <Stepper steps={steps} currentStep={currentStep} />
            </div>

            <div className="p-6">{renderStepContent()}</div>

            <div className="sticky bottom-0 bg-white dark:bg-[#1D1D1F] p-6 border-t border-[var(--edu-border)] flex items-center justify-between">
              <div className="text-xs text-[var(--edu-text-tertiary)]">
                Étape {currentStep + 1} / {steps.length}
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
                    Précédent
                  </Button>
                )}

                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white"
                  >
                    Suivant
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white disabled:opacity-50"
                  >
                    {submitting ? 'Soumission…' : 'Soumettre ma candidature'}
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
