from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import asyncio
import httpx

# LLM Integration
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', os.urandom(32).hex())
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# Create the main app
app = FastAPI(title="Odyssey API", description="AI-Powered Travel Planning by Ajay Reddy Gopu")

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== COMPREHENSIVE DATA ====================

# All Countries with passport info
COUNTRIES = [
    {"code": "US", "name": "United States", "flag": "🇺🇸"},
    {"code": "GB", "name": "United Kingdom", "flag": "🇬🇧"},
    {"code": "CA", "name": "Canada", "flag": "🇨🇦"},
    {"code": "AU", "name": "Australia", "flag": "🇦🇺"},
    {"code": "DE", "name": "Germany", "flag": "🇩🇪"},
    {"code": "FR", "name": "France", "flag": "🇫🇷"},
    {"code": "IT", "name": "Italy", "flag": "🇮🇹"},
    {"code": "ES", "name": "Spain", "flag": "🇪🇸"},
    {"code": "JP", "name": "Japan", "flag": "🇯🇵"},
    {"code": "KR", "name": "South Korea", "flag": "🇰🇷"},
    {"code": "CN", "name": "China", "flag": "🇨🇳"},
    {"code": "IN", "name": "India", "flag": "🇮🇳"},
    {"code": "BR", "name": "Brazil", "flag": "🇧🇷"},
    {"code": "MX", "name": "Mexico", "flag": "🇲🇽"},
    {"code": "RU", "name": "Russia", "flag": "🇷🇺"},
    {"code": "ZA", "name": "South Africa", "flag": "🇿🇦"},
    {"code": "AE", "name": "United Arab Emirates", "flag": "🇦🇪"},
    {"code": "SG", "name": "Singapore", "flag": "🇸🇬"},
    {"code": "TH", "name": "Thailand", "flag": "🇹🇭"},
    {"code": "MY", "name": "Malaysia", "flag": "🇲🇾"},
    {"code": "ID", "name": "Indonesia", "flag": "🇮🇩"},
    {"code": "PH", "name": "Philippines", "flag": "🇵🇭"},
    {"code": "VN", "name": "Vietnam", "flag": "🇻🇳"},
    {"code": "NZ", "name": "New Zealand", "flag": "🇳🇿"},
    {"code": "IE", "name": "Ireland", "flag": "🇮🇪"},
    {"code": "NL", "name": "Netherlands", "flag": "🇳🇱"},
    {"code": "BE", "name": "Belgium", "flag": "🇧🇪"},
    {"code": "CH", "name": "Switzerland", "flag": "🇨🇭"},
    {"code": "AT", "name": "Austria", "flag": "🇦🇹"},
    {"code": "SE", "name": "Sweden", "flag": "🇸🇪"},
    {"code": "NO", "name": "Norway", "flag": "🇳🇴"},
    {"code": "DK", "name": "Denmark", "flag": "🇩🇰"},
    {"code": "FI", "name": "Finland", "flag": "🇫🇮"},
    {"code": "PT", "name": "Portugal", "flag": "🇵🇹"},
    {"code": "GR", "name": "Greece", "flag": "🇬🇷"},
    {"code": "TR", "name": "Turkey", "flag": "🇹🇷"},
    {"code": "EG", "name": "Egypt", "flag": "🇪🇬"},
    {"code": "SA", "name": "Saudi Arabia", "flag": "🇸🇦"},
    {"code": "IL", "name": "Israel", "flag": "🇮🇱"},
    {"code": "PK", "name": "Pakistan", "flag": "🇵🇰"},
    {"code": "BD", "name": "Bangladesh", "flag": "🇧🇩"},
    {"code": "LK", "name": "Sri Lanka", "flag": "🇱🇰"},
    {"code": "NP", "name": "Nepal", "flag": "🇳🇵"},
    {"code": "AR", "name": "Argentina", "flag": "🇦🇷"},
    {"code": "CL", "name": "Chile", "flag": "🇨🇱"},
    {"code": "CO", "name": "Colombia", "flag": "🇨🇴"},
    {"code": "PE", "name": "Peru", "flag": "🇵🇪"},
    {"code": "PL", "name": "Poland", "flag": "🇵🇱"},
    {"code": "CZ", "name": "Czech Republic", "flag": "🇨🇿"},
    {"code": "HU", "name": "Hungary", "flag": "🇭🇺"},
    {"code": "RO", "name": "Romania", "flag": "🇷🇴"},
    {"code": "UA", "name": "Ukraine", "flag": "🇺🇦"},
    {"code": "NG", "name": "Nigeria", "flag": "🇳🇬"},
    {"code": "KE", "name": "Kenya", "flag": "🇰🇪"},
    {"code": "MA", "name": "Morocco", "flag": "🇲🇦"},
    {"code": "TW", "name": "Taiwan", "flag": "🇹🇼"},
    {"code": "HK", "name": "Hong Kong", "flag": "🇭🇰"},
    {"code": "MV", "name": "Maldives", "flag": "🇲🇻"},
    {"code": "QA", "name": "Qatar", "flag": "🇶🇦"},
    {"code": "KW", "name": "Kuwait", "flag": "🇰🇼"}
]

