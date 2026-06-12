#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Установка Finance..."
npm run install:all

if [ ! -f server/.env ]; then
  cp server/.env.example server/.env 2>/dev/null || true
  echo "Создан server/.env — при необходимости отредактируйте"
fi

echo "==> Сборка клиента..."
npm run build

echo ""
echo "Готово! Запуск:"
echo "  npm run dev          — разработка (клиент + сервер)"
echo "  docker compose up    — production в Docker"
echo "  npm run tauri:dev    — десктоп (Windows/macOS)"
echo "  npm run cap:sync     — мобильные (iOS/Android)"
