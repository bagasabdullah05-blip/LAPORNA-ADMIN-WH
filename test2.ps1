$ErrorActionPreference = 'Continue'

# Login
$loginResp = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@apotek.com","password":"admin123"}' -SessionVariable s -ErrorAction Stop
Write-Host "LOGIN: $($loginResp.Content)"

# Test GET produk
$produkResp = Invoke-WebRequest -Uri "http://localhost:3000/api/produk" -WebSession $s -UseBasicParsing -ErrorAction Stop
$produkData = $produkResp.Content | ConvertFrom-Json
Write-Host "PRODUK: success=$($produkData.success) count=$($produkData.data.Count)"
$pid = $produkData.data[0].id
$pnama = $produkData.data[0].nama
Write-Host "First produk: $pnama ($pid)"

# Test GET apotek
$apotekResp = Invoke-WebRequest -Uri "http://localhost:3000/api/apotek" -WebSession $s -UseBasicParsing -ErrorAction Stop
$apotekData = $apotekResp.Content | ConvertFrom-Json
Write-Host "APOTEK: success=$($apotekData.success) count=$($apotekData.data.Count)"
$aid = $apotekData.data[0].id
$anama = $apotekData.data[0].nama
Write-Host "First apotek: $anama ($aid)"

# Test POST retur
$returBody = @{ apotekId=$aid; produkId=$pid; jumlah=1; keterangan="test dari script"; tanggal="2026-08-18" } | ConvertTo-Json
Write-Host "RETUR BODY: $returBody"
try {
    $returResp = Invoke-WebRequest -Uri "http://localhost:3000/api/retur" -Method POST -ContentType "application/json" -Body $returBody -WebSession $s -UseBasicParsing -ErrorAction Stop
    Write-Host "RETUR: $($returResp.StatusCode) $($returResp.Content)"
} catch {
    Write-Host "RETUR ERROR: $($_.Exception.Response.StatusCode.value__) $($_.Exception.Response.StatusDescription)"
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "RETUR BODY: $($reader.ReadToEnd())"
}

# Test POST opname
$opnameBody = @{ tipe="GUDANG"; produkId=$pid; stokFisik=10; keterangan="test opname"; tanggal="2026-08-18" } | ConvertTo-Json
Write-Host "OPNAME BODY: $opnameBody"
try {
    $opnameResp = Invoke-WebRequest -Uri "http://localhost:3000/api/opname" -Method POST -ContentType "application/json" -Body $opnameBody -WebSession $s -UseBasicParsing -ErrorAction Stop
    Write-Host "OPNAME: $($opnameResp.StatusCode) $($opnameResp.Content)"
} catch {
    Write-Host "OPNAME ERROR: $($_.Exception.Response.StatusCode.value__) $($_.Exception.Response.StatusDescription)"
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host "OPNAME BODY: $($reader.ReadToEnd())"
}
