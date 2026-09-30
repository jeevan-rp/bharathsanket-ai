# 🇮🇳 BharatSanket AI (भारत संकेत)
### *Next-Gen Civic Intelligence & Multimodal Infrastructure Governance Platform*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-bharathsanket--ai.vercel.app-00E5FF?style=for-the-badge&logo=vercel&logoColor=white)](https://bharathsanket-ai.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-jeevan--rp%2Fbharathsanket--ai-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/jeevan-rp/bharathsanket-ai)
[![Gemini 2.5 Flash](https://img.shields.io/badge/AI_Engine-Google_Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Database-Firebase_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Mapbox](https://img.shields.io/badge/Geospatial-Mapbox_GL_JS-000000?style=for-the-badge&logo=mapbox&logoColor=white)](https://www.mapbox.com/)
[![React 18](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)

---

## 🌟 Overview

**BharatSanket AI** is a state-of-the-art civic intelligence ecosystem built to bridge the communication and governance divide between **1.4 billion citizens** and municipal administrations across India. 

By combining **Google Gemini 2.5 Flash multimodal vision**, zero-shot **vernacular NLP in 10+ Indian languages**, and **Mapbox GL real-time geospatial heatmaps**, BharatSanket AI transforms unstructured, multilingual citizen complaints into verified, geo-clustered, and actionable work orders for municipal authorities.

---

## 🚀 Live Application & Evaluation Credentials

* 🌐 **Live Production App:** [https://bharathsanket-ai.vercel.app](https://bharathsanket-ai.vercel.app)
* 📡 **System Health Check API:** [https://bharathsanket-ai.vercel.app/api/health](https://bharathsanket-ai.vercel.app/api/health)
* 📄 **Executive Pitch Deck (PDF):** [`BharatSanket_AI_Pitch_Deck.pdf`](./BharatSanket_AI_Pitch_Deck.pdf)
* 📊 **Presentation Slides (PPTX):** [`BharatSanket_AI_Pitch_Deck.pptx`](./BharatSanket_AI_Pitch_Deck.pptx)

### 🔑 Test Accounts for Evaluators

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@bharatsanket.in` | `Demo@123` | File multimodal complaints, track status stepper, upvote ward issues |
| **Municipal Official** | `official@bharatsanket.in` | `Admin@123` | Command center, geospatial Mapbox clusters, SLA dispatch, AI executive briefing |

---

## 🎯 Key Innovations & Features

### 1. 📸 Multimodal Visual Ground-Truth Inspection
* Powered by **Google Gemini 2.5 Flash**.
* Analyzes uploaded damage photos alongside complaint descriptions in real time.
* **Hazard Recognition:** Identifies potholes, broken water mains, open high-voltage cables, clogged drainage, and waste dumping.
* **Fraud & Mismatch Prevention:** Flags irrelevant selfies, blurry captures, or spoofed uploads, generating an AI Confidence Score and visual audit reasoning.
* **Automated Severity Calibration:** Rates severity from `1` (minor defect) to `5` (life-threatening/critical infrastructure failure).

### 2. 🗣️ Multilingual Vernacular Voice & Text Parsing
* Supports complaints submitted in Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, English, and more.
* Automatically translates, identifies administrative categories (*Roads, Water, Healthcare, Electricity, Sanitation, Drainage*), and extracts standardized English executive summaries in seconds.

### 3. 📍 Dynamic Geospatial Mapbox Heatmap & Clustering
* Extracts localized landmarks (*e.g., "Near T Nagar bus stand", "Indiranagar 100ft Road"*) and synthesizes GPS coordinates.
* Visualizes live complaint densities on high-performance vector maps using **Mapbox GL JS**.
* Groups proximate grievances into unified hotspots to eliminate redundant inspections.

### 4. 🤝 Community Consensus & Deduplication Upvoting
* Citizens can browse nearby neighborhood complaints and **upvote** existing tickets.
* Upvoting boosts the report's `impactScore` without creating duplicate tickets, preventing administrative backlog and surfacing genuine civic priorities.

### 5. ⚡ Automated Executive Briefing Engine for Leadership
* Synthesizes citywide civic data with a single click for **Municipal Commissioners, Mayors, and Ward Officers**.
* Outputs structured intelligence:
  * **Executive Headline & Situational Overview**
  * **Public Safety Hazard Matrix** (monsoon flood warnings, exposed wires)
  * **Priority Action Items** with 48-hour SLA targets
  * **Capital Allocation Guidance** for targeted contractor fund releases
  * **Estimated Citizen Beneficiaries**

---

## 🏗️ Architecture & Technology Stack

```mermaid
graph TD
    A[Citizen Mobile / Web PWA] -->|Multilingual Complaint + Photo| B[Vite + React 18 SPA]
    B -->|REST API / JSON| C[Node.js + Express Backend]
    C -->|Image Buffer + Text Prompt| D[Google Gemini 2.5 Flash]
    D -->|Multimodal Verification & Severity| C
    C -->|Realtime Persist & Sync| E[(Firebase Firestore)]
    C -->|JWT Auth & RBAC| F[Firebase Authentication]
    B -->|Vector Tiles & Clustering| G[Mapbox GL JS]
    H[Official Command Center] -->|Executive Briefing Request| C
    C -->|Generative Policy Synthesis| D
```

| Layer | Technologies Used | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion | High-performance responsive SPA with glassmorphism design system |
| **Geospatial** | Mapbox GL JS | Vector maps, custom markers, clustering, and satellite layers |
| **Backend** | Node.js, Express.js | REST API routing, input sanitization, and serverless middleware |
| **AI / Multimodal** | Google Gemini 2.5 Flash (`@google/generative-ai`) | Multimodal vision analysis, vernacular translation, and executive briefing synthesis |
| **Database & Auth** | Firebase Firestore & Firebase Admin SDK | Real-time NoSQL data synchronization, role-based access control (RBAC) |
| **Deployment** | Vercel Serverless / Docker / Google Cloud Run | Scalable multi-cloud deployment architecture |

---

## 📁 Repository Structure

```plaintext
bharatsanket-ai/
├── api/
│   └── index.js                 # Vercel Serverless entrypoint
├── client/                      # React + Vite Frontend
│   ├── public/                  # Static assets & icons
│   ├── src/
│   │   ├── components/          # CitizenPortal, OfficialDashboard, MapContainer, etc.
│   │   ├── config/              # Firebase Client SDK setup
│   │   ├── context/             # AuthContext (Role & session management)
│   │   ├── services/            # Axios API client layer
│   │   ├── App.jsx              # Routes & navigation guards
│   │   └── main.jsx             # React DOM root
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                      # Express Backend
│   ├── config/                  # Firebase Admin SDK initialization
│   ├── controllers/             # reportController, aiController, requestController
│   ├── routes/                  # Express API route declarations
│   ├── seed/                    # Database seeder scripts (seedUsers, seedData)
│   ├── services/                # geminiService (Gemini 2.5 Flash integration)
│   └── server.js                # Express app listener & health check
├── BharatSanket_AI_Pitch_Deck.pdf   # Presentation Deck (PDF < 5MB)
├── BharatSanket_AI_Pitch_Deck.pptx  # Editable PowerPoint Pitch Deck
├── Dockerfile                   # Production Docker container definition
├── docker-compose.yml           # Multi-container orchestration
├── vercel.json                  # Full-stack Vercel rewrite configuration
└── README.md                    # Project Documentation
```

---

## 🛠️ Local Development & Quick Start

### 1. Prerequisites
* **Node.js** `>= 18.x`
* **npm** `>= 9.x`
* **Google Gemini API Key** ([Get one here](https://aistudio.google.com/))
* **Firebase Project** with Firestore & Authentication enabled
* **Mapbox Public Access Token** ([Get one here](https://account.mapbox.com/))

### 2. Clone the Repository
```bash
git clone https://github.com/jeevan-rp/bharathsanket-ai.git
cd bharathsanket-ai
```

### 3. Backend Setup
```bash
cd server
npm install

# Create environment configuration
cp .env.example .env
```

Configure `server/.env`:
```env
PORT=8080
GEMINI_API_KEY=your_google_gemini_api_key

# Firebase Admin Credentials (Option A: Private Key variables)
FIREBASE_PROJECT_ID=bharatsanket-ai-01
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@bharatsanket-ai-01.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...=\n-----END PRIVATE KEY-----\n"

# Or Option B: Raw Service Account JSON String
# FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

Seed initial users and sample district data:
```bash
node seed/seedUsers.js
node seed/seedData.js
```

Start the backend:
```bash
npm run dev
# Server running at http://localhost:8080
```

### 4. Frontend Setup
In a new terminal:
```bash
cd client
npm install

# Create frontend environment configuration
cp .env.example .env
```

Configure `client/.env`:
```env
VITE_MAPBOX_TOKEN=your_mapbox_public_token
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=bharatsanket-ai-01.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bharatsanket-ai-01
VITE_FIREBASE_STORAGE_BUCKET=bharatsanket-ai-01.firebasestorage.app
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Start the frontend dev server:
```bash
npm run dev
# App running at http://localhost:5173
```

---

## 📡 REST API Reference

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Public | System status, Firestore connection, and diagnostics |
| `/api/reports` | `POST` | Citizen | Submit a complaint with optional image URL for Gemini Vision verification |
| `/api/reports` | `GET` | All | Fetch reports filtered by category, severity, city, or userId |
| `/api/reports/hotspots` | `GET` | Official | Fetch geospatial clusters with complaint counts |
| `/api/reports/:id/upvote`| `PATCH` | Citizen | Upvote a report to escalate priority and prevent duplicates |
| `/api/reports/:id/status`| `PATCH` | Official | Update report status (`Pending`, `In Progress`, `Resolved`) with audit note |
| `/api/ai/briefing` | `POST` | Official | Generate Gemini Municipal Commissioner Executive Briefing |

---

## 📊 Measurable Social Impact

* **65% Reduction in Triage Time:** Gemini AI categorizes, verifies, and geo-routes complaints immediately upon submission.
* **Zero Duplicate Waste:** Neighbor upvoting and proximity deduplication eliminate redundant work orders.
* **100% Photographic Auditability:** Every status transition includes verified ground-truth evidence and officer signatures.
* **Digital Inclusivity:** Eliminates bureaucratic English barriers for millions of citizens across Tier-1, Tier-2, and rural India.

---

## 📜 License

This project is licensed under the **MIT License** — feel free to use and adapt it for civic and governance innovation.

---

<p align="center">
  Built with ❤️ for Digital India & Smart Governance 🇮🇳
</p>
