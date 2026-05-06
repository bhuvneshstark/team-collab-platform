# TeamCollab – Real-Time Team Collaboration Platform

A full‑stack, real‑time collaboration platform that lets teams manage projects, track tasks with a drag‑and‑drop Kanban board, communicate via live team chat, and control tasks using a natural language assistant. Role‑based access (Admin, Manager, Member) is enforced throughout.

---

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | React, TypeScript, Tailwind CSS, Shadcn/ui, Vite |
| Backend  | Node.js, Express, Socket.IO       |
| Database | MongoDB (Mongoose) via MongoDB Atlas |
| Auth     | Firebase Authentication           |
| Real‑Time| Socket.IO                          |
| Validation| Joi                               |
| Deploy   | Vercel (frontend), Render (backend) |

---

## Features

- 🔐 **Firebase Authentication** – Email/password sign‑up & login
- 👥 **Role‑Based Access Control** – Admin, Manager, Member with UI & API enforcement
- 📁 **Project Management** – Create, edit, delete projects (role‑based)
- 📋 **Kanban Task Board** – Drag‑and‑drop between Todo, In Progress, Done
- 🧠 **Natural Language Assistant** – Manage tasks with commands like “create task …” or “assign …”
- 💬 **Real‑Time Team Chat** – Socket.IO live messaging across the team
- 📊 **Dashboard** – Project/task/member stats, progress bars, recent tasks
- 👤 **Team Overview** – Member list, roles, activity log
- 🌙 **Dark Mode**
- 📱 **Responsive Design**

---

## Live Demo

- **Frontend**: [https://team-collab-platform-le7y.vercel.app](https://team-collab-platform-le7y.vercel.app)
- **Backend API**: [https://team-collab-api-hvrn.onrender.com](https://team-collab-api-hvrn.onrender.com)

---

## Demo Accounts

| Role    | Email               | Password      |
|---------|---------------------|---------------|
| Admin   | admin@demo.com      | password123   |
| Manager | manager@demo.com    | password123   |
| Member  | member@demo.com     | password123   |

*The first user that signs up becomes the Admin and can create a team. Use the demo accounts above to see role‑based differences.*

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm
- MongoDB Atlas account
- Firebase project with Authentication (Email/Password enabled)

### 1. Clone the Repository
```bash
git clone https://github.com/bhuvneshstark/team-collab-platform.git

cd team-collab-platform

2. Backend Setup
bash
cd server
npm install
Create a .env file with:

text
MONGO_URI=your_mongodb_connection_string
PORT=5000
Also place your Firebase service account JSON file (serviceAccountKey.json) in the server folder.

Start the server:

bash
npm run dev
3. Frontend Setup
bash
cd ../client
npm install
Create src/config/firebase.ts with your Firebase web config:

ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
Start the frontend:

bash
npm run dev
Visit http://localhost:5173.

API Endpoints
Method	Endpoint	Description	Access
GET	/api/projects	Get all team projects	Authenticated
POST	/api/projects	Create project	Admin/Manager
PUT	/api/projects/:id	Update project	Admin/Manager
DELETE	/api/projects/:id	Delete project	Admin
GET	/api/tasks?projectId=	Get tasks for a project	Authenticated
POST	/api/tasks	Create task	Authenticated
PUT	/api/tasks/:id	Update task	Authenticated
DELETE	/api/tasks/:id	Delete task	Admin/Manager
GET	/api/messages	Get team chat messages	Authenticated
POST	/api/messages	Send message (emits via Socket.IO)	Authenticated
POST	/api/assistant	Process NL command	Authenticated
GET	/api/auth/me	Get current user profile	Authenticated
GET	/api/teams/my-team	Get current team	Authenticated
POST	/api/teams/create	Create a new team	Authenticated
PUT	/api/teams/my-team	Update team	Admin
DELETE	/api/teams/my-team	Delete team	Admin
GET	/api/users/team-members	Get team members	Authenticated
GET	/api/dashboard/summary	Dashboard stats	Authenticated
GET	/api/activity	Recent activity log	Authenticated
Extra Features (beyond the brief)
Dashboard with task completion progress bars

Member‑wise task breakdown on the dashboard

Activity log on the Team page

Direct mongodb:// connection fallback for DNS‑restricted networks

Dark mode toggle (persists via class)

CORS configured for production

Project Structure
text
team-collab-platform/
├── server/
│   ├── config/
│   │   ├── db.js
│   │   └── firebase.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── checkRole.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Team.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── messages.js
│   │   ├── teams.js
│   │   ├── users.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── assistant.js
│   │   └── activity.js
│   ├── index.js
│   └── .env
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── TeamSetup.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── TasksPage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   ├── AssistantPage.tsx
│   │   │   └── TeamPage.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useCurrentUser.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── config/
│   │   │   └── firebase.ts
│   │   └── App.tsx
│   └── ...
└── README.md
Evaluation Notes
Real‑time features: chat messages appear instantly via Socket.IO; Kanban updates broadcasted

Role‑based access: Admin/Manager/Member enforced on both UI and API with Joi validation & middleware

Responsive: works on desktop and mobile; dark mode included

Deployed and accessible with demo accounts

Code: modular, well‑structured, typed with TypeScript

Built by Bhuvnesh – submission for the team collaboration platform assignment.
