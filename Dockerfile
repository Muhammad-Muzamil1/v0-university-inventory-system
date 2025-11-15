# Multi-stage Dockerfile for University Inventory Management System

# Stage 1: Build Node.js backend
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Production image
FROM node:18-alpine

WORKDIR /app

# Install additional dependencies
RUN apk add --no-cache mysql-client

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY server.js .
COPY public ./public

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "server.js"]
