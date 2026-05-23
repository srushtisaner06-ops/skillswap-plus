# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S asep && adduser -S asep -G asep

COPY --from=deps --chown=asep:asep /app/node_modules ./node_modules
COPY --chown=asep:asep package*.json ./
COPY --chown=asep:asep server.js ./
COPY --chown=asep:asep src ./src
RUN mkdir -p uploads && chown -R asep:asep uploads

USER asep
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
