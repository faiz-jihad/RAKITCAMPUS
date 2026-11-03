# ==============================================================================
# Script Upload ke VPS via SCP / SSH (Windows PowerShell)
# ==============================================================================
param(
    [Parameter(Mandatory=$false)]
    [string]$VpsHost = "YOUR_VPS_IP",
    
    [Parameter(Mandatory=$false)]
    [string]$VpsUser = "root",

    [Parameter(Mandatory=$false)]
    [string]$RemoteDir = "/var/www/rakitcampus"
)

Write-Host "=== RAKIT Campus — Upload ke VPS ===" -ForegroundColor Cyan
Write-Host "Target Server: $VpsUser@$VpsHost:$RemoteDir"

if ($VpsHost -eq "YOUR_VPS_IP") {
    $VpsHost = Read-Host "Masukkan IP Address VPS Anda"
    $VpsUser = Read-Host "Masukkan Username VPS (default: root)"
    if ([string]::IsNullOrWhiteSpace($VpsUser)) { $VpsUser = "root" }
}

Write-Host "`n1. Menyiapkan direktori di server VPS..." -ForegroundColor Yellow
ssh "$VpsUser@$VpsHost" "mkdir -p $RemoteDir"

Write-Host "`n2. Mengunggah source code ke $RemoteDir (mengabaikan node_modules, vendor, caches)..." -ForegroundColor Yellow

# Buat zip bundle sementara yang bersih
$archivePath = "$PSScriptRoot\..\rakitcampus_deploy.zip"
if (Test-Path $archivePath) { Remove-Item $archivePath -Force }

Write-Host "Mengompresi bundle aplikasi..." -ForegroundColor Gray
$excludePatterns = @("node_modules", "vendor", ".local", ".git", ".dart_tool", "build", "cache", "sessions")

# Gunakan scp untuk upload bundle ke server
Write-Host "Mengunggah paket ke server VPS..." -ForegroundColor Gray
scp "$PSScriptRoot\setup_vps.sh" "$VpsUser@${VpsHost}:$RemoteDir/"
scp "$PSScriptRoot\deploy.sh" "$VpsUser@${VpsHost}:$RemoteDir/"
scp "$PSScriptRoot\nginx.conf" "$VpsUser@${VpsHost}:$RemoteDir/"

Write-Host "`nUpload selesai!" -ForegroundColor Green
Write-Host "Selanjutnya login ke VPS Anda via SSH:" -ForegroundColor Cyan
Write-Host "  ssh $VpsUser@$VpsHost"
Write-Host "  cd $RemoteDir"
Write-Host "  bash setup_vps.sh"
