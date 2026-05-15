import React from 'react';
import { toast } from 'sonner';
import { X, Plus, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { programmeService } from '@/services/api';
import type { CreateProgrammeData, DocumentRequis } from '@/types/api';

interface CreateProgramDialogProps {
  institutId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const DOMAINE_VALUES = ['informatique', 'genie_civil', 'electrique', 'mecanique', 'chimie', 'agronomie', 'finance', 'management'] as const;
const NIVEAU_VALUES = ['cycle_preparatoire', 'licence', 'master', 'ingenieur'] as const;
const MODE_VALUES = ['cours_du_jour', 'cours_du_soir', 'alternance', 'formation_continue'] as const;

export function CreateProgramDialog({ institutId, open, onClose, onCreated }: CreateProgramDialogProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [titre, setTitre] = React.useState('');
  const [domaine, setDomaine] = React.useState('');
  const [niveau, setNiveau] = React.useState('');
  const [mode, setMode] = React.useState('');
  const [dureeAnnees, setDureeAnnees] = React.useState('');
  const [langue, setLangue] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [fraisInscription, setFraisInscription] = React.useState('');
  const [dateLimite, setDateLimite] = React.useState('');
  const [dateDebut, setDateDebut] = React.useState('');
  const [capacite, setCapacite] = React.useState('');
  const [estActif, setEstActif] = React.useState(true);
  const [documents, setDocuments] = React.useState<DocumentRequis[]>([]);
  const [newDocNom, setNewDocNom] = React.useState('');
  const [newDocObligatoire, setNewDocObligatoire] = React.useState(true);
  const [moyenneMin, setMoyenneMin] = React.useState('');
  const [typesBac, setTypesBac] = React.useState('');

  const resetForm = () => {
    setTitre('');
    setDomaine('');
    setNiveau('');
    setMode('');
    setDureeAnnees('');
    setLangue('');
    setDescription('');
    setFraisInscription('');
    setDateLimite('');
    setDateDebut('');
    setCapacite('');
    setEstActif(true);
    setDocuments([]);
    setNewDocNom('');
    setNewDocObligatoire(true);
    setMoyenneMin('');
    setTypesBac('');
    setErrors({});
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  const addDocument = () => {
    if (!newDocNom.trim()) return;
    setDocuments((prev) => [...prev, { nom: newDocNom.trim(), obligatoire: newDocObligatoire }]);
    setNewDocNom('');
    setNewDocObligatoire(true);
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!titre.trim()) errs.titre = t('programDialog.fields.titleRequired');
    else if (titre.trim().length < 3) errs.titre = t('programDialog.fields.titleMin');
    if (dureeAnnees && (isNaN(Number(dureeAnnees)) || Number(dureeAnnees) < 1)) errs.dureeAnnees = t('programDialog.fields.durationInvalid');
    if (fraisInscription && isNaN(Number(fraisInscription))) errs.fraisInscription = t('programDialog.fields.tuitionInvalid');
    if (capacite && (isNaN(Number(capacite)) || Number(capacite) < 1)) errs.capacite = t('programDialog.fields.capacityInvalid');
    if (moyenneMin && (isNaN(Number(moyenneMin)) || Number(moyenneMin) < 0 || Number(moyenneMin) > 20)) errs.moyenneMin = t('programDialog.fields.minAverageInvalid');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const data: CreateProgrammeData = {
        institut_id: institutId,
        titre: titre.trim(),
        est_actif: estActif,
      };

      if (domaine) data.domaine = domaine as CreateProgrammeData['domaine'];
      if (niveau) data.niveau = niveau as CreateProgrammeData['niveau'];
      if (mode) data.mode = mode as CreateProgrammeData['mode'];
      if (dureeAnnees) data.duree_annees = Number(dureeAnnees);
      if (langue) data.langue = langue;
      if (description) data.description = description;
      if (fraisInscription) data.frais_inscription = Number(fraisInscription);
      if (dateLimite) data.date_limite_candidature = dateLimite;
      if (dateDebut) data.date_debut = dateDebut;
      if (capacite) data.capacite = Number(capacite);
      if (documents.length > 0) data.documents_requis = documents;
      if (moyenneMin || typesBac) {
        data.prerequis = {};
        if (moyenneMin) data.prerequis.moyenne_min = Number(moyenneMin);
        if (typesBac.trim()) data.prerequis.types_bac = typesBac.split(',').map((s) => s.trim()).filter(Boolean);
      }

      await programmeService.create(data);
      toast.success(t('programDialog.toasts.created'));
      resetForm();
      onCreated();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; manquants?: string[] } } };
      const msg = apiErr?.response?.data?.message ?? t('programDialog.toasts.createError');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const inputClass = (field?: string) =>
    `w-full px-4 py-2.5 rounded-xl bg-[var(--edu-surface)] border text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)] transition-shadow ${
      field && errors[field] ? 'border-[var(--edu-danger)]' : 'border-[var(--edu-border)]'
    }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#1D1D1F] rounded-2xl shadow-2xl border border-[var(--edu-border)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--edu-border)] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[var(--edu-text-primary)]">{t('programDialog.create.title')}</h2>
            <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">
              {t('programDialog.create.subtitle')}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-[var(--edu-surface)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--edu-text-tertiary)]" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">
              {t('programDialog.fields.titleLabel')} <span className="text-[var(--edu-danger)]">*</span>
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder={t('programDialog.fields.titlePlaceholder')}
              className={inputClass('titre')}
            />
            {errors.titre && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.titre}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('programDialog.fields.domain')}</label>
              <select value={domaine} onChange={(e) => setDomaine(e.target.value)} className={inputClass()}>
                <option value="">{t('programDialog.fields.select')}</option>
                {DOMAINE_VALUES.map((v) => <option key={v} value={v}>{t(`admin.programs.domains.${v}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('programDialog.fields.level')}</label>
              <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className={inputClass()}>
                <option value="">{t('programDialog.fields.select')}</option>
                {NIVEAU_VALUES.map((v) => <option key={v} value={v}>{t(`program.levels.${v}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('programDialog.fields.mode')}</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass()}>
                <option value="">{t('programDialog.fields.select')}</option>
                {MODE_VALUES.map((v) => <option key={v} value={v}>{t(`admin.programs.modes.${v}`)}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('programDialog.fields.duration')}</label>
              <input
                type="number"
                min="1"
                max="10"
                value={dureeAnnees}
                onChange={(e) => setDureeAnnees(e.target.value)}
                placeholder={t('programDialog.fields.durationPlaceholder')}
                className={inputClass('dureeAnnees')}
              />
              {errors.dureeAnnees && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.dureeAnnees}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('programDialog.fields.language')}</label>
              <input
                type="text"
                value={langue}
                onChange={(e) => setLangue(e.target.value)}
                placeholder={t('programDialog.fields.languagePlaceholder')}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('programDialog.fields.capacity')}</label>
              <input
                type="number"
                min="1"
                value={capacite}
                onChange={(e) => setCapacite(e.target.value)}
                placeholder={t('programDialog.fields.capacityPlaceholder')}
                className={inputClass('capacite')}
              />
              {errors.capacite && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.capacite}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('programDialog.fields.tuition')}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={fraisInscription}
                onChange={(e) => setFraisInscription(e.target.value)}
                placeholder={t('programDialog.fields.tuitionPlaceholder')}
                className={inputClass('fraisInscription')}
              />
              {errors.fraisInscription && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.fraisInscription}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('programDialog.fields.deadline')}</label>
              <input
                type="date"
                value={dateLimite}
                onChange={(e) => setDateLimite(e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('programDialog.fields.startDate')}</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className={inputClass()}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">{t('programDialog.fields.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('programDialog.fields.descriptionPlaceholder')}
              rows={4}
              className={inputClass()}
            />
          </div>

          <div className="bg-[var(--edu-surface)] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--edu-text-primary)]">{t('programDialog.fields.prerequisites')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--edu-text-secondary)] mb-1">{t('programDialog.fields.minAverage')}</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.01"
                  value={moyenneMin}
                  onChange={(e) => setMoyenneMin(e.target.value)}
                  placeholder={t('programDialog.fields.minAveragePlaceholder')}
                  className={inputClass('moyenneMin')}
                />
                {errors.moyenneMin && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.moyenneMin}</p>}
              </div>
              <div>
                <label className="block text-xs text-[var(--edu-text-secondary)] mb-1">{t('programDialog.fields.bacTypes')}</label>
                <input
                  type="text"
                  value={typesBac}
                  onChange={(e) => setTypesBac(e.target.value)}
                  placeholder={t('programDialog.fields.bacTypesPlaceholder')}
                  className={inputClass()}
                />
              </div>
            </div>
          </div>

          <div className="bg-[var(--edu-surface)] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--edu-text-primary)]">{t('programDialog.fields.requiredDocuments')}</h3>
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white dark:bg-[#2D2D2F] rounded-lg px-3 py-2">
                    <span className="text-sm text-[var(--edu-text-primary)] flex-1">{doc.nom}</span>
                    <span className={`text-xs font-semibold ${doc.obligatoire ? 'text-[var(--edu-danger)]' : 'text-[var(--edu-text-tertiary)]'}`}>
                      {doc.obligatoire ? t('programDialog.fields.mandatory') : t('programDialog.fields.optional')}
                    </span>
                    <button type="button" onClick={() => removeDocument(i)} className="p-1 hover:bg-[var(--edu-surface)] rounded">
                      <X className="w-3.5 h-3.5 text-[var(--edu-text-tertiary)]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newDocNom}
                onChange={(e) => setNewDocNom(e.target.value)}
                placeholder={t('programDialog.fields.documentName')}
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#2D2D2F] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); addDocument(); } }}
              />
              <label className="flex items-center gap-1.5 text-xs text-[var(--edu-text-secondary)] shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDocObligatoire}
                  onChange={(e) => setNewDocObligatoire(e.target.checked)}
                  className="rounded"
                />
                {t('programDialog.fields.mandatory')}
              </label>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); addDocument(); }}
                disabled={!newDocNom.trim()}
                className="p-2 rounded-lg border border-[var(--edu-border)] bg-white dark:bg-[#2D2D2F] hover:bg-[var(--edu-surface)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 text-[var(--edu-text-primary)]" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={estActif}
                onChange={(e) => setEstActif(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-[var(--edu-text-primary)]">{t('programDialog.fields.active')}</span>
            </label>
            <span className="text-xs text-[var(--edu-text-tertiary)]">
              {t('programDialog.fields.activeHint')}
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="rounded-xl">
            {t('programDialog.actions.cancel')}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl text-white"
            style={{ backgroundColor: 'var(--edu-blue)' }}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('programDialog.actions.creating')}</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> {t('programDialog.actions.create')}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
