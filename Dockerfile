# install dependencies
FROM oven/bun:alpine AS deps
WORKDIR /app

COPY api/package.json api/bun.lock .
RUN bun install --production

# runtime
FROM oven/bun:alpine
WORKDIR /app

RUN apk add --no-cache ffmpeg

COPY --from=deps /app/node_modules ./node_modules
COPY api/dist/server.js ./server.js
COPY front-end/dist ./client

ENTRYPOINT ["bun", "run", "server.js"]
