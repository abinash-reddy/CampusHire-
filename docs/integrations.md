# CampusHire – External Services & AI Integrations Guide

This guide provides step-by-step instructions for configuring **free-tier** cloud databases, authentication, storage, and AI providers for **CampusHire (BTWA Capstone Project)**.

---

## 1. MongoDB Atlas Setup (Cloud Database)

MongoDB Atlas provides a generous **free shared M0 cluster (512MB storage)** that never expires.

### Step-by-Step Atlas Configuration:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Create Deployment** → Select **M0 (Free)** tier.
3. Choose your nearest cloud provider region (e.g., AWS / Mumbai `ap-south-1`).
4. Set a cluster name (e.g., `CampusHire-Cluster`).
5. In **Database Access**:
   - Create a database user (e.g., username: `campushire_admin`).
   - Choose **Password** authentication and generate a strong password (save this securely).
6. In **Network Access**:
   - Click **Add IP Address**.
   - For local development and demonstration, click **Allow Access from Anywhere (`0.0.0.0/0`)**, or whitelist your current IP address.
7. Click **Database** → **Connect** → Choose **Drivers (Node.js)**:
   - Copy the connection string:
     ```text
     mongodb+srv://campushire_admin:<password>@campushire-cluster.xxxx.mongodb.net/campushire?retryWrites=true&w=majority
     ```
8. Replace `<password>` with your actual database user password.
9. Open `server/.env` and paste it under `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://campushire_admin:YOUR_PASSWORD@campushire-cluster.xxxx.mongodb.net/campushire?retryWrites=true&w=majority
   ```

---

## 2. MongoDB Compass Connection (Local & Cloud Inspection)

MongoDB Compass is the official GUI for inspecting and managing MongoDB collections and documents during development.

### Connecting Compass to Atlas:
1. Open MongoDB Compass.
2. In the **New Connection** input, paste your Atlas connection URI:
   ```text
   mongodb+srv://campushire_admin:<password>@campushire-cluster.xxxx.mongodb.net/
   ```
3. Click **Connect**.
4. You will see the `campushire` database along with collections:
   - `users`
   - `students`
   - `companies`
   - `recruitmentdrives`
   - `applications`
   - `resumes`
   - `resumetests`
   - `resumeversions`
   - `interviews`
   - `notifications`
   - `placementupdates`
   - `results`
   - `aiconversations`
   - `aianalyses`

### Connecting Compass to Local MongoDB:
If running MongoDB locally on port 27017:
- Connection URI: `mongodb://127.0.0.1:27017`
- The system automatically falls back to local MongoDB if `MONGODB_URI` points to localhost.

---

## 3. Firebase Project Setup

Firebase Spark Plan (Free) provides Authentication and Storage free of cost.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** → Name it `campushire-portal` (or similar).
3. Disable Google Analytics (optional for college demo) → Click **Create Project**.
4. Click the gear icon next to **Project Overview** → **Project settings**.
5. Note your **Project ID** (e.g., `campushire-portal-12345`).

---

## 4. Firebase Authentication Setup

1. In the Firebase Console left menu, navigate to **Build** → **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - Enable **Email/Password** (keep Email link disabled).
   - (Optional) Enable **Google Sign-In** with your support email.
4. Go to **Project Settings** → **Service accounts** tab:
   - Click **Generate new private key** → confirm by clicking **Generate key**.
   - A `.json` file will download to your machine.
5. Open the downloaded `.json` file and locate:
   - `project_id`
   - `client_email`
   - `private_key`
6. Put these into `server/.env`:
   ```env
   FIREBASE_PROJECT_ID=campushire-portal-12345
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@campushire-portal-12345.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```

---

## 5. Firebase Storage Setup (PDF Resumes)

1. In Firebase Console left menu, navigate to **Build** → **Storage**.
2. Click **Get Started**.
3. Select **Start in test mode** (or production mode with authenticated read/write rules).
4. Choose your cloud storage location (e.g., `asia-south1`).
5. Copy your Storage Bucket URL (e.g., `campushire-portal-12345.appspot.com` or `campushire-portal-12345.firebasestorage.app`).
6. Place in `server/.env`:
   ```env
   FIREBASE_STORAGE_BUCKET=campushire-portal-12345.appspot.com
   ```

---

## 6. Google Gemini AI Setup (Free-Tier API)

Google AI Studio provides a **free-tier API** for Gemini with generous RPM/TPM limits suitable for college demonstration.

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** → **Create API key in new project**.
4. Copy the generated API key.
5. In `server/.env`, set:
   ```env
   GEMINI_API_KEY=AIzaSyD-YourActualGeminiApiKeyHere
   ```
> [!IMPORTANT]
> Never put `GEMINI_API_KEY` into the React frontend code or client `.env`. All AI requests flow securely through Express backend services.

---

## 7. Environment Variables Reference

File: `server/.env`

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | Express server port | `5000` |
| `NODE_ENV` | Yes | Environment mode | `development` |
| `CLIENT_URL` | Yes | Allowed frontend origin | `http://localhost:5173` |
| `MONGODB_URI` | Yes | MongoDB Atlas / Compass URI | `mongodb+srv://user:pass@cluster.mongodb.net/campushire` |
| `JWT_SECRET` | Yes | Fallback JWT secret for BTWA | `campushire_development_secret_2026` |
| `JWT_EXPIRES_IN` | Yes | Token validity period | `7d` |
| `FIREBASE_PROJECT_ID` | Phase 2 | Firebase Project ID | `campushire-portal-12345` |
| `FIREBASE_CLIENT_EMAIL` | Phase 2 | Service account email | `firebase-adminsdk@...` |
| `FIREBASE_PRIVATE_KEY` | Phase 2 | Service account private key | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `FIREBASE_STORAGE_BUCKET` | Phase 3 | Firebase storage bucket domain | `campushire.appspot.com` |
| `GEMINI_API_KEY` | Phase 4+ | Google Gemini free-tier key | `AIzaSy...` |
| `OPTIONAL_SEARCH_API_KEY` | Phase 10 | Optional search provider key | `tvly-...` |

---

## 8. Local Development & Verification

### Running Server:
```powershell
cd server
npm install
npm run dev
```

### Running Client:
```powershell
cd client
npm install
npm run dev
```

### Running End-to-End System Audit:
```powershell
cd server
npm run audit
```

---

## 9. Troubleshooting Common Issues

1. **MongoDB Atlas `MongoServerSelectionError` / `ETIMEDOUT`:**
   - Go to Atlas Console → **Network Access** → Click **Add IP Address** → Choose **Allow access from anywhere (`0.0.0.0/0`)**.
   - Check if your ISP or college network blocks MongoDB port `27017`.
2. **Firebase `Invalid private key`:**
   - Ensure `FIREBASE_PRIVATE_KEY` in `.env` is wrapped in double quotes and keeps the literal `\n` newline escapes intact.
3. **Gemini `ResourceExhausted` / `429 Too Many Requests`:**
   - The system includes automatic graceful fallbacks. If quota limit is hit, rule-based ATS analysis continues seamlessly without throwing unhandled exceptions.
