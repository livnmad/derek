# Multi-stage build for production
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci
RUN npm ci --workspace=server --omit=dev
RUN npm ci --workspace=client --omit=dev

# Copy source code
COPY . .

# Build client and server
RUN npm run build --workspace=client
RUN npm run build --workspace=server

# Production stage
FROM node:20-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/server/dist ./server/dist
COPY --from=builder --chown=nodejs:nodejs /app/server/package*.json ./server/
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Install production dependencies only
RUN npm ci --workspace=server --omit=dev

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3101

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3101/api/health || exit 1

# Start server
CMD ["node", "server/dist/index.js"]
