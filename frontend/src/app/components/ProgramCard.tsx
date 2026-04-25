import React from 'react';
import { Link, useNavigate } from 'react-router';
import { Heart, MapPin, Calendar, Clock, Globe, Scale } from 'lucide-react';
import type { Programme } from '@/types/api';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useFavoriStatus } from '@/hooks/useFavoriStatus';

const COMPARE_KEY = 'edu_compare_ids';

function getCompareIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(COMPARE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function setCompareIds(ids: string[]): void {
  localStorage.setItem(COMPARE_KEY, JSON.stringify(ids.slice(0, 3)));
}

// Mapping champs mock → backend :
// program.title           → programme.titre
// program.institution.name → programme.institut?.nom
// program.institution.logo → programme.institut?.logo
// program.institution.country → programme.institut?.adresse?.pays
// program.institution.city → programme.institut?.adresse?.ville
// program.level           → programme.niveau
// program.field           → programme.domaine
// program.mode            → programme.mode
// program.duration        → programme.duree_annees + ' ans'
// program.tuition         → programme.frais_inscription
// program.deadline        → programme.date_limite_candidature
// program.language        → programme.langue
// program.cover           → programme.institut?.image_couverture ?? programme.institut?.logo
// program.rating          → programme.institut?.note

interface ProgramCardProps {
  programme: Programme;
  view?: 'grid' | 'list';
}

export function ProgramCard({ programme, view = 'grid' }: ProgramCardProps) {
  const navigate = useNavigate();

  // Favoris synchronisés avec l'API
  const { isFavori, loading: favoriLoading, handleToggle } = useFavoriStatus(programme.id);
  const [inCompare, setInCompare] = React.useState(() =>
    getCompareIds().includes(programme.id)
  );

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (favoriLoading) return;
    handleToggle();
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ids = getCompareIds();
    if (ids.includes(programme.id)) {
      setCompareIds(ids.filter((i) => i !== programme.id));
      setInCompare(false);
      toast.info('Retiré de la comparaison');
    } else if (ids.length >= 3) {
      toast.error('Maximum 3 programmes peuvent être comparés');
    } else {
      setCompareIds([...ids, programme.id]);
      setInCompare(true);
      toast.success('Ajouté à la comparaison', {
        action: { label: 'Voir comparaison', onClick: () => navigate('/compare') },
      });
    }
  };

  // Données calculées à partir des champs backend
  const titre = programme.titre;
  const institutNom = programme.institut?.nom;
  const institutLogo = programme.institut?.logo;
  const institutVille = programme.institut?.adresse?.ville;
  const institutPays = programme.institut?.adresse?.pays;
  const niveau = programme.niveau;
  const domaine = programme.domaine;
  const mode = programme.mode;
  const duree = programme.duree_annees != null ? `${programme.duree_annees} ans` : null;
  const langue = programme.langue;
  const deadline = programme.date_limite_candidature;
  const note = programme.institut?.note;
  // Image de couverture : préférer image_couverture de l'institut, sinon son logo
  const coverSrc = programme.institut?.image_couverture ?? programme.institut?.logo;

  // Localisation : ville + pays si disponibles
  const localisation = [institutVille, institutPays].filter(Boolean).join(', ');

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to={`/program/${programme.id}`}>
          <div className="glass-card rounded-2xl p-6 hover-lift cursor-pointer">
            <div className="flex gap-6">
              {/* Logo institution */}
              {institutLogo && (
                <div className="flex-shrink-0">
                  <img
                    src={institutLogo}
                    alt={institutNom ?? 'Institut'}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                </div>
              )}

              {/* Contenu principal */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-[var(--edu-text-primary)] mb-2 line-clamp-1">
                  {titre}
                </h3>

                <div className="flex items-center gap-2 text-[var(--edu-text-secondary)] text-sm mb-3">
                  {institutNom && (
                    <span className="font-medium">{institutNom}</span>
                  )}
                  {institutNom && localisation && <span>•</span>}
                  {localisation && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{localisation}</span>
                    </div>
                  )}
                </div>

                {programme.description && (
                  <p className="text-[var(--edu-text-secondary)] text-sm mb-4 line-clamp-2">
                    {programme.description}
                  </p>
                )}

                {/* Badges domaine / mode */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {domaine && (
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {domaine}
                    </Badge>
                  )}
                  {mode && (
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {mode}
                    </Badge>
                  )}
                </div>

                {/* Méta-infos */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--edu-text-secondary)]">
                  {niveau && (
                    <span className="font-semibold">{niveau}</span>
                  )}
                  {niveau && duree && <span>•</span>}
                  {duree && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{duree}</span>
                    </div>
                  )}
                  {langue && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>{langue}</span>
                      </div>
                    </>
                  )}
                  {deadline && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1 text-[var(--edu-warning)]">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline : {new Date(deadline).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Colonne droite : note + actions */}
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                {note != null && (
                  <div className="flex items-center gap-1 text-[var(--edu-accent)] mb-2">
                    <span className="text-2xl">★</span>
                    <span className="text-lg font-semibold">{note}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={favoriLoading}
                    className={`p-2 rounded-full hover:bg-[var(--edu-surface)] transition-colors disabled:opacity-50 ${
                      isFavori ? 'heart-bounce' : ''
                    }`}
                    aria-label={isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isFavori ? 'fill-[var(--edu-accent)] text-[var(--edu-accent)]' : 'text-[var(--edu-text-secondary)]'
                      }`}
                    />
                  </button>

                  <button
                    onClick={handleCompare}
                    className={`p-2 rounded-full hover:bg-[var(--edu-surface)] transition-colors ${
                      inCompare ? 'text-[var(--edu-blue)]' : 'text-[var(--edu-text-secondary)]'
                    }`}
                    aria-label="Comparer le programme"
                    title={inCompare ? 'Retirer de la comparaison' : 'Ajouter à la comparaison'}
                  >
                    <Scale className={`w-5 h-5 ${inCompare ? 'fill-[var(--edu-blue)]/20' : ''}`} />
                  </button>

                  <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                    Voir détails
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Vue grille
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/program/${programme.id}`}>
        <div className="glass-card rounded-2xl overflow-hidden hover-lift cursor-pointer">
          {/* Image de couverture */}
          {coverSrc && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={coverSrc}
                alt={titre}
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleSave}
                disabled={favoriLoading}
                className={`absolute top-4 right-4 p-2 glass-card rounded-full disabled:opacity-50 ${
                  isFavori ? 'heart-bounce' : ''
                }`}
                aria-label={isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavori ? 'fill-[var(--edu-accent)] text-[var(--edu-accent)]' : 'text-white'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Contenu */}
          <div className="p-6">
            <div className="flex items-start gap-3 mb-3">
              {institutLogo && (
                <img
                  src={institutLogo}
                  alt={institutNom ?? 'Institut'}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-[var(--edu-text-primary)] mb-1 line-clamp-2">
                  {titre}
                </h3>
                {institutNom && (
                  <p className="text-sm text-[var(--edu-text-secondary)] line-clamp-1">
                    {institutNom}
                  </p>
                )}
              </div>
            </div>

            {localisation && (
              <div className="flex items-center gap-1 text-[var(--edu-text-secondary)] text-sm mb-4">
                <MapPin className="w-4 h-4" />
                <span>{localisation}</span>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              {niveau && (
                <Badge variant="secondary" className="rounded-full text-xs">
                  {niveau}
                </Badge>
              )}
              {note != null && (
                <div className="flex items-center gap-1 text-[var(--edu-accent)]">
                  <span className="text-lg">★</span>
                  <span className="text-sm font-semibold">{note}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs text-[var(--edu-text-secondary)]">
              {duree && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{duree}</span>
                </div>
              )}
              {langue && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  <span>{langue}</span>
                </div>
              )}
              {deadline && (
                <div className="flex items-center gap-2 text-[var(--edu-warning)]">
                  <Calendar className="w-3 h-3" />
                  <span>Deadline : {new Date(deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Bouton Comparer */}
            <button
              onClick={handleCompare}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-full text-xs font-medium border transition-colors ${
                inCompare
                  ? 'border-[var(--edu-blue)] text-[var(--edu-blue)] bg-[var(--edu-blue)]/10'
                  : 'border-[var(--edu-border)] text-[var(--edu-text-secondary)] hover:border-[var(--edu-blue)] hover:text-[var(--edu-blue)]'
              }`}
              aria-label={inCompare ? 'Retirer de la comparaison' : 'Ajouter à la comparaison'}
            >
              <Scale className="w-3.5 h-3.5" />
              {inCompare ? 'Retirer de la comparaison' : 'Comparer'}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
