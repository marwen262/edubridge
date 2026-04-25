import React from 'react';
import { Link, useNavigate } from 'react-router';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      // persisterAuth() a mis à jour localStorage de façon synchrone
      const stored = localStorage.getItem('auth_user');
      const savedUser = stored ? (JSON.parse(stored) as { role: string }) : null;
      const userRole = savedUser?.role;

      if (userRole === 'candidat') {
        navigate('/dashboard/candidate');
      } else if (userRole === 'institut') {
        navigate('/dashboard/institution');
      } else if (userRole === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message ?? 'Identifiants incorrects');
    }
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
          <h1 className="text-3xl font-bold text-[var(--edu-text-primary)] mb-2 text-center">
            Welcome back
          </h1>
          <p className="text-[var(--edu-text-secondary)] text-center mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className="rounded-xl mt-1"
              />
              {errors.email && (
                <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
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
              {errors.password && (
                <p className="text-xs text-[var(--edu-danger)] mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm text-[var(--edu-blue)] hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-[var(--edu-blue)] hover:bg-[var(--edu-blue-hover)] text-white h-12 font-medium disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--edu-text-secondary)] mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[var(--edu-blue)] hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-[var(--edu-text-secondary)] hover:text-[var(--edu-blue)]">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
