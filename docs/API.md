# API Documentation

Base URL:

```text
http://localhost:5000/api
```

Hosted deployments should use the Render backend URL, for example:

```text
https://your-service.onrender.com/api
```

## Response Shape

Most endpoints return:

```json
{
  "status": "success",
  "data": {}
}
```

Global search currently returns:

```json
{
  "success": true,
  "results": {}
}
```

Errors return safe JSON:

```json
{
  "status": "fail",
  "message": "Validation message.",
  "requestId": "req_..."
}
```

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

Refresh tokens are sent as HTTP cookies.

### Register

`POST /auth/register`

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "Password123!"
}
```

Response:

```json
{
  "status": "success",
  "message": "Account created successfully",
  "data": {
    "user": {
      "_id": "665f...",
      "name": "Ada Lovelace",
      "email": "ada@example.com",
      "credits": 10,
      "role": "user",
      "profilePicture": ""
    },
    "accessToken": "<jwt>"
  }
}
```

Validation:

- `name`: 2-50 characters.
- `email`: valid email.
- `password`: at least 6 characters.

### Login

`POST /auth/login`

```json
{
  "email": "ada@example.com",
  "password": "Password123!"
}
```

Invalid credentials:

```json
{
  "status": "fail",
  "message": "Incorrect email or password."
}
```

### Refresh Token

`POST /auth/refresh`

Uses refresh cookie. Returns a new access token and rotates the refresh token.

### Logout

`POST /auth/logout`

Protected. Clears the stored refresh token and refresh cookie.

## Users

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/users/profile` | Yes | Current user profile |
| `PUT` | `/users/profile` | Yes | Update profile fields |
| `POST` | `/users/profile/avatar` | Yes | Upload profile image |
| `GET` | `/users/:id` | No | Public profile |

Update example:

```json
{
  "name": "Ada",
  "bio": "I teach practical programming.",
  "skillsWanted": ["Design", "Public Speaking"]
}
```

## Sessions

### Create Session

`POST /sessions`

Protected.

```json
{
  "title": "Modern JavaScript Mentoring",
  "description": "A practical session for intermediate learners.",
  "skillCategory": "Programming",
  "date": "2026-06-01T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "creditsRequired": 3,
  "maxParticipants": 1,
  "tags": ["javascript", "testing"]
}
```

Validation:

- Date/time must be in the future.
- `endTime` must be after `startTime`.
- Duration must be 15 minutes to 8 hours.
- `creditsRequired`: 1-100.
- `skillCategory`: one of the configured skill categories.

### List Sessions

`GET /sessions?status=open&page=1&limit=10&search=react`

Public.

### Request/Respond Legacy Session Flow

These routes support the original join-request credit transfer flow:

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/sessions/:id/request` | Yes | Learner requests to join |
| `POST` | `/sessions/:id/respond` | Yes | Host accepts or rejects |
| `PATCH` | `/sessions/:id/complete` | Yes | Host marks session complete |

New booking escrow flows should use `/bookings`.

## Bookings and Escrow

Booking routes are protected.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/bookings` | Create pending booking and reserve credits |
| `GET` | `/bookings/me` | Current user's learner and mentor bookings |
| `GET` | `/bookings/:id` | Booking details for participant |
| `PATCH` | `/bookings/:id/accept` | Mentor accepts and attaches Jitsi link |
| `PATCH` | `/bookings/:id/reject` | Mentor rejects and refunds escrow |
| `PATCH` | `/bookings/:id/complete` | Mentor completes and releases escrow |
| `PATCH` | `/bookings/:id/cancel` | Learner or mentor cancels and refunds escrow |

Create booking:

```json
{
  "sessionId": "665f..."
}
```

Success:

```json
{
  "status": "success",
  "message": "Booking requested. Credits are reserved in escrow.",
  "data": {
    "booking": {
      "_id": "665f...",
      "status": "pending",
      "creditsReserved": 3
    }
  }
}
```

Important error cases:

```json
{
  "status": "fail",
  "message": "You cannot book your own session."
}
```

```json
{
  "status": "fail",
  "message": "Insufficient credits to reserve this booking."
}
```

```json
{
  "status": "fail",
  "message": "You already have an active booking for this session."
}
```

Escrow guarantees:

- Credits are deducted only inside the booking transaction.
- Release/refund writes are inside MongoDB transactions.
- Duplicate active bookings are guarded by a partial unique index.
- Repeated accept, complete, reject, and cancel operations are idempotent where the service supports it.

## Credits

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/credits` | Yes | Current credit balance |
| `GET` | `/credits/transactions` | Yes | Paginated ledger history |

Ledger types:

- `spend`
- `earn`
- `bonus`
- `refund`

## Reviews

### Create Review

`POST /reviews`

Protected.

```json
{
  "sessionId": "665f...",
  "rating": 5,
  "feedback": "Clear, practical, and helpful."
}
```

Rules:

- Session must be completed.
- Reviewer must be the learner from a completed booking.
- Mentor cannot review themselves.
- One review per reviewer/session.

### Get User Reviews

`GET /reviews/user/:userId?page=1&limit=10`

Public.

## Search

`GET /search?q=react`

Public.

Response:

```json
{
  "success": true,
  "results": {
    "sessions": [],
    "mentors": [],
    "skills": []
  }
}
```

Validation:

- `q` is normalized and trimmed.
- Maximum query length is 60 characters.
- Terms shorter than 2 characters return empty results.
- Regex metacharacters are escaped before MongoDB regex queries.

## Notifications

All notification routes are protected.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/notifications?page=1&limit=20&unreadOnly=false` | Paginated notifications |
| `GET` | `/notifications/unread-count` | Unread count |
| `PATCH` | `/notifications/:id/read` | Mark one notification as read |
| `PATCH` | `/notifications/read-all` | Mark all as read |

Notifications are owner-scoped. A user cannot read or mutate another user's notifications.

## Community

All community routes are protected.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/community/posts` | List posts |
| `POST` | `/community/posts` | Create post |
| `GET` | `/community/posts/:postId/comments` | List comments |
| `POST` | `/community/posts/:postId/comments` | Create comment |
| `PATCH` | `/community/posts/:id/vote` | Toggle post vote |
| `PATCH` | `/community/comments/:id/vote` | Toggle comment vote |
| `PATCH` | `/community/posts/:postId/solution/:commentId` | Mark accepted solution |
| `DELETE` | `/community/posts/:id` | Delete own post |
| `DELETE` | `/community/comments/:id` | Delete own comment |

## Analytics and Portfolio Modules

Protected:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/analytics/dashboard` | Dashboard summary |
| `GET` | `/activity` | Activity feed |
| `GET` | `/profile-completion` | Profile completion state |
| `GET` | `/projects` | Project resources |
| `POST` | `/projects` | Create project resource |
| `PATCH` | `/projects/:id` | Update project resource |
| `DELETE` | `/projects/:id` | Delete project resource |
| `GET` | `/resumes` | Resume records |
| `POST` | `/resumes` | Create resume record |
| `GET` | `/recommendations` | Recommendations |
| `POST` | `/recommendations` | Create recommendation |
| `PATCH` | `/recommendations/:id` | Update recommendation |

## Mentor Applications, Assignments, and Referrals

Current implementation status:

- Mentor application, assignments, and referral pages exist in the frontend as portfolio/demo workflows.
- The backend has notification types and user roles that support these domains, but dedicated REST resources for mentor applications, assignments, and referrals are not present in the current codebase.
- Productionizing these flows should add dedicated models, validators, routes, controllers, services, and integration tests before claiming backend persistence.

This is intentionally documented as a known limitation rather than inventing API contracts that do not exist.
