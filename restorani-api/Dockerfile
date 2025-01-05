# Use the official Node.js image
#prije bio node 16
FROM node:18 

# Set the working directory inside the container
#WORKDIR /usr/src/app
WORKDIR /app

# Copy package.json and package-lock.json for installing dependencies
COPY package*.json ./
#COPY ./restorani-api/package*.json ./
#COPY ./restorani-api/package*.json /usr/src/app/

# Install the dependencies
RUN npm install

# Copy the rest of your application code (unutar mape restorani-api)
COPY . .
#COPY ./restorani-api /usr/src/app
# Expose the port that your Node.js app listens on
EXPOSE 3000

# Start the Node.js application
CMD ["node", "server.js"]
