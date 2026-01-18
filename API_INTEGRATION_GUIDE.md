# 🔌 API Integration Guide for Odyssey
## Production-Ready Third-Party API Integrations

---

# 1. FLIGHT APIs

## A. Amadeus API (FREE 2,000 calls/month)

### Setup:
```bash
pip install amadeus
```

### Registration:
1. Go to https://developers.amadeus.com
2. Create account → Create App → Get API Keys
3. Use "Test" environment first (free), then "Production"

### Integration Code:
```python
# /app/backend/services/flight_service.py

from amadeus import Client, ResponseError
import os
from datetime import datetime

class FlightService:
    def __init__(self):
        self.amadeus = Client(
            client_id=os.environ.get('AMADEUS_API_KEY'),
            client_secret=os.environ.get('AMADEUS_API_SECRET'),
            hostname='test'  # Change to 'production' for live
        )
    
    async def search_flights(
        self,
        origin: str,          # IATA code: "JFK"
        destination: str,     # IATA code: "CDG"
        departure_date: str,  # "2025-03-01"
        adults: int = 1,
        cabin_class: str = "ECONOMY",
        return_date: str = None
    ):
        try:
            params = {
                "originLocationCode": origin,
                "destinationLocationCode": destination,
                "departureDate": departure_date,
                "adults": adults,
                "travelClass": cabin_class,
                "currencyCode": "USD",
                "max": 10
            }
            
            if return_date:
                params["returnDate"] = return_date
            
            response = self.amadeus.shopping.flight_offers_search.get(**params)
            
            return self._format_flights(response.data)
        
        except ResponseError as error:
            print(f"Amadeus API Error: {error}")
            return []
    
    def _format_flights(self, data):
        flights = []
        for offer in data:
            flight = {
                "id": offer["id"],
                "price": float(offer["price"]["total"]),
                "currency": offer["price"]["currency"],
                "segments": [],
                "airlines": [],
                "duration": offer["itineraries"][0]["duration"]
            }
            
            for itinerary in offer["itineraries"]:
                for segment in itinerary["segments"]:
                    flight["segments"].append({
                        "departure": {
                            "airport": segment["departure"]["iataCode"],
                            "time": segment["departure"]["at"]
                        },
                        "arrival": {
                            "airport": segment["arrival"]["iataCode"],
                            "time": segment["arrival"]["at"]
                        },
                        "airline": segment["carrierCode"],
                        "flight_number": segment["number"],
                        "duration": segment["duration"]
                    })
                    if segment["carrierCode"] not in flight["airlines"]:
                        flight["airlines"].append(segment["carrierCode"])
            
            flights.append(flight)
        
        return flights
    
    async def get_cheapest_date(self, origin: str, destination: str):
        """Find cheapest travel dates"""
        try:
            response = self.amadeus.shopping.flight_dates.get(
                origin=origin,
                destination=destination
            )
            return response.data
        except ResponseError:
            return []


# Usage in server.py:
flight_service = FlightService()

@app.get("/api/flights/search")
async def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    adults: int = 1,
    cabin_class: str = "ECONOMY",
    return_date: str = None
):
    flights = await flight_service.search_flights(
        origin, destination, departure_date, adults, cabin_class, return_date
    )
    return {"flights": flights}
```

## B. Kiwi.com Tequila API (FREE 3,000 calls/month)

### Registration:
1. Go to https://tequila.kiwi.com
2. Create account → Get API Key

### Integration Code:
```python
# /app/backend/services/kiwi_service.py

import httpx
import os

class KiwiService:
    BASE_URL = "https://api.tequila.kiwi.com/v2"
    
    def __init__(self):
        self.api_key = os.environ.get('KIWI_API_KEY')
        self.headers = {"apikey": self.api_key}
    
    async def search_flights(
        self,
        fly_from: str,
        fly_to: str,
        date_from: str,  # DD/MM/YYYY
        date_to: str,
        adults: int = 1,
        curr: str = "USD"
    ):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/search",
                headers=self.headers,
                params={
                    "fly_from": fly_from,
                    "fly_to": fly_to,
                    "date_from": date_from,
                    "date_to": date_to,
                    "adults": adults,
                    "curr": curr,
                    "limit": 10,
                    "sort": "price"
                }
            )
            data = response.json()
            return self._format_results(data.get("data", []))
    
    def _format_results(self, data):
        return [{
            "price": flight["price"],
            "airlines": flight["airlines"],
            "route": [
                {
                    "from": r["flyFrom"],
                    "to": r["flyTo"],
                    "departure": r["local_departure"],
                    "arrival": r["local_arrival"]
                }
                for r in flight["route"]
            ],
            "deep_link": flight["deep_link"],  # Booking link
            "duration": flight["fly_duration"]
        } for flight in data]
```

