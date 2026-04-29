FROM node:22-alpine

WORKDIR /app

# Copy both package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN cd backend && npm ci && cd ../frontend && npm ci

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Build frontend
RUN cd frontend && npm run build

# Expose port
EXPOSE 3000

# Run backend in development
CMD ["npm", "run", "dev", "--workspace=backend"]
