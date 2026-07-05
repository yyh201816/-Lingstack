<#
.SYNOPSIS
    LingStack 生产发布脚本 v2 — 构建 → 签名 → latest.json（含签名）→ SCP上传 → 6通道分发 → HTTP验证
.DESCRIPTION
    一站式自动化发布，彻底杜绝 "signature 为空" 类人为事故。
    
    使用方式：
      方式 A（全自动 — 构建+签名+部署）:
        .\deploy.ps1 -Version "0.3.2" -Notes "修复 xxx"
    
      方式 B（跳过构建 — 构建产物已存在）:
        .\deploy.ps1 -Version "0.3.1" -SkipBuild
    
    前提条件：
      1. TAURI_SIGNING_PRIVATE_KEY 环境变量已设为密钥内容
      2. TAURI_SIGNING_PRIVATE_KEY_PASSWORD 已设为密钥口令
      3. 服务器 SSH 已配置免密或脚本会交互提示
    
    签名密钥位置: C:\Users\Administrator\.tauri\lingstack.key (348 bytes)
    口令: lingstack2026
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$Notes = "灵栈 LingStack v$Version",
    
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

# ============ 路径 ============
$ProjectRoot = Split-Path -Parent $ScriptDir
$TauriDir    = Join-Path $ProjectRoot "src-tauri"
$NsisDir     = Join-Path $TauriDir "target\release\bundle\nsis"
$RemoteVersionDir = "$RemoteBase/releases/v$Version"

# 频道列表
$Channels = @("releases", "beta", "alpha", "rc", "nightly", "stable-internal")

# ============ 颜色 ============
function Step($n, $total, $msg) { Write-Host "`n[$n/$total] $msg" -ForegroundColor Cyan }
function OK($m) { Write-Host "  OK: $m" -ForegroundColor Green }
function WARN($m) { Write-Host "  WARN: $m" -ForegroundColor Yellow }
function FAIL($m) { Write-Host "  FAIL: $m" -ForegroundColor Red; throw $m }

$TotalSteps = if ($SkipBuild) { 5 } else { 6 }

# ============ Step 1: 版本号统一 ============
$step = 1
if (-not $SkipBuild) {
    Step $step $TotalSteps "统一版本号 → $Version"
    
    # package.json
    $pkgPath = Join-Path $ProjectRoot "package.json"
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    $pkg.version = $Version
    $pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgPath
    OK "package.json → $Version"
    
    # tauri.conf.json
    $tcPath = Join-Path $TauriDir "tauri.conf.json"
    $tc = Get-Content $tcPath -Raw | ConvertFrom-Json
    $tc.version = $Version
    $tc | ConvertTo-Json -Depth 10 | Set-Content $tcPath
    OK "tauri.conf.json → $Version"
    
    # Cargo.toml
    $cargoPath = Join-Path $TauriDir "Cargo.toml"
    $cargo = Get-Content $cargoPath -Raw
    $cargo = $cargo -replace 'version\s*=\s*"[^"]+"', "version = `"$Version`""
    Set-Content $cargoPath $cargo
    OK "Cargo.toml → $Version"
    
    # app.ts
    $appTs = Join-Path $ProjectRoot "src\shared\constants\app.ts"
    if (Test-Path $appTs) {
        $tsContent = Get-Content $appTs -Raw
        $tsContent = $tsContent -replace 'APP_VERSION\s*=\s*"[^"]+"', "APP_VERSION = `"$Version`""
        Set-Content $appTs $tsContent
        OK "app.ts APP_VERSION → $Version"
    }
    
    $step++
}

# ============ Step 2: 构建 ============
if (-not $SkipBuild) {
    Step $step $TotalSteps "Tauri 构建 (vue-tsc + Vite + Cargo + makensis)"
    Push-Location $ProjectRoot
    try {
        & npm run tauri build 2>&1 | Out-Host
        if ($LASTEXITCODE -ne 0) { FAIL "构建失败" }
        OK "构建完成"
    } finally { Pop-Location }
    $step++
}

# ============ Step 3: 定位产物 + 读取签名 ============
Step $step $TotalSteps "定位构建产物 & 读取签名"

# ASCII 别名优先
$exeAscii = "lingstack_${Version}_x64_setup.exe"
$exeAsciiPath = Join-Path $NsisDir $exeAscii
$sigAsciiPath = "$exeAsciiPath.sig"

# 中文原名
$exeChinese = "灵栈 LingStack_${Version}_x64-setup.exe"
$exeChinese2 = "靈栈 LingStack_${Version}_x64-setup.exe"
$exeChinesePath = Join-Path $NsisDir $exeChinese
$exeChinesePath2 = Join-Path $NsisDir $exeChinese2

# 确定使用哪个
$exePath = $null
$sigPath = $null

if (Test-Path $exeAsciiPath) {
    $exePath = $exeAsciiPath
    $sigPath = $sigAsciiPath
    OK "使用 ASCII 别名: $exeAscii"
} elseif (Test-Path $exeChinesePath) {
    $exePath = $exeChinesePath
    $sigPath = "$exeChinesePath.sig"
    OK "使用中文名: $exeChinese"
} elseif (Test-Path $exeChinesePath2) {
    $exePath = $exeChinesePath2
    $sigPath = "$exeChinesePath2.sig"
    OK "使用中文名2: $exeChinese2"
} else {
    WARN "未找到安装包，列出目录内容："
    Get-ChildItem $NsisDir -Filter "*${Version}*" | Select-Object Name, Length
    FAIL "找不到 v$Version 安装包"
}

