import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, MapPin, Calendar, Users, DollarSign, Utensils,
  ArrowRight, ArrowLeft, Plus, X, Sparkles, Home, Heart,
  Baby, User, UserCheck, Check, Sun, Moon, Globe,
  Briefcase, Hotel, Shield, Dumbbell, Flag, Luggage
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { format, differenceInDays } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STEPS = [
  { id: 1, title: "Trip Type", icon: Briefcase },
  { id: 2, title: "Passport", icon: Flag },
  { id: 3, title: "Destinations", icon: MapPin },
  { id: 4, title: "Dates", icon: Calendar },
  { id: 5, title: "Travelers", icon: Users },
  { id: 6, title: "Preferences", icon: Heart }
];

const INTERESTS = [
  "History & Culture", "Nature & Outdoors", "Beach & Relaxation", 
  "Adventure Sports", "Food & Culinary", "Art & Museums",
  "Shopping", "Nightlife", "Photography", "Architecture",
  "Wildlife & Safari", "Wellness & Spa", "Local Experiences"
];

const FITNESS_OPTIONS = [
  "Gym Access", "Running/Jogging", "Yoga Classes", "Swimming",
  "Cycling", "Marathons", "CrossFit", "Zumba/Dance", "Hiking", "Water Sports"
];

const CityAutocomplete = ({ value, onChange, placeholder, testId }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sync query with external value prop
  const prevValue = useRef(value);
  if (prevValue.current !== value) {
    prevValue.current = value;
    if (query !== (value || '')) {
      setQuery(value || '');
    }
  }

  const fetchSuggestions = async (q) => {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const response = await axios.get(`${API_URL}/autocomplete/cities?q=${encodeURIComponent(q)}`);
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) { console.error('Autocomplete error'); }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    fetchSuggestions(val);
  };

  const selectSuggestion = (city) => {
    const formatted = `${city.city}, ${city.country}`;
    setQuery(formatted);
    onChange(formatted, city);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && fetchSuggestions(query)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className="input-modern h-14 w-full"
        data-testid={testId}
      />
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 w-full mt-2 rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}>
            <ScrollArea className="max-h-60">
              {suggestions.map((city, i) => (
                <button key={i} onClick={() => selectSuggestion(city)} className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors hover:bg-violet-500/10">
                  <MapPin className="w-4 h-4 text-violet-500" />
                  <span style={{ color: 'var(--foreground)' }}>{city.city}, <span style={{ color: 'var(--foreground-muted)' }}>{city.country}</span></span>
                  {city.airports && <span className="ml-auto text-xs text-violet-500">{city.airports.length} airports</span>}
                </button>
              ))}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function PlanTripPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, currencies, formatPrice, getSymbol } = useCurrency();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);

  const [customerType, setCustomerType] = useState('fresh');
  const [existingBookings, setExistingBookings] = useState({
    hasFlight: false, flightDetails: { departureTime: '', arrivalTime: '', returnDepartureTime: '', returnArrivalTime: '' },
    hasHotel: false, hotelDetails: { name: '', address: '' },
    hasInsurance: false
  });
  const [passportCountries, setPassportCountries] = useState([]);
  const [departure, setDeparture] = useState('');
  const [departureAirports, setDepartureAirports] = useState([]);
  const [selectedDepartureAirports, setSelectedDepartureAirports] = useState([]);
  const [destinations, setDestinations] = useState([{ city: '', airports: [] }]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [budget, setBudget] = useState('');
  const [travelers, setTravelers] = useState({ adults: 1, children_above_10: 0, children_below_10: 0, seniors: 0, infants: 0 });
  const [foodPreference, setFoodPreference] = useState('No preference');
  const [accommodationType, setAccommodationType] = useState('mid-range');
  const [interests, setInterests] = useState([]);
  const [fitnessInterests, setFitnessInterests] = useState([]);
  const [needInsurance, setNeedInsurance] = useState(true);
  const [cabinClass, setCabinClass] = useState('economy');

  useEffect(() => {
    axios.get(`${API_URL}/countries`).then(res => setCountries(res.data)).catch(() => {});
  }, []);

  const handleDepartureChange = (value, cityData) => {
    setDeparture(value);
    if (cityData?.airports) {
      setDepartureAirports(cityData.airports);
      setSelectedDepartureAirports(cityData.airports.map(a => a.code));
    }
  };

  const addDestination = () => { if (destinations.length < 5) setDestinations([...destinations, { city: '', airports: [] }]); };
  const removeDestination = (index) => { if (destinations.length > 1) setDestinations(destinations.filter((_, i) => i !== index)); };
  const updateDestination = (index, value, cityData) => {
    const newDests = [...destinations];
    newDests[index] = { city: value, airports: cityData?.airports || [] };
    setDestinations(newDests);
  };

  const togglePassport = (code) => {
    setPassportCountries(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const toggleInterest = (interest) => {
    setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : prev.length < 5 ? [...prev, interest] : prev);
  };

  const toggleFitness = (fitness) => {
    setFitnessInterests(prev => prev.includes(fitness) ? prev.filter(f => f !== fitness) : [...prev, fitness]);
  };

  const totalTravelers = Object.values(travelers).reduce((a, b) => a + b, 0);
  const tripDays = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;

  const canProceed = () => {
    switch (currentStep) {
      case 1: return customerType;
      case 2: return passportCountries.length > 0;
      case 3: return departure.trim() && destinations.some(d => d.city.trim());
      case 4: return startDate && endDate && tripDays > 0;
      case 5: return totalTravelers > 0 && budget > 0;
      case 6: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const tripRequest = {
        customer_type: customerType,
        existing_bookings: customerType !== 'fresh' ? { has_flight: existingBookings.hasFlight, flight_details: existingBookings.flightDetails, has_hotel: existingBookings.hasHotel, hotel_details: existingBookings.hotelDetails, has_insurance: existingBookings.hasInsurance } : null,
        passport_countries: passportCountries,
        departure_location: departure,
        departure_airports: selectedDepartureAirports,
        destinations: destinations.filter(d => d.city.trim()).map(d => d.city),
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        budget: parseFloat(budget),
        currency,
        travelers,
        food_preferences: foodPreference,
        accommodation_type: accommodationType,
        interests,
        fitness_interests: fitnessInterests,
        need_insurance: needInsurance && !existingBookings.hasInsurance,
        cabin_class: cabinClass
      };
      const response = await axios.post(`${API_URL}/trips/generate`, tripRequest);
      sessionStorage.setItem('generatedTrip', JSON.stringify(response.data));
      navigate('/trip-result');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--background)' }} data-testid="plan-trip-page">
      <div className="bg-animated" />
      
      {/* Nav */}
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
              <SelectTrigger className="w-20 h-9 text-xs rounded-xl border-0" style={{ background: 'var(--card-bg)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl" style={{ background: 'var(--background-secondary)' }}>
                {currencies.slice(0, 10).map(c => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--card-bg)' }}>
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-violet-500" />}
            </button>
            <Link to="/" className="hidden sm:flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--foreground-muted)' }}>
              <Home className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    currentStep === step.id ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30' : 
                    currentStep > step.id ? 'bg-emerald-500/20 text-emerald-500' : ''
                  }`} style={{ background: currentStep < step.id ? 'var(--card-bg)' : undefined, color: currentStep < step.id ? 'var(--foreground-muted)' : undefined }}>
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs mt-2 font-medium hidden md:block" style={{ color: currentStep >= step.id ? 'var(--foreground)' : 'var(--foreground-muted)' }}>{step.title}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-8 sm:w-16 h-1 mx-2 rounded-full ${currentStep > step.id ? 'bg-gradient-to-r from-violet-500 to-purple-500' : ''}`} style={{ background: currentStep <= step.id ? 'var(--border)' : undefined }} />}
              </div>
            ))}
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="card-modern p-8">
              
              {/* Step 1: Trip Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>How can we help you?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>Select what best describes your situation</p>
                  </div>
                  <RadioGroup value={customerType} onValueChange={setCustomerType} className="space-y-4">
                    {[
                      { value: 'fresh', icon: Sparkles, title: 'Plan Everything Fresh', desc: 'I need help with flights, hotels, and complete itinerary', gradient: 'from-violet-500 to-purple-600' },
                      { value: 'partial', icon: Briefcase, title: 'Partial Booking', desc: 'I have some bookings and need help with the rest', gradient: 'from-blue-500 to-cyan-500' },
                      { value: 'plan_only', icon: Calendar, title: 'Itinerary Only', desc: 'I have flights & hotels, just need day-wise planning', gradient: 'from-emerald-500 to-teal-500' }
                    ].map((type) => (
                      <label key={type.value} className={`flex items-start gap-4 p-6 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] ${customerType === type.value ? 'ring-2 ring-violet-500' : ''}`} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <RadioGroupItem value={type.value} className="mt-1" />
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center flex-shrink-0`}>
                          <type.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>{type.title}</span>
                          <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>{type.desc}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>

                  {(customerType === 'partial' || customerType === 'plan_only') && (
                    <div className="space-y-4 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                      <h3 className="font-heading text-xl font-bold" style={{ color: 'var(--foreground)' }}>Your Existing Bookings</h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: 'var(--card-bg)' }}>
                          <Checkbox checked={existingBookings.hasFlight} onCheckedChange={(c) => setExistingBookings({...existingBookings, hasFlight: c})} />
                          <Plane className="w-5 h-5 text-violet-500" />
                          <span style={{ color: 'var(--foreground)' }}>I have booked my flights</span>
                        </label>
                        {existingBookings.hasFlight && (
                          <div className="grid grid-cols-2 gap-3 pl-12">
                            <div><Label className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Departure Time</Label><input type="datetime-local" value={existingBookings.flightDetails.departureTime} onChange={(e) => setExistingBookings({...existingBookings, flightDetails: {...existingBookings.flightDetails, departureTime: e.target.value}})} className="input-modern h-11 text-sm" /></div>
                            <div><Label className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Arrival Time</Label><input type="datetime-local" value={existingBookings.flightDetails.arrivalTime} onChange={(e) => setExistingBookings({...existingBookings, flightDetails: {...existingBookings.flightDetails, arrivalTime: e.target.value}})} className="input-modern h-11 text-sm" /></div>
                            <div><Label className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Return Departure</Label><input type="datetime-local" value={existingBookings.flightDetails.returnDepartureTime} onChange={(e) => setExistingBookings({...existingBookings, flightDetails: {...existingBookings.flightDetails, returnDepartureTime: e.target.value}})} className="input-modern h-11 text-sm" /></div>
                            <div><Label className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Return Arrival</Label><input type="datetime-local" value={existingBookings.flightDetails.returnArrivalTime} onChange={(e) => setExistingBookings({...existingBookings, flightDetails: {...existingBookings.flightDetails, returnArrivalTime: e.target.value}})} className="input-modern h-11 text-sm" /></div>
                          </div>
                        )}
                        <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: 'var(--card-bg)' }}>
                          <Checkbox checked={existingBookings.hasHotel} onCheckedChange={(c) => setExistingBookings({...existingBookings, hasHotel: c})} />
                          <Hotel className="w-5 h-5 text-violet-500" />
                          <span style={{ color: 'var(--foreground)' }}>I have booked accommodation</span>
                        </label>
                        {existingBookings.hasHotel && (
                          <div className="grid grid-cols-2 gap-3 pl-12">
                            <div className="col-span-2"><Label className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Hotel Name</Label><input value={existingBookings.hotelDetails.name} onChange={(e) => setExistingBookings({...existingBookings, hotelDetails: {...existingBookings.hotelDetails, name: e.target.value}})} placeholder="e.g., Marriott" className="input-modern h-11" /></div>
                          </div>
                        )}
                        <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer" style={{ background: 'var(--card-bg)' }}>
                          <Checkbox checked={existingBookings.hasInsurance} onCheckedChange={(c) => setExistingBookings({...existingBookings, hasInsurance: c})} />
                          <Shield className="w-5 h-5 text-violet-500" />
                          <span style={{ color: 'var(--foreground)' }}>I have travel insurance</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Passport */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Your Passport(s)</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>Select all passports you hold for accurate visa requirements</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {countries.map((country) => (
                      <button key={country.code} onClick={() => togglePassport(country.code)} className={`p-4 rounded-2xl text-left transition-all hover:scale-[1.02] ${passportCountries.includes(country.code) ? 'ring-2 ring-violet-500' : ''}`} style={{ background: passportCountries.includes(country.code) ? 'rgba(139, 92, 246, 0.1)' : 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <span className="text-3xl">{country.flag}</span>
                        <p className="text-sm mt-2 font-medium truncate" style={{ color: 'var(--foreground)' }}>{country.name}</p>
                        {passportCountries.includes(country.code) && <Check className="w-4 h-4 text-violet-500 mt-1" />}
                      </button>
                    ))}
                  </div>
                  {passportCountries.length > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                      <p className="text-violet-400 text-sm"><span className="font-semibold">Selected:</span> {passportCountries.map(code => countries.find(c => c.code === code)?.name).join(', ')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Destinations */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Where's your adventure?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>Start typing to search cities with airports</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Departure City</Label>
                      <div className="relative">
                        <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500 z-10" />
                        <div className="pl-12"><CityAutocomplete value={departure} onChange={handleDepartureChange} placeholder="e.g., New York" testId="departure-input" /></div>
                      </div>
                      {departureAirports.length > 0 && (
                        <div className="mt-3 pl-12">
                          <Label className="text-xs mb-2 block" style={{ color: 'var(--foreground-muted)' }}>Search from airports:</Label>
                          <div className="flex flex-wrap gap-2">
                            {departureAirports.map((airport) => (
                              <button key={airport.code} onClick={() => setSelectedDepartureAirports(prev => prev.includes(airport.code) ? prev.filter(a => a !== airport.code) : [...prev, airport.code])} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${selectedDepartureAirports.includes(airport.code) ? 'bg-violet-500 text-white' : ''}`} style={{ background: !selectedDepartureAirports.includes(airport.code) ? 'var(--card-bg)' : undefined, color: !selectedDepartureAirports.includes(airport.code) ? 'var(--foreground-muted)' : undefined, border: '1px solid var(--border)' }}>
                                {airport.code}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Destination(s)</Label>
                      {destinations.map((dest, i) => (
                        <div key={i} className="relative mb-3">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500 z-10" />
                          <div className="pl-12 pr-12"><CityAutocomplete value={dest.city} onChange={(val, cityData) => updateDestination(i, val, cityData)} placeholder={`Destination ${i + 1}`} testId={`destination-input-${i}`} /></div>
                          {destinations.length > 1 && <button onClick={() => removeDestination(i)} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 z-10"><X className="w-5 h-5" /></button>}
                        </div>
                      ))}
                      {destinations.length < 5 && <button onClick={addDestination} className="flex items-center gap-2 text-violet-500 hover:text-violet-400 font-medium"><Plus className="w-4 h-4" /> Add Destination</button>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Dates */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>When are you traveling?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>Select your travel dates</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="input-modern h-14 w-full flex items-center gap-3 text-left">
                            <Calendar className="w-5 h-5 text-violet-500" />
                            {startDate ? format(startDate, 'PPP') : <span style={{ color: 'var(--foreground-muted)' }}>Pick a date</span>}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}>
                          <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} disabled={(date) => date < new Date()} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="input-modern h-14 w-full flex items-center gap-3 text-left">
                            <Calendar className="w-5 h-5 text-violet-500" />
                            {endDate ? format(endDate, 'PPP') : <span style={{ color: 'var(--foreground-muted)' }}>Pick a date</span>}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}>
                          <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} disabled={(date) => date < (startDate || new Date())} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  {tripDays > 0 && (
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-center">
                      <span className="text-4xl font-bold text-gradient">{tripDays}</span>
                      <span className="text-lg ml-2" style={{ color: 'var(--foreground-muted)' }}>{tripDays === 1 ? 'day' : 'days'} adventure</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Travelers */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Who's traveling?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>Tell us about your group</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'adults', label: 'Adults (18-59)', icon: User, color: 'from-violet-500 to-purple-600' },
                      { key: 'seniors', label: 'Seniors (60+)', icon: UserCheck, color: 'from-blue-500 to-cyan-500' },
                      { key: 'children_above_10', label: 'Children (10-17)', icon: Users, color: 'from-emerald-500 to-teal-500' },
                      { key: 'children_below_10', label: 'Children (2-9)', icon: User, color: 'from-orange-500 to-amber-500' },
                      { key: 'infants', label: 'Infants (0-1)', icon: Baby, color: 'from-pink-500 to-rose-500' }
                    ].map(({ key, label, icon: Icon, color }) => (
                      <div key={key} className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}><Icon className="w-5 h-5 text-white" /></div>
                          <span className="font-medium" style={{ color: 'var(--foreground)' }}>{label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setTravelers({ ...travelers, [key]: Math.max(0, travelers[key] - 1) })} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg" style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>−</button>
                          <span className="w-8 text-center font-bold text-xl" style={{ color: 'var(--foreground)' }}>{travelers[key]}</span>
                          <button onClick={() => setTravelers({ ...travelers, [key]: travelers[key] + 1 })} className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Total Budget ({getSymbol()})</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500" />
                        <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="5000" className="input-modern h-14 w-full pl-12" />
                      </div>
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Cabin Class</Label>
                      <Select value={cabinClass} onValueChange={setCabinClass}>
                        <SelectTrigger className="h-14 rounded-2xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}><Luggage className="w-5 h-5 text-violet-500 mr-2" /><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl" style={{ background: 'var(--background-secondary)' }}>
                          {['economy', 'premium_economy', 'business', 'first'].map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {totalTravelers > 0 && budget > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-center">
                      <p className="text-violet-400">~{formatPrice(budget / totalTravelers)} per person</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 6: Preferences */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Personalize your trip</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>Help us tailor recommendations for you</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Food Preferences</Label>
                      <Select value={foodPreference} onValueChange={setFoodPreference}>
                        <SelectTrigger className="h-14 rounded-2xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}><Utensils className="w-5 h-5 text-violet-500 mr-2" /><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl" style={{ background: 'var(--background-secondary)' }}>
                          {["No preference", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Local cuisine", "Fine dining"].map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Accommodation</Label>
                      <Select value={accommodationType} onValueChange={setAccommodationType}>
                        <SelectTrigger className="h-14 rounded-2xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}><Hotel className="w-5 h-5 text-violet-500 mr-2" /><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl" style={{ background: 'var(--background-secondary)' }}>
                          {["budget", "mid-range", "luxury", "boutique", "vacation-rental"].map(opt => <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label style={{ color: 'var(--foreground-muted)' }} className="mb-3 block font-medium">Interests (up to 5)</Label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((interest) => (
                        <button key={interest} onClick={() => toggleInterest(interest)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${interests.includes(interest) ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' : ''}`} style={{ background: !interests.includes(interest) ? 'var(--card-bg)' : undefined, color: !interests.includes(interest) ? 'var(--foreground-muted)' : undefined, border: '1px solid var(--border)' }}>
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label style={{ color: 'var(--foreground-muted)' }} className="mb-3 block font-medium flex items-center gap-2"><Dumbbell className="w-4 h-4 text-violet-500" /> Fitness Activities</Label>
                    <div className="flex flex-wrap gap-2">
                      {FITNESS_OPTIONS.map((fitness) => (
                        <button key={fitness} onClick={() => toggleFitness(fitness)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${fitnessInterests.includes(fitness) ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : ''}`} style={{ background: !fitnessInterests.includes(fitness) ? 'var(--card-bg)' : undefined, color: !fitnessInterests.includes(fitness) ? 'var(--foreground-muted)' : undefined, border: '1px solid var(--border)' }}>
                          {fitness}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!existingBookings.hasInsurance && (
                    <label className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                      <Checkbox checked={needInsurance} onCheckedChange={setNeedInsurance} />
                      <Shield className="w-6 h-6 text-violet-500" />
                      <div>
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>Suggest travel insurance</span>
                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>We'll recommend the best options</p>
                      </div>
                    </label>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                {currentStep > 1 ? <button onClick={() => setCurrentStep(currentStep - 1)} className="flex items-center gap-2 font-medium" style={{ color: 'var(--foreground-muted)' }}><ArrowLeft className="w-4 h-4" /> Back</button> : <div />}
                {currentStep < 6 ? (
                  <button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()} className="btn-gradient disabled:opacity-50">Continue <ArrowRight className="w-4 h-4 ml-2 inline" /></button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading} className="btn-gradient">
                    {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" /> Creating...</> : <><Sparkles className="w-4 h-4 mr-2 inline" /> Generate My Trip</>}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
