# skill-stacker/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=5252 \
    DB_HOST=db \
    DB_PORT=5432 \
    DB_NAME=cvbuilder \
    DB_USER=postgres \
    DB_PASSWORD=postgres

# Expose port
EXPOSE 5252

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5252/api/health || exit 1

# Start Next.js
CMD ["npm", "start"]