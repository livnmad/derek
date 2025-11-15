# Use Node 20 official image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN npm install --workspace=server
RUN npm install --workspace=client

# Copy source code
COPY . .

# Build client
RUN npm run build --workspace=client

# Build server
RUN npm run build --workspace=server

# Expose port
EXPOSE 3101

# Start server
CMD ["npm", "start"]
