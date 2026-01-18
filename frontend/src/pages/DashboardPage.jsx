import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plane, MapPin, Calendar, Plus, Trash2, Eye, LogOut,
  Clock, DollarSign, MoreVertical, Sun, Moon, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout, getAuthHeader } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { formatPrice } = useCurrency();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await axios.get(`${API_URL}/trips/my-trips`, {
        headers: getAuthHeader()
      });
      setTrips(response.data);
    } catch (error) {
      toast.error('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const deleteTrip = async (tripId) => {
    try {
      await axios.delete(`${API_URL}/trips/${tripId}`, {
        headers: getAuthHeader()
      });
      setTrips(trips.filter(t => t.id !== tripId));
      toast.success('Trip deleted');
    } catch (error) {
      toast.error('Failed to delete trip');
    }
  };

  const viewTrip = (trip) => {
    sessionStorage.setItem('generatedTrip', JSON.stringify(trip));
    navigate('/trip-result');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      case 'in-progress': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default: return 'bg-violet-500/20 text-violet-500 border-violet-500/30';
    }
  };

  const stats = [
    { label: 'Total Trips', value: trips.length, icon: Plane, gradient: 'from-violet-500 to-purple-600' },
    { label: 'Countries', value: [...new Set(trips.flatMap(t => t.destinations || []))].length, icon: MapPin, gradient: 'from-pink-500 to-rose-600' },
    { label: 'Days Planned', value: trips.reduce((acc, t) => acc + (t.total_days || 0), 0), icon: Calendar, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Upcoming', value: trips.filter(t => t.status === 'planned').length, icon: Clock, gradient: 'from-amber-500 to-orange-500' }
  ];

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--background)' }} data-testid="dashboard-page">
      <div className="bg-animated" />
      
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b" style={{ background: theme === 'dark' ? 'rgba(10, 10, 15, 0.8)' : 'rgba(250, 250, 255, 0.8)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Odyssey</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--card-bg)' }}>
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-violet-500" />}
            </button>
            <button onClick={() => navigate('/plan')} className="btn-gradient" data-testid="new-trip-btn">
              <Plus className="w-4 h-4 mr-2 inline" /> New Trip
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-shadow">
                  {user?.name?.charAt(0).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl" style={{ background: 'var(--background-secondary)', borderColor: 'var(--border)' }}>
                <DropdownMenuItem style={{ color: 'var(--foreground)' }}>
                  <span className="font-medium">{user?.name}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300 cursor-pointer" data-testid="logout-btn">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p style={{ color: 'var(--foreground-muted)' }}>Manage your upcoming adventures</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card-modern p-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-heading text-3xl font-bold text-gradient">{stat.value}</p>
                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Trips List */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Your Trips</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : trips.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-modern p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-violet-500" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>No trips yet</h3>
              <p className="mb-6" style={{ color: 'var(--foreground-muted)' }}>Start planning your first adventure!</p>
              <button onClick={() => navigate('/plan')} className="btn-gradient" data-testid="start-first-trip-btn">
                <Plus className="w-4 h-4 mr-2 inline" /> Plan Your First Trip
              </button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip, i) => (
                <motion.div key={trip.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-modern overflow-hidden group" data-testid={`trip-card-${trip.id}`}>
                  {/* Trip Image */}
                  <div className="relative h-44 overflow-hidden">
                    <img 
                      src={`https://source.unsplash.com/800x600/?${trip.destinations?.[0]?.split(',')[0]},travel`}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--background) 0%, transparent 100%)' }}></div>
                    <Badge className={`absolute top-4 right-4 ${getStatusColor(trip.status)}`}>
                      {trip.status || 'planned'}
                    </Badge>
                  </div>

                  {/* Trip Info */}
                  <div className="p-5">
                    <h3 className="font-heading text-xl font-semibold mb-2 line-clamp-1" style={{ color: 'var(--foreground)' }}>{trip.title}</h3>
                    
                    <div className="flex items-center gap-2 text-sm mb-3" style={{ color: 'var(--foreground-muted)' }}>
                      <MapPin className="w-4 h-4 text-violet-500" />
                      <span className="line-clamp-1">{trip.destinations?.join(' → ')}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-4" style={{ color: 'var(--foreground-muted)' }}>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {trip.total_days} days</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {formatPrice(trip.budget, 'USD')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => viewTrip(trip)} className="flex-1 btn-outline-modern text-sm py-2.5" data-testid={`view-trip-${trip.id}`}>
                        <Eye className="w-4 h-4 mr-2 inline" /> View Details
                      </button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--card-bg)', color: 'var(--foreground-muted)' }}>
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl" style={{ background: 'var(--background-secondary)', borderColor: 'var(--border)' }}>
                          <DropdownMenuItem onClick={() => deleteTrip(trip.id)} className="text-red-400 hover:text-red-300 cursor-pointer" data-testid={`delete-trip-${trip.id}`}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Trip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
