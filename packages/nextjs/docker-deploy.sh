#!/bin/bash

# Docker deployment script for betting server
set -e

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-your-dockerhub-username}"
IMAGE_NAME="${IMAGE_NAME:-betting-server}"
TAG="${TAG:-latest}"
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"

echo "🐳 Starting Docker deployment process..."
echo "Image: $FULL_IMAGE_NAME"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t $FULL_IMAGE_NAME .

# Test the image locally (optional)
echo "🧪 Testing the image..."
docker run --rm -d --name betting-server-test -p 3002:3001 $FULL_IMAGE_NAME

# Wait for the server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Health check
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    docker stop betting-server-test > /dev/null 2>&1 || true
    exit 1
fi

# Stop test container
docker stop betting-server-test > /dev/null 2>&1 || true

# Login to Docker Hub (you'll be prompted for credentials)
echo "🔐 Logging into Docker Hub..."
echo "Please enter your Docker Hub credentials:"
docker login

# Push the image to Docker Hub
echo "📤 Pushing image to Docker Hub..."
docker push $FULL_IMAGE_NAME

echo "🎉 Deployment complete!"
echo "Your image is now available at: $FULL_IMAGE_NAME"
echo ""
echo "To run the container:"
echo "docker run -p 3001:3001 $FULL_IMAGE_NAME"
echo ""
echo "Or use docker-compose:"
echo "docker-compose up -d" 