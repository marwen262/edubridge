import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { MapPin, Globe, Star, CheckCircle, Mail, Phone } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProgramCard } from '../components/ProgramCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useInstitut } from '@/hooks/useInstitut';
import { usePrograms } from '@/hooks/usePrograms';
import { motion } from 'motion/react';

function getInitials(nom: string): string {
  return nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

export function InstitutionProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { institut, loading, error } = useInstitut(slug);

  console.log('institut:', institut);

  const { programs: programmes } = usePrograms(
    institut ? { institut_id: institut.id } : undefined,
  );

  const [logoError, setLogoError] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-t-2 border-[var(--edu-blue)] animate-spin" />
      </div>
    );
  }

  if (error || !institut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--edu-danger)]">{error ?? 'Institution introuvable'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-[var(--edu-blue)] text-white rounded-lg"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const coverSrc = institut.image_couverture ?? institut.logo;
  const localisation = [institut.adresse?.ville, institut.adresse?.gouvernorat]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      {/* Bannière */}
      <div className="relative h-[260px] sm:h-[360px] overflow-hidden">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={institut.nom}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full hero-gradient" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
      </div>

      {/* Carte hero — chevauchement bannière */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 -mt-20 sm:-mt-28 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card rounded-3xl p-5 sm:p-8"
        >
          {/* Ligne 1 : logo + nom / localisation */}
          <div className="flex items-start gap-5 mb-6">
            {/* Logo 80×80 — fallback initiales */}
            {institut.logo && !logoError ? (
              <img
                src={institut.logo}
                alt={institut.nom}
                className="w-20 h-20 rounded-xl object-cover shadow-md flex-shrink-0"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-xl shadow-md flex items-center justify-center flex-shrink-0 font-bold text-white text-2xl"
                style={{ backgroundColor: 'var(--edu-blue)' }}
              >
                {getInitials(institut.nom)}
              </div>
            )}

            {/* Nom + sigle + badge + localisation */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--edu-text-primary)] leading-tight">
                  {institut.nom}
                </h1>
                {institut.sigle && (
                  <span className="text-base font-medium text-[var(--edu-text-secondary)]">
                    ({institut.sigle})
                  </span>
                )}
                {institut.est_verifie && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--edu-blue)] text-white">
                    <CheckCircle className="w-3 h-3" />
                    Vérifié
                  </span>
                )}
              </div>
              {localisation && (
                <div className="flex items-center gap-1.5 text-[var(--edu-text-secondary)] text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{localisation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ligne 2 : 3 stat cards */}
          <div className="flex gap-3 flex-wrap mb-6">
            {/* Note */}
            {institut.note != null && (
              <div
                className="flex flex-col items-center text-center rounded-xl px-6 py-4"
                style={{ background: 'var(--edu-surface)' }}
              >
                <div className="flex items-center gap-1" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--edu-blue)' }}>
                  <Star className="w-6 h-6 fill-[var(--edu-accent)] text-[var(--edu-accent)]" />
                  <span>{institut.note}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--edu-text-secondary)', marginTop: 4 }}>
                  Note
                </p>
              </div>
            )}

            {/* Programmes */}
            <div
              className="flex flex-col items-center text-center rounded-xl px-6 py-4"
              style={{ background: 'var(--edu-surface)' }}
            >
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--edu-blue)' }}>
                {programmes.length}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--edu-text-secondary)', marginTop: 4 }}>
                Programmes
              </p>
            </div>

            {/* Accréditations */}
            <div
              className="flex flex-col items-center text-center rounded-xl px-6 py-4"
              style={{ background: 'var(--edu-surface)' }}
            >
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--edu-blue)' }}>
                {institut.accreditations?.length ?? 0}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--edu-text-secondary)', marginTop: 4 }}>
                Accréditations
              </p>
            </div>
          </div>

          {/* Ligne 3 : bouton site web */}
          {institut.site_web && (
            <a href={institut.site_web} target="_blank" rel="noopener noreferrer">
              <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                <Globe className="w-4 h-4 mr-2" />
                Visiter le site
              </Button>
            </a>
          )}
        </motion.div>
      </div>

      {/* Sections verticales */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* À propos */}
        {institut.description && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="glass-card rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-bold text-[var(--edu-text-primary)] mb-4">
              À propos
            </h2>
            <p className="text-[var(--edu-text-secondary)] leading-relaxed">
              {institut.description}
            </p>
          </motion.section>
        )}

        {/* Accréditations */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.13 }}
          className="glass-card rounded-2xl p-6 sm:p-8"
        >
          <h2 className="text-xl font-bold text-[var(--edu-text-primary)] mb-4">
            Accréditations
          </h2>
          {institut.accreditations && institut.accreditations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {institut.accreditations.map((acc) => (
                <Badge
                  key={acc}
                  variant="secondary"
                  className="rounded-full px-3 py-1 text-sm font-medium"
                >
                  {acc}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-[var(--edu-text-secondary)] text-sm">
              Aucune accréditation renseignée.
            </p>
          )}
        </motion.section>

        {/* Contact */}
        {(institut.contact?.email || institut.contact?.telephone) && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18 }}
            className="glass-card rounded-2xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-bold text-[var(--edu-text-primary)] mb-4">
              Contact
            </h2>
            <div className="space-y-3">
              {institut.contact.email && (
                <div className="flex items-center gap-3 text-[var(--edu-text-secondary)]">
                  <Mail className="w-4 h-4 flex-shrink-0 text-[var(--edu-blue)]" />
                  <a
                    href={`mailto:${institut.contact.email}`}
                    className="hover:text-[var(--edu-blue)] transition-colors"
                  >
                    {institut.contact.email}
                  </a>
                </div>
              )}
              {institut.contact.telephone && (
                <div className="flex items-center gap-3 text-[var(--edu-text-secondary)]">
                  <Phone className="w-4 h-4 flex-shrink-0 text-[var(--edu-blue)]" />
                  <a
                    href={`tel:${institut.contact.telephone}`}
                    className="hover:text-[var(--edu-blue)] transition-colors"
                  >
                    {institut.contact.telephone}
                  </a>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Programmes disponibles */}
        <section>
          <h2 className="text-xl font-bold text-[var(--edu-text-primary)] mb-5">
            {programmes.length > 0
              ? `${programmes.length} programme${programmes.length !== 1 ? 's' : ''} disponible${programmes.length !== 1 ? 's' : ''}`
              : 'Programmes'}
          </h2>
          {programmes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {programmes.map((programme) => (
                <ProgramCard key={programme.id} programme={programme} view="grid" />
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-[var(--edu-text-secondary)]">
                Aucun programme disponible pour le moment.
              </p>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
