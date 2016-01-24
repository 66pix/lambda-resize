#!/bin/bash

set -e

ENVIRONMENT=$1
SIZES=$2

DESTINATION_BUCKET=""
if [ "$ENVIRONMENT" == "master" ]; then
  DESTINATION_BUCKET=$PRODUCTION_BUCKET
else
  DESTINATION_BUCKET=$STAGING_BUCKET
fi

BRANCH=`echo ${CIRCLE_BRANCH//\//_}`
VERSION="$ENVIRONMENT-$BRANCH-$CIRCLE_BUILD_NUM"

echo ""
echo "Preparing config.json"
cp _config.json config.json

echo "Destination bucket: $DESTINATION_BUCKET"
sed -i "s/DESTINATION_BUCKET/$DESTINATION_BUCKET/g" config.json

echo "Sizes: $SIZES"
sed -i "s/SIZES/$SIZES/g" config.json

echo ""
echo "Deploying to $ENVIRONMENT"
./node_modules/node-lambda/bin/node-lambda deploy \
  --description "Resize uploaded images to $SIZES on $DESTINATION_BUCKET" \
  --environment "$ENVIRONMENT" \
  --timeout 10 \
  --accessKey "$AWS_KEY" \
  --secretKey "$AWS_SECRET" \
  --functionName "${ENVIRONMENT}-resize-on-upload" \
  --handler index.handler \
  --region "$AWS_REGION" \
  --role "$AWS_LAMBDA_ARN" \
  --description "Creates resized copies of images on $DESTINATION_BUCKET when uploads occur"
