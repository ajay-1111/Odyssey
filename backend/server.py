from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'odyssey-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# Create the main app
app = FastAPI(title="Odyssey API", description="AI-Powered Travel Planning")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

class DayItinerary(BaseModel):
    day_number: int
    date: str
    location: str
    weather: dict
    morning_activities: List[dict]
    afternoon_activities: List[dict]
    evening_activities: List[dict]
    restaurants: List[dict]
    transportation: List[dict]
    estimated_cost: float

class TripPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None
    title: str
    departure_location: str
    destinations: List[str]
    start_date: str
    end_date: str
    budget: float
    currency: str
    travelers: TravelerDetails
    total_days: int
    visa_requirements: List[dict]
    flights: List[dict]
    itinerary: List[dict]
    booking_links: dict
    total_estimated_cost: float
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SavedTrip(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    destinations: List[str]
    start_date: str
    end_date: str
    budget: float
    currency: str
    travelers: dict
    created_at: str
    status: str = "planned"

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
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

# ==================== TRIP PLANNING ====================

async def generate_trip_with_ai(trip_request: TripRequest) -> dict:
    """Generate comprehensive trip plan using OpenAI GPT-5.2"""
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

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{{
  "title": "Descriptive trip title",
  "visa_requirements": [
    {{"country": "Country", "visa_required": true/false, "visa_type": "Type or N/A", "processing_time": "X days", "cost": 0, "notes": "Important info", "apply_link": "https://..."}}
  ],
  "flights": [
    {{"from": "City", "to": "City", "date": "YYYY-MM-DD", "estimated_price": 0, "airlines": ["Airline1"], "booking_links": {{"skyscanner": "https://www.skyscanner.com", "google_flights": "https://www.google.com/flights", "kayak": "https://www.kayak.com"}}}}
  ],
  "itinerary": [
    {{
      "day_number": 1,
      "date": "YYYY-MM-DD",
      "location": "City, Country",
      "weather": {{"temp_high": 25, "temp_low": 18, "condition": "Sunny", "humidity": 60}},
      "morning_activities": [
        {{"name": "Activity", "description": "Description", "duration": "2 hours", "cost": 0, "location": "Address", "maps_link": "https://maps.google.com/?q=...", "tips": "Pro tip"}}
      ],
      "afternoon_activities": [...],
      "evening_activities": [...],
      "restaurants": [
        {{"name": "Restaurant", "cuisine": "Type", "price_range": "$$", "must_try": ["Dish1"], "location": "Address", "maps_link": "https://maps.google.com/?q=...", "booking_link": "https://..."}}
      ],
      "transportation": [
        {{"type": "Uber/Metro/Bus/Walk", "from": "Location", "to": "Location", "duration": "20 min", "cost": 5, "booking_link": "https://..."}}
      ],
      "day_trips": [
        {{"destination": "Nearby place", "description": "What to see", "duration": "Full day", "cost": 50, "booking_link": "https://..."}}
      ],
      "estimated_cost": 150
    }}
  ],
  "booking_links": {{
    "flights": {{"skyscanner": "https://www.skyscanner.com", "google_flights": "https://www.google.com/flights", "kayak": "https://www.kayak.com"}},
    "hotels": {{"booking": "https://www.booking.com", "airbnb": "https://www.airbnb.com", "agoda": "https://www.agoda.com", "hotels": "https://www.hotels.com"}},
    "transportation": {{"uber": "https://www.uber.com", "lyft": "https://www.lyft.com", "rental_cars": "https://www.rentalcars.com", "rome2rio": "https://www.rome2rio.com"}},
    "experiences": {{"viator": "https://www.viator.com", "getyourguide": "https://www.getyourguide.com", "tripadvisor": "https://www.tripadvisor.com"}}
  }},
  "total_estimated_cost": 0
}}

Make the itinerary realistic, detailed, and within budget. Include actual popular attractions, restaurants, and transport options for the destinations."""

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message="You are an expert travel planner. Always respond with valid JSON only."
        ).with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse the JSON response
        import json
        # Clean up response if needed
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        trip_data = json.loads(response_text.strip())
        
        # Add metadata
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
    
    # Remove _id if present
    trip_data.pop("_id", None)
    
    await db.trips.insert_one(trip_data)
    trip_data.pop("_id", None)
    
    return {"message": "Trip saved successfully", "trip_id": trip_data["id"]}

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

@api_router.patch("/trips/{trip_id}/status")
async def update_trip_status(trip_id: str, status: str, current_user: dict = Depends(get_current_user)):
    """Update trip status (planned, in-progress, completed)"""
    result = await db.trips.update_one(
        {"id": trip_id, "user_id": current_user["id"]},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"message": "Status updated successfully"}

# ==================== POPULAR DESTINATIONS ====================

@api_router.get("/destinations/popular")
async def get_popular_destinations():
    """Get popular destinations for inspiration"""
    return [
        {"name": "Paris, France", "image": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800", "tagline": "City of Lights"},
        {"name": "Tokyo, Japan", "image": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800", "tagline": "Where tradition meets future"},
        {"name": "Bali, Indonesia", "image": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800", "tagline": "Island of the Gods"},
        {"name": "New York, USA", "image": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800", "tagline": "The city that never sleeps"},
        {"name": "Santorini, Greece", "image": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800", "tagline": "Aegean gem"},
        {"name": "Dubai, UAE", "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800", "tagline": "Future reimagined"},
        {"name": "Rome, Italy", "image": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800", "tagline": "Eternal City"},
        {"name": "Maldives", "image": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800", "tagline": "Paradise on Earth"}
    ]

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Odyssey API - AI Travel Planning", "status": "online"}

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
