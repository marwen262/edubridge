import React from 'react';
import { toast } from 'sonner';
import { X, Plus, Loader2, Save } from 'lucide-react';
import { Button } from '../ui/button';
import { programmeService } from '@/services/api';
import type { Programme, DocumentRequis, CreateProgrammeData } from '@/types/api';

interface EditProgramDialogProps {
  programme: Programme | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const DOMAINES = [
  { value: 'informatique', label: 'Informatique' },
  { value: 'genie_civil', label: 'Génie civil' },
  { value: 'electrique', label: 'Électrique' },
  { value: 'mecanique', label: 'Mécanique' },
  { value: 'chimie', label: 'Chimie' },
  { value: 'agronomie', label: 'Agronomie' },
  { value: 'finance', label: 'Finance' },
  { value: 'management', label: 'Management' },
];

const NIVEAUX = [
  { value: 'cycle_preparatoire', label: 'Cycle préparatoire' },
  { value: 'licence', label: 'Licence' },
  { value: 'master', label: 'Master' },
  { value: 'ingenieur', label: 'Ingénieur' },
];

const MODES = [
  { value: 'cours_du_jour', label: 'Cours du jour' },
  { value: 'cours_du_soir', label: 'Cours du soir' },
  { value: 'alternance', label: 'Alternance' },
  { value: 'formation_continue', label: 'Formation continue' },
];

export function EditProgramDialog({ programme, open, onClose, onUpdated }: EditProgramDialogProps) {
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

  React.useEffect(() => {
    if (programme && open) {
      setTitre(programme.titre ?? '');
      setDomaine(programme.domaine ?? '');
      setNiveau(programme.niveau ?? '');
      setMode(programme.mode ?? '');
      setDureeAnnees(programme.duree_annees != null ? String(programme.duree_annees) : '');
      setLangue(programme.langue ?? '');
      setDescription(programme.description ?? '');
      setFraisInscription(programme.frais_inscription != null ? String(programme.frais_inscription) : '');
      setDateLimite(programme.date_limite_candidature ? programme.date_limite_candidature.slice(0, 10) : '');
      setDateDebut(programme.date_debut ? programme.date_debut.slice(0, 10) : '');
      setCapacite(programme.capacite != null ? String(programme.capacite) : '');
      setEstActif(programme.est_actif ?? true);
      setDocuments(programme.documents_requis ?? []);
      setMoyenneMin(programme.prerequis?.moyenne_min != null ? String(programme.prerequis.moyenne_min) : '');
      setTypesBac((programme.prerequis?.types_bac ?? []).join(', '));
      setErrors({});
    }
  }, [programme, open]);

  const handleClose = () => { if (!submitting) onClose(); };

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
    if (!titre.trim()) errs.titre = 'Le titre est obligatoire.';
    if (titre.trim().length < 3) errs.titre = 'Le titre doit contenir au moins 3 caractères.';
    if (dureeAnnees && (isNaN(Number(dureeAnnees)) || Number(dureeAnnees) < 1)) errs.dureeAnnees = 'Durée invalide.';
    if (fraisInscription && isNaN(Number(fraisInscription))) errs.fraisInscription = 'Montant invalide.';
    if (capacite && (isNaN(Number(capacite)) || Number(capacite) < 1)) errs.capacite = 'Capacité invalide.';
    if (moyenneMin && (isNaN(Number(moyenneMin)) || Number(moyenneMin) < 0 || Number(moyenneMin) > 20)) errs.moyenneMin = 'Moyenne entre 0 et 20.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programme || !validate()) return;
    setSubmitting(true);
    try {
      const data: Partial<CreateProgrammeData> = { titre: titre.trim(), est_actif: estActif };
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
      data.documents_requis = documents;
      if (moyenneMin || typesBac) {
        data.prerequis = {};
        if (moyenneMin) data.prerequis.moyenne_min = Number(moyenneMin);
        if (typesBac.trim()) data.prerequis.types_bac = typesBac.split(',').map((s) => s.trim()).filter(Boolean);
      }
      await programmeService.update(programme.id, data);
      toast.success('Programme mis à jour.');
      onUpdated();
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      toast.error(apiErr?.response?.data?.message ?? 'Erreur lors de la mise à jour.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !programme) return null;

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
            <h2 className="text-xl font-bold text-[var(--edu-text-primary)]">Modifier le programme</h2>
            <p className="text-xs text-[var(--edu-text-secondary)] mt-0.5">{programme.titre}</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-[var(--edu-surface)] transition-colors">
            <X className="w-5 h-5 text-[var(--edu-text-tertiary)]" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">
              Titre du programme <span className="text-[var(--edu-danger)]">*</span>
            </label>
            <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Master en Intelligence Artificielle" className={inputClass('titre')} />
            {errors.titre && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.titre}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Domaine</label>
              <select value={domaine} onChange={(e) => setDomaine(e.target.value)} className={inputClass()}>
                <option value="">— Sélectionner —</option>
                {DOMAINES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Niveau</label>
              <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className={inputClass()}>
                <option value="">— Sélectionner —</option>
                {NIVEAUX.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass()}>
                <option value="">— Sélectionner —</option>
                {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Durée (années)</label>
              <input type="number" min="1" max="10" value={dureeAnnees} onChange={(e) => setDureeAnnees(e.target.value)}
                placeholder="Ex : 2" className={inputClass('dureeAnnees')} />
              {errors.dureeAnnees && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.dureeAnnees}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Langue</label>
              <input type="text" value={langue} onChange={(e) => setLangue(e.target.value)}
                placeholder="Ex : Français" className={inputClass()} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Capacité</label>
              <input type="number" min="1" value={capacite} onChange={(e) => setCapacite(e.target.value)}
                placeholder="Ex : 30" className={inputClass('capacite')} />
              {errors.capacite && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.capacite}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Frais d'inscription (TND)</label>
              <input type="number" min="0" step="0.01" value={fraisInscription} onChange={(e) => setFraisInscription(e.target.value)}
                placeholder="Ex : 500" className={inputClass('fraisInscription')} />
              {errors.fraisInscription && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.fraisInscription}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Date limite candidature</label>
              <input type="date" value={dateLimite} onChange={(e) => setDateLimite(e.target.value)} className={inputClass()} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Date de début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className={inputClass()} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--edu-text-primary)] mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le programme, ses objectifs et débouchés…" rows={4} className={inputClass()} />
          </div>

          <div className="bg-[var(--edu-surface)] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--edu-text-primary)]">Prérequis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--edu-text-secondary)] mb-1">Moyenne minimum (/20)</label>
                <input type="number" min="0" max="20" step="0.01" value={moyenneMin} onChange={(e) => setMoyenneMin(e.target.value)}
                  placeholder="Ex : 12" className={inputClass('moyenneMin')} />
                {errors.moyenneMin && <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.moyenneMin}</p>}
              </div>
              <div>
                <label className="block text-xs text-[var(--edu-text-secondary)] mb-1">Types de bac (séparés par virgule)</label>
                <input type="text" value={typesBac} onChange={(e) => setTypesBac(e.target.value)}
                  placeholder="Ex : mathematiques, sciences" className={inputClass()} />
              </div>
            </div>
          </div>

