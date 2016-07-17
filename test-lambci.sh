#!/bin/bash

set -o nounset
set -o errexit

npm run nsp
npm run lint
npm run test

if [ "$LAMBCI_BRANCH" != "develop" ] && [ "$LAMBCI_BRANCH" != "master" ]; then
  echo "Deployment only triggered for develop or master, build was for $LAMBCI_BRANCH"
  exit 0
fi

./deploy.sh "$LAMBCI_BRANCH" "80,88,100,300,500"
