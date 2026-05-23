FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Step 1: Prune workspace
FROM base AS builder
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=web --docker

# Step 2: Install dependencies
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# Step 3: Build the project
FROM base AS sourcer
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=builder /app/out/full/ .
RUN pnpm --filter web run build

# Step 4: Run the app
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=sourcer /app/apps/web/next.config.ts .
COPY --from=sourcer /app/apps/web/package.json .

# Copy the standalone output
COPY --from=sourcer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=sourcer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=sourcer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

ENV PORT 3000
EXPOSE 3000

# Standalone output keeps the monorepo folder structure
CMD ["node", "apps/web/server.js"]
