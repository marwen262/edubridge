import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProgramCard } from '../components/ProgramCard';
import { InstitutionCard } from '../components/InstitutionCard';
import { Button } from '../components/ui/button';
import { fields } from '../data/staticData';
import { usePrograms } from '@/hooks/usePrograms';
import { useInstituts } from '@/hooks/useInstituts';
import type { Institut } from '@/types/api';
import { motion } from 'motion/react';

export function Home() {
  const { programs } = usePrograms({ est_actif: true });
  const { instituts: institutsRaw } = useInstituts();
  const instituts = institutsRaw as Institut[];

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

      {/* Popular Fields */}
      <section className="py-16 bg-[var(--edu-surface)]">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-4">Explorer par domaine</h2>
            <p className="text-[var(--edu-text-secondary)] text-lg">Trouvez des programmes dans votre domaine d'intérêt</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {fields.map((field, i) => (
              <motion.div
                key={field.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Link to="/search">
                  <div className="glass-card rounded-2xl p-6 hover-lift cursor-pointer text-center">
                    <h3 className="font-semibold text-[var(--edu-text-primary)] mb-2">{field.name}</h3>
                    <p className="text-sm text-[var(--edu-text-secondary)]">{field.count} programmes</p>
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

          {instituts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {instituts.slice(0, 4).map((institution, i) => (
                <motion.div
                  key={institution.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <InstitutionCard institution={institution} />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--edu-text-secondary)] py-8">
              Chargement des instituts…
            </p>
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

      {/* Testimonials */}
      <section className="py-16 bg-[var(--edu-surface)]">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-4">Ce que disent nos étudiants</h2>
            <p className="text-[var(--edu-text-secondary)] text-lg">Témoignages de notre communauté</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "EduBridge m'a facilité la découverte et la candidature à mon programme idéal. La plateforme est intuitive et le suivi excellent.",
                author: 'Sarah J.',
                program: 'Master Informatique, INSAT',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
              },
              {
                quote: "J'ai comparé plusieurs programmes côte à côte et trouvé celui qui correspondait parfaitement à mes objectifs professionnels.",
                author: 'Mohamed C.',
                program: 'Ingénieur Génie Civil, ENIT',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
              },
              {
                quote: "Le processus de candidature était simple et j'ai reçu ma réponse rapidement. Merci EduBridge !",
                author: 'Emma W.',
                program: 'Master Finance, IHEC',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="glass-card rounded-2xl p-8"
              >
                <p className="text-[var(--edu-text-primary)] mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-[var(--edu-text-primary)]">{testimonial.author}</p>
                    <p className="text-sm text-[var(--edu-text-secondary)]">{testimonial.program}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
