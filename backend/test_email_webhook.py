"""
Test script for email webhook endpoint
Run this to test the email incoming endpoint
"""
import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:8000"

# Test email data
test_email = {
    "from_email": "test.customer@example.com",
    "from_name": "John Doe",
    "subject": "Inquiry about Building Materials",
    "body": """
    Hello,
    
    My name is John Doe and I'm interested in your building materials.
    My phone number is +905551234567.
    My email is john.doe@example.com.
    
    Could you please send me more information?
    
    Best regards,
    John Doe
    """,
    "html_body": None,
    "headers": {}
}

# Test email in different languages
test_emails = [
    {
        "name": "English Email",
        "data": {
            **test_email,
            "body": "Hello, I'm interested in your products. My phone is +1234567890."
        }
    },
    {
        "name": "German Email",
        "data": {
            **test_email,
            "from_name": "Hans Schmidt",
            "body": "Hallo, ich interessiere mich für Ihre Produkte. Meine Telefonnummer ist +491234567890."
        }
    },
    {
        "name": "French Email",
        "data": {
            **test_email,
            "from_name": "Pierre Dubois",
            "body": "Bonjour, je suis intéressé par vos produits. Mon téléphone est +33123456789."
        }
    },
    {
        "name": "Spanish Email",
        "data": {
            **test_email,
            "from_name": "Carlos Rodriguez",
            "body": "Hola, estoy interesado en sus productos. Mi teléfono es +34123456789."
        }
    },
    {
        "name": "Turkish Email",
        "data": {
            **test_email,
            "from_name": "Ahmet Yılmaz",
            "body": "Merhaba, ürünlerinizle ilgileniyorum. Telefonum +905551234567."
        }
    }
]

def test_email_webhook(email_data, email_name):
    """Test email webhook endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {email_name}")
    print(f"{'='*60}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/emails/incoming",
            json=email_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success!")
            print(f"   Message ID: {result.get('message_id')}")
            print(f"   Conversation ID: {result.get('conversation_id')}")
            print(f"   Customer ID: {result.get('customer_id')}")
            print(f"   Detected Language: {result.get('detected_language')}")
            print(f"   Translated Content: {result.get('translated_content', '')[:100]}...")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection Error: Backend server is not running at {BACKEND_URL}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("Email Webhook Test Script")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print("\nMake sure the backend server is running!")
    print("Start it with: uvicorn main:app --reload")
    
    # Test single email
    # test_email_webhook(test_email, "Single Test Email")
    
    # Test multiple languages
    for test in test_emails:
        test_email_webhook(test["data"], test["name"])
        import time
        time.sleep(1)  # Small delay between requests
    
    print(f"\n{'='*60}")
    print("Test completed!")
    print(f"{'='*60}")
