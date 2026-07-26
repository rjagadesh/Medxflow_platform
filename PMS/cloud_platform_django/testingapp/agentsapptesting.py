# import requests

# BASE_URL = "http://127.0.0.1:8000"

# # Step 1: Get access token
# resp = requests.post(
#     f"{BASE_URL}/app/account/login/",
#     json={"username": "brama", "password": "1234"}
# )
# tokens = resp.json()
# access_token = tokens["access"]
# print("Access token:", access_token)


# import requests

# url = "http://127.0.0.1:8000/app/moduleapp/generated-apis/"

# # replace with a valid user_id and app_id from your DB
# data = {
#     "apps": 8
# }

# # assuming DRF default auth (or disable IsAuthenticated if testing)
# headers = {
#     "Authorization": f"Bearer {access_token}"
# }

# resp = requests.post(url, json=data, headers=headers)
# print(resp.status_code, resp.text)

# BASE_URL = "http://127.0.0.1:8000"
# import requests
# payload = {
#   "apikey": "b816a75ee736fadde73238cba2b4a233",
#   "data": {
#     "tasks": [
#       {"region": "USA", "priority": "high"},
#       {"region": "IN", "priority": "low"}
#     ]
#   }
# }

# resp = requests.post(f"{BASE_URL}/app/agentsapp/tasks/create/", json=payload)
# print("Create Task:", resp.status_code, resp.json())
# # # import requests
# resp = requests.get(
#     f"{BASE_URL}/app/agentsapp/tasks/",  
#     params={"apikey": "f6214e44dab37e725ca29bb8430e1706", "data__region": "US", "page_size": 50, "ordering":"data__region"}
# )
# print("List:", resp.status_code, resp.json())
# # import requests
 
 
 
# url = "http://127.0.0.1:8000/app/agentsapp/upload/"
# headers = {"Authorization": f"Bearer {access_token}"}
# data = {
#  "secretkey": "DF543-B4D23-3B0A7-93D12-83C16",
#  'agentid': 11
# }
# files = [
#  ("files", open(r"C:\Users\Kabilan.b\Downloads\user_2.txt.txt", "rb")),
#   ("files", open(r"C:\Users\Kabilan.b\Downloads\user_2.json", "rb")), # you can add more
# ]
 
 
 
# response = requests.post(url, data=data, files=files, headers=headers)
# print("Status:", response.status_code)
# print("Response:", response.json())


# import requests
 
# url = "dev-cloud.droidal.com/app/agentsapp/get-agent-files"
# params = {
#     "agentid": "11",
#     "secretkey": "90406-84C25-0FDA5-8B689-D4C69"
# }
 
# res = requests.get(url, params=params)
# print(res.status_code, res.json())
# import requests
 
# headers = {"Authorization": f"Bearer {access_token}"} 
# BASE_URL = "http://dev-cloud.droidal.com/app/agentsapp"
# api_key = "DF543-B4D23-3B0A7-93D12-83C16"
 
 
# resp = requests.get(f"{BASE_URL}/tasks/pending/", params={"apikey": api_key},headers=headers)
# print(resp.text)

import requests

# BASE_URL = "http://127.0.0.1:8000/app/moduleapp"

# # Replace with an existing Module ID
# module_id = 20

# APPS_URL = f"{BASE_URL}/apps/"

# data = {
#     "app_name": "Eligibility Checker",   # required
#     "module": module_id,                 # FK → must exist
# }

# headers = {
#     "Authorization": f"Bearer {access_token}",  # if authentication required
#     "Content-Type": "application/json"
# }

# resp = requests.post(APPS_URL, json=data, headers=headers)
# print("Status:", resp.status_code)
# print("Response:", resp.json())



# import requests
 
# headers = {"Authorization": f"Bearer {access_token}"}

# BASE_URL = "http://127.0.0.1:8000/app/agentsapp"
# api_key = "efee4e2329fbf5d01f39f7544d2027dc"
 
 
# resp = requests.get(f"{BASE_URL}/tasks/pending/", params={"apikey": api_key})
# print(resp.json())

# BASE_URL = "http://127.0.0.1:8000/app/agentsapp"
# api_key = "f6214e44dab37e725ca29bb8430e1706"
 
# task_id = 29
 
# payload = {
#     "apikey": api_key,
#     "status": "SUCCESS"
# }
 
 
# resp = requests.put(f"{BASE_URL}/tasks/{task_id}/update-status/",json=payload)
# print("Update Status:", resp.status_code, resp.json())

# ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU4OTAwOTUxLCJpYXQiOjE3NTg4OTczNTEsImp0aSI6IjM0OTEwMmFlM2ViOTQwZTA4MTM2MjA4YTdhN2Y2ZWI5IiwidXNlcl9pZCI6IjY4In0.dLGZiKOz_Wska3p7bCgkpXa__MRAYjnw9meny0FLwk8"

# import requests

# url = "http://127.0.0.1:8000/app/roi/process-data/"
# headers = {
#     "Content-Type": "application/json",
#     "Authorization": f"Bearer {ACCESS_TOKEN}"  # replace with real token if auth enabled
# }
# payload = {"python_code": "import time\ntime.sleep(2)\nprint('helloworld')"}

# response = requests.get(url, headers=headers)#, json=payload)

# print("Status:", response.status_code)
# try:
#     print("Response:", response.json())
# except Exception:
#     print("Raw Response:", response.text)

import requests
import json
import pandas as pd

# === API URL and headers ===
url = "https://beta-cloud.droidal.com/app/agentsapp/tasks/?apikey=d7f9d7b94143b29a96b55c12e4e229c6&page_size=200&page=1&ordering="

headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYwNDI2Nzc0LCJpYXQiOjE3NjA0MjMxNzQsImp0aSI6IjllYWZkN2IxMWRkZTQzMGFiNDVjNjVkMjEwMzQ0NTZhIiwidXNlcl9pZCI6IjUifQ.OeTZFC2GHSdBAQ3rdJcMlvR3Aj9U8qJ7df_DrD_u25g'
}

# === Send Request ===
response = requests.get(url, headers=headers)

# Check response
if response.status_code != 200:
    print(f"Error: {response.status_code} - {response.text}")
    exit()

# === Parse JSON ===
data = response.json()
response = requests.request("GET", url, headers=headers)
 
print(response.json())
# Some APIs wrap the data in a 'results' key — check and extract
if isinstance(data, dict) and 'results' in data:
    records = data['results']
else:
    records = data

# === Convert to DataFrame ===
if isinstance(records, list) and len(records) > 0:
    df = pd.DataFrame(records)
else:
    print("No records found.")
    exit()

# === Save to Excel ===
output_file = "tasks_data.xlsx"
df.to_excel(output_file, index=False)

print(f"✅ Data saved successfully to {output_file}")