# 🛡️ Sentinel Shield

**AI-powered cybersecurity intelligence platform** — real-time threat detection, anonymous reporting, fact-checking, QR scanning, and a full admin SOC dashboard.

---

## 🚀 Features

### 👤 User Panel (`/viewer`)
| Feature | Description |
|---|---|
| 📊 **Live Dashboard** | Real-time threat score, scan history, alert feed & trend charts |
| 🔍 **Threat Scanner** | URL/text scan with AI-powered phishing & malware detection |
| 📷 **QR Scanner** | Upload QR code images — decoded and scanned for malicious links |
| 🧠 **Fact Checker** | AI-backed claim verification with credibility scores |
| 🕵️ **Anonymous Reporting** | Submit reports with zero identity storage — PII auto-redacted |
| 🔒 **Privacy & Data** | Data audit logs, toggle preferences, language settings, account deletion |
| 📄 **Reports** | One-click PDF & CSV exports (Activity, Threat Intelligence, Compliance) |
| 👤 **Profile** | Edit name/avatar, change password, toggle MFA & notification preferences |

### 🔴 Admin Panel (`/admin`)
| Section | Description |
|---|---|
| 📡 **Command Center** | Org-wide threat metrics, live alert feed, composite risk profiles |
| 👥 **User Control** | View all users, activity stats, search, filter, export CSV |
| ⚙️ **Rule Engine** | Create/manage detection rules with regex patterns and severity |
| 🤖 **AI Performance** | False positive/negative rates, model accuracy, category breakdown |
| 🖥️ **System Health** | DB ping, memory, CPU, uptime and self-healing triggers |
| 🔒 **Privacy & Reports** | View all anonymous reports, filter by status, update triage status |
| 📅 **Threat Triage** | AI-explained alerts with accept/escalate/dismiss workflow |
| 📜 **Incident Timeline** | Full event chain view for selected security alerts |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Database** | MongoDB (Mongoose) |
| **Auth** | JWT (HTTP-only cookies + Bearer tokens), bcrypt |
| **AI** | Google Gemini API (`@google/generative-ai`) |
| **NLP** | `natural` (tokenization, sentiment) |
| **UI** | Framer Motion, Recharts, Lucide React, Radix UI |
| **Reports** | jsPDF, PapaParse |
| **QR** | jsQR, qrcode |
| **MFA** | Speakeasy (TOTP) |
| **Email** | Nodemailer |
| **Styling** | Vanilla CSS + TailwindCSS v4 |

---

## ⚙️ Getting Started

### 1. Clone & Install
```bash
git clone <repo-url>
cd sentinel-shield
npm install
```

### 2. Environment Variables
Create `.env.local` in the project root:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/sentinel
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_google_gemini_api_key
ADMIN_REGISTRATION_KEY=your_admin_secret_key
NEXTAUTH_URL=http://localhost:3000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

### 3. Seed Admin Account
```bash
node scripts/seed-admin.js
```

### 4. Run Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🔐 Roles & Access

| Role | Access |
|---|---|
| `viewer` | User dashboard, scanner, fact-checker, anonymous reporting, privacy settings |
| `moderator` | Viewer access + alert triage workspace |
| `admin` | Full access including user management, rule engine, AI metrics, anonymous reports |

---

## 📂 Project Structure

```
sentinel-shield/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/                # Auth page (user + admin)
│   ├── viewer/               # User panel
│   ├── admin/                # Admin SOC dashboard
│   ├── moderator/            # Moderator triage panel
│   └── api/                  # All API routes
│       ├── auth/             # Login, signup, logout, MFA, profile
│       ├── reports/anonymous # Anonymous report submission & management
│       ├── dashboard/        # Stats, AI performance, system health
│       ├── alerts/           # Alert feed & timeline
│       ├── scan/             # Threat scanner
│       ├── fact-check/       # AI fact-checking
│       ├── qr-scan/          # QR code analysis
│       ├── rules/            # Detection rule CRUD
│       └── users/            # User management
├── models/                   # Mongoose schemas
│   ├── User.ts
│   ├── Alert.ts
│   ├── AnonymousReport.ts
│   ├── AuditLog.ts
│   ├── Rule.ts
│   └── Threat.ts
├── lib/                      # Utilities
│   ├── db.ts                 # MongoDB connection
│   ├── jwt.ts                # Token helpers
│   └── auth-helpers.ts       # requireAuth middleware
├── contexts/                 # React context (AuthContext)
├── extensions/               # Browser extension
└── scripts/                  # Seed & fix scripts
```

---

## 🛡️ Anonymous Reporting — How It Works

1. User submits a report (category, description, urgency, optional evidence URL)
2. Server generates a random `RPT-XXXXXX` ID — **no user ID, IP, or email is stored**
3. Description is auto-sanitized to remove emails, phone numbers, and SSNs
4. Admin can review, update status, and take action from the **Privacy & Reports** panel
5. Reporter receives a reference ID for tracking — their identity remains fully hidden

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login (user or admin) |
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/scan` | Scan URL or text for threats |
| `POST` | `/api/fact-check` | AI fact verification |
| `POST` | `/api/qr-scan` | Decode & scan QR code |
| `POST` | `/api/reports/anonymous` | Submit anonymous report |
| `GET` | `/api/reports/anonymous` | Fetch all reports (admin) |
| `PATCH` | `/api/reports/anonymous` | Update report status (admin) |
| `GET` | `/api/dashboard/stats` | Platform threat statistics |
| `GET` | `/api/alerts` | Alert feed |
| `GET` | `/api/alerts/live` | Real-time live alert stream |
| `GET` | `/api/dashboard/ai-performance` | AI model accuracy metrics |
| `GET` | `/api/dashboard/system-health` | System uptime & health |
| `GET/POST/DELETE` | `/api/rules` | Detection rule management |
| `GET` | `/api/users` | All users (admin) |
| `GET` | `/api/admin/user-activity` | User activity analytics |

---

## 🔒 Security Highlights

- JWT tokens stored as HTTP-only cookies + `localStorage` fallback
- Passwords hashed with **bcrypt** (12 rounds)
- Role-based access control on every protected API route
- Anonymous reports are **cryptographically de-identified** — no PII linkage possible
- MFA via **TOTP** (compatible with Google Authenticator)
- Self-healing system triggers via `/api/self-healing`
- PII auto-redaction (email, phone, SSN) on anonymous report descriptions

---

## 📝 License

MIT — Built for the Einstein Hackathon 2026.
