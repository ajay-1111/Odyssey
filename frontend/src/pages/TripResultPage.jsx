import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plane, MapPin, Calendar, Users, DollarSign, Sun, Cloud, CloudRain,
  ArrowRight, ArrowLeft, ExternalLink, Save, Share2, Utensils,
  Car, Train, Bus, Clock, Star, ChevronDown, ChevronUp,
  AlertCircle, Check, Globe, FileText, Home, Mail, 
  Footprints, Bike, Ship, Shield, Dumbbell, Luggage, Moon,
  Thermometer, Droplets, CheckCircle, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WeatherIcon = ({ condition }) => {
  const lower = condition?.toLowerCase() || '';
  if (lower.includes('rain')) return <CloudRain className="w-5 h-5 text-blue-400" />;
  if (lower.includes('cloud')) return <Cloud className="w-5 h-5 text-gray-400" />;
  return <Sun className="w-5 h-5 text-amber-400" />;
};

const TransportIcon = ({ type }) => {
  const lower = type?.toLowerCase() || '';
  if (lower.includes('uber') || lower.includes('taxi') || lower.includes('car') || lower.includes('lyft') || lower.includes('bolt')) return <Car className="w-4 h-4" />;
  if (lower.includes('train') || lower.includes('metro') || lower.includes('subway') || lower.includes('tram')) return <Train className="w-4 h-4" />;
  if (lower.includes('bus') || lower.includes('coach')) return <Bus className="w-4 h-4" />;
  if (lower.includes('walk')) return <Footprints className="w-4 h-4" />;
  if (lower.includes('bike') || lower.includes('cycle')) return <Bike className="w-4 h-4" />;
  if (lower.includes('ferry') || lower.includes('boat')) return <Ship className="w-4 h-4" />;
  return <MapPin className="w-4 h-4" />;
};

