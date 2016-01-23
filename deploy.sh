#!/bin/bash

set -e

ENVIRONMENT=$1
SIZES=$2

DESTINATION_BUCKET=""
if ($ENVIRONMENT === "master"); then
  DESTINATION_BUCKET=$PRODUCTION_BUCKET
else
  DESTINATION_BUCKET=$STAGING_BUCKET
fi

echo ""
echo "Installing awscli"
sudo pip install --upgrade awscli

echo ""
echo "Installing node-lambda"
npm install -g node-lambda

echo ""
echo "Preparing config.json"
cp _config.json config.json
sed -i "s/DESTINATION_BUCKET/$DESTINATION_BUCKET/g" config.json
sed -i "s/SIZES/$SIZES/g" config.json

echo ""
echo "Deploying to {$ENVIRONMENT}"
node-lambda \
  --environment "$ENVIRONMENT" \
  --accessKey $AWS_KEY \
  --secretKey $AWS_SECRET \
  --region ap-southeast-2 \
  --functionName resize-on-upload \
  --handler index.handler \
  # --role "$AWS_LAMBDA_ARN "\
  --description "Creates resized copies of images on $DESTINATION_BUCKET when uploads occur"



# Deploy to lambda
