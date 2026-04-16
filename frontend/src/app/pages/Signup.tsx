import React from 'react';
import { Link, useNavigate } from 'react-router';
import { GraduationCap, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';

export function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    educationLevel: '',
    fieldOfInterest: '',
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return 0;
    if (password.length < 8) return 1;
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return 2;
    if (!/[!@#$%^&*]/.test(password)) return 3;
    return 4;
  };

  const passwordStrength = getPasswordStrength();
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#FF3B30', '#FF9F0A', '#64D2FF', '#30D158'];

  const passwordChecks = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { label: 'Contains number', met: /[0-9]/.test(formData.password) },
    { label: 'Contains special character', met: /[!@#$%^&*]/.test(formData.password) },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordStrength < 3) {
      toast.error('Please choose a stronger password');
      return;
    }

    if (!termsAccepted) {
      toast.error('Please accept the terms and privacy policy');
      return;
    }

    toast.success('Account created successfully!');
    navigate('/dashboard/candidate');
  };

  return (
    <div className="min-h-screen dotted-bg flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <GraduationCap className="w-10 h-10 text-[var(--edu-blue)]" />
          <span className="text-2xl font-bold text-[var(--edu-text-primary)]">EduBridge</span>
        </Link>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-2 text-center">
            Create your candidate account
          </h1>
          <p className="text-[var(--edu-text-secondary)] text-center mb-8">
            Start your journey to find the perfect program
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-primary)]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Strength Bar */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-[var(--edu-surface)] rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength / 4) * 100}%`,
                          backgroundColor: strengthColors[passwordStrength],
                        }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: strengthColors[passwordStrength] }}>
                      {strengthLabels[passwordStrength]}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--edu-text-tertiary)] hover:text-[var(--edu-text-primary)]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="bg-[var(--edu-surface)] rounded-xl p-4">
                <p className="text-sm font-medium text-[var(--edu-text-primary)] mb-2">Password Requirements:</p>
                <div className="grid grid-cols-2 gap-2">
                  {passwordChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {check.met ? (
                        <Check className="w-4 h-4 text-[var(--edu-success)]" />
                      ) : (
                        <X className="w-4 h-4 text-[var(--edu-text-tertiary)]" />
                      )}
                      <span className={check.met ? 'text-[var(--edu-success)]' : 'text-[var(--edu-text-secondary)]'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="Your country"
                  value={formData.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="rounded-xl mt-1"
                />
              </div>

              <div>
                <Label htmlFor="educationLevel">Current Education Level</Label>
                <select
                  id="educationLevel"
                  value={formData.educationLevel}
                  onChange={(e) => updateField('educationLevel', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background mt-1"
                >
                  <option value="">Select level</option>
                  <option value="high-school">High School</option>
                  <option value="bachelor">Bachelor's</option>
                  <option value="master">Master's</option>
                  <option value="phd">PhD</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="fieldOfInterest">Field of Interest</Label>
              <Input
                id="fieldOfInterest"
                type="text"
                placeholder="e.g., Computer Science, Business, Medicine"
                value={formData.fieldOfInterest}
                onChange={(e) => updateField('fieldOfInterest', e.target.value)}
                className="rounded-xl mt-1"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-[var(--edu-text-secondary)] cursor-pointer">
                I agree to the{' '}
                <a href="#" className="text-[var(--edu-blue)] hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[var(--edu-blue)] hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 font-medium"
            >
              Create account
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-[var(--edu-text-secondary)] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--edu-blue)] hover:underline font-medium">
              Sign in
            </Link>
          </p>

          {/* Institution Note */}
          <div className="mt-6 p-4 bg-[var(--edu-surface)] rounded-xl">
            <p className="text-xs text-[var(--edu-text-secondary)] text-center">
              <strong>You are an institution?</strong> Contact the EduBridge admin to request an account.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-[var(--edu-text-secondary)] hover:text-[var(--edu-blue)]">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
