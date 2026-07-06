FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Step 1: Filter workspace to only include the api app
FROM base AS builder
WORKDIR /app
RUN pnpm add -g turbo@^2.4.0
COPY . .
RUN turbo prune @verdiqt/api --docker

# Step 2: Install dependencies
FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile

# Step 3: Build the project
FROM base AS sourcer
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=builder /app/out/full/ .
# Generate prisma client inside the workspace and compile TS
RUN pnpm --filter @verdiqt/api run build

# Step 4: Run the app
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 expressjs
USER expressjs

COPY --from=sourcer /app/ .

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/index.js"]
