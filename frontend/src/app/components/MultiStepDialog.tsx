import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Stepper, Step } from './Stepper';
import { toast } from 'sonner';

interface MultiStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programTitle: string;
}

const steps: Step[] = [
  { label: 'Personal Info' },
  { label: 'Academic' },
  { label: 'Documents' },
  { label: 'Motivation' },
  { label: 'Review' },
];

export function MultiStepDialog({ open, onOpenChange, programTitle }: MultiStepDialogProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    gender: '',
    phone: '',
    address: '',
    currentEducation: '',
    institution: '',
    gpa: '',
    graduationYear: '',
    achievements: '',
    motivation: '',
    careerGoals: '',
  });

  const [uploadedDocs, setUploadedDocs] = React.useState({
    cv: false,
    transcripts: false,
    diploma: false,
    id: false,
    motivationLetter: false,
  });

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      toast.success('Progress saved');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    toast.success('Application submitted successfully!');
    onOpenChange(false);
    setCurrentStep(0);
  };

  const handleClose = () => {
    if (currentStep > 0) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
      if (confirmed) {
        onOpenChange(false);
        setCurrentStep(0);
      }
    } else {
      onOpenChange(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Info
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nationality">Nationality *</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => updateFormData('nationality', e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => updateFormData('gender', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                className="rounded-xl"
                rows={3}
              />
            </div>
          </div>
        );

      case 1: // Academic Background
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentEducation">Current/Previous Education Level *</Label>
              <Input
                id="currentEducation"
                value={formData.currentEducation}
                onChange={(e) => updateFormData('currentEducation', e.target.value)}
                placeholder="e.g., Bachelor's in Computer Science"
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="institution">Institution *</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => updateFormData('institution', e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gpa">GPA/Grade *</Label>
                <Input
                  id="gpa"
                  value={formData.gpa}
                  onChange={(e) => updateFormData('gpa', e.target.value)}
                  placeholder="e.g., 3.8/4.0"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label htmlFor="graduationYear">Graduation Year *</Label>
                <Input
                  id="graduationYear"
                  type="number"
                  value={formData.graduationYear}
                  onChange={(e) => updateFormData('graduationYear', e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="achievements">Achievements & Honors</Label>
              <Textarea
                id="achievements"
                value={formData.achievements}
                onChange={(e) => updateFormData('achievements', e.target.value)}
                placeholder="List any academic achievements, awards, publications, etc."
                className="rounded-xl"
                rows={4}
              />
            </div>
          </div>
        );

      case 2: // Documents
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--edu-text-secondary)] mb-4">
              Upload the required documents for your application. All files should be in PDF format.
            </p>

            {Object.entries({
              cv: 'Curriculum Vitae (CV)',
              transcripts: 'Academic Transcripts',
              diploma: 'Diploma/Degree Certificate',
              id: 'ID/Passport Copy',
              motivationLetter: 'Motivation Letter',
            }).map(([key, label]) => (
              <div
                key={key}
                className="border-2 border-dashed border-[var(--edu-border)] rounded-xl p-6 hover:border-[var(--edu-blue)] transition-colors cursor-pointer"
                onClick={() => setUploadedDocs((prev) => ({ ...prev, [key]: !prev[key as keyof typeof uploadedDocs] }))}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--edu-text-primary)]">{label}</p>
                    <p className="text-sm text-[var(--edu-text-secondary)]">
                      {uploadedDocs[key as keyof typeof uploadedDocs] ? 'Uploaded ✓' : 'Click to upload'}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      uploadedDocs[key as keyof typeof uploadedDocs]
                        ? 'bg-[var(--edu-success)] text-white'
                        : 'bg-[var(--edu-warning)] text-white'
                    }`}
                  >
                    {uploadedDocs[key as keyof typeof uploadedDocs] ? 'Uploaded' : 'Missing'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 3: // Motivation
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="motivation">Motivation Letter *</Label>
              <Textarea
                id="motivation"
                value={formData.motivation}
                onChange={(e) => updateFormData('motivation', e.target.value)}
                placeholder="Explain why you want to study this program..."
                className="rounded-xl"
                rows={8}
              />
            </div>

            <div>
              <Label htmlFor="careerGoals">Career Goals</Label>
              <Textarea
                id="careerGoals"
                value={formData.careerGoals}
                onChange={(e) => updateFormData('careerGoals', e.target.value)}
                placeholder="Describe your career aspirations..."
                className="rounded-xl"
                rows={6}
              />
            </div>
          </div>
        );

      case 4: // Review
        return (
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-4">
              <h4 className="font-semibold text-[var(--edu-text-primary)] mb-3">Personal Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">Full Name:</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">{formData.fullName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">Date of Birth:</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">{formData.dateOfBirth || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">Nationality:</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">{formData.nationality || '-'}</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4">
              <h4 className="font-semibold text-[var(--edu-text-primary)] mb-3">Academic Background</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">Education:</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">{formData.currentEducation || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">Institution:</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">{formData.institution || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--edu-text-secondary)]">GPA:</span>
                  <span className="text-[var(--edu-text-primary)] font-medium">{formData.gpa || '-'}</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4">
              <h4 className="font-semibold text-[var(--edu-text-primary)] mb-3">Documents</h4>
              <div className="space-y-2 text-sm">
                {Object.entries(uploadedDocs).map(([key, uploaded]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-[var(--edu-text-secondary)] capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className={uploaded ? 'text-[var(--edu-success)]' : 'text-[var(--edu-warning)]'}>
                      {uploaded ? '✓ Uploaded' : '✗ Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input type="checkbox" id="terms" className="mt-1" />
              <label htmlFor="terms" className="text-sm text-[var(--edu-text-secondary)]">
                I agree to the terms and conditions and confirm that all information provided is accurate.
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-0">
        <div className="sticky top-0 bg-white dark:bg-[#1D1D1F] z-10 p-6 border-b border-[var(--edu-border)]">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 hover:bg-[var(--edu-surface)] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <DialogTitle className="text-2xl font-bold text-[var(--edu-text-primary)] mb-2">Apply to Program</DialogTitle>
          <DialogDescription className="text-sm text-[var(--edu-text-secondary)] mb-6">{programTitle}</DialogDescription>

          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        <div className="p-6">
          {renderStepContent()}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-[#1D1D1F] p-6 border-t border-[var(--edu-border)] flex items-center justify-between">
          <Button variant="ghost" onClick={() => toast.success('Draft saved')} className="text-[var(--edu-text-secondary)]">
            Save as draft
          </Button>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious} className="rounded-full">
                Previous
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white">
                Submit Application
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}