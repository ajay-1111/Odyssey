import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plane, MapPin, Calendar, Users, Sparkles, 
  ArrowRight, Globe, Shield, Clock, Star,
  ChevronRight, Menu, X, Mail, Phone, MapPinned,
  Instagram, Twitter, Facebook, Linkedin, Youtube,
  Heart, Zap, Award, TrendingUp, Send, CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
    { icon: Sparkles, title: "AI-Powered Planning", desc: "Get personalized itineraries crafted by advanced AI" },
    { icon: Globe, title: "Global Coverage", desc: "Plan trips to any destination worldwide" },
    { icon: Shield, title: "Visa Guidance", desc: "Know requirements before you go" },
    { icon: Clock, title: "Save Hours", desc: "What takes days, done in minutes" }
  ];

  const stats = [
    { value: "50K+", label: "Trips Planned", icon: TrendingUp },
    { value: "190+", label: "Countries", icon: Globe },
    { value: "4.9", label: "User Rating", icon: Star },
    { value: "24/7", label: "AI Support", icon: Zap }
  ];

  const teamMembers = [
    { name: "Sarah Chen", role: "CEO & Founder", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200" },
    { name: "Marcus Williams", role: "CTO", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200" },
    { name: "Elena Rodriguez", role: "Head of Product", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200" },
    { name: "James Park", role: "Lead Designer", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200" }
  ];

  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com/odysseytravel", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com/odysseytravel", label: "Twitter" },
    { icon: Facebook, href: "https://facebook.com/odysseytravel", label: "Facebook" },
    { icon: Linkedin, href: "https://linkedin.com/company/odysseytravel", label: "LinkedIn" },
    { icon: Youtube, href: "https://youtube.com/odysseytravel", label: "YouTube" }
  ];

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="landing-page">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="logo">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A38322] flex items-center justify-center">
              <Plane className="w-4 sm:w-5 h-4 sm:h-5 text-black" />
            </div>
            <span className="font-heading text-xl sm:text-2xl text-white tracking-tight">Odyssey</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link to="/plan" className="text-white/70 hover:text-[#D4AF37] transition-colors font-body text-sm">
              Plan Trip
            </Link>
            <a href="#about" className="text-white/70 hover:text-[#D4AF37] transition-colors font-body text-sm">
              About Us
            </a>
            <a href="#contact" className="text-white/70 hover:text-[#D4AF37] transition-colors font-body text-sm">
              Contact
            </a>
            {user ? (
              <>
                <Link to="/dashboard" className="text-white/70 hover:text-[#D4AF37] transition-colors font-body text-sm">
                  My Trips
                </Link>
                <Button 
                  onClick={() => { logout(); toast.success('Logged out'); }}
                  variant="ghost"
                  className="text-white/70 hover:text-[#D4AF37] text-sm"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" className="text-white/70 hover:text-[#D4AF37] transition-colors font-body text-sm">
                Sign In
              </Link>
            )}
            <Button 
              onClick={() => navigate('/plan')}
              className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-4 lg:px-6 text-sm"
              data-testid="nav-start-planning-btn"
            >
              Start Planning
            </Button>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            data-testid="mobile-menu-btn"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[#0A0A0A] border-b border-white/5 px-6 py-4"
          >
            <div className="flex flex-col gap-4">
              <Link to="/plan" className="text-white/70 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMenuOpen(false)}>
                Plan Trip
              </Link>
              <a href="#about" className="text-white/70 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMenuOpen(false)}>
                About Us
              </a>
              <a href="#contact" className="text-white/70 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMenuOpen(false)}>
                Contact
              </a>
              {user ? (
                <>
                  <Link to="/dashboard" className="text-white/70 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMenuOpen(false)}>
                    My Trips
                  </Link>
                  <button onClick={() => { logout(); setMenuOpen(false); toast.success('Logged out'); }} className="text-white/70 hover:text-[#D4AF37] transition-colors py-2 text-left">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="text-white/70 hover:text-[#D4AF37] transition-colors py-2" onClick={() => setMenuOpen(false)}>
                  Sign In
                </Link>
              )}
              <Button 
                onClick={() => { navigate('/plan'); setMenuOpen(false); }}
                className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full w-full"
              >
                Start Planning
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1694430684128-409007a848d6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
            alt="Travel destination"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-[#050505]/70 to-[#050505]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs sm:text-sm mb-4 sm:mb-6 font-body">
              AI-Powered Travel Planning
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-light tracking-tight mb-4 sm:mb-6 px-4">
              The Art of Getting Lost,
              <br />
              <span className="text-gradient-gold font-medium">Curated by AI</span>
            </h1>
            <p className="text-white/60 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 font-body font-light px-4">
              Plan your perfect journey in minutes. Day-wise itineraries, visa guidance, 
              local gems, and booking links—all powered by artificial intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button 
                onClick={() => navigate('/plan')}
                className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-medium group"
                data-testid="hero-start-planning-btn"
              >
                Start Your Odyssey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="border-white/20 text-white hover:bg-white/5 rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg"
                data-testid="learn-more-btn"
              >
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 mt-16 sm:mt-20 max-w-3xl mx-auto px-4"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm">
                <stat.icon className="w-5 h-5 text-[#D4AF37] mx-auto mb-2" />
                <p className="text-2xl sm:text-3xl md:text-4xl font-heading text-[#D4AF37]">{stat.value}</p>
                <p className="text-white/50 text-xs sm:text-sm mt-1 font-body">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden sm:block"
        >
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-1">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs sm:text-sm mb-4 font-body">Why Odyssey</p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white font-light">
              Travel Planning, <span className="text-gradient-gold">Reimagined</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-glass p-6 sm:p-8 hover:border-[#D4AF37]/30 group"
                data-testid={`feature-card-${i}`}
              >
                <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-[#D4AF37]/20 transition-colors">
                  <feature.icon className="w-6 sm:w-7 h-6 sm:h-7 text-[#D4AF37]" />
                </div>
                <h3 className="font-heading text-lg sm:text-xl text-white mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-white/50 font-body text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4"
          >
            <div>
              <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs sm:text-sm mb-2 sm:mb-4 font-body">Explore</p>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white font-light">
                Popular Destinations
              </h2>
            </div>
            <Link 
              to="/plan" 
              className="flex items-center gap-2 text-[#D4AF37] hover:text-[#E5C568] transition-colors font-body text-sm"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {destinations.slice(0, 8).map((dest, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group cursor-pointer img-zoom"
                onClick={() => navigate('/plan')}
                data-testid={`destination-card-${i}`}
              >
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden">
                  <img 
                    src={dest.image} 
                    alt={dest.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6">
                    <p className="text-white/60 text-xs sm:text-sm font-body mb-1">{dest.tagline}</p>
                    <h3 className="font-heading text-sm sm:text-xl text-white">{dest.name}</h3>
                    {dest.rating && (
                      <div className="flex items-center gap-1 mt-1 sm:mt-2">
                        <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-white/70 text-xs">{dest.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#D4AF37] flex items-center justify-center">
                      <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 text-black" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs sm:text-sm mb-4 font-body">Simple Process</p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white font-light">
              How It Works
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "01", icon: MapPin, title: "Enter Details", desc: "Tell us where, when, and who's traveling" },
              { step: "02", icon: Sparkles, title: "AI Creates", desc: "Our AI crafts your perfect itinerary" },
              { step: "03", icon: Calendar, title: "Book & Go", desc: "Use our curated links to book everything" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center p-6"
              >
                <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 flex items-center justify-center">
                  <item.icon className="w-7 sm:w-8 h-7 sm:h-8 text-[#D4AF37]" />
                </div>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[#D4AF37]/20 font-heading text-5xl sm:text-6xl font-bold">
                  {item.step}
                </span>
                <h3 className="font-heading text-xl sm:text-2xl text-white mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-white/50 font-body text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs sm:text-sm mb-4 font-body">About Us</p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white font-light mb-6">
              Our Story
            </h2>
            <p className="text-white/60 max-w-3xl mx-auto font-body text-sm sm:text-base leading-relaxed">
              Founded in 2024, Odyssey was born from a simple idea: travel planning shouldn't be stressful. 
              Our team of passionate travelers and AI engineers came together to create the ultimate trip planning 
              companion. We believe that everyone deserves perfectly curated adventures, and our AI makes that possible 
              in minutes instead of hours.
            </p>
          </motion.div>

          {/* Values */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Heart, title: "Passion for Travel", desc: "We're travelers first, tech second. Every feature comes from real travel experiences." },
              { icon: Zap, title: "Innovation", desc: "We leverage cutting-edge AI to make trip planning effortless and personalized." },
              { icon: Award, title: "Excellence", desc: "We're committed to providing the best travel recommendations and booking links." }
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-glass p-6 sm:p-8 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                  <value.icon className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <h3 className="font-heading text-lg sm:text-xl text-white mb-2">{value.title}</h3>
                <p className="text-white/50 font-body text-sm">{value.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Team */}
          <div className="text-center mb-8">
            <h3 className="font-heading text-2xl sm:text-3xl text-white mb-8">Meet Our Team</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {teamMembers.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-full overflow-hidden border-2 border-[#D4AF37]/30">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-heading text-base sm:text-lg text-white">{member.name}</h4>
                <p className="text-[#D4AF37] font-body text-xs sm:text-sm">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs sm:text-sm mb-4 font-body">Contact Us</p>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white font-light">
              Get In Touch
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="font-heading text-xl sm:text-2xl text-white mb-6">We'd Love to Hear From You</h3>
              <p className="text-white/60 font-body mb-8 text-sm sm:text-base">
                Have questions about planning your next trip? Want to partner with us? 
                Or just want to say hello? Drop us a message!
              </p>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs sm:text-sm">Email</p>
                    <p className="text-white font-body text-sm sm:text-base">hello@odysseytravel.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs sm:text-sm">Phone</p>
                    <p className="text-white font-body text-sm sm:text-base">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                    <MapPinned className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs sm:text-sm">Address</p>
                    <p className="text-white font-body text-sm sm:text-base">San Francisco, CA</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-8">
                <p className="text-white/50 font-body text-sm mb-4">Follow Us</p>
                <div className="flex gap-3">
                  {socialLinks.map((social, i) => (
                    <a
                      key={i}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="w-4 h-4 text-white/70 hover:text-[#D4AF37]" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <form onSubmit={handleContactSubmit} className="card-glass p-6 sm:p-8 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/70 font-body text-sm mb-2 block">Name *</label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Your name"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 sm:h-12"
                      data-testid="contact-name-input"
                    />
                  </div>
                  <div>
                    <label className="text-white/70 font-body text-sm mb-2 block">Email *</label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="you@example.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 sm:h-12"
                      data-testid="contact-email-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-white/70 font-body text-sm mb-2 block">Subject</label>
                  <Input
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="How can we help?"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 sm:h-12"
                    data-testid="contact-subject-input"
                  />
                </div>
                <div>
                  <label className="text-white/70 font-body text-sm mb-2 block">Message *</label>
                  <Textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us more..."
                    rows={4}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                    data-testid="contact-message-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full h-11 sm:h-12"
                  data-testid="contact-submit-btn"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-gold rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center"
          >
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl text-white font-light mb-4">
              Get Travel Inspiration
            </h2>
            <p className="text-white/60 mb-6 sm:mb-8 font-body text-sm sm:text-base">
              Subscribe to our newsletter for exclusive deals, travel tips, and destination guides.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11 sm:h-12"
                data-testid="newsletter-email-input"
              />
              <Button 
                type="submit"
                className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-6 sm:px-8 h-11 sm:h-12"
                data-testid="newsletter-submit-btn"
              >
                <Send className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white font-light mb-6">
              Ready for Your Next Adventure?
            </h2>
            <p className="text-white/60 text-base sm:text-lg mb-8 font-body max-w-xl mx-auto">
              Join thousands of travelers who've discovered the joy of AI-powered trip planning.
            </p>
            <Button 
              onClick={() => navigate('/plan')}
              className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-medium"
              data-testid="cta-start-btn"
            >
              Start Planning Free
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A38322] flex items-center justify-center">
                  <Plane className="w-4 h-4 text-black" />
                </div>
                <span className="font-heading text-xl text-white">Odyssey</span>
              </div>
              <p className="text-white/40 text-sm font-body">
                The Art of Getting Lost, Curated by AI.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-body font-medium mb-4 text-sm">Product</h4>
              <div className="space-y-2">
                <Link to="/plan" className="block text-white/40 hover:text-[#D4AF37] text-sm">Plan Trip</Link>
                <a href="#features" className="block text-white/40 hover:text-[#D4AF37] text-sm">Features</a>
                <a href="#" className="block text-white/40 hover:text-[#D4AF37] text-sm">Pricing</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-body font-medium mb-4 text-sm">Company</h4>
              <div className="space-y-2">
                <a href="#about" className="block text-white/40 hover:text-[#D4AF37] text-sm">About Us</a>
                <a href="#contact" className="block text-white/40 hover:text-[#D4AF37] text-sm">Contact</a>
                <a href="#" className="block text-white/40 hover:text-[#D4AF37] text-sm">Careers</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-body font-medium mb-4 text-sm">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-white/40 hover:text-[#D4AF37] text-sm">Privacy Policy</a>
                <a href="#" className="block text-white/40 hover:text-[#D4AF37] text-sm">Terms of Service</a>
                <a href="#" className="block text-white/40 hover:text-[#D4AF37] text-sm">Cookie Policy</a>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
            <p className="text-white/40 text-xs sm:text-sm font-body">
              © 2025 Odyssey. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.slice(0, 4).map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-[#D4AF37] transition-colors"
                  aria-label={social.label}
                >
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
