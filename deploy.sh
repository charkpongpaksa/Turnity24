#!/bin/bash
set -e

echo "🚀 Starting Turnity Deployment Helper..."

# 1. Build Backend
echo "📦 Building Backend..."
cd backend
sam build

# 2. Deploy Backend
echo "☁️ Deploying Backend to AWS..."
echo "Note: If this is the first time, use 'sam deploy --guided'"
sam deploy

# 3. Get Outputs
echo "🔍 Fetching Stack Outputs..."
STACK_NAME=$(grep stack_name samconfig.toml | cut -d'=' -f2 | tr -d '" ' || echo "turnity-backend")
FRONTEND_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text)
FRONTEND_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" --output text)

if [ -z "$FRONTEND_BUCKET" ] || [ "$FRONTEND_BUCKET" == "None" ]; then
  echo "❌ Error: Could not find FrontendBucketName in stack outputs. Please ensure you have deployed successfully."
  exit 1
fi

# 4. Upload Frontend
echo "⬆️ Uploading Frontend to S3 ($FRONTEND_BUCKET)..."
cd ..
npm run build
aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete

echo "✅ Deployment Complete!"
echo "🌐 Your app is live at: $FRONTEND_URL"
