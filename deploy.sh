#!/bin/bash

# Deploy script for Render
echo "Starting deployment process..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Run database migrations if needed
echo "Running database migrations..."
npm run db:push

echo "Deployment completed successfully!"