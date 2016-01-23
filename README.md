# lambda-resize
[![Circle CI](https://circleci.com/gh/66pix/lambda-resize.svg?style=svg)](https://circleci.com/gh/66pix/lambda-resize)

Resizes images and puts them in a matching directory on the given bucket, suffixing them with the resized width

## Usage

```sh
export SIZES="88,100"
export ENVIRONMENT="staging"
export DESTINATION_BUCKET="destination_bucket"
node-lambda deploy \
  --description "Resize uploaded images to $SIZES on $DESTINATION_BUCKET" \
  --environment "$ENVIRONMENT" \
  --accessKey "AWS_KEY" \
  --secretKey "AWS_SECRET" \
  --functionName "${ENVIRONMENT}-resize-on-upload" \
  --handler index.handler \
  --role "AWS_LAMBDA_ARN" \
  --description "Creates resized copies of images on $DESTINATION_BUCKET when uploads occur"<Paste>
```

## Usage in CI/CD

This function is designed to be deployed from a CD pipeline such as CircleCi. See the `deploy.sh` script for the expected environment variables.export SIZES="88,100"
