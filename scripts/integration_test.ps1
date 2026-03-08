param(
  [string]$BaseUrl = "https://refatishere.free.nf",
  [string]$CryptoToken = "",
  [string]$SidecarToken = ""
)

Write-Host "Integration test scaffold"
if ($CryptoToken) {
  Write-Host "Planner-intent local Binance test"
}
if ($SidecarToken) {
  Write-Host "Direct sidecar planner test"
}
