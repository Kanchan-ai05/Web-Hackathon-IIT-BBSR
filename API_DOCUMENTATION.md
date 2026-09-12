# 📜 Guild Quest API Documentation

Comprehensive RESTful API reference for the **Life RPG** backend platform.

---

## Base URLs
- **Local Development**: `http://localhost:5000/api`
- **Production (Render)**: `https://life-rpg-server.onrender.com/api`

---

## Authentication & Headers
Protected endpoints require a JSON Web Token (JWT) provided in the `Authorization` HTTP header:
```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## Status Codes & Error Handling
All error responses adhere to standard RFC-compliant HTTP status codes with a consistent JSON envelope:

```json
{
  "success": false,
  "message": "Human-readable description of what went wrong"
}
```

| HTTP Code | Description | Example Condition |
|:---|:---|:---|
| `200 OK` | Request succeeded | Quests fetched, item equipped, profile updated |
| `201 Created` | Resource created | New Hero registered, new quest inscribed |
| `400 Bad Request` | Invalid input syntax | Empty quest title, invalid 24-character ObjectId |
| `401 Unauthorized` | Missing / invalid token | Expired session, bad JWT signature |
| `403 Forbidden` | Access prohibited | Modifying another hero's quest or inventory |
| `404 Not Found` | Resource not found | Quest or shop item does not exist |
| `409 Conflict` | Unique constraint conflict | Email or username already inscribed |
| `429 Too Many Requests`| Rate limit exceeded | >300 general requests / 15 min or >25 auth attempts / 15 min |
| `503 Service Unavailable`| Database unavailable | MongoDB connection dropped / reconnecting |
| `500 Server Error` | Unexpected error | Unhandled runtime exception |

---

## 🛡️ Health & Readiness

### `GET /health`
Checks server readiness and MongoDB connection state.
- **Access**: Public
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-09-12T21:00:00.000Z",
  "uptime": 1245.52
}
```

---

## 👤 Authentication Endpoints (`/auth`)

### `POST /auth/register`
Inscribes a new Hero into the Guild records.
- **Access**: Public
- **Rate Limit**: 25 requests / 15 minutes
- **Request Body**:
```json
{
  "username": "DragonSlayer",
  "email": "hero@realm.com",
  "password": "StrongPassword123!",
  "heroClass": "Warrior" 
}
```
> Supported `heroClass` values: `Warrior`, `Mage`, `Rogue`, `Paladin`.

- **Success Response**: `201 Created`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "_id": "67d26b8e2689551c6b12a001",
    "username": "DragonSlayer",
    "email": "hero@realm.com",
    "heroClass": "Warrior",
    "level": 1,
    "xp": 0,
    "maxXp": 100,
    "gold": 50,
    "stats": {
      "strength": 12,
      "intellect": 10,
      "discipline": 10,
      "creativity": 10
    },
    "streak": 0,
    "longestStreak": 0,
    "equippedTheme": "dark-fantasy"
  }
}
```

### `POST /auth/login`
Authenticates an existing Hero and returns a Guild pass (JWT).
- **Access**: Public
- **Rate Limit**: 25 requests / 15 minutes
- **Request Body**:
```json
{
  "email": "hero@realm.com",
  "password": "StrongPassword123!"
}
```
- **Success Response**: `200 OK`

### `GET /auth/me`
Retrieves currently authenticated Hero profile.
- **Access**: Authenticated (Bearer Token)
- **Success Response**: `200 OK`

### `PATCH /auth/profile`
Updates Hero cosmetics (e.g. active title, equipped theme).
- **Access**: Authenticated
- **Request Body**:
```json
{
  "title": "Grandmaster Achiever",
  "equippedTheme": "castle-theme"
}
```
- **Success Response**: `200 OK`

---

## ⚔️ Quest System Endpoints (`/quests`)

### `GET /quests`
Retrieves the logged-in Hero's quest log with filtering and search.
- **Access**: Authenticated
- **Query Parameters**:
  - `type`: `all` | `daily` | `todo` | `boss`
  - `completed`: `true` | `false`
  - `difficulty`: `trivial` | `easy` | `medium` | `hard` | `epic`
  - `category`: `Gym` | `Coding` | `Study` | `Art`
  - `search`: String query matching title or description
- **Success Response**: `200 OK`
```json
{
  "success": true,
  "count": 3,
  "quests": [
    {
      "_id": "67d26b8e2689551c6b12a002",
      "title": "Build Vite Chunk Splitting",
      "category": "Coding",
      "difficulty": "hard",
      "questType": "todo",
      "xpReward": 150,
      "goldReward": 90,
      "completed": false,
      "streak": 0
    }
  ]
}
```

### `POST /quests`
Forges a new quest.
- **Access**: Authenticated
- **Request Body**:
```json
{
  "title": "Master LeetCode Graphs",
  "category": "Coding",
  "difficulty": "hard",
  "questType": "todo",
  "description": "Solve 3 Dijkstra graph problems."
}
```
- **Success Response**: `201 Created`

### `POST /quests/:id/complete`
Completes a quest, applies non-linear XP, updates daily streaks, and awards stats.
- **Access**: Authenticated
- **Success Response**: `200 OK`
```json
{
  "success": true,
  "message": "Quest completed! Rewards bestowed upon your hero.",
  "user": { ... },
  "levelUpData": {
    "leveledUp": true,
    "newLevel": 2,
    "xp": 50,
    "maxXp": 282,
    "gold": 175,
    "bonusGold": 50,
    "stats": { "strength": 11, "intellect": 14, "discipline": 11, "creativity": 11 }
  }
}
```

### `PATCH /quests/:id`
Amends an existing quest title, category, difficulty, or notes.
- **Access**: Authenticated (Owner only)

### `DELETE /quests/:id`
Dismisses a quest from the Hero log.
- **Access**: Authenticated (Owner only)
- **Success Response**: `200 OK`

### `PATCH /quests/:id/subtasks/:subtaskId`
Strikes a boss raid subtask, inflicting damage on the boss's HP bar.
- **Access**: Authenticated (Owner only)

---

## 🛒 Virtual Economy & Armory (`/shop`)

### `GET /shop/items`
Returns all purchaseable items, themes, pets, and badges.
- **Access**: Authenticated
- **Success Response**: `200 OK`

### `POST /shop/purchase`
Deducts gold, equips perks, and saves items in MongoDB `Inventory`.
- **Access**: Authenticated
- **Request Body**:
```json
{
  "itemId": "67d26b8e2689551c6b12a010"
}
```
- **Success Response**: `200 OK`

### `GET /shop/inventory`
Lists all items currently held in the Hero's satchel.
- **Access**: Authenticated

### `POST /shop/inventory/:id/equip`
Toggles equipping of gear, companion pets, badges, or realm themes.
- **Access**: Authenticated

---

## 📊 Analytics & Hall of Fame (`/stats`)

### `GET /stats/overview`
Aggregated campaign completion count, active quest count, and streak health.

### `GET /stats/leaderboard`
Top 20 Heroes across the realm ranked by Level, Gold, and Streaks.
- **Access**: Authenticated
