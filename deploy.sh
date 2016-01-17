#!/bin/bash

set -e

ENVIRONMENT=$1

echo ""
echo "Installing awscli"
sudo pip install --upgrade docker-py\<1.2 requests\<2.7 awscli

# Copy _config.json

# Replace %%DESTIONATION_BUCKET%%, %%SIZES%% from env vars

# Deploy to lambda
