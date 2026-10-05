<#
.SYNOPSIS
  Build del frontend + sync a S3 + invalidacion de CloudFront (equivalente de deploy-s3.sh).

.DESCRIPTION
  Uso: scripts\deploy-s3.ps1 <bucket> <distribution_id>
  Requiere AWS CLI configurada (aws sts get-caller-identity) y Node >= 20.
  Compatible con Windows PowerShell 5.1 y PowerShell 7.

.PARAMETER Bucket
  Nombre del bucket de S3 (sin s3://).

.PARAMETER DistributionId
  ID de la distribucion de CloudFront.

.PARAMETER Help
  Muestra esta ayuda.
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)][string]$Bucket,
    [Parameter(Position = 1)][string]$DistributionId,
    [Alias('h')][switch]$Help
)

$ErrorActionPreference = 'Stop'

function Mostrar-Ayuda {
    @'
Uso: scripts\deploy-s3.ps1 <bucket> <distribution_id>

  bucket           nombre del bucket de S3 (sin s3://)
  distribution_id  ID de la distribucion de CloudFront

Requiere AWS CLI configurada (aws sts get-caller-identity) y Node >= 20.
'@
}

if ($Help) { Mostrar-Ayuda; exit 0 }
if ([string]::IsNullOrWhiteSpace($Bucket) -or [string]::IsNullOrWhiteSpace($DistributionId)) {
    Mostrar-Ayuda
    exit 1
}

# Los programas externos no lanzan excepcion al fallar: se revisa el codigo de salida.
function Invocar {
    param([Parameter(Mandatory = $true)][string]$Comando, [string[]]$Argumentos = @())
    & $Comando @Argumentos
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo: $Comando $($Argumentos -join ' ') (codigo $LASTEXITCODE)"
    }
}

$raiz = Split-Path -Parent $PSScriptRoot
Push-Location $raiz
try {
    Write-Host '==> npm ci && npm run build'
    Invocar 'npm' @('ci')
    Invocar 'npm' @('run', 'build')

    Write-Host '==> Subiendo assets con cache larga'
    Invocar 'aws' @('s3', 'sync', 'dist/', "s3://$Bucket", '--delete', '--exclude', 'index.html',
        '--cache-control', 'public,max-age=31536000,immutable')

    Write-Host '==> Subiendo index.html sin cache'
    Invocar 'aws' @('s3', 'cp', 'dist/index.html', "s3://$Bucket/index.html", '--cache-control', 'no-cache')

    # sql.js: el .wasm debe salir con el tipo correcto o el navegador no lo compila en streaming.
    $wasms = @(Get-ChildItem -Path (Join-Path $raiz 'dist/assets') -Filter '*.wasm' -File -ErrorAction SilentlyContinue)
    foreach ($wasm in $wasms) {
        Write-Host "==> Fijando Content-Type de $($wasm.Name)"
        Invocar 'aws' @('s3', 'cp', "dist/assets/$($wasm.Name)", "s3://$Bucket/assets/$($wasm.Name)",
            '--content-type', 'application/wasm', '--cache-control', 'public,max-age=31536000,immutable')
    }

    Write-Host '==> Invalidando CloudFront'
    Invocar 'aws' @('cloudfront', 'create-invalidation', '--distribution-id', $DistributionId, '--paths', '/index.html', '/')
    Write-Host 'Listo.'
}
finally {
    Pop-Location
}
