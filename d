cd BharatSanket-AI
cd server && npm install && cp .env.example .env   # add your keys
cd ../client && npm install
cd ../server && node seed/seedData.js               # seed 47 districts
# 1. Set up environment
cp server/.env.example server/.env
# Edit .env with your MONGO_URI and GEMINI_API_KEY

# 2. Seed the database (47 districts)
cd server && node seed/seedData.js

# 3. Development (two terminals)
cd server && npm run dev          # Backend on :8080
cd client && npm run dev          # Frontend on :5173 (proxied)

# 4. Deploy to Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/bharatsanket-ai
gcloud run deploy bharatsanket-ai \
  --image gcr.io/PROJECT_ID/bharatsanket-ai \
  --set-env-vars MONGO_URI=...,GEMINI_API_KEY=... \
  --port 8080 --allow-unauthenticated

jeevanpvt14_db_user
aCxwrgiQEAAyVENZ
mongodb+srv://jeevanpvt14_db_user:aCxwrgiQEAAyVENZ@bs-ai.ehqpax6.mongodb.net/?appName=bs-ai