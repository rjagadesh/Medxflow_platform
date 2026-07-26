import requests
import os
#testing
# Configuration
BASE_URL = "http://localhost:8000/app/"
USERNAME1 = "user1_test"
PASSWORD1 = "Password123"
EMAIL1 = "user1@example.com"
USERNAME2 = "user2_test"
PASSWORD2 = "Password123"
EMAIL2 = "user2@example.com"

# Helper function to login and get JWT access token
def login_and_get_token(username, password):
    response = requests.post(
        f"{BASE_URL}login/",
        json={"username_or_email": username, "password": password}
    )
    if response.status_code == 200:
        return response.json().get("access")
    print(f"Login Failed: {response.status_code} {response.json()}")
    return None

# Test cases
def test_user_apis():
    # Test Create User
    print("Testing User Create...")
    response = requests.post(
        f"{BASE_URL}users/",
        json={
            "username": USERNAME1,
            "email": EMAIL1,
            "password": PASSWORD1,
            "first_name": "User",
            "last_name": "One",
            "mobile": "1234567890"
        }
    )
    if response.status_code == 201:
        print("User Create: Success")
        user1_id = response.json().get("id")
    else:
        print(f"User Create Failed: {response.status_code} {response.json()}")
        return None, None
    
    # Create second user
    response = requests.post(
        f"{BASE_URL}users/",
        json={
            "username": USERNAME2,
            "email": EMAIL2,
            "password": PASSWORD2,
            "first_name": "User",
            "last_name": "Two",
            "mobile": "0987654321"
        }
    )
    if response.status_code == 201:
        print("Second User Create: Success")
        user2_id = response.json().get("id")
    else:
        print(f"Second User Create Failed: {response.status_code} {response.json()}")
        return None, None
    
    # Test Login
    print("Testing User Login...")
    token1 = login_and_get_token(USERNAME1, PASSWORD1)
    token2 = login_and_get_token(USERNAME2, PASSWORD2)
    if token1 and token2:
        print("User Login: Success")
    else:
        print(f"User Login Failed: Token1={token1}, Token2={token2}")
        return None, None
    
    # Test Retrieve User
    print("Testing User Retrieve...")
    headers = {"Authorization": f"Bearer {token1}"}
    response = requests.get(f"{BASE_URL}users/{user1_id}/", headers=headers)
    if response.status_code == 200:
        print("User Retrieve: Success")
    else:
        print(f"User Retrieve Failed: {response.status_code} {response.json()}")
    
    # Test Unauthorized User Retrieve
    print("Testing Unauthorized User Retrieve...")
    response = requests.get(f"{BASE_URL}users/{user1_id}/", headers={"Authorization": f"Bearer {token2}"})
    if response.status_code == 404:
        print("Unauthorized User Retrieve: Success")
    else:
        print(f"Unauthorized User Retrieve Failed: {response.status_code} {response.json()}")
    
    return token1, token2

def test_project_apis(token1, token2):
    headers = {"Authorization": f"Bearer {token1}"}
    
    # Test Create Project
    print("Testing Project Create...")
    response = requests.post(
        f"{BASE_URL}projects/create/",
        json={"name": "Test Project", "description": "A test project"},
        headers=headers
    )
    if response.status_code == 201:
        print("Project Create: Success")
        project_id = response.json().get("project_id")
    else:
        print(f"Project Create Failed: {response.status_code} {response.json()}")
        return None
    
    # Test Retrieve Project
    print("Testing Project Retrieve...")
    response = requests.get(f"{BASE_URL}projects/{project_id}/", headers=headers)
    if response.status_code == 200:
        print("Project Retrieve: Success")
    else:
        print(f"Project Retrieve Failed: {response.status_code} {response.json()}")
    
    # Test Update Project
    print("Testing Project Update...")
    response = requests.put(
        f"{BASE_URL}projects/{project_id}/update/",
        json={"name": "Updated Project", "description": "Updated description"},
        headers=headers
    )
    if response.status_code == 200:
        print("Project Update: Success")
    else:
        print(f"Project Update Failed: {response.status_code} {response.json()}")
    
    # Test List Projects
    print("Testing Project List...")
    response = requests.get(f"{BASE_URL}projects/", headers=headers)
    if response.status_code == 200 and len(response.json()) > 0:
        print("Project List: Success")
    else:
        print(f"Project List Failed: {response.status_code} {response.json()}")
    
    # Test Delete Project
    print("Testing Project Delete...")
    # response = requests.delete(f"{BASE_URL}projects/{project_id}/delete/", headers=headers)
    # if response.status_code == 204:
    #     print("Project Delete: Success")
    # else:
    #     print(f"Project Delete Failed: {response.status_code} {response.json()}")
    
    # Test Unauthorized Access (user2)
    print("Testing Project Create Unauthorized...")
    response = requests.post(
        f"{BASE_URL}projects/create/",
        json={"name": "Test Project", "description": "A test project"},
        headers={"Authorization": f"Bearer {token2}"}
    )
    project_id2 = response.json().get("project_id") if response.status_code == 201 else None
    response = requests.get(f"{BASE_URL}projects/{project_id}/", headers={"Authorization": f"Bearer {token2}"})
    if response.status_code == 404:
        print("Project Unauthorized Access: Success")
    else:
        print(f"Project Unauthorized Access Failed: {response.status_code} {response.json()}")
    
    return project_id if project_id else None

