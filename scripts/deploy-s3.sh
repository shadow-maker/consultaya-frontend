#!/usr/bin/env bash
# Build del frontend + sync a S3 + invalidación de CloudFront.
# Uso: scripts/deploy-s3.sh <bucket> <distribution_id>
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || $# -ne 2 ]]; then
  cat <<'AYUDA'
Uso: scripts/deploy-s3.sh <bucket> <distribution_id>

  bucket           nombre del bucket de S3 (sin s3://)
  distribution_id  ID de la distribución de CloudFront

Requiere AWS CLI configurada (aws sts get-caller-identity) y Node >= 20.
AYUDA
  [[ $# -eq 2 ]] && exit 0 || exit 1
fi

BUCKET="$1"
DISTRIBUCION="$2"
cd "$(dirname "$0")/.."

echo "==> npm ci && npm run build"
npm ci
npm run build

echo "==> Subiendo assets con caché larga"
aws s3 sync dist/ "s3://${BUCKET}" --delete --exclude index.html \
  --cache-control "public,max-age=31536000,immutable"

echo "==> Subiendo index.html sin caché"
aws s3 cp dist/index.html "s3://${BUCKET}/index.html" --cache-control "no-cache"

# sql.js: el .wasm debe salir con el tipo correcto o el navegador no lo compila en streaming.
for wasm in dist/assets/*.wasm; do
  [[ -e "$wasm" ]] || continue
  echo "==> Fijando Content-Type de $(basename "$wasm")"
  aws s3 cp "$wasm" "s3://${BUCKET}/assets/$(basename "$wasm")" \
    --content-type application/wasm --cache-control "public,max-age=31536000,immutable"
done

echo "==> Invalidando CloudFront"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUCION" --paths "/index.html" "/"
echo "Listo."
