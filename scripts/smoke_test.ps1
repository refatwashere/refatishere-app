param(
  [string]$BaseUrl = "https://refatishere.free.nf",
  [string]$LegacyToken = "",
  [string]$CryptoToken = "",
  [string]$SidecarToken = ""
)

function Invoke-JsonPost {
  param([string]$Url, [hashtable]$Headers, [hashtable]$Body)
  Write-Host "POST $Url"
  $resp = Invoke-RestMethod -Uri $Url -Headers $Headers -Method Post -Body ($Body | ConvertTo-Json -Depth 8) -ContentType "application/json" -TimeoutSec 30
  $resp | ConvertTo-Json -Depth 8
}

Write-Host "Checking legacy health"
Invoke-RestMethod -Uri "$BaseUrl/api/health.php" -Method Get -TimeoutSec 30 | ConvertTo-Json -Depth 8

Write-Host "Checking crypto health"
Invoke-RestMethod -Uri "$BaseUrl/crypto/backend/health.php" -Method Get -TimeoutSec 30 | ConvertTo-Json -Depth 8

if ($CryptoToken) {
  Invoke-JsonPost "$BaseUrl/crypto/backend/api.php?action=klines" @{ "X-API-Token" = $CryptoToken } @{ symbol = "BTCUSDT"; interval = "15m"; limit = 100 }
}

if ($LegacyToken) {
  Invoke-RestMethod -Uri "$BaseUrl/api/trades.php?page=1&limit=2" -Headers @{ "X-API-Token" = $LegacyToken } -Method Get -TimeoutSec 30 | ConvertTo-Json -Depth 8
}

Write-Host "Smoke checks finished."
