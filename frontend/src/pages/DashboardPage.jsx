import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plane, MapPin, Calendar, Plus, Trash2, Eye, LogOut,
  ChevronRight, Clock, DollarSign, Users, MoreVertical
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
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout, getAuthHeader } = useAuth();
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
      case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'in-progress': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      default: return 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="dashboard-page">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A38322] flex items-center justify-center">
              <Plane className="w-5 h-5 text-black" />
            </div>
            <span className="font-heading text-2xl text-white tracking-tight">Odyssey</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/plan')}
              className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full"
              data-testid="new-trip-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Trip
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-colors">
                  {user?.name?.charAt(0).toUpperCase()}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-white/10">
                <DropdownMenuItem className="text-white/70">
                  <span className="font-body">{user?.name}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white/50 text-sm">
                  {user?.email}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 cursor-pointer"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="font-heading text-4xl md:text-5xl text-white mb-2">
              Welcome back, <span className="text-gradient-gold">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-white/50 font-body">Manage your upcoming adventures</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Total Trips', value: trips.length, icon: Plane },
              { label: 'Countries', value: [...new Set(trips.flatMap(t => t.destinations))].length, icon: MapPin },
              { label: 'Days Planned', value: trips.reduce((acc, t) => acc + (t.total_days || 0), 0), icon: Calendar },
              { label: 'Planned', value: trips.filter(t => t.status === 'planned').length, icon: Clock }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-glass p-6"
              >
                <stat.icon className="w-6 h-6 text-[#D4AF37] mb-3" />
                <p className="font-heading text-3xl text-white">{stat.value}</p>
                <p className="text-white/50 text-sm font-body">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Trips List */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl text-white">Your Trips</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : trips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-glass p-12 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <Plane className="w-10 h-10 text-[#D4AF37]" />
              </div>
              <h3 className="font-heading text-2xl text-white mb-2">No trips yet</h3>
              <p className="text-white/50 font-body mb-6">Start planning your first adventure!</p>
              <Button
                onClick={() => navigate('/plan')}
                className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full"
                data-testid="start-first-trip-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Plan Your First Trip
              </Button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip, i) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card-glass overflow-hidden group hover:border-[#D4AF37]/30"
                  data-testid={`trip-card-${trip.id}`}
                >
                  {/* Trip Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={`https://source.unsplash.com/800x600/?${trip.destinations?.[0]?.split(',')[0]},travel`}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
                    <Badge className={`absolute top-4 right-4 ${getStatusColor(trip.status)}`}>
                      {trip.status || 'planned'}
                    </Badge>
                  </div>

                  {/* Trip Info */}
                  <div className="p-5">
                    <h3 className="font-heading text-xl text-white mb-2 line-clamp-1">{trip.title}</h3>
                    
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                      <MapPin className="w-4 h-4 text-[#D4AF37]" />
                      <span className="line-clamp-1">{trip.destinations?.join(' → ')}</span>
                    </div>

                    <div className="flex items-center gap-4 text-white/40 text-sm mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {trip.total_days} days
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {trip.currency} {trip.budget?.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => viewTrip(trip)}
                        className="flex-1 bg-white/5 text-white hover:bg-white/10"
                        data-testid={`view-trip-${trip.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white/50 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0A0A0A] border-white/10">
                          <DropdownMenuItem 
                            onClick={() => deleteTrip(trip.id)}
                            className="text-red-400 hover:text-red-300 cursor-pointer"
                            data-testid={`delete-trip-${trip.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Trip
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