# Currencies with exchange rates (base USD)
CURRENCIES = [
    {"code": "USD", "symbol": "$", "name": "US Dollar", "rate": 1.0},
    {"code": "EUR", "symbol": "€", "name": "Euro", "rate": 0.92},
    {"code": "GBP", "symbol": "£", "name": "British Pound", "rate": 0.79},
    {"code": "INR", "symbol": "₹", "name": "Indian Rupee", "rate": 83.12},
    {"code": "AUD", "symbol": "A$", "name": "Australian Dollar", "rate": 1.53},
    {"code": "CAD", "symbol": "C$", "name": "Canadian Dollar", "rate": 1.36},
    {"code": "JPY", "symbol": "¥", "name": "Japanese Yen", "rate": 149.50},
    {"code": "CNY", "symbol": "¥", "name": "Chinese Yuan", "rate": 7.24},
    {"code": "CHF", "symbol": "Fr", "name": "Swiss Franc", "rate": 0.88},
    {"code": "SGD", "symbol": "S$", "name": "Singapore Dollar", "rate": 1.34},
    {"code": "AED", "symbol": "د.إ", "name": "UAE Dirham", "rate": 3.67},
    {"code": "THB", "symbol": "฿", "name": "Thai Baht", "rate": 35.50},
    {"code": "MXN", "symbol": "$", "name": "Mexican Peso", "rate": 17.15},
    {"code": "BRL", "symbol": "R$", "name": "Brazilian Real", "rate": 4.97},
    {"code": "ZAR", "symbol": "R", "name": "South African Rand", "rate": 18.65},
    {"code": "NZD", "symbol": "NZ$", "name": "New Zealand Dollar", "rate": 1.64},
    {"code": "SEK", "symbol": "kr", "name": "Swedish Krona", "rate": 10.42},
    {"code": "NOK", "symbol": "kr", "name": "Norwegian Krone", "rate": 10.58},
    {"code": "DKK", "symbol": "kr", "name": "Danish Krone", "rate": 6.87},
    {"code": "HKD", "symbol": "HK$", "name": "Hong Kong Dollar", "rate": 7.82},
    {"code": "KRW", "symbol": "₩", "name": "South Korean Won", "rate": 1320.50},
    {"code": "MYR", "symbol": "RM", "name": "Malaysian Ringgit", "rate": 4.72},
    {"code": "PHP", "symbol": "₱", "name": "Philippine Peso", "rate": 55.80},
    {"code": "IDR", "symbol": "Rp", "name": "Indonesian Rupiah", "rate": 15650.00},
    {"code": "TRY", "symbol": "₺", "name": "Turkish Lira", "rate": 32.15},
    {"code": "RUB", "symbol": "₽", "name": "Russian Ruble", "rate": 92.50},
    {"code": "PLN", "symbol": "zł", "name": "Polish Zloty", "rate": 3.98},
    {"code": "CZK", "symbol": "Kč", "name": "Czech Koruna", "rate": 23.25},
    {"code": "ILS", "symbol": "₪", "name": "Israeli Shekel", "rate": 3.65},
    {"code": "SAR", "symbol": "﷼", "name": "Saudi Riyal", "rate": 3.75}
]

