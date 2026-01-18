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
import resend
from emergentintegrations.llm.chat import LlmChat, UserMessage

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

# Resend Configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Create the main app
app = FastAPI(title="Odyssey API", description="AI-Powered Travel Planning")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== CURRENCIES ====================
CURRENCIES = [
    {"code": "USD", "symbol": "$", "name": "US Dollar"},
    {"code": "EUR", "symbol": "€", "name": "Euro"},
    {"code": "GBP", "symbol": "£", "name": "British Pound"},
    {"code": "INR", "symbol": "₹", "name": "Indian Rupee"},
    {"code": "AUD", "symbol": "A$", "name": "Australian Dollar"},
    {"code": "CAD", "symbol": "C$", "name": "Canadian Dollar"},
    {"code": "JPY", "symbol": "¥", "name": "Japanese Yen"},
    {"code": "CNY", "symbol": "¥", "name": "Chinese Yuan"},
    {"code": "CHF", "symbol": "Fr", "name": "Swiss Franc"},
    {"code": "SGD", "symbol": "S$", "name": "Singapore Dollar"},
    {"code": "AED", "symbol": "د.إ", "name": "UAE Dirham"},
    {"code": "THB", "symbol": "฿", "name": "Thai Baht"},
    {"code": "MXN", "symbol": "$", "name": "Mexican Peso"},
    {"code": "BRL", "symbol": "R$", "name": "Brazilian Real"},
    {"code": "ZAR", "symbol": "R", "name": "South African Rand"},
    {"code": "NZD", "symbol": "NZ$", "name": "New Zealand Dollar"},
    {"code": "SEK", "symbol": "kr", "name": "Swedish Krona"},
    {"code": "NOK", "symbol": "kr", "name": "Norwegian Krone"},
    {"code": "DKK", "symbol": "kr", "name": "Danish Krone"},
    {"code": "HKD", "symbol": "HK$", "name": "Hong Kong Dollar"},
    {"code": "KRW", "symbol": "₩", "name": "South Korean Won"},
    {"code": "MYR", "symbol": "RM", "name": "Malaysian Ringgit"},
    {"code": "PHP", "symbol": "₱", "name": "Philippine Peso"},
    {"code": "IDR", "symbol": "Rp", "name": "Indonesian Rupiah"},
    {"code": "TRY", "symbol": "₺", "name": "Turkish Lira"},
    {"code": "RUB", "symbol": "₽", "name": "Russian Ruble"},
    {"code": "PLN", "symbol": "zł", "name": "Polish Zloty"},
    {"code": "CZK", "symbol": "Kč", "name": "Czech Koruna"},
    {"code": "ILS", "symbol": "₪", "name": "Israeli Shekel"},
    {"code": "SAR", "symbol": "﷼", "name": "Saudi Riyal"}
]

