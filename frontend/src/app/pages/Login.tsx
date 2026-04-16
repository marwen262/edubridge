import React from 'react';
import { Link, useNavigate } from 'react-router';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export function Login() {
  const navigate = useNavigate();
  const [role, setRole] = React.useState<'candidate' | 'institution' | 'admin'>('candidate');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Mock login logic
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    toast.success('Login successful!');

    // Redirect based on role
    if (role === 'candidate') {
      navigate('/dashboard/candidate');
    } else if (role === 'institution') {
      // Check if first login (mock check)
      const isFirstLogin = password === 'temp123';
      if (isFirstLogin) {
        navigate('/first-login');
      } else {
        navigate('/dashboard/institution');
      }
    } else if (role === 'admin') {
      navigate('/dashboard/admin');
    }
  };

  const handleGoogleSignIn = () => {
    toast.info('Google Sign-In would be configured here');
  };

  return (
    <div className="min-h-screen dotted-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <GraduationCap className="w-10 h-10 text-[var(--edu-blue)]" />
          <span className="text-2xl font-bold text-[var(--edu-text-primary)]">EduBridge</span>
        </Link>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-2 text-center">Welcome back</h1>
          <p className="text-[var(--edu-text-secondary)] text-center mb-8">
            Sign in to your account to continue
          </p>

          {/* Role Selector */}
          <Tabs value={role} onValueChange={(v) => setRole(v as typeof role)} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 rounded-full p-1 bg-[var(--edu-surface)]">
              <TabsTrigger value="candidate" className="rounded-full">
                Candidate
              </TabsTrigger>
              <TabsTrigger value="institution" className="rounded-full">
                Institution
              </TabsTrigger>
              <TabsTrigger value="admin" className="rounded-full">
                Admin
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm text-[var(--edu-blue)] hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 font-medium"
            >
              Sign in
            </Button>
          </form>

          {/* Google Sign In (only for candidates) */}
          {role === 'candidate' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--edu-border)]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-[#1D1D1F] text-[var(--edu-text-secondary)]">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full rounded-full h-12 font-medium"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          {/* Sign Up Link (only for candidates) */}
          {role === 'candidate' && (
            <p className="text-center text-sm text-[var(--edu-text-secondary)] mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[var(--edu-blue)] hover:underline font-medium">
                Sign up
              </Link>
            </p>
          )}

          {/* Institution note */}
          {role === 'institution' && (
            <p className="text-center text-xs text-[var(--edu-text-secondary)] mt-6 p-4 bg-[var(--edu-surface)] rounded-xl">
              <strong>Note:</strong> If this is your first login, you'll be prompted to change your temporary password.
            </p>
          )}
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