def test_task_apis(token1, token2, project_id):
    headers = {"Authorization": f"Bearer {token1}"}
    
    # Test Create Task
    print(f"Testing Task Create... {project_id}")
    response = requests.post(
        f"{BASE_URL}projects/{project_id}/tasks/create/",
        json={
            "task_name": "Test Task",
            "task_description": "A test task",
            "task_trigger_status": "PENDING"
        },
        headers=headers
    )
    if response.status_code == 201:
        print("Task Create: Success")
        task_id = response.json().get("task_id")
    else:
        print(f"Task Create Failed: {response.status_code} {response.json()}")
        return
    
    # Test Create Task with File
    print("Testing Task Create with File...")
    with open("test.txt", "wb") as f:
        f.write(b"Test file content")
    with open("test.txt", "rb") as f:
        response = requests.post(
            f"{BASE_URL}projects/{project_id}/tasks/create/",
            files={"task_file": f},
            data={
                "task_name": "Task with File",
                "task_description": "Task with file",
                "task_trigger_status": "PENDING"
            },
            headers=headers
        )
    os.remove("test.txt")
    if response.status_code == 201:
        print("Task Create with File: Success")
    else:
        print(f"Task Create with File Failed: {response.status_code} {response.json()}")
    
    # Test Retrieve Task
    print("Testing Task Retrieve...")
    response = requests.get(f"{BASE_URL}tasks/{task_id}/", headers=headers)
    if response.status_code == 200:
        print("Task Retrieve: Success")
    else:
        print(f"Task Retrieve Failed: {response.status_code} {response.json()}")
    
    # Test Update Task
    print("Testing Task Update...")
    response = requests.put(
        f"{BASE_URL}tasks/{task_id}/update/",
        json={
            "task_name": "Updated Task",
            "task_description": "Updated description",
            "task_trigger_status": "IN_PROGRESS"
        },
        headers=headers
    )
    if response.status_code == 200:
        print("Task Update: Success")
    else:
        print(f"Task Update Failed: {response.status_code} {response.json()}")
    
    # Test List Tasks
    print("Testing Task List...")
    response = requests.get(f"{BASE_URL}projects/{project_id}/tasks/", headers=headers)
    if response.status_code == 200 and len(response.json()) > 0:
        print("Task List: Success")
    else:
        print(f"Task List Failed: {response.status_code} {response.json()}")
    
    # Test Delete Task
    print("Testing Task Delete...")
    response = requests.delete(f"{BASE_URL}tasks/{task_id}/delete/", headers=headers)
    if response.status_code == 204:
        print("Task Delete: Success")
    else:
        print(f"Task Delete Failed: {response.status_code} {response.json()}")
    
    # Test Unauthorized Access (user2)
    print("Testing Task Create Unauthorized...")
    response = requests.post(
        f"{BASE_URL}projects/{project_id}/tasks/create/",
        json={
            "task_name": "Test Task",
            "task_description": "A test task",
            "task_trigger_status": "PENDING"
        },
        headers={"Authorization": f"Bearer {token2}"}
    )
    if response.status_code == 400 or response.status_code == 404:
        print("Task Unauthorized Access: Success")
    else:
        print(f"Task Unauthorized Access Failed: {response.status_code} {response.json()}")

def main():
    print("Running User API Tests...")
    token1, token2 = test_user_apis()
    if not token1 or not token2:
        print("Stopping tests due to user creation/login failure.")
        return
    
    print("\nRunning Project API Tests...")
    project_id = test_project_apis(token1, token2)
    if not project_id:
        print("Stopping tests due to project creation failure.")
        return
    
    print("\nRunning Task API Tests...")
    test_task_apis(token1, token2, project_id)

if __name__ == "__main__":
    main()