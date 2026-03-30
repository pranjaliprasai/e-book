# restart-tunnels.ps1
# This script restarts the Backend, Unified Gateway, and Ngrok Tunnel for SmartShelf.

Write-Host "--- Stopping Existing Services ---" -ForegroundColor Yellow

# Kill existing processes if running
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match "server.js" -or $_.CommandLine -match "server.js" -or $_.CommandLine -match "gateway.js" } | Stop-Process -Force
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force

Start-Sleep -Seconds 2

Write-Host "--- Starting Backend Server (Port 5000) ---" -ForegroundColor Green
$backendServer = Resolve-Path "$PSScriptRoot/../server.js"
Start-Process node -ArgumentList "`"$backendServer`"" -WindowStyle Minimized

Write-Host "--- Starting Unified Gateway (Port 9999) ---" -ForegroundColor Green
$gatewayScript = Resolve-Path "$PSScriptRoot/../../gateway.js"
Start-Process node -ArgumentList "`"$gatewayScript`"" -WindowStyle Minimized

Write-Host "--- Starting Ngrok Tunnels ---" -ForegroundColor Green
# Start ngrok using the config file in the root
$ngrokConfig = Resolve-Path "../../ngrok.yml" -ErrorAction SilentlyContinue
if ($ngrokConfig) {
    # Using 'powershell -Command ngrok' ensures it handles the .ps1 alias correctly
    Start-Process powershell -ArgumentList "-NoProfile -Command ngrok start --config `"$ngrokConfig`" --all" -WindowStyle Minimized
} else {
    Write-Host "Warning: ngrok.yml not found. Starting default api tunnel..." -ForegroundColor Red
    Start-Process powershell -ArgumentList "-NoProfile -Command ngrok http 5000 --hostname cresyl-regina-nonfacetiously.ngrok-free.dev" -WindowStyle Minimized
}

Write-Host "--- All Services restarted! ---" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000"
Write-Host "Gateway: http://localhost:9999"
Write-Host "Ngrok API: https://cresyl-regina-nonfacetiously.ngrok-free.dev/api"
Write-Host "-------------------------------"
