import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Mail, Lock, Eye, EyeOff, ArrowRight, Sun, Moon } from 'lucide-react';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/errorHandler';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back to Odyssey!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative" style={{ background: 'var(--background)' }} data-testid="login-page">
      <div className="bg-animated" />
      
      {/* Theme Toggle */}
      <button 
        onClick={toggleTheme} 
        className="absolute top-6 right-6 z-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110" 
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-violet-500" />}
      </button>

      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-3 mb-12 group" data-testid="login-logo">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 transition-transform group-hover:scale-110">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Odyssey</span>
          </Link>

          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Welcome Back</h1>
          <p className="text-lg mb-8" style={{ color: 'var(--foreground-muted)' }}>Sign in to continue your journey</p>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  data-testid="login-email-input"
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
                  data-testid="login-password-input"
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
            </div>

            <motion.button 
              type="submit" 
              disabled={loading} 
              className="btn-gradient btn-press w-full h-14 text-lg rounded-2xl flex items-center justify-center gap-2" 
              data-testid="login-submit-btn"
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center mt-8" style={{ color: 'var(--foreground-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-violet-500 hover:text-violet-400 font-medium transition-colors">Create one</Link>
          </p>

          <div className="mt-8 pt-8 border-t text-center" style={{ borderColor: 'var(--border)' }}>
            <Link to="/plan" className="text-sm transition-colors hover:text-violet-500" style={{ color: 'var(--foreground-muted)' }}>
              Or continue as guest to plan a trip
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8 }}
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200"
          alt="Beautiful beach destination"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: theme === 'dark' ? 'linear-gradient(to right, var(--background) 0%, transparent 50%, transparent 100%)' : 'linear-gradient(to right, var(--background) 0%, rgba(250,250,255,0.3) 50%, transparent 100%)' }}></div>
        
        {/* Floating Card */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4, duration: 0.6 }}
            className="glass p-8 rounded-3xl max-w-md"
          >
            <blockquote className="font-heading text-2xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              &ldquo;Odyssey turned our honeymoon into a seamlessly planned adventure. Every detail was perfect.&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Sarah" className="w-12 h-12 rounded-full object-cover ring-2 ring-violet-500/30" />
              <div>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>Sarah & James</p>
                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Bali 2024</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
