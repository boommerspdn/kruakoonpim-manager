# ============================================
# Global Arguments
# ============================================
ARG NODE_VERSION=24.13.0-slim

# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================
FROM node:${NODE_VERSION} AS dependencies

# Install OpenSSL for Prisma Engine compatibility on slim images
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

COPY prisma ./prisma/
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./

RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/local/share/.cache/yarn \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund; \
    elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn install --frozen-lockfile --production=false; \
    elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
    else \
    echo "No lockfile found." && exit 1; \
    fi

RUN npx prisma generate

# ============================================
# Stage 2: Build Next.js application
# ============================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Redeclare ONLY the ARGs needed for Next.js to compile successfully.
# (If your build step fetches data from the DB, keep DATABASE_URL here)
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN if [ -f package-lock.json ]; then \
    npm run build; \
    elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn build; \
    elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm build; \
    else \
    echo "No lockfile found." && exit 1; \
    fi

# ============================================
# Stage 3: Run Next.js application
# ============================================
FROM node:${NODE_VERSION} AS runner

# Install OpenSSL in the runner so Prisma can query the DB at runtime
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Set non-secret production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Note: GEMINI_API_KEY, DATABASE_URL, etc. are INTENTIONALLY left out here.
# Docker Compose will inject them securely at runtime via env_file!

COPY --from=builder --chown=node:node /app/public ./public

RUN mkdir .next
RUN chown node:node .next

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

CMD ["node", "server.js"]