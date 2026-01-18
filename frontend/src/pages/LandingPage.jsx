import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plane, MapPin, Calendar, Users, Sparkles, 
  ArrowRight, Globe, Shield, Clock, Star,
  ChevronRight, Menu, X, Mail, Phone, MapPinned,
  Instagram, Twitter, Facebook, Linkedin, Youtube,
  Heart, Zap, Award, TrendingUp, Send, Sun, Moon,
  Dumbbell, Utensils, Car, CheckCircle
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
      toast.success('Message sent! We\'ll get back to you soon.');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) {
      toast.error('Please enter your email');
      return;
    }
    try {
      await axios.post(`${API_URL}/newsletter/subscribe`, { email: newsletterEmail });
      toast.success('Successfully subscribed!');
      setNewsletterEmail('');
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    }
  };

  const features = [
    { icon: Sparkles, title: "AI-Powered Planning", desc: "Personalized itineraries crafted by advanced AI in minutes" },
    { icon: Globe, title: "190+ Countries", desc: "Plan trips to any destination worldwide with visa guidance" },
    { icon: Shield, title: "Insurance & Safety", desc: "Best insurance recommendations and safety tips" },
    { icon: Dumbbell, title: "Fitness Friendly", desc: "Find gyms, marathons, and fitness events at your destination" },
    { icon: Utensils, title: "Food & Dining", desc: "Restaurant recommendations based on your dietary preferences" },
    { icon: Car, title: "All Transport", desc: "Flights, trains, buses, taxis - all options with prices" }
  ];

  const uniqueFeatures = [
    "Passport-based visa requirements",
    "Multi-airport flight comparison",
    "Baggage allowance details",
    "Weather-based packing lists",
    "Local emergency numbers",
    "Currency conversion",
    "Fitness events finder",
    "Travel insurance comparison"
  ];

  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com/odysseytravel", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com/odysseytravel", label: "Twitter" },
    { icon: Facebook, href: "https://facebook.com/odysseytravel", label: "Facebook" },
    { icon: Linkedin, href: "https://linkedin.com/company/odysseytravel", label: "LinkedIn" },
    { icon: Youtube, href: "https://youtube.com/odysseytravel", label: "YouTube" }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }} data-testid="landing-page">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="logo">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A38322] flex items-center justify-center">
              <Plane className="w-4 sm:w-5 h-4 sm:h-5 text-black" />
            </div>
            <span className="font-heading text-xl sm:text-2xl tracking-tight" style={{ color: 'var(--foreground)' }}>Odyssey</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link to="/plan" className="text-sm transition-colors hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>
              Plan Trip
            </Link>
            <a href="#features" className="text-sm transition-colors hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>
              Features
            </a>
            <a href="#about" className="text-sm transition-colors hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>
              About
            </a>
            <a href="#contact" className="text-sm transition-colors hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>
              Contact
            </a>
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm transition-colors hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>
                  My Trips
                </Link>
                <Button onClick={() => { logout(); toast.success('Logged out'); }} variant="ghost" className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" className="text-sm transition-colors hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>
                Sign In
              </Link>
            )}
            
            {/* Currency Selector */}
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-20 h-8 text-xs" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: 'var(--background-secondary)' }}>
                {currencies.slice(0, 10).map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>{curr.symbol} {curr.code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4 text-[#D4AF37]" />}
            </button>
            
            <Button onClick={() => navigate('/plan')} className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-6 text-sm">
              Start Planning
            </Button>
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggleTheme} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4 text-[#D4AF37]" />}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2" style={{ color: 'var(--foreground)' }}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="md:hidden px-6 py-4 border-t" style={{ background: 'var(--background-secondary)', borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-4">
              <Link to="/plan" className="py-2" style={{ color: 'var(--foreground-muted)' }} onClick={() => setMenuOpen(false)}>Plan Trip</Link>
              <a href="#features" className="py-2" style={{ color: 'var(--foreground-muted)' }} onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#about" className="py-2" style={{ color: 'var(--foreground-muted)' }} onClick={() => setMenuOpen(false)}>About</a>
              <a href="#contact" className="py-2" style={{ color: 'var(--foreground-muted)' }} onClick={() => setMenuOpen(false)}>Contact</a>
              {user ? (
                <Link to="/dashboard" className="py-2" style={{ color: 'var(--foreground-muted)' }} onClick={() => setMenuOpen(false)}>My Trips</Link>
              ) : (
                <Link to="/login" className="py-2" style={{ color: 'var(--foreground-muted)' }} onClick={() => setMenuOpen(false)}>Sign In</Link>
              )}
              <Button onClick={() => { navigate('/plan'); setMenuOpen(false); }} className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full w-full">
                Start Planning
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1920" alt="Travel" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, var(--background) 0%, transparent 30%, var(--background) 100%)` }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs sm:text-sm mb-4 font-body">AI-Powered Travel Planning</p>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 px-4" style={{ color: 'var(--foreground)' }}>
              Plan Your Perfect Journey
              <br />
              <span className="text-gradient-gold font-medium">In Minutes, Not Hours</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 font-body font-light px-4" style={{ color: 'var(--foreground-muted)' }}>
              Complete travel planning with flights, hotels, day-wise itineraries, visa guidance, 
              packing lists, and fitness activities—all personalized by AI.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button onClick={() => navigate('/plan')} className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-8 py-6 text-lg font-medium group">
                Start Your Odyssey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="rounded-full px-8 py-6 text-lg" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                See Features
              </Button>
            </div>
          </motion.div>

          {/* Unique Features List */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="flex flex-wrap justify-center gap-3 mt-16 px-4">
            {uniqueFeatures.map((feature, i) => (
              <span key={i} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--foreground-muted)' }}>
                <CheckCircle className="w-4 h-4 text-[#D4AF37]" />
                {feature}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6" style={{ background: 'var(--background-secondary)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs sm:text-sm mb-4 font-body">Features</p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-light" style={{ color: 'var(--foreground)' }}>
              Everything You Need, <span className="text-gradient-gold">Nothing You Don't</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card-glass p-8 hover:border-[#D4AF37]/30">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                  <feature.icon className="w-7 h-7 text-[#D4AF37]" />
                </div>
                <h3 className="font-heading text-xl mb-3" style={{ color: 'var(--foreground)' }}>{feature.title}</h3>
                <p className="font-body text-sm" style={{ color: 'var(--foreground-muted)' }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs sm:text-sm mb-4 font-body">Explore</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-light" style={{ color: 'var(--foreground)' }}>Popular Destinations</h2>
            </div>
            <Link to="/plan" className="flex items-center gap-2 text-[#D4AF37] hover:text-[#E5C568] transition-colors font-body text-sm">
              Plan Your Trip <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {destinations.slice(0, 8).map((dest, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="group cursor-pointer img-zoom" onClick={() => navigate('/plan')}>
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
                  <img src={dest.image} alt={dest.name} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white/60 text-xs mb-1">{dest.tagline}</p>
                    <h3 className="font-heading text-lg text-white">{dest.name}</h3>
                    {dest.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-white/70 text-xs">{dest.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6" style={{ background: 'var(--background-secondary)' }}>
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs sm:text-sm mb-4 font-body">About Us</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-light mb-6" style={{ color: 'var(--foreground)' }}>Meet the Founder</h2>
          </motion.div>

          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#D4AF37]/30">
                <img 
                  src="https://customer-assets.emergentagent.com/job_globetrek-18/artifacts/s7d3b7vu_IMG_20211022_140948.jpeg" 
                  alt="Ajay Reddy Gopu - Founder" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="font-heading text-2xl mb-2" style={{ color: 'var(--foreground)' }}>Ajay Reddy Gopu</h3>
              <p className="text-[#D4AF37] font-body mb-6">Founder & CEO</p>
              <p className="font-body leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
                As a passionate traveler who has explored over 30 countries, I founded Odyssey to solve the biggest pain point 
                in travel - planning. Our AI-powered platform takes the hassle out of trip planning, giving you more time to 
                actually enjoy your adventures. From visa requirements to fitness centers, we've thought of everything so you don't have to.
              </p>
            </motion.div>

            {/* Values */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
              {[
                { icon: Heart, title: "Passion", desc: "Built by travelers, for travelers" },
                { icon: Zap, title: "Innovation", desc: "AI that understands your needs" },
                { icon: Award, title: "Excellence", desc: "Quality recommendations always" }
              ].map((value, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card-glass p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                    <value.icon className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <h4 className="font-heading text-lg mb-2" style={{ color: 'var(--foreground)' }}>{value.title}</h4>
                  <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs sm:text-sm mb-4 font-body">Contact</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-light" style={{ color: 'var(--foreground)' }}>Get In Touch</h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h3 className="font-heading text-2xl mb-6" style={{ color: 'var(--foreground)' }}>We'd Love to Hear From You</h3>
              <p className="font-body mb-8" style={{ color: 'var(--foreground-muted)' }}>
                Have questions? Want to partner with us? Drop us a message!
              </p>

              <div className="space-y-4">
                {[
                  { icon: Mail, label: "Email", value: "hello@odysseytravel.com" },
                  { icon: Phone, label: "Phone", value: "+1 (555) 123-4567" },
                  { icon: MapPinned, label: "Location", value: "San Francisco, CA" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                      <item.icon className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{item.label}</p>
                      <p className="font-body" style={{ color: 'var(--foreground)' }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="mt-8">
                <p className="text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>Follow Us</p>
                <div className="flex gap-3">
                  {socialLinks.map((social, i) => (
                    <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-[#D4AF37]/20" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                      <social.icon className="w-4 h-4 text-[#D4AF37]" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <form onSubmit={handleContactSubmit} className="card-glass p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: 'var(--foreground-muted)' }}>Name *</label>
                    <Input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Your name" className="h-12" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }} />
                  </div>
                  <div>
                    <label className="text-sm mb-2 block" style={{ color: 'var(--foreground-muted)' }}>Email *</label>
                    <Input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="you@example.com" className="h-12" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }} />
                  </div>
                </div>
                <div>
                  <label className="text-sm mb-2 block" style={{ color: 'var(--foreground-muted)' }}>Subject</label>
                  <Input value={contactForm.subject} onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })} placeholder="How can we help?" className="h-12" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }} />
                </div>
                <div>
                  <label className="text-sm mb-2 block" style={{ color: 'var(--foreground-muted)' }}>Message *</label>
                  <Textarea value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="Tell us more..." rows={4} style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }} />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full h-12">
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-4 sm:px-6" style={{ background: 'var(--background-secondary)' }}>
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass-gold rounded-3xl p-12 text-center">
            <h2 className="font-heading text-3xl mb-4" style={{ color: 'var(--foreground)' }}>Get Travel Inspiration</h2>
            <p className="mb-8" style={{ color: 'var(--foreground-muted)' }}>Subscribe for exclusive deals, tips, and destination guides.</p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder="Enter your email" className="flex-1 h-12" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }} />
              <Button type="submit" className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-8 h-12">
                <Send className="w-4 h-4 mr-2" />Subscribe
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A38322] flex items-center justify-center">
                  <Plane className="w-4 h-4 text-black" />
                </div>
                <span className="font-heading text-xl" style={{ color: 'var(--foreground)' }}>Odyssey</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>AI-Powered Travel Planning</p>
              <p className="text-xs mt-2" style={{ color: 'var(--foreground-muted)' }}>Founded by Ajay Reddy Gopu</p>
            </div>
            
            <div>
              <h4 className="font-body font-medium mb-4 text-sm" style={{ color: 'var(--foreground)' }}>Product</h4>
              <div className="space-y-2">
                <Link to="/plan" className="block text-sm hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>Plan Trip</Link>
                <a href="#features" className="block text-sm hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>Features</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-body font-medium mb-4 text-sm" style={{ color: 'var(--foreground)' }}>Company</h4>
              <div className="space-y-2">
                <a href="#about" className="block text-sm hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>About</a>
                <a href="#contact" className="block text-sm hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>Contact</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-body font-medium mb-4 text-sm" style={{ color: 'var(--foreground)' }}>Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>Privacy Policy</a>
                <a href="#" className="block text-sm hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>Terms of Service</a>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>© 2025 Odyssey. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {socialLinks.slice(0, 4).map((social, i) => (
                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37]" style={{ color: 'var(--foreground-muted)' }}>
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
