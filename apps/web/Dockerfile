# Base Image: Use an official lightweight Node.js image
FROM node:18-alpine

# --- NEW LINES START HERE ---
# Declare a build-time argument for the JWT_SECRET
ARG JWT_SECRET
# Set the JWT_SECRET as an environment variable inside the container
ENV JWT_SECRET=$JWT_SECRET
# --- NEW LINES END HERE ---

# Set the working directory inside the container
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Copy the prisma schema BEFORE installing dependencies
COPY prisma ./prisma/

# Install dependencies (this will now correctly run 'prisma generate')
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the Next.js application for production
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# The command to start your custom server when the container launches
CMD ["node", "server.ts"]