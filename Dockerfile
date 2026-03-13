# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# ── Stage 2: Generate Prisma client + build Nuxt ────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate .nuxt/ (tsconfig, types, etc.) needed for build
RUN npx nuxt prepare

# Generate Prisma client inside the build container
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Build Nuxt (produces .output/)
RUN npm run build

# ── Stage 3: Production runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runtime

RUN apk add --no-cache tini

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built Nuxt output
COPY --from=builder /app/.output ./.output

# Copy Prisma schema + migrations (needed for prisma migrate deploy)
COPY --from=builder /app/prisma ./prisma

# Copy generated Prisma client
COPY --from=builder /app/generated ./generated

# Copy node_modules needed at runtime (Prisma CLI for migrations, native deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy package.json (needed by Prisma CLI)
COPY --from=builder /app/package.json ./

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create data directory for invoice PDFs
RUN mkdir -p data/invoices && chown -R appuser:appgroup data

# Switch to non-root user
USER appuser

# Expose Nitro default port
EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

ENTRYPOINT ["tini", "--"]
CMD ["./docker-entrypoint.sh"]