# ==================== CITIES DATABASE ====================
POPULAR_CITIES = [
    {"city": "Paris", "country": "France", "code": "FR"},
    {"city": "London", "country": "United Kingdom", "code": "GB"},
    {"city": "New York", "country": "United States", "code": "US"},
    {"city": "Tokyo", "country": "Japan", "code": "JP"},
    {"city": "Dubai", "country": "United Arab Emirates", "code": "AE"},
    {"city": "Singapore", "country": "Singapore", "code": "SG"},
    {"city": "Barcelona", "country": "Spain", "code": "ES"},
    {"city": "Rome", "country": "Italy", "code": "IT"},
    {"city": "Amsterdam", "country": "Netherlands", "code": "NL"},
    {"city": "Bangkok", "country": "Thailand", "code": "TH"},
    {"city": "Sydney", "country": "Australia", "code": "AU"},
    {"city": "Los Angeles", "country": "United States", "code": "US"},
    {"city": "San Francisco", "country": "United States", "code": "US"},
    {"city": "Miami", "country": "United States", "code": "US"},
    {"city": "Toronto", "country": "Canada", "code": "CA"},
    {"city": "Vancouver", "country": "Canada", "code": "CA"},
    {"city": "Berlin", "country": "Germany", "code": "DE"},
    {"city": "Munich", "country": "Germany", "code": "DE"},
    {"city": "Vienna", "country": "Austria", "code": "AT"},
    {"city": "Prague", "country": "Czech Republic", "code": "CZ"},
    {"city": "Budapest", "country": "Hungary", "code": "HU"},
    {"city": "Istanbul", "country": "Turkey", "code": "TR"},
    {"city": "Athens", "country": "Greece", "code": "GR"},
    {"city": "Santorini", "country": "Greece", "code": "GR"},
    {"city": "Lisbon", "country": "Portugal", "code": "PT"},
    {"city": "Madrid", "country": "Spain", "code": "ES"},
    {"city": "Bali", "country": "Indonesia", "code": "ID"},
    {"city": "Phuket", "country": "Thailand", "code": "TH"},
    {"city": "Maldives", "country": "Maldives", "code": "MV"},
    {"city": "Cancun", "country": "Mexico", "code": "MX"},
    {"city": "Rio de Janeiro", "country": "Brazil", "code": "BR"},
    {"city": "Buenos Aires", "country": "Argentina", "code": "AR"},
    {"city": "Cape Town", "country": "South Africa", "code": "ZA"},
    {"city": "Marrakech", "country": "Morocco", "code": "MA"},
    {"city": "Cairo", "country": "Egypt", "code": "EG"},
    {"city": "Mumbai", "country": "India", "code": "IN"},
    {"city": "Delhi", "country": "India", "code": "IN"},
    {"city": "Goa", "country": "India", "code": "IN"},
    {"city": "Hong Kong", "country": "Hong Kong", "code": "HK"},
    {"city": "Seoul", "country": "South Korea", "code": "KR"},
    {"city": "Taipei", "country": "Taiwan", "code": "TW"},
    {"city": "Kuala Lumpur", "country": "Malaysia", "code": "MY"},
    {"city": "Ho Chi Minh City", "country": "Vietnam", "code": "VN"},
    {"city": "Hanoi", "country": "Vietnam", "code": "VN"},
    {"city": "Zurich", "country": "Switzerland", "code": "CH"},
    {"city": "Geneva", "country": "Switzerland", "code": "CH"},
    {"city": "Dublin", "country": "Ireland", "code": "IE"},
    {"city": "Edinburgh", "country": "United Kingdom", "code": "GB"},
    {"city": "Florence", "country": "Italy", "code": "IT"},
    {"city": "Venice", "country": "Italy", "code": "IT"},
    {"city": "Milan", "country": "Italy", "code": "IT"},
    {"city": "Nice", "country": "France", "code": "FR"},
    {"city": "Monaco", "country": "Monaco", "code": "MC"},
    {"city": "Reykjavik", "country": "Iceland", "code": "IS"},
    {"city": "Stockholm", "country": "Sweden", "code": "SE"},
    {"city": "Oslo", "country": "Norway", "code": "NO"},
    {"city": "Copenhagen", "country": "Denmark", "code": "DK"},
    {"city": "Helsinki", "country": "Finland", "code": "FI"},
    {"city": "Moscow", "country": "Russia", "code": "RU"},
    {"city": "Osaka", "country": "Japan", "code": "JP"},
    {"city": "Kyoto", "country": "Japan", "code": "JP"}
]

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

class TripRequest(BaseModel):
    departure_location: str
    destinations: List[str]
    start_date: str
    end_date: str
    budget: float
    currency: str = "USD"
    travelers: TravelerDetails
    food_preferences: Optional[str] = "No preference"
    accommodation_type: Optional[str] = "mid-range"
    interests: Optional[List[str]] = []

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class NewsletterSubscribe(BaseModel):
    email: EmailStr

class ChatMessage(BaseModel):
    message: str
    trip_context: Optional[Dict[str, Any]] = None

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

# ==================== EMAIL HELPERS ====================

