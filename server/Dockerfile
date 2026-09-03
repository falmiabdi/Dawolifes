# syntax=docker/dockerfile:1

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency manifests first for layer caching.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Copy source and compile TypeScript → dist/.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prisma client generation is part of postinstall/ci; generate explicitly so
# the generated client ships inside dist bundle.
RUN npx prisma generate

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Non-root user for safety.
RUN addgroup -S app && adduser -S app -G app

# Runtime needs only the compiled output, Prisma schema (for migrate/push),
# package files, and dependencies marked as production.
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/prisma ./prisma
COPY --from=build --chown=app:app /app/package.json ./
COPY --from=build --chown=app:app /app/package-lock.json ./

# Install only production deps into the runtime image so node_modules includes
# the Prisma engines needed to connect at runtime.
RUN npm ci --omit=dev

USER app

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

# Run prisma db push (idempotent schema sync) then start the API.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]