# Cities and Airports Database
CITIES_AIRPORTS = [
    {"city": "New York", "country": "United States", "code": "US", "airports": [
        {"code": "JFK", "name": "John F. Kennedy International", "type": "international"},
        {"code": "EWR", "name": "Newark Liberty International", "type": "international"},
        {"code": "LGA", "name": "LaGuardia", "type": "domestic"}
    ]},
    {"city": "Los Angeles", "country": "United States", "code": "US", "airports": [
        {"code": "LAX", "name": "Los Angeles International", "type": "international"},
        {"code": "BUR", "name": "Hollywood Burbank", "type": "domestic"},
        {"code": "SNA", "name": "John Wayne Airport", "type": "domestic"}
    ]},
    {"city": "London", "country": "United Kingdom", "code": "GB", "airports": [
        {"code": "LHR", "name": "Heathrow", "type": "international"},
        {"code": "LGW", "name": "Gatwick", "type": "international"},
        {"code": "STN", "name": "Stansted", "type": "international"},
        {"code": "LTN", "name": "Luton", "type": "budget"}
    ]},
    {"city": "Paris", "country": "France", "code": "FR", "airports": [
        {"code": "CDG", "name": "Charles de Gaulle", "type": "international"},
        {"code": "ORY", "name": "Orly", "type": "international"}
    ]},
    {"city": "Tokyo", "country": "Japan", "code": "JP", "airports": [
        {"code": "NRT", "name": "Narita International", "type": "international"},
        {"code": "HND", "name": "Haneda", "type": "international"}
    ]},
    {"city": "Dubai", "country": "United Arab Emirates", "code": "AE", "airports": [
        {"code": "DXB", "name": "Dubai International", "type": "international"},
        {"code": "DWC", "name": "Al Maktoum International", "type": "international"}
    ]},
    {"city": "Singapore", "country": "Singapore", "code": "SG", "airports": [
        {"code": "SIN", "name": "Changi Airport", "type": "international"}
    ]},
    {"city": "Mumbai", "country": "India", "code": "IN", "airports": [
        {"code": "BOM", "name": "Chhatrapati Shivaji Maharaj International", "type": "international"}
    ]},
    {"city": "Delhi", "country": "India", "code": "IN", "airports": [
        {"code": "DEL", "name": "Indira Gandhi International", "type": "international"}
    ]},
    {"city": "Bangkok", "country": "Thailand", "code": "TH", "airports": [
        {"code": "BKK", "name": "Suvarnabhumi", "type": "international"},
        {"code": "DMK", "name": "Don Mueang", "type": "budget"}
    ]},
    {"city": "Sydney", "country": "Australia", "code": "AU", "airports": [
        {"code": "SYD", "name": "Kingsford Smith", "type": "international"}
    ]},
    {"city": "Hong Kong", "country": "Hong Kong", "code": "HK", "airports": [
        {"code": "HKG", "name": "Hong Kong International", "type": "international"}
    ]},
    {"city": "Rome", "country": "Italy", "code": "IT", "airports": [
        {"code": "FCO", "name": "Leonardo da Vinci–Fiumicino", "type": "international"},
        {"code": "CIA", "name": "Ciampino", "type": "budget"}
    ]},
    {"city": "Barcelona", "country": "Spain", "code": "ES", "airports": [
        {"code": "BCN", "name": "Josep Tarradellas Barcelona–El Prat", "type": "international"}
    ]},
    {"city": "Amsterdam", "country": "Netherlands", "code": "NL", "airports": [
        {"code": "AMS", "name": "Schiphol", "type": "international"}
    ]},
    {"city": "Frankfurt", "country": "Germany", "code": "DE", "airports": [
        {"code": "FRA", "name": "Frankfurt Airport", "type": "international"}
    ]},
    {"city": "Toronto", "country": "Canada", "code": "CA", "airports": [
        {"code": "YYZ", "name": "Toronto Pearson International", "type": "international"},
        {"code": "YTZ", "name": "Billy Bishop Toronto City", "type": "domestic"}
    ]},
    {"city": "Seoul", "country": "South Korea", "code": "KR", "airports": [
        {"code": "ICN", "name": "Incheon International", "type": "international"},
        {"code": "GMP", "name": "Gimpo International", "type": "domestic"}
    ]},
    {"city": "Istanbul", "country": "Turkey", "code": "TR", "airports": [
        {"code": "IST", "name": "Istanbul Airport", "type": "international"},
        {"code": "SAW", "name": "Sabiha Gökçen", "type": "international"}
    ]},
    {"city": "Bali", "country": "Indonesia", "code": "ID", "airports": [
        {"code": "DPS", "name": "Ngurah Rai International", "type": "international"}
    ]},
    {"city": "Maldives", "country": "Maldives", "code": "MV", "airports": [
        {"code": "MLE", "name": "Velana International", "type": "international"}
    ]},
    {"city": "Santorini", "country": "Greece", "code": "GR", "airports": [
        {"code": "JTR", "name": "Santorini Airport", "type": "international"}
    ]},
    {"city": "Phuket", "country": "Thailand", "code": "TH", "airports": [
        {"code": "HKT", "name": "Phuket International", "type": "international"}
    ]},
    {"city": "Cancun", "country": "Mexico", "code": "MX", "airports": [
        {"code": "CUN", "name": "Cancún International", "type": "international"}
    ]},
    {"city": "Miami", "country": "United States", "code": "US", "airports": [
        {"code": "MIA", "name": "Miami International", "type": "international"},
        {"code": "FLL", "name": "Fort Lauderdale–Hollywood", "type": "international"}
    ]}
]

# Travel Insurance Providers
INSURANCE_PROVIDERS = [
    {"name": "World Nomads", "url": "https://www.worldnomads.com", "price_range": "$40-150", "coverage": "Comprehensive", "best_for": "Adventure travelers"},
    {"name": "SafetyWing", "url": "https://safetywing.com", "price_range": "$40-80/month", "coverage": "Medical + Travel", "best_for": "Digital nomads"},
    {"name": "Allianz Travel", "url": "https://www.allianztravelinsurance.com", "price_range": "$30-200", "coverage": "Full coverage", "best_for": "Families"},
    {"name": "Travel Guard", "url": "https://www.travelguard.com", "price_range": "$25-150", "coverage": "Customizable", "best_for": "Budget travelers"},
    {"name": "IMG Global", "url": "https://www.imglobal.com", "price_range": "$50-300", "coverage": "International Medical", "best_for": "Long-term travelers"},
    {"name": "Heymondo", "url": "https://heymondo.com", "price_range": "$30-120", "coverage": "Adventure sports", "best_for": "Sports enthusiasts"}
]

