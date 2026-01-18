import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plane, MapPin, Calendar, Users, Sparkles, 
  ArrowRight, Globe, Shield, Clock, Star,
  ChevronRight, Menu, X, Mail, Phone, MapPinned,
  Instagram, Twitter, Facebook, Linkedin, Youtube,
  Heart, Zap, Award, Send, Sun, Moon,
  Dumbbell, Utensils, Car, CheckCircle, ExternalLink,
  Code, Rocket, Brain, Quote
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, currencies } = useCurrency();
  const [destinations, setDestinations] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await axios.get(`${API_URL}/destinations/popular`);
        setDestinations(response.data);
      } catch (error) {
        console.error('Failed to fetch destinations');
      }
    };
    fetchDestinations();
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/contact`, contactForm);
      toast.success('Message sent successfully!');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    try {
      await axios.post(`${API_URL}/newsletter/subscribe`, { email: newsletterEmail });
      toast.success('Subscribed successfully!');
      setNewsletterEmail('');
    } catch (error) {
      toast.error('Failed to subscribe');
    }
  };

  const features = [
    { icon: Brain, title: "Ultra Neural AI", desc: "Powered by advanced neural networks for hyper-personalized travel planning", gradient: "from-violet-500 to-purple-600" },
    { icon: Globe, title: "190+ Countries", desc: "Comprehensive coverage with real visa requirements based on your passport", gradient: "from-blue-500 to-cyan-500" },
    { icon: Shield, title: "Smart Insurance", desc: "AI-curated insurance recommendations for worry-free travel", gradient: "from-emerald-500 to-teal-500" },
    { icon: Dumbbell, title: "Fitness Finder", desc: "Discover gyms, marathons, yoga studios at your destination", gradient: "from-orange-500 to-pink-500" },
    { icon: Utensils, title: "Culinary Guide", desc: "Restaurant recommendations matching your dietary preferences", gradient: "from-rose-500 to-red-500" },
    { icon: Car, title: "All Transport", desc: "Compare flights, trains, buses with live prices and baggage info", gradient: "from-indigo-500 to-violet-500" }
  ];

  const reviews = [
    { name: "Sarah Mitchell", role: "Travel Blogger", rating: 5, text: "Odyssey planned my entire 3-week Asia trip in 10 minutes. The visa guidance alone saved me hours of research!", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
    { name: "James Chen", role: "Business Traveler", rating: 5, text: "Finally, an app that understands frequent flyers. The multi-airport search found me flights $400 cheaper!", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
    { name: "Maria Garcia", role: "Family Vacation", rating: 5, text: "Planned our family trip with 2 kids and grandparents. Every detail was perfect, even the fitness centers for my husband!", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" }
  ];

  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com/odysseytravel", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com/odysseytravel", label: "Twitter" },
    { icon: Facebook, href: "https://facebook.com/odysseytravel", label: "Facebook" },
    { icon: Linkedin, href: "https://linkedin.com/company/odysseytravel", label: "LinkedIn" },
    { icon: Youtube, href: "https://youtube.com/odysseytravel", label: "YouTube" }
  ];

  const feedbackPlatforms = [
    { name: "Google Reviews", icon: "⭐", url: "https://g.page/r/odysseytravel/review", color: "from-blue-500 to-blue-600" },
    { name: "Trustpilot", icon: "🌟", url: "https://trustpilot.com/review/odysseytravel.com", color: "from-green-500 to-emerald-600" },
    { name: "Product Hunt", icon: "🚀", url: "https://producthunt.com/posts/odyssey-travel", color: "from-orange-500 to-red-500" }
  ];

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--background)' }} data-testid="landing-page">
      {/* Animated Background */}
      <div className="bg-animated" />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-all duration-300" style={{ background: theme === 'dark' ? 'rgba(10, 10, 15, 0.8)' : 'rgba(250, 250, 255, 0.8)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group" data-testid="logo">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Odyssey</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            {[
              { label: 'Plan Trip', to: '/plan' },
              { label: 'Features', href: '#features' },
              { label: 'About', href: '#about' },
              { label: 'Reviews', href: '#reviews' },
              { label: 'Contact', href: '#contact' }
            ].map((item, i) => (
              item.to ? (
                <Link key={i} to={item.to} className="text-sm font-medium transition-colors hover:text-violet-500" style={{ color: 'var(--foreground-muted)' }}>
                  {item.label}
                </Link>
              ) : (
                <a key={i} href={item.href} className="text-sm font-medium transition-colors hover:text-violet-500" style={{ color: 'var(--foreground-muted)' }}>
                  {item.label}
                </a>
              )
            ))}
            
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-violet-500" style={{ color: 'var(--foreground-muted)' }}>My Trips</Link>
                <button onClick={() => { logout(); toast.success('Logged out'); }} className="text-sm font-medium transition-colors hover:text-violet-500" style={{ color: 'var(--foreground-muted)' }}>Logout</button>
              </>
            ) : (
              <Link to="/login" className="text-sm font-medium transition-colors hover:text-violet-500" style={{ color: 'var(--foreground-muted)' }}>Sign In</Link>
            )}
            
            {/* Currency */}
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-20 h-9 text-xs rounded-xl border-0" style={{ background: 'var(--card-bg)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl" style={{ background: 'var(--background-secondary)' }}>
                {currencies.slice(0, 10).map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>{curr.symbol} {curr.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105" style={{ background: 'var(--card-bg)' }}>
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-violet-500" />}
            </button>
            
            <button onClick={() => navigate('/plan')} className="btn-gradient">
              Start Planning
            </button>
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center gap-3">
            <button onClick={toggleTheme} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--card-bg)' }}>
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-violet-500" />}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--card-bg)', color: 'var(--foreground)' }}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="lg:hidden px-6 py-6 border-t" style={{ background: 'var(--background-secondary)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-4">
              {[
                { label: 'Plan Trip', to: '/plan' },
                { label: 'Features', href: '#features' },
                { label: 'About', href: '#about' },
                { label: 'Contact', href: '#contact' }
              ].map((item, i) => (
                item.to ? (
                  <Link key={i} to={item.to} className="py-2 text-lg font-medium" style={{ color: 'var(--foreground)' }} onClick={() => setMenuOpen(false)}>{item.label}</Link>
                ) : (
                  <a key={i} href={item.href} className="py-2 text-lg font-medium" style={{ color: 'var(--foreground)' }} onClick={() => setMenuOpen(false)}>{item.label}</a>
                )
              ))}
              {user ? (
                <Link to="/dashboard" className="py-2 text-lg font-medium" style={{ color: 'var(--foreground)' }} onClick={() => setMenuOpen(false)}>My Trips</Link>
              ) : (
                <Link to="/login" className="py-2 text-lg font-medium" style={{ color: 'var(--foreground)' }} onClick={() => setMenuOpen(false)}>Sign In</Link>
              )}
              <button onClick={() => { navigate('/plan'); setMenuOpen(false); }} className="btn-gradient mt-4 w-full">
                Start Planning
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-12">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-violet-600/30 to-purple-600/30 rounded-full blur-3xl floating" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-600/20 to-rose-600/20 rounded-full blur-3xl floating-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="badge-modern inline-flex items-center gap-2 mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Powered by Ultra Neural AI</span>
            </div>
            
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8" style={{ color: 'var(--foreground)' }}>
              Your Personal
              <br />
              <span className="text-gradient">Travel Assistant</span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto mb-12 font-light leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
              Plan your perfect journey in minutes. Complete itineraries, visa guidance, 
              fitness activities, and more — all powered by advanced AI.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button onClick={() => navigate('/plan')} className="btn-gradient text-lg px-10 py-5 rounded-2xl group">
                Start Your Journey
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="btn-outline-modern text-lg px-10 py-5 rounded-2xl">
                Explore Features
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { value: "50K+", label: "Trips Planned" },
                { value: "190+", label: "Countries" },
                { value: "4.9★", label: "Rating" },
                { value: "24/7", label: "AI Support" }
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="card-modern p-6">
                  <div className="stat-value text-3xl md:text-4xl">{stat.value}</div>
                  <div className="text-sm mt-2" style={{ color: 'var(--foreground-muted)' }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <div className="badge-modern inline-flex items-center gap-2 mb-6">
              <Rocket className="w-4 h-4" />
              <span>Features</span>
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Everything You Need
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--foreground-muted)' }}>
              Powered by advanced neural networks for the most personalized travel experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card-modern p-8 hover:scale-[1.02]">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-heading text-2xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>{feature.title}</h3>
                <p className="leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="badge-modern inline-flex items-center gap-2 mb-6">
              <Code className="w-4 h-4" />
              <span>Meet the Founder</span>
            </div>
          </motion.div>

          <div className="card-modern p-8 md:p-12 lg:p-16">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Photo */}
              <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="flex-shrink-0">
                <div className="relative">
                  <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_globetrek-18/artifacts/s7d3b7vu_IMG_20211022_140948.jpeg" 
                      alt="Ajay Reddy Gopu" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Content */}
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex-1 text-center lg:text-left">
                <h3 className="font-heading text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                  Ajay Reddy Gopu
                </h3>
                <p className="text-lg font-medium text-violet-500 mb-6">Founder & CEO • Senior Developer</p>
                
                <div className="relative mb-8">
                  <Quote className="absolute -top-4 -left-2 w-8 h-8 text-violet-500/30" />
                  <p className="text-lg md:text-xl leading-relaxed pl-6" style={{ color: 'var(--foreground-muted)' }}>
                    As a <span className="text-violet-500 font-semibold">Senior Developer</span> with a passion for travel, 
                    I've explored several countries and understood one thing — <span className="font-semibold" style={{ color: 'var(--foreground)' }}>trip planning shouldn't be stressful</span>.
                  </p>
                </div>
                
                <p className="text-lg leading-relaxed mb-8" style={{ color: 'var(--foreground-muted)' }}>
                  I founded Odyssey with a mission to <span className="font-semibold" style={{ color: 'var(--foreground)' }}>help society by making life easier</span>. 
                  Our <span className="text-gradient font-bold">Ultra Neural Network AI</span> acts as your personal travel assistant — 
                  handling everything from visa requirements to fitness center bookings, 
                  so you can focus on creating memories, not spreadsheets.
                </p>

                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  {["AI-Powered", "User-First", "Global Vision", "24/7 Assistant"].map((tag, i) => (
                    <span key={i} className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--foreground-muted)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="badge-modern inline-flex items-center gap-2 mb-6">
              <Star className="w-4 h-4" />
              <span>Reviews</span>
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Loved by Travelers
            </h2>
          </motion.div>

          {/* Review Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {reviews.map((review, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="review-card">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 star-filled" />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={review.avatar} alt={review.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{review.name}</p>
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{review.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Feedback Platforms */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <p className="text-lg mb-6" style={{ color: 'var(--foreground-muted)' }}>Share your experience on</p>
            <div className="flex flex-wrap justify-center gap-4">
              {feedbackPlatforms.map((platform, i) => (
                <a key={i} href={platform.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r ${platform.color} text-white font-medium hover:scale-105 transition-transform shadow-lg`}>
                  <span className="text-xl">{platform.icon}</span>
                  {platform.name}
                  <ExternalLink className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="badge-modern inline-flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4" />
                <span>Explore</span>
              </div>
              <h2 className="font-heading text-4xl sm:text-5xl font-bold" style={{ color: 'var(--foreground)' }}>Popular Destinations</h2>
            </div>
            <Link to="/plan" className="flex items-center gap-2 text-violet-500 hover:text-violet-400 font-medium">
              Plan Your Trip <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {destinations.slice(0, 8).map((dest, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="group cursor-pointer" onClick={() => navigate('/plan')}>
                <div className="img-zoom aspect-[4/5]">
                  <div className="relative w-full h-full">
                    <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <p className="text-white/70 text-xs md:text-sm mb-1">{dest.tagline}</p>
                      <h3 className="font-heading text-lg md:text-xl font-bold text-white">{dest.name}</h3>
                      {dest.rating && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-4 h-4 star-filled" />
                          <span className="text-white/80 text-sm">{dest.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent" />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="badge-modern inline-flex items-center gap-2 mb-6">
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold" style={{ color: 'var(--foreground)' }}>Get In Touch</h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Info */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h3 className="font-heading text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>We'd Love to Hear From You</h3>
              <p className="mb-8 text-lg" style={{ color: 'var(--foreground-muted)' }}>
                Have questions? Want to partner with us? We're here to help!
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Mail, label: "Email", value: "hello@odysseytravel.com" },
                  { icon: Phone, label: "Phone", value: "+1 (555) 123-4567" },
                  { icon: MapPinned, label: "Location", value: "San Francisco, CA" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{item.label}</p>
                      <p className="font-medium" style={{ color: 'var(--foreground)' }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social */}
              <div>
                <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>Follow Us</p>
                <div className="flex gap-3">
                  {socialLinks.map((social, i) => (
                    <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                      <social.icon className="w-5 h-5 text-violet-500" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <form onSubmit={handleContactSubmit} className="card-modern p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm mb-2 block font-medium" style={{ color: 'var(--foreground-muted)' }}>Name</label>
                    <input type="text" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Your name" className="input-modern" />
                  </div>
                  <div>
                    <label className="text-sm mb-2 block font-medium" style={{ color: 'var(--foreground-muted)' }}>Email</label>
                    <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="you@example.com" className="input-modern" />
                  </div>
                </div>
                <div>
                  <label className="text-sm mb-2 block font-medium" style={{ color: 'var(--foreground-muted)' }}>Subject</label>
                  <input type="text" value={contactForm.subject} onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })} placeholder="How can we help?" className="input-modern" />
                </div>
                <div>
                  <label className="text-sm mb-2 block font-medium" style={{ color: 'var(--foreground-muted)' }}>Message</label>
                  <textarea value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Tell us more..." rows={4} className="input-modern resize-none" />
                </div>
                <button type="submit" disabled={submitting} className="btn-gradient w-full">
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="card-modern p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-pink-500/10" />
            <div className="relative">
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>Get Travel Inspiration</h2>
              <p className="text-lg mb-8" style={{ color: 'var(--foreground-muted)' }}>Subscribe for exclusive deals, tips, and destination guides.</p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="Enter your email" className="input-modern flex-1" />
                <button type="submit" className="btn-gradient whitespace-nowrap">
                  <Send className="w-4 h-4 mr-2 inline" />Subscribe
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading text-xl font-bold" style={{ color: 'var(--foreground)' }}>Odyssey</span>
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--foreground-muted)' }}>Your Personal AI Travel Assistant</p>
              <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Founded by Ajay Reddy Gopu</p>
            </div>
            
            {[
              { title: "Product", links: [{ label: "Plan Trip", to: "/plan" }, { label: "Features", href: "#features" }] },
              { title: "Company", links: [{ label: "About", href: "#about" }, { label: "Contact", href: "#contact" }] },
              { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>{col.title}</h4>
                <div className="space-y-2">
                  {col.links.map((link, j) => (
                    link.to ? (
                      <Link key={j} to={link.to} className="block text-sm hover:text-violet-500 transition-colors" style={{ color: 'var(--foreground-muted)' }}>{link.label}</Link>
                    ) : (
                      <a key={j} href={link.href} className="block text-sm hover:text-violet-500 transition-colors" style={{ color: 'var(--foreground-muted)' }}>{link.label}</a>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>© 2025 Odyssey. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {socialLinks.slice(0, 4).map((social, i) => (
                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:text-violet-400 transition-colors">
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
