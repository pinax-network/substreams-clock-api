FROM oven/bun:1.4.3
COPY . .
RUN bun install --frozen-lockfile
ENTRYPOINT [ "bun", "./index.ts" ]