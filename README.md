# Team Task Manager

A full-stack collaborative task management web application built with Node.js, Express, Prisma, PostgreSQL, React, and Tailwind CSS.

## Features

- **User Authentication** – Signup/login with JWT-based sessions
- **Project Management** – Create projects, add/remove members with Admin/Member roles
- **Task Management** – Create tasks with title, description, due date, priority; assign to members; track status (To Do / In Progress / Done)
- **Dashboard** – Total tasks, tasks by status, tasks per user, overdue task count
- **Role-Based Access** – Admins manage everything; Members can only view and update their assigned tasks

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS      |
| Backend   | Node.js, Express.js               |
| Database  | PostgreSQL + Prisma ORM           |
| Auth      | JWT (jsonwebtoken) + bcryptjs     |
| Deploy    | Railway                           |

---

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or use Railway DB)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd team-task-manager
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL connection string and a JWT secret
npm install
npx prisma migrate deploy    # or: npx prisma db push (for first-time setup)
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` — proxies `/api` requests to the backend automatically.

---

## Environment Variables

### Backend (`backend/.env`)

```
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="your-strong-random-secret"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env`)  *(production only)*

```
VITE_API_URL="https://your-railway-backend-url/api"
```

---

## Deployment on Railway

### Step 1 – Create a Railway project

1. Go to [railway.app](https://railway.app) and create a new project
2. Add a **PostgreSQL** plugin — Railway auto-sets `DATABASE_URL`

### Step 2 – Deploy the Backend

1. Add a new **service** from your GitHub repo
2. Set the **root directory** to `backend`
3. Set **start command**: `node src/server.js`
4. Add environment variables:
   - `JWT_SECRET` – a long random string
   - `NODE_ENV` – `production`
   - `FRONTEND_URL` – your deployed frontend URL (or `*` for all)
5. Railway runs `npm install` and starts the server automatically

### Step 3 – Run Database Migrations

In the Railway service shell or via the CLI:

```bash
npx prisma migrate deploy
```

Or use `db push` for a quick schema sync:

```bash
npx prisma db push
```

### Step 4 – Deploy the Frontend

Option A — **Separate Railway service** (recommended):

1. Add another service from the same repo
2. Set root directory to `frontend`
3. Add build command: `npm run build`
4. Add start command: `npx serve dist -p $PORT`
5. Set env var `VITE_API_URL` to your backend Railway URL + `/api`

Option B — **Serve frontend from backend** (single service):

Build the frontend first and place the `dist/` output inside `backend/`:

```bash
cd frontend && npm run build
```

The backend already serves `frontend/dist` in production mode via `express.static`.

---

## API Reference

### Auth

| Method | Endpoint         | Description        | Auth |
|--------|------------------|--------------------|------|
| POST   | /api/auth/signup | Register user      | No   |
| POST   | /api/auth/login  | Login              | No   |
| GET    | /api/auth/me     | Get current user   | Yes  |

### Projects

| Method | Endpoint                        | Description          | Role   |
|--------|---------------------------------|----------------------|--------|
| GET    | /api/projects                   | List user's projects | Member |
| POST   | /api/projects                   | Create project       | Any    |
| GET    | /api/projects/:id               | Get project          | Member |
| PUT    | /api/projects/:id               | Update project       | Admin  |
| DELETE | /api/projects/:id               | Delete project       | Admin  |
| GET    | /api/projects/:id/members       | List members         | Member |
| POST   | /api/projects/:id/members       | Add member           | Admin  |
| DELETE | /api/projects/:id/members/:uid  | Remove member        | Admin  |

### Tasks

| Method | Endpoint                     | Description           | Role              |
|--------|------------------------------|-----------------------|-------------------|
| GET    | /api/tasks/my-tasks          | My assigned tasks     | Member            |
| GET    | /api/tasks/project/:pid      | Project tasks         | Member            |
| POST   | /api/tasks/project/:pid      | Create task           | Admin             |
| GET    | /api/tasks/:id               | Get task              | Member            |
| PUT    | /api/tasks/:id               | Update task           | Admin or Assignee |
| DELETE | /api/tasks/:id               | Delete task           | Admin             |

### Dashboard

| Method | Endpoint        | Description        |
|--------|-----------------|--------------------|
| GET    | /api/dashboard  | Get stats overview |

---

## Database Schema

```
User          – id, name, email, password, createdAt
Project       – id, name, description, createdBy, createdAt
ProjectMember – id, projectId, userId, role (ADMIN|MEMBER), joinedAt
Task          – id, title, description, dueDate, priority, status, projectId, assignedTo, createdBy, createdAt
```

---

## Project Structure

```
team-task-manager/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── controllers/    # auth, project, task, dashboard
│   │   ├── middleware/     # JWT auth
│   │   ├── routes/         # Express routers
│   │   ├── lib/prisma.js   # Prisma client singleton
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # Layout, TaskCard, Modal
    │   ├── context/        # AuthContext
    │   ├── pages/          # Dashboard, Projects, ProjectDetail, MyTasks, Login, Signup
    │   ├── services/api.js # Axios API client
    │   └── App.jsx
    └── package.json
```