# Baggage Info by Airline Type
BAGGAGE_INFO = {
    "economy": {
        "cabin": {"weight": "7-10 kg", "dimensions": "55x40x23 cm", "pieces": 1},
        "checked": {"weight": "20-23 kg", "dimensions": "158 cm (L+W+H)", "pieces": 1}
    },
    "premium_economy": {
        "cabin": {"weight": "10-12 kg", "dimensions": "55x40x23 cm", "pieces": 1},
        "checked": {"weight": "25-30 kg", "dimensions": "158 cm (L+W+H)", "pieces": 2}
    },
    "business": {
        "cabin": {"weight": "12-18 kg", "dimensions": "55x40x23 cm", "pieces": 2},
        "checked": {"weight": "30-40 kg", "dimensions": "158 cm (L+W+H)", "pieces": 2}
    },
    "first": {
        "cabin": {"weight": "18-20 kg", "dimensions": "55x40x23 cm", "pieces": 2},
        "checked": {"weight": "40-50 kg", "dimensions": "158 cm (L+W+H)", "pieces": 3}
    }
}

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class TravelerDetails(BaseModel):
    adults: int = 1
    children_above_10: int = 0
    children_below_10: int = 0
    seniors: int = 0
    infants: int = 0

class ExistingBooking(BaseModel):
    has_flight: bool = False
    flight_details: Optional[Dict[str, Any]] = None
    has_hotel: bool = False
    hotel_details: Optional[Dict[str, Any]] = None
    has_insurance: bool = False

