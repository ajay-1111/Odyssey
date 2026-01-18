import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, MapPin, Calendar, Users, DollarSign, Utensils, Hotel,
  ArrowRight, ArrowLeft, Plus, X, Check, Sun, Moon, Sparkles,
  CreditCard, Search, Shield, Car, Dumbbell, ChevronDown, Home
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CUSTOMER_TYPES = [
  { id: 'fresh', title: 'Plan Everything Fresh', desc: 'Start from scratch - flights, hotels, itinerary', icon: Sparkles, gradient: 'from-violet-500 to-purple-600' },
  { id: 'partial', title: 'Partial Booking', desc: 'Have some bookings, need help with the rest', icon: CreditCard, gradient: 'from-pink-500 to-rose-600' },
  { id: 'itinerary', title: 'Itinerary Only', desc: 'Already booked flights & hotel, just need day plans', icon: Calendar, gradient: 'from-blue-500 to-cyan-500' }
];

const INTERESTS = [
  "History & Culture", "Nature & Outdoors", "Beach & Relaxation", 
  "Adventure Sports", "Food & Culinary", "Art & Museums",
  "Shopping", "Nightlife", "Photography", "Architecture",
  "Wildlife & Safari", "Wellness & Spa", "Local Experiences",
  "Wine & Vineyards", "Music & Concerts", "Religious Sites", "Theme Parks"
];

const FITNESS_OPTIONS = [
  "Gym Access", "Running/Jogging", "Yoga Classes", "Swimming",
  "Cycling", "Marathons", "CrossFit", "Zumba/Dance", "Hiking", "Water Sports"
];

