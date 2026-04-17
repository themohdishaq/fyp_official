FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Run in development mode (for production, use npm run build && npm start)
CMD ["npm", "run", "dev"]
