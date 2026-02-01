# Free port 5000 (kill process using it). Run in PowerShell.
$conn = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) {
  Stop-Process -Id $conn.OwningProcess -Force
  Write-Host "Stopped process on port 5000 (PID $($conn.OwningProcess)). You can run: npm start"
} else {
  Write-Host "No process found on port 5000."
}
