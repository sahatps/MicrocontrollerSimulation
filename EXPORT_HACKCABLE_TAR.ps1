param(
    [string]$ImageTag = "hackcable:latest",
    [string]$OutputTar = "hackcable.tar"
)

$ErrorActionPreference = "Stop"

Write-Host "Checking Docker daemon..."
docker info | Out-Null

Write-Host "Building production image: $ImageTag"
docker build -f Dockerfile.prod -t $ImageTag .

Write-Host "Saving image to tar: $OutputTar"
docker save -o $OutputTar $ImageTag

Write-Host ""
Write-Host "Done."
Write-Host "Created file: $OutputTar"
Write-Host "Upload this file to Google Drive."
