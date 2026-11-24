# The site on the home server (docs/07, decision 2026-11-24). Dokploy builds it from `main` and
# passes the NEXT_PUBLIC_* values as build arguments: Next inlines them while compiling.
FROM node:26-slim AS build
WORKDIR /app
ENV LEFTHOOK=0 NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
RUN npm install --global pnpm@12.11.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPPORT_EMAIL
ARG NEXT_PUBLIC_SUPPORT_WHATSAPP
RUN pnpm build
# The CLI only pushes the migrations at start (scripts/deploy/migrate.mjs): its two binaries, not
# the package.
RUN mkdir -p /opt/supabase \
  && cp "$(dirname "$(find node_modules/.pnpm -path '*/cli-linux-x64/bin/supabase' -type f | head -n 1)")"/* /opt/supabase/

FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
  PATH=/opt/supabase:$PATH
COPY --from=build /opt/supabase /opt/supabase
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Read at runtime from the working directory (lib/og/share-font.ts).
COPY --from=build /app/src/lib/og/*.ttf ./src/lib/og/
COPY --from=build /app/supabase/config.toml ./supabase/config.toml
COPY --from=build /app/supabase/migrations ./supabase/migrations
COPY --from=build /app/scripts/deploy/migrate.mjs ./scripts/deploy/migrate.mjs
USER node
EXPOSE 3000
# Swarm keeps the old task serving until this passes (start-first), and rolls back a task whose
# migrations fail. The start period covers `supabase db push` before the server is up.
HEALTHCHECK --interval=10s --timeout=5s --start-period=120s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["sh", "-c", "node scripts/deploy/migrate.mjs && exec node server.js"]
