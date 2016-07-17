# lambda-resize
![LambCI](https://lambci-buildresults-h8k26bznx73q.s3.amazonaws.com/gh/66pix/lambda-resize/branches/develop/195466ab1ebc68866a15203a033a112b.svg)

Resizes images and puts them in a matching directory on the given bucket, suffixing them with the resized width. Also creates @2x variants.

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

## Output

For an image with the key `/kittens/cute.jpg` at bucket `kittens-originals` and the following
`config.json`:

```JSON
{
  "destinationBucket": "kittens-resized",
  "sizes": [
    88, 100, 1024
  ]
}
```

The function will create the following resized files in the `kittens-resized` bucket:

```PLAIN
/kittens-resized/cute.w88.jpg
/kittens-resized/cute.w88.@2x.jpg
/kittens-resized/cute.w100.jpg
/kittens-resized/cute.w100.@2x.jpg
/kittens-resized/cute.w1024.jpg
/kittens-resized/cute.w1024.@2x.jpg
```