class TripRequest(BaseModel):
    # Customer type: "plan_only", "partial", "fresh"
    customer_type: str = "fresh"
    existing_bookings: Optional[ExistingBooking] = None
    
    # Passport info
    passport_countries: List[str] = []
    
    # Trip details
    departure_location: str
    departure_airports: Optional[List[str]] = []
    destinations: List[str]
    start_date: str
    end_date: str
    
    # Budget
    budget: float
    currency: str = "USD"
    
    # Travelers
    travelers: TravelerDetails
    
    # Preferences
    food_preferences: Optional[str] = "No preference"
    accommodation_type: Optional[str] = "mid-range"
    interests: Optional[List[str]] = []
    fitness_interests: Optional[List[str]] = []
    
    # Options
    need_insurance: bool = True
    cabin_class: str = "economy"

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class NewsletterSubscribe(BaseModel):
    email: EmailStr

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def convert_currency(amount: float, from_currency: str, to_currency: str) -> float:
    """Convert amount between currencies"""
    from_rate = next((c["rate"] for c in CURRENCIES if c["code"] == from_currency), 1.0)
    to_rate = next((c["rate"] for c in CURRENCIES if c["code"] == to_currency), 1.0)
    usd_amount = amount / from_rate
    return round(usd_amount * to_rate, 2)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email)
    return TokenResponse(
        token=token,
        user=UserResponse(id=user_id, email=user_data.email, name=user_data.name, created_at=user_doc["created_at"])
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"])
    return TokenResponse(
        token=token,
        user=UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**{k: current_user[k] for k in ["id", "email", "name", "created_at"]})

# ==================== DATA ENDPOINTS ====================

@api_router.get("/countries")
async def get_countries():
    """Get all countries for passport selection"""
    return COUNTRIES

@api_router.get("/currencies")
async def get_currencies():
    """Get all supported currencies with exchange rates"""
    return CURRENCIES

@api_router.get("/convert-currency")
async def convert_currency_endpoint(amount: float, from_curr: str, to_curr: str):
    """Convert currency"""
    converted = convert_currency(amount, from_curr, to_curr)
    return {"original": amount, "from": from_curr, "to": to_curr, "converted": converted}

@api_router.get("/autocomplete/cities")
async def autocomplete_cities(q: str = ""):
    """Autocomplete for cities with airports"""
    if len(q) < 2:
        return CITIES_AIRPORTS[:15]
    
    q_lower = q.lower()
    matches = [
        city for city in CITIES_AIRPORTS 
        if q_lower in city["city"].lower() or q_lower in city["country"].lower()
    ]
    return matches[:15]

@api_router.get("/airports/{city}")
async def get_city_airports(city: str):
    """Get all airports for a city"""
    city_data = next((c for c in CITIES_AIRPORTS if c["city"].lower() == city.lower()), None)
    if city_data:
        return city_data["airports"]
    return []

@api_router.get("/insurance-providers")
async def get_insurance_providers():
    """Get travel insurance providers"""
    return INSURANCE_PROVIDERS

@api_router.get("/baggage-info/{cabin_class}")
async def get_baggage_info(cabin_class: str):
    """Get baggage allowance by cabin class"""
    return BAGGAGE_INFO.get(cabin_class, BAGGAGE_INFO["economy"])

@api_router.get("/visa-requirements")
async def get_visa_requirements(passport_country: str, destination_country: str):
    """Get visa requirements based on passport and destination"""
    # This would ideally connect to a visa API, for now return smart defaults
    # Strong passports (visa-free to most places)
    strong_passports = ["US", "GB", "DE", "FR", "JP", "KR", "SG", "AU", "CA", "NZ", "IE", "NL", "CH", "SE", "NO", "DK", "FI"]
    
    # Schengen countries
    schengen = ["DE", "FR", "IT", "ES", "NL", "BE", "AT", "CH", "PT", "GR", "SE", "NO", "DK", "FI", "CZ", "HU", "PL"]
    
    passport_strong = passport_country in strong_passports
    dest_schengen = destination_country in schengen
    passport_schengen = passport_country in schengen
    
    if passport_country == destination_country:
        return {"visa_required": False, "type": "citizen", "notes": "No visa required - you are a citizen"}
    
    if passport_schengen and dest_schengen:
        return {"visa_required": False, "type": "schengen_free", "notes": "Free movement within Schengen Area"}
    
    if passport_strong:
        return {
            "visa_required": False if destination_country in ["JP", "KR", "SG", "TH", "MY", "ID", "MX", "BR", "AR"] + schengen else True,
            "type": "visa_free" if destination_country in schengen else "check_required",
            "notes": "Strong passport - check specific requirements",
            "processing_time": "Varies",
            "apply_link": f"https://www.google.com/search?q={destination_country}+visa+for+{passport_country}+passport"
        }
    
    return {
        "visa_required": True,
        "type": "visa_required",
        "notes": "Visa likely required - check embassy website",
        "processing_time": "5-15 business days",
        "apply_link": f"https://www.google.com/search?q={destination_country}+visa+application+{passport_country}"
    }

# ==================== PACKING LIST GENERATOR ====================

@api_router.post("/generate-packing-list")
async def generate_packing_list(
    destination: str,
    duration: int,
    weather: str = "moderate",
    activities: List[str] = [],
    travelers: TravelerDetails = None
):
    """Generate comprehensive packing checklist"""
    checklist = {
        "documents": [
            {"item": "Passport (valid 6+ months)", "essential": True, "quantity": 1},
            {"item": "Visa documents (if required)", "essential": True, "quantity": 1},
            {"item": "Flight tickets/confirmations", "essential": True, "quantity": 1},
            {"item": "Hotel reservations", "essential": True, "quantity": 1},
            {"item": "Travel insurance documents", "essential": True, "quantity": 1},
            {"item": "Driver's license / International driving permit", "essential": False, "quantity": 1},
            {"item": "Credit/Debit cards", "essential": True, "quantity": 2},
            {"item": "Emergency contact list", "essential": True, "quantity": 1},
            {"item": "Copies of all documents (physical + digital)", "essential": True, "quantity": 1},
            {"item": "Vaccination certificates", "essential": False, "quantity": 1}
        ],
        "clothing": [
            {"item": "Underwear", "essential": True, "quantity": duration + 2},
            {"item": "Socks", "essential": True, "quantity": duration + 2},
            {"item": "T-shirts/Tops", "essential": True, "quantity": min(duration, 7)},
            {"item": "Pants/Trousers", "essential": True, "quantity": min(duration // 2 + 1, 4)},
            {"item": "Comfortable walking shoes", "essential": True, "quantity": 1},
            {"item": "Sleepwear", "essential": True, "quantity": 2},
            {"item": "Belt", "essential": False, "quantity": 1}
        ],
        "toiletries": [
            {"item": "Toothbrush & toothpaste", "essential": True, "quantity": 1},
            {"item": "Deodorant", "essential": True, "quantity": 1},
            {"item": "Shampoo & conditioner (travel size)", "essential": True, "quantity": 1},
            {"item": "Soap/Body wash", "essential": True, "quantity": 1},
            {"item": "Razor & shaving cream", "essential": False, "quantity": 1},
            {"item": "Sunscreen SPF 30+", "essential": True, "quantity": 1},
            {"item": "Lip balm with SPF", "essential": False, "quantity": 1},
            {"item": "Hand sanitizer", "essential": True, "quantity": 1},
            {"item": "Wet wipes", "essential": False, "quantity": 1}
        ],
        "electronics": [
            {"item": "Phone + charger", "essential": True, "quantity": 1},
            {"item": "Power bank", "essential": True, "quantity": 1},
            {"item": "Universal power adapter", "essential": True, "quantity": 1},
            {"item": "Camera + charger", "essential": False, "quantity": 1},
            {"item": "Headphones/Earbuds", "essential": False, "quantity": 1},
            {"item": "E-reader/Tablet", "essential": False, "quantity": 1}
        ],
        "health": [
            {"item": "Prescription medications", "essential": True, "quantity": duration + 7},
            {"item": "Pain relievers (Ibuprofen/Paracetamol)", "essential": True, "quantity": 1},
            {"item": "Antihistamines", "essential": False, "quantity": 1},
            {"item": "Motion sickness medication", "essential": False, "quantity": 1},
            {"item": "Antidiarrheal medication", "essential": True, "quantity": 1},
            {"item": "First aid kit", "essential": True, "quantity": 1},
            {"item": "Insect repellent", "essential": False, "quantity": 1}
        ],
        "accessories": [
            {"item": "Daypack/Small backpack", "essential": True, "quantity": 1},
            {"item": "Reusable water bottle", "essential": True, "quantity": 1},
            {"item": "Sunglasses", "essential": True, "quantity": 1},
            {"item": "Travel pillow", "essential": False, "quantity": 1},
            {"item": "Eye mask & earplugs", "essential": False, "quantity": 1},
            {"item": "Packing cubes", "essential": False, "quantity": 3},
            {"item": "Laundry bag", "essential": False, "quantity": 1},
            {"item": "Umbrella (compact)", "essential": False, "quantity": 1}
        ]
    }
    
    # Add weather-specific items
    if "cold" in weather.lower() or "winter" in weather.lower():
        checklist["clothing"].extend([
            {"item": "Warm jacket/Coat", "essential": True, "quantity": 1},
            {"item": "Sweaters/Fleece", "essential": True, "quantity": 2},
            {"item": "Thermal underwear", "essential": True, "quantity": 2},
            {"item": "Gloves", "essential": True, "quantity": 1},
            {"item": "Warm hat/Beanie", "essential": True, "quantity": 1},
            {"item": "Scarf", "essential": True, "quantity": 1},
            {"item": "Warm boots", "essential": True, "quantity": 1}
        ])
    elif "hot" in weather.lower() or "tropical" in weather.lower():
        checklist["clothing"].extend([
            {"item": "Swimsuit", "essential": True, "quantity": 2},
            {"item": "Flip-flops/Sandals", "essential": True, "quantity": 1},
            {"item": "Sun hat", "essential": True, "quantity": 1},
            {"item": "Light coverup/Sarong", "essential": False, "quantity": 1},
            {"item": "Reef-safe sunscreen", "essential": True, "quantity": 1}
        ])
        checklist["health"].append({"item": "Insect repellent (DEET)", "essential": True, "quantity": 1})
    
    # Add activity-specific items
    if "hiking" in [a.lower() for a in activities] or "trekking" in [a.lower() for a in activities]:
        checklist["accessories"].extend([
            {"item": "Hiking boots", "essential": True, "quantity": 1},
            {"item": "Hiking backpack", "essential": True, "quantity": 1},
            {"item": "Trekking poles", "essential": False, "quantity": 1},
            {"item": "Headlamp/Flashlight", "essential": True, "quantity": 1}
        ])
    
    if "beach" in [a.lower() for a in activities]:
        checklist["accessories"].extend([
            {"item": "Beach towel", "essential": True, "quantity": 1},
            {"item": "Snorkeling gear", "essential": False, "quantity": 1},
            {"item": "Waterproof phone pouch", "essential": True, "quantity": 1}
        ])
    
    if "fitness" in [a.lower() for a in activities] or "gym" in [a.lower() for a in activities]:
        checklist["clothing"].extend([
            {"item": "Workout clothes", "essential": True, "quantity": 3},
            {"item": "Running shoes", "essential": True, "quantity": 1},
            {"item": "Resistance bands", "essential": False, "quantity": 1}
        ])
    
    return checklist

# ==================== TRIP GENERATION ====================

async def generate_trip_with_ai(trip_request: TripRequest) -> dict:
    """Generate comprehensive trip plan"""
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    from datetime import datetime as dt
    start = dt.strptime(trip_request.start_date, "%Y-%m-%d")
    end = dt.strptime(trip_request.end_date, "%Y-%m-%d")
    total_days = (end - start).days + 1
    
    total_travelers = (
        trip_request.travelers.adults + 
        trip_request.travelers.children_above_10 + 
        trip_request.travelers.children_below_10 + 
        trip_request.travelers.seniors +
        trip_request.travelers.infants
    )
    
    customer_type_desc = {
        "plan_only": "Customer has already booked flights and hotels. Only generate day-wise itinerary.",
        "partial": "Customer has partial bookings. Check existing_bookings for details.",
        "fresh": "Customer needs everything - flights, hotels, and itinerary."
    }.get(trip_request.customer_type, "Full planning needed")
    
    fitness_interests = ", ".join(trip_request.fitness_interests) if trip_request.fitness_interests else "None specified"
    
    prompt = f"""You are an expert travel planner. Create a comprehensive travel plan in JSON format.

CUSTOMER TYPE: {trip_request.customer_type}
{customer_type_desc}

TRIP DETAILS:
- Passport Countries: {', '.join(trip_request.passport_countries)}
- Departure: {trip_request.departure_location}
- Destinations: {', '.join(trip_request.destinations)}
- Dates: {trip_request.start_date} to {trip_request.end_date} ({total_days} days)
- Budget: {trip_request.budget} {trip_request.currency}
- Travelers: {total_travelers} ({trip_request.travelers.adults} adults)
- Cabin Class: {trip_request.cabin_class}
- Food: {trip_request.food_preferences}
- Accommodation: {trip_request.accommodation_type}
- Interests: {', '.join(trip_request.interests) if trip_request.interests else 'General'}
- Fitness Interests: {fitness_interests}
- Needs Insurance: {trip_request.need_insurance}

Return valid JSON with:
{{
  "title": "Trip title",
  "visa_requirements": [{{"country": "", "visa_required": bool, "type": "", "processing_time": "", "cost": 0, "notes": "", "apply_link": ""}}],
  "flights": [{{"from": "", "from_airport": "", "to": "", "to_airport": "", "date": "", "estimated_price": 0, "cabin_class": "", "baggage": {{"cabin": {{"weight": "", "dimensions": ""}}, "checked": {{"weight": "", "dimensions": ""}}}}, "airlines": [], "booking_links": {{}}}}],
  "hotels": [{{"name": "", "location": "", "rating": 0, "price_per_night": 0, "amenities": [], "booking_link": ""}}],
  "itinerary": [{{
    "day_number": 1,
    "date": "",
    "location": "",
    "weather": {{"temp_high": 0, "temp_low": 0, "condition": "", "humidity": 0}},
    "morning_activities": [{{"name": "", "description": "", "duration": "", "cost": 0, "location": "", "maps_link": "", "tips": ""}}],
    "afternoon_activities": [],
    "evening_activities": [],
    "restaurants": [{{"name": "", "cuisine": "", "price_range": "", "must_try": [], "location": "", "maps_link": "", "booking_link": ""}}],
    "transportation": [{{"type": "", "from": "", "to": "", "duration": "", "cost": 0, "booking_link": ""}}],
    "fitness_activities": [{{"name": "", "type": "", "location": "", "time": "", "cost": 0, "booking_link": ""}}],
    "estimated_cost": 0
  }}],
  "packing_suggestions": {{"weather_based": [], "activity_based": [], "legal_documents": []}},
  "local_tips": {{"emergency_numbers": [], "customs": [], "tipping_guide": "", "local_apps": [], "sim_options": []}},
  "insurance_recommendations": [{{"provider": "", "price": 0, "coverage": "", "link": ""}}],
  "booking_links": {{}},
  "total_estimated_cost": 0
}}"""

    if LLM_AVAILABLE and api_key:
        try:
            chat = LlmChat(
                api_key=api_key,
                session_id=str(uuid.uuid4()),
                system_message="Expert travel planner. Return valid JSON only."
            ).with_model("openai", "gpt-4o")
            
            response = await chat.send_message(UserMessage(text=prompt))
            
            import json
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            trip_data = json.loads(response_text.strip())
            trip_data["id"] = str(uuid.uuid4())
            trip_data["customer_type"] = trip_request.customer_type
            trip_data["passport_countries"] = trip_request.passport_countries
            trip_data["departure_location"] = trip_request.departure_location
            trip_data["destinations"] = trip_request.destinations
            trip_data["start_date"] = trip_request.start_date
            trip_data["end_date"] = trip_request.end_date
            trip_data["budget"] = trip_request.budget
            trip_data["currency"] = trip_request.currency
            trip_data["travelers"] = trip_request.travelers.model_dump()
            trip_data["total_days"] = total_days
            trip_data["created_at"] = datetime.now(timezone.utc).isoformat()
            
            return trip_data
        except Exception as e:
            logger.error(f"AI Error: {str(e)}")
    
    # Fallback generation
    return generate_fallback_trip(trip_request, total_days, total_travelers)

def generate_fallback_trip(trip_request: TripRequest, total_days: int, total_travelers: int) -> dict:
    """Generate fallback trip when AI unavailable"""
    from datetime import datetime as dt, timedelta
    
    start = dt.strptime(trip_request.start_date, "%Y-%m-%d")
    daily_budget = trip_request.budget / total_days / max(total_travelers, 1)
    
    itinerary = []
    for i in range(total_days):
        current_date = start + timedelta(days=i)
        dest_idx = min(i, len(trip_request.destinations) - 1)
        destination = trip_request.destinations[dest_idx] if trip_request.destinations else "Unknown"
        
        itinerary.append({
            "day_number": i + 1,
            "date": current_date.strftime("%Y-%m-%d"),
            "location": destination,
            "weather": {"temp_high": 25, "temp_low": 18, "condition": "Pleasant", "humidity": 60},
            "morning_activities": [{"name": f"Explore {destination}", "description": "Morning sightseeing", "duration": "3 hours", "cost": int(daily_budget * 0.1), "location": "City Center", "maps_link": f"https://maps.google.com/?q={destination}", "tips": "Start early"}],
            "afternoon_activities": [{"name": "Cultural Experience", "description": "Museums and galleries", "duration": "3 hours", "cost": int(daily_budget * 0.1), "location": "Downtown", "maps_link": "", "tips": ""}],
            "evening_activities": [{"name": "Local Dining", "description": "Try local cuisine", "duration": "2 hours", "cost": int(daily_budget * 0.15), "location": "Restaurant District", "maps_link": "", "tips": ""}],
            "restaurants": [{"name": "Local Restaurant", "cuisine": "Local", "price_range": "$$", "must_try": ["Local specialty"], "location": "", "maps_link": "", "booking_link": ""}],
            "transportation": [
                {"type": "Metro", "from": "Hotel", "to": "Center", "duration": "20 min", "cost": 3, "booking_link": ""},
                {"type": "Walking", "from": "Center", "to": "Attractions", "duration": "15 min", "cost": 0, "booking_link": ""},
                {"type": "Uber/Taxi", "from": "Various", "to": "Various", "duration": "Varies", "cost": 15, "booking_link": "https://uber.com"}
            ],
            "fitness_activities": [{"name": "Local Gym", "type": "Gym", "location": "Near hotel", "time": "6-8 AM", "cost": 15, "booking_link": ""}] if trip_request.fitness_interests else [],
            "estimated_cost": int(daily_budget * 0.8)
        })
    
    return {
        "id": str(uuid.uuid4()),
        "title": f"Trip to {', '.join(trip_request.destinations)}",
        "customer_type": trip_request.customer_type,
        "passport_countries": trip_request.passport_countries,
        "departure_location": trip_request.departure_location,
        "destinations": trip_request.destinations,
        "start_date": trip_request.start_date,
        "end_date": trip_request.end_date,
        "budget": trip_request.budget,
        "currency": trip_request.currency,
        "travelers": trip_request.travelers.model_dump(),
        "total_days": total_days,
        "visa_requirements": [],
        "flights": [],
        "hotels": [],
        "itinerary": itinerary,
        "packing_suggestions": {"weather_based": [], "activity_based": [], "legal_documents": ["Passport", "Visa", "Insurance"]},
        "local_tips": {"emergency_numbers": ["Police: 911", "Ambulance: 911"], "customs": [], "tipping_guide": "10-20%", "local_apps": ["Uber", "Google Maps"], "sim_options": []},
        "insurance_recommendations": INSURANCE_PROVIDERS[:3],
        "booking_links": {
            "flights": {"skyscanner": "https://skyscanner.com", "google_flights": "https://google.com/flights", "kayak": "https://kayak.com"},
            "hotels": {"booking": "https://booking.com", "airbnb": "https://airbnb.com", "agoda": "https://agoda.com"},
            "transportation": {"uber": "https://uber.com", "rome2rio": "https://rome2rio.com"}
        },
        "total_estimated_cost": int(trip_request.budget * 0.85),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.post("/trips/generate")
async def generate_trip(trip_request: TripRequest):
    """Generate trip plan"""
    return await generate_trip_with_ai(trip_request)

@api_router.post("/trips/save")
async def save_trip(trip_data: dict, current_user: dict = Depends(get_current_user)):
    trip_data["user_id"] = current_user["id"]
    trip_data["status"] = "planned"
    trip_data.pop("_id", None)
    await db.trips.insert_one(trip_data)
    trip_data.pop("_id", None)
    return {"message": "Trip saved", "trip_id": trip_data["id"]}

@api_router.get("/trips/my-trips")
async def get_my_trips(current_user: dict = Depends(get_current_user)):
    trips = await db.trips.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return trips

@api_router.get("/trips/{trip_id}")
async def get_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    trip = await db.trips.find_one({"id": trip_id, "user_id": current_user["id"]}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@api_router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.trips.delete_one({"id": trip_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"message": "Trip deleted"}

# ==================== CONTACT & NEWSLETTER ====================

@api_router.post("/contact")
async def submit_contact(form: ContactForm):
    contact_doc = {
        "id": str(uuid.uuid4()),
        "name": form.name,
        "email": form.email,
        "subject": form.subject,
        "message": form.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "new"
    }
    await db.contacts.insert_one(contact_doc)
    return {"message": "Message sent successfully"}

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):
    existing = await db.newsletter.find_one({"email": data.email})
    if existing:
        return {"message": "Already subscribed"}
    await db.newsletter.insert_one({
        "id": str(uuid.uuid4()),
        "email": data.email,
        "subscribed_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Subscribed successfully"}

# ==================== DESTINATIONS ====================

@api_router.get("/destinations/popular")
async def get_popular_destinations():
    return [
        {"name": "Paris, France", "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800", "tagline": "City of Lights", "rating": 4.9},
        {"name": "Tokyo, Japan", "image": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", "tagline": "Where tradition meets future", "rating": 4.8},
        {"name": "Bali, Indonesia", "image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", "tagline": "Island of the Gods", "rating": 4.9},
        {"name": "New York, USA", "image": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800", "tagline": "The city that never sleeps", "rating": 4.7},
        {"name": "Santorini, Greece", "image": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800", "tagline": "Aegean gem", "rating": 4.9},
        {"name": "Dubai, UAE", "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800", "tagline": "Future reimagined", "rating": 4.8},
        {"name": "Maldives", "image": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800", "tagline": "Paradise on Earth", "rating": 4.9},
        {"name": "Rome, Italy", "image": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800", "tagline": "Eternal City", "rating": 4.8}
    ]

# ==================== HEALTH ====================

@api_router.get("/")
async def root():
    return {"message": "Odyssey API", "status": "online", "founder": "Ajay Reddy Gopu"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