def generate_trip_email_html(trip: dict, user_name: str) -> str:
    """Generate beautiful HTML email for trip itinerary"""
    currency_symbol = {"USD": "$", "EUR": "€", "GBP": "£", "INR": "₹", "AUD": "A$", "JPY": "¥"}.get(trip.get('currency', 'USD'), trip.get('currency', '$'))
    
    itinerary_html = ""
    for day in trip.get('itinerary', []):
        activities = ""
        for period in ['morning_activities', 'afternoon_activities', 'evening_activities']:
            for act in day.get(period, []):
                activities += f"""
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #1a1a1a;">
                        <strong style="color: #D4AF37;">{act.get('name', '')}</strong><br>
                        <span style="color: #888; font-size: 13px;">{act.get('description', '')}</span>
                    </td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #1a1a1a; text-align: right; color: #D4AF37;">
                        {currency_symbol}{act.get('cost', 0)}
                    </td>
                </tr>
                """
        
        itinerary_html += f"""
        <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #1a1a1a;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <div>
                    <span style="background: linear-gradient(135deg, #D4AF37, #A38322); color: #000; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">DAY {day.get('day_number', '')}</span>
                    <h3 style="color: #fff; margin: 8px 0 4px 0; font-size: 18px;">{day.get('location', '')}</h3>
                    <span style="color: #666; font-size: 13px;">{day.get('date', '')}</span>
                </div>
                <div style="text-align: right;">
                    <span style="color: #D4AF37; font-size: 18px; font-weight: 600;">{currency_symbol}{day.get('estimated_cost', 0)}</span>
                </div>
            </div>
            <table style="width: 100%;">
                {activities}
            </table>
        </div>
        """
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #050505;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                        <!-- Header -->
                        <tr>
                            <td style="text-align: center; padding-bottom: 30px;">
                                <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #D4AF37, #A38322); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                                    <span style="font-size: 24px;">✈️</span>
                                </div>
                                <h1 style="color: #D4AF37; margin: 0; font-size: 28px; letter-spacing: 2px;">ODYSSEY</h1>
                                <p style="color: #666; margin: 8px 0 0 0; font-size: 14px;">Your Adventure Awaits</p>
                            </td>
                        </tr>
                        
                        <!-- Welcome -->
                        <tr>
                            <td style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.02)); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 30px;">
                                <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 24px;">Hello, {user_name}! 👋</h2>
                                <p style="color: #888; margin: 0; font-size: 15px;">Your personalized trip itinerary is ready</p>
                            </td>
                        </tr>
                        
                        <!-- Trip Summary -->
                        <tr>
                            <td style="padding: 30px 0;">
                                <h2 style="color: #fff; margin: 0 0 20px 0; font-size: 22px;">{trip.get('title', 'Your Trip')}</h2>
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="background: #0a0a0a; border-radius: 12px; padding: 20px; border: 1px solid #1a1a1a;">
                                            <table width="100%">
                                                <tr>
                                                    <td style="padding: 8px 0; color: #666;">📍 Destinations</td>
                                                    <td style="padding: 8px 0; color: #fff; text-align: right;">{' → '.join(trip.get('destinations', []))}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; color: #666;">📅 Duration</td>
                                                    <td style="padding: 8px 0; color: #fff; text-align: right;">{trip.get('total_days', 0)} days</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; color: #666;">💰 Budget</td>
                                                    <td style="padding: 8px 0; color: #D4AF37; text-align: right; font-weight: 600;">{currency_symbol}{trip.get('budget', 0):,.0f}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0; color: #666;">👥 Travelers</td>
                                                    <td style="padding: 8px 0; color: #fff; text-align: right;">{sum(trip.get('travelers', {}).values())} people</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Itinerary -->
                        <tr>
                            <td>
                                <h3 style="color: #D4AF37; margin: 0 0 20px 0; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">Day-by-Day Itinerary</h3>
                                {itinerary_html}
                            </td>
                        </tr>
                        
                        <!-- CTA -->
                        <tr>
                            <td style="text-align: center; padding: 30px 0;">
                                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #D4AF37, #A38322); color: #000; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: 600; font-size: 14px;">View Full Itinerary</a>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="text-align: center; padding: 30px 0; border-top: 1px solid #1a1a1a;">
                                <p style="color: #666; margin: 0 0 16px 0; font-size: 13px;">Follow us for travel inspiration</p>
                                <div>
                                    <a href="#" style="color: #D4AF37; text-decoration: none; margin: 0 8px;">Instagram</a>
                                    <a href="#" style="color: #D4AF37; text-decoration: none; margin: 0 8px;">Twitter</a>
                                    <a href="#" style="color: #D4AF37; text-decoration: none; margin: 0 8px;">Facebook</a>
                                </div>
                                <p style="color: #444; margin: 20px 0 0 0; font-size: 12px;">© 2025 Odyssey. The Art of Getting Lost, Curated by AI.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

