# Multi-stage Dockerfile for AuthForge (Frontend & Backend)

# Stage 1: Build Backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# Stage 2: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# Stage 3: Runtime
FROM node:22-alpine
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache libc6-compat

# Copy Backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Copy Frontend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Install concurrently
RUN npm install -g concurrently

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose ports
EXPOSE 3000 3001

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

CMD ["./start.sh"]
