# ─────────────────────────────────────────
# STAGE 1 — BUILD STAGE
# Build the React app into static files
# ─────────────────────────────────────────
FROM node:18-alpine AS builder
# AS builder = we name this stage "builder"
# so we can reference it later

WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build React app for production
# This creates a /app/dist folder with
# HTML, CSS, JS files ready to serve
RUN npm run build

# ─────────────────────────────────────────
# STAGE 2 — SERVE STAGE
# Serve the built files using nginx
# nginx is a lightweight web server
# ─────────────────────────────────────────
FROM nginx:alpine
# Start fresh with just nginx
# We don't need Node anymore after building

# Copy built files from builder stage
# into nginx's default serve folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Tell Docker this container uses port 80
EXPOSE 80

# nginx starts automatically — no CMD needed