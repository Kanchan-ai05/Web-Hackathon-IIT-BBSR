import pytest
from backend.app.loader import DEMO_ACCOUNTS

def test_login_all_demo_accounts(client):
    for acc in DEMO_ACCOUNTS:
        response = client.post("/api/auth/login", json={
            "email": acc["email"],
            "password": acc["password"]
        })
        assert response.status_code == 200, f"Failed login for {acc['email']}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["role"] == acc["role"]
        assert data["email"] == acc["email"]

def test_invalid_password_rejected(client):
    response = client.post("/api/auth/login", json={
        "email": "admin@cit.edu",
        "password": "WrongPassword999"
    })
    assert response.status_code == 401

def test_unauthenticated_protected_route(client):
    response = client.get("/api/admin/audit-logs")
    assert response.status_code == 401

def test_role_based_access_control(client):
    # Login as club representative
    club_login = client.post("/api/auth/login", json={
        "email": "club@cit.edu",
        "password": "Club@123"
    }).json()
    club_token = club_login["access_token"]
    club_headers = {"Authorization": f"Bearer {club_token}"}

    # Club rep attempting admin-only audit logs -> 403 Forbidden
    response = client.get("/api/admin/audit-logs", headers=club_headers)
    assert response.status_code == 403

    # Login as admin
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@cit.edu",
        "password": "Admin@123"
    }).json()
    admin_token = admin_login["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin accessing audit logs -> 200 OK
    res_admin = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert res_admin.status_code == 200
    logs = res_admin.json()
    assert isinstance(logs, list)
    assert len(logs) > 0

def test_get_me_endpoint(client):
    faculty_login = client.post("/api/auth/login", json={
        "email": "faculty@cit.edu",
        "password": "Faculty@123"
    }).json()
    token = faculty_login["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    user_info = response.json()
    assert user_info["email"] == "faculty@cit.edu"
    assert user_info["role"] == "faculty"

def test_demo_accounts_list_endpoint(client):
    response = client.get("/api/auth/demo-accounts")
    assert response.status_code == 200
    accounts = response.json()
    assert len(accounts) >= 4
    roles = [a["role"] for a in accounts]
    assert "admin" in roles
    assert "faculty" in roles
    assert "student" in roles

def test_user_registration_success(client):
    reg_payload = {
        "name": "Priya Sen",
        "email": "priya.sen@cit.edu",
        "password": "SecurePassword123",
        "role": "student",
        "department": "ECE"
    }
    response = client.post("/api/auth/register", json=reg_payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["email"] == "priya.sen@cit.edu"
    assert data["role"] == "student"

    # Verify newly registered user can immediately log in
    login_res = client.post("/api/auth/login", json={
        "email": "priya.sen@cit.edu",
        "password": "SecurePassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_user_registration_prevents_admin_privilege_escalation(client):
    escalation_payload = {
        "name": "Malicious User",
        "email": "hacker@cit.edu",
        "password": "HackerPassword123",
        "role": "admin",
        "department": "ADMIN"
    }
    response = client.post("/api/auth/register", json=escalation_payload)
    assert response.status_code == 403
    assert "Administrator" in response.json()["detail"]

def test_registration_duplicate_email_rejected(client):
    dup_payload = {
        "name": "Duplicate Student",
        "email": "admin@cit.edu",
        "password": "AnotherPassword123",
        "role": "student"
    }
    response = client.post("/api/auth/register", json=dup_payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_forgot_password_and_reset_flow(client):
    # 1. Register test user
    email = "recovery.test@cit.edu"
    client.post("/api/auth/register", json={
        "name": "Recovery User",
        "email": email,
        "password": "InitialPassword123",
        "role": "faculty",
        "department": "MECH"
    })

    # 2. Request forgot password
    forgot_res = client.post("/api/auth/forgot-password", json={"email": email})
    assert forgot_res.status_code == 200
    forgot_data = forgot_res.json()
    assert "reset_token" in forgot_data
    token = forgot_data["reset_token"]

    # 3. Reset password using token
    new_password = "BrandNewPassword456"
    reset_res = client.post("/api/auth/reset-password", json={
        "email": email,
        "token": token,
        "new_password": new_password
    })
    assert reset_res.status_code == 200

    # 4. Old password should fail
    old_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "InitialPassword123"
    })
    assert old_login.status_code == 401

    # 5. New password succeeds
    new_login = client.post("/api/auth/login", json={
        "email": email,
        "password": new_password
    })
    assert new_login.status_code == 200

def test_admin_user_management_rbac(client):
    # Admin login
    admin_token = client.post("/api/auth/login", json={
        "email": "admin@cit.edu",
        "password": "Admin@123"
    }).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Student login
    student_token = client.post("/api/auth/login", json={
        "email": "student@cit.edu",
        "password": "Student@123"
    }).json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Non-admin attempting to list users -> 403 Forbidden
    non_admin_res = client.get("/api/auth/users", headers=student_headers)
    assert non_admin_res.status_code == 403

    # Admin listing all users -> 200 OK
    users_res = client.get("/api/auth/users", headers=admin_headers)
    assert users_res.status_code == 200
    users_list = users_res.json()
    assert len(users_list) >= 4

    # Target user to modify
    student_record = next(u for u in users_list if u["email"] == "student@cit.edu")
    user_id = student_record["id"]

    # Admin updates user's role to coordinator
    update_res = client.patch(
        f"/api/auth/users/{user_id}/role",
        headers=admin_headers,
        json={"role": "coordinator", "department": "CSE"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["role"] == "coordinator"

def test_logout_endpoint(client):
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    assert res.json()["status"] == "success"
