<#
.SYNOPSIS
    LingStack 鐢熶骇鍙戝竷鑴氭湰 v2 鈥?鏋勫缓 鈫?绛惧悕 鈫?latest.json锛堝惈绛惧悕锛夆啋 SCP涓婁紶 鈫?6閫氶亾鍒嗗彂 鈫?HTTP楠岃瘉
.DESCRIPTION
    涓€绔欏紡鑷姩鍖栧彂甯冿紝褰诲簳鏉滅粷 "signature 涓虹┖" 绫讳汉涓轰簨鏁呫€?
    
    浣跨敤鏂瑰紡锛?
      鏂瑰紡 A锛堝叏鑷姩 鈥?鏋勫缓+绛惧悕+閮ㄧ讲锛?
        .\deploy.ps1 -Version "0.3.2" -Notes "淇 xxx"
    
      鏂瑰紡 B锛堣烦杩囨瀯寤?鈥?鏋勫缓浜х墿宸插瓨鍦級:
        .\deploy.ps1 -Version "0.3.1" -SkipBuild
    
    鍓嶆彁鏉′欢锛?
      1. TAURI_SIGNING_PRIVATE_KEY 鐜鍙橀噺宸茶涓哄瘑閽ュ唴瀹?
      2. TAURI_SIGNING_PRIVATE_KEY_PASSWORD 宸茶涓哄瘑閽ュ彛浠?
      3. 鏈嶅姟鍣?SSH 宸查厤缃厤瀵嗘垨鑴氭湰浼氫氦浜掓彁绀?
    
    绛惧悕瀵嗛挜浣嶇疆: C:\Users\Administrator\.tauri\lingstack.key (348 bytes)
    鍙ｄ护: lingstack2026
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$Notes = "鐏垫爤 LingStack v$Version",
    
    [Parameter(Mandatory=$false)]
    [string]$ServerHost = "103.8.69.194",
    
    [Parameter(Mandatory=$false)]
    [int]$ServerPort = 45543,
    
    [Parameter(Mandatory=$false)]
    [string]$ServerUser = "root",
    
    [Parameter(Mandatory=$false)]
    [string]$RemoteBase = "/home/www/lingstack/updates",
    
    [Parameter(Mandatory=$false)]
    [string]$CdnBase = "https://ai.tadanpay.cn/updates",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# ============ 璺緞 ============
$ProjectRoot = Split-Path -Parent $ScriptDir
$TauriDir    = Join-Path $ProjectRoot "src-tauri"
$NsisDir     = Join-Path $TauriDir "target\release\bundle\nsis"
$RemoteVersionDir = "$RemoteBase/releases/v$Version"

# 棰戦亾鍒楄〃
$Channels = @("releases", "beta", "alpha", "rc", "nightly", "stable-internal")

# ============ 棰滆壊 ============
function Step($n, $total, $msg) { Write-Host "`n[$n/$total] $msg" -ForegroundColor Cyan }
function OK($m) { Write-Host "  OK: $m" -ForegroundColor Green }
function WARN($m) { Write-Host "  WARN: $m" -ForegroundColor Yellow }
function FAIL($m) { Write-Host "  FAIL: $m" -ForegroundColor Red; throw $m }

$TotalSteps = if ($SkipBuild) { 5 } else { 6 }

# ============ Step 1: 鐗堟湰鍙风粺涓€ ============
$step = 1
if (-not $SkipBuild) {
    Step $step $TotalSteps "缁熶竴鐗堟湰鍙?鈫?$Version"
    
    # package.json
    $pkgPath = Join-Path $ProjectRoot "package.json"
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    $pkg.version = $Version
    $pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgPath
    OK "package.json 鈫?$Version"
    
    # tauri.conf.json
    $tcPath = Join-Path $TauriDir "tauri.conf.json"
    $tc = Get-Content $tcPath -Raw | ConvertFrom-Json
    $tc.version = $Version
    $tc | ConvertTo-Json -Depth 10 | Set-Content $tcPath
    OK "tauri.conf.json 鈫?$Version"
    
    # Cargo.toml
    $cargoPath = Join-Path $TauriDir "Cargo.toml"
    $cargo = Get-Content $cargoPath -Raw
    $cargo = $cargo -replace 'version\s*=\s*"[^"]+"', "version = `"$Version`""
    Set-Content $cargoPath $cargo
    OK "Cargo.toml 鈫?$Version"
    
    # app.ts
    $appTs = Join-Path $ProjectRoot "src\shared\constants\app.ts"
    if (Test-Path $appTs) {
        $tsContent = Get-Content $appTs -Raw
        $tsContent = $tsContent -replace 'APP_VERSION\s*=\s*"[^"]+"', "APP_VERSION = `"$Version`""
        Set-Content $appTs $tsContent
        OK "app.ts APP_VERSION 鈫?$Version"
    }
    
    $step++
}

