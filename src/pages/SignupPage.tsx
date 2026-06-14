import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield, TrendingUp, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';
import { Interactive3DTiltCard } from '../components/ui/Interactive3DTiltCard';
import { InteractiveMeshBackground } from '../components/ui/InteractiveMeshBackground';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number and special character'),
  confirmPassword: z.string(),
  organization: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { user, register: signup, loginWithGoogle, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const password = watch('password');

  if (user) {
    return <Navigate to="/upload" replace />;
  }

  const onSubmit = async (data: SignupFormData) => {
    const success = await signup({
      email: data.email,
      password: data.password,
      name: data.name,
      organization: data.organization,
    });
    if (success) {
      navigate('/upload');
    }
  };

  const handleGoogleSignup = () => {
    loginWithGoogle();
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    
    if (score < 3) return { strength: 'weak', color: 'bg-red-500', text: 'Weak' };
    if (score < 5) return { strength: 'medium', color: 'bg-yellow-500', text: 'Medium' };
    return { strength: 'strong', color: 'bg-green-500', text: 'Strong' };
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#070a13] flex items-center justify-center p-4">
      {/* Premium Technical Precision Mesh Grid */}
      <div className="absolute inset-0 premium-grid pointer-events-none z-0" />

      {/* Interactive 3D Canvas Connection Background */}
      <InteractiveMeshBackground forceDark={true} />

      {/* Decorative Morphing Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-650/15 rounded-full blur-[100px] animate-drift-slow pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-650/15 rounded-full blur-[120px] animate-drift-slower pointer-events-none z-0" />
      <div className="absolute top-1/2 left-2/3 w-72 h-72 bg-blue-650/10 rounded-full blur-[80px] animate-float-slow pointer-events-none z-0" />

      <div className="max-w-md w-full space-y-6 relative z-10 py-8">
        {/* Header */}
        <div className="text-center animate-fadeIn">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-2.5 shadow-lg shadow-blue-500/20 transform hover:scale-110 transition-transform duration-300">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-2.5 shadow-lg shadow-indigo-500/20 transform hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Create Account
          </h2>
          <p className="text-slate-400 font-medium">
            Join ExpenseAudit AI to detect financial irregularities with advanced analytics
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center space-x-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400 text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Main 3D Form Card */}
        <Interactive3DTiltCard className="w-full">
          <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/60 shadow-[0_25px_60px_rgba(0,0,0,0.65)] rounded-2xl p-8 relative">
            {/* Premium Top Highlight Line */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-t-2xl z-20" />
            
            {/* Google Signup Button */}
            <button
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-slate-800 rounded-xl bg-slate-950/40 text-slate-300 hover:bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-transparent active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="font-semibold text-sm">Sign up with Google</span>
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/80" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="px-3 bg-[#111726] text-slate-400 font-semibold rounded">or</span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    {...register('name')}
                    type="text"
                    className={cn(
                      "block w-full pl-11 pr-3 py-3 border rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-slate-950/40 text-white transition-all duration-200",
                      errors.name 
                        ? "border-red-500/50 focus:ring-red-500/20" 
                        : "border-slate-800"
                    )}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className={cn(
                      "block w-full pl-11 pr-3 py-3 border rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-slate-950/40 text-white transition-all duration-200",
                      errors.email 
                        ? "border-red-500/50 focus:ring-red-500/20" 
                        : "border-slate-800"
                    )}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Organization Field */}
              <div>
                <label htmlFor="organization" className="block text-sm font-semibold text-slate-300 mb-2">
                  Organization <span className="text-slate-500 font-medium">(Optional)</span>
                </label>
                <input
                  {...register('organization')}
                  type="text"
                  className="block w-full px-3 py-3 border border-slate-800 rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-slate-950/40 text-white transition-all duration-200"
                  placeholder="Your company or organization"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className={cn(
                      "block w-full pl-11 pr-10 py-3 border rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-slate-950/40 text-white transition-all duration-200",
                      errors.password 
                        ? "border-red-500/50 focus:ring-red-500/20" 
                        : "border-slate-800"
                    )}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-indigo-400 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-indigo-400 transition-colors" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && passwordStrength && (
                  <div className="mt-2.5 animate-fadeIn">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="flex-1 bg-slate-800 rounded-full h-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            passwordStrength.color,
                            passwordStrength.strength === 'weak' ? 'w-1/3' : 
                            passwordStrength.strength === 'medium' ? 'w-2/3' : 'w-full'
                          )}
                        />
                      </div>
                      <span className={cn(
                        "text-xs font-bold",
                        passwordStrength.strength === 'weak' ? 'text-red-500' :
                        passwordStrength.strength === 'medium' ? 'text-yellow-500' : 'text-green-500'
                      )}>
                        {passwordStrength.text}
                      </span>
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={cn(
                      "block w-full pl-11 pr-10 py-3 border rounded-xl shadow-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 bg-slate-950/40 text-white transition-all duration-200",
                      errors.confirmPassword 
                        ? "border-red-500/50 focus:ring-red-500/20" 
                        : "border-slate-800"
                    )}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-indigo-400 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-indigo-400 transition-colors" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative overflow-hidden w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <>
                    {/* Animated Glossy Sweep Reflection */}
                    <div className="absolute inset-0 w-1/2 h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shine_0.75s_ease-in-out]" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-6 text-center text-sm text-slate-400 font-semibold">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Interactive3DTiltCard>

        {/* Benefits Glass Panel */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl p-6 relative">
          <h3 className="text-lg font-bold text-white mb-4">Why Choose ExpenseAudit AI?</h3>
          <div className="space-y-3.5">
            <div className="flex items-center space-x-3.5">
              <div className="bg-green-500/10 rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Advanced Benford's Law fraud detection</span>
            </div>
            <div className="flex items-center space-x-3.5">
              <div className="bg-green-500/10 rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Real-time analytics and reporting</span>
            </div>
            <div className="flex items-center space-x-3.5">
              <div className="bg-green-500/10 rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Enterprise-grade security and compliance</span>
            </div>
            <div className="flex items-center space-x-3.5">
              <div className="bg-green-500/10 rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Multiple AI model integration options</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
