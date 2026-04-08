FROM node:18-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and Prisma schema
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies based on the preferred package manager
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG LOGIN_PASSCODE
ARG INTERNAL_API_KEY
ARG DATABASE_URL_BUILD
# ARG GEMINI_API_KEY
ARG GOOGLE_CLOUD_PROJECT
ARG GOOGLE_CLOUD_LOCATION
ARG GOOGLE_GENAI_USE_VERTEXAI
ARG GOOGLE_CLOUD_STORAGE_BUCKET
ARG GOOGLE_GENAI_MODEL

ENV LOGIN_PASSCODE=$LOGIN_PASSCODE
ENV INTERNAL_API_KEY=$INTERNAL_API_KEY
ENV DATABASE_URL=$DATABASE_URL_BUILD
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT
ENV GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION
ENV GOOGLE_GENAI_USE_VERTEXAI=$GOOGLE_GENAI_USE_VERTEXAI
ENV GOOGLE_CLOUD_STORAGE_BUCKET=$GOOGLE_CLOUD_STORAGE_BUCKET
ENV GOOGLE_GENAI_MODEL=$GOOGLE_GENAI_MODEL

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN \
    if [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Stage 3: Production server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# IMPORTANT: Copy the generated Prisma engine/client to the standalone node_modules
# Standalone tracing often misses the Prisma binaries, this ensures they are present.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]