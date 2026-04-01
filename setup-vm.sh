#!/bin/bash

# Installation script for Azure VM
# Usage: curl -fsSL https://raw.githubusercontent.com/giuuulian/tp-d-ploiement/main/setup-vm.sh | bash

set -e

echo "🚀 Starting Azure VM setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Add user to docker group
echo "👤 Configuring Docker group..."
sudo usermod -aG docker azureuser

# Basic utilities
echo "🛠️ Installing utilities..."
sudo apt-get install -y curl wget git

# Clean up
echo "🧹 Cleaning up..."
sudo apt-get autoremove -y
sudo apt-get clean

echo "✅ Setup complete!"
echo ""
echo "⚠️  IMPORTANT: Please exit and reconnect to apply docker group changes:"
echo "  exit"
echo "  ssh -i your_key.pem azureuser@YOUR_VM_IP"
echo ""
echo "Then verify Docker works:"
echo "  docker ps"
