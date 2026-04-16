import React from 'react';
import { Link } from 'react-router';
import { Heart, MapPin, Calendar, Clock, Globe } from 'lucide-react';
import { Program } from '../data/mockData';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface ProgramCardProps {
  program: Program;
  view?: 'grid' | 'list';
}

export function ProgramCard({ program, view = 'grid' }: ProgramCardProps) {
  const [saved, setSaved] = React.useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    setSaved(!saved);
  };

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to={`/program/${program.id}`}>
          <div className="glass-card rounded-2xl p-6 hover-lift cursor-pointer">
            <div className="flex gap-6">
              {/* Institution Logo */}
              <div className="flex-shrink-0">
                <img
                  src={program.institution.logo}
                  alt={program.institution.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-[var(--edu-text-primary)] mb-2 line-clamp-1">
                  {program.title}
                </h3>

                <div className="flex items-center gap-2 text-[var(--edu-text-secondary)] text-sm mb-3">
                  <span className="font-medium">{program.institution.name}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {program.institution.city}, {program.institution.country}
                    </span>
                  </div>
                </div>

                <p className="text-[var(--edu-text-secondary)] text-sm mb-4 line-clamp-2">
                  {program.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {program.field}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {program.mode}
                  </Badge>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--edu-text-secondary)]">
                  <span className="font-semibold">{program.level}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{program.duration}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>{program.language}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-[var(--edu-warning)]">
                    <Calendar className="w-3 h-3" />
                    <span>Deadline: {new Date(program.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                <div className="flex items-center gap-1 text-[var(--edu-accent)] mb-2">
                  <span className="text-2xl">★</span>
                  <span className="text-lg font-semibold">{program.rating}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className={`p-2 rounded-full hover:bg-[var(--edu-surface)] transition-colors ${
                      saved ? 'heart-bounce' : ''
                    }`}
                    aria-label="Save program"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        saved ? 'fill-[var(--edu-accent)] text-[var(--edu-accent)]' : 'text-[var(--edu-text-secondary)]'
                      }`}
                    />
                  </button>

                  <Button className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                    View details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/program/${program.id}`}>
        <div className="glass-card rounded-2xl overflow-hidden hover-lift cursor-pointer">
          {/* Cover Image */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={program.cover}
              alt={program.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={handleSave}
              className={`absolute top-4 right-4 p-2 glass-card rounded-full ${
                saved ? 'heart-bounce' : ''
              }`}
              aria-label="Save program"
            >
              <Heart
                className={`w-5 h-5 ${
                  saved ? 'fill-[var(--edu-accent)] text-[var(--edu-accent)]' : 'text-white'
                }`}
              />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-3 mb-3">
              <img
                src={program.institution.logo}
                alt={program.institution.name}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-[var(--edu-text-primary)] mb-1 line-clamp-2">
                  {program.title}
                </h3>
                <p className="text-sm text-[var(--edu-text-secondary)] line-clamp-1">
                  {program.institution.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[var(--edu-text-secondary)] text-sm mb-4">
              <MapPin className="w-4 h-4" />
              <span>
                {program.institution.city}, {program.institution.country}
              </span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary" className="rounded-full text-xs">
                {program.level}
              </Badge>
              <div className="flex items-center gap-1 text-[var(--edu-accent)]">
                <span className="text-lg">★</span>
                <span className="text-sm font-semibold">{program.rating}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[var(--edu-text-secondary)]">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{program.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3" />
                <span>{program.language}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--edu-warning)]">
                <Calendar className="w-3 h-3" />
                <span>Deadline: {new Date(program.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
