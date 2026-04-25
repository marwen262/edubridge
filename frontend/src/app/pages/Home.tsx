import React from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, ChevronRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProgramCard } from '../components/ProgramCard';
import { InstitutionCard } from '../components/InstitutionCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { fields } from '../data/staticData';
import { usePrograms } from '@/hooks/usePrograms';
import { useInstituts } from '@/hooks/useInstituts';
import type { Institut } from '@/types/api';
import { motion } from 'motion/react';

export function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchCountry, setSearchCountry] = React.useState('');

  const { programs } = usePrograms({ est_actif: true });
  const { instituts: institutsRaw } = useInstituts();
  const instituts = institutsRaw as Institut[];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/search');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1D1D1F]">
      <Navbar transparent />

      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&h=800&fit=crop"
            alt="Campus"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-[1440px] mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              Find your path to the<br />right institution
            </h1>

            <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
              Discover programs, compare institutions, and manage your admissions — all in one place.
            </p>

            {/* Mega Search Bar */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="glass-card rounded-full p-2 flex items-center gap-2">
                <div className="flex-1 px-4">
                  <input
                    type="text"
                    placeholder="Program or field"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)]"
                  />
                </div>

                <div className="w-px h-8 bg-[var(--edu-border)]" />

                <div className="flex-1 px-4">
                  <input
                    type="text"
                    placeholder="Country / City"
                    value={searchCountry}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[var(--edu-text-primary)] placeholder:text-[var(--edu-text-tertiary)]"
                  />
                </div>

                <Button
                  type="submit"
                  className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white px-8 h-12"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
            </form>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {['Licence', 'Master', 'Ingénieur', 'Cours du soir', 'En ligne'].map((filter) => (
                <Badge
                  key={filter}
                  variant="secondary"
                  className="rounded-full bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 cursor-pointer px-4 py-2"
                >
                  {filter}
                </Badge>
              ))}
            </div>
          </motion.div>
        </div>
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
                    <div className="text-5xl mb-3">{field.icon}</div>
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
