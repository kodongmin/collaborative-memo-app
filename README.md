# Collaborative Memo Application

A real-time collaborative memo application built with Node.js, Express, Socket.IO, and PostgreSQL.

## Features

- User authentication (register/login)
- Create, read, update, and delete memos
- Real-time collaboration on memos
- Share memos with other users
- Version history tracking
- Secure API with JWT authentication

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd collaborative-memo-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database and run the schema:
```bash
psql -U postgres
CREATE DATABASE memo_db;
\c memo_db
\i database.sql
```

4. Create a .env file in the root directory with the following content:
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=memo_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
```

5. Start the server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Memos
- GET /api/memos - Get all memos for authenticated user
- GET /api/memos/:id - Get specific memo
- POST /api/memos - Create new memo
- PUT /api/memos/:id - Update memo
- DELETE /api/memos/:id - Delete memo
- POST /api/memos/:id/share - Share memo with another user

## WebSocket Events

- `join-memo` - Join a memo room for real-time updates
- `memo-update` - Send/receive memo updates
- `disconnect` - Handle client disconnection

## Security

- Password hashing with bcrypt
- JWT authentication
- CORS enabled
- Input validation
- SQL injection prevention with parameterized queries

## Error Handling

The application includes comprehensive error handling for:
- Database errors
- Authentication errors
- Input validation errors
- Not found errors
- Server errors

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 