async def send_email_async(to_email: str, subject: str, html_content: str):
    """Send email asynchronously"""
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
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
    
    # Send welcome email in background
    welcome_html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #050505; padding: 40px; color: #fff;">
        <h1 style="color: #D4AF37;">Welcome to Odyssey, {user_data.name}! 🌍</h1>
        <p>Thank you for joining the Odyssey community. You're now ready to plan unforgettable adventures.</p>
        <p>Start by creating your first AI-powered trip itinerary!</p>
        <a href="#" style="display: inline-block; background: #D4AF37; color: #000; padding: 12px 24px; border-radius: 25px; text-decoration: none; margin-top: 20px;">Plan Your First Trip</a>
    </div>
    """
    background_tasks.add_task(send_email_async, user_data.email, "Welcome to Odyssey! 🌍", welcome_html)
    
    token = create_token(user_id, user_data.email)
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"])
    return TokenResponse(
        token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=current_user["created_at"]
    )

# ==================== AUTOCOMPLETE ====================

@api_router.get("/autocomplete/cities")
async def autocomplete_cities(q: str = ""):
    """Autocomplete for city names"""
    if len(q) < 2:
        return POPULAR_CITIES[:10]
    
    q_lower = q.lower()
    matches = [
        city for city in POPULAR_CITIES 
        if q_lower in city["city"].lower() or q_lower in city["country"].lower()
    ]
    return matches[:10]

@api_router.get("/currencies")
async def get_currencies():
    """Get all supported currencies"""
    return CURRENCIES

# ==================== TRIP PLANNING ====================

def generate_fallback_trip(trip_request: TripRequest, total_days: int, total_travelers: int) -> dict:
    """Generate a fallback trip plan when AI is unavailable"""
    from datetime import datetime as dt, timedelta
    
    start = dt.strptime(trip_request.start_date, "%Y-%m-%d")
    daily_budget = trip_request.budget / total_days / max(total_travelers, 1)
    
    # Generate day-wise itinerary
    itinerary = []
    for i in range(total_days):
        current_date = start + timedelta(days=i)
        dest_idx = min(i, len(trip_request.destinations) - 1)
        destination = trip_request.destinations[dest_idx] if trip_request.destinations else "Unknown"
        
        itinerary.append({
            "day_number": i + 1,
            "date": current_date.strftime("%Y-%m-%d"),
            "location": destination,
            "weather": {
                "temp_high": 25 + (i % 5),
                "temp_low": 15 + (i % 3),
                "condition": ["Sunny", "Partly Cloudy", "Clear"][i % 3],
                "humidity": 50 + (i % 20)
            },
            "morning_activities": [
                {
                    "name": f"Explore {destination} Morning Highlights",
                    "description": f"Visit popular morning attractions in {destination}",
                    "duration": "3 hours",
                    "cost": int(daily_budget * 0.15),
                    "location": f"Central {destination}",
                    "maps_link": f"https://maps.google.com/?q={destination.replace(' ', '+')}+attractions",
                    "tips": "Book tickets in advance for popular sites"
                }
            ],
            "afternoon_activities": [
                {
                    "name": f"Cultural Discovery in {destination}",
                    "description": f"Explore museums, galleries, or local markets",
                    "duration": "3 hours",
                    "cost": int(daily_budget * 0.10),
                    "location": f"Downtown {destination}",
                    "maps_link": f"https://maps.google.com/?q={destination.replace(' ', '+')}+museums",
                    "tips": "Many museums offer free entry on certain days"
                }
            ],
            "evening_activities": [
                {
                    "name": f"Evening in {destination}",
                    "description": f"Enjoy local nightlife, views, or entertainment",
                    "duration": "2 hours",
                    "cost": int(daily_budget * 0.10),
                    "location": f"{destination} Entertainment District",
                    "maps_link": f"https://maps.google.com/?q={destination.replace(' ', '+')}+nightlife",
                    "tips": "Book popular shows or restaurants in advance"
                }
            ],
            "restaurants": [
                {
                    "name": f"Local Restaurant in {destination}",
                    "cuisine": "Local Cuisine",
                    "price_range": "$$",
                    "must_try": ["Local specialty", "Traditional dish"],
                    "location": f"City Center, {destination}",
                    "maps_link": f"https://maps.google.com/?q={destination.replace(' ', '+')}+restaurants",
                    "booking_link": "https://www.tripadvisor.com"
                }
            ],
            "transportation": [
                {"type": "Metro/Subway", "from": "Hotel", "to": "City Center", "duration": "25 min", "cost": 3, "booking_link": "https://www.rome2rio.com"},
                {"type": "Bus", "from": "City Center", "to": "Tourist Area", "duration": "15 min", "cost": 2, "booking_link": "https://www.rome2rio.com"},
                {"type": "Uber/Taxi", "from": "Any Location", "to": "Any Location", "duration": "Varies", "cost": int(daily_budget * 0.08), "booking_link": "https://www.uber.com"},
                {"type": "Walking", "from": "Central Areas", "to": "Nearby Attractions", "duration": "10-30 min", "cost": 0, "booking_link": ""}
            ],
            "day_trips": [],
            "estimated_cost": int(daily_budget * 0.8)
        })
    
    # Generate visa requirements
    visa_requirements = []
    for dest in trip_request.destinations:
        country = dest.split(',')[-1].strip() if ',' in dest else dest
        visa_requirements.append({
            "country": country,
            "visa_required": True,
            "visa_type": "Tourist Visa",
            "processing_time": "5-10 business days",
            "cost": 50,
            "notes": f"Check {country} embassy website for latest requirements",
            "apply_link": f"https://www.google.com/search?q={country.replace(' ', '+')}+tourist+visa+application"
        })
    
    # Generate flights with multiple booking options
    flights = []
    if trip_request.destinations:
        flights.append({
            "from": trip_request.departure_location,
            "to": trip_request.destinations[0],
            "date": trip_request.start_date,
            "estimated_price": int(trip_request.budget * 0.2 / max(total_travelers, 1)),
            "airlines": ["Multiple airlines available"],
            "booking_links": {
                "skyscanner": "https://www.skyscanner.com",
                "google_flights": "https://www.google.com/flights",
                "kayak": "https://www.kayak.com",
                "momondo": "https://www.momondo.com",
                "expedia": "https://www.expedia.com",
                "cheapflights": "https://www.cheapflights.com",
                "kiwi": "https://www.kiwi.com",
                "hopper": "https://www.hopper.com"
            }
        })
        flights.append({
            "from": trip_request.destinations[-1],
            "to": trip_request.departure_location,
            "date": trip_request.end_date,
            "estimated_price": int(trip_request.budget * 0.2 / max(total_travelers, 1)),
            "airlines": ["Multiple airlines available"],
            "booking_links": {
                "skyscanner": "https://www.skyscanner.com",
                "google_flights": "https://www.google.com/flights",
                "kayak": "https://www.kayak.com",
                "momondo": "https://www.momondo.com",
                "expedia": "https://www.expedia.com",
                "cheapflights": "https://www.cheapflights.com",
                "kiwi": "https://www.kiwi.com",
                "hopper": "https://www.hopper.com"
            }
        })
    
    return {
        "id": str(uuid.uuid4()),
        "title": f"Adventure to {', '.join(trip_request.destinations)}",
        "departure_location": trip_request.departure_location,
        "destinations": trip_request.destinations,
        "start_date": trip_request.start_date,
        "end_date": trip_request.end_date,
        "budget": trip_request.budget,
        "currency": trip_request.currency,
        "travelers": trip_request.travelers.model_dump(),
        "total_days": total_days,
        "visa_requirements": visa_requirements,
        "flights": flights,
        "itinerary": itinerary,
        "booking_links": {
            "flights": {
                "skyscanner": "https://www.skyscanner.com",
                "google_flights": "https://www.google.com/flights",
                "kayak": "https://www.kayak.com",
                "momondo": "https://www.momondo.com",
                "expedia": "https://www.expedia.com",
                "cheapflights": "https://www.cheapflights.com"
            },
            "hotels": {
                "booking": "https://www.booking.com",
                "airbnb": "https://www.airbnb.com",
                "agoda": "https://www.agoda.com",
                "hotels": "https://www.hotels.com",
                "hostelworld": "https://www.hostelworld.com",
                "trivago": "https://www.trivago.com"
            },
            "transportation": {
                "uber": "https://www.uber.com",
                "lyft": "https://www.lyft.com",
                "bolt": "https://www.bolt.eu",
                "rental_cars": "https://www.rentalcars.com",
                "rome2rio": "https://www.rome2rio.com",
                "trainline": "https://www.trainline.com",
                "flixbus": "https://www.flixbus.com",
                "blablacar": "https://www.blablacar.com"
            },
            "experiences": {
                "viator": "https://www.viator.com",
                "getyourguide": "https://www.getyourguide.com",
                "tripadvisor": "https://www.tripadvisor.com",
                "airbnb_experiences": "https://www.airbnb.com/experiences",
                "klook": "https://www.klook.com"
            }
        },
        "total_estimated_cost": int(trip_request.budget * 0.85),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "_note": "This is a template itinerary. For AI-personalized recommendations, please add credits to your Universal Key at Profile > Universal Key > Add Balance"
    }

async def generate_trip_with_ai(trip_request: TripRequest) -> dict:
    """Generate comprehensive trip plan using OpenAI"""
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    # Calculate total days
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
    
    prompt = f"""You are an expert travel planner. Create a comprehensive travel itinerary in JSON format.

