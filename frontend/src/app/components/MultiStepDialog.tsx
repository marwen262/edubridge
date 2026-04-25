import React from 'react';
import { X, Upload, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Stepper, Step } from './Stepper';
import { toast } from 'sonner';
import { candidatureService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface MultiStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programmeId: string;
  programmeTitre?: string;
}

const steps: Step[] = [
  { label: 'Infos perso.' },
  { label: 'Académique' },
  { label: 'Documents' },
  { label: 'Motivation' },
  { label: 'Vérification' },
];

// Map des champs fichiers → libellés UI / clé Multer backend
const champsFichiers = [
  { cle: 'cv', libelle: 'Curriculum Vitae (CV)', backend: 'cv' },
  { cle: 'diplome', libelle: 'Diplôme du baccalauréat', backend: 'diplome_bac' },
  { cle: 'releves', libelle: 'Relevés de notes', backend: 'releves_notes' },
  { cle: 'recommandation', libelle: 'Lettre de recommandation', backend: 'lettre_recommandation' },
] as const;

type CleFichier = (typeof champsFichiers)[number]['cle'];
type Fichiers = Partial<Record<CleFichier, File>>;

export function MultiStepDialog({
  open,
  onOpenChange,
  programmeId,
  programmeTitre,
}: MultiStepDialogProps) {
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const [formData, setFormData] = React.useState({
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    gender: '',
    phone: '',
    address: '',
    currentEducation: '',
    institution: '',
    gpa: '',
    graduationYear: '',
    achievements: '',
    motivation: '',
    careerGoals: '',
  });

  const [fichiers, setFichiers] = React.useState<Fichiers>({});

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFichier = (cle: CleFichier) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFichiers((prev) => ({ ...prev, [cle]: file }));
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const reinitialiser = () => {
    setCurrentStep(0);
    setFichiers({});
    setTermsAccepted(false);
    setFormData({
      fullName: '',
      dateOfBirth: '',
      nationality: '',
      gender: '',
      phone: '',
      address: '',
      currentEducation: '',
      institution: '',
      gpa: '',
      graduationYear: '',
      achievements: '',
      motivation: '',
      careerGoals: '',
    });
  };

  // Soumission finale : crée un brouillon avec FormData puis le soumet
  const handleSubmitFinal = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour candidater');
      return;
    }
    if (!programmeId) {
      toast.error('Programme manquant');
      return;
    }
    if (!termsAccepted) {
      toast.error('Veuillez accepter les conditions générales');
      return;
    }

    setSubmitting(true);
    try {
      // Étape 1 — créer le brouillon avec fichiers et lettre de motivation
      const fd = new FormData();
      fd.append('programme_id', programmeId);
      if (formData.motivation.trim()) {
        fd.append('lettre_motivation', formData.motivation.trim());
      }
      // Mapper chaque fichier choisi vers son nom de champ Multer
      champsFichiers.forEach(({ cle, backend }) => {
        const f = fichiers[cle];
        if (f) fd.append(backend, f);
      });

      const response = await candidatureService.create(fd);
      const candidatureId = response.data?.candidature?.id as string | undefined;
      if (!candidatureId) {
        throw new Error('Identifiant de candidature manquant dans la réponse');
      }

      // Étape 2 — soumettre immédiatement le brouillon
      await candidatureService.soumettre(candidatureId);

      toast.success('Candidature soumise avec succès !');
      onOpenChange(false);
      reinitialiser();
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string; manquants?: string[] } };
      };
      const manquants = apiErr.response?.data?.manquants;
      if (manquants && manquants.length > 0) {
        toast.error(`Documents manquants : ${manquants.join(', ')}`);
      } else {
        toast.error(apiErr.response?.data?.message ?? 'Erreur lors de la soumission');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (!next && currentStep > 0 && !submitting) {
      const confirmed = confirm(
        'Vous avez des modifications non enregistrées. Voulez-vous vraiment fermer ?'
      );
      if (confirmed) {
        onOpenChange(false);
        reinitialiser();
      }
      return;
    }
    onOpenChange(next);
    if (!next) reinitialiser();
  };

  // Rendu d'un input file unique
  const renderUploadFichier = (cle: CleFichier, libelle: string) => {
    const file = fichiers[cle];
    const inputId = `file-${cle}`;
    return (
      <label
        key={cle}
        htmlFor={inputId}
        className="block border-2 border-dashed border-[var(--edu-border)] rounded-xl p-6 hover:border-[var(--edu-blue)] transition-colors cursor-pointer"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--edu-text-primary)]">{libelle}</p>
            {file ? (
              <p className="text-sm text-[var(--edu-success)] flex items-center gap-1 mt-1 truncate">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </p>
            ) : (
              <p className="text-sm text-[var(--edu-text-secondary)] mt-1">
                PDF, JPG ou PNG — 5 Mo max.
              </p>
            )}
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 flex-shrink-0 ${
              file
                ? 'bg-[var(--edu-success)] text-white'
                : 'bg-[var(--edu-warning)] text-white'
            }`}
          >
            {file ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> Téléversé
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" /> Manquant
              </>
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
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Infos personnelles
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nom complet *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date de naissance *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nationality">Nationalité *</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => updateFormData('nationality', e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="gender">Genre</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => updateFormData('gender', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                >
                  <option value="">Sélectionner</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="address">Adresse *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                className="rounded-xl"
                rows={3}
              />
            </div>
          </div>
        );

      case 1: // Parcours académique
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentEducation">Niveau d'études actuel *</Label>
              <Input
                id="currentEducation"
                value={formData.currentEducation}
                onChange={(e) => updateFormData('currentEducation', e.target.value)}
                placeholder="Ex. Licence en informatique"
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="institution">Établissement *</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => updateFormData('institution', e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gpa">Moyenne / Note *</Label>
                <Input
                  id="gpa"
                  value={formData.gpa}
                  onChange={(e) => updateFormData('gpa', e.target.value)}
                  placeholder="Ex. 15/20"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="graduationYear">Année d'obtention *</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => updateFormData('graduationYear', e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="achievements">Distinctions et réalisations</Label>
              <Textarea
                id="achievements"
                value={formData.achievements}
                onChange={(e) => updateFormData('achievements', e.target.value)}
                placeholder="Bourses, prix, publications, etc."
                className="rounded-xl"
                rows={4}
              />
            </div>
          </div>
        );

      case 2: // Documents
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--edu-text-secondary)] mb-4">
              Téléversez les documents requis pour votre candidature. Formats acceptés : PDF,
              JPG, PNG (5 Mo max. par fichier).
            </p>
            {champsFichiers.map(({ cle, libelle }) => renderUploadFichier(cle, libelle))}
          </div>
        );

      case 3: // Motivation
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="motivation">Lettre de motivation *</Label>
              <Textarea
                id="motivation"
                value={formData.motivation}
                onChange={(e) => updateFormData('motivation', e.target.value)}
                placeholder="Expliquez pourquoi vous souhaitez intégrer ce programme…"
                className="rounded-xl"
                rows={8}
              />
            </div>

            <div>
              <Label htmlFor="careerGoals">Objectifs professionnels</Label>
              <Textarea
                id="careerGoals"
                value={formData.careerGoals}
                onChange={(e) => updateFormData('careerGoals', e.target.value)}
                placeholder="Décrivez vos aspirations professionnelles…"
                className="rounded-xl"
                rows={6}
              />
            </div>
          </div>
        );

      case 4: // Vérification
        return (
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-4">
              <h4 className="font-semibold text-[var(--edu-text-primary)] mb-3">
                Informations personnelles
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">Nom complet :</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">
                    {formData.fullName || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">Date de naissance :</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">
                    {formData.dateOfBirth || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">Nationalité :</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">
                    {formData.nationality || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4">
              <h4 className="font-semibold text-[var(--edu-text-primary)] mb-3">
                Parcours académique
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">Niveau :</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">
                    {formData.currentEducation || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">Établissement :</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">
                    {formData.institution || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">Moyenne :</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">
                    {formData.gpa || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4">
              <h4 className="font-semibold text-[var(--edu-text-primary)] mb-3">Documents</h4>
              <div className="space-y-2 text-sm">
                {champsFichiers.map(({ cle, libelle }) => {
                  const file = fichiers[cle];
                  return (
                    <div key={cle} className="flex justify-between gap-4">
                      <span className="text-[var(--edu-text-secondary)]">{libelle} :</span>
                      <span
                        className={
                          file
                            ? 'text-[var(--edu-success)] truncate'
                            : 'text-[var(--edu-warning)]'
                        }
                      >
                        {file ? `✓ ${file.name}` : '✗ Manquant'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card rounded-xl p-4">
              <h4 className="font-semibold text-[var(--edu-text-primary)] mb-3">Motivation</h4>
              <p className="text-sm text-[var(--edu-text-secondary)] line-clamp-4">
                {formData.motivation || '—'}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-[var(--edu-text-secondary)]">
                J'accepte les conditions générales et confirme l'exactitude des informations
                fournies.
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0">
        <div className="sticky top-0 bg-white dark:bg-[#1D1D1F] z-10 p-6 border-b border-[var(--edu-border)]">
          <button
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
            {programmeTitre ?? 'Programme'}
          </DialogDescription>

          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        <div className="p-6">{renderStepContent()}</div>

        <div className="sticky bottom-0 bg-white dark:bg-[#1D1D1F] p-6 border-t border-[var(--edu-border)] flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => toast.info('Brouillon non sauvegardé localement')}
            disabled={submitting}
            className="text-[var(--edu-text-secondary)]"
          >
            Sauver en brouillon
          </Button>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button
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
                onClick={handleNext}
                className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white"
              >
                Suivant
              </Button>
            ) : (
              <Button
                onClick={handleSubmitFinal}
                disabled={submitting || !termsAccepted}
                className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white disabled:opacity-50"
              >
                {submitting ? 'Soumission en cours…' : 'Soumettre ma candidature'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
