# Iniciar AgriJunín - FastAPI + Frontend
Write-Host "=== Agricultura Inteligente Junin ===" -ForegroundColor Green

foreach ($port in 3000, 4200) {
  $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "Puerto $port liberado"
  }
}

Start-Sleep -Seconds 1

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; uvicorn app.main:app --reload --host 0.0.0.0 --port 3000"
Write-Host "Backend (FastAPI) en http://localhost:3000/api"

Start-Sleep -Seconds 3

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npx ng serve --open"
Write-Host "Frontend en http://localhost:4200"
Write-Host ""
Write-Host "Login: admin@agrijunin.pe / Admin123!" -ForegroundColor Cyan
