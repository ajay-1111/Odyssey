import requests
import sys
import json
from datetime import datetime, timedelta

class OdysseyAPITester:
    def __init__(self, base_url="https://globetrek-18.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_detail = response.json()
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)
        self.run_test("Popular Destinations", "GET", "destinations/popular", 200)

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n🔍 Testing Authentication Flow...")
        
        # Generate unique test user
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_user_{timestamp}@example.com"
        test_password = "TestPass123!"
        test_name = f"Test User {timestamp}"

        # Test registration
        register_data = {
            "email": test_email,
            "password": test_password,
            "name": test_name
        }
        
        response = self.run_test("User Registration", "POST", "auth/register", 200, register_data)
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"    Registered user: {test_email}")
        else:
            print("❌ Registration failed - cannot continue with auth tests")
            return False

        # Test get current user
        self.run_test("Get Current User", "GET", "auth/me", 200)

        # Test login with same credentials
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        # Clear token to test login
        old_token = self.token
        self.token = None
        
        response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        if response and 'token' in response:
            self.token = response['token']
            print(f"    Login successful for: {test_email}")
        else:
            self.token = old_token  # Restore token if login failed

        # Test invalid login
        invalid_login = {
            "email": test_email,
            "password": "wrongpassword"
        }
        self.token = None  # Clear token for invalid login test
        self.run_test("Invalid Login", "POST", "auth/login", 401, invalid_login)
        
        # Restore valid token
        self.token = old_token
        return True

    def test_trip_generation(self):
        """Test trip generation functionality"""
        print("\n🔍 Testing Trip Generation...")
        
        if not self.token:
            print("❌ No auth token - skipping trip tests")
            return None

        # Test trip generation
        trip_request = {
            "departure_location": "New York, USA",
            "destinations": ["Paris, France", "Rome, Italy"],
            "start_date": (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            "end_date": (datetime.now() + timedelta(days=37)).strftime('%Y-%m-%d'),
            "budget": 5000.0,
            "currency": "USD",
            "travelers": {
                "adults": 2,
                "children_above_10": 0,
                "children_below_10": 0,
                "seniors": 0,
                "infants": 0
            },
            "food_preferences": "No preference",
            "accommodation_type": "mid-range",
            "interests": ["History & Culture", "Food & Culinary"]
        }

        print("    Generating trip (this may take 30-60 seconds)...")
        response = self.run_test("Generate Trip", "POST", "trips/generate", 200, trip_request)
        
        if response and 'id' in response:
            trip_id = response['id']
            print(f"    Generated trip ID: {trip_id}")
            
            # Test saving the trip
            save_response = self.run_test("Save Trip", "POST", "trips/save", 200, response)
            
            return trip_id
        else:
            print("❌ Trip generation failed")
            return None

    def test_trip_management(self, trip_id=None):
        """Test trip management endpoints"""
        print("\n🔍 Testing Trip Management...")
        
        if not self.token:
            print("❌ No auth token - skipping trip management tests")
            return

        # Test get my trips
        response = self.run_test("Get My Trips", "GET", "trips/my-trips", 200)
        
        if response and len(response) > 0:
            # Use the first trip for testing if no specific trip_id provided
            if not trip_id:
                trip_id = response[0]['id']
            
            # Test get specific trip
            self.run_test("Get Specific Trip", "GET", f"trips/{trip_id}", 200)
            
            # Test update trip status
            status_data = {"status": "in-progress"}
            self.run_test("Update Trip Status", "PATCH", f"trips/{trip_id}/status", 200, status_data)
            
            # Test delete trip
            self.run_test("Delete Trip", "DELETE", f"trips/{trip_id}", 200)
            
        else:
            print("    No trips found to test management features")

    def test_error_handling(self):
        """Test error handling"""
        print("\n🔍 Testing Error Handling...")
        
        # Test unauthorized access
        old_token = self.token
        self.token = None
        self.run_test("Unauthorized Access", "GET", "trips/my-trips", 403)
        
        # Test invalid token
        self.token = "invalid_token"
        self.run_test("Invalid Token", "GET", "auth/me", 401)
        
        # Test non-existent trip (need valid token)
        self.token = old_token
        if self.token:
            self.run_test("Non-existent Trip", "GET", "trips/non-existent-id", 404)
        else:
            print("    Skipping non-existent trip test - no valid token")
        
        # Test invalid trip generation data
        invalid_trip = {"invalid": "data"}
        self.run_test("Invalid Trip Data", "POST", "trips/generate", 422, invalid_trip)

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Odyssey API Test Suite")
        print("=" * 50)
        
        # Test basic endpoints
        self.test_health_endpoints()
        
        # Test authentication
        auth_success = self.test_auth_flow()
        
        if auth_success:
            # Test trip generation (this is the most critical test)
            trip_id = self.test_trip_generation()
            
            # Test trip management
            self.test_trip_management(trip_id)
        
        # Test error handling
        self.test_error_handling()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            
            # Print failed tests
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
            
            return 1

def main():
    tester = OdysseyAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())