# 마이 튜브 실행 스크립트 (바탕화면 아이콘이 이 파일을 실행합니다)
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try { $Host.UI.RawUI.WindowTitle = '마이 튜브' } catch {}

$proj = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $proj
$url = 'http://localhost:8081'

function Test-AppServer {
    param([string]$Url)
    try { Invoke-WebRequest -Uri $Url -TimeoutSec 3 -UseBasicParsing | Out-Null; return $true }
    catch { return $false }
}

Write-Host ''
Write-Host '  ========================================' -ForegroundColor DarkGray
Write-Host '     마이 튜브  -  내 유튜브 구독 정리' -ForegroundColor White
Write-Host '  ========================================' -ForegroundColor DarkGray
Write-Host ''

# 이미 켜져 있으면 브라우저만 열고 끝낸다
if (Test-AppServer -Url $url) {
    Write-Host '  이미 실행 중입니다. 브라우저를 엽니다...' -ForegroundColor Green
    Start-Process $url
    Start-Sleep -Seconds 2
    exit
}

# 최초 1회 의존성 설치
if (-not (Test-Path (Join-Path $proj 'node_modules'))) {
    Write-Host '  최초 1회 준비 작업을 진행합니다 (몇 분 걸릴 수 있어요)...' -ForegroundColor Yellow
    & npm install
    Write-Host ''
}

Write-Host '  앱을 시작합니다. 준비되면 브라우저가 자동으로 열립니다.' -ForegroundColor Cyan
Write-Host '  처음 실행은 1~2분 걸릴 수 있어요. 잠시만 기다려 주세요.' -ForegroundColor DarkGray
Write-Host ''
Write-Host '  [ 이 창을 닫으면 앱이 종료됩니다 ]' -ForegroundColor Yellow
Write-Host ''

# 서버가 준비되는 순간 브라우저를 한 번 열어주는 감시자
$watcher = Start-Job -ScriptBlock {
    param($u)
    for ($i = 0; $i -lt 150; $i++) {
        try {
            Invoke-WebRequest -Uri $u -TimeoutSec 3 -UseBasicParsing | Out-Null
            Start-Process $u
            break
        } catch { Start-Sleep -Seconds 3 }
    }
} -ArgumentList $url

# 개발 서버 실행 (창을 닫을 때까지 계속 돌아감)
& npm run web

try {
    Stop-Job $watcher -ErrorAction SilentlyContinue
    Remove-Job $watcher -Force -ErrorAction SilentlyContinue
} catch {}

Write-Host ''
Write-Host '  앱이 종료되었습니다.' -ForegroundColor DarkGray
Read-Host '  엔터 키를 누르면 창이 닫힙니다'
