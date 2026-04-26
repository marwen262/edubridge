import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProgramCard } from '../components/ProgramCard';
import { InstitutCard } from '../components/InstitutCard';
import { Button } from '../components/ui/button';
import { usePrograms } from '@/hooks/usePrograms';
import { useInstituts } from '@/hooks/useInstituts';
import type { Institut, ProgrammeFilters } from '@/types/api';
import { programmeService } from '@/services/api';
import { motion } from 'motion/react';

const domaines: { key: NonNullable<ProgrammeFilters['domaine']>; label: string }[] = [
  { key: 'informatique', label: 'Informatique' },
  { key: 'genie_civil',  label: 'Génie Civil' },
  { key: 'electrique',   label: 'Génie Électrique' },
  { key: 'mecanique',    label: 'Génie Mécanique' },
  { key: 'chimie',       label: 'Chimie' },
  { key: 'agronomie',    label: 'Agronomie' },
  { key: 'finance',      label: 'Finance' },
  { key: 'management',   label: 'Management' },
];

export function Home() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const { programs } = usePrograms({ est_actif: true });
  const { instituts: institutsRaw, loading: institusLoading } = useInstituts({ est_verifie: true });
  const instituts = institutsRaw as Institut[];

  useEffect(() => {
    const fetchCounts = async () => {
      const results = await Promise.all(
        domaines.map(d =>
          programmeService.getAll({ domaine: d.key })
            .then(r => ({ key: d.key, count: (r.data.programmes ?? []).length }))
            .catch(() => ({ key: d.key, count: 0 }))
        )
      );
      const map: Record<string, number> = {};
      results.forEach(r => { map[r.key] = r.count; });
      setCounts(map);
    };
    fetchCounts();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1D1D1F]">
      <Navbar transparent />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">

        {/* COUCHE 1 — Photo campus nette */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1562774053-701939374585?w=1600&h=900&fit=crop&q=85')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* COUCHE 2 — Overlay dégradé bleu foncé + vert */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(0,10,60,0.72) 0%, rgba(0,40,80,0.55) 50%, rgba(0,80,40,0.45) 100%)',
          }}
        />

        {/* COUCHE 3 — Réseau de nœuds SVG abstrait blanc semi-transparent */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.10 }}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1440 900"
        >
          <line x1="200" y1="150" x2="500" y2="400" stroke="white" strokeWidth="1"/>
          <line x1="500" y1="400" x2="900" y2="200" stroke="white" strokeWidth="1"/>
          <line x1="900" y1="200" x2="1200" y2="500" stroke="white" strokeWidth="1"/>
          <line x1="1200" y1="500" x2="800" y2="700" stroke="white" strokeWidth="1"/>
          <line x1="800" y1="700" x2="400" y2="600" stroke="white" strokeWidth="1"/>
          <line x1="400" y1="600" x2="200" y2="150" stroke="white" strokeWidth="1"/>
          <line x1="500" y1="400" x2="800" y2="700" stroke="white" strokeWidth="1"/>
          <line x1="900" y1="200" x2="400" y2="600" stroke="white" strokeWidth="1"/>
          <circle cx="200" cy="150" r="4" fill="white"/>
          <circle cx="500" cy="400" r="4" fill="white"/>
          <circle cx="900" cy="200" r="4" fill="white"/>
          <circle cx="1200" cy="500" r="4" fill="white"/>
          <circle cx="800" cy="700" r="4" fill="white"/>
          <circle cx="400" cy="600" r="4" fill="white"/>
        </svg>

        {/* COUCHE 4 — Contenu texte centré */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center px-6 max-w-3xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Find your path to the<br />right institution
          </h1>
          <p className="text-xl text-white/75 max-w-xl mx-auto">
            Discover programs, compare institutions,
            and manage your admissions — all in one place.
          </p>
        </motion.div>

      </section>

      {/* Stats Strip */}
      <section className="border-b border-[var(--edu-border)]">
        <div className="max-w-[1440px] mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '5 000+', label: 'Programmes' },
              { value: '800+', label: 'Établissements' },
              { value: '150+', label: 'Domaines' },
              { value: '50 000+', label: 'Étudiants' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-bold text-[var(--edu-blue)] mb-2">{stat.value}</p>
                <p className="text-[var(--edu-text-secondary)]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-[var(--edu-surface)]">
        <div className="max-w-[1440px] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-4">À propos d'EduBridge</h2>
            <p className="text-[var(--edu-text-secondary)] text-lg">
              Une plateforme conçue pour simplifier l'accès à l'enseignement supérieur en Tunisie
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="glass-card rounded-3xl p-10 mb-10"
          >
            <p className="text-base text-[var(--edu-text-primary)] leading-relaxed mb-6">
              EduBridge est une plateforme numérique tunisienne dédiée à la mise
              en relation entre les candidats et les établissements d'enseignement
              supérieur privés en Tunisie. Elle couvre l'ensemble des filières :
              cycles préparatoires, licences, cycles ingénieurs et masters —
              dans des domaines aussi variés que l'informatique, le génie civil,
              l'électrique, la mécanique et bien d'autres.
            </p>
            <p className="text-sm text-[var(--edu-text-secondary)] leading-relaxed">
              Les candidats peuvent explorer les programmes disponibles, comparer
              les institutions et soumettre leurs dossiers en ligne. Les institutions
              disposent d'un espace dédié pour gérer les admissions et communiquer
              directement avec les candidats.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🎯',
                title: 'Notre mission',
                text: "Démocratiser l'accès à l'information sur l'enseignement supérieur et réduire les inégalités d'orientation en Tunisie.",
              },
              {
                icon: '🤝',
                title: 'Nos partenaires',
                text: "Nous collaborons avec des établissements publics et privés accrédités, sélectionnés pour la qualité de leurs formations et leur engagement envers les étudiants.",
              },
              {
                icon: '🔒',
                title: 'Confidentialité',
                text: "Les données personnelles des candidats sont protégées et partagées uniquement avec les institutions concernées, dans le strict respect de la vie privée.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="glass-card rounded-2xl p-6 text-center"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-[var(--edu-text-primary)] mb-3">{item.title}</h3>
                <p className="text-sm text-[var(--edu-text-secondary)] leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Fields */}
      <section className="py-16 bg-white dark:bg-[#1D1D1F]">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-4">Explorer par domaine</h2>
            <p className="text-[var(--edu-text-secondary)] text-lg">Trouvez des programmes dans votre domaine d'intérêt</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {domaines.map((domaine, i) => (
              <motion.div
                key={domaine.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Link to="/search">
                  <div className="glass-card rounded-2xl p-6 hover-lift cursor-pointer text-center">
                    <h3 className="font-semibold text-[var(--edu-text-primary)] mb-2">{domaine.label}</h3>
                    <p className="text-sm text-[var(--edu-text-secondary)]">{counts[domaine.key] ?? '...'} programmes</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className="py-16">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-2">Programmes à la une</h2>
              <p className="text-[var(--edu-text-secondary)] text-lg">Les meilleurs programmes des principaux instituts</p>
            </div>
            <Link to="/search">
              <Button variant="ghost" className="text-[var(--edu-blue)]">
                Voir tout
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {programs.slice(0, 6).map((programme, i) => (
                <motion.div
                  key={programme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <ProgramCard programme={programme} view="grid" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--edu-text-secondary)]">
              <Link to="/search">
                <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                  Parcourir les programmes
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Top Institutions */}
      <section className="py-16 bg-[var(--edu-surface)]">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-2">Meilleurs instituts</h2>
              <p className="text-[var(--edu-text-secondary)] text-lg">Écoles d'ingénieurs et universités de référence</p>
            </div>
            <Link to="/search">
              <Button variant="ghost" className="text-[var(--edu-blue)]">
                Voir tout
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {institusLoading ? (
            <p className="text-center text-[var(--edu-text-secondary)] py-8">
              Chargement…
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instituts.slice(0, 3).map((institution) => (
                <InstitutCard key={institution.id} institut={institution} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-4">Comment ça marche</h2>
            <p className="text-[var(--edu-text-secondary)] text-lg">Votre parcours vers l'admission en trois étapes simples</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Explorer',
                description: 'Parcourez des milliers de programmes dans les meilleurs instituts tunisiens. Utilisez les filtres pour trouver la formation idéale.',
                icon: '🔍',
              },
              {
                step: '02',
                title: 'Candidater',
                description: 'Soumettez votre dossier via notre processus simplifié. Suivez votre candidature à chaque étape.',
                icon: '📝',
              },
              {
                step: '03',
                title: 'Être admis',
                description: 'Recevez les décisions et échangez avec les instituts. Démarrez votre parcours académique en toute sérénité.',
                icon: '🎓',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-6xl mb-6">{item.icon}</div>
                <div className="text-sm font-bold text-[var(--edu-blue)] mb-2">ÉTAPE {item.step}</div>
                <h3 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-3">{item.title}</h3>
                <p className="text-[var(--edu-text-secondary)]">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
