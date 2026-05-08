import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  { key: 'genie_civil', label: 'Génie Civil' },
  { key: 'electrique', label: 'Génie Électrique' },
  { key: 'mecanique', label: 'Génie Mécanique' },
  { key: 'chimie', label: 'Chimie' },
  { key: 'agronomie', label: 'Agronomie' },
  { key: 'finance', label: 'Finance' },
  { key: 'management', label: 'Management' },
];

export function Home() {
  const { t } = useTranslation();
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

  const stats = [
    { value: '5 000+',  labelKey: 'home.stats.programs' },
    { value: '800+',    labelKey: 'home.stats.institutions' },
    { value: '150+',    labelKey: 'home.stats.fields' },
    { value: '50 000+', labelKey: 'home.stats.students' },
  ];

  const aboutCards = [
    { icon: t('home.about.mission.icon'),  title: t('home.about.mission.title'),  text: t('home.about.mission.text') },
    { icon: t('home.about.partners.icon'), title: t('home.about.partners.title'), text: t('home.about.partners.text') },
    { icon: t('home.about.privacy.icon'),  title: t('home.about.privacy.title'),  text: t('home.about.privacy.text') },
  ];

  const howItWorksSteps = (
    t('home.howItWorks.steps', { returnObjects: true }) as {
      title: string; description: string; icon: string;
    }[]
  ).map((step, i) => ({ ...step, step: String(i + 1).padStart(2, '0') }));

  return (
    <div className="min-h-screen bg-white dark:bg-[#1D1D1F]">
      <Navbar transparent />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1562774053-701939374585?w=1600&h=900&fit=crop&q=85')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,10,60,0.72) 0%, rgba(0,40,80,0.55) 50%, rgba(0,80,40,0.45) 100%)' }} />
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.10 }} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 900">
          <line x1="200" y1="150" x2="500" y2="400" stroke="white" strokeWidth="1" />
          <line x1="500" y1="400" x2="900" y2="200" stroke="white" strokeWidth="1" />
          <line x1="900" y1="200" x2="1200" y2="500" stroke="white" strokeWidth="1" />
          <line x1="1200" y1="500" x2="800" y2="700" stroke="white" strokeWidth="1" />
          <line x1="800" y1="700" x2="400" y2="600" stroke="white" strokeWidth="1" />
          <line x1="400" y1="600" x2="200" y2="150" stroke="white" strokeWidth="1" />
          <line x1="500" y1="400" x2="800" y2="700" stroke="white" strokeWidth="1" />
          <line x1="900" y1="200" x2="400" y2="600" stroke="white" strokeWidth="1" />
          <circle cx="200" cy="150" r="4" fill="white" />
          <circle cx="500" cy="400" r="4" fill="white" />
          <circle cx="900" cy="200" r="4" fill="white" />
          <circle cx="1200" cy="500" r="4" fill="white" />
          <circle cx="800" cy="700" r="4" fill="white" />
          <circle cx="400" cy="600" r="4" fill="white" />
        </svg>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            {t('home.hero.title').split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </h1>
          <p className="text-xl text-white/75 max-w-xl mx-auto">{t('home.hero.subtitle')}</p>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-b border-[var(--edu-border)]">
        <div className="max-w-[1440px] mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.labelKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-[var(--edu-blue)] mb-2">{stat.value}</p>
                <p className="text-[var(--edu-text-secondary)]">{t(stat.labelKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-[var(--edu-surface)]">
        <div className="max-w-[1440px] mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-14">
            <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-4">{t('home.about.title')}</h2>
            <p className="text-[var(--edu-text-secondary)] text-lg">{t('home.about.subtitle')}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="glass-card rounded-3xl p-10 mb-10">
            <p className="text-base text-[var(--edu-text-primary)] leading-relaxed mb-6">{t('home.about.description1')}</p>
            <p className="text-sm text-[var(--edu-text-secondary)] leading-relaxed">{t('home.about.description2')}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aboutCards.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }} className="glass-card rounded-2xl p-6 text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-[var(--edu-text-primary)] mb-3">{item.title}</h3>
                <p className="text-sm text-[var(--edu-text-secondary)] leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fields */}
      <section className="py-16 bg-white dark:bg-[#1D1D1F]">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-4">{t('home.fields.title')}</h2>
            <p className="text-[var(--edu-text-secondary)] text-lg">{t('home.fields.subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {domaines.map((domaine, i) => (
              <motion.div key={domaine.key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
                <Link to="/search">
                  <div className="glass-card rounded-2xl p-6 hover-lift cursor-pointer text-center">
                    <h3 className="font-semibold text-[var(--edu-text-primary)] mb-2">{domaine.label}</h3>
                    <p className="text-sm text-[var(--edu-text-secondary)]">{counts[domaine.key] ?? '...'} {t('home.fields.programs')}</p>
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
              <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-2">{t('home.featuredPrograms.title')}</h2>
              <p className="text-[var(--edu-text-secondary)] text-lg">{t('home.featuredPrograms.subtitle')}</p>
            </div>
            <Link to="/search">
              <Button variant="ghost" className="text-[var(--edu-blue)]">
                {t('home.featuredPrograms.seeAll')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {programs.slice(0, 6).map((programme, i) => (
                <motion.div key={programme.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.4 }}>
                  <ProgramCard programme={programme} view="grid" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--edu-text-secondary)]">
              <Link to="/search">
                <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                  {t('home.featuredPrograms.browse')}
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
              <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-2">{t('home.topInstitutions.title')}</h2>
              <p className="text-[var(--edu-text-secondary)] text-lg">{t('home.topInstitutions.subtitle')}</p>
            </div>
            <Link to="/search">
              <Button variant="ghost" className="text-[var(--edu-blue)]">
                {t('home.topInstitutions.seeAll')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {institusLoading ? (
            <p className="text-center text-[var(--edu-text-secondary)] py-8">{t('home.topInstitutions.loading')}</p>
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
            <h2 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-4">{t('home.howItWorks.title')}</h2>
            <p className="text-[var(--edu-text-secondary)] text-lg">{t('home.howItWorks.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorksSteps.map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2, duration: 0.5 }} className="text-center">
                <div className="text-6xl mb-6">{item.icon}</div>
                <div className="text-sm font-bold text-[var(--edu-blue)] mb-2">{t('home.howItWorks.step')} {item.step}</div>
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
