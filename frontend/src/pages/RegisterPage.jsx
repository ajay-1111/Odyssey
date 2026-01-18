import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check, Sun, Moon } from 'lucide-react';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/errorHandler';

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
      toast.error(getErrorMessage(error, 'Registration failed'));
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
      <button 
        onClick={toggleTheme} 
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110" 
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-violet-500" />}
      </button>

      {/* Left side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200"
          alt="Travel destination"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: theme === 'dark' ? 'linear-gradient(to left, var(--background) 0%, transparent 50%, transparent 100%)' : 'linear-gradient(to left, var(--background) 0%, rgba(250,250,255,0.3) 50%, transparent 100%)' }}></div>
        
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3, duration: 0.6 }}
            className="glass p-8 rounded-3xl"
          >
            <h2 className="font-heading text-3xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>Start Your Journey</h2>
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.4 + i * 0.1 }} 
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
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
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-3 mb-12 group" data-testid="register-logo">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 transition-transform group-hover:scale-110">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Odyssey</span>
          </Link>

          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Create Account</h1>
          <p className="text-lg mb-8" style={{ color: 'var(--foreground-muted)' }}>Join thousands of travelers planning smarter</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium" style={{ color: 'var(--foreground-muted)' }}>Full Name</Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <User className="w-5 h-5 text-violet-500 transition-transform group-focus-within:scale-110" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-14 rounded-2xl pl-12 pr-4 transition-all focus:ring-2 focus:ring-violet-500/30"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  data-testid="register-name-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium" style={{ color: 'var(--foreground-muted)' }}>Email</Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <Mail className="w-5 h-5 text-violet-500 transition-transform group-focus-within:scale-110" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-14 rounded-2xl pl-12 pr-4 transition-all focus:ring-2 focus:ring-violet-500/30"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  data-testid="register-email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium" style={{ color: 'var(--foreground-muted)' }}>Password</Label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <Lock className="w-5 h-5 text-violet-500 transition-transform group-focus-within:scale-110" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 rounded-2xl pl-12 pr-14 transition-all focus:ring-2 focus:ring-violet-500/30"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  data-testid="register-password-input"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all hover:bg-violet-500/10" 
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1"
                >
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: passwordStrength().width }}
                      className={`h-full ${passwordStrength().bg} transition-all duration-300`}
                    />
                  </div>
                  <p className={`text-xs ${passwordStrength().color}`}>Password strength: {passwordStrength().text}</p>
                </motion.div>
              )}
            </div>

            <motion.button 
              type="submit" 
              disabled={loading} 
              className="btn-gradient btn-press w-full h-14 text-lg rounded-2xl flex items-center justify-center gap-2" 
              data-testid="register-submit-btn"
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
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
