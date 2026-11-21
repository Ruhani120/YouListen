#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 24.04 EC2 instance: Docker, Docker Compose and a swap file.
set -euo pipefail

sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2 git
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

# 2 GB swap so the Maven / npm builds don't run out of memory on a small instance
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "Done. Log out and back in once so the docker group takes effect."
