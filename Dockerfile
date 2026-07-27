# Base image: standard Node.js
FROM node:22-bookworm AS base

# Install necessary dependencies
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with legacy-peer-deps to bypass React 19 peer dependency issues
RUN npm ci --legacy-peer-deps


# Copy all other project files
COPY . .

# Pass Railway environment variables into the Next.js build
ARG NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL

ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build the Next.js application
RUN npm run build

# Expose the standard Next.js port
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "run", "start"]