const CityAutocomplete = ({ value, onChange, placeholder, testId }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Sync query with external value prop
  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value || '');
    }
  }, [value]);

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
        ref={inputRef}
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && fetchSuggestions(query)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className="w-full h-14 rounded-2xl px-4 transition-all focus:ring-2 focus:ring-violet-500/30"
        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        data-testid={testId}
      />
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 rounded-2xl shadow-2xl overflow-hidden" 
            style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}
          >
            <ScrollArea className="max-h-60">
              {suggestions.map((city, i) => (
                <button 
                  key={i} 
                  onClick={() => selectSuggestion(city)} 
                  className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all hover:bg-violet-500/10"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <MapPin className="w-4 h-4 text-violet-500" />
                  <span style={{ color: 'var(--foreground)' }}>{city.city}, <span style={{ color: 'var(--foreground-muted)' }}>{city.country}</span></span>
                  {city.airports && <span className="ml-auto text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-400">{city.airports.length} airports</span>}
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
  const [passportSearch, setPassportSearch] = useState('');
  const [residenceSearch, setResidenceSearch] = useState('');

  const [customerType, setCustomerType] = useState('fresh');
  const [existingBookings, setExistingBookings] = useState({
    hasFlight: false, flightDetails: { departureTime: '', arrivalTime: '', returnDepartureTime: '', returnArrivalTime: '' },
    hasHotel: false, hotelDetails: { name: '', address: '' },
    hasInsurance: false
  });
  const [passportCountries, setPassportCountries] = useState([]);
  const [residenceCountry, setResidenceCountry] = useState('');
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

  // No limit on interests - user can select as many as they want
  const toggleInterest = (interest) => {
    setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
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
      case 3: return departure && destinations[0].city;
      case 4: return startDate && endDate;
      case 5: return totalTravelers > 0 && budget;
      case 6: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const tripData = {
        customer_type: customerType,
        existing_bookings: existingBookings,
        passport_countries: passportCountries,
        residence_country: residenceCountry,
        departure: { city: departure, airports: selectedDepartureAirports },
        destinations: destinations.filter(d => d.city),
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        budget: parseFloat(budget),
        currency: currency,
        travelers,
        preferences: {
          food: foodPreference,
          accommodation: accommodationType,
          cabin_class: cabinClass,
          interests,
          fitness: fitnessInterests,
          need_insurance: needInsurance
        }
      };

      const response = await axios.post(`${API_URL}/trips/generate`, tripData);
      sessionStorage.setItem('generatedTrip', JSON.stringify(response.data));
      toast.success('Trip generated successfully!');
      navigate('/trip-result');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPassportCountries = countries.filter(c => 
    c.name.toLowerCase().includes(passportSearch.toLowerCase()) || 
    c.code.toLowerCase().includes(passportSearch.toLowerCase())
  );

  const filteredResidenceCountries = countries.filter(c => 
    c.name.toLowerCase().includes(residenceSearch.toLowerCase()) || 
    c.code.toLowerCase().includes(residenceSearch.toLowerCase())
  );

  const stepVariants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--background)' }} data-testid="plan-trip-page">
      <div className="bg-animated" />
      
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-all duration-300" style={{ background: theme === 'dark' ? 'rgba(10, 10, 15, 0.8)' : 'rgba(250, 250, 255, 0.8)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25 transition-transform group-hover:scale-110">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Odyssey</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-24 h-10 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }} data-testid="currency-selector-nav">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl" style={{ background: 'var(--background-secondary)' }}>
                {currencies.map(c => <SelectItem key={c.code} value={c.code}>{c.code} {c.symbol}</SelectItem>)}
              </SelectContent>
            </Select>
            <button onClick={toggleTheme} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110" style={{ background: 'var(--card-bg)' }}>
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-violet-500" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              {['Type', 'Passport', 'Where', 'When', 'Who', 'Preferences'].map((label, i) => (
                <button 
                  key={i} 
                  onClick={() => i + 1 <= currentStep && setCurrentStep(i + 1)}
                  className={`flex flex-col items-center transition-all duration-300 ${i + 1 <= currentStep ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-1 transition-all duration-300 ${currentStep === i + 1 ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 scale-110' : i + 1 < currentStep ? 'bg-violet-500/20 text-violet-500' : ''}`} style={{ background: currentStep !== i + 1 && i + 1 >= currentStep ? 'var(--card-bg)' : undefined, color: currentStep !== i + 1 && i + 1 >= currentStep ? 'var(--foreground-muted)' : undefined }}>
                    {i + 1 < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block transition-colors ${currentStep === i + 1 ? 'text-violet-500 font-medium' : ''}`} style={{ color: currentStep !== i + 1 ? 'var(--foreground-muted)' : undefined }}>{label}</span>
                </button>
              ))}
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-bg)' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / 6) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
              />
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStep}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="card-modern p-6 sm:p-10"
            >
              {/* Step 1: Customer Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>How can we help?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>Choose your planning style</p>
                  </div>
                  <div className="grid gap-4">
                    {CUSTOMER_TYPES.map((type) => (
                      <button key={type.id} onClick={() => setCustomerType(type.id)} className={`p-6 rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] ${customerType === type.id ? 'ring-2 ring-violet-500' : ''}`} style={{ background: customerType === type.id ? 'rgba(139, 92, 246, 0.1)' : 'var(--card-bg)', border: '1px solid var(--border)' }} data-testid={`customer-type-${type.id}`}>
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.gradient} flex items-center justify-center flex-shrink-0 shadow-lg transition-transform ${customerType === type.id ? 'scale-110' : ''}`}>
                            <type.icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-heading text-xl font-semibold" style={{ color: 'var(--foreground)' }}>{type.title}</h3>
                            <p className="text-sm mt-1" style={{ color: 'var(--foreground-muted)' }}>{type.desc}</p>
                          </div>
                          {customerType === type.id && <Check className="w-6 h-6 text-violet-500 flex-shrink-0" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  {customerType === 'partial' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }} className="space-y-4 pt-4">
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>What have you already booked?</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {[{ key: 'hasFlight', label: 'Flight' }, { key: 'hasHotel', label: 'Hotel' }, { key: 'hasInsurance', label: 'Insurance' }].map((item) => (
                          <label key={item.key} className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'var(--card-bg)', border: `1px solid ${existingBookings[item.key] ? 'var(--accent-primary)' : 'var(--border)'}` }}>
                            <Checkbox checked={existingBookings[item.key]} onCheckedChange={(checked) => setExistingBookings(prev => ({ ...prev, [item.key]: checked }))} />
                            <span style={{ color: 'var(--foreground)' }}>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 2: Passport & Residence */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Your Travel Documents</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>We need this for accurate visa requirements</p>
                  </div>

                  {/* Residence Country */}
                  <div className="space-y-3">
                    <Label style={{ color: 'var(--foreground)' }} className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-violet-500" />
                      Current Country of Residence
                    </Label>
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Where you are currently living (may differ from passport)</p>
                    
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
                      <input
                        type="text"
                        value={residenceSearch}
                        onChange={(e) => setResidenceSearch(e.target.value)}
                        placeholder="Search country..."
                        className="w-full h-12 rounded-xl pl-11 pr-4 transition-all"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                        data-testid="residence-search"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                      {filteredResidenceCountries.slice(0, 16).map((country) => (
                        <button 
                          key={country.code} 
                          onClick={() => setResidenceCountry(country.code)} 
                          className={`p-3 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] ${residenceCountry === country.code ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : ''}`} 
                          style={{ background: residenceCountry !== country.code ? 'var(--card-bg)' : undefined, border: '1px solid var(--border)' }}
                        >
                          <span className="text-xl">{country.flag}</span>
                          <p className="text-xs mt-1 truncate font-medium" style={{ color: 'var(--foreground)' }}>{country.name}</p>
                        </button>
                      ))}
                    </div>

                    {residenceCountry && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                        <p className="text-emerald-400 text-sm flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          <span className="font-medium">Residing in:</span> {countries.find(c => c.code === residenceCountry)?.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Passport Countries */}
                  <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <Label style={{ color: 'var(--foreground)' }} className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-violet-500" />
                      Passport(s) You Hold
                    </Label>
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Select all passports you can travel with</p>
                    
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
                      <input
                        type="text"
                        value={passportSearch}
                        onChange={(e) => setPassportSearch(e.target.value)}
                        placeholder="Search countries..."
                        className="w-full h-12 rounded-xl pl-11 pr-4 transition-all"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                        data-testid="passport-search"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
                      {filteredPassportCountries.map((country) => (
                        <button 
                          key={country.code} 
                          onClick={() => togglePassport(country.code)} 
                          className={`p-3 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] ${passportCountries.includes(country.code) ? 'ring-2 ring-violet-500 bg-violet-500/10' : ''}`} 
                          style={{ background: !passportCountries.includes(country.code) ? 'var(--card-bg)' : undefined, border: '1px solid var(--border)' }}
                        >
                          <span className="text-xl">{country.flag}</span>
                          <p className="text-xs mt-1 truncate font-medium" style={{ color: 'var(--foreground)' }}>{country.name}</p>
                          {passportCountries.includes(country.code) && <Check className="w-3 h-3 text-violet-500 mt-1" />}
                        </button>
                      ))}
                    </div>

                    {passportCountries.length > 0 && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                        <p className="text-violet-400 text-sm">
                          <span className="font-medium">Selected passports:</span> {passportCountries.map(code => countries.find(c => c.code === code)?.name).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Destinations */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Where&apos;s your adventure?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>Start typing to search cities with airports</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Departure City</Label>
                      <div className="relative">
                        <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-500 z-10" />
                        <div className="pl-10">
                          <CityAutocomplete value={departure} onChange={handleDepartureChange} placeholder="e.g., New York" testId="departure-input" />
                        </div>
                      </div>
                      {departureAirports.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 pl-10">
                          <Label className="text-xs mb-2 block" style={{ color: 'var(--foreground-muted)' }}>Select departure airports:</Label>
                          <div className="flex flex-wrap gap-2">
                            {departureAirports.map((airport) => (
                              <button 
                                key={airport.code} 
                                onClick={() => setSelectedDepartureAirports(prev => prev.includes(airport.code) ? prev.filter(a => a !== airport.code) : [...prev, airport.code])} 
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${selectedDepartureAirports.includes(airport.code) ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg' : ''}`} 
                                style={{ background: !selectedDepartureAirports.includes(airport.code) ? 'var(--card-bg)' : undefined, color: !selectedDepartureAirports.includes(airport.code) ? 'var(--foreground-muted)' : undefined, border: '1px solid var(--border)' }}
                              >
                                {airport.code} - {airport.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Destination(s)</Label>
                      {destinations.map((dest, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative mb-3">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500 z-10" />
                          <div className="pl-10 pr-12">
                            <CityAutocomplete value={dest.city} onChange={(val, cityData) => updateDestination(i, val, cityData)} placeholder={`Destination ${i + 1}`} testId={`destination-input-${i}`} />
                          </div>
                          {destinations.length > 1 && (
                            <button onClick={() => removeDestination(i)} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-300 z-10 transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          )}
                          {/* Show airports for destination */}
                          {dest.airports?.length > 0 && (
                            <div className="mt-2 pl-10 flex flex-wrap gap-2">
                              {dest.airports.map((airport) => (
                                <span key={airport.code} className="text-xs px-2 py-1 rounded-lg bg-pink-500/20 text-pink-400">
                                  {airport.code}
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {destinations.length < 5 && (
                        <button onClick={addDestination} className="flex items-center gap-2 text-violet-500 hover:text-violet-400 font-medium transition-all hover:scale-105">
                          <Plus className="w-4 h-4" /> Add Destination
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Dates - Improved Responsiveness */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>When are you traveling?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>Select your travel dates</p>
                  </div>
                  
                  {/* Mobile-friendly date inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label style={{ color: 'var(--foreground-muted)' }}>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full h-14 px-4 rounded-2xl flex items-center gap-3 text-left transition-all hover:border-violet-500" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }} data-testid="start-date-btn">
                            <Calendar className="w-5 h-5 text-violet-500 flex-shrink-0" />
                            <span style={{ color: startDate ? 'var(--foreground)' : 'var(--foreground-muted)' }}>
                              {startDate ? format(startDate, 'MMM dd, yyyy') : 'Select start date'}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }} align="start">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            disabled={(date) => date < new Date()}
                            className="rounded-2xl"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: 'var(--foreground-muted)' }}>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="w-full h-14 px-4 rounded-2xl flex items-center gap-3 text-left transition-all hover:border-violet-500" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }} data-testid="end-date-btn">
                            <Calendar className="w-5 h-5 text-pink-500 flex-shrink-0" />
                            <span style={{ color: endDate ? 'var(--foreground)' : 'var(--foreground-muted)' }}>
                              {endDate ? format(endDate, 'MMM dd, yyyy') : 'Select end date'}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-2xl" style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }} align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => date < (startDate || new Date())}
                            className="rounded-2xl"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {tripDays > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gradient font-heading text-3xl font-bold">{tripDays} {tripDays === 1 ? 'Day' : 'Days'}</p>
                          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                            {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Sparkles className="w-8 h-8 text-violet-500" />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 5: Travelers & Budget */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Who&apos;s traveling?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>Tell us about your travel group</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'adults', label: 'Adults', desc: '18+ years' },
                      { key: 'children_above_10', label: 'Children', desc: '10-17 years' },
                      { key: 'children_below_10', label: 'Kids', desc: '2-9 years' },
                      { key: 'seniors', label: 'Seniors', desc: '65+ years' },
                      { key: 'infants', label: 'Infants', desc: 'Under 2' }
                    ].map((item) => (
                      <div key={item.key} className="p-4 rounded-2xl flex items-center justify-between transition-all" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--foreground)' }}>{item.label}</p>
                          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setTravelers(prev => ({ ...prev, [item.key]: Math.max(0, prev[item.key] - 1) }))} className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-medium transition-all hover:scale-110" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>-</button>
                          <span className="w-8 text-center font-semibold" style={{ color: 'var(--foreground)' }}>{travelers[item.key]}</span>
                          <button onClick={() => setTravelers(prev => ({ ...prev, [item.key]: prev[item.key] + 1 }))} className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-lg font-medium transition-all hover:scale-110">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalTravelers > 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-violet-500 font-medium">
                      Total: {totalTravelers} {totalTravelers === 1 ? 'traveler' : 'travelers'}
                    </motion.p>
                  )}
                  <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-violet-500" /> Total Budget ({getSymbol()})
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-500 font-semibold">{getSymbol()}</span>
                      <input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="5000"
                        className="w-full h-14 rounded-2xl pl-12 pr-4 transition-all"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                        data-testid="budget-input"
                      />
                    </div>
                    {budget && (
                      <p className="text-xs mt-2" style={{ color: 'var(--foreground-muted)' }}>
                        ≈ {formatPrice(parseFloat(budget) / totalTravelers, currency)} per person
                      </p>
                    )}
                  </div>
                  <div>
                    <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Flight Class</Label>
                    <div className="flex flex-wrap gap-2">
                      {['economy', 'premium-economy', 'business', 'first'].map((cls) => (
                        <button key={cls} onClick={() => setCabinClass(cls)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${cabinClass === cls ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg' : ''}`} style={{ background: cabinClass !== cls ? 'var(--card-bg)' : undefined, color: cabinClass !== cls ? 'var(--foreground-muted)' : undefined, border: '1px solid var(--border)' }}>
                          {cls.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Preferences */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Your Preferences</h2>
                    <p style={{ color: 'var(--foreground-muted)' }}>Help us personalize your trip</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Food Preference</Label>
                      <Select value={foodPreference} onValueChange={setFoodPreference}>
                        <SelectTrigger className="h-14 rounded-2xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                          <Utensils className="w-5 h-5 text-violet-500 mr-2" /><SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl" style={{ background: 'var(--background-secondary)' }}>
                          {["No preference", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Pescatarian"].map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="mb-2 block font-medium">Accommodation</Label>
                      <Select value={accommodationType} onValueChange={setAccommodationType}>
                        <SelectTrigger className="h-14 rounded-2xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                          <Hotel className="w-5 h-5 text-violet-500 mr-2" /><SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl" style={{ background: 'var(--background-secondary)' }}>
                          {["budget", "mid-range", "luxury", "boutique", "vacation-rental"].map(opt => <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label style={{ color: 'var(--foreground-muted)' }} className="mb-3 block font-medium">Interests (select all that apply)</Label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((interest, i) => (
                        <motion.button 
                          key={interest} 
                          onClick={() => toggleInterest(interest)} 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${interests.includes(interest) ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg' : ''}`} 
                          style={{ background: !interests.includes(interest) ? 'var(--card-bg)' : undefined, color: !interests.includes(interest) ? 'var(--foreground-muted)' : undefined, border: '1px solid var(--border)' }}
                        >
                          {interest}
                        </motion.button>
                      ))}
                    </div>
                    {interests.length > 0 && (
                      <p className="text-xs mt-2 text-violet-500">{interests.length} interests selected</p>
                    )}
                  </div>
                  <div>
                    <Label style={{ color: 'var(--foreground-muted)' }} className="mb-3 block font-medium flex items-center gap-2"><Dumbbell className="w-4 h-4 text-violet-500" /> Fitness Activities</Label>
                    <div className="flex flex-wrap gap-2">
                      {FITNESS_OPTIONS.map((fitness, i) => (
                        <motion.button 
                          key={fitness} 
                          onClick={() => toggleFitness(fitness)} 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 ${fitnessInterests.includes(fitness) ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : ''}`} 
                          style={{ background: !fitnessInterests.includes(fitness) ? 'var(--card-bg)' : undefined, color: !fitnessInterests.includes(fitness) ? 'var(--foreground-muted)' : undefined, border: '1px solid var(--border)' }}
                        >
                          {fitness}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {!existingBookings.hasInsurance && (
                    <label className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01]" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                      <Checkbox checked={needInsurance} onCheckedChange={setNeedInsurance} />
                      <Shield className="w-6 h-6 text-violet-500" />
                      <div>
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>Suggest travel insurance</span>
                        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>We&apos;ll recommend the best options</p>
                      </div>
                    </label>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                {currentStep > 1 ? (
                  <button onClick={() => setCurrentStep(currentStep - 1)} className="flex items-center gap-2 font-medium transition-all hover:scale-105" style={{ color: 'var(--foreground-muted)' }}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}
                {currentStep < 6 ? (
                  <button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()} className="btn-gradient btn-press disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading} className="btn-gradient btn-press">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 inline" />
                        Generate My Trip
                      </>
                    )}
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
