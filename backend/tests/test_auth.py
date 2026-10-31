import pytest
from backend.app.loader import DEMO_ACCOUNTS

def test_login_all_four_demo_accounts(client):
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
    assert len(accounts) == 4
    roles = [a["role"] for a in accounts]
    assert "admin" in roles
    assert "department_coordinator" in roles
    assert "faculty" in roles
    assert "club" in roles
