# Stage 1 - Build
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

# Copy production environment file
COPY .env.production .env.production

# Build application
RUN npm run build


# Stage 2 - Run
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]