export default function TripResultPage() {
  const navigate = useNavigate();
  const { user, getAuthHeader } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, currencies, formatPrice, getSymbol } = useCurrency();
  const [trip, setTrip] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState('itinerary');

  useEffect(() => {
    const storedTrip = sessionStorage.getItem('generatedTrip');
    if (storedTrip) {
      setTrip(JSON.parse(storedTrip));
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
      const response = await axios.post(`${API_URL}/trips/save`, trip, {
        headers: getAuthHeader()
      });
      toast.success('Trip saved to your dashboard!');
      if (response.data?.trip_id) {
        setTrip(prev => ({ ...prev, id: response.data.trip_id }));
      }
    } catch (error) {
      toast.error('Failed to save trip');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!user) {
      toast.error('Please sign in to send trip to email');
      navigate('/login');
      return;
    }
    if (!trip.id || trip.id.includes('generated')) {
      toast.error('Please save the trip first');
      return;
    }
    setSendingEmail(true);
    try {
      await axios.post(`${API_URL}/trips/${trip.id}/send-email`, {}, {
        headers: getAuthHeader()
      });
      toast.success('Trip sent to your email!');
    } catch (error) {
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--background)' }} data-testid="trip-result-page">
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
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-24 h-10 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }} data-testid="currency-selector-result">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl" style={{ background: 'var(--background-secondary)' }}>
                {currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code} {c.symbol}</SelectItem>)}
              </SelectContent>
            </Select>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110" style={{ background: 'var(--card-bg)' }}>
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-violet-500" />}
            </button>
            <Button onClick={() => navigate('/plan')} variant="outline" className="rounded-xl transition-all hover:scale-105" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }} data-testid="plan-another-btn">
              <ArrowLeft className="w-4 h-4 mr-2" /> Plan Another
            </Button>
            <button onClick={handleSaveTrip} disabled={saving} className="btn-gradient btn-press" data-testid="save-trip-btn">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4 mr-2 inline" /> Save Trip</>}
            </button>
            <button onClick={handleSendEmail} disabled={sendingEmail || !user} className="btn-outline-modern hidden sm:flex items-center gap-2 transition-all hover:scale-105" data-testid="email-trip-btn">
              {sendingEmail ? <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /> : <><Mail className="w-4 h-4" /> Email</>}
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-32">
        {/* Hero Section */}
        <div className="relative h-[40vh] min-h-[320px] overflow-hidden">
          <img 
            src={`https://source.unsplash.com/1920x1080/?${trip.destinations?.[0]?.split(',')[0]},travel,landmark`}
            alt={trip.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--background) 0%, transparent 100%)' }}></div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="badge-modern inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4" />
                <span>AI Generated Itinerary</span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>{trip.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2" style={{ color: 'var(--foreground-muted)' }}>
                  <MapPin className="w-4 h-4 text-violet-500" />
                  <span>{trip.destinations?.join(' → ')}</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: 'var(--foreground-muted)' }}>
                  <Calendar className="w-4 h-4 text-violet-500" />
                  <span>{trip.total_days} days</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: 'var(--foreground-muted)' }}>
                  <DollarSign className="w-4 h-4 text-violet-500" />
                  <span>{formatPrice(trip.budget, 'USD')}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="glass p-1.5 rounded-2xl mb-8 flex flex-wrap gap-1">
              {[
                { value: 'itinerary', icon: Calendar, label: 'Itinerary' },
                { value: 'visa', icon: FileText, label: 'Visa Info' },
                { value: 'flights', icon: Plane, label: 'Flights' },
                { value: 'insurance', icon: Shield, label: 'Insurance' },
                { value: 'packing', icon: Luggage, label: 'Packing' },
                { value: 'bookings', icon: Globe, label: 'Booking Links' }
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl px-4 py-2.5" data-testid={`tab-${tab.value}`}>
                  <tab.icon className="w-4 h-4 mr-2" />{tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Itinerary Tab */}
            <TabsContent value="itinerary" className="space-y-4">
              {trip.itinerary?.map((day, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="card-modern overflow-hidden" data-testid={`day-card-${day.day_number}`}>
                  <button onClick={() => toggleDay(day.day_number)} className="w-full p-6 flex items-center justify-between transition-colors" style={{ background: expandedDays[day.day_number] ? 'var(--card-hover)' : 'transparent' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex flex-col items-center justify-center">
                        <span className="text-gradient font-heading text-xl font-bold">{day.day_number}</span>
                        <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>DAY</span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-heading text-xl font-semibold" style={{ color: 'var(--foreground)' }}>{day.location}</h3>
                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{day.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6">
                      {day.weather && (
                        <div className="hidden sm:flex items-center gap-2" style={{ color: 'var(--foreground-muted)' }}>
                          <WeatherIcon condition={day.weather.condition} />
                          <span className="text-sm">{day.weather.temp_high}°/{day.weather.temp_low}°</span>
                        </div>
                      )}
                      <div className="text-right">
                        <span className="text-gradient font-semibold">{formatPrice(day.estimated_cost, 'USD')}</span>
                      </div>
                      {expandedDays[day.day_number] ? <ChevronUp className="w-5 h-5" style={{ color: 'var(--foreground-muted)' }} /> : <ChevronDown className="w-5 h-5" style={{ color: 'var(--foreground-muted)' }} />}
                    </div>
                  </button>

                  {expandedDays[day.day_number] && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t p-6 space-y-8" style={{ borderColor: 'var(--border)' }}>
                      {/* Weather Card */}
                      {day.weather && (
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 flex items-center gap-6">
                          <WeatherIcon condition={day.weather.condition} />
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1"><Thermometer className="w-4 h-4 text-orange-400" /><span style={{ color: 'var(--foreground)' }}>{day.weather.temp_high}°/{day.weather.temp_low}°</span></div>
                            {day.weather.humidity && <div className="flex items-center gap-1"><Droplets className="w-4 h-4 text-blue-400" /><span style={{ color: 'var(--foreground-muted)' }}>{day.weather.humidity}%</span></div>}
                            <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{day.weather.condition}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Activities */}
                      {['morning_activities', 'afternoon_activities', 'evening_activities'].map((period) => {
                        const activities = day[period];
                        if (!activities?.length) return null;
                        const periodLabel = period.replace('_activities', '').charAt(0).toUpperCase() + period.replace('_activities', '').slice(1);
                        const periodColors = { morning: 'from-amber-500 to-orange-500', afternoon: 'from-blue-500 to-cyan-500', evening: 'from-purple-500 to-pink-500' };
                        
                        return (
                          <div key={period}>
                            <h4 className={`text-transparent bg-clip-text bg-gradient-to-r ${periodColors[period.replace('_activities', '')]} uppercase tracking-wider text-xs font-bold mb-4`}>{periodLabel}</h4>
                            <div className="space-y-3">
                              {activities.map((activity, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl transition-colors" style={{ background: 'var(--card-bg)' }}>
                                  <div className={`w-1 bg-gradient-to-b ${periodColors[period.replace('_activities', '')]} rounded-full`}></div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                      <h5 className="font-semibold" style={{ color: 'var(--foreground)' }}>{activity.name}</h5>
                                      {activity.cost > 0 && <span className="badge-modern text-xs">{formatPrice(activity.cost, 'USD')}</span>}
                                    </div>
                                    <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>{activity.description}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                      {activity.duration && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}><Clock className="w-3 h-3" /> {activity.duration}</span>}
                                      {activity.maps_link && <a href={activity.maps_link} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 text-emerald-500 hover:text-emerald-400"><MapPin className="w-3 h-3" /> View on Maps</a>}
                                    </div>
                                    {activity.tips && <p className="text-xs mt-2 italic text-amber-500/80">💡 {activity.tips}</p>}
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
                          <h4 className="text-pink-500 uppercase tracking-wider text-xs font-bold mb-4 flex items-center gap-2"><Utensils className="w-4 h-4" /> Where to Eat</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {day.restaurants.map((restaurant, i) => (
                              <div key={i} className="p-4 rounded-2xl transition-colors" style={{ background: 'var(--card-bg)' }}>
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-semibold" style={{ color: 'var(--foreground)' }}>{restaurant.name}</h5>
                                  <span className="text-pink-500">{restaurant.price_range}</span>
                                </div>
                                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{restaurant.cuisine}</p>
                                {restaurant.must_try?.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {restaurant.must_try.map((dish, j) => <Badge key={j} variant="outline" className="text-xs" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}>{dish}</Badge>)}
                                  </div>
                                )}
                                <div className="flex items-center gap-3 mt-3">
                                  {restaurant.maps_link && <a href={restaurant.maps_link} target="_blank" rel="noopener noreferrer" className="text-emerald-500 text-xs hover:underline">Maps</a>}
                                  {restaurant.booking_link && <a href={restaurant.booking_link} target="_blank" rel="noopener noreferrer" className="text-violet-500 text-xs hover:underline">Reserve</a>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transportation */}
                      {day.transportation?.length > 0 && (
                        <div>
                          <h4 className="text-blue-500 uppercase tracking-wider text-xs font-bold mb-4 flex items-center gap-2"><Car className="w-4 h-4" /> Getting Around</h4>
                          <div className="space-y-2">
                            {day.transportation.map((transport, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--card-bg)' }}>
                                <div className="flex items-center gap-3">
                                  <TransportIcon type={transport.type} />
                                  <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{transport.from} → {transport.to}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{transport.duration}</span>
                                  <span className="text-gradient text-sm font-medium">{formatPrice(transport.cost, 'USD')}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fitness Activities */}
                      {day.fitness_activities?.length > 0 && (
                        <div>
                          <h4 className="text-emerald-500 uppercase tracking-wider text-xs font-bold mb-4 flex items-center gap-2"><Dumbbell className="w-4 h-4" /> Fitness Options</h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            {day.fitness_activities.map((fitness, i) => (
                              <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                                <h5 className="font-semibold" style={{ color: 'var(--foreground)' }}>{fitness.name}</h5>
                                <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{fitness.type} • {fitness.time}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-emerald-500">{formatPrice(fitness.cost, 'USD')}</span>
                                  {fitness.booking_link && <a href={fitness.booking_link} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 hover:underline">Book</a>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </TabsContent>

            {/* Visa Tab */}
            <TabsContent value="visa" className="space-y-4">
              <div className="card-modern p-6">
                <h3 className="font-heading text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                  <FileText className="w-6 h-6 text-violet-500" /> Visa Requirements
                </h3>
                <div className="space-y-4">
                  {trip.visa_requirements?.length > 0 ? trip.visa_requirements.map((visa, i) => (
                    <div key={i} className="p-5 rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }} data-testid={`visa-card-${i}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-heading text-xl font-semibold" style={{ color: 'var(--foreground)' }}>{visa.country}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {visa.visa_required ? (
                              <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Visa Required</Badge>
                            ) : (
                              <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30"><Check className="w-3 h-3 mr-1" /> Visa Free</Badge>
                            )}
                          </div>
                        </div>
                        {visa.apply_link && <a href={visa.apply_link} target="_blank" rel="noopener noreferrer" className="btn-gradient text-sm flex items-center gap-2">Apply Now <ExternalLink className="w-4 h-4" /></a>}
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div><span className="block" style={{ color: 'var(--foreground-muted)' }}>Type</span><span style={{ color: 'var(--foreground)' }}>{visa.visa_type || visa.type || 'N/A'}</span></div>
                        <div><span className="block" style={{ color: 'var(--foreground-muted)' }}>Processing Time</span><span style={{ color: 'var(--foreground)' }}>{visa.processing_time || 'Varies'}</span></div>
                        <div><span className="block" style={{ color: 'var(--foreground-muted)' }}>Estimated Cost</span><span style={{ color: 'var(--foreground)' }}>{visa.cost ? formatPrice(visa.cost, 'USD') : 'Check website'}</span></div>
                      </div>
                      {visa.notes && <p className="text-sm mt-4 p-3 rounded-xl" style={{ background: 'var(--background)', color: 'var(--foreground-muted)' }}>ℹ️ {visa.notes}</p>}
                    </div>
                  )) : <p style={{ color: 'var(--foreground-muted)' }}>No visa information available. Please check requirements based on your passport.</p>}
                </div>
              </div>
            </TabsContent>

            {/* Flights Tab */}
            <TabsContent value="flights" className="space-y-4">
              <div className="card-modern p-6">
                <h3 className="font-heading text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                  <Plane className="w-6 h-6 text-violet-500" /> Suggested Flights
                </h3>
                <div className="space-y-4">
                  {trip.flights?.length > 0 ? trip.flights.map((flight, i) => (
                    <div key={i} className="p-5 rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }} data-testid={`flight-card-${i}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="font-heading text-xl font-semibold" style={{ color: 'var(--foreground)' }}>{flight.from_airport || flight.from}</p>
                            <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{flight.date}</p>
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="h-px flex-1" style={{ background: 'var(--border)' }}></div>
                            <Plane className="w-5 h-5 text-violet-500 rotate-90" />
                            <div className="h-px flex-1" style={{ background: 'var(--border)' }}></div>
                          </div>
                          <div className="text-center">
                            <p className="font-heading text-xl font-semibold" style={{ color: 'var(--foreground)' }}>{flight.to_airport || flight.to}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gradient font-heading text-2xl font-bold">~{formatPrice(flight.estimated_price, 'USD')}</p>
                          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>per person • {flight.cabin_class || trip.cabin_class || 'Economy'}</p>
                        </div>
                      </div>
                      {flight.baggage && (
                        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                          <p className="text-xs font-medium text-violet-400 mb-1">Baggage Allowance</p>
                          <div className="flex gap-4 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                            <span>Cabin: {flight.baggage.cabin?.weight}</span>
                            <span>Checked: {flight.baggage.checked?.weight}</span>
                          </div>
                        </div>
                      )}
                      {flight.airlines?.length > 0 && <div className="flex flex-wrap gap-2 mt-4">{flight.airlines.map((airline, j) => <Badge key={j} variant="outline" style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}>{airline}</Badge>)}</div>}
                      <div className="flex flex-wrap gap-3 mt-4">
                        {flight.booking_links && Object.entries(flight.booking_links).map(([name, url]) => (
                          <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                            {name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')} <ExternalLink className="w-3 h-3 inline ml-1" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )) : <p style={{ color: 'var(--foreground-muted)' }}>No flight suggestions available.</p>}
                </div>
              </div>
            </TabsContent>

            {/* Insurance Tab */}
            <TabsContent value="insurance" className="space-y-4">
              <div className="card-modern p-6">
                <h3 className="font-heading text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                  <Shield className="w-6 h-6 text-emerald-500" /> Travel Insurance
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {(trip.insurance_recommendations || [
                    { name: 'World Nomads', price: 45, coverage: 'Comprehensive', link: 'https://worldnomads.com', best_for: 'Adventure travelers' },
                    { name: 'SafetyWing', price: 42, coverage: 'Medical + Travel', link: 'https://safetywing.com', best_for: 'Digital nomads' },
                    { name: 'Allianz Travel', price: 55, coverage: 'Full coverage', link: 'https://allianztravelinsurance.com', best_for: 'Families' }
                  ]).map((ins, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                      <h4 className="font-heading text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{ins.name || ins.provider}</h4>
                      <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>{ins.coverage}</p>
                      {ins.best_for && <p className="text-xs text-emerald-500 mt-1">Best for: {ins.best_for}</p>}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-emerald-400 font-semibold">{ins.price ? `From ${formatPrice(ins.price, 'USD')}` : ins.price_range}</span>
                        {(ins.link || ins.url) && <a href={ins.link || ins.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-sm hover:underline flex items-center gap-1">Get Quote <ExternalLink className="w-3 h-3" /></a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Packing Tab */}
            <TabsContent value="packing" className="space-y-4">
              <div className="card-modern p-6">
                <h3 className="font-heading text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                  <Luggage className="w-6 h-6 text-orange-500" /> Packing Checklist
                </h3>
                {trip.packing_suggestions ? (
                  <div className="space-y-6">
                    {Object.entries(trip.packing_suggestions).map(([category, items]) => (
                      <div key={category}>
                        <h4 className="text-orange-500 uppercase tracking-wider text-xs font-bold mb-3">{category.replace('_', ' ')}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {(Array.isArray(items) ? items : []).map((item, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm" style={{ color: 'var(--foreground)' }}>{typeof item === 'string' ? item : item.item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {['Documents', 'Clothing', 'Toiletries', 'Electronics', 'Health'].map(cat => (
                      <div key={cat}>
                        <h4 className="text-orange-500 uppercase tracking-wider text-xs font-bold mb-3">{cat}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {(cat === 'Documents' ? ['Passport', 'Visa', 'Travel Insurance', 'Flight Tickets', 'Hotel Bookings', 'ID Card'] :
                            cat === 'Clothing' ? ['T-shirts', 'Pants', 'Underwear', 'Socks', 'Comfortable Shoes', 'Jacket'] :
                            cat === 'Toiletries' ? ['Toothbrush', 'Toothpaste', 'Sunscreen', 'Deodorant', 'Shampoo', 'Razor'] :
                            cat === 'Electronics' ? ['Phone Charger', 'Power Bank', 'Universal Adapter', 'Camera', 'Headphones'] :
                            ['Medications', 'First Aid Kit', 'Hand Sanitizer', 'Pain Relievers', 'Insect Repellent']
                          ).map((item, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm" style={{ color: 'var(--foreground)' }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Booking Links Tab */}
            <TabsContent value="bookings" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                {(trip.booking_links && Object.keys(trip.booking_links).length > 0 ? Object.entries(trip.booking_links) : [
                  ['flights', { skyscanner: 'https://skyscanner.com', google_flights: 'https://google.com/flights', kayak: 'https://kayak.com', momondo: 'https://momondo.com' }],
                  ['hotels', { booking: 'https://booking.com', airbnb: 'https://airbnb.com', agoda: 'https://agoda.com', hotels: 'https://hotels.com' }],
                  ['transportation', { uber: 'https://uber.com', rome2rio: 'https://rome2rio.com', rentalcars: 'https://rentalcars.com' }],
                  ['experiences', { getyourguide: 'https://getyourguide.com', viator: 'https://viator.com', klook: 'https://klook.com' }]
                ]).map(([category, links]) => (
                  <div key={category} className="card-modern p-6" data-testid={`booking-category-${category}`}>
                    <h3 className="font-heading text-xl font-semibold mb-4 capitalize" style={{ color: 'var(--foreground)' }}>{category.replace('_', ' ')}</h3>
                    <div className="space-y-3">
                      {Object.entries(links).map(([name, url]) => (
                        <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl transition-colors group" style={{ background: 'var(--card-bg)' }}>
                          <span className="capitalize" style={{ color: 'var(--foreground)' }}>{name.replace('_', ' ')}</span>
                          <ExternalLink className="w-4 h-4 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Floating Summary Bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="glass-strong rounded-full px-6 sm:px-8 py-4 flex items-center gap-6 sm:gap-8 shadow-2xl">
              <div className="text-center hidden sm:block">
                <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Estimated Total</p>
                <p className="text-gradient font-heading text-xl font-bold">{formatPrice(trip.total_estimated_cost || trip.budget * 0.85, 'USD')}</p>
              </div>
              <div className="h-10 w-px hidden sm:block" style={{ background: 'var(--border)' }}></div>
              <button onClick={handleSaveTrip} disabled={saving} className="btn-gradient rounded-full" data-testid="floating-save-btn">
                {saving ? 'Saving...' : 'Save This Trip'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Add missing import
const Sparkles = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
);