---

# 2. HOTEL APIs

## A. Booking.com Affiliate (Revenue Generator)

### Setup:
1. Join at https://www.booking.com/affiliate-program
2. Get your Affiliate ID (aid)
3. Generate deep links

### Integration Code:
```python
# /app/backend/services/booking_affiliate.py

class BookingAffiliate:
    AFFILIATE_ID = "YOUR_AFFILIATE_ID"  # Get from Booking.com partner portal
    
    @staticmethod
    def generate_hotel_link(
        city: str,
        checkin: str,
        checkout: str,
        guests: int = 2
    ) -> str:
        """Generate affiliate booking link"""
        base_url = "https://www.booking.com/searchresults.html"
        params = {
            "aid": BookingAffiliate.AFFILIATE_ID,
            "ss": city,
            "checkin": checkin,
            "checkout": checkout,
            "group_adults": guests,
            "no_rooms": 1,
            "selected_currency": "USD"
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{base_url}?{query}"
    
    @staticmethod
    def generate_city_links(city: str, checkin: str, checkout: str):
        """Generate multiple booking platform links"""
        return {
            "booking": BookingAffiliate.generate_hotel_link(city, checkin, checkout),
            "airbnb": f"https://www.airbnb.com/s/{city}/homes?checkin={checkin}&checkout={checkout}",
            "hotels": f"https://www.hotels.com/search.do?q={city}&checkin={checkin}&checkout={checkout}",
            "agoda": f"https://www.agoda.com/search?city={city}&checkIn={checkin}&checkOut={checkout}",
            "expedia": f"https://www.expedia.com/Hotel-Search?destination={city}&startDate={checkin}&endDate={checkout}"
        }
```

## B. Amadeus Hotel Search (FREE)

```python
# Using same Amadeus client
async def search_hotels(self, city_code: str, checkin: str, checkout: str, adults: int = 2):
    try:
        # First get hotels in city
        hotels = self.amadeus.reference_data.locations.hotels.by_city.get(
            cityCode=city_code
        )
        
        # Then get offers for specific hotels
        hotel_ids = [h["hotelId"] for h in hotels.data[:10]]
        
        offers = self.amadeus.shopping.hotel_offers_search.get(
            hotelIds=hotel_ids,
            checkInDate=checkin,
            checkOutDate=checkout,
            adults=adults
        )
        
        return offers.data
    except ResponseError as e:
        return []
```

---

# 3. WEATHER API (100% FREE)

## Open-Meteo (No API Key Required!)

```python
# /app/backend/services/weather_service.py

import httpx
from datetime import datetime, timedelta

class WeatherService:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    
    async def get_forecast(self, latitude: float, longitude: float, days: int = 7):
        """Get weather forecast - completely FREE"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.BASE_URL,
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "daily": [
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "precipitation_sum",
                        "weathercode",
                        "sunrise",
                        "sunset"
                    ],
                    "current_weather": True,
                    "timezone": "auto",
                    "forecast_days": days
                }
            )
            
            data = response.json()
            return self._format_weather(data)
    
    def _format_weather(self, data):
        daily = data.get("daily", {})
        dates = daily.get("time", [])
        
        forecast = []
        for i, date in enumerate(dates):
            forecast.append({
                "date": date,
                "temp_high": daily["temperature_2m_max"][i],
                "temp_low": daily["temperature_2m_min"][i],
                "precipitation": daily["precipitation_sum"][i],
                "condition": self._get_condition(daily["weathercode"][i]),
                "sunrise": daily["sunrise"][i],
                "sunset": daily["sunset"][i]
            })
        
        return {
            "current": data.get("current_weather"),
            "forecast": forecast,
            "location": {
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "timezone": data["timezone"]
            }
        }
    
    def _get_condition(self, code: int) -> str:
        """Convert WMO weather code to readable condition"""
        conditions = {
            0: "Clear sky",
            1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
            45: "Foggy", 48: "Depositing rime fog",
            51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
            61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
            71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
            80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
            95: "Thunderstorm", 96: "Thunderstorm with hail"
        }
        return conditions.get(code, "Unknown")


# Geocoding service to convert city name to coordinates
class GeocodingService:
    BASE_URL = "https://geocoding-api.open-meteo.com/v1/search"
    
    async def get_coordinates(self, city: str):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.BASE_URL,
                params={"name": city, "count": 1}
            )
            data = response.json()
            
            if data.get("results"):
                result = data["results"][0]
                return {
                    "latitude": result["latitude"],
                    "longitude": result["longitude"],
                    "country": result.get("country"),
                    "timezone": result.get("timezone")
                }
            return None
```

