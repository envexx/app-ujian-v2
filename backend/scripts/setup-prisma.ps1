# Setup Prisma symlink for backend
# Run this script as Administrator in PowerShell

$backendDir = Split-Path -Parent $PSScriptRoot
$rootDir = Split-Path -Parent $backendDir
$prismaSource = Join-Path $rootDir "prisma"
$prismaTarget = Join-Path $backendDir "prisma"

# Check if symlink already exists
if (Test-Path $prismaTarget) {
    Write-Host "Prisma folder already exists at $prismaTarget"
    $item = Get-Item $prismaTarget
    if ($item.LinkType -eq "SymbolicLink") {
        Write-Host "It's already a symlink. Skipping..."
    } else {
        Write-Host "WARNING: It's not a symlink. Please remove it manually and run this script again."
    }
} else {
    # Create symlink
    Write-Host "Creating symlink from $prismaSource to $prismaTarget"
    New-Item -ItemType SymbolicLink -Path $prismaTarget -Target $prismaSource
    Write-Host "Symlink created successfully!"
}

# Generate Prisma client
Write-Host "Generating Prisma client..."
Set-Location $backendDir
npx prisma generate
Write-Host "Done!"
