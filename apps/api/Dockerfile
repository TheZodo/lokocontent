# Build stage: install deps and build API + db package
FROM node:22-alpine AS builder

# Install pnpm (match packageManager in root package.json)
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm --version

WORKDIR /app

# Copy workspace and dependency config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json turbo.json ./

# Copy packages needed for API (db has Prisma)
COPY packages/db packages/db
COPY apps/api apps/api

# Install all dependencies (from root so workspace is linked)
RUN pnpm install --frozen-lockfile

# Generate Prisma client and build db package (required by API)
RUN pnpm --filter @lokocontent/db generate
RUN pnpm --filter @lokocontent/db build

# Build the API
RUN pnpm --filter @lokocontent/api build

# Production stage: only runtime deps and built output
FROM node:22-alpine AS runner

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy built db package and its prisma client
COPY --from=builder /app/packages/db packages/db
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/apps/api/dist apps/api/dist

# Ensure we have the api package.json for node to resolve
COPY apps/api/package.json apps/api/package.json

# Symlink or ensure api can find db; Nest runs from apps/api
WORKDIR /app/apps/api

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
