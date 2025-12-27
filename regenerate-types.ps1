# Script de regeneration des types Supabase
# Project: anodesfypwifqxpsqmpt

$ErrorActionPreference = "Stop"
$projectId = "anodesfypwifqxpsqmpt"
$typesFile = "types/database.types.ts"
$backupFile = "types/database.types.ts.backup"

Write-Host "Regeneration des types Supabase..." -ForegroundColor Cyan
Write-Host ""

# 1. Backup du fichier actuel
Write-Host "Etape 1: Backup du fichier actuel..." -ForegroundColor Yellow
if (Test-Path $typesFile) {
    Copy-Item $typesFile $backupFile -Force
    Write-Host "OK - Backup cree: $backupFile" -ForegroundColor Green
} else {
    Write-Host "Avertissement - Fichier actuel non trouve" -ForegroundColor Yellow
}

# 2. Verification Supabase CLI
Write-Host ""
Write-Host "Etape 2: Verification Supabase CLI..." -ForegroundColor Yellow

$useNpx = $false
try {
    $version = supabase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Supabase CLI trouve: $version" -ForegroundColor Green
    } else {
        throw "Not found"
    }
} catch {
    Write-Host "Essai avec npx..." -ForegroundColor Yellow
    $version = npx supabase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK - Supabase CLI trouve via npx: $version" -ForegroundColor Green
        $useNpx = $true
    } else {
        Write-Host "ERREUR - Supabase CLI non trouve" -ForegroundColor Red
        Write-Host "   Installez-le via: scoop install supabase" -ForegroundColor Yellow
        Write-Host "   Ou utilisez: npx supabase (sera installe automatiquement)" -ForegroundColor Yellow
        exit 1
    }
}

# 3. Suppression de l'ancien fichier
Write-Host ""
Write-Host "Etape 3: Suppression de l'ancien fichier..." -ForegroundColor Yellow
if (Test-Path $typesFile) {
    Remove-Item $typesFile -Force
    Write-Host "OK - Ancien fichier supprime" -ForegroundColor Green
}

# 4. Creation du dossier types
Write-Host ""
Write-Host "Etape 4: Verification du dossier types..." -ForegroundColor Yellow
$typesDir = Split-Path $typesFile -Parent
if (-not (Test-Path $typesDir)) {
    New-Item -ItemType Directory -Path $typesDir -Force | Out-Null
    Write-Host "OK - Dossier cree: $typesDir" -ForegroundColor Green
}

# 5. Generation des types
Write-Host ""
Write-Host "Etape 5: Generation des types depuis Supabase..." -ForegroundColor Yellow
Write-Host "   Project ID: $projectId" -ForegroundColor Gray
Write-Host ""

if ($useNpx) {
    Write-Host "   Utilisation de: npx supabase gen types..." -ForegroundColor Gray
    npx supabase gen types typescript --project-id $projectId --schema public > $typesFile 2>&1
} else {
    Write-Host "   Utilisation de: supabase gen types..." -ForegroundColor Gray
    supabase gen types typescript --project-id $projectId --schema public > $typesFile 2>&1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR lors de la generation" -ForegroundColor Red
    $errorOutput = Get-Content $typesFile -ErrorAction SilentlyContinue
    if ($errorOutput) {
        Write-Host "   Erreur:" -ForegroundColor Red
        Write-Host $errorOutput -ForegroundColor Red
    }
    
    if ($errorOutput -match "Access token" -or $errorOutput -match "login") {
        Write-Host ""
        Write-Host "SOLUTION - Connexion requise:" -ForegroundColor Yellow
        Write-Host "   1. Ouvrez un terminal interactif (cmd ou PowerShell)" -ForegroundColor Gray
        Write-Host "   2. Executez: supabase login" -ForegroundColor Gray
        Write-Host "   3. Relancez ce script" -ForegroundColor Gray
    }
    exit 1
}

# 6. Validation du fichier genere
Write-Host ""
Write-Host "Etape 6: Validation du fichier genere..." -ForegroundColor Yellow

if (-not (Test-Path $typesFile)) {
    Write-Host "ERREUR - Le fichier n'a pas ete cree!" -ForegroundColor Red
    exit 1
}

$fileContent = Get-Content $typesFile -Raw -Encoding UTF8
if ([string]::IsNullOrWhiteSpace($fileContent)) {
    Write-Host "ERREUR - Le fichier est vide!" -ForegroundColor Red
    exit 1
}

if ($fileContent -notmatch "export (interface|type) Database") {
    Write-Host "ERREUR - Le fichier ne contient pas 'export type Database' ou 'export interface Database'" -ForegroundColor Red
    Write-Host "   Contenu (premiers 500 caracteres):" -ForegroundColor Yellow
    $preview = $fileContent.Substring(0, [Math]::Min(500, $fileContent.Length))
    Write-Host $preview -ForegroundColor Gray
    exit 1
}

Write-Host "OK - Fichier valide (contient 'export type Database')" -ForegroundColor Green

# 7. Verification de l'encodage UTF-8
Write-Host ""
Write-Host "Etape 7: Verification de l'encodage UTF-8..." -ForegroundColor Yellow

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Resolve-Path $typesFile), $fileContent, $utf8NoBom)

Write-Host "OK - Encodage UTF-8 verifie et applique" -ForegroundColor Green

# 8. Resume
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "REGENERATION TERMINEE AVEC SUCCES!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fichier genere: $typesFile" -ForegroundColor White
Write-Host "Backup: $backupFile" -ForegroundColor White
$fileSize = (Get-Item $typesFile).Length
Write-Host "Taille: $fileSize octets" -ForegroundColor White
Write-Host ""
