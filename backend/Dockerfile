FROM node:18-alpine AS base

WORKDIR /app

RUN apk add --no-cache tini

COPY package*.json ./

FROM base AS dependencies

RUN npm ci --only=production

FROM base AS dev-dependencies

RUN npm ci

FROM base AS production

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R node:node logs

ENV NODE_ENV=production
ENV PORT=4000

USER node

EXPOSE 4000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "server.js"]