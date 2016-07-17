#!/bin/bash

set -o nounset
set -o errexit

ENVIRONMENT=$1
SIZES=$2

DESTINATION_BUCKET=""
if [ "$LAMBCI_BRANCH" == "master" ]; then
  DESTINATION_BUCKET=$AWS_LAMBDA_IMAGE_RESIZE_PRODUCTION_BUCKET
else
  DESTINATION_BUCKET=$AWS_LAMBDA_IMAGE_RESIZE_STAGING_BUCKET
fi

BRANCH=`echo ${LAMBCI_BRANCH//\//_}`
VERSION="$ENVIRONMENT-$BRANCH-$LAMBCI_BUILD_NUM"

echo ""
echo "Preparing config.json"
cp _config.json config.json

echo "Destination bucket: $DESTINATION_BUCKET"
sed -i "s/DESTINATION_BUCKET/$DESTINATION_BUCKET/g" config.json

echo "Sizes: $SIZES"
sed -i "s/SIZES/$SIZES/g" config.json

echo "Creating deploy.env file"
echo "RAYGUN_API_KEY=$RAYGUN_API_KEY" >> deploy.env

echo ""
echo "Deploying to $ENVIRONMENT"
./node_modules/node-lambda/bin/node-lambda deploy \
  --description "Resize uploaded images to $SIZES on $DESTINATION_BUCKET" \
  --environment "$ENVIRONMENT" \
  --timeout 60 \
  --memorySize 1024 \
  --accessKey "$AWS_LAMBDA_DEPLOY_ACCESS_KEY_ID" \
  --secretKey "$AWS_LAMBDA_DEPLOY_ACCESS_KEY_SECRET" \
  --functionName "${ENVIRONMENT}-resize-on-upload" \
  --handler index.handler \
  --region "$AWS_LAMBDA_IMAGE_RESIZE_REGION" \
  --role "$AWS_LAMBDA_IMAGE_RESIZE_ROLE" \
  --runtime "nodejs4.3" \
  --description "Creates resized copies of images on $DESTINATION_BUCKET when uploads occur" \
  --configFile deploy.env
