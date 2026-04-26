import React from 'react';
import { Link } from 'react-router';
import { X, Plus, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { programmeService } from '@/services/api';
import type { Programme } from '@/types/api';
import { motion } from 'motion/react';
import { useComparaison } from '@/hooks/useComparaison';

export function Compare() {
  const [programmes, setProgrammes] = React.useState<Programme[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { ids, retirer } = useComparaison();

  React.useEffect(() => {
    if (ids.length === 0) {
      setProgrammes([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    // L'API renvoie { programme: {...} } : on extrait donc r.data.programme.
    // allSettled évite qu'un id obsolète (404) ne casse toute la comparaison.
    Promise.allSettled(ids.map((id) => programmeService.getById(id)))
      .then((results) => {
        if (cancelled) return;
        const items: Programme[] = [];
        let failures = 0;
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            const payload = r.value.data as { programme?: Programme } | undefined;
            if (payload?.programme) items.push(payload.programme);
            else failures += 1;
          } else {
            failures += 1;
          }
        });
        setProgrammes(items);
        if (items.length === 0 && failures > 0) {
          setError('Impossible de charger les programmes sélectionnés.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ids]);

  const handleRemove = (id: string) => {
    retirer(id);
    setProgrammes((prev) => prev.filter((p) => p.id !== id));
  };

  const comparisonRows: { label: string; getValue: (p: Programme) => React.ReactNode }[] = [
    { label: 'Institut', getValue: (p) => p.institut?.nom ?? '—' },
    {
      label: 'Localisation',
      getValue: (p) =>
        [p.institut?.adresse?.ville, p.institut?.adresse?.pays].filter(Boolean).join(', ') || '—',
    },
    { label: 'Niveau', getValue: (p) => p.niveau ?? '—' },
    { label: 'Domaine', getValue: (p) => p.domaine ?? '—' },
    { label: 'Mode', getValue: (p) => p.mode ?? '—' },
    {
      label: 'Durée',
      getValue: (p) => (p.duree_annees != null ? `${p.duree_annees} ans` : '—'),
    },
    { label: 'Langue', getValue: (p) => p.langue ?? '—' },
    {
      label: 'Frais inscription',
      getValue: (p) =>
        p.frais_inscription != null ? `${p.frais_inscription.toLocaleString()} TND` : 'N/A',
    },
    {
      label: 'Date limite',
      getValue: (p) =>
        p.date_limite_candidature
          ? new Date(p.date_limite_candidature).toLocaleDateString('fr-FR')
          : '—',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-4">
              Comparer les programmes
            </h1>
            <p className="text-lg text-[var(--edu-text-secondary)]">
              Comparaison côte à côte pour vous aider à faire le bon choix
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-[var(--edu-blue)]" />
            </div>
          ) : error ? (
            <div className="glass-card rounded-2xl p-16 text-center">
              <p className="text-[var(--edu-danger)] text-lg mb-6">{error}</p>
              <Link to="/search">
                <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                  Retour à la recherche
                </Button>
              </Link>
            </div>
          ) : programmes.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center">
              <p className="text-[var(--edu-text-secondary)] text-lg mb-6">
                Aucun programme sélectionné pour la comparaison.
              </p>
              <p className="text-sm text-[var(--edu-text-tertiary)] mb-8">
                Utilisez le bouton «&nbsp;Comparer&nbsp;» sur les cartes de programmes pour en
                ajouter jusqu'à 3.
              </p>
              <Link to="/search">
                <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                  Parcourir les programmes
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[var(--edu-surface)]">
                        <th className="sticky left-0 bg-[var(--edu-surface)] px-6 py-4 text-left font-semibold text-[var(--edu-text-primary)] min-w-[200px]">
                          Critère
                        </th>
                        {programmes.map((programme) => {
                          // Pré-calculs sécurisés : éviter tout .charAt() sur undefined
                          const cover =
                            programme.institut?.image_couverture ?? programme.institut?.logo;
                          const titre = programme.titre ?? 'Programme sans titre';
                          const initialeCover = programme.titre?.charAt(0) ?? '?';
                          const initialeLogo =
                            (programme.institut?.nom ?? programme.titre)?.charAt(0) ?? '?';
                          return (
                            <th key={programme.id} className="px-6 py-4 min-w-[280px]">
                              <div className="space-y-4">
                                {/* Image de couverture */}
                                <div className="relative">
                                  {cover ? (
                                    <img
                                      src={cover}
                                      alt={titre}
                                      className="w-full h-32 object-cover rounded-xl"
                                    />
                                  ) : (
                                    <div className="w-full h-32 bg-[var(--edu-blue)]/10 rounded-xl flex items-center justify-center">
                                      <span className="text-2xl font-bold text-[var(--edu-blue)]">
                                        {initialeCover}
                                      </span>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleRemove(programme.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-[#1D1D1F] rounded-full hover:bg-[var(--edu-danger)] hover:text-white transition-colors"
                                    aria-label="Retirer de la comparaison"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                                {/* Logo + titre */}
                                <div className="flex items-center gap-3">
                                  {programme.institut?.logo ? (
                                    <img
                                      src={programme.institut.logo}
                                      alt={programme.institut?.nom ?? 'Institut'}
                                      className="w-12 h-12 rounded-lg object-cover"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-[var(--edu-blue)]/10 flex items-center justify-center">
                                      <span className="text-lg font-bold text-[var(--edu-blue)]">
                                        {initialeLogo}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-left flex-1 min-w-0">
                                    <p className="font-semibold text-[var(--edu-text-primary)] text-sm line-clamp-2">
                                      {titre}
                                    </p>
                                  </div>
                                </div>
                                <Link to={`/program/${programme.id}`}>
                                  <Button
                                    size="sm"
                                    className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white"
                                  >
                                    Voir les détails
                                  </Button>
                                </Link>
                              </div>
                            </th>
                          );
                        })}
                        {programmes.length < 3 && (
                          <th className="px-6 py-4 min-w-[280px]">
                            <Link to="/search">
                              <div className="h-full flex flex-col items-center justify-center gap-4 py-8 border-2 border-dashed border-[var(--edu-border)] rounded-2xl hover:border-[var(--edu-blue)] transition-colors cursor-pointer">
                                <div className="w-16 h-16 rounded-full bg-[var(--edu-surface)] flex items-center justify-center">
                                  <Plus className="w-8 h-8 text-[var(--edu-text-tertiary)]" />
                                </div>
                                <p className="text-sm text-[var(--edu-text-secondary)]">
                                  Ajouter un programme
                                </p>
                              </div>
                            </Link>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--edu-divider)]">
                      {comparisonRows.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={rowIdx % 2 === 0 ? 'bg-[var(--edu-surface)]/50' : ''}
                        >
                          <td className="sticky left-0 bg-inherit px-6 py-4 font-semibold text-[var(--edu-text-primary)]">
                            {row.label}
                          </td>
                          {programmes.map((p) => (
                            <td key={p.id} className="px-6 py-4 text-[var(--edu-text-secondary)]">
                              {row.getValue(p)}
                            </td>
                          ))}
                          {programmes.length < 3 && <td className="px-6 py-4" />}
                        </tr>
                      ))}

                      {/* Documents requis */}
                      <tr>
                        <td className="sticky left-0 bg-[var(--edu-surface)]/50 px-6 py-4 font-semibold text-[var(--edu-text-primary)]">
                          Documents requis
                        </td>
                        {programmes.map((p) => (
                          <td key={p.id} className="px-6 py-4">
                            {p.documents_requis && p.documents_requis.length > 0 ? (
                              <ul className="space-y-1 text-sm text-[var(--edu-text-secondary)]">
                                {p.documents_requis.slice(0, 3).map((doc, i) => (
                                  <li key={i} className="line-clamp-1">
                                    •&nbsp;{doc.nom}
                                    {doc.obligatoire ? ' *' : ''}
                                  </li>
                                ))}
                                {p.documents_requis.length > 3 && (
                                  <li className="text-[var(--edu-blue)]">
                                    +{p.documents_requis.length - 3} de plus
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <span className="text-[var(--edu-text-tertiary)] text-sm">—</span>
                            )}
                          </td>
                        ))}
                        {programmes.length < 3 && <td className="px-6 py-4" />}
                      </tr>

                      {/* Prérequis */}
                      <tr className="bg-[var(--edu-surface)]/50">
                        <td className="sticky left-0 bg-inherit px-6 py-4 font-semibold text-[var(--edu-text-primary)]">
                          Prérequis
                        </td>
                        {programmes.map((p) => (
                          <td key={p.id} className="px-6 py-4 text-sm text-[var(--edu-text-secondary)]">
                            {p.prerequis ? (
                              <div className="space-y-1">
                                {p.prerequis.moyenne_min != null && (
                                  <p>Moyenne min.&nbsp;: {p.prerequis.moyenne_min}</p>
                                )}
                                {p.prerequis.types_bac && p.prerequis.types_bac.length > 0 && (
                                  <p>Bac&nbsp;: {p.prerequis.types_bac.join(', ')}</p>
                                )}
                                {p.prerequis.matieres && p.prerequis.matieres.length > 0 && (
                                  <p>Matières&nbsp;: {p.prerequis.matieres.join(', ')}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[var(--edu-text-tertiary)]">—</span>
                            )}
                          </td>
                        ))}
                        {programmes.length < 3 && <td className="px-6 py-4" />}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-center mt-8">
                <Link to="/search">
                  <Button variant="outline" className="rounded-full">
                    Parcourir plus de programmes
                  </Button>
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
