$ErrorActionPreference = 'Stop'
try {
    $login = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@apotek.com","password":"admin123"}' -SessionVariable s
    Write-Host "LOGIN: $($login.StatusCode)"
    
    $produk = Invoke-WebRequest -Uri "http://localhost:3000/api/produk" -WebSession $s -UseBasicParsing
    $pd = $produk.Content | ConvertFrom-Json
    Write-Host "PRODUK OK: $($pd.success) COUNT: $($pd.data.Count)"
    
    $apotek = Invoke-WebRequest -Uri "http://localhost:3000/api/apotek" -WebSession $s -UseBasicParsing
    $ad = $apotek.Content | ConvertFrom-Json
    Write-Host "APOTEK OK: $($ad.success) COUNT: $($ad.data.Count)"
    
    if ($pd.data.Count -gt 0 -and $ad.data.Count -gt 0) {
        $pid = $pd.data[0].id
        $aid = $ad.data[0].id
        Write-Host "Testing POST with produkId=$pid apotekId=$aid"
        
        $returBody = @{ apotekId=$aid; produkId=$pid; jumlah=1; keterangan="test"; tanggal="2026-08-18" } | ConvertTo-Json
        $retur = Invoke-WebRequest -Uri "http://localhost:3000/api/retur" -Method POST -ContentType "application/json" -Body $returBody -WebSession $s -UseBasicParsing
        Write-Host "RETUR POST: $($retur.StatusCode) $($retur.Content)"
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "STACK: $($_.ScriptStackTrace)"
}