          <div className="bg-[var(--edu-surface)] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--edu-text-primary)]">Documents requis</h3>
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white dark:bg-[#2D2D2F] rounded-lg px-3 py-2">
                    <span className="text-sm text-[var(--edu-text-primary)] flex-1">{doc.nom}</span>
                    <span className={`text-xs font-semibold ${doc.obligatoire ? 'text-[var(--edu-danger)]' : 'text-[var(--edu-text-tertiary)]'}`}>
                      {doc.obligatoire ? 'Obligatoire' : 'Optionnel'}
                    </span>
                    <button type="button" onClick={() => removeDocument(i)} className="p-1 hover:bg-[var(--edu-surface)] rounded">
                      <X className="w-3.5 h-3.5 text-[var(--edu-text-tertiary)]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="text" value={newDocNom} onChange={(e) => setNewDocNom(e.target.value)}
                placeholder="Nom du document"
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#2D2D2F] border border-[var(--edu-border)] text-sm text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--edu-blue)]"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); addDocument(); } }} />
              <label className="flex items-center gap-1.5 text-xs text-[var(--edu-text-secondary)] shrink-0 cursor-pointer">
                <input type="checkbox" checked={newDocObligatoire} onChange={(e) => setNewDocObligatoire(e.target.checked)} className="rounded" />
                Obligatoire
              </label>
              <button type="button" onClick={(e) => { e.preventDefault(); addDocument(); }} disabled={!newDocNom.trim()}
                className="p-2 rounded-lg border border-[var(--edu-border)] bg-white dark:bg-[#2D2D2F] hover:bg-[var(--edu-surface)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <Plus className="w-4 h-4 text-[var(--edu-text-primary)]" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={estActif} onChange={(e) => setEstActif(e.target.checked)} className="rounded" />
              <span className="text-sm font-medium text-[var(--edu-text-primary)]">Programme actif</span>
            </label>
            <span className="text-xs text-[var(--edu-text-tertiary)]">(visible immédiatement aux candidats)</span>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--edu-border)] flex items-center justify-end gap-3 shrink-0">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="rounded-xl">Annuler</Button>
          <Button type="submit" onClick={handleSubmit} disabled={submitting} className="rounded-xl text-white" style={{ backgroundColor: 'var(--edu-blue)' }}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement…</> : <><Save className="w-4 h-4 mr-2" /> Enregistrer</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
