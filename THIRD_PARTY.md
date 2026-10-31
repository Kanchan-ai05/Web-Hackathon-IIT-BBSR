# Third-Party Libraries and Solvers

This document declares all external open-source libraries and frameworks used in the project, adhering to Section 6 of the hackathon requirements.

---

## 1. Backend Libraries
| Package | Version | Purpose & License |
| :--- | :--- | :--- |
| `fastapi` | $\ge 0.110.0$ | High-performance Python web framework (MIT) |
| `uvicorn` | $\ge 0.28.0$ | ASGI web server (BSD-3-Clause) |
| `pydantic` | $\ge 2.6.0$ | Data validation & schema serialization (MIT) |
| `sqlalchemy` | $\ge 2.0.0$ | Python SQL toolkit and ORM (MIT) |
| `ortools` | $\ge 9.8.0$ | Google OR-Tools CP-SAT constraint programming solver (Apache-2.0) |
| `python-jose[cryptography]` | $\ge 3.3.0$ | JWT authentication tokens (MIT) |
| `passlib[bcrypt]` | $\ge 1.7.4$ | Secure password hashing (BSD) |
| `python-multipart` | $\ge 0.0.9$ | Multipart form data parsing for dataset uploads (Apache-2.0) |
| `pytest` | $\ge 8.0.0$ | Automated test runner (MIT) |
| `httpx` | $\ge 0.27.0$ | HTTP client for FastAPI test client (BSD-3-Clause) |

---

## 2. Frontend Libraries
| Package | Version | Purpose & License |
| :--- | :--- | :--- |
| `next` | 14.x | React framework for web applications (MIT) |
| `react` / `react-dom` | 18.x | Declarative UI components (MIT) |
| `tailwindcss` | 3.x | Utility-first CSS framework (MIT) |
| `lucide-react` | $\ge 0.350.0$ | Icon set (ISC) |

---

## 3. Fresh Codebase Attestation
All timetable solver models, database schema, validator rules, and application UI code were written specifically for this challenge. No pre-existing hackathon projects or bought templates are used.
