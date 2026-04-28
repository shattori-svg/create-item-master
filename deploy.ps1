# Cloud Run へデプロイ（Asia/Northeast1）
# 事前: gcloud ログイン済み、プロジェクト設定済み
# 実行: .\deploy.ps1  または  $env:GCP_PROJECT_ID="your-project"; .\deploy.ps1

$ErrorActionPreference = "Stop"

$ProjectId = if ($env:GCP_PROJECT_ID) { $env:GCP_PROJECT_ID } else { gcloud config get-value project 2>$null }
$Region = if ($env:GCP_REGION) { $env:GCP_REGION } else { "asia-northeast1" }
$ServiceName = if ($env:CLOUD_RUN_SERVICE) { $env:CLOUD_RUN_SERVICE } else { "item-master-create-dev" }
$ImageName = "gcr.io/$ProjectId/$ServiceName"

Write-Host "Project: $ProjectId, Region: $Region, Service: $ServiceName"
Write-Host "Building and pushing: $ImageName"

gcloud builds submit --tag $ImageName --project $ProjectId

Write-Host "Deploying to Cloud Run..."
$DeployArgs = @(
  "run", "deploy", $ServiceName,
  "--image", $ImageName,
  "--region", $Region,
  "--platform", "managed",
  "--allow-unauthenticated",
  "--project", $ProjectId
)
if ($env:GCS_EXPORTS_BUCKET) {
  $DeployArgs += @("--update-env-vars", "GCS_EXPORTS_BUCKET=$($env:GCS_EXPORTS_BUCKET)")
}
& gcloud @DeployArgs

Write-Host "Done. Check the service URL in the console or: gcloud run services describe $ServiceName --region $Region --format='value(status.url)'"