# 读取签名
if (-not (Test-Path $sigPath)) {
    FAIL "签名文件不存在: $sigPath — 请确认 Tauri 签名环境变量已设置"
}
$signature = (Get-Content $sigPath -Raw).Trim()
$sigBytes = [System.Text.Encoding]::UTF8.GetByteCount($signature)
OK "签名: $sigPath ($sigBytes bytes)"

# 确认文件大小
$exeSize = (Get-Item $exePath).Length
OK "EXE: $exePath ($exeSize bytes)"

$step++

# ============ Step 4: 生成 latest.json ============
Step $step $TotalSteps "生成 latest.json（含签名）"

$pubDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
$safeExeName = $exeAscii  # 强制使用 ASCII 文件名作为 URL

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

# 保存本地
$latestPath = Join-Path $ScriptDir "latest.json"
$latest | Set-Content $latestPath -Encoding UTF8 -NoNewline
# 确保末尾有换行符（服务器友好）
Add-Content $latestPath ""
OK "latest.json → $latestPath"
OK "signature 长度: $($signature.Length) chars"
OK "URL: $CdnBase/releases/v$Version/$safeExeName"

$step++

# ============ Step 5: 上传到服务器 ============
Step $step $TotalSteps "上传到服务器 $ServerHost`:$ServerPort"

# 5a. 创建目录
$sshOpts = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -p $ServerPort"
$sshCmd = "ssh $sshOpts ${ServerUser}@${ServerHost}"

Write-Host "  创建远程目录: $RemoteVersionDir"
Invoke-Expression "$sshCmd 'mkdir -p $RemoteVersionDir'"
OK "远程目录已就绪"

# 5b. 上传 EXE
Write-Host "  上传 EXE ($([Math]::Round($exeSize/1MB, 2)) MB)..."
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -P $ServerPort $exePath "${ServerUser}@${ServerHost}:${RemoteVersionDir}/"
OK "EXE 上传完成"

# 5c. 上传签名
Write-Host "  上传 .sig..."
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -P $ServerPort $sigPath "${ServerUser}@${ServerHost}:${RemoteVersionDir}/"
OK ".sig 上传完成"

# 5d. 上传 latest.json 到版本目录
Write-Host "  上传 latest.json 到版本目录..."
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -P $ServerPort $latestPath "${ServerUser}@${ServerHost}:${RemoteVersionDir}/"
OK "latest.json 上传完成"

# 5e. 分发到根目录 + 6通道
Write-Host "  分发 latest.json 到根目录 + $($Channels.Count) 通道..."
$channelCp = ""
foreach ($ch in $Channels) {
    $channelCp += "cp $RemoteVersionDir/latest.json $RemoteBase/$ch/latest.json; echo '$ch: ok'; "
}
$channelCp += "cp $RemoteVersionDir/latest.json $RemoteBase/latest.json; echo 'root: ok'"
Invoke-Expression "$sshCmd '$channelCp'"
OK "latest.json 已分发到根目录 + 6 通道"

$step++

# ============ Step 6: HTTP 验证 ============
Step $step $TotalSteps "HTTP 验证更新端点"

Start-Sleep -Seconds 2  # 等 Nginx 缓存过期

try {
    # 验证 latest.json
    $result = Invoke-WebRequest -Uri "$CdnBase/latest.json" -UseBasicParsing -TimeoutSec 15
    if ($result.StatusCode -ne 200) { FAIL "latest.json HTTP $($result.StatusCode)" }
    
    $body = $result.Content | ConvertFrom-Json
    if ($body.version -ne $Version) { FAIL "latest.json 版本号不匹配: $($body.version) != $Version" }
    if ([string]::IsNullOrWhiteSpace($body.platforms.'windows-x86_64'.signature)) { FAIL "signature 为空！" }
    OK "latest.json → HTTP 200, version=$Version, signature=$($body.platforms.'windows-x86_64'.signature.Length) chars"

    # 验证 EXE 可下载
    $exeUrl = "$CdnBase/releases/v$Version/$safeExeName"
    $exeResult = Invoke-WebRequest -Uri $exeUrl -UseBasicParsing -Method Head -TimeoutSec 15
    if ($exeResult.StatusCode -ne 200) { FAIL "EXE 下载 HTTP $($exeResult.StatusCode)" }
    $cl = $exeResult.Headers['Content-Length']
    OK "EXE 下载 → HTTP 200, Content-Length: $cl bytes"
} catch {
    FAIL "HTTP 验证失败: $_"
}

# ============ 完成 ============
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  LingStack v$Version 发布成功！" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  更新源: $CdnBase/latest.json"
Write-Host "  下载:   $CdnBase/releases/v$Version/$safeExeName"
Write-Host "  签名:   $sigBytes bytes ✅"
Write-Host "  通道:   root + $($Channels -join ', ')"
Write-Host ""
Write-Host "  客户端操作：" -ForegroundColor Yellow
Write-Host "    1. 打开 LingStack"
Write-Host "    2. 右键顶部标题栏或检查更新入口"
Write-Host "    3. 确认显示 v$Version"
Write-Host "    4. 点击更新"
Write-Host ""
