import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, MapPin, Calendar, Users, DollarSign, Utensils,
  ArrowRight, ArrowLeft, Plus, X, Sparkles, Home, Heart,
  Baby, User, UserCheck, Search, Check
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { format, addDays, differenceInDays } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STEPS = [
  { id: 1, title: "Destinations", icon: MapPin },
  { id: 2, title: "Dates", icon: Calendar },
  { id: 3, title: "Travelers", icon: Users },
  { id: 4, title: "Preferences", icon: Heart }
];

const INTERESTS = [
  "History & Culture", "Nature & Outdoors", "Beach & Relaxation", 
  "Adventure Sports", "Food & Culinary", "Art & Museums",
  "Shopping", "Nightlife", "Photography", "Architecture",
  "Wildlife & Safari", "Wellness & Spa", "Local Experiences"
];

// City Autocomplete Component
const CityAutocomplete = ({ value, onChange, placeholder, testId }) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const fetchSuggestions = async (q) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/autocomplete/cities?q=${encodeURIComponent(q)}`);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Autocomplete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    fetchSuggestions(val);
    setShowSuggestions(true);
  };

  const selectSuggestion = (city) => {
    const formatted = `${city.city}, ${city.country}`;
    setQuery(formatted);
    onChange(formatted);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#D4AF37]/50"
        data-testid={testId}
      />
      
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-xl overflow-hidden"
          >
            <ScrollArea className="max-h-60">
              {suggestions.map((city, i) => (
                <button
                  key={i}
                  onClick={() => selectSuggestion(city)}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <div>
                    <span className="text-white">{city.city}</span>
                    <span className="text-white/50 ml-2">{city.country}</span>
                  </div>
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
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);

  // Form state
  const [departure, setDeparture] = useState('');
  const [destinations, setDestinations] = useState(['']);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [travelers, setTravelers] = useState({
    adults: 1,
    children_above_10: 0,
    children_below_10: 0,
    seniors: 0,
    infants: 0
  });
  const [foodPreference, setFoodPreference] = useState('No preference');
  const [accommodationType, setAccommodationType] = useState('mid-range');
  const [interests, setInterests] = useState([]);

  // Fetch currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get(`${API_URL}/currencies`);
        setCurrencies(response.data);
      } catch (error) {
        console.error('Failed to fetch currencies');
      }
    };
    fetchCurrencies();
  }, []);

  const addDestination = () => {
    if (destinations.length < 5) {
      setDestinations([...destinations, '']);
    }
  };

  const removeDestination = (index) => {
    if (destinations.length > 1) {
      setDestinations(destinations.filter((_, i) => i !== index));
    }
  };

  const updateDestination = (index, value) => {
    const newDests = [...destinations];
    newDests[index] = value;
    setDestinations(newDests);
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    }
  };

  const totalTravelers = Object.values(travelers).reduce((a, b) => a + b, 0);
  const tripDays = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return departure.trim() && destinations.some(d => d.trim());
      case 2:
        return startDate && endDate && tripDays > 0;
      case 3:
        return totalTravelers > 0 && budget > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const tripRequest = {
        departure_location: departure,
        destinations: destinations.filter(d => d.trim()),
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        budget: parseFloat(budget),
        currency,
        travelers,
        food_preferences: foodPreference,
        accommodation_type: accommodationType,
        interests
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

  const getCurrencySymbol = (code) => {
    const curr = currencies.find(c => c.code === code);
    return curr ? curr.symbol : code;
  };

  return (
    <div className="min-h-screen bg-[#050505]" data-testid="plan-trip-page">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#A38322] flex items-center justify-center">
              <Plane className="w-4 sm:w-5 h-4 sm:h-5 text-black" />
            </div>
            <span className="font-heading text-xl sm:text-2xl text-white tracking-tight">Odyssey</span>
          </Link>
          
          <Link to="/" className="text-white/70 hover:text-[#D4AF37] transition-colors font-body flex items-center gap-2 text-sm sm:text-base">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>
      </nav>

      <div className="pt-24 sm:pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 sm:mb-12 overflow-x-auto pb-2">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div 
                  className={`flex flex-col items-center ${
                    currentStep >= step.id ? 'text-[#D4AF37]' : 'text-white/30'
                  }`}
                >
                  <div className={`
                    w-10 sm:w-12 h-10 sm:h-12 rounded-full flex items-center justify-center transition-all
                    ${currentStep === step.id ? 'bg-[#D4AF37] text-black' : 
                      currentStep > step.id ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 
                      'bg-white/5 text-white/30'}
                  `}>
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-4 sm:w-5 h-4 sm:h-5" />
                    )}
                  </div>
                  <span className="text-xs mt-2 font-body hidden sm:block">{step.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-20 h-0.5 mx-1 sm:mx-2 ${
                    currentStep > step.id ? 'bg-[#D4AF37]' : 'bg-white/10'
                  }`} />
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
              className="card-glass p-6 sm:p-8 md:p-10"
            >
              {/* Step 1: Destinations */}
              {currentStep === 1 && (
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl text-white mb-2">Where's your adventure?</h2>
                    <p className="text-white/50 font-body text-sm sm:text-base">Tell us where you're starting from and where you want to go</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/70 font-body mb-2 block">Departure City</Label>
                      <div className="relative">
                        <Plane className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 z-10" />
                        <CityAutocomplete
                          value={departure}
                          onChange={setDeparture}
                          placeholder="e.g., New York, USA"
                          testId="departure-input"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-white/70 font-body mb-2 block">Destination(s)</Label>
                      {destinations.map((dest, i) => (
                        <div key={i} className="relative mb-3">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37] z-10" />
                          <CityAutocomplete
                            value={dest}
                            onChange={(val) => updateDestination(i, val)}
                            placeholder={`Destination ${i + 1} (e.g., Paris, France)`}
                            testId={`destination-input-${i}`}
                          />
                          {destinations.length > 1 && (
                            <button
                              onClick={() => removeDestination(i)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-red-400 z-10"
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

              {/* Step 2: Dates */}
              {currentStep === 2 && (
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl text-white mb-2">When are you traveling?</h2>
                    <p className="text-white/50 font-body text-sm sm:text-base">Select your travel dates</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <Label className="text-white/70 font-body mb-2 block">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-12 sm:h-14 justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10"
                            data-testid="start-date-btn"
                          >
                            <Calendar className="mr-3 h-5 w-5 text-[#D4AF37]" />
                            {startDate ? format(startDate, 'PPP') : <span className="text-white/30">Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[#0A0A0A] border-white/10" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="bg-[#0A0A0A]"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="text-white/70 font-body mb-2 block">End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-12 sm:h-14 justify-start text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10"
                            data-testid="end-date-btn"
                          >
                            <Calendar className="mr-3 h-5 w-5 text-[#D4AF37]" />
                            {endDate ? format(endDate, 'PPP') : <span className="text-white/30">Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[#0A0A0A] border-white/10" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => date < (startDate || new Date())}
                            initialFocus
                            className="bg-[#0A0A0A]"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {tripDays > 0 && (
                    <div className="p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                      <p className="text-[#D4AF37] font-body text-center">
                        <span className="font-heading text-2xl">{tripDays}</span> {tripDays === 1 ? 'day' : 'days'} adventure
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Travelers & Budget */}
              {currentStep === 3 && (
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl text-white mb-2">Who's traveling?</h2>
                    <p className="text-white/50 font-body text-sm sm:text-base">Tell us about your travel group and budget</p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { key: 'adults', label: 'Adults (18+)', icon: User },
                      { key: 'seniors', label: 'Seniors (60+)', icon: UserCheck },
                      { key: 'children_above_10', label: 'Children (10-17)', icon: Users },
                      { key: 'children_below_10', label: 'Children (2-9)', icon: User },
                      { key: 'infants', label: 'Infants (0-1)', icon: Baby }
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Icon className="w-4 sm:w-5 h-4 sm:h-5 text-[#D4AF37]" />
                          <span className="text-white font-body text-sm sm:text-base">{label}</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="w-8 sm:w-10 h-8 sm:h-10 rounded-full border-white/20 text-white hover:bg-white/10"
                            onClick={() => setTravelers({ ...travelers, [key]: Math.max(0, travelers[key] - 1) })}
                            data-testid={`${key}-minus-btn`}
                          >
                            -
                          </Button>
                          <span className="w-6 sm:w-8 text-center text-white font-heading text-lg sm:text-xl" data-testid={`${key}-count`}>
                            {travelers[key]}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="w-8 sm:w-10 h-8 sm:h-10 rounded-full border-white/20 text-white hover:bg-white/10"
                            onClick={() => setTravelers({ ...travelers, [key]: travelers[key] + 1 })}
                            data-testid={`${key}-plus-btn`}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-white/10">
                    <div>
                      <Label className="text-white/70 font-body mb-2 block">Total Budget</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]" />
                        <Input
                          type="number"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          placeholder="5000"
                          className="pl-12 h-12 sm:h-14 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#D4AF37]/50"
                          data-testid="budget-input"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white/70 font-body mb-2 block">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="h-12 sm:h-14 bg-white/5 border-white/10 text-white" data-testid="currency-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0A0A0A] border-white/10 max-h-60">
                          {currencies.map((curr) => (
                            <SelectItem key={curr.code} value={curr.code}>
                              {curr.symbol} {curr.code} - {curr.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {totalTravelers > 0 && budget > 0 && (
                    <div className="p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                      <p className="text-[#D4AF37] font-body text-center">
                        ~{getCurrencySymbol(currency)} {Math.round(budget / totalTravelers).toLocaleString()} per person
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Preferences */}
              {currentStep === 4 && (
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl text-white mb-2">Personalize your trip</h2>
                    <p className="text-white/50 font-body text-sm sm:text-base">Help us tailor recommendations to your preferences</p>
                  </div>

                  <div>
                    <Label className="text-white/70 font-body mb-3 block">Food Preferences</Label>
                    <Select value={foodPreference} onValueChange={setFoodPreference}>
                      <SelectTrigger className="h-12 sm:h-14 bg-white/5 border-white/10 text-white" data-testid="food-preference-select">
                        <div className="flex items-center gap-3">
                          <Utensils className="w-5 h-5 text-[#D4AF37]" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border-white/10">
                        <SelectItem value="No preference">No preference</SelectItem>
                        <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="Vegan">Vegan</SelectItem>
                        <SelectItem value="Halal">Halal</SelectItem>
                        <SelectItem value="Kosher">Kosher</SelectItem>
                        <SelectItem value="Gluten-free">Gluten-free</SelectItem>
                        <SelectItem value="Pescatarian">Pescatarian</SelectItem>
                        <SelectItem value="Local cuisine">Local cuisine focus</SelectItem>
                        <SelectItem value="Street food">Street food lover</SelectItem>
                        <SelectItem value="Fine dining">Fine dining</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white/70 font-body mb-3 block">Accommodation Type</Label>
                    <Select value={accommodationType} onValueChange={setAccommodationType}>
                      <SelectTrigger className="h-12 sm:h-14 bg-white/5 border-white/10 text-white" data-testid="accommodation-select">
                        <div className="flex items-center gap-3">
                          <Home className="w-5 h-5 text-[#D4AF37]" />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border-white/10">
                        <SelectItem value="budget">Budget (Hostels, Budget Hotels)</SelectItem>
                        <SelectItem value="mid-range">Mid-Range (3-4 Star Hotels)</SelectItem>
                        <SelectItem value="luxury">Luxury (5 Star Hotels, Resorts)</SelectItem>
                        <SelectItem value="boutique">Boutique Hotels</SelectItem>
                        <SelectItem value="vacation-rental">Vacation Rentals (Airbnb)</SelectItem>
                        <SelectItem value="eco-friendly">Eco-Friendly / Sustainable</SelectItem>
                        <SelectItem value="unique">Unique Stays (Treehouses, Igloos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white/70 font-body mb-3 block">
                      Interests (select up to 5)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((interest) => (
                        <Badge
                          key={interest}
                          variant={interests.includes(interest) ? "default" : "outline"}
                          className={`cursor-pointer py-2 px-3 sm:px-4 text-xs sm:text-sm transition-all ${
                            interests.includes(interest) 
                              ? 'bg-[#D4AF37] text-black hover:bg-[#E5C568] border-[#D4AF37]' 
                              : 'bg-transparent border-white/20 text-white/70 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]'
                          }`}
                          onClick={() => toggleInterest(interest)}
                          data-testid={`interest-${interest.toLowerCase().replace(/ /g, '-')}`}
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/10">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="text-white/70 hover:text-white"
                    data-testid="prev-step-btn"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceed()}
                    className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-6 sm:px-8"
                    data-testid="next-step-btn"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-[#D4AF37] text-black hover:bg-[#E5C568] rounded-full px-6 sm:px-8"
                    data-testid="generate-trip-btn"
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
