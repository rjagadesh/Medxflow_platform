# import requests

# BASE_URL = "http://127.0.0.1:8000"
# TASK_ID = 5  # replace with real task id

# resp = requests.get(f"{BASE_URL}/app/project/get-task-files/{TASK_ID}")
# print("Status:", resp.status_code)
# print("Response:", resp.json())


import requests
import json

# --- API URL ---
BASE_URL = "http://127.0.0.1:8000/app/agentsapp/edit-data/"  # adjust to your server URL

# --- Query parameters ---
params = {
    "apikey": "3778380466bda302f2240ce07e9e4aec",   # replace with a real API key from GeneratedAPI
    "task_id": 34780          # replace with a valid AgentTask ID
}

# --- Partial update data ---
payload = {
    "data": {
        "DOB": "45903"
    }
}

# --- Optional headers ---
headers = {
    "Content-Type": "application/json"
}

# --- Send PATCH request ---
response = requests.patch(BASE_URL, params=params, data=json.dumps(payload), headers=headers)

# --- Print results ---
print("Status Code:", response.status_code)
try:
    print("Response:", json.dumps(response.json(), indent=4))
except Exception:
    print("Response Text:", response.text)
