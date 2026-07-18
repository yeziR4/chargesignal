FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    WRANGLER_SEND_METRICS=false \
    WRANGLER_LOG_PATH=/tmp/wrangler.log

WORKDIR /home/node/app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER node
EXPOSE 7860
CMD ["./docker-entrypoint.sh"]