# ============ Step 2: 鏋勫缓 ============
if (-not $SkipBuild) {
    Step $step $TotalSteps "Tauri 鏋勫缓 (vue-tsc + Vite + Cargo + makensis)"
    Push-Location $ProjectRoot
    try {
        & npm run tauri build 2>&1 | Out-Host
        if ($LASTEXITCODE -ne 0) { FAIL "鏋勫缓澶辫触" }
        OK "鏋勫缓瀹屾垚"
    } finally { Pop-Location }
    $step++
}

# ============ Step 3: 瀹氫綅浜х墿 + 璇诲彇绛惧悕 ============
Step $step $TotalSteps "瀹氫綅鏋勫缓浜х墿 & 璇诲彇绛惧悕"

# ASCII 鍒悕浼樺厛
$exeAscii = "lingstack_${Version}_x64_setup.exe"
$exeAsciiPath = Join-Path $NsisDir $exeAscii
$sigAsciiPath = "$exeAsciiPath.sig"

# 涓枃鍘熷悕
$exeChinese = "鐏垫爤 LingStack_${Version}_x64-setup.exe"
$exeChinese2 = "闈堟爤 LingStack_${Version}_x64-setup.exe"
$exeChinesePath = Join-Path $NsisDir $exeChinese
$exeChinesePath2 = Join-Path $NsisDir $exeChinese2

# 纭畾浣跨敤鍝釜
$exePath = $null
$sigPath = $null

if (Test-Path $exeAsciiPath) {
    $exePath = $exeAsciiPath
    $sigPath = $sigAsciiPath
    OK "浣跨敤 ASCII 鍒悕: $exeAscii"
} elseif (Test-Path $exeChinesePath) {
    $exePath = $exeChinesePath
    $sigPath = "$exeChinesePath.sig"
    OK "浣跨敤涓枃鍚? $exeChinese"
} elseif (Test-Path $exeChinesePath2) {
    $exePath = $exeChinesePath2
    $sigPath = "$exeChinesePath2.sig"
    OK "浣跨敤涓枃鍚?: $exeChinese2"
} else {
    WARN "鏈壘鍒板畨瑁呭寘锛屽垪鍑虹洰褰曞唴瀹癸細"
    Get-ChildItem $NsisDir -Filter "*${Version}*" | Select-Object Name, Length
    FAIL "鎵句笉鍒?v$Version 瀹夎鍖?
}

# 璇诲彇绛惧悕
if (-not (Test-Path $sigPath)) {
    FAIL "绛惧悕鏂囦欢涓嶅瓨鍦? $sigPath 鈥?璇风‘璁?Tauri 绛惧悕鐜鍙橀噺宸茶缃?
}
$signature = (Get-Content $sigPath -Raw).Trim()
$sigBytes = [System.Text.Encoding]::UTF8.GetByteCount($signature)
OK "绛惧悕: $sigPath ($sigBytes bytes)"

# 纭鏂囦欢澶у皬
$exeSize = (Get-Item $exePath).Length
OK "EXE: $exePath ($exeSize bytes)"

$step++

# ============ Step 4: 鐢熸垚 latest.json ============
Step $step $TotalSteps "鐢熸垚 latest.json锛堝惈绛惧悕锛?

$pubDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
$safeExeName = $exeAscii  # 寮哄埗浣跨敤 ASCII 鏂囦欢鍚嶄綔涓?URL

$latest = @{
    version   = $Version
    notes     = $Notes
    pub_date  = $pubDate
    platforms = @{
        "windows-x86_64" = @{
            signature = $signature
            url       = "$CdnBase/releases/v$Version/$safeExeName"
        }
    }
} | ConvertTo-Json -Depth 10

# 淇濆瓨鏈湴
$latestPath = Join-Path $ScriptDir "latest.json"
$latest | Set-Content $latestPath -Encoding UTF8 -NoNewline
# 纭繚鏈熬鏈夋崲琛岀锛堟湇鍔″櫒鍙嬪ソ锛?
Add-Content $latestPath ""
OK "latest.json 鈫?$latestPath"
OK "signature 闀垮害: $($signature.Length) chars"
OK "URL: $CdnBase/releases/v$Version/$safeExeName"

$step++

# ============ Step 5: 涓婁紶鍒版湇鍔″櫒 ============
Step $step $TotalSteps "涓婁紶鍒版湇鍔″櫒 $ServerHost`:$ServerPort"

