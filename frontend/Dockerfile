FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, not
# read at container runtime — they must be passed as build args, not as
# docker-compose `environment:` (which only affects the running container).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_DEMO_BADGE
ARG NEXT_PUBLIC_DEMO_PASSWORD
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_DEMO_BADGE=$NEXT_PUBLIC_DEMO_BADGE
ENV NEXT_PUBLIC_DEMO_PASSWORD=$NEXT_PUBLIC_DEMO_PASSWORD
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
# Next.js standalone's server.js binds to $HOSTNAME if set, and Docker sets
# HOSTNAME to the container ID by default — which resolves only to the
# container's external interface, not loopback. That silently breaks any
# same-host healthcheck/curl (connection refused on localhost/127.0.0.1)
# even though the app is reachable fine from other containers. Force it to
# bind on all interfaces instead.
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