---

# 4. CURRENCY API (FREE)

## ExchangeRate-API (1,500 calls/month FREE)

```python
# /app/backend/services/currency_service.py

import httpx
import os
from functools import lru_cache
from datetime import datetime, timedelta

class CurrencyService:
    BASE_URL = "https://v6.exchangerate-api.com/v6"
    
    def __init__(self):
        self.api_key = os.environ.get('EXCHANGE_RATE_API_KEY')
        self._cache = {}
        self._cache_time = None
    
    async def get_rates(self, base: str = "USD"):
        """Get exchange rates - cached for 1 hour"""
        cache_key = f"rates_{base}"
        
        # Check cache
        if self._cache.get(cache_key) and self._cache_time:
            if datetime.now() - self._cache_time < timedelta(hours=1):
                return self._cache[cache_key]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/{self.api_key}/latest/{base}"
            )
            data = response.json()
            
            if data["result"] == "success":
                self._cache[cache_key] = data["conversion_rates"]
                self._cache_time = datetime.now()
                return data["conversion_rates"]
        
        return {}
    
    async def convert(self, amount: float, from_curr: str, to_curr: str):
        """Convert between currencies"""
        rates = await self.get_rates(from_curr)
        if to_curr in rates:
            return round(amount * rates[to_curr], 2)
        return amount


# Alternative: FreecurrencyAPI (5,000 calls/month FREE)
class FreeCurrencyService:
    BASE_URL = "https://api.freecurrencyapi.com/v1"
    
    def __init__(self):
        self.api_key = os.environ.get('FREECURRENCY_API_KEY')
    
    async def get_rates(self, base: str = "USD"):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/latest",
                params={
                    "apikey": self.api_key,
                    "base_currency": base
                }
            )
            return response.json().get("data", {})
```

---

# 5. VISA REQUIREMENTS

## REST Countries + Custom Database

```python
# /app/backend/services/visa_service.py

import httpx

class VisaService:
    # Simplified visa database (expand as needed)
    VISA_FREE = {
        "US": ["CA", "MX", "GB", "FR", "DE", "IT", "ES", "JP", "AU", "NZ"],
        "GB": ["US", "CA", "AU", "NZ", "EU countries..."],
        "IN": ["BT", "NP", "MU", "ID", "TH", "PH", "FJ"],
        # Add more...
    }
    
    VISA_ON_ARRIVAL = {
        "US": ["TR", "TH", "ID", "JO", "EG"],
        "IN": ["TH", "LK", "MV", "MM", "KH", "LA"],
        # Add more...
    }
    
    async def check_visa(self, passport_country: str, destination_country: str):
        """Check visa requirements"""
        passport = passport_country.upper()
        destination = destination_country.upper()
        
        if passport == destination:
            return {
                "required": False,
                "type": "citizen",
                "notes": "No visa needed - you're a citizen!"
            }
        
        if destination in self.VISA_FREE.get(passport, []):
            return {
                "required": False,
                "type": "visa_free",
                "notes": f"Visa-free entry for {passport} passport holders"
            }
        
        if destination in self.VISA_ON_ARRIVAL.get(passport, []):
            return {
                "required": True,
                "type": "visa_on_arrival",
                "notes": "Visa available on arrival",
                "estimated_cost": "$20-50"
            }
        
        return {
            "required": True,
            "type": "visa_required",
            "notes": "Please apply for visa before travel",
            "apply_link": f"https://www.google.com/search?q={destination}+visa+application"
        }
    
    async def get_country_info(self, country_code: str):
        """Get country information from REST Countries API"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://restcountries.com/v3.1/alpha/{country_code}"
            )
            
            if response.status_code == 200:
                data = response.json()[0]
                return {
                    "name": data["name"]["common"],
                    "official_name": data["name"]["official"],
                    "capital": data.get("capital", ["N/A"])[0],
                    "region": data.get("region"),
                    "subregion": data.get("subregion"),
                    "languages": list(data.get("languages", {}).values()),
                    "currencies": data.get("currencies", {}),
                    "timezone": data.get("timezones", ["UTC"])[0],
                    "flag": data.get("flag"),
                    "population": data.get("population"),
                    "driving_side": data.get("car", {}).get("side", "right")
                }
        return None
```

