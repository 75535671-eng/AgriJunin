# Verificacion integral AgriJunin — backend + APIs criticas
$ErrorActionPreference = "Stop"
$base = "http://localhost:3000/api"
$failed = @()
$passed = 0

function Test-Api {
  param([string]$Name, [scriptblock]$Action)
  try {
    & $Action
    Write-Host "[OK] $Name" -ForegroundColor Green
    $script:passed++
  } catch {
    Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
    $script:failed += $Name
  }
}

Write-Host "=== Verificando AgriJunin ===" -ForegroundColor Cyan

Test-Api "Health + MySQL" {
  $h = Invoke-RestMethod -Uri "$base/health" -TimeoutSec 10
  if (-not $h.data.database) { throw "MySQL no conectado" }
}

Test-Api "Login admin" {
  $script:login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post `
    -Body '{"email":"admin@agrijunin.pe","password":"Admin123!"}' -ContentType "application/json"
  if (-not $script:login.data.token) { throw "Sin token" }
  $script:headers = @{ Authorization = "Bearer $($script:login.data.token)" }
}

Test-Api "Login agricultor DNI" {
  $a = Invoke-RestMethod -Uri "$base/auth/login" -Method Post `
    -Body '{"dni":"45218763","password":"Admin123!"}' -ContentType "application/json"
  if (-not $a.data.token) { throw "Sin token agricultor" }
}

Test-Api "Profile" {
  Invoke-RestMethod -Uri "$base/auth/profile" -Headers $script:headers | Out-Null
}

Test-Api "Dashboard + clima" {
  $d = Invoke-RestMethod -Uri "$base/dashboard/stats" -Headers $script:headers
  if ($null -eq $d.data.climaHuancayo.actual.temperatura) { throw "Clima dashboard vacio" }
}

Test-Api "Clima Huancayo" {
  $c = Invoke-RestMethod -Uri "$base/clima/huancayo" -Headers $script:headers
  if (-not $c.data.ubicacion.ciudad) { throw "Estructura clima incorrecta" }
  if ($c.data.pronosticoDiario.Count -lt 1) { throw "Sin pronostico diario" }
}

Test-Api "Plantas buscar" {
  $p = Invoke-RestMethod -Uri "$base/plantas/buscar?q=papa" -Headers $script:headers
  if ($p.data.resultados.Count -lt 1) { throw "Sin resultados plantas" }
}

Test-Api "Maps config" {
  $m = Invoke-RestMethod -Uri "$base/maps/config" -Headers $script:headers
  if (-not $m.data.centro.lat) { throw "Sin centro mapa" }
}

Test-Api "Maps geocode" {
  $geoUrl = "$base/maps/geocode?lat=-12.0464" + "&lng=-75.3232"
  $g = Invoke-RestMethod -Uri $geoUrl -Headers $script:headers
  if (-not $g.data.direccion) { throw "Sin direccion" }
}

Test-Api "CRUD listados" {
  foreach ($ep in @("agricultores","cultivos","lotes","sensores","registros","alertas")) {
    $r = Invoke-RestMethod -Uri "$base/$ep`?limit=5" -Headers $script:headers
    if (-not $r.success) { throw "Fallo en $ep" }
  }
}

Test-Api "Clima sincronizar" {
  $s = Invoke-RestMethod -Uri "$base/clima/sincronizar" -Method Post `
    -Body '{"lote_id":1}' -ContentType "application/json" -Headers $script:headers
  if (-not $s.data.sincronizacion.registro_id) { throw "Sync sin registro" }
}

Write-Host ""
if ($failed.Count -eq 0) {
  Write-Host "Resultado: $passed pruebas OK - Sistema 100% funcional" -ForegroundColor Green
  exit 0
} else {
  Write-Host "Resultado: $passed OK, $($failed.Count) fallos: $($failed -join ', ')" -ForegroundColor Red
  exit 1
}
