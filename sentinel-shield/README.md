# SentinelShield AI

A privacy-first, AI-powered B2B SaaS platform for enterprise threat intelligence.

## Features Built
- **Next.js 14 App Router** Frontend & API Routes
- **Pure Next.js Architecture** with 3-second short polling for live alert feeds
- **Python AIML Microservice** for Threat Detection (`aiml/main.py`)
- **MongoDB** Database Integration with Anonymization pipeline
- **Role-Based Access Control** (Admin, Moderator, Viewer)

---

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env.local` file in the root based on your MongoDB and email settings:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=super_secret_jwt_key
NEXTAUTH_SECRET=super_secret_auth_key
PORT=3000
```

### 2. Database Seeding
To create the first Admin user (`admin@sentinelshield.ai`, `Admin@12345!`), run:
```bash
npx ts-node scripts/seed.ts
```

### 3. Launching the Platform

The easiest way to start both the Next.js Main App and the Python AI Engine simultaneously is to use the included batch script.

In your terminal, simply run:
```bash
.\run.bat
```

This will automatically open two new command prompt windows—one hosting your web app on `http://localhost:3000` and the other hosting your advanced threat-scoring API on `http://localhost:8000`.

---
## Tech Stack
- Frontend: Next.js 14, React, Tailwind CSS, Framer Motion, Recharts
- Backend: Node.js, Socket.io, Mongoose
- Security: Speakeasy (TOTP MFA), Bcrypt, JWT, Helmet
- AI/ML: Python, FastAPI, Scikit-learn, Transformers
