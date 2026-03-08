param(
  [string]$BaseUrl = "https://refatishere.free.nf",
  [string]$LegacyToken = "",
  [string]$CryptoToken = "",
  [string]$SidecarToken = ""
)

function Step($msg) { Write-Host ("`n==> " + $msg) }

Step "Check root pages"
Invoke-WebRequest -Uri "$BaseUrl/" -Method Get -TimeoutSec 30 | Out-Null
Invoke-WebRequest -Uri "$BaseUrl/resources.html" -Method Get -TimeoutSec 30 | Out-Null

Step "Check legacy health"
Invoke-RestMethod -Uri "$BaseUrl/api/health.php" -Method Get -TimeoutSec 30 | ConvertTo-Json -Depth 8

Step "Check crypto health"
Invoke-RestMethod -Uri "$BaseUrl/crypto/backend/health.php" -Method Get -TimeoutSec 30 | ConvertTo-Json -Depth 8

if ($CryptoToken) {
  Step "Check crypto kline fetch"
  Invoke-RestMethod -Uri "$BaseUrl/crypto/backend/api.php?action=klines" -Headers @{ "X-API-Token" = $CryptoToken } -Method Post -Body (@{ symbol="BTCUSDT"; interval="15m"; limit=100 } | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 30 | ConvertTo-Json -Depth 8
  Step "Check sidecar health through backend"
  Invoke-RestMethod -Uri "$BaseUrl/crypto/backend/api.php?action=sidecar-health" -Headers @{ "X-API-Token" = $CryptoToken } -Method Post -Body "{}" -ContentType "application/json" -TimeoutSec 30 | ConvertTo-Json -Depth 8
}

if ($LegacyToken) {
  Step "Check protected legacy trades"
  Invoke-RestMethod -Uri "$BaseUrl/api/trades.php?page=1&limit=2" -Headers @{ "X-API-Token" = $LegacyToken } -Method Get -TimeoutSec 30 | ConvertTo-Json -Depth 8
}

Write-Host "`nDeployment checklist completed."
