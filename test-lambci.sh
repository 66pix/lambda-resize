#!/bin/bash

set -o nounset
set -o errexit

ln -s /usr/local/lib64/node-v4.3.x/bin/npm /usr/local/bin/npm
ln -s /usr/local/lib64/node-v4.3.x/bin/node /usr/local/bin/node

/usr/local/lib64/node-v4.3.x/bin/npm run nsp
/usr/local/lib64/node-v4.3.x/bin/npm run lint
/usr/local/lib64/node-v4.3.x/bin/npm run test

if [ "$LAMBCI_BRANCH" != "develop" ] && [ "$LAMBCI_BRANCH" != "master" ]; then
  echo "Deployment only triggered for develop or master, build was for $LAMBCI_BRANCH"
  exit 0
fi

ENVIRONMENT="staging"
if [ "$LAMBCI_BRANCH" == "master" ]; then
  ENVIRONMENT="production"
fi

./deploy.sh "$LAMBCI_BRANCH" "80,88,100,300,500"
