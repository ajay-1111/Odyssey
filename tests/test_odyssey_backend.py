"""
Odyssey Travel Planner - Backend API Tests
Tests for: countries, currencies, city autocomplete, auth, trips, contact, newsletter
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://travel-planner-169.preview.emergentagent.com')

class TestHealthEndpoints:
    """Health check and basic API tests"""
    
    def test_health_check(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_root_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["status"] == "online"


class TestCountriesAPI:
    """Tests for /api/countries endpoint - passport selection"""
    
    def test_get_countries_returns_list(self):
        response = requests.get(f"{BASE_URL}/api/countries")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 50  # Should have 60 countries
    
    def test_country_has_required_fields(self):
        response = requests.get(f"{BASE_URL}/api/countries")
        assert response.status_code == 200
        data = response.json()
        # Check first country has required fields
        country = data[0]
        assert "code" in country
        assert "name" in country
        assert "flag" in country
    
    def test_us_country_exists(self):
        response = requests.get(f"{BASE_URL}/api/countries")
        assert response.status_code == 200
        data = response.json()
        us_country = next((c for c in data if c["code"] == "US"), None)
        assert us_country is not None
        assert us_country["name"] == "United States"
        assert us_country["flag"] == "🇺🇸"


class TestCurrenciesAPI:
    """Tests for /api/currencies endpoint - currency conversion"""
    
    def test_get_currencies_returns_list(self):
        response = requests.get(f"{BASE_URL}/api/currencies")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 30  # Should have 30 currencies
    
    def test_currency_has_required_fields(self):
        response = requests.get(f"{BASE_URL}/api/currencies")
        assert response.status_code == 200
        data = response.json()
        currency = data[0]
        assert "code" in currency
        assert "symbol" in currency
        assert "name" in currency
        assert "rate" in currency
    
    def test_usd_currency_exists(self):
        response = requests.get(f"{BASE_URL}/api/currencies")
        assert response.status_code == 200
        data = response.json()
        usd = next((c for c in data if c["code"] == "USD"), None)
        assert usd is not None
        assert usd["symbol"] == "$"
        assert usd["rate"] == 1.0
    
    def test_inr_currency_exists(self):
        response = requests.get(f"{BASE_URL}/api/currencies")
        assert response.status_code == 200
        data = response.json()
        inr = next((c for c in data if c["code"] == "INR"), None)
        assert inr is not None
        assert inr["symbol"] == "₹"


class TestCurrencyConversion:
    """Tests for /api/convert-currency endpoint"""
    
    def test_convert_usd_to_eur(self):
        response = requests.get(f"{BASE_URL}/api/convert-currency?amount=100&from_curr=USD&to_curr=EUR")
        assert response.status_code == 200
        data = response.json()
        assert "converted" in data
        assert data["original"] == 100
        assert data["from"] == "USD"
        assert data["to"] == "EUR"
        assert data["converted"] > 0
    
    def test_convert_usd_to_inr(self):
        response = requests.get(f"{BASE_URL}/api/convert-currency?amount=100&from_curr=USD&to_curr=INR")
        assert response.status_code == 200
        data = response.json()
        assert data["converted"] > 8000  # INR rate is ~83


class TestCityAutocomplete:
    """Tests for /api/autocomplete/cities endpoint"""
    
    def test_autocomplete_new_york(self):
        response = requests.get(f"{BASE_URL}/api/autocomplete/cities?q=new")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should find New York
        cities = [c["city"] for c in data]
        assert "New York" in cities
    
    def test_autocomplete_returns_airports(self):
        response = requests.get(f"{BASE_URL}/api/autocomplete/cities?q=new york")
        assert response.status_code == 200
        data = response.json()
        ny = next((c for c in data if c["city"] == "New York"), None)
        assert ny is not None
        assert "airports" in ny
        assert len(ny["airports"]) >= 3  # JFK, EWR, LGA
    
    def test_autocomplete_london(self):
        response = requests.get(f"{BASE_URL}/api/autocomplete/cities?q=london")
        assert response.status_code == 200
        data = response.json()
        london = next((c for c in data if c["city"] == "London"), None)
        assert london is not None
        assert london["country"] == "United Kingdom"
    
    def test_autocomplete_short_query(self):
        """Short queries should return default cities"""
        response = requests.get(f"{BASE_URL}/api/autocomplete/cities?q=a")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_autocomplete_empty_query(self):
        response = requests.get(f"{BASE_URL}/api/autocomplete/cities?q=")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestVisaRequirements:
    """Tests for /api/visa-requirements endpoint"""
    
    def test_visa_us_to_france(self):
        response = requests.get(f"{BASE_URL}/api/visa-requirements?passport_country=US&destination_country=FR")
        assert response.status_code == 200
        data = response.json()
        assert "visa_required" in data
        assert "type" in data
    
    def test_visa_same_country(self):
        response = requests.get(f"{BASE_URL}/api/visa-requirements?passport_country=US&destination_country=US")
        assert response.status_code == 200
        data = response.json()
        assert data["visa_required"] == False
        assert data["type"] == "citizen"


class TestPopularDestinations:
    """Tests for /api/destinations/popular endpoint"""
    
    def test_get_popular_destinations(self):
        response = requests.get(f"{BASE_URL}/api/destinations/popular")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 8
    
    def test_destination_has_required_fields(self):
        response = requests.get(f"{BASE_URL}/api/destinations/popular")
        assert response.status_code == 200
        data = response.json()
        dest = data[0]
        assert "name" in dest
        assert "image" in dest
        assert "tagline" in dest
        assert "rating" in dest


class TestInsuranceProviders:
    """Tests for /api/insurance-providers endpoint"""
    
    def test_get_insurance_providers(self):
        response = requests.get(f"{BASE_URL}/api/insurance-providers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 5
    
    def test_provider_has_required_fields(self):
        response = requests.get(f"{BASE_URL}/api/insurance-providers")
        assert response.status_code == 200
        data = response.json()
        provider = data[0]
        assert "name" in provider
        assert "url" in provider
        assert "price_range" in provider


class TestBaggageInfo:
    """Tests for /api/baggage-info endpoint"""
    
    def test_economy_baggage(self):
        response = requests.get(f"{BASE_URL}/api/baggage-info/economy")
        assert response.status_code == 200
        data = response.json()
        assert "cabin" in data
        assert "checked" in data
    
    def test_business_baggage(self):
        response = requests.get(f"{BASE_URL}/api/baggage-info/business")
        assert response.status_code == 200
        data = response.json()
        assert "cabin" in data
        assert "checked" in data


class TestAuthEndpoints:
    """Tests for authentication endpoints"""
    
    def test_register_new_user(self):
        unique_email = f"test_{uuid.uuid4().hex[:8]}@odyssey.test"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
    
    def test_register_duplicate_email(self):
        unique_email = f"test_{uuid.uuid4().hex[:8]}@odyssey.test"
        # First registration
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        # Second registration with same email
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User 2"
        })
        assert response.status_code == 400
    
    def test_login_invalid_credentials(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
    
    def test_me_without_token(self):
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]


class TestContactAndNewsletter:
    """Tests for contact form and newsletter"""
    
    def test_submit_contact_form(self):
        response = requests.post(f"{BASE_URL}/api/contact", json={
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "Test message content"
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_newsletter_subscribe(self):
        unique_email = f"newsletter_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/newsletter/subscribe", json={
            "email": unique_email
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestAirportsEndpoint:
    """Tests for /api/airports endpoint"""
    
    def test_get_new_york_airports(self):
        response = requests.get(f"{BASE_URL}/api/airports/New York")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        airport_codes = [a["code"] for a in data]
        assert "JFK" in airport_codes
        assert "EWR" in airport_codes


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
