import React from 'react';
import { Link } from 'react-router';
import { X, Plus } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { mockPrograms } from '../data/mockData';
import { motion } from 'motion/react';

export function Compare() {
  const [selectedPrograms, setSelectedPrograms] = React.useState(mockPrograms.slice(0, 3));

  const comparisonRows = [
    { label: 'Program Title', getValue: (p: typeof mockPrograms[0]) => p.title },
    { label: 'Institution', getValue: (p: typeof mockPrograms[0]) => p.institution.name },
    { label: 'Country', getValue: (p: typeof mockPrograms[0]) => p.institution.country },
    { label: 'Level', getValue: (p: typeof mockPrograms[0]) => p.level },
    { label: 'Duration', getValue: (p: typeof mockPrograms[0]) => p.duration },
    { label: 'Language', getValue: (p: typeof mockPrograms[0]) => p.language },
    { label: 'Mode', getValue: (p: typeof mockPrograms[0]) => p.mode },
    { label: 'Tuition', getValue: (p: typeof mockPrograms[0]) => `$${p.tuition.toLocaleString()}` },
    { label: 'Deadline', getValue: (p: typeof mockPrograms[0]) => new Date(p.deadline).toLocaleDateString() },
    { label: 'Rating', getValue: (p: typeof mockPrograms[0]) => `★ ${p.rating}` },
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
            <h1 className="text-4xl font-bold text-[var(--edu-text-primary)] mb-4">Compare Programs</h1>
            <p className="text-lg text-[var(--edu-text-secondary)]">
              Side-by-side comparison to help you make the right decision
            </p>
          </div>

          {/* Comparison Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--edu-surface)]">
                    <th className="sticky left-0 bg-[var(--edu-surface)] px-6 py-4 text-left font-semibold text-[var(--edu-text-primary)] min-w-[200px]">
                      Criteria
                    </th>
                    {selectedPrograms.map((program, i) => (
                      <th key={program.id} className="px-6 py-4 min-w-[280px]">
                        <div className="space-y-4">
                          <div className="relative">
                            <img
                              src={program.cover}
                              alt={program.title}
                              className="w-full h-32 object-cover rounded-xl"
                            />
                            <button
                              onClick={() => setSelectedPrograms(selectedPrograms.filter((_, idx) => idx !== i))}
                              className="absolute top-2 right-2 p-1.5 bg-white dark:bg-[#1D1D1F] rounded-full hover:bg-[var(--edu-danger)] hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <img
                              src={program.institution.logo}
                              alt={program.institution.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="text-left flex-1 min-w-0">
                              <p className="font-semibold text-[var(--edu-text-primary)] text-sm line-clamp-2">
                                {program.title}
                              </p>
                            </div>
                          </div>
                          <Link to={`/program/${program.id}`}>
                            <Button size="sm" className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </th>
                    ))}
                    {selectedPrograms.length < 3 && (
                      <th className="px-6 py-4 min-w-[280px]">
                        <Link to="/search">
                          <div className="h-full flex flex-col items-center justify-center gap-4 py-8 border-2 border-dashed border-[var(--edu-border)] rounded-2xl hover:border-[var(--edu-blue)] transition-colors cursor-pointer">
                            <div className="w-16 h-16 rounded-full bg-[var(--edu-surface)] flex items-center justify-center">
                              <Plus className="w-8 h-8 text-[var(--edu-text-tertiary)]" />
                            </div>
                            <p className="text-sm text-[var(--edu-text-secondary)]">Add program</p>
                          </div>
                        </Link>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--edu-divider)]">
                  {comparisonRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-[var(--edu-surface)]/50' : ''}>
                      <td className="sticky left-0 bg-inherit px-6 py-4 font-semibold text-[var(--edu-text-primary)]">
                        {row.label}
                      </td>
                      {selectedPrograms.map((program) => (
                        <td key={program.id} className="px-6 py-4 text-[var(--edu-text-secondary)]">
                          {row.getValue(program)}
                        </td>
                      ))}
                      {selectedPrograms.length < 3 && <td className="px-6 py-4"></td>}
                    </tr>
                  ))}

                  {/* Requirements Row */}
                  <tr>
                    <td className="sticky left-0 bg-[var(--edu-surface)]/50 px-6 py-4 font-semibold text-[var(--edu-text-primary)]">
                      Requirements
                    </td>
                    {selectedPrograms.map((program) => (
                      <td key={program.id} className="px-6 py-4">
                        <ul className="space-y-1 text-sm text-[var(--edu-text-secondary)]">
                          {program.requirements.slice(0, 3).map((req, i) => (
                            <li key={i} className="line-clamp-1">• {req}</li>
                          ))}
                          {program.requirements.length > 3 && (
                            <li className="text-[var(--edu-blue)]">+{program.requirements.length - 3} more</li>
                          )}
                        </ul>
                      </td>
                    ))}
                    {selectedPrograms.length < 3 && <td className="px-6 py-4"></td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link to="/search">
              <Button variant="outline" className="rounded-full">
                Browse more programs
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
