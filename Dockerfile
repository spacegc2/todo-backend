# Stage 1: Build the Node.js application
FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
# Using .dockerignore can prevent node_modules from being copied if it exists locally
COPY package*.json ./

# Clear npm cache (sometimes helps with stubborn install issues)
RUN npm cache clean --force

# Install dependencies (only production dependencies are usually needed for runtime)
RUN npm install --production

# Copy the rest of the application code, including db.json
COPY . .

# --- Added verification step to check files ---
# List contents of the app directory to check in logs
RUN ls -la /app
# Fail the build if server.js is not found (critical for Node.js apps)
RUN test -f /app/server.js || (echo "Error: server.js not found after copy! Check Dockerfile and context." && exit 1)
# --- End added verification step ---

# Expose the port the app runs on (Cloud Run default is 8080)
# Our server.js uses process.env.PORT, which Cloud Run will set to 8080.
EXPOSE 8080

# Command to run the application
CMD [ "node", "server.js" ]