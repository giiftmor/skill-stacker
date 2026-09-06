# skill-stacker/Dockerfile
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 fonts-liberation wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci
RUN npx playwright install chromium --with-deps || true

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