---

# 6. STRIPE PAYMENT INTEGRATION

```python
# /app/backend/services/payment_service.py

import stripe
import os
from datetime import datetime

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

class PaymentService:
    
    # Price IDs from Stripe Dashboard
    PRICES = {
        "monthly": "price_monthly_xxx",  # $9.99/month
        "yearly": "price_yearly_xxx"      # $79/year
    }
    
    async def create_checkout_session(
        self,
        user_email: str,
        plan: str,  # "monthly" or "yearly"
        success_url: str,
        cancel_url: str
    ):
        """Create Stripe Checkout Session"""
        try:
            session = stripe.checkout.Session.create(
                customer_email=user_email,
                payment_method_types=["card"],
                line_items=[{
                    "price": self.PRICES[plan],
                    "quantity": 1
                }],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={"plan": plan}
            )
            return {"checkout_url": session.url, "session_id": session.id}
        except stripe.error.StripeError as e:
            raise Exception(f"Payment error: {str(e)}")
    
    async def create_customer_portal(self, customer_id: str, return_url: str):
        """Let customers manage their subscription"""
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url
        )
        return {"portal_url": session.url}
    
    async def handle_webhook(self, payload: bytes, sig_header: str):
        """Handle Stripe webhooks"""
        endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except Exception as e:
            raise Exception(f"Webhook error: {str(e)}")
        
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            # Update user to premium in database
            await self._activate_subscription(
                session["customer_email"],
                session["subscription"]
            )
        
        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            # Downgrade user to free tier
            await self._cancel_subscription(subscription["customer"])
        
        return {"status": "success"}
    
    async def _activate_subscription(self, email: str, subscription_id: str):
        """Update user's subscription status in database"""
        # Implementation depends on your database
        pass
    
    async def _cancel_subscription(self, customer_id: str):
        """Handle subscription cancellation"""
        pass


# API endpoints
@app.post("/api/subscribe")
async def create_subscription(
    plan: str,  # "monthly" or "yearly"
    user: dict = Depends(get_current_user)
):
    payment_service = PaymentService()
    return await payment_service.create_checkout_session(
        user_email=user["email"],
        plan=plan,
        success_url=f"{FRONTEND_URL}/dashboard?success=true",
        cancel_url=f"{FRONTEND_URL}/pricing?canceled=true"
    )

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    payment_service = PaymentService()
    return await payment_service.handle_webhook(payload, sig_header)
```

---

# 7. ENVIRONMENT VARIABLES TEMPLATE

```bash
# /app/backend/.env.example

# Database
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/odyssey

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_ALGORITHM=HS256

# AI (Emergent LLM Key)
EMERGENT_API_KEY=your-emergent-key

# Flight APIs
AMADEUS_API_KEY=your-amadeus-client-id
AMADEUS_API_SECRET=your-amadeus-client-secret
KIWI_API_KEY=your-kiwi-api-key

# Currency
EXCHANGE_RATE_API_KEY=your-exchangerate-api-key

# Affiliate IDs
BOOKING_AFFILIATE_ID=your-booking-aid
SKYSCANNER_AFFILIATE_ID=your-skyscanner-id

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email (Optional)
RESEND_API_KEY=your-resend-key

# Frontend
FRONTEND_URL=https://odyssey-travel.vercel.app
```

---

# 8. QUICK START COMMANDS

```bash
# 1. Install API dependencies
pip install amadeus httpx stripe

# 2. Update requirements.txt
pip freeze > requirements.txt

# 3. Set environment variables
export AMADEUS_API_KEY="your-key"
export AMADEUS_API_SECRET="your-secret"

# 4. Test Amadeus connection
python -c "
from amadeus import Client
c = Client(client_id='$AMADEUS_API_KEY', client_secret='$AMADEUS_API_SECRET', hostname='test')
r = c.shopping.flight_offers_search.get(originLocationCode='JFK',destinationLocationCode='CDG',departureDate='2025-03-01',adults=1)
print(f'Found {len(r.data)} flights')
"
```

---

**Ready to integrate? Start with Amadeus (flights) and Open-Meteo (weather) - both are FREE and provide production-quality data!**
