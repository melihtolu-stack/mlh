FROM node:20-slim

# Baileys doesn't need Chromium! Much lighter image
RUN apt-get update && apt-get install -y \
    curl \
    git \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Configure git to use HTTPS instead of SSH (for npm dependencies)
RUN git config --global url."https://github.com/".insteadOf ssh://git@github.com/ && \
    git config --global url."https://".insteadOf ssh://

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Create directory for Baileys auth data
RUN mkdir -p /app/baileys-auth && \
    chmod -R 777 /app/baileys-auth

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the Baileys application
CMD ["node", "index-baileys.js"]
