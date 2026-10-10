#!/usr/bin/env bash
# Runs on Hostinger after each upload. If php -v is below 8.2 set PHP_BIN=/opt/alt/php83/usr/bin/php
set -e
PHP_BIN="${PHP_BIN:-php}"
cd "$(dirname "$0")/.."

mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions \
         storage/framework/views storage/logs bootstrap/cache public/uploads

if [ ! -f .env ]; then
  echo "ERROR: .env missing in $(pwd). Create it once, then re-run the deploy."
  exit 1
fi

$PHP_BIN artisan down --retry=15 || true
$PHP_BIN artisan migrate --force
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:clear
$PHP_BIN artisan up
echo "Deploy finished: $(date)"
