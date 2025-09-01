# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript (now with proper types)
RUN npm run build

# Remove dev dependencies for production
RUN npm ci --only=production && npm cache clean --force

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "dist/server.js"]
