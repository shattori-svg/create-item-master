#!/bin/bash
# Cloud Run へデプロイ（Asia/Northeast1）
# 事前: gcloud ログイン済み、プロジェクト・リージョン設定済み
set -e

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${GCP_REGION:-asia-northeast1}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-item-master-create-dev}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "Project: ${PROJECT_ID}, Region: ${REGION}, Service: ${SERVICE_NAME}"
echo "Building and pushing: ${IMAGE_NAME}"

gcloud builds submit --tag "${IMAGE_NAME}" --project "${PROJECT_ID}"

echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_NAME}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --project "${PROJECT_ID}"

echo "Done. URL: https://${SERVICE_NAME}-${PROJECT_ID}.${REGION}.run.app/"
