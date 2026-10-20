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

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["bun", "run", "server/index.ts"]