TRIP DETAILS:
- Departure: {trip_request.departure_location}
- Destinations: {', '.join(trip_request.destinations)}
- Dates: {trip_request.start_date} to {trip_request.end_date} ({total_days} days)
- Budget: {trip_request.budget} {trip_request.currency} (total for entire trip)
- Travelers: {total_travelers} total ({trip_request.travelers.adults} adults, {trip_request.travelers.children_above_10} children 10+, {trip_request.travelers.children_below_10} children under 10, {trip_request.travelers.seniors} seniors, {trip_request.travelers.infants} infants)
- Food Preferences: {trip_request.food_preferences}
- Accommodation: {trip_request.accommodation_type}
- Interests: {', '.join(trip_request.interests) if trip_request.interests else 'General sightseeing'}

Return ONLY valid JSON with this structure:
{{
  "title": "Descriptive trip title",
  "visa_requirements": [
    {{"country": "Country", "visa_required": true/false, "visa_type": "Type", "processing_time": "X days", "cost": 0, "notes": "Info", "apply_link": "https://..."}}
  ],
  "flights": [
    {{"from": "City", "to": "City", "date": "YYYY-MM-DD", "estimated_price": 0, "airlines": ["Airline1"], "booking_links": {{"skyscanner": "https://www.skyscanner.com", "google_flights": "https://www.google.com/flights", "kayak": "https://www.kayak.com", "momondo": "https://www.momondo.com", "expedia": "https://www.expedia.com"}}}}
  ],
  "itinerary": [
    {{
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "location": "City, Country",
      "weather": {{"temp_high": 25, "temp_low": 18, "condition": "Sunny", "humidity": 60}},
      "morning_activities": [{{"name": "Activity", "description": "Desc", "duration": "2h", "cost": 0, "location": "Addr", "maps_link": "https://maps.google.com/?q=...", "tips": "Tip"}}],
      "afternoon_activities": [...],
      "evening_activities": [...],
      "restaurants": [{{"name": "Restaurant", "cuisine": "Type", "price_range": "$$", "must_try": ["Dish"], "location": "Addr", "maps_link": "...", "booking_link": "..."}}],
      "transportation": [
        {{"type": "Metro", "from": "A", "to": "B", "duration": "20min", "cost": 2, "booking_link": "..."}},
        {{"type": "Bus", "from": "B", "to": "C", "duration": "15min", "cost": 1, "booking_link": "..."}},
        {{"type": "Uber", "from": "C", "to": "D", "duration": "10min", "cost": 10, "booking_link": "https://uber.com"}}
      ],
      "day_trips": [{{"destination": "Place", "description": "Desc", "duration": "Full day", "cost": 50, "booking_link": "..."}}],
      "estimated_cost": 150
    }}
  ],
  "booking_links": {{
    "flights": {{"skyscanner": "...", "google_flights": "...", "kayak": "...", "momondo": "...", "expedia": "..."}},
    "hotels": {{"booking": "...", "airbnb": "...", "agoda": "...", "hotels": "...", "hostelworld": "..."}},
    "transportation": {{"uber": "...", "lyft": "...", "bolt": "...", "rental_cars": "...", "rome2rio": "...", "trainline": "...", "flixbus": "..."}},
    "experiences": {{"viator": "...", "getyourguide": "...", "tripadvisor": "...", "klook": "..."}}
  }},
  "total_estimated_cost": 0
}}

