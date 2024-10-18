# Stage 1: Build the React app (개발에서는 빌드하지 않고 개발 서버 실행)
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port that React development server will run on
EXPOSE 3000

# Start the React development server
CMD ["npm", "start"]
