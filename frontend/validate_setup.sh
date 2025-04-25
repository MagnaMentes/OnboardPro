#!/bin/bash
echo "Checking Docker..."
docker --version || { echo "Docker not installed"; exit 1; }

echo "Checking onboardpro.db..."
[ -f /app/backend/onboardpro.db ] || { echo "onboardpro.db missing"; exit 1; }

echo "Checking npm dependencies..."
npm list react react-router-dom tailwindcss @heroicons/react || { echo "Install dependencies"; exit 1; }

echo "Setup valid!"