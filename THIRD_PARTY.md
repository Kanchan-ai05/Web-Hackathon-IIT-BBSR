# Third-Party Libraries and Solvers: CIT Nexus

This document declares all external open-source libraries, solvers, and runtime dependencies utilized across **CIT Nexus – Smart Campus Intelligence Platform**, strictly complying with Section 6 of the hackathon guidelines.

---

## 1. Backend Libraries & Solvers (Python 3.10+)

| Package | Minimum Version | License | Institutional Purpose |
| :--- | :--- | :--- | :--- |
| `fastapi` | `0.110.0` | MIT | Asynchronous ASGI web framework powering 19 modular REST API routers |
| `uvicorn` | `0.28.0` | BSD-3-Clause | Production ASGI web server with event-loop concurrency |
| `pydantic` | `2.6.0` | MIT | Strict JSON schema parsing, runtime validation, and request DTOs |
| `sqlalchemy` | `2.0.25` | MIT | Core relational ORM connecting to SQLite relational timetable engine |
| `ortools` | `9.8.3296` | Apache-2.0 | Google CP-SAT constraint programming solver for timetable and disruption rescheduling |
| `pymongo` | `4.6.0` | Apache-2.0 | Synchronous MongoDB driver for spatial campus entities and analytics |
| `motor` | `3.3.0` | Apache-2.0 | Asynchronous MongoDB driver for non-blocking collection access |
| `python-jose[cryptography]` | `3.3.0` | MIT | Cryptographic JWT access token encoding, signing, and verification |
| `passlib[bcrypt]` | `1.7.4` | BSD | Cryptographic one-way password hashing (Bcrypt algorithm) |
| `python-multipart` | `0.0.9` | Apache-2.0 | Multipart form-data streaming parser for dataset uploads |
| `httpx` | `0.27.0` | BSD-3-Clause | Asynchronous HTTP client powering FastAPI TestClient test suites |
| `pytest` | `8.0.0` | MIT | Comprehensive automated test runner executing 91 regression tests |

---

## 2. Frontend Libraries (TypeScript & React 18)

| Package | Version | License | Institutional Purpose |
| :--- | :--- | :--- | :--- |
| `next` | `^14.1.4` | MIT | React meta-framework with App Router, static export (`output: export`), and route pre-rendering |
| `react` | `^18.2.0` | MIT | Declarative component UI engine with concurrent state rendering |
| `react-dom` | `^18.2.0` | MIT | DOM-specific rendering adapter for React |
| `tailwindcss` | `^3.4.1` | MIT | Utility-first CSS engine with CIT dark-mode tokens and slate palette |
| `lucide-react` | `^0.359.0` | ISC | Accessible SVG iconography for campus dashboard, navigation, and badges |
| `clsx` | `^2.1.0` | MIT | Utility for constructing conditional className strings |
| `tailwind-merge` | `^2.2.2` | MIT | Intelligent utility for resolving conflicting Tailwind CSS classes |
| `typescript` | `^5.4.3` | Apache-2.0 | Static typing system ensuring zero runtime type errors |
| `postcss` / `autoprefixer` | `^8.4.38` / `^10.4.19` | MIT / Apache-2.0 | CSS post-processing and vendor prefixing pipeline |

---

## 3. External Datasets & Ground Truth Data
- **Dataset**: `data/cit_public.json`
  - Synthetic yet highly realistic institutional dataset modeled on Indian engineering campus constraints (7 departments, 18 rooms, 32 faculty, 14 student groups, 2 lunch windows).
- **Embedded NoSQL Fallback**: `backend/data/mongo_fallback.json`
  - In-memory/filesystem fallback document collection for campus buildings, navigation nodes, check-in records, green metrics, and equipment inventories, guaranteeing zero external cloud downtime.

---

## 4. Fresh Codebase & Originality Attestation
All timetable solver models, minimal-displacement disruption resolvers, pure-Python hard constraint validators, dual-engine database bridges, Next.js page components, and interactive navigation maps were designed and authored specifically for this challenge. No pre-existing hackathon repositories, closed-source commercial templates, or unlicensed codebases were utilized.

