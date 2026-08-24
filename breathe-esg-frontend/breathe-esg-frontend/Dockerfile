# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies first (this caches the node_modules layer)
COPY package*.json ./
RUN npm install

# Copy the rest of your React code and build it
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy the compiled React files to Nginx's default public folder
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 for the web server
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]