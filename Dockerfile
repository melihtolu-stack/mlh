# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and node_modules
COPY package.json package-lock.json* ./
COPY --from=deps /app/node_modules ./node_modules

# Copy all necessary files for build
COPY next.config.mjs ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.mjs ./
COPY src ./src

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
# Note: NODE_ENV should not be set to production during build
# as it skips devDependencies which are needed for building

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Note: public directory is optional, copy only if it exists in builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
