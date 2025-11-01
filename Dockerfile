
# Build Stage

FROM node:20-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy only package files to install dependencies
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && npm cache clean --force

# Copy the entire project (for Prisma schema and code)
COPY . .

# Generate Prisma client
RUN npx prisma generate


#  Production Stage

FROM node:20-alpine AS production

# Create non-root user (for security)
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001

WORKDIR /usr/src/app

# Copy dependencies and app source from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/index.js ./
COPY --from=builder /usr/src/app/package*.json ./

# Switch to non-root user
USER appuser

# Expose port b
EXPOSE 4000

# Set environment
ENV NODE_ENV=production

# Start the app
CMD ["npm", "start"]
