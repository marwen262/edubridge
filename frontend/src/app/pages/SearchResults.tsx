import React from 'react';
import { Search, Grid, List, SlidersHorizontal } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProgramCard } from '../components/ProgramCard';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';
import { Slider } from '../components/ui/slider';
import { mockPrograms, fields, countries } from '../data/mockData';

export function SearchResults() {
  const [view, setView] = React.useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFields, setSelectedFields] = React.useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = React.useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([]);
  const [tuitionRange, setTuitionRange] = React.useState([0, 100000]);

  const filteredPrograms = mockPrograms.filter((program) => {
    const matchesSearch = !searchQuery || program.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesField = selectedFields.length === 0 || selectedFields.includes(program.field);
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(program.level);
    const matchesCountry = selectedCountries.length === 0 || selectedCountries.includes(program.institution.country);
    const matchesTuition = program.tuition >= tuitionRange[0] && program.tuition <= tuitionRange[1];

    return matchesSearch && matchesField && matchesLevel && matchesCountry && matchesTuition;
  });

  const toggleField = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
  };

  const clearFilters = () => {
    setSelectedFields([]);
    setSelectedLevels([]);
    setSelectedCountries([]);
    setTuitionRange([0, 100000]);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[var(--edu-surface)]">
      <Navbar />

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#1D1D1F] border-b border-[var(--edu-border)] sticky top-[73px] z-40">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--edu-text-tertiary)]" />
              <Input
                type="text"
                placeholder="Search programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 rounded-xl h-12"
              />
            </div>

            <select className="px-4 py-2 rounded-xl border border-input bg-background h-12 min-w-[180px]">
              <option>Relevance</option>
              <option>Deadline</option>
              <option>Newest</option>
              <option>Tuition (Low to High)</option>
              <option>Tuition (High to Low)</option>
            </select>

            <div className="flex items-center gap-2 border border-input rounded-xl p-1">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'list' ? 'bg-[var(--edu-blue)] text-white' : 'text-[var(--edu-text-secondary)]'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'grid' ? 'bg-[var(--edu-blue)] text-white' : 'text-[var(--edu-text-secondary)]'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="w-[280px] flex-shrink-0 sticky top-[145px] self-start">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-[var(--edu-text-primary)] flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filters
                </h3>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  Clear all
                </Button>
              </div>

              {/* Field of Study */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">Field of Study</h4>
                <div className="space-y-3">
                  {fields.map((field) => (
                    <div key={field.name} className="flex items-center gap-2">
                      <Checkbox
                        id={field.name}
                        checked={selectedFields.includes(field.name)}
                        onCheckedChange={() => toggleField(field.name)}
                      />
                      <label
                        htmlFor={field.name}
                        className="text-sm text-[var(--edu-text-secondary)] cursor-pointer flex-1"
                      >
                        {field.name}
                      </label>
                      <span className="text-xs text-[var(--edu-text-tertiary)]">{field.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--edu-divider)] my-6" />

              {/* Degree Level */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">Degree Level</h4>
                <div className="space-y-3">
                  {['Bachelor', 'Master', 'PhD', 'Certificate'].map((level) => (
                    <div key={level} className="flex items-center gap-2">
                      <Checkbox
                        id={level}
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={() => toggleLevel(level)}
                      />
                      <label htmlFor={level} className="text-sm text-[var(--edu-text-secondary)] cursor-pointer">
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--edu-divider)] my-6" />

              {/* Country */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">Country</h4>
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {countries.slice(0, 6).map((country) => (
                    <div key={country} className="flex items-center gap-2">
                      <Checkbox
                        id={country}
                        checked={selectedCountries.includes(country)}
                        onCheckedChange={() => toggleCountry(country)}
                      />
                      <label htmlFor={country} className="text-sm text-[var(--edu-text-secondary)] cursor-pointer">
                        {country}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--edu-divider)] my-6" />

              {/* Delivery Mode */}
              <div className="mb-6">
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">Delivery Mode</h4>
                <div className="space-y-3">
                  {['On-campus', 'Online', 'Hybrid'].map((mode) => (
                    <div key={mode} className="flex items-center gap-2">
                      <Checkbox id={mode} />
                      <label htmlFor={mode} className="text-sm text-[var(--edu-text-secondary)] cursor-pointer">
                        {mode}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[var(--edu-divider)] my-6" />

              {/* Tuition Range */}
              <div>
                <h4 className="font-semibold text-sm text-[var(--edu-text-primary)] mb-3">Tuition Range</h4>
                <div className="space-y-4">
                  <Slider
                    min={0}
                    max={100000}
                    step={1000}
                    value={tuitionRange}
                    onValueChange={setTuitionRange}
                    className="mb-2"
                  />
                  <div className="flex items-center justify-between text-xs text-[var(--edu-text-secondary)]">
                    <span>${tuitionRange[0].toLocaleString()}</span>
                    <span>${tuitionRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">
                {filteredPrograms.length} Programs Found
              </h2>
              <p className="text-[var(--edu-text-secondary)]">
                {selectedFields.length > 0 && (
                  <span>in {selectedFields.join(', ')} </span>
                )}
                {selectedCountries.length > 0 && (
                  <span>from {selectedCountries.join(', ')}</span>
                )}
              </p>
            </div>

            {filteredPrograms.length > 0 ? (
              <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredPrograms.map((program) => (
                  <ProgramCard key={program.id} program={program} view={view} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No programs found"
                description="Try adjusting your filters or search criteria to find more programs."
                actionLabel="Clear filters"
                onAction={clearFilters}
              />
            )}

            {/* Pagination */}
            {filteredPrograms.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button variant="outline" disabled className="rounded-full">
                  Previous
                </Button>
                {[1, 2, 3, 4, 5].map((page) => (
                  <Button
                    key={page}
                    variant={page === 1 ? 'default' : 'outline'}
                    className={`rounded-full w-10 h-10 p-0 ${
                      page === 1 ? 'bg-[var(--edu-blue)] text-white' : ''
                    }`}
                  >
                    {page}
                  </Button>
                ))}
                <Button variant="outline" className="rounded-full">
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
