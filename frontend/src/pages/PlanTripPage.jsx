import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, MapPin, Calendar, Users, DollarSign, Utensils,
  ArrowRight, ArrowLeft, Plus, X, Sparkles, Home, Heart,
  Baby, User, UserCheck, Check, Sun, Moon, Globe,
  Briefcase, Hotel, Shield, Dumbbell, Flag
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
import { Textarea } from '../components/ui/textarea';
import { format, differenceInDays } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STEPS = [
  { id: 1, title: "Trip Type", icon: Briefcase },
  { id: 2, title: "Passport & Visa", icon: Flag },
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
  "Cycling", "Marathons/Events", "CrossFit", "Zumba/Dance",
  "Hiking Trails", "Water Sports"
];

// City Autocomplete Component
const CityAutocomplete = ({ value, onChange, placeholder, testId }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const fetchSuggestions = async (q) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/autocomplete/cities?q=${encodeURIComponent(q)}`);
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
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
      <Input
        ref={inputRef}
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && fetchSuggestions(query)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className="h-14 bg-[var(--input-bg)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
        data-testid={testId}
      />
      
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 rounded-lg shadow-xl overflow-hidden"
            style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)' }}
          >
            <ScrollArea className="max-h-60">
              {suggestions.map((city, i) => (
                <button
                  key={i}
                  onClick={() => selectSuggestion(city)}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors hover:bg-[var(--card-hover)]"
                >
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <div>
                    <span style={{ color: 'var(--foreground)' }}>{city.city}</span>
                    <span style={{ color: 'var(--foreground-muted)' }} className="ml-2">{city.country}</span>
                  </div>
                  {city.airports && (
                    <span className="ml-auto text-xs" style={{ color: 'var(--foreground-muted)' }}>
                      {city.airports.length} airport{city.airports.length > 1 ? 's' : ''}
                    </span>
                  )}
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

  // Customer Type
  const [customerType, setCustomerType] = useState('fresh');
  
  // Existing Bookings (for plan_only and partial)
  const [existingBookings, setExistingBookings] = useState({
    hasFlight: false,
    flightDetails: { departureTime: '', arrivalTime: '', returnDepartureTime: '', returnArrivalTime: '', airline: '' },
    hasHotel: false,
    hotelDetails: { name: '', address: '', checkIn: '', checkOut: '' },
    hasInsurance: false
  });
  
  // Passport
  const [passportCountries, setPassportCountries] = useState([]);
  
  // Trip Details
  const [departure, setDeparture] = useState('');
  const [departureAirports, setDepartureAirports] = useState([]);
  const [selectedDepartureAirports, setSelectedDepartureAirports] = useState([]);
  const [destinations, setDestinations] = useState([{ city: '', airports: [] }]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [budget, setBudget] = useState('');
  
  // Travelers
  const [travelers, setTravelers] = useState({
    adults: 1,
    children_above_10: 0,
    children_below_10: 0,
    seniors: 0,
    infants: 0
  });
  
  // Preferences
  const [foodPreference, setFoodPreference] = useState('No preference');
  const [accommodationType, setAccommodationType] = useState('mid-range');
  const [interests, setInterests] = useState([]);
  const [fitnessInterests, setFitnessInterests] = useState([]);
  const [needInsurance, setNeedInsurance] = useState(true);
  const [cabinClass, setCabinClass] = useState('economy');

  // Fetch countries on load
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get(`${API_URL}/countries`);
        setCountries(response.data);
      } catch (error) {
        console.error('Failed to fetch countries');
      }
    };
    fetchCountries();
  }, []);

  // Fetch airports when departure changes
  const handleDepartureChange = async (value, cityData) => {
    setDeparture(value);
    if (cityData?.airports) {
      setDepartureAirports(cityData.airports);
      setSelectedDepartureAirports(cityData.airports.map(a => a.code));
    }
  };

  const addDestination = () => {
    if (destinations.length < 5) {
      setDestinations([...destinations, { city: '', airports: [] }]);
    }
  };

  const removeDestination = (index) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((_, i) => i !== index));
    }
  };

  const updateDestination = (index, value, cityData) => {
    const newDests = [...destinations];
    newDests[index] = { city: value, airports: cityData?.airports || [] };
    setDestinations(newDests);
  };

  const togglePassport = (countryCode) => {
    if (passportCountries.includes(countryCode)) {
      setPassportCountries(passportCountries.filter(c => c !== countryCode));
    } else {
      setPassportCountries([...passportCountries, countryCode]);
    }
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    }
  };

  const toggleFitness = (fitness) => {
    if (fitnessInterests.includes(fitness)) {
      setFitnessInterests(fitnessInterests.filter(f => f !== fitness));
    } else {
      setFitnessInterests([...fitnessInterests, fitness]);
    }
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
        existing_bookings: customerType !== 'fresh' ? {
          has_flight: existingBookings.hasFlight,
          flight_details: existingBookings.flightDetails,
          has_hotel: existingBookings.hasHotel,
          hotel_details: existingBookings.hotelDetails,
          has_insurance: existingBookings.hasInsurance
        } : null,
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
      console.error('Trip generation error:', error);
      toast.error(error.response?.data?.detail || 'Failed to generate trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }} data-testid="plan-trip-page">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b" style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A38322] flex items-center justify-center">
              <Plane className="w-4 sm:w-5 h-4 sm:h-5 text-black" />
            </div>
            <span className="font-heading text-xl sm:text-2xl tracking-tight" style={{ color: 'var(--foreground)' }}>Odyssey</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Currency Selector */}
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-24 h-9 text-xs" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ background: 'var(--background-secondary)' }}>
                {currencies.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-[#D4AF37]" /> : <Moon className="w-5 h-5 text-[#D4AF37]" />}
            </button>
            
            <Link to="/" className="hidden sm:flex items-center gap-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
              <Home className="w-4 h-4" />
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 sm:mb-12 overflow-x-auto pb-2">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className={`flex flex-col items-center ${currentStep >= step.id ? 'text-[#D4AF37]' : ''}`} style={{ color: currentStep >= step.id ? '#D4AF37' : 'var(--foreground-muted)' }}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep === step.id ? 'bg-[#D4AF37] text-black' : 
                    currentStep > step.id ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : ''
                  }`} style={{ background: currentStep < step.id ? 'var(--card-bg)' : undefined }}>
                    {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-4 h-4" />}
                  </div>
                  <span className="text-xs mt-2 font-body hidden md:block">{step.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 sm:w-12 h-0.5 mx-1 ${currentStep > step.id ? 'bg-[#D4AF37]' : ''}`} style={{ background: currentStep <= step.id ? 'var(--border)' : undefined }} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card-glass p-6 sm:p-8"
            >
              {/* Step 1: Customer Type */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl mb-2" style={{ color: 'var(--foreground)' }}>How can we help you?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }} className="font-body">Select what best describes your situation</p>
                  </div>

                  <RadioGroup value={customerType} onValueChange={setCustomerType} className="space-y-4">
                    {[
                      { value: 'fresh', icon: Sparkles, title: 'Plan Everything Fresh', desc: 'I need help with flights, hotels, and complete itinerary' },
                      { value: 'partial', icon: Briefcase, title: 'Partial Booking', desc: 'I have some bookings (flight OR hotel) and need help with the rest' },
                      { value: 'plan_only', icon: Calendar, title: 'Itinerary Only', desc: 'I have flights & hotels booked, just need day-wise planning' }
                    ].map((type) => (
                      <label
                        key={type.value}
                        className={`flex items-start gap-4 p-5 rounded-xl cursor-pointer transition-all ${customerType === type.value ? 'border-[#D4AF37]' : ''}`}
                        style={{ 
                          background: customerType === type.value ? 'rgba(212, 175, 55, 0.1)' : 'var(--card-bg)',
                          border: `1px solid ${customerType === type.value ? '#D4AF37' : 'var(--border)'}`
                        }}
                      >
                        <RadioGroupItem value={type.value} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <type.icon className="w-5 h-5 text-[#D4AF37]" />
                            <span className="font-body font-medium" style={{ color: 'var(--foreground)' }}>{type.title}</span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>{type.desc}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>

                  {/* Existing Bookings Form */}
                  {(customerType === 'partial' || customerType === 'plan_only') && (
                    <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                      <h3 className="font-heading text-lg" style={{ color: 'var(--foreground)' }}>Your Existing Bookings</h3>
                      
                      {/* Flight Booking */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={existingBookings.hasFlight}
                            onCheckedChange={(checked) => setExistingBookings({...existingBookings, hasFlight: checked})}
                          />
                          <label className="font-body text-sm" style={{ color: 'var(--foreground)' }}>I have booked my flights</label>
                        </div>
                        
                        {existingBookings.hasFlight && (
                          <div className="grid grid-cols-2 gap-3 pl-6">
                            <div>
                              <Label className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Outbound Departure</Label>
                              <Input 
                                type="datetime-local"
                                value={existingBookings.flightDetails.departureTime}
                                onChange={(e) => setExistingBookings({
                                  ...existingBookings,
                                  flightDetails: {...existingBookings.flightDetails, departureTime: e.target.value}
                                })}
                                className="h-10"
                                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                              />
                            </div>
                            <div>
                              <Label className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Outbound Arrival</Label>
                              <Input 
                                type="datetime-local"
                                value={existingBookings.flightDetails.arrivalTime}
                                onChange={(e) => setExistingBookings({
                                  ...existingBookings,
                                  flightDetails: {...existingBookings.flightDetails, arrivalTime: e.target.value}
                                })}
                                className="h-10"
                                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                              />
                            </div>
                            <div>
                              <Label className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Return Departure</Label>
                              <Input 
                                type="datetime-local"
                                value={existingBookings.flightDetails.returnDepartureTime}
                                onChange={(e) => setExistingBookings({
                                  ...existingBookings,
                                  flightDetails: {...existingBookings.flightDetails, returnDepartureTime: e.target.value}
                                })}
                                className="h-10"
                                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                              />
                            </div>
                            <div>
                              <Label className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Return Arrival</Label>
                              <Input 
                                type="datetime-local"
                                value={existingBookings.flightDetails.returnArrivalTime}
                                onChange={(e) => setExistingBookings({
                                  ...existingBookings,
                                  flightDetails: {...existingBookings.flightDetails, returnArrivalTime: e.target.value}
                                })}
                                className="h-10"
                                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Hotel Booking */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={existingBookings.hasHotel}
                            onCheckedChange={(checked) => setExistingBookings({...existingBookings, hasHotel: checked})}
                          />
                          <label className="font-body text-sm" style={{ color: 'var(--foreground)' }}>I have booked my accommodation</label>
                        </div>
                        
                        {existingBookings.hasHotel && (
                          <div className="grid grid-cols-2 gap-3 pl-6">
                            <div className="col-span-2">
                              <Label className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Hotel/Accommodation Name</Label>
                              <Input 
                                value={existingBookings.hotelDetails.name}
                                onChange={(e) => setExistingBookings({
                                  ...existingBookings,
                                  hotelDetails: {...existingBookings.hotelDetails, name: e.target.value}
                                })}
                                placeholder="e.g., Marriott Downtown"
                                className="h-10"
                                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Address</Label>
                              <Input 
                                value={existingBookings.hotelDetails.address}
                                onChange={(e) => setExistingBookings({
                                  ...existingBookings,
                                  hotelDetails: {...existingBookings.hotelDetails, address: e.target.value}
                                })}
                                placeholder="Hotel address"
                                className="h-10"
                                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Insurance */}
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={existingBookings.hasInsurance}
                          onCheckedChange={(checked) => setExistingBookings({...existingBookings, hasInsurance: checked})}
                        />
                        <label className="font-body text-sm" style={{ color: 'var(--foreground)' }}>I already have travel insurance</label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Passport & Visa */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl mb-2" style={{ color: 'var(--foreground)' }}>Your Passport(s)</h2>
                    <p style={{ color: 'var(--foreground-muted)' }} className="font-body">Select all passport(s) you hold - this helps us check visa requirements</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {countries.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => togglePassport(country.code)}
                        className={`p-3 rounded-xl text-left transition-all ${passportCountries.includes(country.code) ? 'border-[#D4AF37]' : ''}`}
                        style={{ 
                          background: passportCountries.includes(country.code) ? 'rgba(212, 175, 55, 0.1)' : 'var(--card-bg)',
                          border: `1px solid ${passportCountries.includes(country.code) ? '#D4AF37' : 'var(--border)'}`
                        }}
                      >
                        <span className="text-2xl">{country.flag}</span>
                        <p className="text-sm mt-1 font-body truncate" style={{ color: 'var(--foreground)' }}>{country.name}</p>
                        {passportCountries.includes(country.code) && (
                          <Check className="w-4 h-4 text-[#D4AF37] mt-1" />
                        )}
                      </button>
                    ))}
                  </div>

                  {passportCountries.length > 0 && (
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <p className="text-[#D4AF37] font-body text-sm">
                        Selected: {passportCountries.map(code => countries.find(c => c.code === code)?.name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Destinations */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl mb-2" style={{ color: 'var(--foreground)' }}>Where's your adventure?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }} className="font-body">Start typing to search cities</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="font-body mb-2 block">Departure City</Label>
                      <div className="relative">
                        <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: 'var(--foreground-muted)' }} />
                        <div className="pl-12">
                          <CityAutocomplete
                            value={departure}
                            onChange={handleDepartureChange}
                            placeholder="e.g., New York"
                            testId="departure-input"
                          />
                        </div>
                      </div>
                      
                      {/* Airport Selection */}
                      {departureAirports.length > 0 && (
                        <div className="mt-3 pl-12">
                          <Label className="text-xs mb-2 block" style={{ color: 'var(--foreground-muted)' }}>Search from these airports:</Label>
                          <div className="flex flex-wrap gap-2">
                            {departureAirports.map((airport) => (
                              <Badge
                                key={airport.code}
                                variant={selectedDepartureAirports.includes(airport.code) ? "default" : "outline"}
                                className="cursor-pointer"
                                style={{
                                  background: selectedDepartureAirports.includes(airport.code) ? '#D4AF37' : 'transparent',
                                  color: selectedDepartureAirports.includes(airport.code) ? 'black' : 'var(--foreground-muted)',
                                  borderColor: 'var(--border)'
                                }}
                                onClick={() => {
                                  if (selectedDepartureAirports.includes(airport.code)) {
                                    setSelectedDepartureAirports(selectedDepartureAirports.filter(a => a !== airport.code));
                                  } else {
                                    setSelectedDepartureAirports([...selectedDepartureAirports, airport.code]);
                                  }
                                }}
                              >
                                {airport.code} - {airport.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="font-body mb-2 block">Destination(s)</Label>
                      {destinations.map((dest, i) => (
                        <div key={i} className="relative mb-3">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37] z-10" />
                          <div className="pl-12 pr-12">
                            <CityAutocomplete
                              value={dest.city}
                              onChange={(val, cityData) => updateDestination(i, val, cityData)}
                              placeholder={`Destination ${i + 1}`}
                              testId={`destination-input-${i}`}
                            />
                          </div>
                          {destinations.length > 1 && (
                            <button
                              onClick={() => removeDestination(i)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-red-400 z-10"
                              style={{ color: 'var(--foreground-muted)' }}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {destinations.length < 5 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={addDestination}
                          className="text-[#D4AF37] hover:text-[#E5C568] hover:bg-[#D4AF37]/10"
                          data-testid="add-destination-btn"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Another Destination
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Dates */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl mb-2" style={{ color: 'var(--foreground)' }}>When are you traveling?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }} className="font-body">Select your travel dates</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="font-body mb-2 block">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-14 justify-start text-left font-normal"
                            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                          >
                            <Calendar className="mr-3 h-5 w-5 text-[#D4AF37]" />
                            {startDate ? format(startDate, 'PPP') : <span style={{ color: 'var(--foreground-muted)' }}>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" style={{ background: 'var(--background-secondary)', borderColor: 'var(--border)' }}>
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="font-body mb-2 block">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-14 justify-start text-left font-normal"
                            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                          >
                            <Calendar className="mr-3 h-5 w-5 text-[#D4AF37]" />
                            {endDate ? format(endDate, 'PPP') : <span style={{ color: 'var(--foreground-muted)' }}>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" style={{ background: 'var(--background-secondary)', borderColor: 'var(--border)' }}>
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => date < (startDate || new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {tripDays > 0 && (
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <p className="text-[#D4AF37] font-body text-center">
                        <span className="font-heading text-2xl">{tripDays}</span> {tripDays === 1 ? 'day' : 'days'} adventure
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Travelers & Budget */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl mb-2" style={{ color: 'var(--foreground)' }}>Who's traveling?</h2>
                    <p style={{ color: 'var(--foreground-muted)' }} className="font-body">Tell us about your travel group and budget</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'adults', label: 'Adults (18-59)', icon: User },
                      { key: 'seniors', label: 'Seniors (60+)', icon: UserCheck },
                      { key: 'children_above_10', label: 'Children (10-17)', icon: Users },
                      { key: 'children_below_10', label: 'Children (2-9)', icon: User },
                      { key: 'infants', label: 'Infants (0-1)', icon: Baby }
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-[#D4AF37]" />
                          <span className="font-body" style={{ color: 'var(--foreground)' }}>{label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 rounded-full"
                            style={{ borderColor: 'var(--border)' }}
                            onClick={() => setTravelers({ ...travelers, [key]: Math.max(0, travelers[key] - 1) })}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-heading text-xl" style={{ color: 'var(--foreground)' }}>{travelers[key]}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 rounded-full"
                            style={{ borderColor: 'var(--border)' }}
                            onClick={() => setTravelers({ ...travelers, [key]: travelers[key] + 1 })}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="font-body mb-2 block">Total Budget ({getSymbol()})</Label>
                      <Input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="5000"
                        className="h-14"
                        style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="font-body mb-2 block">Cabin Class</Label>
                      <Select value={cabinClass} onValueChange={setCabinClass}>
                        <SelectTrigger className="h-14" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: 'var(--background-secondary)' }}>
                          <SelectItem value="economy">Economy</SelectItem>
                          <SelectItem value="premium_economy">Premium Economy</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="first">First Class</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {totalTravelers > 0 && budget > 0 && (
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(212, 175, 55, 0.1)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <p className="text-[#D4AF37] font-body text-center">
                        ~{formatPrice(budget / totalTravelers)} per person
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 6: Preferences */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl mb-2" style={{ color: 'var(--foreground)' }}>Personalize your trip</h2>
                    <p style={{ color: 'var(--foreground-muted)' }} className="font-body">Help us tailor recommendations to your preferences</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="font-body mb-2 block">Food Preferences</Label>
                      <Select value={foodPreference} onValueChange={setFoodPreference}>
                        <SelectTrigger className="h-12" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: 'var(--background-secondary)' }}>
                          {["No preference", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Local cuisine", "Street food", "Fine dining"].map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label style={{ color: 'var(--foreground-muted)' }} className="font-body mb-2 block">Accommodation Type</Label>
                      <Select value={accommodationType} onValueChange={setAccommodationType}>
                        <SelectTrigger className="h-12" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: 'var(--background-secondary)' }}>
                          {["budget", "mid-range", "luxury", "boutique", "vacation-rental", "eco-friendly", "unique"].map(opt => (
                            <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label style={{ color: 'var(--foreground-muted)' }} className="font-body mb-3 block">Interests (select up to 5)</Label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((interest) => (
                        <Badge
                          key={interest}
                          className="cursor-pointer py-2 px-4 text-sm transition-all"
                          style={{
                            background: interests.includes(interest) ? '#D4AF37' : 'transparent',
                            color: interests.includes(interest) ? 'black' : 'var(--foreground-muted)',
                            border: `1px solid ${interests.includes(interest) ? '#D4AF37' : 'var(--border)'}`
                          }}
                          onClick={() => toggleInterest(interest)}
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label style={{ color: 'var(--foreground-muted)' }} className="font-body mb-3 block flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-[#D4AF37]" />
                      Fitness Interests
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {FITNESS_OPTIONS.map((fitness) => (
                        <Badge
                          key={fitness}
                          className="cursor-pointer py-2 px-4 text-sm transition-all"
                          style={{
                            background: fitnessInterests.includes(fitness) ? '#D4AF37' : 'transparent',
                            color: fitnessInterests.includes(fitness) ? 'black' : 'var(--foreground-muted)',
                            border: `1px solid ${fitnessInterests.includes(fitness) ? '#D4AF37' : 'var(--border)'}`
                          }}
                          onClick={() => toggleFitness(fitness)}
                        >
                          {fitness}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {!existingBookings.hasInsurance && (
                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                      <Checkbox 
                        checked={needInsurance}
                        onCheckedChange={setNeedInsurance}
                      />
                      <div>
                        <label className="font-body" style={{ color: 'var(--foreground)' }}>Suggest travel insurance options</label>
                        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>We'll recommend the best & cheapest options for your trip</p>
                      </div>
                      <Shield className="w-5 h-5 text-[#D4AF37] ml-auto" />
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    style={{ color: 'var(--foreground-muted)' }}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                ) : <div />}

                {currentStep < 6 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceed()}
                    className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-8"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-8"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate My Trip
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
