# =============================================================================
# BharatSanket AI — Multi-Stage Dockerfile for Google Cloud Run
# =============================================================================
# Stage 1: Build the React (Vite) frontend
# Stage 2: Set up Node.js backend + serve the built frontend as static files
# =============================================================================

# ─── Stage 1: Build React Frontend ───
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

# Copy package files and install dependencies
COPY client/package.json client/package-lock.json* ./
RUN npm install

# Copy source and build
COPY client/ .
RUN npm run build

# ─── Stage 2: Production Server ───
FROM node:20-alpine

WORKDIR /app

# Copy backend package files and install production dependencies only
COPY server/package.json server/package-lock.json* ./
RUN npm install --omit=dev

# Copy backend source code
COPY server/ .

# Copy the built React frontend from Stage 1 into server/public/
# Express will serve these as static files in production
COPY --from=frontend-builder /app/client/dist ./public

# Expose the port Cloud Run expects
EXPOSE 8080

# Cloud Run sets the PORT env var; we default to 8080
ENV PORT=8080

# Health check endpoint for Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start the Express server
CMD ["node", "server.js"]
