$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "==> Установка Finance..."
npm run install:all

if (-not (Test-Path "server\.env")) {
  if (Test-Path "server\.env.example") {
    Copy-Item "server\.env.example" "server\.env"
  }
  Write-Host "Создан server\.env — при необходимости отредактируйте"
}

Write-Host "==> Сборка клиента..."
npm run build

Write-Host ""
Write-Host "Готово! Запуск:"
Write-Host "  npm run dev          — разработка"
Write-Host "  docker compose up    — production в Docker"
Write-Host "  npm run tauri:dev    — десктоп (Windows/macOS)"
