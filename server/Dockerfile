# ─────────────────────────────────────────
# STAGE 1 — BASE IMAGE
# ─────────────────────────────────────────

# Start from official Node.js image
# alpine = lightweight Linux version (smaller size)
# Think of this like choosing a base operating system
FROM node:18-alpine

# ─────────────────────────────────────────
# STAGE 2 — SET WORKING DIRECTORY
# ─────────────────────────────────────────

# Create and go into /app folder inside container
# All our files will live here
WORKDIR /app

# ─────────────────────────────────────────
# STAGE 3 — INSTALL DEPENDENCIES
# ─────────────────────────────────────────

# Copy package.json and package-lock.json FIRST
# We copy these before the rest of the code
# Why? Docker caches layers — if package.json
# hasn't changed, it skips npm install
# This makes rebuilding faster
COPY package*.json ./

# Install all dependencies
RUN npm install

# ─────────────────────────────────────────
# STAGE 4 — COPY SOURCE CODE
# ─────────────────────────────────────────

# Copy everything else into /app
# The .dockerignore file will exclude
# node_modules and .env (defined below)
COPY . .

# ─────────────────────────────────────────
# STAGE 5 — EXPOSE PORT
# ─────────────────────────────────────────

# Tell Docker this container uses port 5000
# This does NOT publish the port — just documents it
EXPOSE 5000

# ─────────────────────────────────────────
# STAGE 6 — START COMMAND
# ─────────────────────────────────────────

# Command to run when container starts
# Uses node instead of nodemon in production
CMD ["node", "server.js"]