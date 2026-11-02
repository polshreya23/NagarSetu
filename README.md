# NagarSetu (नगरसेतू)
> **Tagline:** Report. Detect. Prioritize. Resolve.

AI-powered smart civic issue reporting and municipal management platform for Indian cities, initially focused on Pune, Maharashtra.

---

## 🏛️ Project Overview

**NagarSetu** bridges citizens and urban civic administrations (Pune Municipal Corporation) using multimodal AI and spatial analytics.

### Key Capabilities
- **First-Open Authentication Portal:**
  - Modern welcome portal presenting Google OAuth, Mobile OTP verification, and Email/Password authentication.
  - Role-based automatic redirection: Administrators are routed to the Municipal Command Center; citizens to the Citizen Grievance Portal.
  - Persistent login sessions with secure sign-out.

- **Administrator Identity & Role-Based Security:**
  - **Super Administrator:** `Shreya Pol` (`shreya.1251070104@vit.edu` / `admin@pune-civic.gov.in`)
  - Strict server-side access control: only authorized administrators can modify complaint status, deploy field teams, or override priority scores.
  - All public sign-ups (via Google, Phone, or Email) are strictly provisioned as `CITIZEN` accounts. No user can self-escalate privileges.

- **Citizen Portal:**
  - Rapid grievance registration with device camera/photo upload.
  - Interactive Pune GIS map picker (FC Road, Kothrud, Viman Nagar, Hadapsar, Baner, Hinjawadi, Camp) and GPS auto-detection.
  - Pre-submission duplicate detection within 100 metres and 7 days. Citizens can co-report/endorse existing issues rather than flooding municipal systems with redundant tickets.
  - End-to-end grievance status tracking with transparent audit trails.

- **AI Engine (Gemini 3.8 Flash):**
  - Identifies visible municipal infrastructure defects (potholes, garbage accumulation, water supply leaks, sewage backflows, broken streetlights, structural damage).
  - Assesses severity: `Low`, `Medium`, `High`, or `Critical`.
  - Flags non-civic or ambiguous photos for manual administrative review.
  - Provides a confidence score and department assignment recommendations.

- **Priority Scoring Formula:**
  ```text
  Priority = 0.5 × Severity + 0.3 × Report Count Score + 0.2 × Waiting Time Score
  ```
  - **Severity Values:** Low = 20, Medium = 45, High = 75, Critical = 100
  - **Report Count Score:** `min(100, 25 × (number of reports - 1))`
  - **Waiting Time Score:** `min(100, 100 × hours waiting / 72)`
  - Priority Tiers: Critical (≥75), High (≥50), Medium (≥30), Low (<30).
  - Administrators can review the mathematical breakdown and apply manual overrides with an audit justification.

- **Authority Dashboard:**
  - Real-time command center showing Total, Pending, In Progress, Resolved, and Critical Alert KPIs.
  - Multi-parameter filterable and searchable management table.
  - One-click workflow status updates (`Pending` → `In Progress` → `Resolved`) with field notes and post-resolution photo proof.
  - Recharts analytics on category distribution, turnaround SLA, and ward performance.

---

## 🛠️ Technology Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express
- **Authentication:** Firebase Authentication (Google OAuth, Phone Auth, Email/Password)
- **AI Integration:** `@google/genai` TypeScript SDK (Server-Side using `gemini-3.8-flash`)
- **Maps:** Leaflet & OpenStreetMap
- **Analytics:** Recharts
- **Storage:** File-backed persistent JSON database (`data/nagarsetu_db.json`)

---

## ⚙️ Environment Variables & Configuration

The application uses Firebase client configuration stored in `firebase-applet-config.json` (auto-provisioned):

```json
{
  "projectId": "gen-lang-client-0862992569",
  "appId": "1:317915926342:web:a0b8b818e8f2351aef9f47",
  "apiKey": "AIzaSyDH...",
  "authDomain": "gen-lang-client-0862992569.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-nagarsetu-68cd0c64-e4a0-4f05-944f-7a77921b6bd1"
}
```

Configure these in your `.env` file:

```env
# Google Gemini API Key for server-side image analysis
GEMINI_API_KEY="your-google-gemini-api-key"

# Port (default 3000)
PORT=3000

# Base URL
APP_URL="http://localhost:3000"
```

> **Firebase Console Step for Production Phone Auth:**
> 1. In your Firebase Console under **Authentication > Sign-in method**, ensure **Google** and **Phone** providers are enabled.
> 2. For testing, add any test phone numbers under **Phone numbers for testing** in Firebase Console.

---

## 🚀 Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Runs `tsx server.ts` with Vite middleware enabled on `http://localhost:3000`.

3. **Build for Production:**
   ```bash
   npm run build
   ```

4. **Run Production Server:**
   ```bash
   npm run start
   ```

---

## 🧪 Demo Credentials & Baseline Profiles

You can log in using any of the following accounts from the welcome screen:

- **Super Administrator:** `shreya.1251070104@vit.edu` or `admin@pune-civic.gov.in`
  - Name: **Shreya Pol**
  - Role: **Super Administrator**
  - Access: Full municipal operations dashboard, status closures, and priority overrides.
- **Citizen 1:** `aarav.sharma@example.com` (Shivajinagar)
- **Citizen 2:** `priya.patil@example.com` (Kothrud)
- **New Citizen Sign-Up:** Sign in via Google, Mobile Phone OTP (+91), or new citizen email registration.

---

## 📜 Disclaimer
*NagarSetu is a civic technology prototype demonstrating smart urban governance workflows for Pune. It is not an official portal of Pune Municipal Corporation (PMC).*
