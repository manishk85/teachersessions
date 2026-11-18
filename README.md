# Session Booking API

Backend for a platform where users book sessions with teachers. Teachers create sessions, users book them, and once a session is completed it shows up in the user's history.

Built with Node.js, TypeScript, Express, MongoDB and Mongoose.

## Setup

1. Install Node.js (v18 or above) and have MongoDB running locally (or use a MongoDB Atlas url).

2. Install packages

```
npm install
```

3. Create a `.env` file in the root folder (you can copy `.env.example`)

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/session_booking
```

4. Run in dev mode

```
npm run dev
```

Or build and run

```
npm run build
npm start
```

Server starts on `http://localhost:5000`.

## Folder structure

```
src/
  index.ts                 - app setup, db connection, server start
  models/                  - User, Teacher, Session mongoose models
  routes/                  - userRoutes, teacherRoutes, sessionRoutes
  middleware/errorHandler  - central error handler
  utils/AppError           - custom error class with status code
```

## APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /users | Create user (email must be unique) |
| POST | /teachers | Create teacher (extra api, needed to create sessions) |
| POST | /sessions | Create session for a teacher, status defaults to AVAILABLE |
| GET | /sessions/available?dateTimestamp={timestamp} | All AVAILABLE sessions of that date (aggregation pipeline) |
| POST | /sessions/:id/book | Book a session, body: `{ "userId": "..." }` |
| PATCH | /sessions/:id/complete | Mark a BOOKED session as COMPLETED |
| GET | /users/:id/sessions | User's upcoming and completed sessions (aggregation pipeline) |

### Sample bodies

POST /users
```json
{ "fullName": "Rahul Sharma", "email": "rahul@example.com", "phone": "9876543210" }
```

POST /teachers
```json
{ "fullName": "Anita Verma", "email": "anita@example.com", "specialization": "Mathematics", "experience": 5 }
```

POST /sessions
```json
{ "teacherId": "<teacher id>", "startTime": "2026-11-20T10:00:00.000Z", "endTime": "2026-11-20T11:00:00.000Z" }
```

POST /sessions/:id/book
```json
{ "userId": "<user id>" }
```

## Notes

- `dateTimestamp` is a unix timestamp in milliseconds (seconds also works). The whole day (UTC) of that timestamp is used to filter sessions.
- Upcoming sessions = sessions with status BOOKED, completed sessions = status COMPLETED.
- Booking uses `findOneAndUpdate` with `status: "AVAILABLE"` in the filter, so if two users try to book the same session at the same time only one of them gets it.
- All errors go through `middleware/errorHandler.ts` and come back as `{ "success": false, "message": "..." }`.

Status codes used: 200, 201, 400 (bad input / wrong session status), 404 (not found), 409 (duplicate email / already booked), 500.

## Postman

Import `Session-Booking-API.postman_collection.json` into Postman. The requests save the created user, teacher and session ids into collection variables, so you can just run them top to bottom.
