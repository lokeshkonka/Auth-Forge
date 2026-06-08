#!/bin/sh

# Run migrations
cd /app/backend
npx prisma migrate deploy

# Start both backend and frontend
cd /app
concurrently -n "Backend,Frontend" -c "blue,green" \
  "cd backend && node dist/src/main.js" \
  "cd frontend && npx next start -p 3001"
