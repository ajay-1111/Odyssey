import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const passwordStrength = () => {
    if (password.length === 0) return { text: '', color: '', width: '0%' };
    if (password.length < 6) return { text: 'Weak', color: 'text-red-500', width: '33%', bg: 'bg-red-500' };
    if (password.length < 10) return { text: 'Fair', color: 'text-amber-500', width: '66%', bg: 'bg-amber-500' };
    return { text: 'Strong', color: 'text-emerald-500', width: '100%', bg: 'bg-emerald-500' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success('Welcome to Odyssey!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "AI-generated personalized itineraries",
    "Visa requirements & travel tips",
    "Curated restaurant recommendations",
    "Fitness activities at your destination",
    "All booking links in one place"
  ];

  return (
    <div className="min-h-screen flex relative" style={{ background: 'var(--background)' }} data-testid="register-page">
      <div className="bg-animated" />
      
      {/* Theme Toggle */}
      <button onClick={toggleTheme} className="absolute top-6 right-6 z-50 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-violet-500" />}
      </button>

      {/* Left side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200"
          alt="Travel destination"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: theme === 'dark' ? 'linear-gradient(to left, var(--background) 0%, transparent 50%, transparent 100%)' : 'linear-gradient(to left, var(--background) 0%, rgba(250,250,255,0.3) 50%, transparent 100%)' }}></div>
        
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-8 rounded-3xl">
            <h2 className="font-heading text-3xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>Start Your Journey</h2>
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span style={{ color: 'var(--foreground-muted)' }}>{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative z-10">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-12" data-testid="register-logo">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Odyssey</span>
          </Link>

          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Create Account</h1>
          <p className="text-lg mb-8" style={{ color: 'var(--foreground-muted)' }}>Join thousands of travelers planning smarter</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium" style={{ color: 'var(--foreground-muted)' }}>Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="input-modern pl-12 h-14"
                  data-testid="register-name-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium" style={{ color: 'var(--foreground-muted)' }}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-modern pl-12 h-14"
                  data-testid="register-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium" style={{ color: 'var(--foreground-muted)' }}>Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-modern pl-12 pr-12 h-14"
                  data-testid="register-password-input"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--foreground-muted)' }}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <div className="space-y-1">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className={`h-full ${passwordStrength().bg} transition-all`} style={{ width: passwordStrength().width }}></div>
                  </div>
                  <p className={`text-xs ${passwordStrength().color}`}>Password strength: {passwordStrength().text}</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-gradient w-full h-14 text-lg rounded-2xl" data-testid="register-submit-btn">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Create Account <ArrowRight className="ml-2 w-5 h-5 inline" /></>}
            </button>
          </form>

          <p className="text-center mt-8" style={{ color: 'var(--foreground-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-violet-500 hover:text-violet-400 font-medium transition-colors">Sign in</Link>
          </p>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--foreground-muted)' }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}
