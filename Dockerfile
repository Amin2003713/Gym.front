# Stage 1 - Build
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
# Copy production environment file
COPY .env.production .env.production
RUN npm run build

# Stage 2 - Run
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app ./
ENV NODE_ENV=production

EXPOSE 3000
CMD ["npm", "start"]