import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plane, MapPin, Calendar, Users, DollarSign, Sun, Cloud, CloudRain,
  ArrowRight, ArrowLeft, ExternalLink, Save, Share2, Utensils,
  Car, Train, Bus, Clock, Star, Eye, ChevronDown, ChevronUp,
  AlertCircle, Check, Globe, FileText, Home
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WeatherIcon = ({ condition }) => {
  const lower = condition?.toLowerCase() || '';
  if (lower.includes('rain')) return <CloudRain className="w-5 h-5 text-blue-400" />;
  if (lower.includes('cloud')) return <Cloud className="w-5 h-5 text-gray-400" />;
  return <Sun className="w-5 h-5 text-yellow-400" />;
};

const TransportIcon = ({ type }) => {
  const lower = type?.toLowerCase() || '';
  if (lower.includes('uber') || lower.includes('taxi') || lower.includes('car')) return <Car className="w-4 h-4" />;
  if (lower.includes('train') || lower.includes('metro')) return <Train className="w-4 h-4" />;
  if (lower.includes('bus')) return <Bus className="w-4 h-4" />;
  return <MapPin className="w-4 h-4" />;
};

export default function TripResultPage() {
  const navigate = useNavigate();
  const { user, getAuthHeader } = useAuth();
  const [trip, setTrip] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('itinerary');

  useEffect(() => {
    const storedTrip = sessionStorage.getItem('generatedTrip');
    if (storedTrip) {
      setTrip(JSON.parse(storedTrip));
      // Expand first day by default
      setExpandedDays({ 1: true });
    } else {
      navigate('/plan');
    }
  }, [navigate]);

  const toggleDay = (dayNum) => {
    setExpandedDays(prev => ({ ...prev, [dayNum]: !prev[dayNum] }));
  };

  const handleSaveTrip = async () => {
    if (!user) {
      toast.error('Please sign in to save your trip');
      navigate('/login');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/trips/save`, trip, {
        headers: getAuthHeader()
      });
      toast.success('Trip saved to your dashboard!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save trip');
    } finally {
      setSaving(false);
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currencySymbol = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AUD: 'A$', JPY: '¥' }[trip.currency] || trip.currency;

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="trip-result-page">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A38322] flex items-center justify-center">
              <Plane className="w-5 h-5 text-black" />
            </div>
            <span className="font-heading text-2xl text-white tracking-tight">Odyssey</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/plan')}
              className="border-white/20 text-white hover:bg-white/5"
              data-testid="plan-another-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Plan Another
            </Button>
            <Button
              onClick={handleSaveTrip}
              disabled={saving}
              className="bg-[#D4AF37] text-black hover:bg-[#E5C568]"
              data-testid="save-trip-btn"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Trip
                </>
              )}
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-20">
        {/* Hero Section */}
        <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
          <img 
            src={`https://source.unsplash.com/1920x1080/?${trip.destinations[0]?.split(',')[0]},travel`}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Badge className="bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 mb-4">
                AI Generated Itinerary
              </Badge>
              <h1 className="font-heading text-4xl md:text-5xl text-white mb-4">{trip.title}</h1>
              
              <div className="flex flex-wrap items-center gap-6 text-white/70">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-body">{trip.destinations.join(' → ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-body">{trip.total_days} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-body">{currencySymbol}{trip.budget?.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-[#0A0A0A] border border-white/10 p-1 rounded-xl mb-8">
              <TabsTrigger value="itinerary" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black rounded-lg" data-testid="tab-itinerary">
                <Calendar className="w-4 h-4 mr-2" />
                Itinerary
              </TabsTrigger>
              <TabsTrigger value="visa" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black rounded-lg" data-testid="tab-visa">
                <FileText className="w-4 h-4 mr-2" />
                Visa Info
              </TabsTrigger>
              <TabsTrigger value="flights" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black rounded-lg" data-testid="tab-flights">
                <Plane className="w-4 h-4 mr-2" />
                Flights
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black rounded-lg" data-testid="tab-bookings">
                <Globe className="w-4 h-4 mr-2" />
                Booking Links
              </TabsTrigger>
            </TabsList>

            {/* Itinerary Tab */}
            <TabsContent value="itinerary" className="space-y-4">
              {trip.itinerary?.map((day, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card-glass overflow-hidden"
                  data-testid={`day-card-${day.day_number}`}
                >
                  {/* Day Header */}
                  <button
                    onClick={() => toggleDay(day.day_number)}
                    className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/20 flex flex-col items-center justify-center">
                        <span className="text-[#D4AF37] font-heading text-xl">{day.day_number}</span>
                        <span className="text-white/40 text-xs">DAY</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-heading text-xl text-white">{day.location}</h3>
                        <p className="text-white/50 font-body text-sm">{day.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {day.weather && (
                        <div className="flex items-center gap-2 text-white/70">
                          <WeatherIcon condition={day.weather.condition} />
                          <span className="font-body text-sm">{day.weather.temp_high}°/{day.weather.temp_low}°</span>
                        </div>
                      )}
                      <div className="text-right">
                        <span className="text-[#D4AF37] font-body">{currencySymbol}{day.estimated_cost}</span>
                      </div>
                      {expandedDays[day.day_number] ? (
                        <ChevronUp className="w-5 h-5 text-white/50" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/50" />
                      )}
                    </div>
                  </button>

                  {/* Day Content */}
                  {expandedDays[day.day_number] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-white/10 p-6 space-y-8"
                    >
                      {/* Activities */}
                      {['morning_activities', 'afternoon_activities', 'evening_activities'].map((period) => {
                        const activities = day[period];
                        if (!activities?.length) return null;
                        
                        const periodLabel = period.replace('_activities', '').charAt(0).toUpperCase() + period.replace('_activities', '').slice(1);
                        
                        return (
                          <div key={period}>
                            <h4 className="text-[#D4AF37] uppercase tracking-wider text-xs font-body mb-4">{periodLabel}</h4>
                            <div className="space-y-3">
                              {activities.map((activity, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                                  <div className="w-1 bg-[#D4AF37]/50 rounded-full"></div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <h5 className="font-body font-medium text-white">{activity.name}</h5>
                                      {activity.cost > 0 && (
                                        <Badge variant="outline" className="border-white/20 text-white/70">
                                          {currencySymbol}{activity.cost}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-white/50 text-sm font-body mt-1">{activity.description}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                      {activity.duration && (
                                        <span className="text-white/40 text-xs flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> {activity.duration}
                                        </span>
                                      )}
                                      {activity.maps_link && (
                                        <a 
                                          href={activity.maps_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#14B8A6] text-xs flex items-center gap-1 hover:text-[#2DD4BF]"
                                        >
                                          <MapPin className="w-3 h-3" /> View on Maps
                                        </a>
                                      )}
                                    </div>
                                    {activity.tips && (
                                      <p className="text-[#D4AF37]/70 text-xs mt-2 italic">💡 {activity.tips}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {/* Restaurants */}
                      {day.restaurants?.length > 0 && (
                        <div>
                          <h4 className="text-[#D4AF37] uppercase tracking-wider text-xs font-body mb-4 flex items-center gap-2">
                            <Utensils className="w-4 h-4" /> Where to Eat
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {day.restaurants.map((restaurant, i) => (
                              <div key={i} className="p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-body font-medium text-white">{restaurant.name}</h5>
                                  <span className="text-[#D4AF37]">{restaurant.price_range}</span>
                                </div>
                                <p className="text-white/50 text-sm">{restaurant.cuisine}</p>
                                {restaurant.must_try?.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {restaurant.must_try.map((dish, j) => (
                                      <Badge key={j} variant="outline" className="border-white/10 text-white/60 text-xs">
                                        {dish}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-3 mt-3">
                                  {restaurant.maps_link && (
                                    <a href={restaurant.maps_link} target="_blank" rel="noopener noreferrer" className="text-[#14B8A6] text-xs hover:underline">
                                      Maps
                                    </a>
                                  )}
                                  {restaurant.booking_link && (
                                    <a href={restaurant.booking_link} target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] text-xs hover:underline">
                                      Reserve
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transportation */}
                      {day.transportation?.length > 0 && (
                        <div>
                          <h4 className="text-[#D4AF37] uppercase tracking-wider text-xs font-body mb-4 flex items-center gap-2">
                            <Car className="w-4 h-4" /> Getting Around
                          </h4>
                          <div className="space-y-2">
                            {day.transportation.map((transport, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <div className="flex items-center gap-3">
                                  <TransportIcon type={transport.type} />
                                  <span className="text-white/70 text-sm">
                                    {transport.from} → {transport.to}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-white/40 text-xs">{transport.duration}</span>
                                  <span className="text-[#D4AF37] text-sm">{currencySymbol}{transport.cost}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Day Trips */}
                      {day.day_trips?.length > 0 && (
                        <div>
                          <h4 className="text-[#D4AF37] uppercase tracking-wider text-xs font-body mb-4">
                            Optional Day Trips
                          </h4>
                          {day.day_trips.map((trip, i) => (
                            <div key={i} className="p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-body font-medium text-white">{trip.destination}</h5>
                                  <p className="text-white/50 text-sm mt-1">{trip.description}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[#D4AF37]">{currencySymbol}{trip.cost}</span>
                                  <p className="text-white/40 text-xs">{trip.duration}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </TabsContent>

            {/* Visa Tab */}
            <TabsContent value="visa" className="space-y-4">
              <div className="card-glass p-6">
                <h3 className="font-heading text-2xl text-white mb-6 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#D4AF37]" />
                  Visa Requirements
                </h3>
                
                <div className="space-y-4">
                  {trip.visa_requirements?.map((visa, i) => (
                    <div key={i} className="p-5 rounded-xl bg-white/5 border border-white/10" data-testid={`visa-card-${i}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-heading text-xl text-white">{visa.country}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {visa.visa_required ? (
                              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Visa Required
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                <Check className="w-3 h-3 mr-1" />
                                Visa Free / On Arrival
                              </Badge>
                            )}
                          </div>
                        </div>
                        {visa.apply_link && (
                          <a
                            href={visa.apply_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-sm flex items-center gap-2"
                          >
                            Apply Now <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-white/40 block">Type</span>
                          <span className="text-white">{visa.visa_type || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Processing Time</span>
                          <span className="text-white">{visa.processing_time || 'Varies'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">Estimated Cost</span>
                          <span className="text-white">{visa.cost ? `${currencySymbol}${visa.cost}` : 'Check website'}</span>
                        </div>
                      </div>
                      
                      {visa.notes && (
                        <p className="text-white/50 text-sm mt-4 p-3 rounded-lg bg-white/5">
                          ℹ️ {visa.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Flights Tab */}
            <TabsContent value="flights" className="space-y-4">
              <div className="card-glass p-6">
                <h3 className="font-heading text-2xl text-white mb-6 flex items-center gap-3">
                  <Plane className="w-6 h-6 text-[#D4AF37]" />
                  Suggested Flights
                </h3>
                
                <div className="space-y-4">
                  {trip.flights?.map((flight, i) => (
                    <div key={i} className="p-5 rounded-xl bg-white/5 border border-white/10" data-testid={`flight-card-${i}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-white font-heading text-xl">{flight.from}</p>
                            <p className="text-white/40 text-xs">{flight.date}</p>
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="h-px flex-1 bg-white/20"></div>
                            <Plane className="w-5 h-5 text-[#D4AF37] rotate-90" />
                            <div className="h-px flex-1 bg-white/20"></div>
                          </div>
                          <div className="text-center">
                            <p className="text-white font-heading text-xl">{flight.to}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[#D4AF37] font-heading text-2xl">
                              ~{currencySymbol}{flight.estimated_price}
                            </p>
                            <p className="text-white/40 text-xs">per person</p>
                          </div>
                        </div>
                      </div>
                      
                      {flight.airlines?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {flight.airlines.map((airline, j) => (
                            <Badge key={j} variant="outline" className="border-white/20 text-white/70">
                              {airline}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-3 mt-4">
                        {flight.booking_links && Object.entries(flight.booking_links).map(([name, url]) => (
                          <a
                            key={name}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="booking-btn"
                          >
                            {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Booking Links Tab */}
            <TabsContent value="bookings" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {trip.booking_links && Object.entries(trip.booking_links).map(([category, links]) => (
                  <div key={category} className="card-glass p-6" data-testid={`booking-category-${category}`}>
                    <h3 className="font-heading text-xl text-white mb-4 capitalize">
                      {category.replace('_', ' ')}
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(links).map(([name, url]) => (
                        <a
                          key={name}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-white font-body capitalize">{name.replace('_', ' ')}</span>
                          <ExternalLink className="w-4 h-4 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Summary Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="glass-gold rounded-full px-8 py-4 flex items-center gap-8 shadow-2xl">
              <div className="text-center">
                <p className="text-white/50 text-xs">Estimated Total</p>
                <p className="text-[#D4AF37] font-heading text-xl">{currencySymbol}{trip.total_estimated_cost?.toLocaleString()}</p>
              </div>
              <div className="h-10 w-px bg-white/20"></div>
              <Button
                onClick={handleSaveTrip}
                disabled={saving}
                className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full"
                data-testid="floating-save-btn"
              >
                {saving ? 'Saving...' : 'Save This Trip'}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
