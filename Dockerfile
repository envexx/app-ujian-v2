# Multi-stage build for Next.js application
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
# SECURITY: Do NOT use ARG or ENV for secrets here!
# Secrets (SESSION_SECRET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, etc.)
# should be provided at RUNTIME via environment variables from Coolify,
# NOT at build time. This prevents secrets from being baked into image layers.
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Only non-sensitive environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files for Next.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy full node_modules for Prisma CLI (includes all dependencies)
# Standalone build doesn't include all deps needed by Prisma CLI
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema, config, and seed files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
# All secrets will be injected at runtime via Coolify environment variables
CMD ["node", "server.js"]
