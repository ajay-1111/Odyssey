import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plane, MapPin, Calendar, Users, Sparkles, 
  ArrowRight, Globe, Shield, Clock, Star,
  ChevronRight, Menu, X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [destinations, setDestinations] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const features = [
    { icon: Sparkles, title: "AI-Powered Planning", desc: "Get personalized itineraries crafted by advanced AI" },
    { icon: Globe, title: "Global Coverage", desc: "Plan trips to any destination worldwide" },
    { icon: Shield, title: "Visa Guidance", desc: "Know requirements before you go" },
    { icon: Clock, title: "Save Hours", desc: "What takes days, done in minutes" }
  ];

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="landing-page">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="logo">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A38322] flex items-center justify-center">
              <Plane className="w-5 h-5 text-black" />
            </div>
            <span className="font-heading text-2xl text-white tracking-tight">Odyssey</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/plan" className="text-white/70 hover:text-[#D4AF37] transition-colors font-body">
              Plan Trip
            </Link>
            {user ? (
              <Link to="/dashboard" className="text-white/70 hover:text-[#D4AF37] transition-colors font-body">
                My Trips
              </Link>
            ) : (
              <Link to="/login" className="text-white/70 hover:text-[#D4AF37] transition-colors font-body">
                Sign In
              </Link>
            )}
            <Button 
              onClick={() => navigate('/plan')}
              className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-6"
              data-testid="nav-start-planning-btn"
            >
              Start Planning
            </Button>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden text-white"
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
              <Link to="/plan" className="text-white/70 hover:text-[#D4AF37] transition-colors py-2">
                Plan Trip
              </Link>
              {user ? (
                <Link to="/dashboard" className="text-white/70 hover:text-[#D4AF37] transition-colors py-2">
                  My Trips
                </Link>
              ) : (
                <Link to="/login" className="text-white/70 hover:text-[#D4AF37] transition-colors py-2">
                  Sign In
                </Link>
              )}
              <Button 
                onClick={() => navigate('/plan')}
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
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1694430684128-409007a848d6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1920"
            alt="Travel destination"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-[#050505]/70 to-[#050505]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[#D4AF37] uppercase tracking-[0.3em] text-sm mb-6 font-body">
              AI-Powered Travel Planning
            </p>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl text-white font-light tracking-tight mb-6">
              The Art of Getting Lost,
              <br />
              <span className="text-gradient-gold font-medium">Curated by AI</span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-body font-light">
              Plan your perfect journey in minutes. Day-wise itineraries, visa guidance, 
              local gems, and booking links—all powered by artificial intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/plan')}
                className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-8 py-6 text-lg font-medium group"
                data-testid="hero-start-planning-btn"
              >
                Start Your Odyssey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="border-white/20 text-white hover:bg-white/5 rounded-full px-8 py-6 text-lg"
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
            className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto"
          >
            {[
              { value: "50K+", label: "Trips Planned" },
              { value: "190+", label: "Countries" },
              { value: "4.9", label: "User Rating" }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-heading text-[#D4AF37]">{stat.value}</p>
                <p className="text-white/50 text-sm mt-1 font-body">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
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
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-sm mb-4 font-body">Why Odyssey</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white font-light">
              Travel Planning, <span className="text-gradient-gold">Reimagined</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-glass p-8 hover:border-[#D4AF37]/30 group"
                data-testid={`feature-card-${i}`}
              >
                <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mb-6 group-hover:bg-[#D4AF37]/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-[#D4AF37]" />
                </div>
                <h3 className="font-heading text-xl text-white mb-3">{feature.title}</h3>
                <p className="text-white/50 font-body text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-24 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-sm mb-4 font-body">Explore</p>
              <h2 className="font-heading text-4xl md:text-5xl text-white font-light">
                Popular Destinations
              </h2>
            </div>
            <Link 
              to="/plan" 
              className="hidden md:flex items-center gap-2 text-[#D4AF37] hover:text-[#E5C568] transition-colors font-body"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-white/60 text-sm font-body mb-1">{dest.tagline}</p>
                    <h3 className="font-heading text-xl text-white">{dest.name}</h3>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-black" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-sm mb-4 font-body">Simple Process</p>
            <h2 className="font-heading text-4xl md:text-5xl text-white font-light">
              How It Works
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
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
                className="relative text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-[#D4AF37]/20 font-heading text-6xl font-bold">
                  {item.step}
                </span>
                <h3 className="font-heading text-2xl text-white mb-3">{item.title}</h3>
                <p className="text-white/50 font-body">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-gold rounded-3xl p-12 md:p-16 text-center gold-glow"
          >
            <h2 className="font-heading text-4xl md:text-5xl text-white font-light mb-6">
              Ready for Your Next Adventure?
            </h2>
            <p className="text-white/60 text-lg mb-8 font-body max-w-xl mx-auto">
              Join thousands of travelers who've discovered the joy of AI-powered trip planning.
            </p>
            <Button 
              onClick={() => navigate('/plan')}
              className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-10 py-6 text-lg font-medium"
              data-testid="cta-start-btn"
            >
              Start Planning Free
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A38322] flex items-center justify-center">
              <Plane className="w-4 h-4 text-black" />
            </div>
            <span className="font-heading text-xl text-white">Odyssey</span>
          </div>
          <p className="text-white/40 text-sm font-body">
            © 2025 Odyssey. The Art of Getting Lost, Curated by AI.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/40 hover:text-[#D4AF37] transition-colors text-sm font-body">Privacy</a>
            <a href="#" className="text-white/40 hover:text-[#D4AF37] transition-colors text-sm font-body">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
