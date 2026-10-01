# syntax=docker/dockerfile:1
#
# Production image for the VPS platform (see infra-setup apps/_template/README.md).
# Next.js standalone output, non-root, with a HEALTHCHECK against GET /health.
#
# The same image also runs the one-shot `prisma migrate deploy` from /migrate. The
# standalone server's traced node_modules does not contain the Prisma CLI, so the
# CLI gets its own small install there rather than dragging every devDependency
# into the runtime image:
#
#   docker compose run --rm -T --entrypoint "" readledger \
#     sh -c 'cd /migrate && node node_modules/prisma/build/index.js migrate deploy'

# ── deps ──────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    pnpm config set store-dir /pnpm-store && \
    pnpm install --frozen-lockfile

# ── build ─────────────────────────────────────────────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# prisma.config.ts requires DIRECT_URL to be set even for `prisma generate`, which
# never connects. The real value only exists on the server.
RUN DIRECT_URL=postgresql://build@localhost:5432/build pnpm build

# ── migrate CLI ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS migrate
WORKDIR /migrate
# Pinned to the versions in pnpm-lock.yaml; bump together with the app's prisma.
RUN npm init -y >/dev/null && \
    npm install --omit=dev --no-audit --no-fund prisma@7.5.0 dotenv@16.6.1
COPY prisma.config.ts ./
COPY prisma ./prisma

# ── runtime ───────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

# Stored timestamps are UTC; keep server-side date formatting on UTC as it was
# on Vercel.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=UTC

WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=migrate --chown=node:node /migrate /migrate

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
