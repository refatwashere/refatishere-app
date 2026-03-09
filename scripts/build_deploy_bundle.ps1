param(
  [string]$OutputDir = "output/deploy-package",
  [switch]$Clean,
  [switch]$IncludeDocs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedOutputDir = if ([System.IO.Path]::IsPathRooted($OutputDir)) {
  $OutputDir
} else {
  Join-Path $repoRoot $OutputDir
}

$infinityFreeDir = Join-Path $resolvedOutputDir "upload-to-infinityfree-htdocs"
$docsDir = Join-Path $resolvedOutputDir "optional-upload-public-docs"
$sidecarDir = Join-Path $resolvedOutputDir "upload-to-vercel-sidecar"

$siteFiles = @(
  "index.html",
  "about.html",
  "projects.html",
  "resources.html",
  "contact.html",
  "Tradejournal.html",
  "mom.html",
  "mem.html",
  "memory.html",
  "style.css",
  "script.js"
)

$siteDirectories = @("images", "resources")

function Resolve-SourceRoot {
  param(
    [string]$PreferredRelativePath,
    [string]$FallbackRelativePath,
    [string]$SentinelPath
  )

  $preferred = Join-Path $repoRoot $PreferredRelativePath
  if (Test-Path (Join-Path $preferred $SentinelPath)) {
    return $preferred
  }

  return (Join-Path $repoRoot $FallbackRelativePath)
}

function Ensure-Directory {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Ensure-ParentDirectory {
  param([string]$Path)
  $parent = Split-Path -Parent $Path
  if ($parent) {
    Ensure-Directory -Path $parent
  }
}

function Copy-FileIntoBundle {
  param(
    [string]$SourceRoot,
    [string]$RelativePath,
    [string]$DestinationRoot
  )

  $sourcePath = Join-Path $SourceRoot $RelativePath
  if (-not (Test-Path $sourcePath -PathType Leaf)) {
    throw "Required file not found: $sourcePath"
  }

  $destinationPath = Join-Path $DestinationRoot $RelativePath
  Ensure-ParentDirectory -Path $destinationPath
  Copy-Item -Path $sourcePath -Destination $destinationPath -Force
}

function Copy-DirectoryIntoBundle {
  param(
    [string]$SourceRoot,
    [string]$RelativePath,
    [string]$DestinationRoot
  )

  $sourcePath = Join-Path $SourceRoot $RelativePath
  if (-not (Test-Path $sourcePath -PathType Container)) {
    throw "Required directory not found: $sourcePath"
  }

  $destinationPath = Join-Path $DestinationRoot $RelativePath
  Ensure-ParentDirectory -Path $destinationPath
  if (Test-Path $destinationPath) {
    Remove-Item -Path $destinationPath -Recurse -Force
  }
  Copy-Item -Path $sourcePath -Destination $destinationPath -Recurse -Force
}

function Copy-DirectoryContentsIntoBundle {
  param(
    [string]$SourceRoot,
    [string]$DestinationRoot
  )

  if (-not (Test-Path $SourceRoot -PathType Container)) {
    throw "Required directory not found: $SourceRoot"
  }

  Ensure-Directory -Path $DestinationRoot
  Get-ChildItem -Path $SourceRoot -Force | ForEach-Object {
    $destinationPath = Join-Path $DestinationRoot $_.Name
    if (Test-Path $destinationPath) {
      Remove-Item -Path $destinationPath -Recurse -Force
    }
    Copy-Item -Path $_.FullName -Destination $destinationPath -Recurse -Force
  }
}

$sourceRoots = [ordered]@{
  site = Resolve-SourceRoot -PreferredRelativePath "apps/site" -FallbackRelativePath "." -SentinelPath "index.html"
  legacyApi = Resolve-SourceRoot -PreferredRelativePath "apps/legacy-api" -FallbackRelativePath "api" -SentinelPath "health.php"
  crypto = Resolve-SourceRoot -PreferredRelativePath "apps/crypto" -FallbackRelativePath "crypto" -SentinelPath "crypto.html"
  plannerSidecar = Resolve-SourceRoot -PreferredRelativePath "apps/planner-sidecar" -FallbackRelativePath "vercel-sidecar" -SentinelPath "package.json"
}

if ($Clean -and (Test-Path $resolvedOutputDir)) {
  Remove-Item -Path $resolvedOutputDir -Recurse -Force
}

Ensure-Directory -Path $resolvedOutputDir
Ensure-Directory -Path $infinityFreeDir
Ensure-Directory -Path $sidecarDir
if ($IncludeDocs) {
  Ensure-Directory -Path $docsDir
} elseif (Test-Path $docsDir) {
  Remove-Item -Path $docsDir -Recurse -Force
}

foreach ($file in $siteFiles) {
  Copy-FileIntoBundle -SourceRoot $sourceRoots.site -RelativePath $file -DestinationRoot $infinityFreeDir
}

foreach ($directory in $siteDirectories) {
  Copy-DirectoryIntoBundle -SourceRoot $sourceRoots.site -RelativePath $directory -DestinationRoot $infinityFreeDir
}

Copy-DirectoryIntoBundle -SourceRoot (Split-Path $sourceRoots.legacyApi -Parent) -RelativePath (Split-Path $sourceRoots.legacyApi -Leaf) -DestinationRoot $infinityFreeDir
Copy-DirectoryIntoBundle -SourceRoot (Split-Path $sourceRoots.crypto -Parent) -RelativePath (Split-Path $sourceRoots.crypto -Leaf) -DestinationRoot $infinityFreeDir

if ($IncludeDocs) {
  Copy-DirectoryIntoBundle -SourceRoot $repoRoot -RelativePath "docs" -DestinationRoot $docsDir
}

Copy-DirectoryContentsIntoBundle -SourceRoot $sourceRoots.plannerSidecar -DestinationRoot $sidecarDir

$manifest = [ordered]@{
  generated_at = (Get-Date).ToString("o")
  output_dir = $resolvedOutputDir
  upload_targets = @(
    @{
      name = "infinityfree"
      destination = "htdocs/"
      source_dir = $infinityFreeDir
      includes = @(
        "*.html",
        "style.css",
        "script.js",
        "images/",
        "resources/",
        "api/",
        "crypto/"
      )
    },
    @{
      name = "public-docs-optional"
      destination = "htdocs/docs/"
      source_dir = if ($IncludeDocs) { $docsDir } else { $null }
      includes = if ($IncludeDocs) { @("docs/") } else { @() }
    },
    @{
      name = "vercel-sidecar"
      destination = "Vercel project root"
      source_dir = $sidecarDir
      includes = @(
        "api/",
        "config.js",
        "marketData.js",
        "package.json",
        "pancakeswapAiAdapter.js",
        "vercel.json"
      )
    }
  )
  source_roots = $sourceRoots
  preserved_public_paths = @(
    "/index.html",
    "/about.html",
    "/projects.html",
    "/resources.html",
    "/contact.html",
    "/Tradejournal.html",
    "/mom.html",
    "/mem.html",
    "/memory.html",
    "/style.css",
    "/script.js",
    "/images/*",
    "/resources/*",
    "/api/*",
    "/crypto/*"
  )
}

$manifestPath = Join-Path $resolvedOutputDir "deploy-manifest.json"
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath

Write-Host "Deploy package ready at $resolvedOutputDir"
Write-Host "InfinityFree upload folder: $infinityFreeDir"
if ($IncludeDocs) {
  Write-Host "Optional public docs folder: $docsDir"
}
Write-Host "Vercel sidecar folder: $sidecarDir"
