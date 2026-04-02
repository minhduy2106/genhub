FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Generate Prisma client
FROM deps AS prisma
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

# Build
FROM prisma AS build
COPY . .
RUN npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/entrypoint.sh ./

RUN chmod +x entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./entrypoint.sh"]
