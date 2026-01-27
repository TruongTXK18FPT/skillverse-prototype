# API Reference

Các API endpoints đã test trong quá trình review.

---

## Authentication

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/auth/login` | POST | ✅ Working | Returns JWT token |
| `/api/auth/register` | POST | ✅ Working | |
| `/api/auth/logout` | POST | ✅ Working | |
| `/api/auth/me` | GET | ✅ Working | Current user info |

---

## Wallet

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/wallet/me` | GET | ✅ Working | Balance info |
| `/api/transactions/me` | GET | ✅ Working | Transaction history |
| `/api/wallet/deposit` | POST | ✅ Working | VNPay integration |
| `/api/wallet/buy-coin` | POST | ✅ Working | |

**Sample Response - `/api/wallet/me`:**
```json
{
  "walletId": 6,
  "userId": 6,
  "cashBalance": 261000,
  "coinBalance": 5910,
  "status": "ACTIVE"
}
```

---

## Portfolio

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/portfolio/me` | GET | ✅ Working | Profile data |
| `/api/portfolio/experiences` | GET/POST/PUT/DELETE | ✅ Working | CRUD |
| `/api/portfolio/projects` | GET/POST/PUT/DELETE | ✅ Working | CRUD |
| `/api/portfolio/generate-cv` | POST | ✅ Working | PDF generation |

**⚠️ Issue - `/api/portfolio/me`:**
```json
{
  "topSkills": "[]",        // ❌ Should be array []
  "languagesSpoken": "[]"   // ❌ Should be array []
}
```

---

## Task Board / Study Planner

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/task-board/summary` | GET | ✅ Working | Columns + Tasks |
| `/api/task-board/tasks` | POST | ✅ Working | Create task |
| `/api/task-board/tasks/:id` | PUT/DELETE | ✅ Working | Update/Delete |

**⚠️ Issue - UTF-8 Encoding:**
```json
{
  "title": "H\\u1ecdc v\\u1ec1 Git Basics"  // Should be "Học về Git Basics"
}
```

---

## Roadmap

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/roadmaps/me` | GET | ✅ Working | User's roadmaps |
| `/api/roadmaps/:id` | GET | ✅ Working | Detail |
| `/api/roadmaps/generate` | POST | ✅ Working | AI generation |

**⚠️ Issue - UTF-8 Encoding:**
```json
{
  "title": "L\\u00e0m Game..."  // Should be "Làm Game..."
}
```

---

## Notifications

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/notifications/me` | GET | ✅ Working | All notifications |
| `/api/notifications/:id/read` | PUT | ✅ Working | Mark as read |
| `/api/notifications/read-all` | PUT | ✅ Working | Mark all read |

---

## Bookings

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/bookings/me` | GET | ❌ 500 Error | **Backend issue** |
| `/api/bookings` | POST | Untested | |
| `/api/bookings/:id/cancel` | PUT | Untested | |

---

## Career Chat

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/career-chat/send` | POST | ✅ Working | Streaming response |
| `/api/career-chat/sessions` | GET | ❌ 500 Error | **Backend issue** |
| `/api/career-chat/sessions/:id` | DELETE | Untested | |

---

## Mentors

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/mentors` | GET | ✅ Working | List mentors |
| `/api/mentors/:id` | GET | ✅ Working | Detail |
| `/api/mentors/:id/availability` | GET | ✅ Working | Time slots |

---

## Common Response Patterns

### Success
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Pagination
```json
{
  "items": [...],
  "page": 1,
  "pageSize": 10,
  "totalItems": 100,
  "totalPages": 10
}
```

---

## Backend Issues to Fix

1. **`/api/bookings/me`** - Returns 500
2. **`/api/career-chat/sessions`** - Returns 500
3. **UTF-8 Encoding** - Task titles, Roadmap titles
4. **JSON Serialization** - topSkills, languagesSpoken as strings
