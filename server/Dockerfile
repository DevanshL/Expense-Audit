# Production Dockerfile for Backend
FROM node:20-slim

WORKDIR /app

# Install dependencies first (better caching)
COPY server/package*.json ./
RUN npm install --production

# Copy server source code
COPY server/ .

# Ensure the frontend build can be served if needed (Phase 3 refactor)
# COPY --from=frontend-builder /app/dist ./public

EXPOSE 5000

CMD ["npm", "start"]
