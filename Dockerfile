FROM oven/bun:1.2-alpine

WORKDIR /app

# Copy dependency files first for layer caching
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy all source files
COPY . .

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["bun", "run", "server/index.ts"]
