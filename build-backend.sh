#!/bin/bash
# Build script for backend - Coolify'da kullanın
# Coolify'da: Build Script = "bash build-backend.sh"

# Backend klasörüne git
cd backend

# Docker build
docker build -f Dockerfile -t backend:latest .

# Backend klasöründen çık
cd ..
