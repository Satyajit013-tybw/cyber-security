# SentinelShield Tech Stack & Architecture

Here is the detailed breakdown of the exact technologies used to build the SentinelShield prototype, and the specific role each layer plays in the application architecture.

## 1. Frontend Framework
**Technology:** Next.js 14, React 18
- **Role:** The core structural framework for the application. Next.js provides App Router for file-system based routing (`/app` directory), server components for improved performance, and API routes (`/api`) to handle backend logic all within a single unified repository. React handles the component lifecycle and UI state.

## 2. UI Styling & Aesthetics
**Technology:** Inline CSS, CSS Modules (`globals.css`), Framer Motion
- **Role:** Creates the visual identity of the platform.
  - **CSS:** Used for the "glassmorphic" premium design, deep dark-mode colors (e.g., `#0f172a`), complex gradients, and responsive layouts (css grid/flexbox) without relying on huge CSS frameworks like Tailwind.
  - **Framer Motion:** Handles all the smooth animations—page transitions, glowing borders on hover, dynamic pie charts appearing, and the animated incident timelines.

## 3. Icons & Visual Assets
**Technology:** Lucide React
- **Role:** Provides crisp, consistent, and scalable SVG icons across the entire platform. Used heavily in the sidebars, command center stats, threat logs, and the workflow timeline.

## 4. Data Visualization
**Technology:** Recharts
- **Role:** Renders the interactive charts in the Admin Command Center:
  - **Line Charts:** Used for the "Risk Trend Graph" to show threat spikes over a 14-day trailing period.
  - **Bar Charts:** Used for the "Types of Threats Detected" breakdown (Phishing, Malware, Data Exfiltration).
  - **Pie Charts:** Used to show the distribution of threats by severity (Critical, High, Medium, Low).

## 5. Backend Logic (API Routes)
**Technology:** Next.js Route Handlers (`app/api/*`)
- **Role:** Acts as the backend REST API. It handles incoming HTTP requests from the frontend, enforces authentication (checking JSON Web Tokens), executes business logic (e.g., threat detection algorithms, modifying user roles), and talks to the database.

## 6. Database & ODM (Object-Document Mapper)
**Technology:** MongoDB, Mongoose
- **Role:** The persistent data storage layer.
  - **MongoDB:** A NoSQL database ideal for storing flexible, JSON-like documents (e.g., differently shaped threat logs, custom user profiles).
  - **Mongoose:** The schema wrapper that ensures data integrity. It defines strict rules (Schemas) for what an `Alert`, `Threat`, or `User` document must look like before being saved to MongoDB.

## 7. Authentication & Security
**Technology:** JSON Web Tokens (JWT), bcryptjs, Next.js Middleware
- **Role:** Secures the platform and enforces Role-Based Access Control (RBAC).
  - **bcryptjs:** Hashes user passwords before saving them in MongoDB, ensuring plaintext passwords are never stored.
  - **JWT:** Creates secure, signed tokens issued via HttpOnly cookies upon login. These tokens contain the user's role and ID, allowing the server to verify who the user is without requiring multiple database lookups.
  - **Next.js Middleware (`middleware.ts`):** Intercepts every page request to verify the JWT. It guarantees that Viewers cannot access `/admin`, and unauthenticated users cannot access anything except the landing page and login screen.

## 8. AI & Threat Detection Simulation
**Technology:** Custom Heuristic/Pattern-Matching Algorithms (Simulated Machine Learning)
- **Role:** In this prototype, the "AI Engine" (`app/api/analyze/route.ts`) simulates what a multimodal LLM would do. It uses keyword matching, regex patterns for URLs/PII, and heuristic scoring to parse submitted text.
  - **Reasoning:** It dynamically generates Explainable AI (XAI) reasons based on the matched patterns, and calculates a synthetic "Confidence Calibration" score.

## 9. Date & Time Formatting
**Technology:** date-fns
- **Role:** A lightweight utility library to format MongoDB ISO timestamps into human-readable strings like "2 hours ago" or "Just now" in the UI (specifically used in the Incident Timeline and Threat History logs).