Include ALL transportation types (metro, bus, tram, taxi, uber, walking) with actual prices. Make it realistic and detailed."""

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message="You are an expert travel planner. Always respond with valid JSON only."
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
        logger.error(f"AI Trip Generation Error: {str(e)}")
        if "Budget has been exceeded" in str(e) or "BadGatewayError" in str(e) or "502" in str(e):
            logger.info("Using fallback trip generation")
            return generate_fallback_trip(trip_request, total_days, total_travelers)
        raise HTTPException(status_code=500, detail=f"Failed to generate trip plan: {str(e)}")

@api_router.post("/trips/generate")
async def generate_trip(trip_request: TripRequest):
    """Generate a new trip plan using AI"""
    trip_plan = await generate_trip_with_ai(trip_request)
    return trip_plan

@api_router.post("/trips/save")
async def save_trip(trip_data: dict, current_user: dict = Depends(get_current_user)):
    """Save a generated trip to user's account"""
    trip_data["user_id"] = current_user["id"]
    trip_data["status"] = "planned"
    trip_data.pop("_id", None)
    
    await db.trips.insert_one(trip_data)
    trip_data.pop("_id", None)
    
    return {"message": "Trip saved successfully", "trip_id": trip_data["id"]}

@api_router.post("/trips/{trip_id}/send-email")
async def send_trip_email(trip_id: str, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    """Send trip itinerary to user's email"""
    trip = await db.trips.find_one({"id": trip_id, "user_id": current_user["id"]}, {"_id": 0})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    html_content = generate_trip_email_html(trip, current_user["name"])
    background_tasks.add_task(
        send_email_async, 
        current_user["email"], 
        f"Your Odyssey Trip: {trip.get('title', 'Trip Itinerary')} ✈️",
        html_content
    )
    
    return {"message": "Trip itinerary sent to your email!"}

@api_router.get("/trips/my-trips")
async def get_my_trips(current_user: dict = Depends(get_current_user)):
    """Get all trips for the current user"""
    trips = await db.trips.find(
        {"user_id": current_user["id"]}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return trips

@api_router.get("/trips/{trip_id}")
async def get_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific trip by ID"""
    trip = await db.trips.find_one(
        {"id": trip_id, "user_id": current_user["id"]}, 
        {"_id": 0}
    )
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@api_router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a trip"""
    result = await db.trips.delete_one({"id": trip_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"message": "Trip deleted successfully"}

# ==================== AI CHAT BUDDY ====================

@api_router.post("/chat/travel-buddy")
async def travel_buddy_chat(chat_msg: ChatMessage):
    """AI Travel Buddy for trip questions"""
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    context = ""
    if chat_msg.trip_context:
        context = f"\nUser's trip context: Traveling to {chat_msg.trip_context.get('destinations', [])} from {chat_msg.trip_context.get('start_date')} to {chat_msg.trip_context.get('end_date')}."
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message=f"""You are Odyssey's friendly AI Travel Buddy. Help users with travel questions, tips, and recommendations. Be concise, helpful, and enthusiastic about travel!{context}"""
        ).with_model("openai", "gpt-4o")
        
        response = await chat.send_message(UserMessage(text=chat_msg.message))
        return {"response": response}
    except Exception as e:
        return {"response": "I'm having trouble connecting right now. Please try again later or check your trip details directly!"}

# ==================== PACKING LIST GENERATOR ====================

@api_router.post("/tools/packing-list")
async def generate_packing_list(destination: str, duration: int, weather: str = "moderate"):
    """Generate AI-powered packing list"""
    essentials = [
        {"item": "Passport & ID", "category": "Documents", "quantity": 1},
        {"item": "Travel Insurance Documents", "category": "Documents", "quantity": 1},
        {"item": "Credit/Debit Cards", "category": "Documents", "quantity": 2},
        {"item": "Phone & Charger", "category": "Electronics", "quantity": 1},
        {"item": "Power Adapter", "category": "Electronics", "quantity": 1},
        {"item": "Underwear", "category": "Clothing", "quantity": duration + 2},
        {"item": "Socks", "category": "Clothing", "quantity": duration + 2},
        {"item": "T-shirts/Tops", "category": "Clothing", "quantity": min(duration, 7)},
        {"item": "Pants/Shorts", "category": "Clothing", "quantity": min(duration // 2 + 1, 4)},
        {"item": "Comfortable Walking Shoes", "category": "Footwear", "quantity": 1},
        {"item": "Toiletries Bag", "category": "Toiletries", "quantity": 1},
        {"item": "Toothbrush & Toothpaste", "category": "Toiletries", "quantity": 1},
        {"item": "Deodorant", "category": "Toiletries", "quantity": 1},
        {"item": "Sunscreen", "category": "Toiletries", "quantity": 1},
        {"item": "Medications", "category": "Health", "quantity": 1},
        {"item": "First Aid Kit", "category": "Health", "quantity": 1},
        {"item": "Reusable Water Bottle", "category": "Accessories", "quantity": 1},
        {"item": "Daypack/Small Bag", "category": "Accessories", "quantity": 1},
    ]
    
    if "cold" in weather.lower() or "winter" in weather.lower():
        essentials.extend([
            {"item": "Warm Jacket", "category": "Clothing", "quantity": 1},
            {"item": "Sweaters", "category": "Clothing", "quantity": 2},
            {"item": "Thermal Underwear", "category": "Clothing", "quantity": 2},
            {"item": "Gloves", "category": "Accessories", "quantity": 1},
            {"item": "Scarf", "category": "Accessories", "quantity": 1},
            {"item": "Warm Hat", "category": "Accessories", "quantity": 1},
        ])
    elif "hot" in weather.lower() or "tropical" in weather.lower():
        essentials.extend([
            {"item": "Swimsuit", "category": "Clothing", "quantity": 2},
            {"item": "Sandals/Flip-flops", "category": "Footwear", "quantity": 1},
            {"item": "Sun Hat", "category": "Accessories", "quantity": 1},
            {"item": "Sunglasses", "category": "Accessories", "quantity": 1},
            {"item": "Insect Repellent", "category": "Toiletries", "quantity": 1},
        ])
    
    return {"destination": destination, "duration": duration, "weather": weather, "packing_list": essentials}

# ==================== CONTACT & NEWSLETTER ====================

@api_router.post("/contact")
async def submit_contact(form: ContactForm, background_tasks: BackgroundTasks):
    """Submit contact form"""
    contact_id = str(uuid.uuid4())
    contact_doc = {
        "id": contact_id,
        "name": form.name,
        "email": form.email,
        "subject": form.subject,
        "message": form.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "new"
    }
    await db.contacts.insert_one(contact_doc)
    
    # Send confirmation email
    confirmation_html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #050505; padding: 40px; color: #fff;">
        <h2 style="color: #D4AF37;">Thank you for contacting Odyssey!</h2>
        <p>Hi {form.name},</p>
        <p>We've received your message and will get back to you within 24-48 hours.</p>
        <p><strong>Your message:</strong></p>
        <blockquote style="border-left: 3px solid #D4AF37; padding-left: 16px; color: #888;">{form.message}</blockquote>
        <p>Best regards,<br>The Odyssey Team</p>
    </div>
    """
    background_tasks.add_task(send_email_async, form.email, "We received your message! - Odyssey", confirmation_html)
    
    return {"message": "Thank you! We'll get back to you soon.", "contact_id": contact_id}

@api_router.post("/newsletter/subscribe")
async def subscribe_newsletter(data: NewsletterSubscribe):
    """Subscribe to newsletter"""
    existing = await db.newsletter.find_one({"email": data.email})
    if existing:
        return {"message": "You're already subscribed!"}
    
    await db.newsletter.insert_one({
        "id": str(uuid.uuid4()),
        "email": data.email,
        "subscribed_at": datetime.now(timezone.utc).isoformat(),
        "active": True
    })
    return {"message": "Successfully subscribed to our newsletter!"}

# ==================== POPULAR DESTINATIONS ====================

@api_router.get("/destinations/popular")
async def get_popular_destinations():
    """Get popular destinations for inspiration"""
    return [
        {"name": "Paris, France", "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800", "tagline": "City of Lights", "rating": 4.9},
        {"name": "Tokyo, Japan", "image": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", "tagline": "Where tradition meets future", "rating": 4.8},
        {"name": "Bali, Indonesia", "image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", "tagline": "Island of the Gods", "rating": 4.9},
        {"name": "New York, USA", "image": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800", "tagline": "The city that never sleeps", "rating": 4.7},
        {"name": "Santorini, Greece", "image": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800", "tagline": "Aegean gem", "rating": 4.9},
        {"name": "Dubai, UAE", "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800", "tagline": "Future reimagined", "rating": 4.8},
        {"name": "Rome, Italy", "image": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800", "tagline": "Eternal City", "rating": 4.8},
        {"name": "Maldives", "image": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800", "tagline": "Paradise on Earth", "rating": 4.9}
    ]

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Odyssey API - AI Travel Planning", "status": "online", "version": "2.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "odyssey-api"}

# Include the router
app.include_router(api_router)

# CORS
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
