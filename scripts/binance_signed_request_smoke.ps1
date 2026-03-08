param(
  [string]$BaseUrl = "https://refatishere.free.nf",
  [string]$CryptoToken = "",
  [string]$ApiKey = "",
  [string]$ApiSecret = "",
  [switch]$UseTestnet
)

if (-not $CryptoToken) { throw "CryptoToken required" }

$headers = @{ "X-API-Token" = $CryptoToken }

Write-Host "Preview signed order request"
$body = @{
  apiKey = $ApiKey
  apiSecret = $ApiSecret
  useTestnet = [bool]$UseTestnet
  recvWindow = 5000
  symbol = "BTCUSDT"
  side = "BUY"
  type = "LIMIT"
  quantity = 0.001
  price = 10000
  dryRun = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BaseUrl/crypto/backend/api.php?action=order" -Headers $headers -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30 | ConvertTo-Json -Depth 10
