#!/bin/bash

set -o nounset
set -o errexit

ln -s /usr/local/lib64/node-v4.3.x/bin/npm /usr/local/bin/npm
ln -s /usr/local/lib64/node-v4.3.x/bin/node /usr/local/bin/node

npm run nsp
npm run lint
npm run test

if [ "$LAMBCI_BRANCH" != "develop" ] && [ "$LAMBCI_BRANCH" != "master" ]; then
  echo "Deployment only triggered for develop or master, build was for $LAMBCI_BRANCH"
  exit 0
fi

ENVIRONMENT="staging"
if [ -z "$LAMBCI_PULL_REQUEST" ] && [ "$LAMBCI_BRANCH" == "master" ]; then
  ENVIRONMENT="production"
fi

./deploy.sh "$ENVIRONMENT" "80,88,100,300,500"
