FROM oven/bun:1.2-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Copy server source
COPY server/ ./server/
COPY src/onchain-facts.ts ./src/
COPY src/onchain-money.ts ./src/
COPY tsconfig.json ./

EXPOSE 3001

ENV NODE_ENV=production

CMD ["bun", "run", "server/index.ts"]
