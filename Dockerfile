# Single-stage build for React application with Vite
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Set Node.js memory limits
ENV NODE_OPTIONS="--max-old-space-size=13096"
ENV NPM_CONFIG_CACHE=/tmp/.npm

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@latest && \
    pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G appuser -g appuser appuser

# Set proper permissions
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port (Vite preview default port is 4173)
EXPOSE 4173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4173/ || exit 1

# Start the application (vite preview serves on 4173 by default)
CMD ["pnpm", "preview", "--host", "0.0.0.0"]
