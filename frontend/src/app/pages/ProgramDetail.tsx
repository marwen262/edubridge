import React from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router';
import {
  Heart, Share2, MapPin, Clock, Globe, Calendar,
  ChevronRight, Star, Check, Link2,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MultiStepDialog } from '../components/MultiStepDialog';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useProgramDetail } from '@/hooks/useProgramDetail';
import { useFavoriStatus } from '@/hooks/useFavoriStatus';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function ProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  // Seuls les candidats peuvent postuler
  const canApply = !isAuthenticated || user?.role === 'candidat';
  const { program, loading, error } = useProgramDetail(id);
  const { isFavori, loading: favoriLoading, handleToggle: handleSave } = useFavoriStatus(
    program?.id ?? ''
  );
  const [applyDialogOpen, setApplyDialogOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('overview');

  const handleApply = () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour candidater');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (user?.role !== 'candidat') {
      toast.error('Seuls les candidats peuvent postuler à un programme.');
      return;
    }
    setApplyDialogOpen(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: program?.titre ?? 'Programme', url });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Lien copié dans le presse-papiers !');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Impossible de copier le lien.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-[var(--edu-blue)] animate-spin" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--edu-danger)]">{error ?? 'Programme introuvable'}</p>
          <button onClick={() => navigate('/search')} className="mt-4 px-4 py-2 bg-[var(--edu-blue)] text-white rounded-lg">
            Retour à la recherche
          </button>
        </div>
      </div>
    );
  }

  const coverSrc = program.institut?.image_couverture ?? program.institut?.logo;
  const deadlineDate = program.date_limite_candidature ? new Date(program.date_limite_candidature) : null;
  const daysLeft = deadlineDate ? Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const localisation = [program.institut?.adresse?.ville, program.institut?.adresse?.pays].filter(Boolean).join(', ');
  const docs = Array.isArray(program?.documents_requis) ? program.documents_requis : [];

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      {/* Fil d'Ariane */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)]">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-[var(--edu-text-secondary)]">
            <Link to="/" className="hover:text-[var(--edu-blue)]">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/search" className="hover:text-[var(--edu-blue)]">Search</Link>
            {program.institut && (
              <>
                <ChevronRight className="w-4 h-4" />
                <Link to={`/institution/${program.institut.id}`} className="hover:text-[var(--edu-blue)]">
                  {program.institut.nom}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4" />
            <span className="text-[var(--edu-text-primary)]">{program.titre}</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative h-[400px] overflow-hidden">
        {coverSrc ? (
          <img src={coverSrc} alt={program.titre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--edu-blue)] via-[#6366f1] to-[#8b5cf6]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-[1440px] mx-auto px-6 py-8">
            <div className="flex items-start justify-between gap-8">
              <div className="flex items-start gap-6 flex-1">
                {program.institut?.logo && (
                  <img src={program.institut.logo} alt={program.institut.nom} className="w-20 h-20 rounded-2xl object-cover glass-card" />
                )}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">{program.titre}</h1>
                  <div className="flex items-center gap-4 text-white/90 flex-wrap">
                    {program.institut?.nom && <span className="font-medium">{program.institut.nom}</span>}
                    {localisation && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span>{localisation}</span></div>
                      </>
                    )}
                    {program.institut?.note != null && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-[var(--edu-accent)] text-[var(--edu-accent)]" />
                          <span>{program.institut.note}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-3 pb-1">
                {/* Favori */}
                <button
                  onClick={handleSave}
                  disabled={favoriLoading}
                  aria-label={isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  className={`bg-white/20 backdrop-blur-sm border border-white/30 p-3 rounded-full transition-all disabled:opacity-50 hover:bg-white/30 ${isFavori ? 'heart-bounce' : ''}`}
                >
                  <Heart className={`w-5 h-5 transition-colors ${isFavori ? 'fill-[var(--edu-accent)] text-[var(--edu-accent)]' : 'text-white'}`} />
                </button>
                {/* Share */}
                <button
                  onClick={handleShare}
                  aria-label="Partager ce programme"
                  className="bg-white/20 backdrop-blur-sm border border-white/30 p-3 rounded-full transition-all hover:bg-white/30"
                >
                  {copied ? <Check className="w-5 h-5 text-green-300" /> : <Share2 className="w-5 h-5 text-white" />}
                </button>
                {canApply && (
                  <Button onClick={handleApply} className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white px-6 h-11 font-semibold">
                    Candidater
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'onglets sticky */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] sticky top-[73px] z-40">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex w-full">
            {[
              { value: 'overview', label: 'Overview' },
              { value: 'requirements', label: 'Requirements' },
              { value: 'tuition', label: 'Tuition' },
              { value: 'institution', label: 'Institution' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.value
                    ? 'border-[var(--edu-blue)] text-[var(--edu-blue)]'
                    : 'border-transparent text-[var(--edu-text-secondary)] hover:text-[var(--edu-text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Colonne principale */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="overview" className="space-y-8">
                {/* Faits clés */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Key Facts</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Level', value: program.niveau ?? null, icon: <Star className="w-5 h-5" /> },
                      { label: 'Duration', value: program.duree_annees != null ? `${program.duree_annees} ans` : null, icon: <Clock className="w-5 h-5" /> },
                      { label: 'Start Date', value: program.date_debut ?? null, icon: <Calendar className="w-5 h-5" /> },
                      { label: 'Deadline', value: deadlineDate ? deadlineDate.toLocaleDateString() : null, icon: <Calendar className="w-5 h-5" /> },
                      { label: 'Language', value: program.langue ?? null, icon: <Globe className="w-5 h-5" /> },
                      { label: 'Mode', value: program.mode ?? null, icon: <MapPin className="w-5 h-5" /> },
                    ].filter((f) => f.value != null).map((fact) => (
                      <div key={fact.label} className="glass-card rounded-2xl p-6">
                        <div className="text-[var(--edu-blue)] mb-3">{fact.icon}</div>
                        <p className="text-sm text-[var(--edu-text-secondary)] mb-1">{fact.label}</p>
                        <p className="font-semibold text-[var(--edu-text-primary)]">{fact.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Description */}
                {program.description && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                    <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-4">About the Program</h2>
                    <div className="glass-card rounded-2xl p-6">
                      <p className="text-[var(--edu-text-secondary)] leading-relaxed">{program.description}</p>
                    </div>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="requirements">
                <div className="glass-card rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Admission Requirements</h2>
                  {docs.length === 0 ? (
                    <p className="text-[var(--edu-text-secondary)]">Aucun document requis spécifié.</p>
                  ) : (
                    <ul className="space-y-3">
                      {docs.map((doc, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-[var(--edu-blue)] flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-[var(--edu-text-secondary)] flex-1">{doc?.nom ?? 'Document'}</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${doc?.obligatoire ? 'bg-[var(--edu-success)] text-white' : 'bg-[var(--edu-warning)] text-white'}`}>
                            {doc?.obligatoire ? 'Obligatoire' : 'Optionnel'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tuition">
                <div className="glass-card rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-6">Tuition & Funding</h2>
                  <div className="space-y-6">
                    {program.frais_inscription != null && (
                      <div className="flex items-center justify-between py-4 border-b border-[var(--edu-divider)]">
                        <span className="text-[var(--edu-text-secondary)]">Frais d'inscription annuels</span>
                        <span className="text-2xl font-bold text-[var(--edu-blue)]">{program.frais_inscription.toLocaleString()} TND</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-[var(--edu-text-primary)] mb-3">Options de financement</h3>
                      <ul className="space-y-2 text-[var(--edu-text-secondary)]">
                        <li>• Bourses au mérite</li>
                        <li>• Aide financière selon les besoins</li>
                        <li>• Prêts étudiants</li>
                        <li>• Programmes d'alternance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="institution">
                <div className="glass-card rounded-2xl p-8">
                  {program.institut ? (
                    <div className="flex items-start gap-6">
                      {program.institut.logo && (
                        <img src={program.institut.logo} alt={program.institut.nom} className="w-20 h-20 rounded-2xl object-cover" />
                      )}
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">{program.institut.nom}</h2>
                        {localisation && (
                          <div className="flex items-center gap-2 text-[var(--edu-text-secondary)] mb-4">
                            <MapPin className="w-4 h-4" /><span>{localisation}</span>
                          </div>
                        )}
                        <Link to={`/institution/${program.institut.id}`}>
                          <Button variant="outline" className="rounded-full">
                            Voir le profil complet <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[var(--edu-text-secondary)]">Informations institution non disponibles.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Barre latérale */}
          <aside className="w-[360px] flex-shrink-0 sticky top-[145px] self-start space-y-6">
            {/* Carte candidature */}
            <div className="glass-card rounded-2xl p-6">
              {daysLeft != null && (
                <div className="text-center mb-6">
                  <p className="text-sm text-[var(--edu-text-secondary)] mb-2">Application Deadline</p>
                  <p className={`text-3xl font-bold mb-1 ${daysLeft <= 7 ? 'text-[var(--edu-danger)]' : 'text-[var(--edu-text-primary)]'}`}>
                    {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                  </p>
                  {deadlineDate && (
                    <p className="text-sm text-[var(--edu-text-secondary)]">
                      {deadlineDate.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              )}

              {canApply && (
                <Button onClick={handleApply} className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 mb-3">
                  Apply now
                </Button>
              )}

              <div className="flex items-center gap-2">
                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={favoriLoading}
                  className={`flex-1 flex items-center justify-center gap-2 border rounded-full py-2 transition-all disabled:opacity-50 ${
                    isFavori
                      ? 'border-[var(--edu-accent)] text-[var(--edu-accent)] bg-[var(--edu-accent)]/5'
                      : 'border-[var(--edu-border)] text-[var(--edu-text-secondary)] hover:bg-[var(--edu-surface)]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavori ? 'fill-current' : ''}`} />
                  {isFavori ? 'Saved' : 'Save'}
                </button>
                {/* Share button */}
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 border border-[var(--edu-border)] rounded-full py-2 text-[var(--edu-text-secondary)] hover:bg-[var(--edu-surface)] transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>
            </div>

            {/* Mini carte institution */}
            {program.institut && (
              <div className="glass-card rounded-2xl p-6">
                <h3 className="font-semibold text-[var(--edu-text-primary)] mb-4">Institution</h3>
                <div className="flex items-center gap-3 mb-4">
                  {program.institut.logo && (
                    <img src={program.institut.logo} alt={program.institut.nom} className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--edu-text-primary)] line-clamp-1">{program.institut.nom}</p>
                    {program.institut.adresse?.pays && (
                      <p className="text-sm text-[var(--edu-text-secondary)]">{program.institut.adresse.pays}</p>
                    )}
                  </div>
                </div>
                <Link to={`/institution/${program.institut.id}`}>
                  <Button variant="outline" className="w-full rounded-full">View Profile</Button>
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>

      <Footer />

      {/* Dialogue de candidature — uniquement pour les candidats */}
      {canApply && (
        <MultiStepDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          programmeId={program.id}
          programmeTitre={program.titre}
        />
      )}
    </div>
  );
}
