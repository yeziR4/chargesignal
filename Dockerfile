FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /home/node/app
COPY --from=build --chown=node:node /app/dist/standalone/ ./

USER node
EXPOSE 3000
CMD ["node", "server.js"]
