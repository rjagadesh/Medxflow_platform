import requests
BASE_URL = "http://localhost:8000/app/api/ai-usage-summary/"

# Replace with the token you generated for the client user
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYxODA2MDk3LCJpYXQiOjE3NjE4MDI0OTcsImp0aSI6IjQ2ZDQ3NDA4Y2EyNzQ4NDM5NDk1OTUzYzJhNjNmZTA4IiwidXNlcl9pZCI6IjY4In0.6nz9fdLPjb5gHlk0B25TxZoR3s8neG7VEAr-gk-cIeM"

# Query params (e.g. date range + grouping)
params = {
    "start_date": "2025-09-01",
    "end_date": "2025-10-30",
    "group_by": "year"
}

# Headers for token authentication

ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYxODA2MDk3LCJpYXQiOjE3NjE4MDI0OTcsImp0aSI6IjQ2ZDQ3NDA4Y2EyNzQ4NDM5NDk1OTUzYzJhNjNmZTA4IiwidXNlcl9pZCI6IjY4In0.6nz9fdLPjb5gHlk0B25TxZoR3s8neG7VEAr-gk-cIeM"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

# Send GET request
response = requests.get(BASE_URL, headers=headers, params=params)

# Print results
if response.status_code == 200:
    print("✅ Success!")
    print(response.json())
else:
    print(f"❌ Error {response.status_code}: {response.text}")
