# Iniciar AgriJunín - Backend + Frontend
Write-Host "=== Agricultura Inteligente Junin ===" -ForegroundColor Green

# Liberar puertos si estan ocupados por instancias previas
foreach ($port in 3000, 4200) {
  $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "Puerto $port liberado"
  }
}

Start-Sleep -Seconds 1

# Ejecutar desde D:\agri-junin (sin '%' en la ruta; Vite/Angular fallan con PROYECTO-80%-ING-WEB)
$projectRoot = if (Test-Path 'D:\agri-junin\backend') { 'D:\agri-junin' } else { $PSScriptRoot }

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; npm run dev"
Write-Host "Backend iniciando en http://localhost:3000"

Start-Sleep -Seconds 3

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npx ng serve --host 127.0.0.1 --port 4200 --open"
Write-Host "Frontend iniciando en http://127.0.0.1:4200"
Write-Host ""
Write-Host "Login: admin@agrijunin.pe / Admin123!" -ForegroundColor Cyan
