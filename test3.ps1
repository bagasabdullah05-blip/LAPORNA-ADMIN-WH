$ErrorActionPreference = 'Continue'
$loginResp = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@apotek.com","password":"admin123"}' -SessionVariable s -ErrorAction SilentlyContinue

$produkResp = Invoke-WebRequest -Uri "http://localhost:3000/api/produk" -WebSession $s -UseBasicParsing -ErrorAction SilentlyContinue
$produkData = ($produkResp.Content | ConvertFrom-Json).data
$apid = $produkData[0].id

$apotekResp = Invoke-WebRequest -Uri "http://localhost:3000/api/apotek" -WebSession $s -UseBasicParsing -ErrorAction SilentlyContinue
$apotekData = ($apotekResp.Content | ConvertFrom-Json).data
$aid = $apotekData[0].id

Write-Host "produkId=$apid apotekId=$aid"

# Test retur
$returBody = @{ apotekId=$aid; produkId=$apid; jumlah=1; keterangan="test retur"; tanggal="2026-08-18" } | ConvertTo-Json
Write-Host "RETUR BODY: $returBody"
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000/api/retur" -Method POST -ContentType "application/json" -Body $returBody -WebSession $s -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
    Write-Host "RETUR OK: $($r.StatusCode) $($r.Content)"
} catch {
    $errStream = $_.Exception.Response.GetResponseStream()
    if ($errStream) {
        $reader = [System.IO.StreamReader]::new($errStream)
        Write-Host "RETUR ERR: $($reader.ReadToEnd())"
    } else {
        Write-Host "RETUR ERR: $($_.Exception.Message)"
    }
}

# Test opname
$opnameBody = @{ tipe="GUDANG"; produkId=$apid; stokFisik=10; keterangan="test opname"; tanggal="2026-08-18" } | ConvertTo-Json
Write-Host "OPNAME BODY: $opnameBody"
try {
    $r2 = Invoke-WebRequest -Uri "http://localhost:3000/api/opname" -Method POST -ContentType "application/json" -Body $opnameBody -WebSession $s -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
    Write-Host "OPNAME OK: $($r2.StatusCode) $($r2.Content)"
} catch {
    $errStream = $_.Exception.Response.GetResponseStream()
    if ($errStream) {
        $reader = [System.IO.StreamReader]::new($errStream)
        Write-Host "OPNAME ERR: $($reader.ReadToEnd())"
    } else {
        Write-Host "OPNAME ERR: $($_.Exception.Message)"
    }
}