# 5a. 鍒涘缓鐩綍
$sshOpts = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -p $ServerPort"
$sshCmd = "ssh $sshOpts ${ServerUser}@${ServerHost}"

Write-Host "  鍒涘缓杩滅▼鐩綍: $RemoteVersionDir"
Invoke-Expression "$sshCmd 'mkdir -p $RemoteVersionDir'"
OK "杩滅▼鐩綍宸插氨缁?

# 5b. 涓婁紶 EXE
Write-Host "  涓婁紶 EXE ($([Math]::Round($exeSize/1MB, 2)) MB)..."
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -P $ServerPort $exePath "${ServerUser}@${ServerHost}:${RemoteVersionDir}/"
OK "EXE 涓婁紶瀹屾垚"

# 5c. 涓婁紶绛惧悕
Write-Host "  涓婁紶 .sig..."
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -P $ServerPort $sigPath "${ServerUser}@${ServerHost}:${RemoteVersionDir}/"
OK ".sig 涓婁紶瀹屾垚"

# 5d. 涓婁紶 latest.json 鍒扮増鏈洰褰?
Write-Host "  涓婁紶 latest.json 鍒扮増鏈洰褰?.."
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -P $ServerPort $latestPath "${ServerUser}@${ServerHost}:${RemoteVersionDir}/"
OK "latest.json 涓婁紶瀹屾垚"

# 5e. 鍒嗗彂鍒版牴鐩綍 + 6閫氶亾
Write-Host "  鍒嗗彂 latest.json 鍒版牴鐩綍 + $($Channels.Count) 閫氶亾..."
$channelCp = ""
foreach ($ch in $Channels) {
    $channelCp += "cp $RemoteVersionDir/latest.json $RemoteBase/$ch/latest.json; echo `"$ch`: ok`"; "
}
$channelCp += "cp $RemoteVersionDir/latest.json $RemoteBase/latest.json; echo 'root: ok'"
Invoke-Expression "$sshCmd '$channelCp'"
OK "latest.json 宸插垎鍙戝埌鏍圭洰褰?+ 6 閫氶亾"

$step++

# ============ Step 6: HTTP 楠岃瘉 ============
Step $step $TotalSteps "HTTP 楠岃瘉鏇存柊绔偣"

Start-Sleep -Seconds 2  # 绛?Nginx 缂撳瓨杩囨湡

try {
    # 楠岃瘉 latest.json
    $result = Invoke-WebRequest -Uri "$CdnBase/latest.json" -UseBasicParsing -TimeoutSec 15
    if ($result.StatusCode -ne 200) { FAIL "latest.json HTTP $($result.StatusCode)" }
    
    $body = $result.Content | ConvertFrom-Json
    if ($body.version -ne $Version) { FAIL "latest.json 鐗堟湰鍙蜂笉鍖归厤: $($body.version) != $Version" }
    if ([string]::IsNullOrWhiteSpace($body.platforms.'windows-x86_64'.signature)) { FAIL "signature 涓虹┖锛? }
    OK "latest.json 鈫?HTTP 200, version=$Version, signature=$($body.platforms.'windows-x86_64'.signature.Length) chars"

    # 楠岃瘉 EXE 鍙笅杞?
    $exeUrl = "$CdnBase/releases/v$Version/$safeExeName"
    $exeResult = Invoke-WebRequest -Uri $exeUrl -UseBasicParsing -Method Head -TimeoutSec 15
    if ($exeResult.StatusCode -ne 200) { FAIL "EXE 涓嬭浇 HTTP $($exeResult.StatusCode)" }
    $cl = $exeResult.Headers['Content-Length']
    OK "EXE 涓嬭浇 鈫?HTTP 200, Content-Length: $cl bytes"
} catch {
    FAIL "HTTP 楠岃瘉澶辫触: $_"
}

# ============ 瀹屾垚 ============
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  LingStack v$Version 鍙戝竷鎴愬姛锛? -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  鏇存柊婧? $CdnBase/latest.json"
Write-Host "  涓嬭浇:   $CdnBase/releases/v$Version/$safeExeName"
Write-Host "  绛惧悕:   $sigBytes bytes 鉁?
$channelList = $Channels -join ", "
Write-Host "  閫氶亾:   root + $channelList"
Write-Host ""
Write-Host "  瀹㈡埛绔搷浣滐細" -ForegroundColor Yellow
Write-Host "    1. 鎵撳紑 LingStack"
Write-Host "    2. 鍙抽敭椤堕儴鏍囬鏍忔垨妫€鏌ユ洿鏂板叆鍙?
Write-Host "    3. 纭鏄剧ず v$Version"
Write-Host "    4. 鐐瑰嚮鏇存柊"
Write-Host ""
