import requests
import sys
import json
from datetime import datetime

class JaipurEyeVisionAPITester:
    def __init__(self, base_url="https://eyevision-saas.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.errors = []

    def log_error(self, test_name, error):
        """Log errors for debugging"""
        self.errors.append(f"{test_name}: {error}")
        print(f"❌ {test_name} - Error: {error}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        
        # Add auth token if available
        token = self.admin_token if use_admin and self.admin_token else self.token
        if token:
            req_headers['Authorization'] = f'Bearer {token}'
        
        # Add custom headers
        if headers:
            req_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=10)

            print(f"Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except json.JSONDecodeError:
                    return True, {}
            else:
                self.log_error(name, f"Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"Response: {error_detail}")
                except:
                    print(f"Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.Timeout:
            self.log_error(name, "Request timeout after 10 seconds")
            return False, {}
        except Exception as e:
            self.log_error(name, str(e))
            return False, {}

    def test_health_endpoint(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "api/", 200)

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "email": "admin@jaipureyevision.com",
            "password": "admin@3036"
        }
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"✅ Admin token obtained: {self.admin_token[:20]}...")
            return True, response
        return False, {}

    def test_user_signup_login(self):
        """Test user signup and login flow"""
        # Create unique user for testing
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        signup_data = {
            "name": "Test User",
            "email": test_email,
            "password": "TestPass123!"
        }
        
        # Test signup
        success, response = self.run_test(
            "User Signup",
            "POST", 
            "api/auth/signup",
            200,
            data=signup_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"✅ User token obtained: {self.token[:20]}...")
            return True
        return False

    def test_subscription_plans(self):
        """Test subscription plans endpoint"""
        return self.run_test("Get Subscription Plans", "GET", "api/subscription/plans", 200)

    def test_mcp_tools(self):
        """Test MCP tools endpoint"""
        return self.run_test("Get MCP Tools", "GET", "api/mcp/tools", 200)

    def test_credits_balance(self):
        """Test credits balance endpoint (requires auth)"""
        if not self.token:
            print("⚠️ Skipping credits balance test - no auth token")
            return False, {}
        return self.run_test("Get Credits Balance", "GET", "api/credits/balance", 200)

    def test_user_profile(self):
        """Test get current user endpoint (requires auth)"""
        if not self.token:
            print("⚠️ Skipping user profile test - no auth token")
            return False, {}
        return self.run_test("Get User Profile", "GET", "api/auth/me", 200)

    def test_admin_endpoints(self):
        """Test admin endpoints (requires admin auth)"""
        if not self.admin_token:
            print("⚠️ Skipping admin tests - no admin token")
            return False
        
        success = True
        
        # Test admin users list
        result, _ = self.run_test("Admin - List Users", "GET", "api/admin/users", 200, use_admin=True)
        success = success and result
        
        # Test admin usage logs
        result, _ = self.run_test("Admin - Usage Logs", "GET", "api/admin/usage", 200, use_admin=True)
        success = success and result
        
        # Test admin errors
        result, _ = self.run_test("Admin - Error Logs", "GET", "api/admin/errors", 200, use_admin=True)
        success = success and result
        
        return success

    def test_protected_endpoints_without_auth(self):
        """Test that protected endpoints return 401 without auth"""
        # Temporarily clear token
        temp_token = self.token
        self.token = None
        
        success = True
        
        # These should return 401
        result, _ = self.run_test("Protected - Credits (No Auth)", "GET", "api/credits/balance", 401)
        success = success and result
        
        result, _ = self.run_test("Protected - Profile (No Auth)", "GET", "api/auth/me", 401) 
        success = success and result
        
        # Restore token
        self.token = temp_token
        return success

def main():
    print("🚀 Starting JaipurEyeVision Studio API Tests")
    print("=" * 50)
    
    # Setup tester
    tester = JaipurEyeVisionAPITester()
    
    # Test basic endpoints first
    print("\n📡 Testing Basic Endpoints...")
    tester.test_health_endpoint()
    tester.test_root_endpoint()
    tester.test_subscription_plans()
    tester.test_mcp_tools()
    
    # Test authentication
    print("\n🔐 Testing Authentication...")
    tester.test_admin_login()
    tester.test_user_signup_login()
    
    # Test protected endpoints
    print("\n🔒 Testing Protected Endpoints...")
    tester.test_credits_balance()
    tester.test_user_profile()
    
    # Test admin endpoints
    print("\n👑 Testing Admin Endpoints...")
    tester.test_admin_endpoints()
    
    # Test security (protected endpoints without auth)
    print("\n🛡️ Testing Security...")
    tester.test_protected_endpoints_without_auth()
    
    # Print final results
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.errors:
        print(f"\n❌ ERRORS ENCOUNTERED:")
        for error in tester.errors:
            print(f"  - {error}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())