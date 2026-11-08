# Stage 1 - Build
FROM node:22-slim AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=0

# Copy package files first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy application source
COPY . .

# Copy production environment file
COPY .env.production .env.production

# Build application (next.config.ts output: 'standalone')
RUN npm run build


# Stage 2 - Run
# Only the traced server, static assets and public files are shipped; no dev dependencies,
# no source tree. This keeps the image small enough for a small VPS to export and run.
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ISR (revalidate = 60) writes to .next/cache at runtime; the non-root user must own it.
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
